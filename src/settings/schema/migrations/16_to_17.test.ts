import {
  DEFAULT_CHAT_MODELS_V17,
  DEFAULT_CLINEPASS_MODEL_ID_V17,
  migrateFrom16To17,
} from './16_to_17'

describe('Migration from v16 to v17', () => {
  it('should increment version to 17', () => {
    const result = migrateFrom16To17({ version: 16 })
    expect(result.version).toBe(17)
  })

  it('should add the ClinePass provider and keep custom providers', () => {
    const oldSettings = {
      version: 16,
      providers: [
        { type: 'anthropic', id: 'anthropic', apiKey: 'anthropic-key' },
        { type: 'custom', id: 'custom-provider', apiKey: 'custom-key' },
      ],
      chatModels: [],
    }

    const result = migrateFrom16To17(oldSettings)
    const providers = result.providers as { type: string; id: string }[]

    expect(providers.find((p) => p.type === 'cline-pass')).toBeDefined()
    expect(
      providers.find((p) => p.id === 'anthropic' && p.type === 'anthropic'),
    ).toBeDefined()
    expect(
      providers.find((p) => p.id === 'custom-provider' && p.type === 'custom'),
    ).toBeDefined()
  })

  it('should add every ClinePass model preset and keep custom models', () => {
    const oldSettings = {
      version: 16,
      providers: [],
      chatModels: [
        {
          id: 'custom-model',
          providerType: 'custom',
          providerId: 'custom',
          model: 'custom-model',
        },
      ],
    }

    const result = migrateFrom16To17(oldSettings)
    const chatModels = result.chatModels as {
      id: string
      providerType: string
      providerId: string
      model: string
    }[]

    for (const preset of DEFAULT_CHAT_MODELS_V17) {
      expect(chatModels.find((m) => m.id === preset.id)).toMatchObject(preset)
    }
    expect(chatModels.find((m) => m.id === 'custom-model')).toBeDefined()
  })

  it('should default chat and apply models to ClinePass', () => {
    const result = migrateFrom16To17({
      version: 16,
      chatModelId: 'claude-sonnet-4.5',
      applyModelId: 'gpt-4.1-mini',
    })

    expect(result.chatModelId).toBe(DEFAULT_CLINEPASS_MODEL_ID_V17)
    expect(result.applyModelId).toBe(DEFAULT_CLINEPASS_MODEL_ID_V17)
  })
})
