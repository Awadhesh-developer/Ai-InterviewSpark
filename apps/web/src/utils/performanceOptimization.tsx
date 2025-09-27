// Performance optimization utilities for AI coaching system
import React from 'react'

export interface PerformanceMetrics {
  responseTime: number
  memoryUsage: number
  cpuUsage: number
  apiCalls: number
  cacheHitRate: number
  errorRate: number
}

export interface OptimizationConfig {
  enableCaching: boolean
  cacheTimeout: number // milliseconds
  maxConcurrentRequests: number
  requestTimeout: number // milliseconds
  enableCompression: boolean
  enableLazyLoading: boolean
  batchSize: number
}

class PerformanceOptimizer {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  private requestQueue: Array<{ id: string; promise: Promise<any>; timestamp: number }> = []
  private metrics: PerformanceMetrics = {
    responseTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    apiCalls: 0,
    cacheHitRate: 0,
    errorRate: 0
  }
  private config: OptimizationConfig = {
    enableCaching: true,
    cacheTimeout: 300000, // 5 minutes
    maxConcurrentRequests: 10,
    requestTimeout: 30000, // 30 seconds
    enableCompression: true,
    enableLazyLoading: true,
    batchSize: 5
  }

  constructor(config?: Partial<OptimizationConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    
    // Start periodic cache cleanup
    this.startCacheCleanup()
    
    // Start metrics collection
    this.startMetricsCollection()
  }

  // Optimized API call with caching and request deduplication
  async optimizedApiCall<T>(
    key: string,
    apiFunction: () => Promise<T>,
    ttl: number = this.config.cacheTimeout
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cached = this.getFromCache<T>(key)
        if (cached) {
          this.updateMetrics('cacheHit', performance.now() - startTime)
          return cached
        }
      }

      // Check if request is already in progress
      const existingRequest = this.requestQueue.find(req => req.id === key)
      if (existingRequest) {
        return await existingRequest.promise
      }

      // Create new request with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.config.requestTimeout)
      })

      const apiPromise = Promise.race([apiFunction(), timeoutPromise])
      
      // Add to request queue
      this.requestQueue.push({
        id: key,
        promise: apiPromise,
        timestamp: Date.now()
      })

      // Limit concurrent requests
      if (this.requestQueue.length > this.config.maxConcurrentRequests) {
        await this.waitForRequestSlot()
      }

      const result = await apiPromise
      
      // Cache the result
      if (this.config.enableCaching) {
        this.setCache(key, result, ttl)
      }

      // Remove from request queue
      this.requestQueue = this.requestQueue.filter(req => req.id !== key)
      
      this.updateMetrics('apiCall', performance.now() - startTime)
      return result
    } catch (error) {
      this.updateMetrics('error', performance.now() - startTime)
      throw error
    }
  }

  // Batch processing for multiple requests
  async batchProcess<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = this.config.batchSize
  ): Promise<R[]> {
    const results: R[] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await processor(batch)
      results.push(...batchResults)
      
      // Small delay between batches to prevent overwhelming
      if (i + batchSize < items.length) {
        await this.delay(10)
      }
    }
    
    return results
  }

  // Debounced function execution
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeoutId: NodeJS.Timeout
    let resolvePromise: (value: ReturnType<T>) => void
    let rejectPromise: (reason: any) => void
    
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        clearTimeout(timeoutId)
        resolvePromise = resolve
        rejectPromise = reject
        
        timeoutId = setTimeout(async () => {
          try {
            const result = await func(...args)
            resolvePromise(result)
          } catch (error) {
            rejectPromise(error)
          }
        }, delay)
      })
    }
  }

  // Throttled function execution
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
    let inThrottle = false
    
    return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
      if (!inThrottle) {
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
        return await func(...args)
      }
      return null
    }
  }

  // Memory optimization for large datasets
  optimizeMemoryUsage<T>(
    data: T[],
    chunkSize: number = 1000
  ): AsyncGenerator<T[], void, unknown> {
    return this.createAsyncGenerator(data, chunkSize)
  }

  private async *createAsyncGenerator<T>(
    data: T[],
    chunkSize: number
  ): AsyncGenerator<T[], void, unknown> {
    for (let i = 0; i < data.length; i += chunkSize) {
      yield data.slice(i, i + chunkSize)
      
      // Allow garbage collection between chunks
      await this.delay(1)
    }
  }

  // Lazy loading implementation
  createLazyLoader<T>(
    loader: () => Promise<T>
  ): () => Promise<T> {
    let cached: T | null = null
    let loading = false
    let loadPromise: Promise<T> | null = null

    return async (): Promise<T> => {
      if (cached) {
        return cached
      }

      if (loading && loadPromise) {
        return loadPromise
      }

      loading = true
      loadPromise = loader().then(result => {
        cached = result
        loading = false
        return result
      }).catch(error => {
        loading = false
        loadPromise = null
        throw error
      })

      return loadPromise
    }
  }

  // Compression utilities
  async compressData(data: any): Promise<string> {
    if (!this.config.enableCompression) {
      return JSON.stringify(data)
    }

    // Simple compression using JSON stringify with reduced precision
    const jsonString = JSON.stringify(data, (key, value) => {
      if (typeof value === 'number') {
        return Math.round(value * 100) / 100 // Round to 2 decimal places
      }
      return value
    })

    return jsonString
  }

  async decompressData<T>(compressedData: string): Promise<T> {
    return JSON.parse(compressedData)
  }

  // Cache management
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      for (const [key, cached] of this.cache.entries()) {
        if (now - cached.timestamp > cached.ttl) {
          this.cache.delete(key)
        }
      }
    }, 60000) // Cleanup every minute
  }

  // Metrics collection
  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectSystemMetrics()
    }, 5000) // Collect metrics every 5 seconds
  }

  private collectSystemMetrics(): void {
    // Collect memory usage
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize
    }

    // Calculate cache hit rate
    const totalCacheRequests = this.metrics.apiCalls + this.getCacheHits()
    this.metrics.cacheHitRate = totalCacheRequests > 0 ? this.getCacheHits() / totalCacheRequests : 0
  }

  private getCacheHits(): number {
    // This would be tracked separately in a real implementation
    return Math.floor(this.metrics.apiCalls * 0.3) // Mock 30% cache hit rate
  }

  public updateMetrics(type: 'apiCall' | 'cacheHit' | 'error', responseTime: number): void {
    this.metrics.responseTime = (this.metrics.responseTime + responseTime) / 2 // Moving average
    
    switch (type) {
      case 'apiCall':
        this.metrics.apiCalls++
        break
      case 'error':
        this.metrics.errorRate = (this.metrics.errorRate + 1) / (this.metrics.apiCalls + 1)
        break
    }
  }

  private async waitForRequestSlot(): Promise<void> {
    while (this.requestQueue.length >= this.config.maxConcurrentRequests) {
      await this.delay(100)
      
      // Clean up completed requests
      this.requestQueue = this.requestQueue.filter(req => {
        const isOld = Date.now() - req.timestamp > this.config.requestTimeout
        return !isOld
      })
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Public methods for monitoring
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  getCacheSize(): number {
    return this.cache.size
  }

  clearCache(): void {
    this.cache.clear()
  }

  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Resource cleanup
  cleanup(): void {
    this.cache.clear()
    this.requestQueue = []
  }
}

// Singleton instance
export const performanceOptimizer = new PerformanceOptimizer()

// Utility functions
export const optimizedFetch = async function <T>(
  url: string,
  options?: RequestInit,
  cacheKey?: string
): Promise<T> {
  const key = cacheKey || `fetch_${url}_${JSON.stringify(options)}`
  
  return performanceOptimizer.optimizedApiCall(
    key,
    async () => {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    }
  )
}

export const createOptimizedComponent = function <P extends object>(
  Component: React.ComponentType<P>,
  shouldUpdate?: (prevProps: P, nextProps: P) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  return React.memo(Component, shouldUpdate ? (prevProps, nextProps) => !shouldUpdate(prevProps, nextProps) : undefined)
}

// Performance monitoring hook
export const usePerformanceMonitor = (): PerformanceMetrics => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>(performanceOptimizer.getMetrics())

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceOptimizer.getMetrics())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return metrics
}

// Error boundary for performance optimization
export class PerformanceErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Performance Error Boundary caught an error:', error, errorInfo)
    
    // Log performance impact
    performanceOptimizer.updateMetrics('error', 0)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} />
      }
      return <div>Something went wrong. Please try again.</div>
    }

    return this.props.children
  }
}
