/**
 * Rate Limiting Middleware for Express
 * Provides intelligent rate limiting for different endpoint types
 */

import { Request, Response, NextFunction } from 'express'
import { rateLimitService, RateLimitConfig } from '../services/rateLimitService'

export interface RateLimitMiddlewareOptions extends RateLimitConfig {
  message?: string | ((req: Request, info: any) => string)
  standardHeaders?: boolean // Send standard rate limit headers
  legacyHeaders?: boolean // Send legacy X-RateLimit headers
  skipOnError?: boolean // Skip rate limiting if Redis is down
}

/**
 * Create rate limiting middleware
 */
export function createRateLimitMiddleware(options: RateLimitMiddlewareOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate identifier for rate limiting
      const identifier = generateIdentifier(req, options.keyGenerator)
      
      // Check whitelist/blacklist
      if (options.whitelist && options.whitelist.includes(identifier)) {
        return next()
      }
      
      if (options.blacklist && options.blacklist.includes(identifier)) {
        return sendRateLimitResponse(res, {
          allowed: false,
          info: { limit: 0, remaining: 0, reset: Date.now() },
          reason: 'Blacklisted'
        }, options)
      }
      
      // Check rate limit
      const result = await rateLimitService.checkRateLimit(identifier, options)
      
      // Set rate limit headers
      setRateLimitHeaders(res, result.info, options)
      
      if (!result.allowed) {
        // Call onLimitReached callback if provided
        if (options.onLimitReached) {
          options.onLimitReached(req)
        }
        
        return sendRateLimitResponse(res, result, options)
      }
      
      next()
    } catch (error) {
      console.error('Rate limit middleware error:', error)
      
      if (options.skipOnError) {
        next()
      } else {
        res.status(500).json({ error: 'Rate limiting service unavailable' })
      }
    }
  }
}

/**
 * Generate identifier for rate limiting
 */
function generateIdentifier(req: Request, keyGenerator?: (req: Request) => string): string {
  if (keyGenerator) {
    return keyGenerator(req)
  }
  
  // Default: use user ID if authenticated, otherwise IP
  const userId = (req as any).user?.id
  if (userId) {
    return `user:${userId}`
  }
  
  // Get IP address (considering proxies)
  const ip = req.ip || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip']
  
  return `ip:${ip}`
}

/**
 * Set rate limit headers
 */
function setRateLimitHeaders(
  res: Response, 
  info: any, 
  options: RateLimitMiddlewareOptions
): void {
  if (options.standardHeaders !== false) {
    res.set('RateLimit-Limit', info.limit.toString())
    res.set('RateLimit-Remaining', info.remaining.toString())
    res.set('RateLimit-Reset', new Date(info.reset).toISOString())
    
    if (info.retryAfter) {
      res.set('Retry-After', info.retryAfter.toString())
    }
  }
  
  if (options.legacyHeaders) {
    res.set('X-RateLimit-Limit', info.limit.toString())
    res.set('X-RateLimit-Remaining', info.remaining.toString())
    res.set('X-RateLimit-Reset', Math.ceil(info.reset / 1000).toString())
  }
}

/**
 * Send rate limit exceeded response
 */
function sendRateLimitResponse(
  res: Response, 
  result: any, 
  options: RateLimitMiddlewareOptions
): void {
  const message = typeof options.message === 'function' 
    ? options.message({} as Request, result.info)
    : options.message || 'Too many requests, please try again later.'
  
  res.status(429).json({
    error: 'Rate limit exceeded',
    message,
    retryAfter: result.info.retryAfter,
    limit: result.info.limit,
    remaining: result.info.remaining,
    reset: result.info.reset
  })
}

/**
 * General API rate limiting middleware
 */
export const apiRateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many API requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: true,
  skipOnError: true
})

/**
 * Question generation rate limiting middleware
 */
export const questionGenerationRateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many question generation requests, please try again in a minute.',
  keyGenerator: (req) => {
    const userId = (req as any).user?.id
    return userId ? `question-gen:user:${userId}` : `question-gen:ip:${req.ip}`
  },
  onLimitReached: (req) => {
    console.warn(`Question generation rate limit reached for ${req.ip}`)
  },
  standardHeaders: true,
  skipOnError: true
})

/**
 * Web scraping rate limiting middleware
 */
export const webScrapingRateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: 'Too many web scraping requests, please try again later.',
  keyGenerator: (req) => {
    return `web-scraping:ip:${req.ip}`
  },
  standardHeaders: true,
  skipOnError: true
})

/**
 * Sample answer generation rate limiting middleware
 */
export const sampleAnswerRateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  message: 'Too many sample answer requests, please try again later.',
  keyGenerator: (req) => {
    const userId = (req as any).user?.id
    return userId ? `sample-answer:user:${userId}` : `sample-answer:ip:${req.ip}`
  },
  standardHeaders: true,
  skipOnError: true
})

/**
 * LLM provider rate limiting middleware
 */
export function createLLMRateLimitMiddleware(provider: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id
      const tokens = req.body?.maxTokens || req.body?.tokens
      const estimatedCost = req.body?.estimatedCost
      
      const result = await rateLimitService.checkLLMRateLimit(
        provider, 
        userId, 
        tokens, 
        estimatedCost
      )
      
      // Set LLM-specific headers
      res.set('X-LLM-Provider', provider)
      res.set('X-LLM-Limit', result.info.limit.toString())
      res.set('X-LLM-Remaining', result.info.remaining.toString())
      res.set('X-LLM-Reset', new Date(result.info.reset).toISOString())
      
      if (!result.allowed) {
        return res.status(429).json({
          error: 'LLM rate limit exceeded',
          message: result.reason,
          provider,
          retryAfter: result.info.retryAfter,
          limit: result.info.limit,
          remaining: result.info.remaining,
          reset: result.info.reset
        })
      }
      
      next()
    } catch (error) {
      console.error(`LLM rate limit error for ${provider}:`, error)
      next() // Fail open
    }
  }
}

/**
 * Adaptive rate limiting middleware
 * Adjusts limits based on system load and user behavior
 */
export function createAdaptiveRateLimitMiddleware(baseOptions: RateLimitMiddlewareOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get system metrics
      const systemLoad = await getSystemLoad()
      const userTier = getUserTier(req)
      
      // Adjust limits based on conditions
      const adjustedOptions = adjustRateLimits(baseOptions, systemLoad, userTier)
      
      // Apply adjusted rate limiting
      const middleware = createRateLimitMiddleware(adjustedOptions)
      return middleware(req, res, next)
    } catch (error) {
      console.error('Adaptive rate limit error:', error)
      // Fallback to base options
      const middleware = createRateLimitMiddleware(baseOptions)
      return middleware(req, res, next)
    }
  }
}

/**
 * Get current system load
 */
async function getSystemLoad(): Promise<{
  cpu: number
  memory: number
  redis: number
}> {
  try {
    // Get CPU usage
    const cpuUsage = process.cpuUsage()
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000 // Convert to percentage
    
    // Get memory usage
    const memUsage = process.memoryUsage()
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
    
    // Get Redis performance (simplified)
    const redisHealth = await rateLimitService.getRateLimitStatus('health-check')
    const redisLoad = redisHealth.remaining < redisHealth.limit * 0.2 ? 80 : 20
    
    return {
      cpu: Math.min(cpuPercent, 100),
      memory: memPercent,
      redis: redisLoad
    }
  } catch (error) {
    return { cpu: 50, memory: 50, redis: 50 } // Default moderate load
  }
}

/**
 * Get user tier for rate limiting
 */
function getUserTier(req: Request): 'free' | 'premium' | 'enterprise' {
  const user = (req as any).user
  if (!user) return 'free'
  
  // Determine user tier based on subscription or other factors
  if (user.subscription === 'enterprise') return 'enterprise'
  if (user.subscription === 'premium') return 'premium'
  return 'free'
}

/**
 * Adjust rate limits based on system conditions
 */
function adjustRateLimits(
  baseOptions: RateLimitMiddlewareOptions,
  systemLoad: { cpu: number; memory: number; redis: number },
  userTier: 'free' | 'premium' | 'enterprise'
): RateLimitMiddlewareOptions {
  const adjustedOptions = { ...baseOptions }
  
  // Base multipliers for user tiers
  const tierMultipliers = {
    free: 1,
    premium: 2,
    enterprise: 5
  }
  
  // Adjust based on user tier
  adjustedOptions.maxRequests = Math.floor(
    baseOptions.maxRequests * tierMultipliers[userTier]
  )
  
  // Reduce limits under high system load
  const avgLoad = (systemLoad.cpu + systemLoad.memory + systemLoad.redis) / 3
  
  if (avgLoad > 80) {
    adjustedOptions.maxRequests = Math.floor(adjustedOptions.maxRequests * 0.5)
  } else if (avgLoad > 60) {
    adjustedOptions.maxRequests = Math.floor(adjustedOptions.maxRequests * 0.7)
  } else if (avgLoad < 30) {
    adjustedOptions.maxRequests = Math.floor(adjustedOptions.maxRequests * 1.2)
  }
  
  return adjustedOptions
}

/**
 * Rate limit status endpoint middleware
 */
export function rateLimitStatusMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = generateIdentifier(req)
      const userId = (req as any).user?.id
      
      // Get rate limit status for different types
      const [apiStatus, questionStatus, llmStatus] = await Promise.all([
        rateLimitService.getRateLimitStatus(identifier, 'api'),
        rateLimitService.getRateLimitStatus(identifier, 'questionGeneration'),
        rateLimitService.getLLMRateLimitStatus('openai', userId)
      ])
      
      res.json({
        api: apiStatus,
        questionGeneration: questionStatus,
        llm: {
          openai: llmStatus
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Rate limit status error:', error)
      res.status(500).json({ error: 'Unable to get rate limit status' })
    }
  }
}

/**
 * Rate limit reset endpoint middleware (admin only)
 */
export function rateLimitResetMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { identifier, type } = req.body
      const user = (req as any).user
      
      // Check if user is admin
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' })
      }
      
      const success = await rateLimitService.resetRateLimit(identifier, type)
      
      if (success) {
        res.json({ message: 'Rate limit reset successfully' })
      } else {
        res.status(500).json({ error: 'Failed to reset rate limit' })
      }
    } catch (error) {
      console.error('Rate limit reset error:', error)
      res.status(500).json({ error: 'Unable to reset rate limit' })
    }
  }
}
