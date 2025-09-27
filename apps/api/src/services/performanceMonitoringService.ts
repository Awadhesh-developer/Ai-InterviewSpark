/**
 * Performance Monitoring and Alerting Service
 * Comprehensive monitoring for system performance, health, and alerting
 */

import { EventEmitter } from 'events'
import { cacheService } from './cacheService'
import { rateLimitService } from './rateLimitService'
import { databaseOptimizationService } from './databaseOptimizationService'
import { llmThrottlingService } from './llmThrottlingService'
import { questionCacheService } from './questionCacheService'

export interface PerformanceMetrics {
  timestamp: number
  cpu: {
    usage: number
    loadAverage: number[]
  }
  memory: {
    used: number
    total: number
    percentage: number
    heapUsed: number
    heapTotal: number
  }
  database: {
    connections: number
    slowQueries: number
    errorRate: number
    responseTime: number
  }
  cache: {
    hitRate: number
    memoryUsage: number
    totalKeys: number
  }
  api: {
    requestsPerSecond: number
    averageResponseTime: number
    errorRate: number
    activeConnections: number
  }
  llm: {
    queueLength: number
    processingTime: number
    errorRate: number
    costPerHour: number
  }
}

export interface Alert {
  id: string
  type: 'warning' | 'error' | 'critical'
  category: 'performance' | 'availability' | 'security' | 'cost'
  message: string
  details: any
  timestamp: number
  resolved: boolean
  resolvedAt?: number
}

export interface HealthCheck {
  service: string
  healthy: boolean
  responseTime: number
  lastCheck: number
  error?: string
}

export interface PerformanceThresholds {
  cpu: { warning: number; critical: number }
  memory: { warning: number; critical: number }
  database: { 
    responseTime: { warning: number; critical: number }
    errorRate: { warning: number; critical: number }
  }
  cache: {
    hitRate: { warning: number; critical: number }
  }
  api: {
    responseTime: { warning: number; critical: number }
    errorRate: { warning: number; critical: number }
  }
  llm: {
    queueLength: { warning: number; critical: number }
    costPerHour: { warning: number; critical: number }
  }
}

class PerformanceMonitoringService extends EventEmitter {
  private metrics: PerformanceMetrics[] = []
  private alerts: Alert[] = []
  private healthChecks: Map<string, HealthCheck> = new Map()
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  
  // Default thresholds
  private thresholds: PerformanceThresholds = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    database: {
      responseTime: { warning: 1000, critical: 3000 },
      errorRate: { warning: 5, critical: 10 }
    },
    cache: {
      hitRate: { warning: 70, critical: 50 }
    },
    api: {
      responseTime: { warning: 2000, critical: 5000 },
      errorRate: { warning: 5, critical: 10 }
    },
    llm: {
      queueLength: { warning: 50, critical: 100 },
      costPerHour: { warning: 50, critical: 100 }
    }
  }

  constructor() {
    super()
    this.initializeHealthChecks()
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.warn('Performance monitoring is already running')
      return
    }

    this.isMonitoring = true
    console.log('🔍 Starting performance monitoring...')

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics()
        await this.runHealthChecks()
        this.checkThresholds()
        this.cleanupOldData()
      } catch (error) {
        console.error('Performance monitoring error:', error)
      }
    }, intervalMs)

    // Initial collection
    this.collectMetrics()
    this.runHealthChecks()
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
    console.log('🔍 Performance monitoring stopped')
  }

  /**
   * Collect comprehensive performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    const timestamp = Date.now()

    // CPU metrics
    const cpuUsage = process.cpuUsage()
    const loadAverage = process.platform === 'win32' ? [0, 0, 0] : require('os').loadavg()

    // Memory metrics
    const memoryUsage = process.memoryUsage()
    const totalMemory = require('os').totalmem()

    // Database metrics
    const dbHealth = await databaseOptimizationService.getConnectionStats()
    const dbStats = { queryCount: 0, avgDuration: 0 } // Placeholder since getQueryStats doesn't exist

    // Cache metrics
    const cacheStats = await cacheService.getStats()
    const cacheHitRates = questionCacheService.getCacheHitRates()

    // LLM metrics
    const llmSystemStatus = llmThrottlingService.getSystemStatus()
    const llmQueueLengths = llmThrottlingService.getQueueLengths()

    const metrics: PerformanceMetrics = {
      timestamp,
      cpu: {
        usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to percentage
        loadAverage
      },
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / totalMemory) * 100,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal
      },
      database: {
        connections: dbHealth.activeConnections,
        slowQueries: dbHealth.slowQueries,
        errorRate: dbHealth.errorRate,
        responseTime: dbHealth.responseTime
      },
      cache: {
        hitRate: cacheHitRates.overall,
        memoryUsage: cacheStats.memoryUsage,
        totalKeys: cacheStats.totalKeys
      },
      api: {
        requestsPerSecond: 0, // Would be calculated from request metrics
        averageResponseTime: dbStats.avgDuration,
        errorRate: dbHealth.errorRate,
        activeConnections: dbHealth.activeConnections
      },
      llm: {
        queueLength: Object.values(llmQueueLengths).reduce((sum, len) => sum + len, 0),
        processingTime: 0, // Would be calculated from LLM service
        errorRate: 0, // Would be calculated from LLM service
        costPerHour: 0 // Would be calculated from usage
      }
    }

    this.metrics.push(metrics)
    this.emit('metricsCollected', metrics)

    return metrics
  }

  /**
   * Run health checks for all services
   */
  async runHealthChecks(): Promise<void> {
    const services = [
      { name: 'database', check: () => databaseOptimizationService.getConnectionStats() },
      { name: 'cache', check: () => cacheService.healthCheck() },
      { name: 'rateLimiting', check: () => this.checkRateLimitingHealth() },
      { name: 'llmThrottling', check: () => this.checkLLMThrottlingHealth() }
    ]

    for (const service of services) {
      try {
        const startTime = Date.now()
        const result = await service.check()
        const responseTime = Date.now() - startTime

        const healthCheck: HealthCheck = {
          service: service.name,
          healthy: (result as any).healthy || (result as any).connected || true,
          responseTime,
          lastCheck: Date.now(),
          error: (result as any).error
        }

        this.healthChecks.set(service.name, healthCheck)
        this.emit('healthCheckCompleted', healthCheck)
      } catch (error) {
        const healthCheck: HealthCheck = {
          service: service.name,
          healthy: false,
          responseTime: 0,
          lastCheck: Date.now(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }

        this.healthChecks.set(service.name, healthCheck)
        this.emit('healthCheckFailed', healthCheck)
      }
    }
  }

  /**
   * Check performance thresholds and generate alerts
   */
  checkThresholds(): void {
    if (this.metrics.length === 0) return

    const latest = this.metrics[this.metrics.length - 1]

    // CPU threshold checks
    if (latest.cpu.usage > this.thresholds.cpu.critical) {
      this.createAlert('critical', 'performance', 'Critical CPU usage', {
        current: latest.cpu.usage,
        threshold: this.thresholds.cpu.critical
      })
    } else if (latest.cpu.usage > this.thresholds.cpu.warning) {
      this.createAlert('warning', 'performance', 'High CPU usage', {
        current: latest.cpu.usage,
        threshold: this.thresholds.cpu.warning
      })
    }

    // Memory threshold checks
    if (latest.memory.percentage > this.thresholds.memory.critical) {
      this.createAlert('critical', 'performance', 'Critical memory usage', {
        current: latest.memory.percentage,
        threshold: this.thresholds.memory.critical
      })
    } else if (latest.memory.percentage > this.thresholds.memory.warning) {
      this.createAlert('warning', 'performance', 'High memory usage', {
        current: latest.memory.percentage,
        threshold: this.thresholds.memory.warning
      })
    }

    // Database threshold checks
    if (latest.database.responseTime > this.thresholds.database.responseTime.critical) {
      this.createAlert('critical', 'performance', 'Critical database response time', {
        current: latest.database.responseTime,
        threshold: this.thresholds.database.responseTime.critical
      })
    }

    if (latest.database.errorRate > this.thresholds.database.errorRate.critical) {
      this.createAlert('critical', 'availability', 'Critical database error rate', {
        current: latest.database.errorRate,
        threshold: this.thresholds.database.errorRate.critical
      })
    }

    // Cache threshold checks
    if (latest.cache.hitRate < this.thresholds.cache.hitRate.critical) {
      this.createAlert('critical', 'performance', 'Critical cache hit rate', {
        current: latest.cache.hitRate,
        threshold: this.thresholds.cache.hitRate.critical
      })
    }

    // LLM threshold checks
    if (latest.llm.queueLength > this.thresholds.llm.queueLength.critical) {
      this.createAlert('critical', 'performance', 'Critical LLM queue length', {
        current: latest.llm.queueLength,
        threshold: this.thresholds.llm.queueLength.critical
      })
    }
  }

  /**
   * Create and emit alert
   */
  createAlert(
    type: Alert['type'],
    category: Alert['category'],
    message: string,
    details: any
  ): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      message,
      details,
      timestamp: Date.now(),
      resolved: false
    }

    this.alerts.push(alert)
    this.emit('alertCreated', alert)

    // Log critical alerts immediately
    if (type === 'critical') {
      console.error(`🚨 CRITICAL ALERT: ${message}`, details)
    } else if (type === 'error') {
      console.error(`❌ ERROR ALERT: ${message}`, details)
    } else {
      console.warn(`⚠️  WARNING ALERT: ${message}`, details)
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(hours: number = 24): PerformanceMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    return this.metrics.filter(m => m.timestamp > cutoff)
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved)
  }

  /**
   * Get all alerts
   */
  getAllAlerts(hours: number = 24): Alert[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    return this.alerts.filter(a => a.timestamp > cutoff)
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
      this.emit('alertResolved', alert)
      return true
    }
    return false
  }

  /**
   * Get system health summary
   */
  getHealthSummary(): {
    overall: 'healthy' | 'degraded' | 'unhealthy'
    services: HealthCheck[]
    activeAlerts: number
    criticalAlerts: number
  } {
    const services = Array.from(this.healthChecks.values())
    const healthyServices = services.filter(s => s.healthy).length
    const totalServices = services.length
    
    const activeAlerts = this.getActiveAlerts()
    const criticalAlerts = activeAlerts.filter(a => a.type === 'critical').length

    let overall: 'healthy' | 'degraded' | 'unhealthy'
    
    if (criticalAlerts > 0 || healthyServices < totalServices * 0.5) {
      overall = 'unhealthy'
    } else if (activeAlerts.length > 0 || healthyServices < totalServices * 0.8) {
      overall = 'degraded'
    } else {
      overall = 'healthy'
    }

    return {
      overall,
      services,
      activeAlerts: activeAlerts.length,
      criticalAlerts
    }
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds }
    this.emit('thresholdsUpdated', this.thresholds)
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(format: 'json' | 'prometheus' = 'json'): string {
    const latest = this.getCurrentMetrics()
    if (!latest) return ''

    if (format === 'prometheus') {
      return this.formatPrometheusMetrics(latest)
    }

    return JSON.stringify(latest, null, 2)
  }

  // Private helper methods

  private initializeHealthChecks(): void {
    const services = ['database', 'cache', 'rateLimiting', 'llmThrottling']
    services.forEach(service => {
      this.healthChecks.set(service, {
        service,
        healthy: false,
        responseTime: 0,
        lastCheck: 0
      })
    })
  }

  private async checkRateLimitingHealth(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const status = await rateLimitService.getRateLimitStatus('health-check')
      return { healthy: true }
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  private async checkLLMThrottlingHealth(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const status = llmThrottlingService.getSystemStatus()
      return { healthy: status.healthyProviders > 0 }
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  private formatPrometheusMetrics(metrics: PerformanceMetrics): string {
    return `
# HELP cpu_usage_percent CPU usage percentage
# TYPE cpu_usage_percent gauge
cpu_usage_percent ${metrics.cpu.usage}

# HELP memory_usage_percent Memory usage percentage
# TYPE memory_usage_percent gauge
memory_usage_percent ${metrics.memory.percentage}

# HELP database_response_time_ms Database response time in milliseconds
# TYPE database_response_time_ms gauge
database_response_time_ms ${metrics.database.responseTime}

# HELP cache_hit_rate_percent Cache hit rate percentage
# TYPE cache_hit_rate_percent gauge
cache_hit_rate_percent ${metrics.cache.hitRate}

# HELP llm_queue_length LLM queue length
# TYPE llm_queue_length gauge
llm_queue_length ${metrics.llm.queueLength}
    `.trim()
  }

  private cleanupOldData(): void {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 days
    
    // Clean up old metrics
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
    
    // Clean up old resolved alerts
    this.alerts = this.alerts.filter(a => 
      a.timestamp > cutoff || (!a.resolved || (a.resolvedAt && a.resolvedAt > cutoff))
    )
  }
}

// Export singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService()
export default performanceMonitoringService
