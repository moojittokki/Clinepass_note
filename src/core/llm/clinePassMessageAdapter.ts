import {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions'

import { LLMRequest, RequestMessage } from '../../types/llm/request'
import {
  LLMResponseNonStreaming,
  LLMResponseStreaming,
} from '../../types/llm/response'

import { OpenAIMessageAdapter } from './openaiMessageAdapter'

/**
 * Adapter for the Cline API (`https://api.cline.bot/api/v1`).
 *
 * The Cline API is OpenAI-compatible, but models served through ClinePass are
 * reasoning models that report their thinking in `delta.reasoning` /
 * `message.reasoning` (instead of OpenAI's `reasoning_content`).
 * Some upstream providers also return encrypted `reasoning_details` blocks that
 * must be echoed back with the assistant message on the next turn, so they are
 * kept in `providerMetadata.clinePass` and re-injected when the conversation
 * history is replayed (e.g. during tool call iterations).
 */
export class ClinePassMessageAdapter extends OpenAIMessageAdapter {
  /**
   * Builds the OpenAI-shaped JSON body that is sent to the Cline API.
   *
   * Exposed publicly because `ClinePassProvider` talks to the API through
   * Obsidian's `requestUrl` (which is not CORS-restricted) instead of the
   * OpenAI SDK's `fetch`-based client.
   */
  buildRequestBody(request: LLMRequest, stream: boolean): object {
    return this.buildChatCompletionCreateParams({
      request,
      stream,
    } as unknown as { request: LLMRequest; stream: false })
  }

  /**
   * Parses a non-streaming JSON response returned by the Cline API.
   */
  parseResponseBody(body: unknown): LLMResponseNonStreaming {
    return this.parseNonStreamingResponse(body as ChatCompletion)
  }

  protected parseNonStreamingResponse(
    response: ChatCompletion,
  ): LLMResponseNonStreaming {
    return {
      id: response.id,
      choices: response.choices.map((choice) => {
        const message = choice.message as unknown as {
          reasoning?: string | null
          reasoning_details?: unknown[]
        }
        return {
          finish_reason: choice.finish_reason,
          message: {
            content: choice.message.content,
            reasoning: message.reasoning ?? undefined,
            role: choice.message.role,
            tool_calls: this.normalizeToolCalls(choice.message.tool_calls),
            providerMetadata: message.reasoning_details?.length
              ? { clinePass: { reasoningDetails: message.reasoning_details } }
              : undefined,
          },
        }
      }),
      created: response.created,
      model: response.model,
      object: 'chat.completion',
      system_fingerprint: response.system_fingerprint,
      usage: response.usage,
    }
  }

  protected parseStreamingResponseChunk(
    chunk: ChatCompletionChunk,
  ): LLMResponseStreaming {
    return {
      id: chunk.id,
      choices: chunk.choices.map((choice) => {
        const delta = choice.delta as unknown as {
          reasoning?: string | null
          reasoning_details?: unknown[]
        }
        return {
          finish_reason: choice.finish_reason ?? null,
          delta: {
            content: choice.delta.content ?? null,
            reasoning: delta.reasoning ?? undefined,
            role: choice.delta.role,
            tool_calls: choice.delta.tool_calls,
            providerMetadata: delta.reasoning_details?.length
              ? { clinePass: { reasoningDetails: delta.reasoning_details } }
              : undefined,
          },
        }
      }),
      created: chunk.created,
      model: chunk.model,
      object: 'chat.completion.chunk',
      system_fingerprint: chunk.system_fingerprint,
      usage: chunk.usage ?? undefined,
    }
  }

  protected parseRequestMessage(
    message: RequestMessage,
  ): ChatCompletionMessageParam {
    const baseMessage = super.parseRequestMessage(message)

    if (
      message.role === 'assistant' &&
      message.providerMetadata?.clinePass?.reasoningDetails
    ) {
      return {
        ...baseMessage,
        reasoning_details: message.providerMetadata.clinePass.reasoningDetails,
      } as unknown as ChatCompletionMessageParam
    }

    return baseMessage
  }
}
