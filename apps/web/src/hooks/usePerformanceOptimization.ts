/**
 * React Hook for Performance Optimization & Scalability
 * Provides comprehensive performance monitoring, optimization, and scalability management
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  PerformanceOptimizationService,
  type PerformanceOptimizationResult,
  type PerformanceMetrics,
  type OptimizationRecommendations,
  type ResourceUtilization,
  type ScalabilityAnalysis,
  type PerformanceOptimizationConfig
} from '@/services/performanceOptimizationService'
import {
  ScalabilityArchitectureService,
  type ScalabilityArchitectureResult,
  type ArchitectureAnalysis,
  type CapacityPlanning,
  type LoadBalancingStrategy,
  type MicroservicesOptimization,
  type CloudScalingStrategy
} from '@/services/scalabilityArchitectureService'
import {
  RealTimeAnalyticsService,
  type RealTimeAnalyticsResult,
  type LiveMetrics,
  type PerformanceInsights,
  type UserBehaviorAnalytics,
  type BusinessMetrics,
  type PredictiveAnalytics
} from '@/services/realTimeAnalyticsService'
import {
  EnterpriseIntegrationService,
  type EnterpriseIntegrationResult,
  type IntegrationStatus,
  type DataSyncResult,
  type APIConnectivityResult,
  type SystemHealthResult
} from '@/services/enterpriseIntegrationService'

interface UsePerformanceOptimizationOptions {
  autoInitialize?: boolean
  enableRealTimeMonitoring?: boolean
  enablePredictiveAnalysis?: boolean
  enableAutoOptimization?: boolean
  enableScalabilityAnalysis?: boolean
  enableRealTimeAnalytics?: boolean
  enableEnterpriseIntegration?: boolean
  monitoringInterval?: number
  optimizationThreshold?: number
}

interface PerformanceOptimizationHookState {
  isInitialized: boolean
  isInitializing: boolean
  isOptimizing: boolean
  isAnalyzing: boolean
  
  // Performance Optimization
  latestPerformanceResult: PerformanceOptimizationResult | null
  performanceHistory: PerformanceOptimizationResult[]
  performanceMetrics: PerformanceMetrics | null
  optimizationRecommendations: OptimizationRecommendations | null
  resourceUtilization: ResourceUtilization | null
  
  // Scalability Architecture
  latestScalabilityResult: ScalabilityArchitectureResult | null
  scalabilityHistory: ScalabilityArchitectureResult[]
  architectureAnalysis: ArchitectureAnalysis | null
  capacityPlanning: CapacityPlanning | null
  loadBalancing: LoadBalancingStrategy | null
  microservicesOptimization: MicroservicesOptimization | null
  cloudScaling: CloudScalingStrategy | null
  
  // Real-Time Analytics
  latestAnalyticsResult: RealTimeAnalyticsResult | null
  analyticsHistory: RealTimeAnalyticsResult[]
  liveMetrics: LiveMetrics | null
  performanceInsights: PerformanceInsights | null
  userBehaviorAnalytics: UserBehaviorAnalytics | null
  businessMetrics: BusinessMetrics | null
  predictiveAnalytics: PredictiveAnalytics | null
  
  // Enterprise Integration
  latestIntegrationResult: EnterpriseIntegrationResult | null
  integrationHistory: EnterpriseIntegrationResult[]
  integrationStatus: IntegrationStatus | null
  dataSync: DataSyncResult | null
  apiConnectivity: APIConnectivityResult | null
  systemHealth: SystemHealthResult | null
  
  // Overall Status
  overallConfidence: number
  systemHealthScore: number
  performanceScore: number
  scalabilityScore: number
  error: string | null
}

interface PerformanceOptimizationActions {
  initialize: () => Promise<void>
  optimizePerformance: (context?: any) => Promise<PerformanceOptimizationResult>
  analyzeScalability: (context?: any) => Promise<ScalabilityArchitectureResult>
  analyzeRealTime: (context?: any) => Promise<RealTimeAnalyticsResult>
  integrateEnterprise: (context?: any) => Promise<EnterpriseIntegrationResult>
  runComprehensiveAnalysis: () => Promise<void>
  updateConfigs: (configs: any) => void
  clearAllHistory: () => void
  destroy: () => void
}

export function usePerformanceOptimization(options: UsePerformanceOptimizationOptions = {}): [PerformanceOptimizationHookState, PerformanceOptimizationActions] {
  const {
    autoInitialize = false,
    enableRealTimeMonitoring = true,
    enablePredictiveAnalysis = true,
    enableAutoOptimization = false,
    enableScalabilityAnalysis = true,
    enableRealTimeAnalytics = true,
    enableEnterpriseIntegration = true,
    monitoringInterval = 30000,
    optimizationThreshold = 0.7
  } = options

  // Service references
  const performanceServiceRef = useRef<PerformanceOptimizationService | null>(null)
  const scalabilityServiceRef = useRef<ScalabilityArchitectureService | null>(null)
  const analyticsServiceRef = useRef<RealTimeAnalyticsService | null>(null)
  const integrationServiceRef = useRef<EnterpriseIntegrationService | null>(null)
  
  const [state, setState] = useState<PerformanceOptimizationHookState>({
    isInitialized: false,
    isInitializing: false,
    isOptimizing: false,
    isAnalyzing: false,
    
    // Performance Optimization
    latestPerformanceResult: null,
    performanceHistory: [],
    performanceMetrics: null,
    optimizationRecommendations: null,
    resourceUtilization: null,
    
    // Scalability Architecture
    latestScalabilityResult: null,
    scalabilityHistory: [],
    architectureAnalysis: null,
    capacityPlanning: null,
    loadBalancing: null,
    microservicesOptimization: null,
    cloudScaling: null,
    
    // Real-Time Analytics
    latestAnalyticsResult: null,
    analyticsHistory: [],
    liveMetrics: null,
    performanceInsights: null,
    userBehaviorAnalytics: null,
    businessMetrics: null,
    predictiveAnalytics: null,
    
    // Enterprise Integration
    latestIntegrationResult: null,
    integrationHistory: [],
    integrationStatus: null,
    dataSync: null,
    apiConnectivity: null,
    systemHealth: null,
    
    // Overall Status
    overallConfidence: 0,
    systemHealthScore: 0,
    performanceScore: 0,
    scalabilityScore: 0,
    error: null
  })

  // Initialize all services
  const initialize = useCallback(async () => {
    if (state.isInitializing || state.isInitialized) return

    setState(prev => ({ ...prev, isInitializing: true, error: null }))

    try {
      // Initialize Performance Optimization Service
      performanceServiceRef.current = new PerformanceOptimizationService({
        enableRealTimeMonitoring,
        enablePredictiveAnalysis,
        enableAutoOptimization,
        monitoringInterval,
        optimizationThreshold
      })

      // Initialize Scalability Architecture Service
      if (enableScalabilityAnalysis) {
        scalabilityServiceRef.current = new ScalabilityArchitectureService({
          enableRealTimeAnalysis: enableRealTimeMonitoring,
          enablePredictiveScaling: enablePredictiveAnalysis,
          enableAutoOptimization
        })
      }

      // Initialize Real-Time Analytics Service
      if (enableRealTimeAnalytics) {
        analyticsServiceRef.current = new RealTimeAnalyticsService({
          enableRealTimeProcessing: enableRealTimeMonitoring,
          enablePredictiveAnalytics: enablePredictiveAnalysis,
          enableAnomalyDetection: true,
          updateInterval: monitoringInterval
        })
      }

      // Initialize Enterprise Integration Service
      if (enableEnterpriseIntegration) {
        integrationServiceRef.current = new EnterpriseIntegrationService({
          enableRealTimeSync: enableRealTimeMonitoring,
          enableAutoReconciliation: enableAutoOptimization,
          enablePerformanceMonitoring: true,
          enableSecurityScanning: true
        })
      }

      // Initialize all services
      const initPromises = [
        performanceServiceRef.current.initialize()
      ]

      if (scalabilityServiceRef.current) {
        initPromises.push(scalabilityServiceRef.current.initialize())
      }

      if (analyticsServiceRef.current) {
        initPromises.push(analyticsServiceRef.current.initialize())
      }

      if (integrationServiceRef.current) {
        initPromises.push(integrationServiceRef.current.initialize())
      }

      await Promise.all(initPromises)

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isInitializing: false
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Performance optimization initialization failed'
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: errorMessage
      }))
      throw error
    }
  }, [state.isInitializing, state.isInitialized, enableRealTimeMonitoring, enablePredictiveAnalysis, enableAutoOptimization, enableScalabilityAnalysis, enableRealTimeAnalytics, enableEnterpriseIntegration, monitoringInterval, optimizationThreshold])

  // Optimize performance
  const optimizePerformance = useCallback(async (context?: any): Promise<PerformanceOptimizationResult> => {
    if (!performanceServiceRef.current) {
      throw new Error('Performance Optimization Service not initialized')
    }

    setState(prev => ({ ...prev, isOptimizing: true, error: null }))

    try {
      const result = await performanceServiceRef.current.optimizePerformance(context)

      setState(prev => ({
        ...prev,
        latestPerformanceResult: result,
        performanceHistory: [...prev.performanceHistory, result].slice(-50),
        performanceMetrics: result.performanceMetrics,
        optimizationRecommendations: result.optimizationRecommendations,
        resourceUtilization: result.resourceUtilization,
        performanceScore: result.performanceMetrics.systemHealth.healthScore,
        isOptimizing: false
      }))

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Performance optimization failed'
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        error: errorMessage
      }))
      throw error
    }
  }, [])

  // Analyze scalability
  const analyzeScalability = useCallback(async (context?: any): Promise<ScalabilityArchitectureResult> => {
    if (!scalabilityServiceRef.current) {
      throw new Error('Scalability Architecture Service not initialized')
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }))

    try {
      const result = await scalabilityServiceRef.current.analyzeScalabilityArchitecture(context)

      setState(prev => ({
        ...prev,
        latestScalabilityResult: result,
        scalabilityHistory: [...prev.scalabilityHistory, result].slice(-50),
        architectureAnalysis: result.architectureAnalysis,
        capacityPlanning: result.capacityPlanning,
        loadBalancing: result.loadBalancing,
        microservicesOptimization: result.microservicesOptimization,
        cloudScaling: result.cloudScaling,
        scalabilityScore: result.architectureAnalysis.currentArchitecture.scalabilityScore,
        isAnalyzing: false
      }))

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Scalability analysis failed'
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }))
      throw error
    }
  }, [])

  // Analyze real-time
  const analyzeRealTime = useCallback(async (context?: any): Promise<RealTimeAnalyticsResult> => {
    if (!analyticsServiceRef.current) {
      throw new Error('Real-Time Analytics Service not initialized')
    }

    try {
      const result = await analyticsServiceRef.current.analyzeRealTime(context)

      setState(prev => ({
        ...prev,
        latestAnalyticsResult: result,
        analyticsHistory: [...prev.analyticsHistory, result].slice(-50),
        liveMetrics: result.liveMetrics,
        performanceInsights: result.performanceInsights,
        userBehaviorAnalytics: result.userBehaviorAnalytics,
        businessMetrics: result.businessMetrics,
        predictiveAnalytics: result.predictiveAnalytics
      }))

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Real-time analytics failed'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Integrate enterprise
  const integrateEnterprise = useCallback(async (context?: any): Promise<EnterpriseIntegrationResult> => {
    if (!integrationServiceRef.current) {
      throw new Error('Enterprise Integration Service not initialized')
    }

    try {
      const result = await integrationServiceRef.current.integrateEnterprise(context)

      setState(prev => ({
        ...prev,
        latestIntegrationResult: result,
        integrationHistory: [...prev.integrationHistory, result].slice(-50),
        integrationStatus: result.integrationStatus,
        dataSync: result.dataSync,
        apiConnectivity: result.apiConnectivity,
        systemHealth: result.systemHealth,
        systemHealthScore: result.systemHealth.overallHealth
      }))

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Enterprise integration failed'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Run comprehensive analysis
  const runComprehensiveAnalysis = useCallback(async () => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }))

    try {
      const promises = []

      // Performance optimization
      if (performanceServiceRef.current) {
        promises.push(optimizePerformance())
      }

      // Scalability analysis
      if (scalabilityServiceRef.current) {
        promises.push(analyzeScalability())
      }

      // Real-time analytics
      if (analyticsServiceRef.current) {
        promises.push(analyzeRealTime())
      }

      // Enterprise integration
      if (integrationServiceRef.current) {
        promises.push(integrateEnterprise())
      }

      const results = await Promise.allSettled(promises)

      // Calculate overall confidence
      const confidenceValues = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value.confidence)
        .filter(confidence => typeof confidence === 'number')

      const overallConfidence = confidenceValues.length > 0 
        ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length 
        : 0

      setState(prev => ({
        ...prev,
        overallConfidence,
        isAnalyzing: false
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Comprehensive analysis failed'
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }))
    }
  }, [optimizePerformance, analyzeScalability, analyzeRealTime, integrateEnterprise])

  // Update configurations
  const updateConfigs = useCallback((configs: any) => {
    if (configs.performance && performanceServiceRef.current) {
      performanceServiceRef.current.updateConfig(configs.performance)
    }
    if (configs.scalability && scalabilityServiceRef.current) {
      scalabilityServiceRef.current.updateConfig(configs.scalability)
    }
    if (configs.analytics && analyticsServiceRef.current) {
      analyticsServiceRef.current.updateConfig(configs.analytics)
    }
    if (configs.integration && integrationServiceRef.current) {
      integrationServiceRef.current.updateConfig(configs.integration)
    }
  }, [])

  // Clear all history
  const clearAllHistory = useCallback(() => {
    if (performanceServiceRef.current) {
      performanceServiceRef.current.clearHistory()
    }
    if (scalabilityServiceRef.current) {
      scalabilityServiceRef.current.clearHistory()
    }
    if (analyticsServiceRef.current) {
      analyticsServiceRef.current.clearHistory()
    }
    if (integrationServiceRef.current) {
      integrationServiceRef.current.clearHistory()
    }
    
    setState(prev => ({
      ...prev,
      performanceHistory: [],
      scalabilityHistory: [],
      analyticsHistory: [],
      integrationHistory: [],
      latestPerformanceResult: null,
      latestScalabilityResult: null,
      latestAnalyticsResult: null,
      latestIntegrationResult: null,
      performanceMetrics: null,
      optimizationRecommendations: null,
      resourceUtilization: null,
      architectureAnalysis: null,
      capacityPlanning: null,
      loadBalancing: null,
      microservicesOptimization: null,
      cloudScaling: null,
      liveMetrics: null,
      performanceInsights: null,
      userBehaviorAnalytics: null,
      businessMetrics: null,
      predictiveAnalytics: null,
      integrationStatus: null,
      dataSync: null,
      apiConnectivity: null,
      systemHealth: null
    }))
  }, [])

  // Destroy services
  const destroy = useCallback(() => {
    if (performanceServiceRef.current) {
      performanceServiceRef.current.destroy()
      performanceServiceRef.current = null
    }
    if (scalabilityServiceRef.current) {
      scalabilityServiceRef.current.destroy()
      scalabilityServiceRef.current = null
    }
    if (analyticsServiceRef.current) {
      analyticsServiceRef.current.destroy()
      analyticsServiceRef.current = null
    }
    if (integrationServiceRef.current) {
      integrationServiceRef.current.destroy()
      integrationServiceRef.current = null
    }

    setState({
      isInitialized: false,
      isInitializing: false,
      isOptimizing: false,
      isAnalyzing: false,
      
      latestPerformanceResult: null,
      performanceHistory: [],
      performanceMetrics: null,
      optimizationRecommendations: null,
      resourceUtilization: null,
      
      latestScalabilityResult: null,
      scalabilityHistory: [],
      architectureAnalysis: null,
      capacityPlanning: null,
      loadBalancing: null,
      microservicesOptimization: null,
      cloudScaling: null,
      
      latestAnalyticsResult: null,
      analyticsHistory: [],
      liveMetrics: null,
      performanceInsights: null,
      userBehaviorAnalytics: null,
      businessMetrics: null,
      predictiveAnalytics: null,
      
      latestIntegrationResult: null,
      integrationHistory: [],
      integrationStatus: null,
      dataSync: null,
      apiConnectivity: null,
      systemHealth: null,
      
      overallConfidence: 0,
      systemHealthScore: 0,
      performanceScore: 0,
      scalabilityScore: 0,
      error: null
    })
  }, [])

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize && !state.isInitialized && !state.isInitializing) {
      initialize().catch(console.error)
    }
  }, [autoInitialize, initialize, state.isInitialized, state.isInitializing])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroy()
    }
  }, [destroy])

  const actions: PerformanceOptimizationActions = {
    initialize,
    optimizePerformance,
    analyzeScalability,
    analyzeRealTime,
    integrateEnterprise,
    runComprehensiveAnalysis,
    updateConfigs,
    clearAllHistory,
    destroy
  }

  return [state, actions]
}

// Specialized hook for enterprise performance optimization
export function useEnterprisePerformanceOptimization() {
  const [state, actions] = usePerformanceOptimization({
    autoInitialize: true,
    enableRealTimeMonitoring: true,
    enablePredictiveAnalysis: true,
    enableAutoOptimization: false,
    enableScalabilityAnalysis: true,
    enableRealTimeAnalytics: true,
    enableEnterpriseIntegration: true,
    monitoringInterval: 30000,
    optimizationThreshold: 0.8
  })

  return {
    ...state,
    ...actions,
    
    // Convenience getters for performance metrics
    getCurrentCPUUsage: () => state.resourceUtilization?.currentUtilization.cpu || 0,
    getCurrentMemoryUsage: () => state.resourceUtilization?.currentUtilization.memory || 0,
    getCurrentDiskUsage: () => state.resourceUtilization?.currentUtilization.disk || 0,
    getCurrentNetworkUsage: () => state.resourceUtilization?.currentUtilization.network || 0,
    
    getAverageResponseTime: () => state.performanceMetrics?.responseTime.averageResponseTime || 0,
    getThroughput: () => state.performanceMetrics?.throughput.requestsPerSecond || 0,
    getErrorRate: () => state.performanceMetrics?.errorRates.overallErrorRate || 0,
    getAvailability: () => state.performanceMetrics?.systemHealth.availability || 0,
    
    // Convenience getters for scalability metrics
    getScalabilityScore: () => state.architectureAnalysis?.currentArchitecture.scalabilityScore || 0,
    getMaxThroughput: () => state.capacityPlanning?.currentCapacity.maxRequestsPerSecond || 0,
    getMaxConcurrentUsers: () => state.capacityPlanning?.currentCapacity.maxConcurrentUsers || 0,
    
    // Convenience getters for real-time analytics
    getActiveUsers: () => state.liveMetrics?.currentUsers.activeUsers || 0,
    getConcurrentInterviews: () => state.liveMetrics?.interviewMetrics.activeInterviews || 0,
    getUserSatisfaction: () => state.liveMetrics?.currentUsers.engagementMetrics.satisfactionScore || 0,
    
    // Convenience getters for enterprise integration
    getActiveIntegrations: () => state.integrationStatus?.activeIntegrations.length || 0,
    getIntegrationHealth: () => state.integrationStatus?.integrationHealth.overallHealth || 0,
    getSyncOperations: () => state.dataSync?.syncOperations.length || 0,
    
    // Helper methods
    isPerformanceHealthy: () => {
      const cpu = state.resourceUtilization?.currentUtilization.cpu || 0
      const memory = state.resourceUtilization?.currentUtilization.memory || 0
      const errorRate = state.performanceMetrics?.errorRates.overallErrorRate || 0
      return cpu < 0.8 && memory < 0.85 && errorRate < 0.05
    },
    
    isScalabilityOptimal: () => {
      const scalabilityScore = state.architectureAnalysis?.currentArchitecture.scalabilityScore || 0
      return scalabilityScore > 0.8
    },
    
    hasPerformanceIssues: () => {
      const responseTime = state.performanceMetrics?.responseTime.averageResponseTime || 0
      const errorRate = state.performanceMetrics?.errorRates.overallErrorRate || 0
      return responseTime > 2000 || errorRate > 0.05
    },
    
    needsOptimization: () => {
      const priority = state.optimizationRecommendations?.priority
      return priority === 'high' || priority === 'critical'
    },
    
    getOptimizationPriority: () => state.optimizationRecommendations?.priority || 'low',
    
    getImmediateOptimizations: () => state.optimizationRecommendations?.immediate || [],
    
    getShortTermOptimizations: () => state.optimizationRecommendations?.shortTerm || [],
    
    getLongTermOptimizations: () => state.optimizationRecommendations?.longTerm || [],
    
    getPerformanceGrade: () => {
      const score = state.performanceScore
      if (score > 0.9) return 'A'
      if (score > 0.8) return 'B'
      if (score > 0.7) return 'C'
      if (score > 0.6) return 'D'
      return 'F'
    },
    
    getScalabilityGrade: () => {
      const score = state.scalabilityScore
      if (score > 0.9) return 'A'
      if (score > 0.8) return 'B'
      if (score > 0.7) return 'C'
      if (score > 0.6) return 'D'
      return 'F'
    },
    
    getSystemHealthGrade: () => {
      const score = state.systemHealthScore
      if (score > 0.95) return 'A'
      if (score > 0.9) return 'B'
      if (score > 0.85) return 'C'
      if (score > 0.8) return 'D'
      return 'F'
    },
    
    getOverallGrade: () => {
      const confidence = state.overallConfidence
      if (confidence > 0.9) return 'A'
      if (confidence > 0.8) return 'B'
      if (confidence > 0.7) return 'C'
      if (confidence > 0.6) return 'D'
      return 'F'
    }
  }
}

// Export types for convenience
export type {
  PerformanceOptimizationResult,
  PerformanceMetrics,
  OptimizationRecommendations,
  ResourceUtilization,
  ScalabilityAnalysis,
  ScalabilityArchitectureResult,
  ArchitectureAnalysis,
  CapacityPlanning,
  RealTimeAnalyticsResult,
  LiveMetrics,
  PerformanceInsights,
  EnterpriseIntegrationResult,
  IntegrationStatus
}
