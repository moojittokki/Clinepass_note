import { ChatModel } from './types/chat-model.types'
import { EmbeddingModel } from './types/embedding-model.types'
import { LLMProvider, LLMProviderType } from './types/provider.types'

export const CHAT_VIEW_TYPE = 'smtcmp-chat-view'
export const APPLY_VIEW_TYPE = 'smtcmp-apply-view'

export const PGLITE_DB_PATH = '.smtcmp_vector_db.tar.gz'

export const CODEX_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann'
export const CODEX_ISSUER = 'https://auth.openai.com'
export const CODEX_REDIRECT_PORT = 1455 // Other ports are blocked by OpenAI
export const CODEX_REDIRECT_URI = `http://localhost:${CODEX_REDIRECT_PORT}/auth/callback`
export const CODEX_AUTH_CLAIMS_URL = 'https://api.openai.com/auth'
export const CODEX_RESPONSES_ENDPOINT =
  'https://chatgpt.com/backend-api/codex/responses'

export const CLAUDE_CODE_CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e'
export const CLAUDE_CODE_AUTHORIZE_BASE_URL = 'https://claude.ai'
export const CLAUDE_CODE_CONSOLE_BASE_URL = 'https://console.anthropic.com'
export const CLAUDE_CODE_OAUTH_TOKEN_ENDPOINT =
  'https://console.anthropic.com/v1/oauth/token'
export const CLAUDE_CODE_REDIRECT_URI =
  'https://console.anthropic.com/oauth/code/callback'
export const CLAUDE_CODE_MESSAGES_ENDPOINT =
  'https://api.anthropic.com/v1/messages'
export const CLAUDE_CODE_DEFAULT_BETAS = [
  'oauth-2025-04-20',
  'interleaved-thinking-2025-05-14',
  'claude-code-20250219',
]
export const CLAUDE_CODE_SYSTEM_MESSAGE =
  "You are Claude Code, Anthropic's official CLI for Claude."
export const CLAUDE_CODE_USER_AGENT = 'claude-cli/2.1.2 (external, cli)'

// Google OAuth credentials are intentionally NOT bundled in this fork.
//
// Upstream committed a Google "installed app" client ID/secret here. GitHub push
// protection rejects repositories containing them, and ClinePass-only use does
// not need Gemini plan OAuth. If you want Gemini plan sign-in, set your own
// OAuth client values below (they are read at build time).
export const GEMINI_OAUTH_CLIENT_ID = ''
export const GEMINI_OAUTH_CLIENT_SECRET = ''
export const GEMINI_OAUTH_REDIRECT_URI = 'http://localhost:8085/oauth2callback'
export const GEMINI_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
] as const
export const GEMINI_CODE_ASSIST_ENDPOINT = 'https://cloudcode-pa.googleapis.com'
export const GEMINI_CODE_ASSIST_HEADERS = {
  'User-Agent': 'google-api-nodejs-client/9.15.1',
  'X-Goog-Api-Client': 'gl-node/22.17.0',
  'Client-Metadata':
    'ideType=IDE_UNSPECIFIED,platform=PLATFORM_UNSPECIFIED,pluginType=GEMINI',
} as const

/**
 * ClinePass
 *
 * ClinePass is a flat-rate ($9.99/month) Cline subscription that grants 2-5x the
 * standard rate limits on a curated set of open coding models.
 * It can be used outside of Cline through the OpenAI-compatible Cline API:
 *   POST https://api.cline.bot/api/v1/chat/completions
 *   Authorization: Bearer <Cline API key from https://app.cline.bot>
 * https://docs.cline.bot/getting-started/clinepass
 */
export const CLINEPASS_API_BASE_URL = 'https://api.cline.bot/api/v1'
export const CLINEPASS_PROVIDER_ID = 'cline-pass'
export const CLINEPASS_DEFAULT_MODEL_ID = 'cline-pass/deepseek-v4.1-flash-1017'

/**
 * Model IDs included in ClinePass (keep in sync with the docs page above).
 */
export const CLINEPASS_MODEL_IDS = [
  'cline-pass/deepseek-v4.1-flash-1017',
  'cline-pass/deepseek-v4.1-flash',
  'cline-pass/deepseek-v4-pro',
  'cline-pass/glm-5.3-flash',
  'cline-pass/glm-5.3',
  'cline-pass/kimi-k3.1-pro',
  'cline-pass/kimi-k3',
  'cline-pass/muse-spark-1.3-contributor',
  'cline-pass/minimax-m3.1-flash',
  'cline-pass/minimax-m3',
  'cline-pass/mimo-v2.6-pro',
  'cline-pass/mimo-v2.6-flash',
  'cline-pass/qwen3.7-max',
  'cline-pass/qwen3.7-plus',
  'cline-pass/qwen3.8-max',
] as const

/**
 * Chat models that are preconfigured for ClinePass.
 * The model id doubles as the display id so the ClinePass slug used on the wire
 * is always visible in the model picker.
 */
export const CLINEPASS_CHAT_MODELS: readonly ChatModel[] =
  CLINEPASS_MODEL_IDS.map((modelId) => ({
    providerType: 'cline-pass' as const,
    providerId: CLINEPASS_PROVIDER_ID,
    id: modelId,
    model: modelId,
  }))

// Default model ids
export const DEFAULT_CHAT_MODEL_ID = CLINEPASS_DEFAULT_MODEL_ID
// ClinePass models handle both chat and apply tasks, so the same model is used
// for one-click edits by default.
export const DEFAULT_APPLY_MODEL_ID = CLINEPASS_DEFAULT_MODEL_ID

// Recommended model ids
export const RECOMMENDED_MODELS_FOR_CHAT = [
  CLINEPASS_DEFAULT_MODEL_ID,
  'cline-pass/kimi-k3',
]
export const RECOMMENDED_MODELS_FOR_APPLY = [CLINEPASS_DEFAULT_MODEL_ID]
export const RECOMMENDED_MODELS_FOR_EMBEDDING = [
  'openai/text-embedding-3-small',
]

export const PLAN_PROVIDER_TYPES: readonly LLMProviderType[] = [
  'anthropic-plan',
  'openai-plan',
  'gemini-plan',
] as const
export const PROVIDER_TYPES_INFO = {
  'cline-pass': {
    label: 'ClinePass',
    defaultProviderId: CLINEPASS_PROVIDER_ID,
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  'anthropic-plan': {
    label: 'Claude Plan',
    defaultProviderId: 'anthropic-plan',
    requireApiKey: false,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  'openai-plan': {
    label: 'OpenAI Plan',
    defaultProviderId: 'openai-plan',
    requireApiKey: false,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  'gemini-plan': {
    label: 'Gemini Plan',
    defaultProviderId: 'gemini-plan',
    requireApiKey: false,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  anthropic: {
    label: 'Anthropic',
    defaultProviderId: 'anthropic',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  openai: {
    label: 'OpenAI',
    defaultProviderId: 'openai',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: true,
    additionalSettings: [],
  },
  gemini: {
    label: 'Gemini',
    defaultProviderId: 'gemini',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: true,
    additionalSettings: [],
  },
  xai: {
    label: 'xAI',
    defaultProviderId: 'xai',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  deepseek: {
    label: 'DeepSeek',
    defaultProviderId: 'deepseek',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  mistral: {
    label: 'Mistral',
    defaultProviderId: 'mistral',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  perplexity: {
    label: 'Perplexity',
    defaultProviderId: 'perplexity',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  openrouter: {
    label: 'OpenRouter',
    defaultProviderId: 'openrouter',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  ollama: {
    label: 'Ollama',
    defaultProviderId: 'ollama',
    requireApiKey: false,
    requireBaseUrl: false,
    supportEmbedding: true,
    additionalSettings: [],
  },
  'lm-studio': {
    label: 'LM Studio',
    defaultProviderId: 'lm-studio',
    requireApiKey: false,
    requireBaseUrl: false,
    supportEmbedding: true,
    additionalSettings: [],
  },
  'azure-openai': {
    label: 'Azure OpenAI',
    defaultProviderId: null, // no default provider for this type
    requireApiKey: true,
    requireBaseUrl: true,
    supportEmbedding: false,
    additionalSettings: [
      {
        label: 'Deployment',
        key: 'deployment',
        placeholder: 'Enter your deployment name',
        type: 'text',
        required: true,
      },
      {
        label: 'API Version',
        key: 'apiVersion',
        placeholder: 'Enter your API version',
        type: 'text',
        required: true,
      },
    ],
  },
  'openai-compatible': {
    label: 'OpenAI Compatible',
    defaultProviderId: null, // no default provider for this type
    requireApiKey: false,
    requireBaseUrl: true,
    supportEmbedding: true,
    additionalSettings: [
      {
        label: 'No Stainless Headers',
        key: 'noStainless',
        type: 'toggle',
        required: false,
        description:
          'Enable this if you encounter CORS errors related to Stainless headers (x-stainless-os, etc.)',
      },
    ],
  },
} as const satisfies Record<
  LLMProviderType,
  {
    label: string
    defaultProviderId: string | null
    requireApiKey: boolean
    requireBaseUrl: boolean
    supportEmbedding: boolean
    additionalSettings: {
      label: string
      key: string
      type: 'text' | 'toggle'
      placeholder?: string
      description?: string
      required?: boolean
    }[]
  }
>

/**
 * Important
 * 1. When adding new default provider, settings migration should be added
 * 2. If there's same provider id in user's settings, it's data should be overwritten by default provider
 */
export const DEFAULT_PROVIDERS: readonly LLMProvider[] = [
  {
    type: 'cline-pass',
    id: PROVIDER_TYPES_INFO['cline-pass'].defaultProviderId,
  },
  {
    type: 'anthropic-plan',
    id: PROVIDER_TYPES_INFO['anthropic-plan'].defaultProviderId,
  },
  {
    type: 'openai-plan',
    id: PROVIDER_TYPES_INFO['openai-plan'].defaultProviderId,
  },
  {
    type: 'gemini-plan',
    id: PROVIDER_TYPES_INFO['gemini-plan'].defaultProviderId,
  },
  {
    type: 'anthropic',
    id: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
  },
  {
    type: 'openai',
    id: PROVIDER_TYPES_INFO.openai.defaultProviderId,
  },
  {
    type: 'gemini',
    id: PROVIDER_TYPES_INFO.gemini.defaultProviderId,
  },
  {
    type: 'xai',
    id: PROVIDER_TYPES_INFO.xai.defaultProviderId,
  },
  {
    type: 'deepseek',
    id: PROVIDER_TYPES_INFO.deepseek.defaultProviderId,
  },
  {
    type: 'mistral',
    id: PROVIDER_TYPES_INFO.mistral.defaultProviderId,
  },
  {
    type: 'perplexity',
    id: PROVIDER_TYPES_INFO.perplexity.defaultProviderId,
  },
  {
    type: 'openrouter',
    id: PROVIDER_TYPES_INFO.openrouter.defaultProviderId,
  },
  {
    type: 'ollama',
    id: PROVIDER_TYPES_INFO.ollama.defaultProviderId,
  },
  {
    type: 'lm-studio',
    id: PROVIDER_TYPES_INFO['lm-studio'].defaultProviderId,
  },
]

/**
 * Important
 * 1. When adding new default model, settings migration should be added
 * 2. If there's same model id in user's settings, it's data should be overwritten by default model
 */
export const DEFAULT_CHAT_MODELS: readonly ChatModel[] = [
  ...CLINEPASS_CHAT_MODELS,
  {
    providerType: 'anthropic-plan',
    providerId: PROVIDER_TYPES_INFO['anthropic-plan'].defaultProviderId,
    id: 'claude-opus-4.5 (plan)',
    model: 'claude-opus-4-5',
    thinking: {
      enabled: true,
      budget_tokens: 8192,
    },
  },
  {
    providerType: 'anthropic-plan',
    providerId: PROVIDER_TYPES_INFO['anthropic-plan'].defaultProviderId,
    id: 'claude-sonnet-4.5 (plan)',
    model: 'claude-sonnet-4-5',
    thinking: {
      enabled: true,
      budget_tokens: 8192,
    },
  },
  {
    providerType: 'openai-plan',
    providerId: PROVIDER_TYPES_INFO['openai-plan'].defaultProviderId,
    id: 'gpt-5.2 (plan)',
    model: 'gpt-5.2',
  },
  {
    providerType: 'gemini-plan',
    providerId: PROVIDER_TYPES_INFO['gemini-plan'].defaultProviderId,
    id: 'gemini-3-pro-preview (plan)',
    model: 'gemini-3-pro-preview',
  },
  {
    providerType: 'gemini-plan',
    providerId: PROVIDER_TYPES_INFO['gemini-plan'].defaultProviderId,
    id: 'gemini-3-flash-preview (plan)',
    model: 'gemini-3-flash-preview',
  },
  {
    providerType: 'anthropic',
    providerId: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
    id: 'claude-opus-4.5',
    model: 'claude-opus-4-5',
  },
  {
    providerType: 'anthropic',
    providerId: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
    id: 'claude-sonnet-4.5',
    model: 'claude-sonnet-4-5',
  },
  {
    providerType: 'anthropic',
    providerId: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
    id: 'claude-haiku-4.5',
    model: 'claude-haiku-4-5',
  },
  {
    providerType: 'openai',
    providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'gpt-5.2',
    model: 'gpt-5.2',
  },
  {
    providerType: 'openai',
    providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'gpt-5-mini',
    model: 'gpt-5-mini',
  },
  {
    providerType: 'openai',
    providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'gpt-4.1-mini',
    model: 'gpt-4.1-mini',
  },
  {
    providerType: 'openai',
    providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'o4-mini',
    model: 'o4-mini',
    reasoning: {
      enabled: true,
      reasoning_effort: 'medium',
    },
  },
  {
    providerType: 'gemini',
    providerId: PROVIDER_TYPES_INFO.gemini.defaultProviderId,
    id: 'gemini-3-pro-preview',
    model: 'gemini-3-pro-preview',
  },
  {
    providerType: 'gemini',
    providerId: PROVIDER_TYPES_INFO.gemini.defaultProviderId,
    id: 'gemini-3-flash-preview',
    model: 'gemini-3-flash-preview',
  },
  {
    providerType: 'deepseek',
    providerId: PROVIDER_TYPES_INFO.deepseek.defaultProviderId,
    id: 'deepseek-chat',
    model: 'deepseek-chat',
  },
  {
    providerType: 'deepseek',
    providerId: PROVIDER_TYPES_INFO.deepseek.defaultProviderId,
    id: 'deepseek-reasoner',
    model: 'deepseek-reasoner',
  },
  {
    providerType: 'xai',
    providerId: PROVIDER_TYPES_INFO.xai.defaultProviderId,
    id: 'grok-4-1-fast',
    model: 'grok-4-1-fast',
  },
  {
    providerType: 'xai',
    providerId: PROVIDER_TYPES_INFO.xai.defaultProviderId,
    id: 'grok-4-1-fast-non-reasoning',
    model: 'grok-4-1-fast-non-reasoning',
  },
]

/**
 * Important
 * 1. When adding new default embedding model, settings migration should be added
 * 2. If there's same embedding model id in user's settings, it's data should be overwritten by default embedding model
 */
export const DEFAULT_EMBEDDING_MODELS: readonly EmbeddingModel[] = [
  {
    providerType: 'openai',
    providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'openai/text-embedding-3-small',
    model: 'text-embedding-3-small',
    dimension: 1536,
  },
  {
    providerType: 'openai',
    providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'openai/text-embedding-3-large',
    model: 'text-embedding-3-large',
    dimension: 3072,
  },
  {
    providerType: 'gemini',
    providerId: PROVIDER_TYPES_INFO.gemini.defaultProviderId,
    id: 'gemini/text-embedding-004',
    model: 'text-embedding-004',
    dimension: 768,
  },
  {
    providerType: 'ollama',
    providerId: PROVIDER_TYPES_INFO.ollama.defaultProviderId,
    id: 'ollama/nomic-embed-text',
    model: 'nomic-embed-text',
    dimension: 768,
  },
  {
    providerType: 'ollama',
    providerId: PROVIDER_TYPES_INFO.ollama.defaultProviderId,
    id: 'ollama/mxbai-embed-large',
    model: 'mxbai-embed-large',
    dimension: 1024,
  },
  {
    providerType: 'ollama',
    providerId: PROVIDER_TYPES_INFO.ollama.defaultProviderId,
    id: 'ollama/bge-m3',
    model: 'bge-m3',
    dimension: 1024,
  },
]

// Pricing in dollars per million tokens
type ModelPricing = {
  input: number
  output: number
}

/**
 * Reference prices for ClinePass models (USD per 1M tokens).
 *
 * ClinePass itself is a flat monthly subscription, so these numbers are not
 * billed per request. They are shown only to estimate how much of the included
 * quota a conversation uses (ClinePass quota is measured against standard API
 * rates). See https://docs.cline.bot/getting-started/clinepass
 */
export const CLINEPASS_PRICES: Record<string, ModelPricing> = {
  'cline-pass/deepseek-v4.1-flash-1017': { input: 0.3, output: 1.2 },
  'cline-pass/deepseek-v4.1-flash': { input: 0.3, output: 1.2 },
  'cline-pass/deepseek-v4-pro': { input: 1.32, output: 3.96 },
  'cline-pass/glm-5.3-flash': { input: 0.15, output: 0.5 },
  'cline-pass/glm-5.3': { input: 1.4, output: 4.4 },
  'cline-pass/kimi-k3.1-pro': { input: 2, output: 10 },
  'cline-pass/kimi-k3': { input: 3, output: 15 },
  'cline-pass/muse-spark-1.3-contributor': { input: 0.1, output: 0.2 },
  'cline-pass/minimax-m3.1-flash': { input: 0.15, output: 0.6 },
  'cline-pass/minimax-m3': { input: 0.3, output: 1.2 },
  'cline-pass/mimo-v2.6-pro': { input: 0.435, output: 0.87 },
  'cline-pass/mimo-v2.6-flash': { input: 0.14, output: 0.28 },
  'cline-pass/qwen3.7-max': { input: 2.5, output: 7.5 },
  'cline-pass/qwen3.7-plus': { input: 0.4, output: 1.6 },
  'cline-pass/qwen3.8-max': { input: 2, output: 6 },
}

export const OPENAI_PRICES: Record<string, ModelPricing> = {
  'gpt-5.2': { input: 1.75, output: 14 },
  'gpt-5.1': { input: 1.25, output: 10 },
  'gpt-5': { input: 1.25, output: 10 },
  'gpt-5-mini': { input: 0.25, output: 2 },
  'gpt-5-nano': { input: 0.05, output: 0.4 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  o3: { input: 10, output: 40 },
  o1: { input: 15, output: 60 },
  'o4-mini': { input: 1.1, output: 4.4 },
  'o3-mini': { input: 1.1, output: 4.4 },
  'o1-mini': { input: 1.1, output: 4.4 },
}

export const ANTHROPIC_PRICES: Record<string, ModelPricing> = {
  'claude-opus-4-5': { input: 5, output: 25 },
  'claude-opus-4-1': { input: 15, output: 75 },
  'claude-opus-4-0': { input: 15, output: 75 },
  'claude-sonnet-4-5': { input: 3, output: 15 },
  'claude-sonnet-4-0': { input: 3, output: 15 },
  'claude-3-5-sonnet-latest': { input: 3, output: 15 },
  'claude-3-7-sonnet-latest': { input: 3, output: 15 },
  'claude-haiku-4-5': { input: 1, output: 5 },
  'claude-3-5-haiku-latest': { input: 1, output: 5 },
}

// Gemini is currently free for low rate limits
export const GEMINI_PRICES: Record<string, ModelPricing> = {}

export const XAI_PRICES: Record<string, ModelPricing> = {
  'grok-4-1-fast': { input: 0.2, output: 0.5 },
  'grok-4-1-fast-non-reasoning': { input: 0.2, output: 0.5 },
}

export const DEEPSEEK_PRICES: Record<string, ModelPricing> = {
  // Model version: DeepSeek-V3.2
  'deepseek-chat': { input: 0.28, output: 0.42 },
  'deepseek-reasoner': { input: 0.28, output: 0.42 },
}
