import { RequestUrlResponse, requestUrl } from 'obsidian'

import { CLINEPASS_API_BASE_URL } from '../../constants'
import { ChatModel } from '../../types/chat-model.types'
import {
  LLMOptions,
  LLMRequestNonStreaming,
  LLMRequestStreaming,
} from '../../types/llm/request'
import {
  LLMResponseNonStreaming,
  LLMResponseStreaming,
  ToolCall,
} from '../../types/llm/response'
import { LLMProvider } from '../../types/provider.types'
import { formatMessages } from '../../utils/llm/request'

import { BaseLLMProvider } from './base'
import { ClinePassMessageAdapter } from './clinePassMessageAdapter'
import {
  LLMAPIKeyInvalidException,
  LLMAPIKeyNotSetException,
  LLMRateLimitExceededException,
} from './exception'

const SIMULATED_CHUNK_SIZE = 32
const SIMULATED_CHUNK_DELAY_MS = 8

/**
 * ClinePass provider.
 *
 * ClinePass is a flat-rate Cline subscription that is consumed through the
 * OpenAI-compatible Cline API:
 *
 *   POST https://api.cline.bot/api/v1/chat/completions
 *   Authorization: Bearer <Cline API key>
 *   X-Response-Format: openai  (required for the standard OpenAI response shape)
 *
 * Important: `api.cline.bot` does not send `Access-Control-Allow-Origin`
 * headers, so browser-based `fetch` (used by the OpenAI SDK) is blocked inside
 * Obsidian's Electron/Capacitor renderer. This provider therefore uses
 * Obsidian's `requestUrl`, which performs a native HTTP request without CORS
 * restrictions. `requestUrl` cannot consume Server-Sent Events, so responses are
 * fetched in one piece and replayed as simulated chunks for progressive
 * rendering, including reasoning deltas and tool calls.
 *
 * Only chat completions are supported: the Cline API has no `/embeddings`
 * endpoint, so vault search (RAG) still needs a separate embedding provider
 * such as Ollama, LM Studio or OpenAI.
 */
export class ClinePassProvider extends BaseLLMProvider<
  Extract<LLMProvider, { type: 'cline-pass' }>
> {
  private adapter: ClinePassMessageAdapter

  constructor(provider: Extract<LLMProvider, { type: 'cline-pass' }>) {
    super(provider)
    this.adapter = new ClinePassMessageAdapter()
  }

  private getBaseUrl(): string {
    const baseUrl = this.provider.baseUrl?.trim()
    return (baseUrl ? baseUrl : CLINEPASS_API_BASE_URL).replace(/\/+$/, '')
  }

  private getApiKey(): string {
    return this.provider.apiKey?.trim() ?? ''
  }

  private assertApiKey(): void {
    if (!this.getApiKey()) {
      throw new LLMAPIKeyNotSetException(
        'ClinePass API key is missing. Create a key at https://app.cline.bot (Settings > API Keys), then paste it in Settings > Providers > ClinePass.',
      )
    }
  }

  async generateResponse(
    model: ChatModel,
    request: LLMRequestNonStreaming,
    options?: LLMOptions,
  ): Promise<LLMResponseNonStreaming> {
    if (model.providerType !== 'cline-pass') {
      throw new Error('Model is not a ClinePass model')
    }
    return this.sendRequest(request, options)
  }

  async streamResponse(
    model: ChatModel,
    request: LLMRequestStreaming,
    options?: LLMOptions,
  ): Promise<AsyncIterable<LLMResponseStreaming>> {
    if (model.providerType !== 'cline-pass') {
      throw new Error('Model is not a ClinePass model')
    }
    // Surface missing credentials at call time (before iteration starts).
    this.assertApiKey()
    return this.simulateStreaming(request, options)
  }

  async getEmbedding(): Promise<number[]> {
    throw new Error(
      'ClinePass does not provide an embeddings API. Choose an embedding model from another provider (for example Ollama, LM Studio, OpenAI or Gemini) in Settings > RAG.',
    )
  }

  private async sendRequest(
    request: LLMRequestNonStreaming | LLMRequestStreaming,
    options?: LLMOptions,
  ): Promise<LLMResponseNonStreaming> {
    this.assertApiKey()

    const normalizedRequest: LLMRequestNonStreaming = {
      ...request,
      messages: formatMessages(request.messages),
      stream: false,
    }
    // The Cline API defaults `stream` to true, and the OpenAI request builder
    // omits the field for non-streaming calls. Always send it explicitly so the
    // response is a JSON body that `requestUrl` can parse.
    const body = {
      ...this.adapter.buildRequestBody(normalizedRequest, false),
      stream: false,
    }

    let response: RequestUrlResponse
    try {
      response = await requestUrl({
        url: `${this.getBaseUrl()}/chat/completions`,
        method: 'POST',
        contentType: 'application/json',
        headers: {
          Authorization: `Bearer ${this.getApiKey()}`,
          'X-Response-Format': 'openai',
          'X-Title': 'ClinePass Smart Composer',
        },
        body: JSON.stringify(body),
        throw: false,
      })
    } catch (error) {
      throw new Error(
        `Could not reach the Cline API at ${this.getBaseUrl()}. Check your network connection. ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }

    if (response.status >= 400) {
      throw this.createApiException(response)
    }

    let json: unknown
    try {
      json = response.json
    } catch {
      throw new Error(
        `Unexpected response from the Cline API (HTTP ${response.status}): ${response.text.slice(0, 300)}`,
      )
    }

    if (options?.signal?.aborted) {
      throw new Error('Request was aborted')
    }

    return this.adapter.parseResponseBody(json)
  }

  private createApiException(response: RequestUrlResponse): Error {
    let detail = ''
    try {
      const json = response.json as {
        error?: { message?: string }
        message?: string
      } | null
      detail = json?.error?.message ?? json?.message ?? ''
    } catch {
      // Response body was not JSON
    }
    if (!detail) {
      detail = (response.text ?? '').slice(0, 300)
    }

    const prefix = `Cline API request failed (HTTP ${response.status})`
    switch (response.status) {
      case 401:
        return new LLMAPIKeyInvalidException(
          `${prefix}: the Cline API key is invalid or expired. Create a new key at https://app.cline.bot (Settings > API Keys). ${detail}`,
        )
      case 402:
        return new Error(
          `${prefix}: Cline credits or your ClinePass quota are exhausted. Check https://app.cline.bot/dashboard/subscription. ${detail}`,
        )
      case 429:
        return new LLMRateLimitExceededException(
          `${prefix}: ClinePass rate limit reached (5-hour, weekly or monthly limit). ${detail}`,
        )
      default:
        return new Error(`${prefix}: ${detail || 'Unknown error'}`)
    }
  }

  /**
   * Replays a completed response as stream chunks so the UI keeps rendering
   * progressively even though `requestUrl` cannot stream.
   */
  private async *simulateStreaming(
    request: LLMRequestStreaming,
    options?: LLMOptions,
  ): AsyncIterable<LLMResponseStreaming> {
    const response = await this.sendRequest(request, options)
    const choice = response.choices[0]
    if (!choice) {
      return
    }

    const base: Omit<LLMResponseStreaming, 'choices'> = {
      id: response.id,
      created: response.created,
      model: response.model,
      object: 'chat.completion.chunk',
      system_fingerprint: response.system_fingerprint,
    }
    const isAborted = () => options?.signal?.aborted === true
    const toPieces = (text: string): string[] => {
      const pieces: string[] = []
      for (let i = 0; i < text.length; i += SIMULATED_CHUNK_SIZE) {
        pieces.push(text.slice(i, i + SIMULATED_CHUNK_SIZE))
      }
      return pieces
    }

    let providerMetadataSent = false
    const reasoning = choice.message.reasoning ?? ''
    for (const piece of toPieces(reasoning)) {
      if (isAborted()) return
      yield {
        ...base,
        choices: [
          {
            finish_reason: null,
            delta: {
              reasoning: piece,
              providerMetadata: !providerMetadataSent
                ? choice.message.providerMetadata
                : undefined,
            },
          },
        ],
      }
      providerMetadataSent = true
      await this.delay()
    }

    const content = choice.message.content ?? ''
    for (const piece of toPieces(content)) {
      if (isAborted()) return
      yield {
        ...base,
        choices: [{ finish_reason: null, delta: { content: piece } }],
      }
      await this.delay()
    }

    const toolCalls: ToolCall[] | undefined = choice.message.tool_calls
    if (toolCalls?.length) {
      if (isAborted()) return
      yield {
        ...base,
        choices: [
          {
            finish_reason: null,
            delta: {
              // Non-streaming responses have no `index`; synthesize it so the
              // plugin's tool-call accumulator can merge deltas.
              tool_calls: toolCalls.map((toolCall, index) => ({
                index,
                id: toolCall.id,
                type: 'function' as const,
                function: toolCall.function,
              })),
            },
          },
        ],
      }
    }

    if (isAborted()) return
    yield {
      ...base,
      choices: [
        {
          finish_reason: choice.finish_reason ?? 'stop',
          delta: {},
        },
      ],
      usage: response.usage,
    }
  }

  private delay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, SIMULATED_CHUNK_DELAY_MS),
    )
  }
}
