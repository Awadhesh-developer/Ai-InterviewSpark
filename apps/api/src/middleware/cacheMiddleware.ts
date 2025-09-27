/**
 * Express Cache Middleware
 * Handles HTTP-level caching for API responses
 */

import { Request, Response, NextFunction } from 'express'
import { cacheService, CacheKey } from '../services/cacheService'
import crypto from 'crypto'

export interface CacheMiddlewareOptions {
  ttl?: number // Time to live in seconds
  keyGenerator?: (req: Request) => string
  condition?: (req: Request, res: Response) => boolean
  skipCache?: (req: Request) => boolean
  varyBy?: string[] // Headers to vary cache by
  tags?: string[] | ((req: Request) => string[])
}

export interface CachedResponse {
  statusCode: number
  headers: Record<string, string>
  body: any
  cachedAt: string
  ttl: number
}

/**
 * Create cache middleware for API responses
 */
export function createCacheMiddleware(options: CacheMiddlewareOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET' && !options.condition) {
      return next()
    }

    // Skip cache if condition is not met
    if (options.skipCache && options.skipCache(req)) {
      return next()
    }

    // Generate cache key
    const cacheKey = generateCacheKey(req, options.keyGenerator, options.varyBy)
    
    try {
      // Try to get cached response
      const cached = await cacheService.get<CachedResponse>(cacheKey)
      
      if (cached && !isCacheExpired(cached)) {
        // Return cached response
        res.set(cached.headers)
        res.set('X-Cache', 'HIT')
        res.set('X-Cache-Date', cached.cachedAt)
        res.status(cached.statusCode).json(cached.body)
        return
      }

      // Cache miss - intercept response
      const originalSend = res.json
      const originalStatus = res.status
      let statusCode = 200
      
      res.status = function(code: number) {
        statusCode = code
        return originalStatus.call(this, code)
      }

      res.json = function(body: any) {
        // Only cache successful responses
        if (statusCode >= 200 && statusCode < 300) {
          const shouldCache = !options.condition || options.condition(req, res)
          
          if (shouldCache) {
            cacheResponse(cacheKey, statusCode, res.getHeaders(), body, options)
              .catch(error => console.error('Cache storage error:', error))
          }
        }
        
        res.set('X-Cache', 'MISS')
        return originalSend.call(this, body)
      }

      next()
    } catch (error) {
      console.error('Cache middleware error:', error)
      next()
    }
  }
}

/**
 * Generate cache key for request
 */
function generateCacheKey(
  req: Request, 
  keyGenerator?: (req: Request) => string,
  varyBy?: string[]
): CacheKey {
  if (keyGenerator) {
    return {
      prefix: cacheService.getPrefixes().API_RESPONSES,
      identifier: keyGenerator(req)
    }
  }

  // Default key generation
  const parts = [req.path]
  
  // Add query parameters
  if (Object.keys(req.query).length > 0) {
    const sortedQuery = Object.keys(req.query)
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('&')
    parts.push(sortedQuery)
  }
  
  // Add vary headers
  if (varyBy) {
    const varyValues = varyBy
      .map(header => `${header}:${req.get(header) || ''}`)
      .join('|')
    parts.push(varyValues)
  }
  
  const keyString = parts.join('?')
  const hash = crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 16)
  
  return {
    prefix: cacheService.getPrefixes().API_RESPONSES,
    identifier: hash
  }
}

/**
 * Cache the response
 */
async function cacheResponse(
  cacheKey: CacheKey,
  statusCode: number,
  headers: any,
  body: any,
  options: CacheMiddlewareOptions
): Promise<void> {
  const cachedResponse: CachedResponse = {
    statusCode,
    headers: extractCacheableHeaders(headers),
    body,
    cachedAt: new Date().toISOString(),
    ttl: options.ttl || 300 // Default 5 minutes
  }

  const tags = typeof options.tags === 'function' 
    ? options.tags({ path: cacheKey.identifier } as Request)
    : options.tags

  await cacheService.set(cacheKey, cachedResponse, {
    ttl: options.ttl || 300,
    tags
  })
}

/**
 * Extract cacheable headers
 */
function extractCacheableHeaders(headers: any): Record<string, string> {
  const cacheableHeaders: Record<string, string> = {}
  const allowedHeaders = [
    'content-type',
    'content-encoding',
    'content-language',
    'etag',
    'last-modified',
    'vary'
  ]

  for (const [key, value] of Object.entries(headers)) {
    if (allowedHeaders.includes(key.toLowerCase()) && typeof value === 'string') {
      cacheableHeaders[key] = value
    }
  }

  return cacheableHeaders
}

/**
 * Check if cached response is expired
 */
function isCacheExpired(cached: CachedResponse): boolean {
  const cachedAt = new Date(cached.cachedAt)
  const now = new Date()
  const ageInSeconds = (now.getTime() - cachedAt.getTime()) / 1000
  
  return ageInSeconds > cached.ttl
}

/**
 * Middleware for question generation endpoints
 */
export const questionCacheMiddleware = createCacheMiddleware({
  ttl: 60 * 60, // 1 hour
  keyGenerator: (req) => {
    const { sessionId, jobTitle, industry, company, difficulty, count, types } = req.body || req.query
    const keyParts = [sessionId, jobTitle, industry, company, difficulty, count, JSON.stringify(types)]
      .filter(Boolean)
      .join(':')
    
    return crypto.createHash('sha256').update(keyParts).digest('hex').substring(0, 16)
  },
  condition: (req, res) => {
    // Only cache successful question generation
    return res.statusCode === 200
  },
  tags: (req) => {
    const { industry, company, difficulty } = req.body || req.query
    const tags = ['questions']
    
    if (industry) tags.push(`industry:${industry}`)
    if (company) tags.push(`company:${company}`)
    if (difficulty) tags.push(`difficulty:${difficulty}`)
    
    return tags
  }
})

/**
 * Middleware for company insights endpoints
 */
export const companyInsightsCacheMiddleware = createCacheMiddleware({
  ttl: 24 * 60 * 60, // 24 hours
  keyGenerator: (req) => {
    const companyName = req.params.company || req.query.company
    const nameStr = Array.isArray(companyName) ? companyName[0] : companyName
    return `company-insights:${(typeof nameStr === 'string' ? nameStr : '')?.toLowerCase().replace(/\s+/g, '-')}`
  },
  tags: (req) => {
    const companyName = req.params.company || req.query.company
    const nameStr = Array.isArray(companyName) ? companyName[0] : companyName
    return ['company-insights', `company:${(typeof nameStr === 'string' ? nameStr : '')?.toLowerCase()}`]
  }
})

/**
 * Middleware for industry trends endpoints
 */
export const industryTrendsCacheMiddleware = createCacheMiddleware({
  ttl: 12 * 60 * 60, // 12 hours
  keyGenerator: (req) => {
    const industry = req.params.industry || req.query.industry
    const industryStr = Array.isArray(industry) ? industry[0] : industry
    return `industry-trends:${(typeof industryStr === 'string' ? industryStr : '')?.toLowerCase().replace(/\s+/g, '-')}`
  },
  tags: (req) => {
    const industry = req.params.industry || req.query.industry
    const industryStr = Array.isArray(industry) ? industry[0] : industry
    return ['industry-trends', `industry:${(typeof industryStr === 'string' ? industryStr : '')?.toLowerCase()}`]
  }
})

/**
 * Middleware for sample answers endpoints
 */
export const sampleAnswersCacheMiddleware = createCacheMiddleware({
  ttl: 2 * 60 * 60, // 2 hours
  keyGenerator: (req) => {
    const { questionId, jobTitle, industry, experienceLevel } = req.params
    return `sample-answer:${questionId}:${jobTitle}:${industry}:${experienceLevel}`
  },
  tags: () => ['sample-answers']
})

/**
 * Cache warming middleware
 */
export function cacheWarmingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add cache warming headers
    res.set('X-Cache-Warming', 'enabled')
    
    // Trigger background cache warming for popular endpoints
    if (req.path.includes('/questions/generate')) {
      // Trigger warming in background (don't await)
      warmPopularQuestionSets().catch(error => 
        console.error('Cache warming error:', error)
      )
    }
    
    next()
  }
}

/**
 * Warm popular question sets
 */
async function warmPopularQuestionSets(): Promise<void> {
  const popularContexts = [
    { jobTitle: 'Software Engineer', industry: 'technology', difficulty: 'medium' },
    { jobTitle: 'Product Manager', industry: 'technology', difficulty: 'medium' },
    { jobTitle: 'Data Scientist', industry: 'technology', difficulty: 'medium' },
    { jobTitle: 'Financial Analyst', industry: 'finance', difficulty: 'medium' }
  ]

  // This would trigger question generation for popular contexts
  // Implementation depends on your question generation service
  console.log('🔥 Warming cache for popular question sets...')
}

/**
 * Cache invalidation middleware
 */
export function cacheInvalidationMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.json
    
    res.json = function(body: any) {
      // Invalidate related cache on successful mutations
      if (req.method !== 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
        invalidateRelatedCache(req).catch(error => 
          console.error('Cache invalidation error:', error)
        )
      }
      
      return originalSend.call(this, body)
    }
    
    next()
  }
}

/**
 * Invalidate related cache entries
 */
async function invalidateRelatedCache(req: Request): Promise<void> {
  const tags: string[] = []
  
  // Determine what to invalidate based on the request
  if (req.path.includes('/questions')) {
    tags.push('questions')
    
    const { industry, company } = req.body || {}
    if (industry) tags.push(`industry:${industry}`)
    if (company) tags.push(`company:${company}`)
  }
  
  if (req.path.includes('/company-insights')) {
    const company = req.params.company || req.body?.company
    if (company) tags.push(`company:${company.toLowerCase()}`)
  }
  
  if (tags.length > 0) {
    await cacheService.invalidateByTags(tags)
    console.log(`🗑️  Invalidated cache for tags: ${tags.join(', ')}`)
  }
}
