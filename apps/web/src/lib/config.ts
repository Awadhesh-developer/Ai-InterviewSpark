/**
 * Application Configuration
 * Centralized configuration management for the voice interview system
 */

export interface VoiceConfig {
  openaiApiKey: string
  azureSpeechKey?: string
  azureSpeechRegion?: string
  preferredService: 'realtime' | 'fallback' | 'auto'
  calibrationRequired: boolean
  autoFallback: boolean
  supportedLanguages: string[]
}

export interface VideoAnalysisConfig {
  enableFacialAnalysis: boolean
  enableEyeTracking: boolean
  enableEmotionDetection: boolean
  analysisInterval: number
  confidenceThreshold: number
  modelPath: string
}

export interface InterviewConfig {
  maxDuration: number
  maxQuestionsPerInterview: number
  enableVoiceInterviews: boolean
  enableVideoAnalysis: boolean
  enableRealTimeFeedback: boolean
  enableMLPredictions: boolean
}

export interface AppConfig {
  appUrl: string
  apiUrl: string
  debugMode: boolean
  nodeEnv: string
}

class ConfigManager {
  private static instance: ConfigManager
  private _voiceConfig: VoiceConfig | null = null
  private _videoAnalysisConfig: VideoAnalysisConfig | null = null
  private _interviewConfig: InterviewConfig | null = null
  private _appConfig: AppConfig | null = null

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  get voiceConfig(): VoiceConfig {
    if (!this._voiceConfig) {
      this._voiceConfig = this.loadVoiceConfig()
    }
    return this._voiceConfig
  }

  get videoAnalysisConfig(): VideoAnalysisConfig {
    if (!this._videoAnalysisConfig) {
      this._videoAnalysisConfig = this.loadVideoAnalysisConfig()
    }
    return this._videoAnalysisConfig
  }

  get interviewConfig(): InterviewConfig {
    if (!this._interviewConfig) {
      this._interviewConfig = this.loadInterviewConfig()
    }
    return this._interviewConfig
  }

  get appConfig(): AppConfig {
    if (!this._appConfig) {
      this._appConfig = this.loadAppConfig()
    }
    return this._appConfig
  }

  private loadVoiceConfig(): VoiceConfig {
    const openaiApiKey = this.getEnvVar('NEXT_PUBLIC_OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required. Please set NEXT_PUBLIC_OPENAI_API_KEY in your environment variables.')
    }

    return {
      openaiApiKey,
      azureSpeechKey: this.getEnvVar('NEXT_PUBLIC_AZURE_SPEECH_KEY'),
      azureSpeechRegion: this.getEnvVar('NEXT_PUBLIC_AZURE_SPEECH_REGION'),
      preferredService: this.getEnvVar('NEXT_PUBLIC_VOICE_SERVICE_PREFERRED', 'auto') as 'realtime' | 'fallback' | 'auto',
      calibrationRequired: this.getBooleanEnvVar('NEXT_PUBLIC_VOICE_CALIBRATION_REQUIRED', false),
      autoFallback: this.getBooleanEnvVar('NEXT_PUBLIC_VOICE_AUTO_FALLBACK', true),
      supportedLanguages: this.getArrayEnvVar('NEXT_PUBLIC_SUPPORTED_LANGUAGES', [
        'en-US', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN', 'ja-JP', 'pt-BR', 'hi-IN'
      ])
    }
  }

  private loadVideoAnalysisConfig(): VideoAnalysisConfig {
    return {
      enableFacialAnalysis: this.getBooleanEnvVar('NEXT_PUBLIC_ENABLE_FACIAL_ANALYSIS', true),
      enableEyeTracking: this.getBooleanEnvVar('NEXT_PUBLIC_ENABLE_EYE_TRACKING', true),
      enableEmotionDetection: this.getBooleanEnvVar('NEXT_PUBLIC_ENABLE_EMOTION_DETECTION', true),
      analysisInterval: this.getNumberEnvVar('NEXT_PUBLIC_VIDEO_ANALYSIS_INTERVAL', 500),
      confidenceThreshold: this.getNumberEnvVar('NEXT_PUBLIC_FACE_CONFIDENCE_THRESHOLD', 50) / 100,
      modelPath: this.getEnvVar('NEXT_PUBLIC_FACE_MODELS_PATH', '/models')
    }
  }

  private loadInterviewConfig(): InterviewConfig {
    return {
      maxDuration: this.getNumberEnvVar('NEXT_PUBLIC_MAX_INTERVIEW_DURATION', 60),
      maxQuestionsPerInterview: this.getNumberEnvVar('NEXT_PUBLIC_MAX_QUESTIONS_PER_INTERVIEW', 20),
      enableVoiceInterviews: this.getBooleanEnvVar('NEXT_PUBLIC_ENABLE_VOICE_INTERVIEWS', true),
      enableVideoAnalysis: this.getBooleanEnvVar('NEXT_PUBLIC_ENABLE_VIDEO_ANALYSIS', true),
      enableRealTimeFeedback: this.getBooleanEnvVar('NEXT_PUBLIC_ENABLE_REAL_TIME_FEEDBACK', true),
      enableMLPredictions: this.getBooleanEnvVar('NEXT_PUBLIC_ENABLE_ML_PREDICTIONS', true)
    }
  }

  private loadAppConfig(): AppConfig {
    return {
      appUrl: this.getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
      apiUrl: this.getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3000/api'),
      debugMode: this.getBooleanEnvVar('NEXT_PUBLIC_DEBUG_MODE', false),
      nodeEnv: this.getEnvVar('NODE_ENV', 'development')
    }
  }

  private getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key]
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue
      }
      throw new Error(`Environment variable ${key} is not set`)
    }
    return value
  }

  private getBooleanEnvVar(key: string, defaultValue: boolean): boolean {
    const value = process.env[key]
    if (value === undefined) {
      return defaultValue
    }
    return value.toLowerCase() === 'true'
  }

  private getNumberEnvVar(key: string, defaultValue: number): number {
    const value = process.env[key]
    if (value === undefined) {
      return defaultValue
    }
    const parsed = parseInt(value, 10)
    if (isNaN(parsed)) {
      console.warn(`Invalid number value for ${key}: ${value}. Using default: ${defaultValue}`)
      return defaultValue
    }
    return parsed
  }

  private getArrayEnvVar(key: string, defaultValue: string[]): string[] {
    const value = process.env[key]
    if (value === undefined) {
      return defaultValue
    }
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0)
  }

  // Validation methods
  validateVoiceConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      const config = this.voiceConfig
      
      if (!config.openaiApiKey || config.openaiApiKey === 'your_openai_api_key_here') {
        errors.push('Valid OpenAI API key is required')
      }

      if (config.preferredService === 'fallback' && typeof window !== 'undefined') {
        if (!('speechSynthesis' in window) || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
          errors.push('Web Speech API is not supported in this browser')
        }
      }

      if (config.supportedLanguages.length === 0) {
        errors.push('At least one supported language must be configured')
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown configuration error')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  validateInterviewConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      const config = this.interviewConfig

      if (config.maxDuration <= 0) {
        errors.push('Maximum interview duration must be greater than 0')
      }

      if (config.maxQuestionsPerInterview <= 0) {
        errors.push('Maximum questions per interview must be greater than 0')
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown configuration error')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Feature flag helpers
  isFeatureEnabled(feature: keyof InterviewConfig): boolean {
    try {
      const config = this.interviewConfig
      return Boolean(config[feature])
    } catch {
      return false
    }
  }

  // Development helpers
  isDevelopment(): boolean {
    return this.appConfig.nodeEnv === 'development'
  }

  isProduction(): boolean {
    return this.appConfig.nodeEnv === 'production'
  }

  isDebugMode(): boolean {
    return this.appConfig.debugMode
  }

  // Configuration updates (for runtime configuration changes)
  updateVoiceConfig(updates: Partial<VoiceConfig>): void {
    if (this._voiceConfig) {
      this._voiceConfig = { ...this._voiceConfig, ...updates }
    }
  }

  updateInterviewConfig(updates: Partial<InterviewConfig>): void {
    if (this._interviewConfig) {
      this._interviewConfig = { ...this._interviewConfig, ...updates }
    }
  }

  // Reset configuration (useful for testing)
  reset(): void {
    this._voiceConfig = null
    this._interviewConfig = null
    this._appConfig = null
  }

  // Get all configuration as a single object (useful for debugging)
  getAllConfig() {
    return {
      voice: this.voiceConfig,
      interview: this.interviewConfig,
      app: this.appConfig
    }
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance()

// Export individual configurations for convenience
export const voiceConfig = config.voiceConfig
export const interviewConfig = config.interviewConfig
export const appConfig = config.appConfig

// Export validation functions
export const validateConfiguration = () => {
  const voiceValidation = config.validateVoiceConfig()
  const interviewValidation = config.validateInterviewConfig()

  return {
    isValid: voiceValidation.isValid && interviewValidation.isValid,
    errors: [...voiceValidation.errors, ...interviewValidation.errors]
  }
}

// Export feature flag helper
export const isFeatureEnabled = (feature: keyof InterviewConfig): boolean => {
  return config.isFeatureEnabled(feature)
}

// Export environment helpers
export const isDevelopment = (): boolean => config.isDevelopment()
export const isProduction = (): boolean => config.isProduction()
export const isDebugMode = (): boolean => config.isDebugMode()

// Default export
export default config
