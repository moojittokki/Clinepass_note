import { RequestUrlParam, requestUrl } from 'obsidian'

import { CLINEPASS_API_BASE_URL } from '../../constants'
import { ChatModel } from '../../types/chat-model.types'

import { ClinePassProvider } from './clinePassProvider'
import {
  LLMAPIKeyInvalidException,
  LLMAPIKeyNotSetException,
  LLMRateLimitExceededException,
} from './exception'

const mockRequestUrl = jest.mocked(requestUrl)

const makeModel = (): ChatModel => ({
  providerType: 'cline-pass',
  providerId: 'cline-pass',
  id: 'cline-pass/kimi-k3',
  model: 'cline-pass/kimi-k3',
})

const makeProvider = (overrides: Record<string, string> = {}) =>
  new ClinePassProvider({
    type: 'cline-pass',
    id: 'cline-pass',
    apiKey: 'test-key',
    ...overrides,
  })

const makeApiResponse = (overrides: Record<string, unknown> = {}) => ({
  status: 200,
  headers: {},
  arrayBuffer: new ArrayBuffer(0),
  text: JSON.stringify({}),
  json: {
    id: 'gen-1',
    created: 1,
    model: 'cline-pass/kimi-k3',
    object: 'chat.completion',
    choices: [
      {
        finish_reason: 'stop',
        index: 0,
        message: {
          role: 'assistant',
          content: 'Paris is the capital of France.',
          reasoning: 'The user asks about France.',
        },
      },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  },
  ...overrides,
})

const getRequest = (index = 0): RequestUrlParam =>
  mockRequestUrl.mock.calls[index][0] as RequestUrlParam

const getRequestBody = (): Record<string, unknown> =>
  JSON.parse(getRequest().body as string) as Record<string, unknown>

describe('ClinePassProvider', () => {
  beforeEach(() => {
    mockRequestUrl.mockReset()
  })

  it('throws a readable error and skips the request when the API key is missing', async () => {
    const provider = new ClinePassProvider({
      type: 'cline-pass',
      id: 'cline-pass',
    })

    await expect(
      provider.streamResponse(makeModel(), {
        model: 'cline-pass/kimi-k3',
        messages: [{ role: 'user', content: 'hi' }],
        stream: true,
      }),
    ).rejects.toBeInstanceOf(LLMAPIKeyNotSetException)
    expect(mockRequestUrl).not.toHaveBeenCalled()
  })

  it('calls the Cline API through requestUrl with the required headers', async () => {
    mockRequestUrl.mockResolvedValue(makeApiResponse() as never)

    const response = await makeProvider().generateResponse(makeModel(), {
      model: 'cline-pass/kimi-k3',
      messages: [{ role: 'user', content: 'Capital of France?' }],
    })

    const request = getRequest()
    expect(request.url).toBe(`${CLINEPASS_API_BASE_URL}/chat/completions`)
    expect(request.method).toBe('POST')
    expect(request.headers).toMatchObject({
      Authorization: 'Bearer test-key',
      'X-Response-Format': 'openai',
    })
    expect(getRequestBody()).toMatchObject({
      model: 'cline-pass/kimi-k3',
      stream: false,
    })
    expect(response.choices[0].message.content).toBe(
      'Paris is the capital of France.',
    )
    expect(response.choices[0].message.reasoning).toBe(
      'The user asks about France.',
    )
  })

  it('merges consecutive same-role messages before sending', async () => {
    mockRequestUrl.mockResolvedValue(makeApiResponse() as never)

    await makeProvider().generateResponse(makeModel(), {
      model: 'cline-pass/kimi-k3',
      messages: [
        { role: 'system', content: 'be brief' },
        { role: 'user', content: 'first' },
        { role: 'user', content: 'second' },
      ],
    })

    expect(getRequestBody().messages).toEqual([
      { role: 'system', content: 'be brief' },
      { role: 'user', content: 'first\n\nsecond' },
    ])
  })

  it('trims trailing slashes from a custom base URL', async () => {
    mockRequestUrl.mockResolvedValue(makeApiResponse() as never)

    await makeProvider({
      baseUrl: 'https://proxy.example.com/api/v1///',
    }).generateResponse(makeModel(), {
      model: 'cline-pass/kimi-k3',
      messages: [{ role: 'user', content: 'hi' }],
    })

    expect(getRequest().url).toBe(
      'https://proxy.example.com/api/v1/chat/completions',
    )
  })

  it('maps 401 responses to an invalid API key exception', async () => {
    mockRequestUrl.mockResolvedValue(
      makeApiResponse({
        status: 401,
        json: { error: { message: 'invalid api key' } },
      }) as never,
    )

    await expect(
      makeProvider().generateResponse(makeModel(), {
        model: 'cline-pass/kimi-k3',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    ).rejects.toBeInstanceOf(LLMAPIKeyInvalidException)
  })

  it('maps 429 responses to a rate limit exception', async () => {
    mockRequestUrl.mockResolvedValue(
      makeApiResponse({ status: 429, json: { message: 'slow down' } }) as never,
    )

    await expect(
      makeProvider().generateResponse(makeModel(), {
        model: 'cline-pass/kimi-k3',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    ).rejects.toBeInstanceOf(LLMRateLimitExceededException)
  })

  it('replays a non-streaming response as reasoning/content chunks', async () => {
    mockRequestUrl.mockResolvedValue(makeApiResponse() as never)

    const stream = await makeProvider().streamResponse(makeModel(), {
      model: 'cline-pass/kimi-k3',
      messages: [{ role: 'user', content: 'hi' }],
      stream: true,
    })

    const deltas: {
      content?: string | null
      reasoning?: string | null
    }[] = []
    let finishReason: string | null = null
    let usage: unknown
    for await (const chunk of stream) {
      deltas.push(chunk.choices[0].delta)
      finishReason = chunk.choices[0].finish_reason ?? finishReason
      usage = chunk.usage ?? usage
    }

    expect(deltas.map((d) => d.reasoning ?? '').join('')).toBe(
      'The user asks about France.',
    )
    expect(deltas.map((d) => d.content ?? '').join('')).toBe(
      'Paris is the capital of France.',
    )
    expect(finishReason).toBe('stop')
    expect(usage).toMatchObject({ total_tokens: 15 })
  })

  it('emits tool calls with synthesized indices', async () => {
    mockRequestUrl.mockResolvedValue(
      makeApiResponse({
        json: {
          id: 'gen-tool',
          created: 1,
          model: 'cline-pass/kimi-k3',
          object: 'chat.completion',
          choices: [
            {
              finish_reason: 'tool_calls',
              index: 0,
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [
                  {
                    id: 'call_1',
                    type: 'function',
                    function: {
                      name: 'read_file',
                      arguments: '{"path":"a.md"}',
                    },
                  },
                  {
                    id: 'call_2',
                    type: 'function',
                    function: {
                      name: 'read_file',
                      arguments: '{"path":"b.md"}',
                    },
                  },
                ],
              },
            },
          ],
        },
      }) as never,
    )

    const stream = await makeProvider().streamResponse(makeModel(), {
      model: 'cline-pass/kimi-k3',
      messages: [{ role: 'user', content: 'read both files' }],
      stream: true,
    })

    const toolCalls: { index: number; id?: string }[] = []
    for await (const chunk of stream) {
      toolCalls.push(...(chunk.choices[0].delta.tool_calls ?? []))
    }

    expect(toolCalls).toHaveLength(2)
    expect(toolCalls[0]).toMatchObject({ index: 0, id: 'call_1' })
    expect(toolCalls[1]).toMatchObject({ index: 1, id: 'call_2' })
  })

  it('rejects embedding requests with a helpful message', async () => {
    await expect(makeProvider().getEmbedding()).rejects.toThrow(/embeddings/i)
  })
})
