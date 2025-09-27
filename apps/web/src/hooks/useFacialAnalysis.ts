/**
 * React Hook for Facial Analysis
 * Provides easy integration of facial analysis with React components
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  FacialAnalysisService, 
  type FacialAnalysisResult, 
  type FacialAnalysisConfig,
  type EmotionScores,
  type EyeContactMetrics,
  type HeadPoseData,
  type EngagementMetrics
} from '@/services/facialAnalysisService'

interface UseFacialAnalysisOptions {
  autoInitialize?: boolean
  config?: Partial<FacialAnalysisConfig>
  enableDetailedLogging?: boolean
}

interface FacialAnalysisHookState {
  isInitialized: boolean
  isInitializing: boolean
  isAnalyzing: boolean
  currentResult: FacialAnalysisResult | null
  summary: {
    averageEngagement: number
    emotionalRange: EmotionScores
    eyeContactPercentage: number
    headPoseStability: number
    professionalPresence: number
    faceDetectionRate: number
  } | null
  error: string | null
  modelsLoaded: boolean
}

interface FacialAnalysisActions {
  initialize: () => Promise<void>
  startAnalysis: (videoElement: HTMLVideoElement) => Promise<void>
  stopAnalysis: () => void
  getCurrentResult: () => FacialAnalysisResult | null
  getSummary: () => any
  updateConfig: (config: Partial<FacialAnalysisConfig>) => void
  destroy: () => void
}

const DEFAULT_CONFIG: FacialAnalysisConfig = {
  analysisInterval: 500,
  historyLength: 240,
  confidenceThreshold: 0.5,
  enableDetailedLogging: false
}

export function useFacialAnalysis(options: UseFacialAnalysisOptions = {}): [FacialAnalysisHookState, FacialAnalysisActions] {
  const {
    autoInitialize = false,
    config = {},
    enableDetailedLogging = false
  } = options

  const serviceRef = useRef<FacialAnalysisService | null>(null)
  const [state, setState] = useState<FacialAnalysisHookState>({
    isInitialized: false,
    isInitializing: false,
    isAnalyzing: false,
    currentResult: null,
    summary: null,
    error: null,
    modelsLoaded: false
  })

  // Initialize service configuration
  const getConfig = useCallback((): FacialAnalysisConfig => {
    return {
      ...DEFAULT_CONFIG,
      ...config,
      enableDetailedLogging
    }
  }, [config, enableDetailedLogging])

  // Initialize facial analysis service
  const initialize = useCallback(async () => {
    if (serviceRef.current || state.isInitializing) {
      return
    }

    setState(prev => ({ ...prev, isInitializing: true, error: null }))

    try {
      const serviceConfig = getConfig()
      serviceRef.current = new FacialAnalysisService(serviceConfig)
      
      // Set up event handlers
      setupEventHandlers(serviceRef.current)
      
      // Initialize the service (load models)
      await serviceRef.current.initialize()
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isInitializing: false,
        modelsLoaded: true
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
  const setupEventHandlers = useCallback((service: FacialAnalysisService) => {
    service.on('models.loaded', () => {
      setState(prev => ({ ...prev, modelsLoaded: true }))
    })

    service.on('analysis.started', () => {
      setState(prev => ({ ...prev, isAnalyzing: true, error: null }))
    })

    service.on('analysis.stopped', () => {
      setState(prev => ({ ...prev, isAnalyzing: false }))
    })

    service.on('analysis.result', (result: FacialAnalysisResult) => {
      setState(prev => ({ 
        ...prev, 
        currentResult: result,
        summary: service.getAnalysisSummary()
      }))
    })

    service.on('analysis.error', (data: any) => {
      setState(prev => ({ ...prev, error: data.error?.message || 'Analysis error' }))
    })
  }, [])

  // Facial analysis actions
  const startAnalysis = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!serviceRef.current) {
      throw new Error('Facial analysis service not initialized')
    }
    await serviceRef.current.startAnalysis(videoElement)
  }, [])

  const stopAnalysis = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stopAnalysis()
    }
  }, [])

  const getCurrentResult = useCallback((): FacialAnalysisResult | null => {
    return serviceRef.current?.getCurrentResult() || null
  }, [])

  const getSummary = useCallback(() => {
    return serviceRef.current?.getAnalysisSummary() || null
  }, [])

  const updateConfig = useCallback((newConfig: Partial<FacialAnalysisConfig>) => {
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
      modelsLoaded: false
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

  const actions: FacialAnalysisActions = {
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

export function useEmotionDetection() {
  const [state, actions] = useFacialAnalysis({ autoInitialize: true })
  
  return {
    emotions: state.currentResult?.emotions || null,
    isAnalyzing: state.isAnalyzing,
    startAnalysis: actions.startAnalysis,
    stopAnalysis: actions.stopAnalysis,
    error: state.error
  }
}

export function useEyeContactTracking() {
  const [state, actions] = useFacialAnalysis({ autoInitialize: true })
  
  return {
    eyeContact: state.currentResult?.eyeContact || null,
    isLookingAtCamera: state.currentResult?.eyeContact.isLookingAtCamera || false,
    eyeContactPercentage: state.summary?.eyeContactPercentage || 0,
    startAnalysis: actions.startAnalysis,
    stopAnalysis: actions.stopAnalysis,
    error: state.error
  }
}

export function useEngagementMetrics() {
  const [state, actions] = useFacialAnalysis({ autoInitialize: true })
  
  return {
    engagement: state.currentResult?.engagement || null,
    overallEngagement: state.currentResult?.engagement.overallEngagement || 0,
    professionalPresence: state.currentResult?.engagement.professionalPresence || 0,
    summary: state.summary,
    startAnalysis: actions.startAnalysis,
    stopAnalysis: actions.stopAnalysis,
    error: state.error
  }
}

export function useHeadPoseTracking() {
  const [state, actions] = useFacialAnalysis({ autoInitialize: true })
  
  return {
    headPose: state.currentResult?.headPose || null,
    isWellPositioned: state.currentResult?.headPose.isWellPositioned || false,
    stability: state.currentResult?.headPose.stability || 0,
    startAnalysis: actions.startAnalysis,
    stopAnalysis: actions.stopAnalysis,
    error: state.error
  }
}

export function useInterviewFacialAnalysis(videoElement: HTMLVideoElement | null) {
  const [state, actions] = useFacialAnalysis({ 
    autoInitialize: true,
    config: {
      analysisInterval: 500,
      enableDetailedLogging: false
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
    isLookingAtCamera: state.currentResult?.eyeContact.isLookingAtCamera || false,
    overallEngagement: state.currentResult?.engagement.overallEngagement || 0,
    dominantEmotion: state.currentResult ? getDominantEmotion(state.currentResult.emotions) : 'neutral',
    faceDetected: state.currentResult?.faceDetected || false,
    confidence: state.currentResult?.confidence || 0
  }
}

// Helper function to get dominant emotion
function getDominantEmotion(emotions: EmotionScores): string {
  let maxEmotion = 'neutral'
  let maxValue = emotions.neutral
  
  Object.entries(emotions).forEach(([emotion, value]) => {
    if (value > maxValue) {
      maxValue = value
      maxEmotion = emotion
    }
  })
  
  return maxEmotion
}

// Export types for convenience
export type {
  FacialAnalysisResult,
  EmotionScores,
  EyeContactMetrics,
  HeadPoseData,
  EngagementMetrics,
  FacialAnalysisConfig
}
