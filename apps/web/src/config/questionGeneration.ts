/**
 * Enhanced Question Generation Configuration
 * Configuration for web scraping, STAR framework, and quality assurance
 */

export interface WebScrapingConfig {
  enabled: boolean
  rateLimitMs: number
  maxRetries: number
  timeout: number
  userAgent: string
  respectRobotsTxt: boolean
  platforms: {
    linkedin: boolean
    indeed: boolean
    glassdoor: boolean
  }
  cacheDuration: number
}

export interface QuestionQualityConfig {
  freshnessThreshold: number
  relevanceThreshold: number
  enableCompanySpecific: boolean
  enableIndustryTrends: boolean
  enableSampleAnswers: boolean
  duplicateDetectionEnabled: boolean
  qualityScoreThreshold: number
}

export interface STARFrameworkConfig {
  enabled: boolean
  minLength: number
  maxLength: number
  targetDuration: number
  includeKeyPoints: boolean
  includeTips: boolean
  includeCommonMistakes: boolean
}

export interface PerformanceConfig {
  caching: {
    enabled: boolean
    ttl: number
    maxSize: number
    questionCacheTtl: number
    companyInsightsCacheTtl: number
    industryTrendsCacheTtl: number
  }
  rateLimit: {
    enabled: boolean
    windowMs: number
    maxRequests: number
    skipFailedRequests: boolean
  }
}

export interface MonitoringConfig {
  analytics: {
    enabled: boolean
    apiKey: string
    projectId: string
  }
  performance: {
    enabled: boolean
    sampleRate: number
    slowQueryThreshold: number
  }
  errorReporting: {
    enabled: boolean
    apiKey: string
  }
  questionMetrics: {
    enabled: boolean
    feedbackCollection: boolean
    qualityTracking: boolean
  }
}

export interface EnhancedQuestionGenerationConfig {
  webScraping: WebScrapingConfig
  quality: QuestionQualityConfig
  starFramework: STARFrameworkConfig
  performance: PerformanceConfig
  monitoring: MonitoringConfig
}

class QuestionGenerationConfigService {
  private static instance: QuestionGenerationConfigService
  private config: EnhancedQuestionGenerationConfig

  private constructor() {
    this.config = this.loadConfiguration()
  }

  public static getInstance(): QuestionGenerationConfigService {
    if (!QuestionGenerationConfigService.instance) {
      QuestionGenerationConfigService.instance = new QuestionGenerationConfigService()
    }
    return QuestionGenerationConfigService.instance
  }

  private loadConfiguration(): EnhancedQuestionGenerationConfig {
    return {
      webScraping: {
        enabled: process.env.NEXT_PUBLIC_ENABLE_WEB_SCRAPING === 'true',
        rateLimitMs: parseInt(process.env.WEB_SCRAPING_RATE_LIMIT || '2000'),
        maxRetries: parseInt(process.env.WEB_SCRAPING_MAX_RETRIES || '3'),
        timeout: parseInt(process.env.WEB_SCRAPING_TIMEOUT || '10000'),
        userAgent: process.env.WEB_SCRAPING_USER_AGENT || 'InterviewSpark-Bot/1.0',
        respectRobotsTxt: process.env.WEB_SCRAPING_RESPECT_ROBOTS_TXT !== 'false',
        platforms: {
          linkedin: process.env.LINKEDIN_SCRAPING_ENABLED !== 'false',
          indeed: process.env.INDEED_SCRAPING_ENABLED !== 'false',
          glassdoor: process.env.GLASSDOOR_SCRAPING_ENABLED !== 'false'
        },
        cacheDuration: parseInt(process.env.WEB_SCRAPING_CACHE_DURATION || '86400000')
      },
      quality: {
        freshnessThreshold: parseFloat(process.env.NEXT_PUBLIC_QUESTION_FRESHNESS_THRESHOLD || '0.7'),
        relevanceThreshold: parseFloat(process.env.NEXT_PUBLIC_QUESTION_RELEVANCE_THRESHOLD || '0.7'),
        enableCompanySpecific: process.env.NEXT_PUBLIC_ENABLE_COMPANY_SPECIFIC_QUESTIONS === 'true',
        enableIndustryTrends: process.env.NEXT_PUBLIC_ENABLE_INDUSTRY_TRENDS === 'true',
        enableSampleAnswers: process.env.NEXT_PUBLIC_ENABLE_SAMPLE_ANSWERS === 'true',
        duplicateDetectionEnabled: true,
        qualityScoreThreshold: parseFloat(process.env.QUALITY_SCORE_THRESHOLD || '0.8')
      },
      starFramework: {
        enabled: process.env.NEXT_PUBLIC_ENABLE_STAR_FRAMEWORK === 'true',
        minLength: parseInt(process.env.STAR_ANSWER_MIN_LENGTH || '200'),
        maxLength: parseInt(process.env.STAR_ANSWER_MAX_LENGTH || '800'),
        targetDuration: parseInt(process.env.STAR_ANSWER_TARGET_DURATION || '120'),
        includeKeyPoints: true,
        includeTips: true,
        includeCommonMistakes: true
      },
      performance: {
        caching: {
          enabled: !!process.env.REDIS_URL,
          ttl: parseInt(process.env.CACHE_TTL || '3600'),
          maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
          questionCacheTtl: parseInt(process.env.QUESTION_CACHE_TTL || '86400'),
          companyInsightsCacheTtl: parseInt(process.env.COMPANY_INSIGHTS_CACHE_TTL || '604800'),
          industryTrendsCacheTtl: parseInt(process.env.INDUSTRY_TRENDS_CACHE_TTL || '86400')
        },
        rateLimit: {
          enabled: process.env.RATE_LIMIT_ENABLED === 'true',
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
          skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED_REQUESTS === 'true'
        }
      },
      monitoring: {
        analytics: {
          enabled: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
          apiKey: process.env.ANALYTICS_API_KEY || '',
          projectId: process.env.ANALYTICS_PROJECT_ID || ''
        },
        performance: {
          enabled: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true',
          sampleRate: parseFloat(process.env.PERFORMANCE_SAMPLE_RATE || '0.1'),
          slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000')
        },
        errorReporting: {
          enabled: process.env.ERROR_REPORTING_ENABLED === 'true',
          apiKey: process.env.ERROR_REPORTING_API_KEY || ''
        },
        questionMetrics: {
          enabled: process.env.NEXT_PUBLIC_ENABLE_QUESTION_METRICS === 'true',
          feedbackCollection: process.env.QUESTION_FEEDBACK_COLLECTION === 'true',
          qualityTracking: process.env.QUALITY_SCORE_THRESHOLD !== undefined
        }
      }
    }
  }

  public getConfiguration(): EnhancedQuestionGenerationConfig {
    return this.config
  }

  public getWebScrapingConfig(): WebScrapingConfig {
    return this.config.webScraping
  }

  public getQualityConfig(): QuestionQualityConfig {
    return this.config.quality
  }

  public getSTARFrameworkConfig(): STARFrameworkConfig {
    return this.config.starFramework
  }

  public getPerformanceConfig(): PerformanceConfig {
    return this.config.performance
  }

  public getMonitoringConfig(): MonitoringConfig {
    return this.config.monitoring
  }

  public isFeatureEnabled(feature: string): boolean {
    switch (feature) {
      case 'webScraping':
        return this.config.webScraping.enabled
      case 'companySpecific':
        return this.config.quality.enableCompanySpecific
      case 'industryTrends':
        return this.config.quality.enableIndustryTrends
      case 'sampleAnswers':
        return this.config.quality.enableSampleAnswers
      case 'starFramework':
        return this.config.starFramework.enabled
      case 'caching':
        return this.config.performance.caching.enabled
      case 'rateLimit':
        return this.config.performance.rateLimit.enabled
      case 'analytics':
        return this.config.monitoring.analytics.enabled
      case 'questionMetrics':
        return this.config.monitoring.questionMetrics.enabled
      default:
        return false
    }
  }

  public validateConfiguration(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate web scraping configuration
    if (this.config.webScraping.enabled) {
      if (this.config.webScraping.rateLimitMs < 1000) {
        warnings.push('Web scraping rate limit is very low, may cause rate limiting issues')
      }
      if (!Object.values(this.config.webScraping.platforms).some(enabled => enabled)) {
        errors.push('Web scraping is enabled but no platforms are configured')
      }
    }

    // Validate quality thresholds
    if (this.config.quality.freshnessThreshold < 0 || this.config.quality.freshnessThreshold > 1) {
      errors.push('Freshness threshold must be between 0 and 1')
    }
    if (this.config.quality.relevanceThreshold < 0 || this.config.quality.relevanceThreshold > 1) {
      errors.push('Relevance threshold must be between 0 and 1')
    }

    // Validate STAR framework configuration
    if (this.config.starFramework.enabled) {
      if (this.config.starFramework.minLength >= this.config.starFramework.maxLength) {
        errors.push('STAR framework min length must be less than max length')
      }
      if (this.config.starFramework.targetDuration <= 0) {
        errors.push('STAR framework target duration must be positive')
      }
    }

    // Validate caching configuration
    if (this.config.performance.caching.enabled && !process.env.REDIS_URL) {
      warnings.push('Caching is enabled but Redis URL is not configured')
    }

    // Validate monitoring configuration
    if (this.config.monitoring.analytics.enabled && !this.config.monitoring.analytics.apiKey) {
      warnings.push('Analytics is enabled but API key is not configured')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  public getFeatureStatus(): Record<string, boolean> {
    return {
      webScraping: this.isFeatureEnabled('webScraping'),
      companySpecific: this.isFeatureEnabled('companySpecific'),
      industryTrends: this.isFeatureEnabled('industryTrends'),
      sampleAnswers: this.isFeatureEnabled('sampleAnswers'),
      starFramework: this.isFeatureEnabled('starFramework'),
      caching: this.isFeatureEnabled('caching'),
      rateLimit: this.isFeatureEnabled('rateLimit'),
      analytics: this.isFeatureEnabled('analytics'),
      questionMetrics: this.isFeatureEnabled('questionMetrics')
    }
  }

  public updateConfig(updates: Partial<EnhancedQuestionGenerationConfig>): void {
    this.config = { ...this.config, ...updates }
  }
}

// Export singleton instance
export const questionGenerationConfig = QuestionGenerationConfigService.getInstance()

// Export utility functions
export const validateQuestionGenerationConfig = () => questionGenerationConfig.validateConfiguration()
export const isQuestionFeatureEnabled = (feature: string) => questionGenerationConfig.isFeatureEnabled(feature)
export const getQuestionGenerationFeatureStatus = () => questionGenerationConfig.getFeatureStatus()
