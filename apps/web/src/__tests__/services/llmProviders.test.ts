/**
 * Unit Tests for LLM Providers Configuration Service
 * Tests configuration management, provider selection, and validation
 */

import { llmConfig, validateLLMConfiguration, getOptimalLLMProvider } from '@/config/llmProviders'

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_OPENAI_API_KEY: 'test-openai-key',
  NEXT_PUBLIC_GEMINI_API_KEY: 'test-gemini-key',
  NEXT_PUBLIC_ANTHROPIC_API_KEY: 'test-claude-key',
  OPENAI_MODEL: 'gpt-4-turbo-preview',
  GEMINI_MODEL: 'gemini-pro',
  ANTHROPIC_MODEL: 'claude-3-sonnet-20240229',
  NEXT_PUBLIC_DEFAULT_LLM_PROVIDER: 'auto',
  NEXT_PUBLIC_LLM_FALLBACK_ENABLED: 'true',
  NEXT_PUBLIC_LLM_RETRY_ATTEMPTS: '3'
}

describe('LLM Providers Configuration Service', () => {
  beforeEach(() => {
    // Reset environment variables
    Object.keys(mockEnv).forEach(key => {
      process.env[key] = mockEnv[key as keyof typeof mockEnv]
    })
  })

  afterEach(() => {
    // Clean up environment variables
    Object.keys(mockEnv).forEach(key => {
      delete process.env[key]
    })
  })

  describe('Configuration Loading', () => {
    it('should load configuration with all providers enabled', () => {
      const config = llmConfig.getConfiguration()
      
      expect(config.providers.openai.enabled).toBe(true)
      expect(config.providers.gemini.enabled).toBe(true)
      expect(config.providers.claude.enabled).toBe(true)
      expect(config.defaultProvider).toBe('auto')
      expect(config.fallbackEnabled).toBe(true)
      expect(config.retryAttempts).toBe(3)
    })

    it('should disable providers without API keys', () => {
      delete process.env.NEXT_PUBLIC_OPENAI_API_KEY
      
      // Create new instance to reload config
      const config = llmConfig.getConfiguration()
      
      expect(config.providers.openai.enabled).toBe(false)
      expect(config.providers.gemini.enabled).toBe(true)
      expect(config.providers.claude.enabled).toBe(true)
    })

    it('should use default values for missing configuration', () => {
      delete process.env.OPENAI_MODEL
      delete process.env.OPENAI_MAX_TOKENS
      
      const config = llmConfig.getConfiguration()
      
      expect(config.providers.openai.model).toBe('gpt-4-turbo-preview')
      expect(config.providers.openai.maxTokens).toBe(3000)
    })
  })

  describe('Provider Selection', () => {
    it('should select OpenAI for behavioral questions', () => {
      const provider = llmConfig.getOptimalProvider('behavioral', 'medium')
      
      expect(provider).not.toBeNull()
      expect(provider?.name).toBe('openai')
    })

    it('should select Gemini for technical questions', () => {
      const provider = llmConfig.getOptimalProvider('technical', 'medium')
      
      expect(provider).not.toBeNull()
      expect(provider?.name).toBe('gemini')
    })

    it('should select Claude for company-specific questions', () => {
      const provider = llmConfig.getOptimalProvider('company-specific', 'medium')
      
      expect(provider).not.toBeNull()
      expect(provider?.name).toBe('claude')
    })

    it('should prefer more capable models for hard complexity', () => {
      const provider = llmConfig.getOptimalProvider('behavioral', 'hard')
      
      expect(provider).not.toBeNull()
      // Should prefer OpenAI for hard complexity
      expect(provider?.name).toBe('openai')
    })

    it('should return null when no providers are enabled', () => {
      delete process.env.NEXT_PUBLIC_OPENAI_API_KEY
      delete process.env.NEXT_PUBLIC_GEMINI_API_KEY
      delete process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
      
      const provider = llmConfig.getOptimalProvider('behavioral', 'medium')
      
      expect(provider).toBeNull()
    })

    it('should fallback to any enabled provider when no suitable provider found', () => {
      const provider = llmConfig.getOptimalProvider('unknown-type', 'medium')
      
      expect(provider).not.toBeNull()
      expect(['openai', 'gemini', 'claude']).toContain(provider?.name)
    })
  })

  describe('Configuration Validation', () => {
    it('should validate correct configuration', () => {
      const validation = llmConfig.validateConfiguration()
      
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect missing API keys', () => {
      delete process.env.NEXT_PUBLIC_OPENAI_API_KEY
      delete process.env.NEXT_PUBLIC_GEMINI_API_KEY
      delete process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
      
      const validation = llmConfig.validateConfiguration()
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('No LLM providers are configured with valid API keys')
    })

    it('should detect invalid temperature configuration', () => {
      process.env.OPENAI_TEMPERATURE = '3.0' // Invalid: > 2
      
      const validation = llmConfig.validateConfiguration()
      
      expect(validation.valid).toBe(false)
      expect(validation.errors.some(error => 
        error.includes('invalid temperature configuration')
      )).toBe(true)
    })

    it('should detect invalid maxTokens configuration', () => {
      process.env.OPENAI_MAX_TOKENS = '0' // Invalid: <= 0
      
      const validation = llmConfig.validateConfiguration()
      
      expect(validation.valid).toBe(false)
      expect(validation.errors.some(error => 
        error.includes('invalid maxTokens configuration')
      )).toBe(true)
    })
  })

  describe('Provider Status', () => {
    it('should return correct provider status', () => {
      const status = llmConfig.getProviderStatus()
      
      expect(status.openai.enabled).toBe(true)
      expect(status.openai.configured).toBe(true)
      expect(status.openai.healthy).toBe(true)
      
      expect(status.gemini.enabled).toBe(true)
      expect(status.gemini.configured).toBe(true)
      expect(status.gemini.healthy).toBe(true)
      
      expect(status.claude.enabled).toBe(true)
      expect(status.claude.configured).toBe(true)
      expect(status.claude.healthy).toBe(true)
    })

    it('should show unhealthy status for providers without API keys', () => {
      delete process.env.NEXT_PUBLIC_OPENAI_API_KEY
      
      const status = llmConfig.getProviderStatus()
      
      expect(status.openai.enabled).toBe(false)
      expect(status.openai.configured).toBe(false)
      expect(status.openai.healthy).toBe(false)
    })
  })

  describe('Usage Estimation', () => {
    it('should calculate usage cost and time estimates', () => {
      const estimate = llmConfig.getUsageEstimate('openai', 1000)
      
      expect(estimate.cost).toBeGreaterThan(0)
      expect(estimate.timeEstimate).toBeGreaterThan(0)
    })

    it('should return zero estimates for unknown provider', () => {
      const estimate = llmConfig.getUsageEstimate('unknown', 1000)
      
      expect(estimate.cost).toBe(0)
      expect(estimate.timeEstimate).toBe(0)
    })
  })

  describe('Provider Configuration Updates', () => {
    it('should update provider configuration', () => {
      const originalConfig = llmConfig.getProvider('openai')
      expect(originalConfig?.temperature).toBe(0.7)
      
      llmConfig.updateProviderConfig('openai', { temperature: 0.5 })
      
      const updatedConfig = llmConfig.getProvider('openai')
      expect(updatedConfig?.temperature).toBe(0.5)
    })

    it('should not update non-existent provider', () => {
      llmConfig.updateProviderConfig('unknown', { temperature: 0.5 })
      
      const config = llmConfig.getProvider('unknown')
      expect(config).toBeNull()
    })
  })

  describe('Utility Functions', () => {
    it('should validate configuration through utility function', () => {
      const validation = validateLLMConfiguration()
      
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should get optimal provider through utility function', () => {
      const provider = getOptimalLLMProvider('behavioral', 'medium')
      
      expect(provider).not.toBeNull()
      expect(provider?.name).toBe('openai')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty environment variables', () => {
      process.env.NEXT_PUBLIC_OPENAI_API_KEY = ''
      
      const config = llmConfig.getConfiguration()
      
      expect(config.providers.openai.enabled).toBe(false)
    })

    it('should handle malformed numeric environment variables', () => {
      process.env.OPENAI_MAX_TOKENS = 'not-a-number'
      process.env.OPENAI_TEMPERATURE = 'invalid'
      
      const config = llmConfig.getConfiguration()
      
      // Should use defaults
      expect(config.providers.openai.maxTokens).toBe(3000)
      expect(config.providers.openai.temperature).toBe(0.7)
    })

    it('should handle missing default provider configuration', () => {
      process.env.NEXT_PUBLIC_DEFAULT_LLM_PROVIDER = 'nonexistent'
      
      const validation = llmConfig.validateConfiguration()
      
      expect(validation.valid).toBe(false)
      expect(validation.errors.some(error => 
        error.includes('Default provider')
      )).toBe(true)
    })
  })
})
