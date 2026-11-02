import { SettingMigration } from '../setting.types'

import { getMigratedChatModels, getMigratedProviders } from './migrationUtils'

/**
 * v17 adds the ClinePass provider (ClinePass-exclusive fork).
 *
 * Existing installs keep their custom providers/models; the ClinePass provider
 * and its model presets are merged in, and the default chat/apply models are
 * switched to ClinePass so a single Cline API key is enough to start chatting.
 */
const DEFAULT_PROVIDERS_V17 = [
  { type: 'cline-pass', id: 'cline-pass' },
  { type: 'anthropic-plan', id: 'anthropic-plan' },
  { type: 'openai-plan', id: 'openai-plan' },
  { type: 'gemini-plan', id: 'gemini-plan' },
  { type: 'anthropic', id: 'anthropic' },
  { type: 'openai', id: 'openai' },
  { type: 'gemini', id: 'gemini' },
  { type: 'xai', id: 'xai' },
  { type: 'deepseek', id: 'deepseek' },
  { type: 'mistral', id: 'mistral' },
  { type: 'perplexity', id: 'perplexity' },
  { type: 'openrouter', id: 'openrouter' },
  { type: 'ollama', id: 'ollama' },
  { type: 'lm-studio', id: 'lm-studio' },
] as const

const CLINEPASS_MODEL_IDS_V17 = [
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

export const DEFAULT_CHAT_MODELS_V17 = CLINEPASS_MODEL_IDS_V17.map(
  (modelId) => ({
    providerType: 'cline-pass',
    providerId: 'cline-pass',
    id: modelId,
    model: modelId,
  }),
)

export const DEFAULT_CLINEPASS_MODEL_ID_V17 =
  'cline-pass/deepseek-v4.1-flash-1017'

export const migrateFrom16To17: SettingMigration['migrate'] = (data) => {
  const newData = { ...data }
  newData.version = 17

  newData.providers = getMigratedProviders(newData, DEFAULT_PROVIDERS_V17)
  newData.chatModels = getMigratedChatModels(newData, DEFAULT_CHAT_MODELS_V17)

  // The fork defaults to ClinePass for both chat and apply.
  newData.chatModelId = DEFAULT_CLINEPASS_MODEL_ID_V17
  newData.applyModelId = DEFAULT_CLINEPASS_MODEL_ID_V17

  return newData
}
