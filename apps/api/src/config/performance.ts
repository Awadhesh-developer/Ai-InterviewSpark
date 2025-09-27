/**
 * Performance Optimization Configuration
 * Centralized configuration for all performance-related services
 */

export interface PerformanceConfig {
  cache: {
    enabled: boolean
    redis: {
      url: string
      maxRetries: number
      retryDelayOnFailover: number
      connectTimeout: number
      commandTimeout: number
      keepAlive: number
    }
    defaultTTL: {
      questions: number
      companyInsights: number
      industryTrends: number
      llmResponses: number
      sampleAnswers: number
      userSessions: number
      apiResponses: number
    }
    compression: {
      enabled: boolean
      threshold: number // bytes
    }
  }
  
  rateLimit: {
    enabled: boolean
    api: {
      windowMs: number
      maxRequests: number
    }
    questionGeneration: {
      windowMs: number
      maxRequests: number
    }
    webScraping: {
      windowMs: number
      maxRequests: number
    }
    llm: {
      openai: {
        requestsPerMinute: number
        requestsPerHour: number
        requestsPerDay: number
        tokensPerMinute: number
        costPerHour: number
      }
      gemini: {
        requestsPerMinute: number
        requestsPerHour: number
        requestsPerDay: number
        tokensPerMinute: number
        costPerHour: number
      }
      claude: {
        requestsPerMinute: number
        requestsPerHour: number
        requestsPerDay: number
        tokensPerMinute: number
        costPerHour: number
      }
    }
  }
  
  database: {
    pool: {
      min: number
      max: number
      idleTimeoutMillis: number
      connectionTimeoutMillis: number
      acquireTimeoutMillis: number
    }
    optimization: {
      slowQueryThreshold: number
      maxMetricsHistory: number
      enableQueryAnalysis: boolean
      autoIndexCreation: boolean
    }
    monitoring: {
      enabled: boolean
      intervalMs: number
      alertThresholds: {
        responseTime: { warning: number; critical: number }
        errorRate: { warning: number; critical: number }
        connectionCount: { warning: number; critical: number }
      }
    }
  }
  
  llmThrottling: {
    enabled: boolean
    maxConcurrentRequests: {
      openai: number
      gemini: number
      claude: number
    }
    queueLimits: {
      maxQueueSize: number
      maxRetries: number
      retryDelays: number[]
    }
    healthCheck: {
      intervalMs: number
      timeoutMs: number
      maxConsecutiveFailures: number
    }
  }
  
  monitoring: {
    enabled: boolean
    intervalMs: number
    metricsRetentionHours: number
    alertRetentionHours: number
    thresholds: {
      cpu: { warning: number; critical: number }
      memory: { warning: number; critical: number }
      responseTime: { warning: number; critical: number }
      errorRate: { warning: number; critical: number }
      cacheHitRate: { warning: number; critical: number }
    }
    alerts: {
      enabled: boolean
      webhookUrl?: string
      emailNotifications?: {
        enabled: boolean
        recipients: string[]
        smtpConfig: {
          host: string
          port: number
          secure: boolean
          auth: {
            user: string
            pass: string
          }
        }
      }
    }
  }
  
  optimization: {
    enableCompression: boolean
    enableEtags: boolean
    enableCors: boolean
    requestSizeLimit: string
    enableRequestLogging: boolean
    enablePerformanceHeaders: boolean
  }
}

// Default configuration
const defaultConfig: PerformanceConfig = {
  cache: {
    enabled: process.env.REDIS_ENABLED === 'true',
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000'),
      keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE || '30000')
    },
    defaultTTL: {
      questions: 24 * 60 * 60, // 24 hours
      companyInsights: 7 * 24 * 60 * 60, // 7 days
      industryTrends: 24 * 60 * 60, // 24 hours
      llmResponses: 60 * 60, // 1 hour
      sampleAnswers: 24 * 60 * 60, // 24 hours
      userSessions: 30 * 60, // 30 minutes
      apiResponses: 5 * 60 // 5 minutes
    },
    compression: {
      enabled: true,
      threshold: 1024 // 1KB
    }
  },
  
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    api: {
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.API_RATE_LIMIT_MAX || '100')
    },
    questionGeneration: {
      windowMs: parseInt(process.env.QUESTION_RATE_LIMIT_WINDOW || '60000'), // 1 minute
      maxRequests: parseInt(process.env.QUESTION_RATE_LIMIT_MAX || '10')
    },
    webScraping: {
      windowMs: parseInt(process.env.SCRAPING_RATE_LIMIT_WINDOW || '60000'), // 1 minute
      maxRequests: parseInt(process.env.SCRAPING_RATE_LIMIT_MAX || '5')
    },
    llm: {
      openai: {
        requestsPerMinute: parseInt(process.env.OPENAI_RPM || '50'),
        requestsPerHour: parseInt(process.env.OPENAI_RPH || '3000'),
        requestsPerDay: parseInt(process.env.OPENAI_RPD || '10000'),
        tokensPerMinute: parseInt(process.env.OPENAI_TPM || '150000'),
        costPerHour: parseFloat(process.env.OPENAI_COST_LIMIT || '10')
      },
      gemini: {
        requestsPerMinute: parseInt(process.env.GEMINI_RPM || '16'),
        requestsPerHour: parseInt(process.env.GEMINI_RPH || '1000'),
        requestsPerDay: parseInt(process.env.GEMINI_RPD || '5000'),
        tokensPerMinute: parseInt(process.env.GEMINI_TPM || '100000'),
        costPerHour: parseFloat(process.env.GEMINI_COST_LIMIT || '5')
      },
      claude: {
        requestsPerMinute: parseInt(process.env.CLAUDE_RPM || '16'),
        requestsPerHour: parseInt(process.env.CLAUDE_RPH || '1000'),
        requestsPerDay: parseInt(process.env.CLAUDE_RPD || '5000'),
        tokensPerMinute: parseInt(process.env.CLAUDE_TPM || '100000'),
        costPerHour: parseFloat(process.env.CLAUDE_COST_LIMIT || '8')
      }
    }
  },
  
  database: {
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '5'),
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
      acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000')
    },
    optimization: {
      slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000'),
      maxMetricsHistory: parseInt(process.env.DB_MAX_METRICS_HISTORY || '1000'),
      enableQueryAnalysis: process.env.DB_ENABLE_QUERY_ANALYSIS === 'true',
      autoIndexCreation: process.env.DB_AUTO_INDEX_CREATION === 'true'
    },
    monitoring: {
      enabled: process.env.DB_MONITORING_ENABLED !== 'false',
      intervalMs: parseInt(process.env.DB_MONITORING_INTERVAL || '30000'),
      alertThresholds: {
        responseTime: {
          warning: parseInt(process.env.DB_RESPONSE_TIME_WARNING || '1000'),
          critical: parseInt(process.env.DB_RESPONSE_TIME_CRITICAL || '3000')
        },
        errorRate: {
          warning: parseFloat(process.env.DB_ERROR_RATE_WARNING || '5'),
          critical: parseFloat(process.env.DB_ERROR_RATE_CRITICAL || '10')
        },
        connectionCount: {
          warning: parseInt(process.env.DB_CONNECTION_WARNING || '15'),
          critical: parseInt(process.env.DB_CONNECTION_CRITICAL || '18')
        }
      }
    }
  },
  
  llmThrottling: {
    enabled: process.env.LLM_THROTTLING_ENABLED !== 'false',
    maxConcurrentRequests: {
      openai: parseInt(process.env.LLM_OPENAI_CONCURRENT || '5'),
      gemini: parseInt(process.env.LLM_GEMINI_CONCURRENT || '3'),
      claude: parseInt(process.env.LLM_CLAUDE_CONCURRENT || '3')
    },
    queueLimits: {
      maxQueueSize: parseInt(process.env.LLM_MAX_QUEUE_SIZE || '100'),
      maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3'),
      retryDelays: [1000, 2000, 5000, 10000]
    },
    healthCheck: {
      intervalMs: parseInt(process.env.LLM_HEALTH_CHECK_INTERVAL || '30000'),
      timeoutMs: parseInt(process.env.LLM_HEALTH_CHECK_TIMEOUT || '10000'),
      maxConsecutiveFailures: parseInt(process.env.LLM_MAX_CONSECUTIVE_FAILURES || '3')
    }
  },
  
  monitoring: {
    enabled: process.env.PERFORMANCE_MONITORING_ENABLED !== 'false',
    intervalMs: parseInt(process.env.MONITORING_INTERVAL || '30000'),
    metricsRetentionHours: parseInt(process.env.METRICS_RETENTION_HOURS || '168'), // 7 days
    alertRetentionHours: parseInt(process.env.ALERT_RETENTION_HOURS || '168'), // 7 days
    thresholds: {
      cpu: {
        warning: parseFloat(process.env.CPU_WARNING_THRESHOLD || '70'),
        critical: parseFloat(process.env.CPU_CRITICAL_THRESHOLD || '90')
      },
      memory: {
        warning: parseFloat(process.env.MEMORY_WARNING_THRESHOLD || '80'),
        critical: parseFloat(process.env.MEMORY_CRITICAL_THRESHOLD || '95')
      },
      responseTime: {
        warning: parseInt(process.env.RESPONSE_TIME_WARNING || '2000'),
        critical: parseInt(process.env.RESPONSE_TIME_CRITICAL || '5000')
      },
      errorRate: {
        warning: parseFloat(process.env.ERROR_RATE_WARNING || '5'),
        critical: parseFloat(process.env.ERROR_RATE_CRITICAL || '10')
      },
      cacheHitRate: {
        warning: parseFloat(process.env.CACHE_HIT_RATE_WARNING || '70'),
        critical: parseFloat(process.env.CACHE_HIT_RATE_CRITICAL || '50')
      }
    },
    alerts: {
      enabled: process.env.ALERTS_ENABLED === 'true',
      webhookUrl: process.env.ALERT_WEBHOOK_URL,
      emailNotifications: process.env.EMAIL_ALERTS_ENABLED === 'true' ? {
        enabled: true,
        recipients: (process.env.ALERT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
        smtpConfig: {
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
          }
        }
      } : undefined
    }
  },
  
  optimization: {
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    enableEtags: process.env.ENABLE_ETAGS !== 'false',
    enableCors: process.env.ENABLE_CORS !== 'false',
    requestSizeLimit: process.env.REQUEST_SIZE_LIMIT || '10mb',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
    enablePerformanceHeaders: process.env.ENABLE_PERFORMANCE_HEADERS !== 'false'
  }
}

// Validate configuration
function validateConfig(config: PerformanceConfig): void {
  const errors: string[] = []
  
  // Validate cache configuration
  if (config.cache.enabled && !config.cache.redis.url) {
    errors.push('Redis URL is required when caching is enabled')
  }
  
  // Validate database pool configuration
  if (config.database.pool.min > config.database.pool.max) {
    errors.push('Database pool min cannot be greater than max')
  }
  
  // Validate monitoring thresholds
  Object.entries(config.monitoring.thresholds).forEach(([key, threshold]) => {
    // For cache hit rate, higher is better, so warning should be higher than critical
    if (key === 'cacheHitRate') {
      if (threshold.warning <= threshold.critical) {
        errors.push(`${key} warning threshold must be greater than critical threshold`)
      }
    } else {
      // For other metrics, lower is better, so warning should be less than critical
      if (threshold.warning >= threshold.critical) {
        errors.push(`${key} warning threshold must be less than critical threshold`)
      }
    }
  })
  
  // Validate LLM rate limits
  Object.entries(config.rateLimit.llm).forEach(([provider, limits]) => {
    if (limits.requestsPerMinute > limits.requestsPerHour / 60) {
      errors.push(`${provider} requests per minute exceeds hourly limit`)
    }
  })
  
  if (errors.length > 0) {
    throw new Error(`Performance configuration validation failed:\n${errors.join('\n')}`)
  }
}

// Load and validate configuration
let performanceConfig: PerformanceConfig
try {
  performanceConfig = defaultConfig
  validateConfig(performanceConfig)
  console.log('✅ Performance configuration loaded and validated')
} catch (error) {
  console.error('❌ Performance configuration error:', error)
  process.exit(1)
}

export { performanceConfig }
export default performanceConfig
