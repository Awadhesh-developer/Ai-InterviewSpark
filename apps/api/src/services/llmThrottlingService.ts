/**
 * Intelligent LLM Throttling Service
 * Manages request queuing, load balancing, and intelligent retry logic
 */

import { rateLimitService } from './rateLimitService'
import { EventEmitter } from 'events'

export interface LLMRequest {
  id: string
  provider: string
  model: string
  prompt: string
  options: any
  priority: number
  userId?: string
  retryCount: number
  maxRetries: number
  createdAt: number
  estimatedTokens: number
  estimatedCost: number
}

export interface LLMResponse {
  success: boolean
  data?: any
  error?: string
  provider: string
  model: string
  tokens?: number
  cost?: number
  duration: number
  fromCache?: boolean
}

export interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  averageWaitTime: number
  averageProcessingTime: number
}

export interface ProviderHealth {
  provider: string
  healthy: boolean
  responseTime: number
  errorRate: number
  lastCheck: number
  consecutiveFailures: number
}

class LLMThrottlingService extends EventEmitter {
  private queues: Map<string, LLMRequest[]> = new Map()
  private processing: Map<string, Set<string>> = new Map()
  private providerHealth: Map<string, ProviderHealth> = new Map()
  private stats: Map<string, QueueStats> = new Map()
  private isProcessing = false
  
  // Configuration
  private readonly MAX_CONCURRENT_REQUESTS = {
    openai: 5,
    gemini: 3,
    claude: 3
  }
  
  private readonly RETRY_DELAYS = [1000, 2000, 5000, 10000] // Exponential backoff
  private readonly HEALTH_CHECK_INTERVAL = 30000 // 30 seconds
  private readonly MAX_QUEUE_SIZE = 100
  
  constructor() {
    super()
    this.initializeQueues()
    this.startHealthChecking()
    this.startProcessing()
  }

  /**
   * Initialize queues for each provider
   */
  private initializeQueues(): void {
    const providers = ['openai', 'gemini', 'claude']
    
    providers.forEach(provider => {
      this.queues.set(provider, [])
      this.processing.set(provider, new Set())
      this.stats.set(provider, {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        averageWaitTime: 0,
        averageProcessingTime: 0
      })
      this.providerHealth.set(provider, {
        provider,
        healthy: true,
        responseTime: 0,
        errorRate: 0,
        lastCheck: Date.now(),
        consecutiveFailures: 0
      })
    })
  }

  /**
   * Queue an LLM request
   */
  async queueRequest(request: Omit<LLMRequest, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
    const requestId = this.generateRequestId()
    const fullRequest: LLMRequest = {
      ...request,
      id: requestId,
      createdAt: Date.now(),
      retryCount: 0
    }

    // Check queue size
    const queue = this.queues.get(request.provider)
    if (!queue) {
      throw new Error(`Unknown provider: ${request.provider}`)
    }

    if (queue.length >= this.MAX_QUEUE_SIZE) {
      throw new Error(`Queue full for provider: ${request.provider}`)
    }

    // Check rate limits
    const rateLimitResult = await rateLimitService.checkLLMRateLimit(
      request.provider,
      request.userId,
      request.estimatedTokens,
      request.estimatedCost
    )

    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit exceeded: ${rateLimitResult.reason}`)
    }

    // Add to queue with priority sorting
    queue.push(fullRequest)
    queue.sort((a, b) => b.priority - a.priority)

    this.updateStats(request.provider, 'pending', 1)
    this.emit('requestQueued', { requestId, provider: request.provider })

    return requestId
  }

  /**
   * Process queued requests
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return
    this.isProcessing = true

    setInterval(async () => {
      for (const [provider, queue] of this.queues) {
        await this.processProviderQueue(provider, queue)
      }
    }, 100) // Check every 100ms
  }

  /**
   * Process requests for a specific provider
   */
  private async processProviderQueue(provider: string, queue: LLMRequest[]): Promise<void> {
    const processing = this.processing.get(provider)!
    const maxConcurrent = this.MAX_CONCURRENT_REQUESTS[provider as keyof typeof this.MAX_CONCURRENT_REQUESTS] || 1
    const health = this.providerHealth.get(provider)!

    // Skip if provider is unhealthy
    if (!health.healthy) {
      return
    }

    // Process requests up to concurrent limit
    while (queue.length > 0 && processing.size < maxConcurrent) {
      const request = queue.shift()!
      processing.add(request.id)
      
      this.updateStats(provider, 'pending', -1)
      this.updateStats(provider, 'processing', 1)

      // Process request asynchronously
      this.processRequest(request)
        .then(response => {
          this.handleRequestSuccess(request, response)
        })
        .catch(error => {
          this.handleRequestError(request, error)
        })
        .finally(() => {
          processing.delete(request.id)
          this.updateStats(provider, 'processing', -1)
        })
    }
  }

  /**
   * Process a single LLM request
   */
  private async processRequest(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now()
    
    try {
      // Check cache first
      const cachedResponse = await this.checkCache(request)
      if (cachedResponse) {
        return {
          ...cachedResponse,
          fromCache: true,
          duration: Date.now() - startTime
        }
      }

      // Make actual LLM call
      const response = await this.callLLMProvider(request)
      
      // Cache successful response
      if (response.success) {
        await this.cacheResponse(request, response)
      }

      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: request.provider,
        model: request.model,
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Call the actual LLM provider
   */
  private async callLLMProvider(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now()
    
    // This would be replaced with actual LLM provider calls
    // For now, simulate the call
    await this.simulateDelay(request.provider)
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Simulated LLM provider error')
    }

    return {
      success: true,
      data: { response: `Mock response for: ${request.prompt.substring(0, 50)}...` },
      provider: request.provider,
      model: request.model,
      tokens: request.estimatedTokens,
      cost: request.estimatedCost,
      duration: Date.now() - startTime
    }
  }

  /**
   * Simulate provider response delay
   */
  private async simulateDelay(provider: string): Promise<void> {
    const delays = { openai: 1000, gemini: 800, claude: 1200 }
    const baseDelay = delays[provider as keyof typeof delays] || 1000
    const jitter = Math.random() * 500 // Add some randomness
    
    await new Promise(resolve => setTimeout(resolve, baseDelay + jitter))
  }

  /**
   * Handle successful request
   */
  private handleRequestSuccess(request: LLMRequest, response: LLMResponse): void {
    this.updateStats(request.provider, 'completed', 1)
    this.updateProviderHealth(request.provider, true, response.duration)
    
    const waitTime = Date.now() - request.createdAt
    this.updateAverageWaitTime(request.provider, waitTime)
    this.updateAverageProcessingTime(request.provider, response.duration)
    
    this.emit('requestCompleted', { 
      requestId: request.id, 
      provider: request.provider, 
      response 
    })
  }

  /**
   * Handle request error
   */
  private handleRequestError(request: LLMRequest, error: any): void {
    const shouldRetry = request.retryCount < request.maxRetries
    
    if (shouldRetry) {
      // Add back to queue with delay
      setTimeout(() => {
        request.retryCount++
        const queue = this.queues.get(request.provider)!
        queue.unshift(request) // Add to front for retry
        this.updateStats(request.provider, 'pending', 1)
      }, this.RETRY_DELAYS[Math.min(request.retryCount, this.RETRY_DELAYS.length - 1)])
      
      this.emit('requestRetry', { 
        requestId: request.id, 
        provider: request.provider, 
        retryCount: request.retryCount,
        error: error.message 
      })
    } else {
      this.updateStats(request.provider, 'failed', 1)
      this.updateProviderHealth(request.provider, false, 0)
      
      this.emit('requestFailed', { 
        requestId: request.id, 
        provider: request.provider, 
        error: error.message 
      })
    }
  }

  /**
   * Check cache for request
   */
  private async checkCache(request: LLMRequest): Promise<LLMResponse | null> {
    // This would integrate with the cache service
    // For now, return null (no cache)
    return null
  }

  /**
   * Cache successful response
   */
  private async cacheResponse(request: LLMRequest, response: LLMResponse): Promise<void> {
    // This would integrate with the cache service
    // For now, do nothing
  }

  /**
   * Update provider health status
   */
  private updateProviderHealth(provider: string, success: boolean, responseTime: number): void {
    const health = this.providerHealth.get(provider)!
    
    if (success) {
      health.consecutiveFailures = 0
      health.healthy = true
      health.responseTime = (health.responseTime + responseTime) / 2 // Moving average
    } else {
      health.consecutiveFailures++
      if (health.consecutiveFailures >= 3) {
        health.healthy = false
      }
    }
    
    health.lastCheck = Date.now()
  }

  /**
   * Start health checking
   */
  private startHealthChecking(): void {
    setInterval(async () => {
      for (const [provider, health] of this.providerHealth) {
        // Re-enable unhealthy providers after some time
        if (!health.healthy && Date.now() - health.lastCheck > 60000) { // 1 minute
          health.healthy = true
          health.consecutiveFailures = 0
          console.log(`Re-enabled provider: ${provider}`)
        }
      }
    }, this.HEALTH_CHECK_INTERVAL)
  }

  /**
   * Update statistics
   */
  private updateStats(provider: string, metric: keyof QueueStats, delta: number): void {
    const stats = this.stats.get(provider)!
    if (typeof stats[metric] === 'number') {
      (stats[metric] as number) += delta
    }
  }

  /**
   * Update average wait time
   */
  private updateAverageWaitTime(provider: string, waitTime: number): void {
    const stats = this.stats.get(provider)!
    stats.averageWaitTime = (stats.averageWaitTime + waitTime) / 2
  }

  /**
   * Update average processing time
   */
  private updateAverageProcessingTime(provider: string, processingTime: number): void {
    const stats = this.stats.get(provider)!
    stats.averageProcessingTime = (stats.averageProcessingTime + processingTime) / 2
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get queue statistics
   */
  getQueueStats(provider?: string): Map<string, QueueStats> | QueueStats | null {
    if (provider) {
      return this.stats.get(provider) || null
    }
    return this.stats
  }

  /**
   * Get provider health status
   */
  getProviderHealth(provider?: string): Map<string, ProviderHealth> | ProviderHealth | null {
    if (provider) {
      return this.providerHealth.get(provider) || null
    }
    return this.providerHealth
  }

  /**
   * Get queue lengths
   */
  getQueueLengths(): Record<string, number> {
    const lengths: Record<string, number> = {}
    for (const [provider, queue] of this.queues) {
      lengths[provider] = queue.length
    }
    return lengths
  }

  /**
   * Clear queue for provider
   */
  clearQueue(provider: string): number {
    const queue = this.queues.get(provider)
    if (!queue) return 0
    
    const cleared = queue.length
    queue.length = 0
    this.updateStats(provider, 'pending', -cleared)
    
    return cleared
  }

  /**
   * Pause processing for provider
   */
  pauseProvider(provider: string): void {
    const health = this.providerHealth.get(provider)
    if (health) {
      health.healthy = false
      console.log(`Paused provider: ${provider}`)
    }
  }

  /**
   * Resume processing for provider
   */
  resumeProvider(provider: string): void {
    const health = this.providerHealth.get(provider)
    if (health) {
      health.healthy = true
      health.consecutiveFailures = 0
      console.log(`Resumed provider: ${provider}`)
    }
  }

  /**
   * Get overall system status
   */
  getSystemStatus(): {
    totalPending: number
    totalProcessing: number
    totalCompleted: number
    totalFailed: number
    healthyProviders: number
    totalProviders: number
  } {
    let totalPending = 0
    let totalProcessing = 0
    let totalCompleted = 0
    let totalFailed = 0
    let healthyProviders = 0

    for (const stats of this.stats.values()) {
      totalPending += stats.pending
      totalProcessing += stats.processing
      totalCompleted += stats.completed
      totalFailed += stats.failed
    }

    for (const health of this.providerHealth.values()) {
      if (health.healthy) healthyProviders++
    }

    return {
      totalPending,
      totalProcessing,
      totalCompleted,
      totalFailed,
      healthyProviders,
      totalProviders: this.providerHealth.size
    }
  }
}

// Export singleton instance
export const llmThrottlingService = new LLMThrottlingService()
export default llmThrottlingService
