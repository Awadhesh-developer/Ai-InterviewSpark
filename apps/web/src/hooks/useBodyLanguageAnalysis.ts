/**
 * React Hook for Body Language Analysis
 * Provides easy integration of body language analysis with React components
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  BodyLanguageAnalysisService,
  type BodyLanguageResult,
  type BodyLanguageConfig,
  type PostureMetrics,
  type GestureData,
  type MovementPatterns,
  type ProfessionalPresence
} from '@/services/bodyLanguageAnalysisService'

interface UseBodyLanguageAnalysisOptions {
  autoInitialize?: boolean
  config?: Partial<BodyLanguageConfig>
  enableDetailedLogging?: boolean
}

interface BodyLanguageAnalysisHookState {
  isInitialized: boolean
  isInitializing: boolean
  isAnalyzing: boolean
  currentResult: BodyLanguageResult | null
  summary: {
    averagePosture: number
    averageConfidence: number
    averageEngagement: number
    gestureFrequency: number
    stabilityScore: number
    professionalPresence: number
    poseDetectionRate: number
  } | null
  error: string | null
  poseDetected: boolean
}

interface BodyLanguageAnalysisActions {
  initialize: () => Promise<void>
  startAnalysis: (videoElement: HTMLVideoElement) => Promise<void>
  stopAnalysis: () => void
  getCurrentResult: () => BodyLanguageResult | null
  getSummary: () => any
  updateConfig: (config: Partial<BodyLanguageConfig>) => void
  destroy: () => void
}

const DEFAULT_CONFIG: BodyLanguageConfig = {
  analysisInterval: 500,
  historyLength: 240,
  confidenceThreshold: 0.5,
  movementSensitivity: 0.1,
  gestureDetectionEnabled: true,
  postureAnalysisEnabled: true
}

export function useBodyLanguageAnalysis(options: UseBodyLanguageAnalysisOptions = {}): [BodyLanguageAnalysisHookState, BodyLanguageAnalysisActions] {
  const {
    autoInitialize = false,
    config = {},
    enableDetailedLogging = false
  } = options

  const serviceRef = useRef<BodyLanguageAnalysisService | null>(null)
  const [state, setState] = useState<BodyLanguageAnalysisHookState>({
    isInitialized: false,
    isInitializing: false,
    isAnalyzing: false,
    currentResult: null,
    summary: null,
    error: null,
    poseDetected: false
  })

  // Initialize service configuration
  const getConfig = useCallback((): BodyLanguageConfig => {
    return {
      ...DEFAULT_CONFIG,
      ...config
    }
  }, [config])

  // Initialize body language analysis service
  const initialize = useCallback(async () => {
    if (serviceRef.current || state.isInitializing) {
      return
    }

    setState(prev => ({ ...prev, isInitializing: true, error: null }))

    try {
      const serviceConfig = getConfig()
      serviceRef.current = new BodyLanguageAnalysisService(serviceConfig)
      
      // Set up event handlers
      setupEventHandlers(serviceRef.current)
      
      // Initialize the service
      await serviceRef.current.initialize()
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isInitializing: false
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Initialization failed'
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: errorMessage
      }))
      throw error
    }
  }, [getConfig, state.isInitializing])

  // Set up event handlers
  const setupEventHandlers = useCallback((service: BodyLanguageAnalysisService) => {
    service.on('initialized', () => {
      setState(prev => ({ ...prev, isInitialized: true }))
    })

    service.on('analysis.started', () => {
      setState(prev => ({ ...prev, isAnalyzing: true, error: null }))
    })

    service.on('analysis.stopped', () => {
      setState(prev => ({ ...prev, isAnalyzing: false }))
    })

    service.on('analysis.result', (result: BodyLanguageResult) => {
      setState(prev => ({ 
        ...prev, 
        currentResult: result,
        poseDetected: result.poseDetected,
        summary: service.getAnalysisSummary()
      }))
    })

    service.on('analysis.error', (data: any) => {
      setState(prev => ({ ...prev, error: data.error?.message || 'Analysis error' }))
    })
  }, [])

  // Body language analysis actions
  const startAnalysis = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!serviceRef.current) {
      throw new Error('Body language analysis service not initialized')
    }
    await serviceRef.current.startAnalysis(videoElement)
  }, [])

  const stopAnalysis = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stopAnalysis()
    }
  }, [])

  const getCurrentResult = useCallback((): BodyLanguageResult | null => {
    return serviceRef.current?.getCurrentResult() || null
  }, [])

  const getSummary = useCallback(() => {
    return serviceRef.current?.getAnalysisSummary() || null
  }, [])

  const updateConfig = useCallback((newConfig: Partial<BodyLanguageConfig>) => {
    if (serviceRef.current) {
      serviceRef.current.updateConfig(newConfig)
    }
  }, [])

  const destroy = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.destroy()
      serviceRef.current = null
    }
    
    setState({
      isInitialized: false,
      isInitializing: false,
      isAnalyzing: false,
      currentResult: null,
      summary: null,
      error: null,
      poseDetected: false
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
      if (serviceRef.current) {
        serviceRef.current.destroy()
      }
    }
  }, [])

  const actions: BodyLanguageAnalysisActions = {
    initialize,
    startAnalysis,
    stopAnalysis,
    getCurrentResult,
    getSummary,
    updateConfig,
    destroy
  }

  return [state, actions]
}

// Specialized hooks for specific use cases

export function usePostureAnalysis() {
  const [state, actions] = useBodyLanguageAnalysis({ autoInitialize: true })
  
  return {
    posture: state.currentResult?.posture || null,
    overallPosture: state.currentResult?.posture.overallPosture || 0,
    shoulderAlignment: state.currentResult?.posture.shoulderAlignment || 0,
    spineAlignment: state.currentResult?.posture.spineAlignment || 0,
    headPosition: state.currentResult?.posture.headPosition || 0,
    isAnalyzing: state.isAnalyzing,
    startAnalysis: actions.startAnalysis,
    stopAnalysis: actions.stopAnalysis,
    error: state.error
  }
}

export function useGestureAnalysis() {
  const [state, actions] = useBodyLanguageAnalysis({ autoInitialize: true })
  
  return {
    gestures: state.currentResult?.gestures || null,
    gestureType: state.currentResult?.gestures.gestureType || 'unknown',
    gestureIntensity: state.currentResult?.gestures.gestureIntensity || 0,
    gestureFrequency: state.currentResult?.gestures.gestureFrequency || 0,
    handVisibility: state.currentResult?.gestures.handVisibility || { left: false, right: false },
    isAnalyzing: state.isAnalyzing,
    startAnalysis: actions.startAnalysis,
    stopAnalysis: actions.stopAnalysis,
    error: state.error
  }
}

export function useMovementAnalysis() {
  const [state, actions] = useBodyLanguageAnalysis({ autoInitialize: true })
  
  return {
    movement: state.currentResult?.movement || null,
    overallMovement: state.currentResult?.movement.overallMovement || 0,
    fidgeting: state.currentResult?.movement.fidgeting || 0,
    stability: state.currentResult?.movement.stability || 0,
    rhythmicMovement: state.currentResult?.movement.rhythmicMovement || 0,
    isAnalyzing: state.isAnalyzing,
    startAnalysis: actions.startAnalysis,
    stopAnalysis: actions.stopAnalysis,
    error: state.error
  }
}

export function useProfessionalPresence() {
  const [state, actions] = useBodyLanguageAnalysis({ autoInitialize: true })
  
  return {
    professionalPresence: state.currentResult?.professionalPresence || null,
    confidence: state.currentResult?.professionalPresence.confidence || 0,
    engagement: state.currentResult?.professionalPresence.engagement || 0,
    openness: state.currentResult?.professionalPresence.openness || 0,
    nervousness: state.currentResult?.professionalPresence.nervousness || 0,
    authority: state.currentResult?.professionalPresence.authority || 0,
    approachability: state.currentResult?.professionalPresence.approachability || 0,
    summary: state.summary,
    isAnalyzing: state.isAnalyzing,
    startAnalysis: actions.startAnalysis,
    stopAnalysis: actions.stopAnalysis,
    error: state.error
  }
}

export function useInterviewBodyLanguage(videoElement: HTMLVideoElement | null) {
  const [state, actions] = useBodyLanguageAnalysis({ 
    autoInitialize: true,
    config: {
      analysisInterval: 500,
      confidenceThreshold: 0.5,
      gestureDetectionEnabled: true,
      postureAnalysisEnabled: true
    }
  })
  
  // Auto-start analysis when video element is provided
  useEffect(() => {
    if (videoElement && state.isInitialized && !state.isAnalyzing) {
      actions.startAnalysis(videoElement).catch(console.error)
    }
    
    return () => {
      if (state.isAnalyzing) {
        actions.stopAnalysis()
      }
    }
  }, [videoElement, state.isInitialized, state.isAnalyzing, actions])
  
  return {
    ...state,
    startAnalysis: actions.startAnalysis,
    stopAnalysis: actions.stopAnalysis,
    getSummary: actions.getSummary,
    
    // Convenience getters for common metrics
    overallPosture: state.currentResult?.posture.overallPosture || 0,
    professionalConfidence: state.currentResult?.professionalPresence.confidence || 0,
    gestureActivity: state.currentResult?.gestures.gestureIntensity || 0,
    bodyStability: state.currentResult?.movement.stability || 0,
    nervousBehavior: state.currentResult?.professionalPresence.nervousness || 0,
    engagementLevel: state.currentResult?.professionalPresence.engagement || 0,
    poseQuality: state.currentResult?.confidence || 0
  }
}

// Export types for convenience
export type {
  BodyLanguageResult,
  PostureMetrics,
  GestureData,
  MovementPatterns,
  ProfessionalPresence,
  BodyLanguageConfig
}
