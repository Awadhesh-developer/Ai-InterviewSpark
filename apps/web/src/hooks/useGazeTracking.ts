/**
 * React Hook for Gaze Tracking
 * Provides easy integration of advanced gaze tracking with React components
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  GazeTrackingService,
  type GazePoint,
  type EyeData,
  type GazeCalibration,
  type AttentionMetrics,
  type GazeHeatmapData,
  type GazeTrackingConfig
} from '@/services/gazeTrackingService'

interface UseGazeTrackingOptions {
  autoInitialize?: boolean
  requireCalibration?: boolean
  config?: Partial<GazeTrackingConfig>
}

interface GazeTrackingHookState {
  isInitialized: boolean
  isInitializing: boolean
  isTracking: boolean
  isCalibrating: boolean
  isCalibrated: boolean
  currentGaze: GazePoint | null
  attentionMetrics: AttentionMetrics
  calibrationStatus: GazeCalibration
  heatmapData: GazeHeatmapData | null
  error: string | null
  calibrationProgress: number
}

interface GazeTrackingActions {
  initialize: () => Promise<void>
  startCalibration: () => Promise<void>
  addCalibrationPoint: (x: number, y: number, eyeData: { left: EyeData; right: EyeData }) => Promise<void>
  completeCalibration: () => Promise<void>
  startTracking: () => void
  stopTracking: () => void
  processGazeData: (leftEye: EyeData, rightEye: EyeData) => GazePoint | null
  updateConfig: (config: Partial<GazeTrackingConfig>) => void
  destroy: () => void
}

const DEFAULT_CONFIG: GazeTrackingConfig = {
  calibrationRequired: true,
  smoothingFactor: 0.3,
  confidenceThreshold: 0.7,
  attentionWindowMs: 5000,
  distractionThresholdMs: 1000,
  heatmapEnabled: true,
  heatmapGridSize: 20
}

export function useGazeTracking(options: UseGazeTrackingOptions = {}): [GazeTrackingHookState, GazeTrackingActions] {
  const {
    autoInitialize = false,
    requireCalibration = true,
    config = {}
  } = options

  const serviceRef = useRef<GazeTrackingService | null>(null)
  const [state, setState] = useState<GazeTrackingHookState>({
    isInitialized: false,
    isInitializing: false,
    isTracking: false,
    isCalibrating: false,
    isCalibrated: false,
    currentGaze: null,
    attentionMetrics: {
      focusScore: 0,
      distractionEvents: 0,
      averageGazeDuration: 0,
      gazeStability: 0,
      screenCoverage: 0,
      attentionSpan: 0
    },
    calibrationStatus: {
      isCalibrated: false,
      calibrationPoints: [],
      transformMatrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      accuracy: 0
    },
    heatmapData: null,
    error: null,
    calibrationProgress: 0
  })

  // Initialize service configuration
  const getConfig = useCallback((): GazeTrackingConfig => {
    return {
      ...DEFAULT_CONFIG,
      calibrationRequired: requireCalibration,
      ...config
    }
  }, [requireCalibration, config])

  // Initialize gaze tracking service
  const initialize = useCallback(async () => {
    if (serviceRef.current || state.isInitializing) {
      return
    }

    setState(prev => ({ ...prev, isInitializing: true, error: null }))

    try {
      const serviceConfig = getConfig()
      serviceRef.current = new GazeTrackingService(serviceConfig)
      
      // Set up event handlers
      setupEventHandlers(serviceRef.current)
      
      // Initialize the service
      await serviceRef.current.initialize()
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isInitializing: false,
        calibrationStatus: serviceRef.current!.getCalibrationStatus()
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
  const setupEventHandlers = useCallback((service: GazeTrackingService) => {
    service.on('initialized', () => {
      setState(prev => ({ ...prev, isInitialized: true }))
    })

    service.on('calibration.started', () => {
      setState(prev => ({ 
        ...prev, 
        isCalibrating: true, 
        calibrationProgress: 0,
        error: null 
      }))
    })

    service.on('calibration.point.added', (data: any) => {
      const progress = (data.pointIndex + 1) / 9 * 100 // Assuming 9 calibration points
      setState(prev => ({ 
        ...prev, 
        calibrationProgress: progress,
        calibrationStatus: service.getCalibrationStatus()
      }))
    })

    service.on('calibration.completed', (data: any) => {
      setState(prev => ({ 
        ...prev, 
        isCalibrating: false,
        isCalibrated: true,
        calibrationProgress: 100,
        calibrationStatus: service.getCalibrationStatus()
      }))
    })

    service.on('calibration.failed', (data: any) => {
      setState(prev => ({ 
        ...prev, 
        isCalibrating: false,
        error: 'Calibration failed. Please try again.'
      }))
    })

    service.on('tracking.started', () => {
      setState(prev => ({ ...prev, isTracking: true }))
    })

    service.on('tracking.stopped', (data: any) => {
      setState(prev => ({ 
        ...prev, 
        isTracking: false,
        attentionMetrics: data.metrics || prev.attentionMetrics
      }))
    })

    service.on('gaze.update', (gazePoint: GazePoint) => {
      setState(prev => ({ 
        ...prev, 
        currentGaze: gazePoint,
        attentionMetrics: service.getAttentionMetrics(),
        heatmapData: service.getHeatmapData()
      }))
    })

    service.on('distraction.detected', (data: any) => {
      // Could emit custom events or update UI indicators
      console.log('Distraction detected:', data)
    })
  }, [])

  // Gaze tracking actions
  const startCalibration = useCallback(async () => {
    if (!serviceRef.current) {
      throw new Error('Gaze tracking service not initialized')
    }
    await serviceRef.current.startCalibration()
  }, [])

  const addCalibrationPoint = useCallback(async (x: number, y: number, eyeData: { left: EyeData; right: EyeData }) => {
    if (!serviceRef.current) {
      throw new Error('Gaze tracking service not initialized')
    }
    await serviceRef.current.addCalibrationPoint(x, y, eyeData)
  }, [])

  const completeCalibration = useCallback(async () => {
    if (!serviceRef.current) {
      throw new Error('Gaze tracking service not initialized')
    }
    await serviceRef.current.completeCalibration()
  }, [])

  const startTracking = useCallback(() => {
    if (!serviceRef.current) {
      throw new Error('Gaze tracking service not initialized')
    }
    serviceRef.current.startTracking()
  }, [])

  const stopTracking = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stopTracking()
    }
  }, [])

  const processGazeData = useCallback((leftEye: EyeData, rightEye: EyeData): GazePoint | null => {
    if (!serviceRef.current) {
      return null
    }
    return serviceRef.current.processGazeData(leftEye, rightEye)
  }, [])

  const updateConfig = useCallback((newConfig: Partial<GazeTrackingConfig>) => {
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
      isTracking: false,
      isCalibrating: false,
      isCalibrated: false,
      currentGaze: null,
      attentionMetrics: {
        focusScore: 0,
        distractionEvents: 0,
        averageGazeDuration: 0,
        gazeStability: 0,
        screenCoverage: 0,
        attentionSpan: 0
      },
      calibrationStatus: {
        isCalibrated: false,
        calibrationPoints: [],
        transformMatrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        accuracy: 0
      },
      heatmapData: null,
      error: null,
      calibrationProgress: 0
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

  const actions: GazeTrackingActions = {
    initialize,
    startCalibration,
    addCalibrationPoint,
    completeCalibration,
    startTracking,
    stopTracking,
    processGazeData,
    updateConfig,
    destroy
  }

  return [state, actions]
}

// Specialized hooks for specific use cases

export function useGazeCalibration() {
  const [state, actions] = useGazeTracking({ 
    autoInitialize: true,
    requireCalibration: true 
  })
  
  return {
    isCalibrating: state.isCalibrating,
    isCalibrated: state.isCalibrated,
    calibrationProgress: state.calibrationProgress,
    calibrationAccuracy: state.calibrationStatus.accuracy,
    startCalibration: actions.startCalibration,
    addCalibrationPoint: actions.addCalibrationPoint,
    completeCalibration: actions.completeCalibration,
    error: state.error
  }
}

export function useAttentionTracking() {
  const [state, actions] = useGazeTracking({ 
    autoInitialize: true,
    config: { heatmapEnabled: true }
  })
  
  return {
    attentionMetrics: state.attentionMetrics,
    focusScore: state.attentionMetrics.focusScore,
    distractionEvents: state.attentionMetrics.distractionEvents,
    gazeStability: state.attentionMetrics.gazeStability,
    screenCoverage: state.attentionMetrics.screenCoverage,
    isTracking: state.isTracking,
    startTracking: actions.startTracking,
    stopTracking: actions.stopTracking,
    error: state.error
  }
}

export function useGazeHeatmap() {
  const [state, actions] = useGazeTracking({ 
    autoInitialize: true,
    config: { heatmapEnabled: true, heatmapGridSize: 30 }
  })
  
  return {
    heatmapData: state.heatmapData,
    isTracking: state.isTracking,
    startTracking: actions.startTracking,
    stopTracking: actions.stopTracking,
    error: state.error
  }
}

export function useInterviewGazeTracking() {
  const requireCalibration = true
  const [state, actions] = useGazeTracking({
    autoInitialize: true,
    requireCalibration,
    config: {
      smoothingFactor: 0.4,
      confidenceThreshold: 0.6,
      attentionWindowMs: 10000,
      heatmapEnabled: true
    }
  })

  return {
    ...state,
    ...actions,

    // Convenience getters for interview context
    isLookingAtScreen: state.currentGaze !== null,
    currentFocusScore: state.attentionMetrics.focusScore,
    totalDistractions: state.attentionMetrics.distractionEvents,
    averageAttentionSpan: state.attentionMetrics.attentionSpan,

    // Interview-specific methods
    needsCalibration: !state.isCalibrated && state.isInitialized,
    canStartTracking: state.isInitialized && (state.isCalibrated || !requireCalibration)
  }
}

// Export types for convenience
export type {
  GazePoint,
  EyeData,
  GazeCalibration,
  AttentionMetrics,
  GazeHeatmapData,
  GazeTrackingConfig
}
