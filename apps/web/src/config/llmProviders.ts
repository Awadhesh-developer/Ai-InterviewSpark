/**
 * LLM Providers Configuration
 * Centralized configuration for all LLM providers and their settings
 */

export interface LLMProviderConfig {
  name: 'openai' | 'gemini' | 'claude'
  displayName: string
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  timeout: number
  enabled: boolean
  strengths: string[]
  costPerToken: number
  rateLimit: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
}

export interface LLMConfiguration {
  providers: Record<string, LLMProviderConfig>
  defaultProvider: string
  fallbackEnabled: boolean
  retryAttempts: number
  circuitBreaker: {
    threshold: number
    timeout: number
  }
}

class LLMConfigurationService {
  private static instance: LLMConfigurationService
  private config: LLMConfiguration

  private constructor() {
    this.config = this.loadConfiguration()
  }

  public static getInstance(): LLMConfigurationService {
    if (!LLMConfigurationService.instance) {
      LLMConfigurationService.instance = new LLMConfigurationService()
    }
    return LLMConfigurationService.instance
  }

  private loadConfiguration(): LLMConfiguration {
    return {
      providers: {
        openai: {
          name: 'openai',
          displayName: 'OpenAI GPT-4',
          apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '3000'),
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
          timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
          enabled: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY || !!process.env.OPENAI_API_KEY,
          strengths: ['behavioral', 'situational', 'complex-reasoning'],
          costPerToken: 0.00003,
          rateLimit: {
            requestsPerMinute: 60,
            tokensPerMinute: 150000
          }
        },
        gemini: {
          name: 'gemini',
          displayName: 'Google Gemini Pro',
          apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
          model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
          maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '3000'),
          temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
          timeout: parseInt(process.env.GEMINI_TIMEOUT || '30000'),
          enabled: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY || !!process.env.GEMINI_API_KEY,
          strengths: ['technical', 'analytical', 'coding'],
          costPerToken: 0.000125,
          rateLimit: {
            requestsPerMinute: 60,
            tokensPerMinute: 120000
          }
        },
        claude: {
          name: 'claude',
          displayName: 'Anthropic Claude',
          apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '',
          model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
          maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '3000'),
          temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
          timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '30000'),
          enabled: !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || !!process.env.ANTHROPIC_API_KEY,
          strengths: ['company-specific', 'nuanced', 'ethical-reasoning'],
          costPerToken: 0.000015,
          rateLimit: {
            requestsPerMinute: 50,
            tokensPerMinute: 100000
          }
        }
      },
      defaultProvider: process.env.NEXT_PUBLIC_DEFAULT_LLM_PROVIDER || 'auto',
      fallbackEnabled: process.env.NEXT_PUBLIC_LLM_FALLBACK_ENABLED === 'true',
      retryAttempts: parseInt(process.env.NEXT_PUBLIC_LLM_RETRY_ATTEMPTS || '3'),
      circuitBreaker: {
        threshold: parseInt(process.env.LLM_CIRCUIT_BREAKER_THRESHOLD || '5'),
        timeout: parseInt(process.env.LLM_CIRCUIT_BREAKER_TIMEOUT || '60000')
      }
    }
  }

  public getConfiguration(): LLMConfiguration {
    return this.config
  }

  public getProvider(name: string): LLMProviderConfig | null {
    return this.config.providers[name] || null
  }

  public getEnabledProviders(): LLMProviderConfig[] {
    return Object.values(this.config.providers).filter(provider => provider.enabled)
  }

  public getOptimalProvider(
    questionType: string,
    complexity: 'easy' | 'medium' | 'hard'
  ): LLMProviderConfig | null {
    const enabledProviders = this.getEnabledProviders()
    
    if (enabledProviders.length === 0) {
      console.warn('No LLM providers are enabled')
      return null
    }

    // If default provider is not 'auto', use it if available
    if (this.config.defaultProvider !== 'auto') {
      const defaultProvider = this.getProvider(this.config.defaultProvider)
      if (defaultProvider && defaultProvider.enabled) {
        return defaultProvider
      }
    }

    // Auto-select based on question type and provider strengths
    const suitableProviders = enabledProviders.filter(provider =>
      provider.strengths.some(strength => 
        strength.includes(questionType) || questionType.includes(strength)
      )
    )

    if (suitableProviders.length === 0) {
      // Fallback to any enabled provider
      return enabledProviders[0]
    }

    // For high complexity, prefer more capable models (lower cost per token often means more capable)
    if (complexity === 'hard') {
      return suitableProviders.sort((a, b) => a.costPerToken - b.costPerToken)[0]
    }

    // For medium complexity, balance cost and capability
    if (complexity === 'medium') {
      return suitableProviders.find(p => p.name === 'gemini') || suitableProviders[0]
    }

    // For easy complexity, prefer cost-effective options
    return suitableProviders.sort((a, b) => b.costPerToken - a.costPerToken)[0]
  }

  public validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const enabledProviders = this.getEnabledProviders()

    if (enabledProviders.length === 0) {
      errors.push('No LLM providers are configured with valid API keys')
    }

    // Validate each enabled provider
    enabledProviders.forEach(provider => {
      if (!provider.apiKey) {
        errors.push(`${provider.displayName} is enabled but missing API key`)
      }
      if (provider.maxTokens <= 0) {
        errors.push(`${provider.displayName} has invalid maxTokens configuration`)
      }
      if (provider.temperature < 0 || provider.temperature > 2) {
        errors.push(`${provider.displayName} has invalid temperature configuration`)
      }
    })

    // Validate default provider
    if (this.config.defaultProvider !== 'auto' && !this.getProvider(this.config.defaultProvider)) {
      errors.push(`Default provider '${this.config.defaultProvider}' is not configured`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  public getProviderStatus(): Record<string, { enabled: boolean; configured: boolean; healthy: boolean }> {
    const status: Record<string, { enabled: boolean; configured: boolean; healthy: boolean }> = {}

    Object.values(this.config.providers).forEach(provider => {
      status[provider.name] = {
        enabled: provider.enabled,
        configured: !!provider.apiKey,
        healthy: provider.enabled && !!provider.apiKey // Basic health check
      }
    })

    return status
  }

  public updateProviderConfig(name: string, updates: Partial<LLMProviderConfig>): void {
    if (this.config.providers[name]) {
      this.config.providers[name] = { ...this.config.providers[name], ...updates }
    }
  }

  public getUsageEstimate(
    provider: string,
    estimatedTokens: number
  ): { cost: number; timeEstimate: number } {
    const providerConfig = this.getProvider(provider)
    if (!providerConfig) {
      return { cost: 0, timeEstimate: 0 }
    }

    const cost = estimatedTokens * providerConfig.costPerToken
    const timeEstimate = Math.ceil(estimatedTokens / (providerConfig.rateLimit.tokensPerMinute / 60)) * 1000

    return { cost, timeEstimate }
  }
}

// Export singleton instance
export const llmConfig = LLMConfigurationService.getInstance()

// Types are already exported via interface declarations above

// Export utility functions
export const validateLLMConfiguration = () => llmConfig.validateConfiguration()
export const getOptimalLLMProvider = (questionType: string, complexity: 'easy' | 'medium' | 'hard') =>
  llmConfig.getOptimalProvider(questionType, complexity)
export const getLLMProviderStatus = () => llmConfig.getProviderStatus()
export const getEnabledLLMProviders = () => llmConfig.getEnabledProviders()
