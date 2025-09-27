/**
 * Intelligent Rate Limiting Service
 * Handles rate limiting for API endpoints and LLM provider calls
 */

import { cacheService } from './cacheService'
import { Request } from 'express'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: Request) => string
  onLimitReached?: (req: Request) => void
  whitelist?: string[] // IPs or user IDs to whitelist
  blacklist?: string[] // IPs or user IDs to blacklist
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number // Unix timestamp
  retryAfter?: number // Seconds to wait
}

export interface RateLimitResult {
  allowed: boolean
  info: RateLimitInfo
  reason?: string
}

export interface LLMRateLimitConfig {
  provider: string
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  tokensPerMinute?: number
  costPerHour?: number // Dollar amount
}

class RateLimitService {
  private readonly RATE_LIMIT_PREFIX = 'rl'
  private readonly LLM_LIMIT_PREFIX = 'llm_rl'
  
  // Default rate limit configurations
  private readonly DEFAULT_CONFIGS = {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    },
    questionGeneration: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10
    },
    llmCalls: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20
    },
    webScraping: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5
    }
  }

  // LLM provider rate limits
  private readonly LLM_CONFIGS: Record<string, LLMRateLimitConfig> = {
    openai: {
      provider: 'openai',
      requestsPerMinute: 60,
      requestsPerHour: 3000,
      requestsPerDay: 10000,
      tokensPerMinute: 150000,
      costPerHour: 10
    },
    gemini: {
      provider: 'gemini',
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 5000,
      tokensPerMinute: 100000,
      costPerHour: 5
    },
    claude: {
      provider: 'claude',
      requestsPerMinute: 50,
      requestsPerHour: 1000,
      requestsPerDay: 5000,
      tokensPerMinute: 100000,
      costPerHour: 8
    }
  }

  /**
   * Check rate limit for API endpoints
   */
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `${this.RATE_LIMIT_PREFIX}:${identifier}`
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    try {
      // Get current request count
      const currentCount = await this.getCurrentCount(key, windowStart, now)
      
      // Check if limit exceeded
      if (currentCount >= config.maxRequests) {
        const resetTime = await this.getResetTime(key, config.windowMs)
        const retryAfter = Math.ceil((resetTime - now) / 1000)
        
        return {
          allowed: false,
          info: {
            limit: config.maxRequests,
            remaining: 0,
            reset: resetTime,
            retryAfter
          },
          reason: 'Rate limit exceeded'
        }
      }
      
      // Increment counter
      await this.incrementCounter(key, now, config.windowMs)
      
      return {
        allowed: true,
        info: {
          limit: config.maxRequests,
          remaining: config.maxRequests - currentCount - 1,
          reset: now + config.windowMs
        }
      }
    } catch (error) {
      console.error('Rate limit check error:', error)
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        info: {
          limit: config.maxRequests,
          remaining: config.maxRequests,
          reset: now + config.windowMs
        }
      }
    }
  }

  /**
   * Check rate limit for LLM provider calls
   */
  async checkLLMRateLimit(
    provider: string,
    userId?: string,
    tokens?: number,
    cost?: number
  ): Promise<RateLimitResult> {
    const config = this.LLM_CONFIGS[provider]
    if (!config) {
      return {
        allowed: true,
        info: { limit: 1000, remaining: 1000, reset: Date.now() + 60000 }
      }
    }

    const identifier = userId ? `${provider}:${userId}` : provider
    const now = Date.now()
    
    // Check multiple time windows
    const checks = [
      { window: 60 * 1000, limit: config.requestsPerMinute, suffix: 'min' },
      { window: 60 * 60 * 1000, limit: config.requestsPerHour, suffix: 'hour' },
      { window: 24 * 60 * 60 * 1000, limit: config.requestsPerDay, suffix: 'day' }
    ]

    for (const check of checks) {
      const key = `${this.LLM_LIMIT_PREFIX}:${identifier}:${check.suffix}`
      const windowStart = now - check.window
      const currentCount = await this.getCurrentCount(key, windowStart, now)
      
      if (currentCount >= check.limit) {
        const resetTime = await this.getResetTime(key, check.window)
        const retryAfter = Math.ceil((resetTime - now) / 1000)
        
        return {
          allowed: false,
          info: {
            limit: check.limit,
            remaining: 0,
            reset: resetTime,
            retryAfter
          },
          reason: `${provider} ${check.suffix}ly rate limit exceeded`
        }
      }
    }

    // Check token limits if provided
    if (tokens && config.tokensPerMinute) {
      const tokenKey = `${this.LLM_LIMIT_PREFIX}:${identifier}:tokens:min`
      const tokenCount = await this.getCurrentTokenCount(tokenKey, now - 60 * 1000, now)
      
      if (tokenCount + tokens > config.tokensPerMinute) {
        return {
          allowed: false,
          info: {
            limit: config.tokensPerMinute,
            remaining: Math.max(0, config.tokensPerMinute - tokenCount),
            reset: now + 60 * 1000
          },
          reason: `${provider} token rate limit exceeded`
        }
      }
    }

    // Check cost limits if provided
    if (cost && config.costPerHour) {
      const costKey = `${this.LLM_LIMIT_PREFIX}:${identifier}:cost:hour`
      const currentCost = await this.getCurrentCost(costKey, now - 60 * 60 * 1000, now)
      
      if (currentCost + cost > config.costPerHour) {
        return {
          allowed: false,
          info: {
            limit: config.costPerHour,
            remaining: Math.max(0, config.costPerHour - currentCost),
            reset: now + 60 * 60 * 1000
          },
          reason: `${provider} cost limit exceeded`
        }
      }
    }

    // Increment all counters
    await this.incrementLLMCounters(identifier, provider, now, tokens, cost)
    
    return {
      allowed: true,
      info: {
        limit: config.requestsPerMinute,
        remaining: config.requestsPerMinute - await this.getCurrentCount(
          `${this.LLM_LIMIT_PREFIX}:${identifier}:min`, 
          now - 60 * 1000, 
          now
        ) - 1,
        reset: now + 60 * 1000
      }
    }
  }

  /**
   * Get current request count in time window
   */
  private async getCurrentCount(
    key: string, 
    windowStart: number, 
    now: number
  ): Promise<number> {
    try {
      // Use Redis sorted set to track requests by timestamp
      const redis = (cacheService as any).redis
      if (!redis) return 0
      
      // Remove expired entries
      await redis.zremrangebyscore(key, 0, windowStart)
      
      // Count current entries
      const count = await redis.zcard(key)
      return count
    } catch (error) {
      console.error('Error getting current count:', error)
      return 0
    }
  }

  /**
   * Get current token count in time window
   */
  private async getCurrentTokenCount(
    key: string,
    windowStart: number,
    now: number
  ): Promise<number> {
    try {
      const redis = (cacheService as any).redis
      if (!redis) return 0
      
      // Remove expired entries
      await redis.zremrangebyscore(key, 0, windowStart)
      
      // Sum token counts
      const entries = await redis.zrangebyscore(key, windowStart, now, 'WITHSCORES')
      let totalTokens = 0
      
      for (let i = 1; i < entries.length; i += 2) {
        totalTokens += parseInt(entries[i])
      }
      
      return totalTokens
    } catch (error) {
      console.error('Error getting token count:', error)
      return 0
    }
  }

  /**
   * Get current cost in time window
   */
  private async getCurrentCost(
    key: string,
    windowStart: number,
    now: number
  ): Promise<number> {
    try {
      const redis = (cacheService as any).redis
      if (!redis) return 0
      
      // Remove expired entries
      await redis.zremrangebyscore(key, 0, windowStart)
      
      // Sum costs
      const entries = await redis.zrangebyscore(key, windowStart, now, 'WITHSCORES')
      let totalCost = 0
      
      for (let i = 1; i < entries.length; i += 2) {
        totalCost += parseFloat(entries[i])
      }
      
      return totalCost
    } catch (error) {
      console.error('Error getting cost:', error)
      return 0
    }
  }

  /**
   * Increment request counter
   */
  private async incrementCounter(
    key: string,
    timestamp: number,
    windowMs: number
  ): Promise<void> {
    try {
      const redis = (cacheService as any).redis
      if (!redis) return
      
      // Add current request with timestamp as score
      await redis.zadd(key, timestamp, `${timestamp}-${Math.random()}`)
      
      // Set expiration
      await redis.expire(key, Math.ceil(windowMs / 1000))
    } catch (error) {
      console.error('Error incrementing counter:', error)
    }
  }

  /**
   * Increment LLM counters
   */
  private async incrementLLMCounters(
    identifier: string,
    provider: string,
    timestamp: number,
    tokens?: number,
    cost?: number
  ): Promise<void> {
    try {
      const redis = (cacheService as any).redis
      if (!redis) return
      
      const pipeline = redis.pipeline()
      const requestId = `${timestamp}-${Math.random()}`
      
      // Increment request counters
      const windows = [
        { suffix: 'min', ttl: 60 },
        { suffix: 'hour', ttl: 3600 },
        { suffix: 'day', ttl: 86400 }
      ]
      
      for (const window of windows) {
        const key = `${this.LLM_LIMIT_PREFIX}:${identifier}:${window.suffix}`
        pipeline.zadd(key, timestamp, requestId)
        pipeline.expire(key, window.ttl)
      }
      
      // Increment token counter if provided
      if (tokens) {
        const tokenKey = `${this.LLM_LIMIT_PREFIX}:${identifier}:tokens:min`
        pipeline.zadd(tokenKey, tokens, requestId)
        pipeline.expire(tokenKey, 60)
      }
      
      // Increment cost counter if provided
      if (cost) {
        const costKey = `${this.LLM_LIMIT_PREFIX}:${identifier}:cost:hour`
        pipeline.zadd(costKey, cost, requestId)
        pipeline.expire(costKey, 3600)
      }
      
      await pipeline.exec()
    } catch (error) {
      console.error('Error incrementing LLM counters:', error)
    }
  }

  /**
   * Get reset time for rate limit window
   */
  private async getResetTime(key: string, windowMs: number): Promise<number> {
    try {
      const redis = (cacheService as any).redis
      if (!redis) return Date.now() + windowMs
      
      const ttl = await redis.ttl(key)
      return Date.now() + (ttl * 1000)
    } catch (error) {
      return Date.now() + windowMs
    }
  }

  /**
   * Get rate limit status for user
   */
  async getRateLimitStatus(
    identifier: string,
    type: 'api' | 'questionGeneration' | 'llmCalls' | 'webScraping' = 'api'
  ): Promise<RateLimitInfo> {
    const config = this.DEFAULT_CONFIGS[type]
    const key = `${this.RATE_LIMIT_PREFIX}:${identifier}`
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    const currentCount = await this.getCurrentCount(key, windowStart, now)
    const resetTime = await this.getResetTime(key, config.windowMs)
    
    return {
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - currentCount),
      reset: resetTime
    }
  }

  /**
   * Get LLM rate limit status
   */
  async getLLMRateLimitStatus(provider: string, userId?: string): Promise<{
    minute: RateLimitInfo
    hour: RateLimitInfo
    day: RateLimitInfo
  }> {
    const config = this.LLM_CONFIGS[provider]
    if (!config) {
      const defaultInfo = { limit: 1000, remaining: 1000, reset: Date.now() + 60000 }
      return { minute: defaultInfo, hour: defaultInfo, day: defaultInfo }
    }

    const identifier = userId ? `${provider}:${userId}` : provider
    const now = Date.now()
    
    const [minuteCount, hourCount, dayCount] = await Promise.all([
      this.getCurrentCount(`${this.LLM_LIMIT_PREFIX}:${identifier}:min`, now - 60 * 1000, now),
      this.getCurrentCount(`${this.LLM_LIMIT_PREFIX}:${identifier}:hour`, now - 60 * 60 * 1000, now),
      this.getCurrentCount(`${this.LLM_LIMIT_PREFIX}:${identifier}:day`, now - 24 * 60 * 60 * 1000, now)
    ])
    
    return {
      minute: {
        limit: config.requestsPerMinute,
        remaining: Math.max(0, config.requestsPerMinute - minuteCount),
        reset: now + 60 * 1000
      },
      hour: {
        limit: config.requestsPerHour,
        remaining: Math.max(0, config.requestsPerHour - hourCount),
        reset: now + 60 * 60 * 1000
      },
      day: {
        limit: config.requestsPerDay,
        remaining: Math.max(0, config.requestsPerDay - dayCount),
        reset: now + 24 * 60 * 60 * 1000
      }
    }
  }

  /**
   * Reset rate limit for identifier
   */
  async resetRateLimit(identifier: string, type?: string): Promise<boolean> {
    try {
      const redis = (cacheService as any).redis
      if (!redis) return false
      
      const pattern = type 
        ? `${this.RATE_LIMIT_PREFIX}:${identifier}:${type}*`
        : `${this.RATE_LIMIT_PREFIX}:${identifier}*`
      
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
      
      return true
    } catch (error) {
      console.error('Error resetting rate limit:', error)
      return false
    }
  }

  /**
   * Get default configurations
   */
  getDefaultConfigs() {
    return this.DEFAULT_CONFIGS
  }

  /**
   * Get LLM configurations
   */
  getLLMConfigs() {
    return this.LLM_CONFIGS
  }
}

// Export singleton instance
export const rateLimitService = new RateLimitService()
export default rateLimitService
