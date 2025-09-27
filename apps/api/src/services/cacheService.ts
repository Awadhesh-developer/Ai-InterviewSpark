/**
 * Redis-based Caching Service for Enhanced Performance
 * Handles caching for questions, company insights, LLM responses, and more
 */

// Conditional import for optional dependency
let Redis: any = null;
try {
  Redis = require('ioredis');
} catch (error) {
  console.warn('⚠️  ioredis not installed, cache service will be disabled');
}
import { config } from '../config'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  compress?: boolean // Whether to compress large data
  tags?: string[] // Cache tags for invalidation
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalKeys: number
  memoryUsage: number
}

export interface CacheKey {
  prefix: string
  identifier: string
  version?: string
}

class CacheService {
  private redis: any | null = null
  private isConnected = false
  private stats = {
    hits: 0,
    misses: 0
  }

  // Cache prefixes for different data types
  private readonly PREFIXES = {
    QUESTIONS: 'q',
    COMPANY_INSIGHTS: 'ci',
    INDUSTRY_TRENDS: 'it',
    LLM_RESPONSES: 'llm',
    SAMPLE_ANSWERS: 'sa',
    USER_SESSIONS: 'us',
    API_RESPONSES: 'api',
    RATE_LIMITS: 'rl'
  } as const

  // Default TTL values (in seconds)
  private readonly DEFAULT_TTL = {
    QUESTIONS: 24 * 60 * 60, // 24 hours
    COMPANY_INSIGHTS: 7 * 24 * 60 * 60, // 7 days
    INDUSTRY_TRENDS: 24 * 60 * 60, // 24 hours
    LLM_RESPONSES: 60 * 60, // 1 hour
    SAMPLE_ANSWERS: 24 * 60 * 60, // 24 hours
    USER_SESSIONS: 30 * 60, // 30 minutes
    API_RESPONSES: 5 * 60, // 5 minutes
    RATE_LIMITS: 60 * 60 // 1 hour
  } as const

  constructor() {
    this.initializeRedis()
  }

  private async initializeRedis(): Promise<void> {
    if (!config.redis.enabled || !config.redis.url || !Redis) {
      console.log('📦 Cache Service: Running without Redis')
      return
    }

    try {
      this.redis = new Redis(config.redis.url, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 5000,
      })

      this.redis.on('connect', () => {
        console.log('✅ Cache Service: Redis connected')
        this.isConnected = true
      })

      this.redis.on('error', () => {
        // Silently handle Redis errors - system works without cache
        this.isConnected = false
        this.redis = null
      })

      this.redis.on('close', () => {
        this.isConnected = false
      })

      await this.redis.connect()
    } catch (error) {
      console.log('📦 Cache Service: Running without Redis')
      this.redis = null
    }
  }

  /**
   * Generate a cache key from components
   */
  private generateKey(cacheKey: CacheKey): string {
    const parts = [cacheKey.prefix, cacheKey.identifier]
    if (cacheKey.version) {
      parts.push(cacheKey.version)
    }
    return parts.join(':')
  }

  /**
   * Get data from cache
   */
  async get<T>(cacheKey: CacheKey): Promise<T | null> {
    if (!this.isConnected || !this.redis) {
      return null
    }

    try {
      const key = this.generateKey(cacheKey)
      const data = await this.redis.get(key)
      
      if (data) {
        this.stats.hits++
        return JSON.parse(data) as T
      } else {
        this.stats.misses++
        return null
      }
    } catch (error) {
      console.error('Cache get error:', error)
      this.stats.misses++
      return null
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(
    cacheKey: CacheKey, 
    data: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const key = this.generateKey(cacheKey)
      const serializedData = JSON.stringify(data)
      
      const ttl = options.ttl || this.getDefaultTTL(cacheKey.prefix)
      
      if (ttl > 0) {
        await this.redis.setex(key, ttl, serializedData)
      } else {
        await this.redis.set(key, serializedData)
      }

      // Add tags for cache invalidation
      if (options.tags) {
        await this.addTags(key, options.tags)
      }

      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  /**
   * Delete data from cache
   */
  async delete(cacheKey: CacheKey): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const key = this.generateKey(cacheKey)
      const result = await this.redis.del(key)
      return result > 0
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(cacheKey: CacheKey): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const key = this.generateKey(cacheKey)
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T>(cacheKeys: CacheKey[]): Promise<(T | null)[]> {
    if (!this.isConnected || !this.redis || cacheKeys.length === 0) {
      return cacheKeys.map(() => null)
    }

    try {
      const keys = cacheKeys.map(ck => this.generateKey(ck))
      const results = await this.redis.mget(...keys)
      
      return results.map((result: string | null) => {
        if (result) {
          this.stats.hits++
          return JSON.parse(result) as T
        } else {
          this.stats.misses++
          return null
        }
      })
    } catch (error) {
      console.error('Cache mget error:', error)
      this.stats.misses += cacheKeys.length
      return cacheKeys.map(() => null)
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset<T>(
    entries: Array<{ key: CacheKey; data: T; options?: CacheOptions }>
  ): Promise<boolean> {
    if (!this.isConnected || !this.redis || entries.length === 0) {
      return false
    }

    try {
      const pipeline = this.redis.pipeline()
      
      for (const entry of entries) {
        const key = this.generateKey(entry.key)
        const serializedData = JSON.stringify(entry.data)
        const ttl = entry.options?.ttl || this.getDefaultTTL(entry.key.prefix)
        
        if (ttl > 0) {
          pipeline.setex(key, ttl, serializedData)
        } else {
          pipeline.set(key, serializedData)
        }
      }
      
      await pipeline.exec()
      return true
    } catch (error) {
      console.error('Cache mset error:', error)
      return false
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return 0
    }

    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length === 0) {
        return 0
      }
      
      const result = await this.redis.del(...keys)
      return result
    } catch (error) {
      console.error('Cache invalidate by pattern error:', error)
      return 0
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.isConnected || !this.redis || tags.length === 0) {
      return 0
    }

    try {
      let totalDeleted = 0
      
      for (const tag of tags) {
        const tagKey = `tag:${tag}`
        const keys = await this.redis.smembers(tagKey)
        
        if (keys.length > 0) {
          const deleted = await this.redis.del(...keys)
          totalDeleted += deleted
          
          // Clean up the tag set
          await this.redis.del(tagKey)
        }
      }
      
      return totalDeleted
    } catch (error) {
      console.error('Cache invalidate by tags error:', error)
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0

    let totalKeys = 0
    let memoryUsage = 0

    if (this.isConnected && this.redis) {
      try {
        const info = await this.redis.info('keyspace')
        const keyspaceMatch = info.match(/db0:keys=(\d+)/)
        if (keyspaceMatch) {
          totalKeys = parseInt(keyspaceMatch[1])
        }

        const memoryInfo = await this.redis.info('memory')
        const memoryMatch = memoryInfo.match(/used_memory:(\d+)/)
        if (memoryMatch) {
          memoryUsage = parseInt(memoryMatch[1])
        }
      } catch (error) {
        console.error('Error getting Redis stats:', error)
      }
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalKeys,
      memoryUsage
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      await this.redis.flushdb()
      this.stats.hits = 0
      this.stats.misses = 0
      return true
    } catch (error) {
      console.error('Cache clear error:', error)
      return false
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    if (!this.redis) {
      return { healthy: false, error: 'Redis not initialized' }
    }

    try {
      const start = Date.now()
      await this.redis.ping()
      const latency = Date.now() - start
      
      return { healthy: true, latency }
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get cache prefixes
   */
  getPrefixes() {
    return this.PREFIXES
  }

  /**
   * Get default TTL for a prefix
   */
  private getDefaultTTL(prefix: string): number {
    const ttlKey = Object.keys(this.DEFAULT_TTL).find(key => 
      this.PREFIXES[key as keyof typeof this.PREFIXES] === prefix
    ) as keyof typeof this.DEFAULT_TTL | undefined

    return ttlKey ? this.DEFAULT_TTL[ttlKey] : 3600 // Default 1 hour
  }

  /**
   * Add tags to a key for cache invalidation
   */
  private async addTags(key: string, tags: string[]): Promise<void> {
    if (!this.redis) return

    try {
      const pipeline = this.redis.pipeline()
      
      for (const tag of tags) {
        const tagKey = `tag:${tag}`
        pipeline.sadd(tagKey, key)
        pipeline.expire(tagKey, 24 * 60 * 60) // Tags expire in 24 hours
      }
      
      await pipeline.exec()
    } catch (error) {
      console.error('Error adding cache tags:', error)
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.redis = null
      this.isConnected = false
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService()
export default cacheService
