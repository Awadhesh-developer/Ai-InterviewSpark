/**
 * Performance Monitoring Middleware
 * Tracks API performance metrics and request patterns
 */

import { Request, Response, NextFunction } from 'express'
import { performanceMonitoringService } from '../services/performanceMonitoringService'

export interface RequestMetrics {
  method: string
  path: string
  statusCode: number
  responseTime: number
  timestamp: number
  userAgent?: string
  ip: string
  userId?: string
  error?: string
}

class PerformanceMiddleware {
  private requestMetrics: RequestMetrics[] = []
  private readonly MAX_METRICS_HISTORY = 10000

  /**
   * Main performance tracking middleware
   */
  trackPerformance() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now()
      
      // Track request start
      const originalSend = res.send
      const originalJson = res.json
      
      // Capture metrics closure with middleware instance
      const captureMetrics = (response: Response, body: any) => {
        const endTime = Date.now()
        const responseTime = endTime - startTime
        
        const metrics: RequestMetrics = {
          method: req.method,
          path: response.req?.route?.path || req.path,
          statusCode: response.statusCode,
          responseTime,
          timestamp: endTime,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          userId: (req as any).user?.id
        }
        
        // Add error details for failed requests
        if (response.statusCode >= 400) {
          metrics.error = typeof body === 'object' && body.error 
            ? body.error 
            : `HTTP ${response.statusCode}`
        }
        
        this.recordRequestMetrics(metrics)
        
        // Set performance headers
        response.set('X-Response-Time', `${responseTime}ms`)
        response.set('X-Timestamp', endTime.toString())
        
        // Emit performance event for real-time monitoring
        performanceMonitoringService.emit('requestCompleted', metrics)
      }
      
      // Override response methods to capture metrics
      res.send = function(body: any) {
        captureMetrics(this, body)
        return originalSend.call(this, body)
      }
      
      res.json = function(body: any) {
        captureMetrics(this, body)
        return originalJson.call(this, body)
      }
      
      next()
    }
  }

  /**
   * Record request metrics
   */
  private recordRequestMetrics(metrics: RequestMetrics): void {
    this.requestMetrics.push(metrics)
    
    // Log slow requests
    if (metrics.responseTime > 2000) {
      console.warn(`🐌 Slow request detected: ${metrics.method} ${metrics.path} - ${metrics.responseTime}ms`)
    }
    
    // Log error requests
    if (metrics.statusCode >= 500) {
      console.error(`❌ Server error: ${metrics.method} ${metrics.path} - ${metrics.statusCode}`)
    }
    
    // Cleanup old metrics
    if (this.requestMetrics.length > this.MAX_METRICS_HISTORY) {
      this.requestMetrics = this.requestMetrics.slice(-this.MAX_METRICS_HISTORY)
    }
  }

  /**
   * Get request performance statistics
   */
  getRequestStats(timeWindowMs: number = 60000): {
    totalRequests: number
    averageResponseTime: number
    requestsPerSecond: number
    errorRate: number
    slowRequests: number
    statusCodeDistribution: Record<string, number>
    topEndpoints: Array<{ path: string; count: number; avgResponseTime: number }>
  } {
    const cutoff = Date.now() - timeWindowMs
    const recentMetrics = this.requestMetrics.filter(m => m.timestamp > cutoff)
    
    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 0,
        slowRequests: 0,
        statusCodeDistribution: {},
        topEndpoints: []
      }
    }
    
    const totalRequests = recentMetrics.length
    const totalResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0)
    const averageResponseTime = totalResponseTime / totalRequests
    const requestsPerSecond = totalRequests / (timeWindowMs / 1000)
    
    const errorRequests = recentMetrics.filter(m => m.statusCode >= 400).length
    const errorRate = (errorRequests / totalRequests) * 100
    
    const slowRequests = recentMetrics.filter(m => m.responseTime > 2000).length
    
    // Status code distribution
    const statusCodeDistribution: Record<string, number> = {}
    recentMetrics.forEach(m => {
      const statusRange = `${Math.floor(m.statusCode / 100)}xx`
      statusCodeDistribution[statusRange] = (statusCodeDistribution[statusRange] || 0) + 1
    })
    
    // Top endpoints by request count
    const endpointStats: Record<string, { count: number; totalTime: number }> = {}
    recentMetrics.forEach(m => {
      if (!endpointStats[m.path]) {
        endpointStats[m.path] = { count: 0, totalTime: 0 }
      }
      endpointStats[m.path].count++
      endpointStats[m.path].totalTime += m.responseTime
    })
    
    const topEndpoints = Object.entries(endpointStats)
      .map(([path, stats]) => ({
        path,
        count: stats.count,
        avgResponseTime: stats.totalTime / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return {
      totalRequests,
      averageResponseTime,
      requestsPerSecond,
      errorRate,
      slowRequests,
      statusCodeDistribution,
      topEndpoints
    }
  }

  /**
   * Get recent error requests
   */
  getRecentErrors(limit: number = 50): RequestMetrics[] {
    return this.requestMetrics
      .filter(m => m.statusCode >= 400)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Get slow requests
   */
  getSlowRequests(thresholdMs: number = 2000, limit: number = 50): RequestMetrics[] {
    return this.requestMetrics
      .filter(m => m.responseTime > thresholdMs)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, limit)
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.requestMetrics = []
  }
}

// Create singleton instance
const performanceMiddleware = new PerformanceMiddleware()

/**
 * Health check middleware
 */
export function healthCheckMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const healthSummary = performanceMonitoringService.getHealthSummary()
      const requestStats = performanceMiddleware.getRequestStats()
      
      const health = {
        status: healthSummary.overall,
        timestamp: new Date().toISOString(),
        services: healthSummary.services.reduce((acc, service) => {
          acc[service.service] = {
            healthy: service.healthy,
            responseTime: service.responseTime,
            lastCheck: new Date(service.lastCheck).toISOString(),
            error: service.error
          }
          return acc
        }, {} as any),
        performance: {
          requestsPerSecond: requestStats.requestsPerSecond,
          averageResponseTime: requestStats.averageResponseTime,
          errorRate: requestStats.errorRate
        },
        alerts: {
          active: healthSummary.activeAlerts,
          critical: healthSummary.criticalAlerts
        }
      }
      
      // Set appropriate status code based on health
      const statusCode = healthSummary.overall === 'healthy' ? 200 
        : healthSummary.overall === 'degraded' ? 200 
        : 503
      
      res.status(statusCode).json(health)
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      })
    }
  }
}

/**
 * Metrics endpoint middleware
 */
export function metricsEndpointMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const format = req.query.format as string || 'json'
      const timeWindow = parseInt(req.query.timeWindow as string) || 3600000 // 1 hour default
      
      if (format === 'prometheus') {
        const prometheusMetrics = performanceMonitoringService.exportMetrics('prometheus')
        res.set('Content-Type', 'text/plain')
        res.send(prometheusMetrics)
      } else {
        const currentMetrics = performanceMonitoringService.getCurrentMetrics()
        const requestStats = performanceMiddleware.getRequestStats(timeWindow)
        const healthSummary = performanceMonitoringService.getHealthSummary()
        
        const metrics = {
          timestamp: new Date().toISOString(),
          system: currentMetrics,
          requests: requestStats,
          health: healthSummary,
          alerts: {
            active: performanceMonitoringService.getActiveAlerts(),
            recent: performanceMonitoringService.getAllAlerts(24)
          }
        }
        
        res.json(metrics)
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

/**
 * Performance dashboard middleware
 */
export function performanceDashboardMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timeWindow = parseInt(req.query.timeWindow as string) || 3600000 // 1 hour
      
      const dashboard = {
        overview: {
          health: performanceMonitoringService.getHealthSummary(),
          metrics: performanceMonitoringService.getCurrentMetrics(),
          requests: performanceMiddleware.getRequestStats(timeWindow)
        },
        trends: {
          metrics: performanceMonitoringService.getMetricsHistory(24),
          errors: performanceMiddleware.getRecentErrors(100),
          slowRequests: performanceMiddleware.getSlowRequests(1000, 50)
        },
        alerts: {
          active: performanceMonitoringService.getActiveAlerts(),
          recent: performanceMonitoringService.getAllAlerts(24)
        }
      }
      
      res.json(dashboard)
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

/**
 * Alert management middleware
 */
export function alertManagementMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { method } = req
      
      if (method === 'GET') {
        const alerts = performanceMonitoringService.getAllAlerts()
        res.json({ alerts })
      } else if (method === 'POST') {
        const { alertId } = req.body
        const resolved = performanceMonitoringService.resolveAlert(alertId)
        
        if (resolved) {
          res.json({ success: true, message: 'Alert resolved' })
        } else {
          res.status(404).json({ error: 'Alert not found or already resolved' })
        }
      } else {
        res.status(405).json({ error: 'Method not allowed' })
      }
    } catch (error) {
      res.status(500).json({
        error: 'Alert management failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

// Export the middleware instance and functions
export { performanceMiddleware }
export default performanceMiddleware.trackPerformance()
