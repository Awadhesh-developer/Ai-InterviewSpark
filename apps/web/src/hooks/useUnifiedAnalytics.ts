/**
 * React Hook for Unified Analytics
 * Provides comprehensive analysis combining all interview systems
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  UnifiedAnalyticsService,
  type UnifiedMetrics,
  type PerformanceInsights,
  type OptimizationConfig
} from '@/services/unifiedAnalyticsService'
import { type FacialAnalysisResult } from '@/services/facialAnalysisService'
import { type GazePoint, type AttentionMetrics } from '@/services/gazeTrackingService'
import { type BodyLanguageResult } from '@/services/bodyLanguageAnalysisService'

interface VoiceMetrics {
  clarity: number
  pace: number
  volume: number
  confidence: number
  engagement: number
}

interface UseUnifiedAnalyticsOptions {
  autoInitialize?: boolean
  config?: Partial<OptimizationConfig>
  enableRealTimeUpdates?: boolean
}

interface UnifiedAnalyticsHookState {
  isInitialized: boolean
  isProcessing: boolean
  currentMetrics: UnifiedMetrics | null
  performanceInsights: PerformanceInsights | null
  systemHealth: {
    averageProcessingTime: number
    memoryUsage: number
    analysisHistory: number
    systemHealth: number
  }
  error: string | null
}

interface UnifiedAnalyticsActions {
  initialize: () => void
  processAnalysisData: (data: {
    facial?: FacialAnalysisResult
    gaze?: GazePoint & { metrics: AttentionMetrics }
    bodyLanguage?: BodyLanguageResult
    voice?: VoiceMetrics
  }) => Promise<UnifiedMetrics>
  generateInsights: () => PerformanceInsights | null
  getSystemHealth: () => any
  destroy: () => void
}

const DEFAULT_CONFIG: OptimizationConfig = {
  analysisFrequency: 500,
  memoryOptimization: true,
  realTimeProcessing: true,
  adaptiveThresholds: true,
  performanceMonitoring: true
}

export function useUnifiedAnalytics(options: UseUnifiedAnalyticsOptions = {}): [UnifiedAnalyticsHookState, UnifiedAnalyticsActions] {
  const {
    autoInitialize = false,
    config = {},
    enableRealTimeUpdates = true
  } = options

  const serviceRef = useRef<UnifiedAnalyticsService | null>(null)
  const [state, setState] = useState<UnifiedAnalyticsHookState>({
    isInitialized: false,
    isProcessing: false,
    currentMetrics: null,
    performanceInsights: null,
    systemHealth: {
      averageProcessingTime: 0,
      memoryUsage: 0,
      analysisHistory: 0,
      systemHealth: 1
    },
    error: null
  })

  // Initialize service configuration
  const getConfig = useCallback((): OptimizationConfig => {
    return {
      ...DEFAULT_CONFIG,
      ...config
    }
  }, [config])

  // Initialize unified analytics service
  const initialize = useCallback(() => {
    if (serviceRef.current) return

    try {
      const serviceConfig = getConfig()
      serviceRef.current = new UnifiedAnalyticsService(serviceConfig)
      
      // Set up event handlers
      if (enableRealTimeUpdates) {
        setupEventHandlers(serviceRef.current)
      }
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        error: null
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Initialization failed'
      setState(prev => ({
        ...prev,
        error: errorMessage
      }))
    }
  }, [getConfig, enableRealTimeUpdates])

  // Set up event handlers
  const setupEventHandlers = useCallback((service: UnifiedAnalyticsService) => {
    service.on('metrics.updated', (metrics: UnifiedMetrics) => {
      setState(prev => ({ 
        ...prev, 
        currentMetrics: metrics,
        performanceInsights: service.generatePerformanceInsights(metrics),
        systemHealth: service.getPerformanceMetrics()
      }))
    })

    service.on('analysis.error', (data: any) => {
      setState(prev => ({ ...prev, error: data.error?.message || 'Analysis error' }))
    })
  }, [])

  // Process analysis data from all systems
  const processAnalysisData = useCallback(async (data: {
    facial?: FacialAnalysisResult
    gaze?: GazePoint & { metrics: AttentionMetrics }
    bodyLanguage?: BodyLanguageResult
    voice?: VoiceMetrics
  }): Promise<UnifiedMetrics> => {
    if (!serviceRef.current) {
      throw new Error('Unified analytics service not initialized')
    }

    setState(prev => ({ ...prev, isProcessing: true }))

    try {
      const metrics = await serviceRef.current.processAnalysisData(data)
      
      setState(prev => ({
        ...prev,
        currentMetrics: metrics,
        performanceInsights: serviceRef.current!.generatePerformanceInsights(metrics),
        systemHealth: serviceRef.current!.getPerformanceMetrics(),
        isProcessing: false
      }))

      return metrics
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      }))
      throw error
    }
  }, [])

  // Generate performance insights
  const generateInsights = useCallback((): PerformanceInsights | null => {
    if (!serviceRef.current || !state.currentMetrics) {
      return null
    }
    return serviceRef.current.generatePerformanceInsights(state.currentMetrics)
  }, [state.currentMetrics])

  // Get system health metrics
  const getSystemHealth = useCallback(() => {
    if (!serviceRef.current) {
      return null
    }
    return serviceRef.current.getPerformanceMetrics()
  }, [])

  // Destroy service
  const destroy = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.destroy()
      serviceRef.current = null
    }
    
    setState({
      isInitialized: false,
      isProcessing: false,
      currentMetrics: null,
      performanceInsights: null,
      systemHealth: {
        averageProcessingTime: 0,
        memoryUsage: 0,
        analysisHistory: 0,
        systemHealth: 1
      },
      error: null
    })
  }, [])

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize && !state.isInitialized) {
      initialize()
    }
  }, [autoInitialize, initialize, state.isInitialized])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.destroy()
      }
    }
  }, [])

  const actions: UnifiedAnalyticsActions = {
    initialize,
    processAnalysisData,
    generateInsights,
    getSystemHealth,
    destroy
  }

  return [state, actions]
}

// Specialized hook for interview analytics
export function useInterviewAnalytics() {
  const [state, actions] = useUnifiedAnalytics({ 
    autoInitialize: true,
    enableRealTimeUpdates: true,
    config: {
      analysisFrequency: 500,
      memoryOptimization: true,
      realTimeProcessing: true
    }
  })
  
  return {
    ...state,
    ...actions,
    
    // Convenience getters for common metrics
    overallScore: state.currentMetrics?.overall.performanceScore || 0,
    engagementLevel: state.currentMetrics?.overall.engagementLevel || 0,
    professionalPresence: state.currentMetrics?.overall.professionalPresence || 0,
    communicationEffectiveness: state.currentMetrics?.overall.communicationEffectiveness || 0,
    confidenceLevel: state.currentMetrics?.overall.confidenceLevel || 0,
    
    // Component scores
    voiceScore: state.currentMetrics?.voice.confidence || 0,
    facialScore: state.currentMetrics?.facial.facialEngagement || 0,
    gazeScore: state.currentMetrics?.gaze.attentionFocus || 0,
    bodyLanguageScore: state.currentMetrics?.bodyLanguage.professionalDemeanor || 0,
    
    // Insights
    strengths: state.performanceInsights?.strengths || [],
    improvements: state.performanceInsights?.areasForImprovement || [],
    recommendations: state.performanceInsights?.recommendations || [],
    assessment: state.performanceInsights?.overallAssessment || '',
    
    // Performance
    processingTime: state.systemHealth.averageProcessingTime,
    memoryUsage: state.systemHealth.memoryUsage,
    systemHealthScore: state.systemHealth.systemHealth
  }
}

// Hook for real-time performance monitoring
export function usePerformanceMonitoring() {
  const [state, actions] = useUnifiedAnalytics({ 
    autoInitialize: true,
    config: {
      performanceMonitoring: true,
      memoryOptimization: true
    }
  })
  
  return {
    systemHealth: state.systemHealth,
    isHealthy: state.systemHealth.systemHealth > 0.8,
    processingTime: state.systemHealth.averageProcessingTime,
    memoryUsage: state.systemHealth.memoryUsage,
    analysisCount: state.systemHealth.analysisHistory,
    error: state.error,
    getSystemHealth: actions.getSystemHealth
  }
}

// Export types for convenience
export type {
  UnifiedMetrics,
  PerformanceInsights,
  OptimizationConfig,
  VoiceMetrics
}
