/**
 * React Hook for Advanced Computer Vision
 * Provides comprehensive computer vision analysis including micro-expressions, attention tracking, and biometric analysis
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  AdvancedComputerVisionService,
  type AdvancedVisionAnalysisResult,
  type IntegratedInsights,
  type BehavioralProfile,
  type RiskAssessment,
  type VisionRecommendations,
  type AdvancedVisionConfig
} from '@/services/advancedComputerVisionService'

interface UseAdvancedComputerVisionOptions {
  autoInitialize?: boolean
  enableMicroExpressions?: boolean
  enableAttentionTracking?: boolean
  enableBiometricAnalysis?: boolean
  enableRealTimeProcessing?: boolean
  analysisInterval?: number
  confidenceThreshold?: number
}

interface AdvancedComputerVisionHookState {
  isInitialized: boolean
  isInitializing: boolean
  isAnalyzing: boolean
  latestAnalysis: AdvancedVisionAnalysisResult | null
  analysisHistory: AdvancedVisionAnalysisResult[]
  integratedInsights: IntegratedInsights | null
  behavioralProfile: BehavioralProfile | null
  riskAssessment: RiskAssessment | null
  recommendations: VisionRecommendations | null
  overallConfidence: number
  error: string | null
}

interface AdvancedComputerVisionActions {
  initialize: () => Promise<void>
  analyzeFrame: (imageData: ImageData, context?: any) => Promise<AdvancedVisionAnalysisResult>
  startRealTimeAnalysis: (videoElement: HTMLVideoElement) => void
  stopRealTimeAnalysis: () => void
  updateConfig: (config: Partial<AdvancedVisionConfig>) => void
  clearHistory: () => void
  destroy: () => void
}

export function useAdvancedComputerVision(options: UseAdvancedComputerVisionOptions = {}): [AdvancedComputerVisionHookState, AdvancedComputerVisionActions] {
  const {
    autoInitialize = false,
    enableMicroExpressions = true,
    enableAttentionTracking = true,
    enableBiometricAnalysis = true,
    enableRealTimeProcessing = true,
    analysisInterval = 1000,
    confidenceThreshold = 0.7
  } = options

  const visionServiceRef = useRef<AdvancedComputerVisionService | null>(null)
  const analysisIntervalRef = useRef<number | null>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  
  const [state, setState] = useState<AdvancedComputerVisionHookState>({
    isInitialized: false,
    isInitializing: false,
    isAnalyzing: false,
    latestAnalysis: null,
    analysisHistory: [],
    integratedInsights: null,
    behavioralProfile: null,
    riskAssessment: null,
    recommendations: null,
    overallConfidence: 0,
    error: null
  })

  // Initialize computer vision service
  const initialize = useCallback(async () => {
    if (state.isInitializing || state.isInitialized) return

    setState(prev => ({ ...prev, isInitializing: true, error: null }))

    try {
      visionServiceRef.current = new AdvancedComputerVisionService({
        enableMicroExpressions,
        enableAttentionTracking,
        enableBiometricAnalysis,
        enableIntegratedAnalysis: true,
        enableRiskAssessment: true,
        analysisDepth: 'comprehensive',
        realTimeProcessing: enableRealTimeProcessing,
        confidenceThreshold
      })

      await visionServiceRef.current.initialize()

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isInitializing: false
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Advanced Computer Vision initialization failed'
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: errorMessage
      }))
      throw error
    }
  }, [state.isInitializing, state.isInitialized, enableMicroExpressions, enableAttentionTracking, enableBiometricAnalysis, enableRealTimeProcessing, confidenceThreshold])

  // Analyze single frame
  const analyzeFrame = useCallback(async (imageData: ImageData, context?: any): Promise<AdvancedVisionAnalysisResult> => {
    if (!visionServiceRef.current) {
      throw new Error('Advanced Computer Vision Service not initialized')
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }))

    try {
      const result = await visionServiceRef.current.analyzeFrame(imageData, {
        timestamp: Date.now(),
        frameNumber: state.analysisHistory.length + 1,
        ...context
      })

      setState(prev => ({
        ...prev,
        latestAnalysis: result,
        analysisHistory: [...prev.analysisHistory, result].slice(-50), // Keep last 50
        integratedInsights: result.integratedInsights,
        behavioralProfile: result.behavioralProfile,
        riskAssessment: result.riskAssessment,
        recommendations: result.recommendations,
        overallConfidence: result.confidence,
        isAnalyzing: false
      }))

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Frame analysis failed'
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }))
      throw error
    }
  }, [state.analysisHistory.length])

  // Start real-time analysis
  const startRealTimeAnalysis = useCallback((videoElement: HTMLVideoElement) => {
    if (!visionServiceRef.current || !enableRealTimeProcessing) {
      console.warn('Real-time analysis not available')
      return
    }

    videoElementRef.current = videoElement
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
    }

    analysisIntervalRef.current = window.setInterval(async () => {
      if (!videoElement || videoElement.paused || videoElement.ended) {
        return
      }

      try {
        // Capture frame from video
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        canvas.width = videoElement.videoWidth
        canvas.height = videoElement.videoHeight
        
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Analyze frame
        await analyzeFrame(imageData, {
          source: 'real_time_video',
          videoCurrentTime: videoElement.currentTime
        })

      } catch (error) {
        console.error('Real-time analysis error:', error)
      }
    }, analysisInterval)

    console.log('Real-time computer vision analysis started')
  }, [analyzeFrame, analysisInterval, enableRealTimeProcessing])

  // Stop real-time analysis
  const stopRealTimeAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }
    videoElementRef.current = null
    console.log('Real-time computer vision analysis stopped')
  }, [])

  // Update configuration
  const updateConfig = useCallback((config: Partial<AdvancedVisionConfig>) => {
    if (visionServiceRef.current) {
      visionServiceRef.current.updateConfig(config)
    }
  }, [])

  // Clear history
  const clearHistory = useCallback(() => {
    if (visionServiceRef.current) {
      visionServiceRef.current.clearHistory()
    }
    
    setState(prev => ({
      ...prev,
      latestAnalysis: null,
      analysisHistory: [],
      integratedInsights: null,
      behavioralProfile: null,
      riskAssessment: null,
      recommendations: null,
      overallConfidence: 0
    }))
  }, [])

  // Destroy service
  const destroy = useCallback(() => {
    stopRealTimeAnalysis()

    if (visionServiceRef.current) {
      visionServiceRef.current.destroy()
      visionServiceRef.current = null
    }

    setState({
      isInitialized: false,
      isInitializing: false,
      isAnalyzing: false,
      latestAnalysis: null,
      analysisHistory: [],
      integratedInsights: null,
      behavioralProfile: null,
      riskAssessment: null,
      recommendations: null,
      overallConfidence: 0,
      error: null
    })
  }, [stopRealTimeAnalysis])

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

  const actions: AdvancedComputerVisionActions = {
    initialize,
    analyzeFrame,
    startRealTimeAnalysis,
    stopRealTimeAnalysis,
    updateConfig,
    clearHistory,
    destroy
  }

  return [state, actions]
}

// Specialized hook for interview computer vision analysis
export function useInterviewComputerVision() {
  const [state, actions] = useAdvancedComputerVision({
    autoInitialize: true,
    enableMicroExpressions: true,
    enableAttentionTracking: true,
    enableBiometricAnalysis: true,
    enableRealTimeProcessing: true,
    analysisInterval: 2000,
    confidenceThreshold: 0.7
  })

  return {
    ...state,
    ...actions,
    
    // Convenience getters for interview-specific insights
    emotionalState: state.integratedInsights?.emotionalState || null,
    cognitiveState: state.integratedInsights?.cognitiveState || null,
    physiologicalState: state.integratedInsights?.physiologicalState || null,
    behavioralState: state.integratedInsights?.behavioralState || null,
    authenticityAssessment: state.integratedInsights?.authenticityAssessment || null,
    stressProfile: state.integratedInsights?.stressProfile || null,
    
    // Personality and communication insights
    personalityTraits: state.behavioralProfile?.personalityTraits || null,
    communicationStyle: state.behavioralProfile?.communicationStyle || null,
    emotionalIntelligence: state.behavioralProfile?.emotionalIntelligence || null,
    stressResponse: state.behavioralProfile?.stressResponse || null,
    adaptabilityProfile: state.behavioralProfile?.adaptabilityProfile || null,
    
    // Risk assessments
    deceptionRisk: state.riskAssessment?.deceptionRisk || null,
    stressRisk: state.riskAssessment?.stressRisk || null,
    healthRisk: state.riskAssessment?.healthRisk || null,
    performanceRisk: state.riskAssessment?.performanceRisk || null,
    overallRisk: state.riskAssessment?.overallRisk || 0,
    
    // Recommendations
    immediateRecommendations: state.recommendations?.immediate || [],
    shortTermRecommendations: state.recommendations?.shortTerm || [],
    longTermRecommendations: state.recommendations?.longTerm || [],
    interventions: state.recommendations?.interventions || [],
    monitoring: state.recommendations?.monitoring || [],
    recommendationPriority: state.recommendations?.priority || 'low',
    
    // Helper methods
    getPrimaryEmotion: () => {
      return state.integratedInsights?.emotionalState.primaryEmotion || 'neutral'
    },
    
    getEmotionalIntensity: () => {
      return state.integratedInsights?.emotionalState.emotionalIntensity || 0
    },
    
    getAttentionLevel: () => {
      return state.integratedInsights?.cognitiveState.attentionLevel || 0
    },
    
    getStressLevel: () => {
      return state.integratedInsights?.stressProfile.acuteStress || 0
    },
    
    getEngagementLevel: () => {
      return state.integratedInsights?.behavioralState.engagementLevel || 0
    },
    
    getConfidenceLevel: () => {
      return state.integratedInsights?.behavioralState.confidenceLevel || 0
    },
    
    getAnxietyLevel: () => {
      return state.integratedInsights?.behavioralState.anxietyLevel || 0
    },
    
    getDeceptionRiskLevel: () => {
      return state.integratedInsights?.behavioralState.deceptionRisk || 0
    },
    
    getOverallAuthenticity: () => {
      return state.integratedInsights?.authenticityAssessment.overallAuthenticity || 0
    },
    
    getHeartRate: () => {
      return state.integratedInsights?.physiologicalState.vitalSigns.heartRate || 0
    },
    
    getHeartRateVariability: () => {
      return state.integratedInsights?.physiologicalState.vitalSigns.heartRateVariability || 0
    },
    
    isHighRisk: () => {
      return (state.riskAssessment?.overallRisk || 0) > 0.7
    },
    
    needsIntervention: () => {
      return state.recommendations?.priority === 'high' || state.recommendations?.priority === 'critical'
    },
    
    isStressed: () => {
      return (state.integratedInsights?.stressProfile.acuteStress || 0) > 0.6
    },
    
    isEngaged: () => {
      return (state.integratedInsights?.behavioralState.engagementLevel || 0) > 0.7
    },
    
    isFocused: () => {
      return (state.integratedInsights?.cognitiveState.attentionLevel || 0) > 0.7
    },
    
    isAuthentic: () => {
      return (state.integratedInsights?.authenticityAssessment.overallAuthenticity || 0) > 0.7
    },
    
    getPersonalityInsights: () => {
      const traits = state.behavioralProfile?.personalityTraits
      if (!traits) return []
      
      const insights: string[] = []
      if (traits.openness > 0.7) insights.push('High openness to experience')
      if (traits.conscientiousness > 0.7) insights.push('High conscientiousness')
      if (traits.extraversion > 0.7) insights.push('Extraverted personality')
      if (traits.agreeableness > 0.7) insights.push('High agreeableness')
      if (traits.neuroticism > 0.7) insights.push('High emotional sensitivity')
      if (traits.confidence > 0.7) insights.push('High confidence level')
      
      return insights
    },
    
    getCommunicationInsights: () => {
      const style = state.behavioralProfile?.communicationStyle
      if (!style) return []
      
      const insights: string[] = []
      if (style.directness > 0.7) insights.push('Direct communication style')
      if (style.expressiveness > 0.7) insights.push('Highly expressive')
      if (style.assertiveness > 0.7) insights.push('Assertive communicator')
      if (style.empathy > 0.7) insights.push('High empathy in communication')
      if (style.clarity > 0.7) insights.push('Clear and articulate')
      if (style.engagement > 0.7) insights.push('Engaging communication style')
      
      return insights
    },
    
    getHealthInsights: () => {
      const health = state.integratedInsights?.physiologicalState
      if (!health) return []
      
      const insights: string[] = []
      if (health.vitalSigns.heartRate > 100) insights.push('Elevated heart rate detected')
      if (health.vitalSigns.heartRateVariability < 30) insights.push('Low heart rate variability')
      if (health.stressLevel > 0.7) insights.push('High stress levels detected')
      if (health.fatigueLevel > 0.7) insights.push('Signs of fatigue detected')
      if (health.autonomicBalance < 0.4) insights.push('Autonomic nervous system imbalance')
      
      return insights
    },
    
    getRiskInsights: () => {
      const risks = state.riskAssessment
      if (!risks) return []
      
      const insights: string[] = []
      if (risks.deceptionRisk.riskLevel === 'high' || risks.deceptionRisk.riskLevel === 'critical') {
        insights.push('Elevated deception risk detected')
      }
      if (risks.stressRisk.riskLevel === 'high' || risks.stressRisk.riskLevel === 'critical') {
        insights.push('High stress risk identified')
      }
      if (risks.healthRisk.riskLevel === 'high' || risks.healthRisk.riskLevel === 'critical') {
        insights.push('Health concerns detected')
      }
      if (risks.performanceRisk.riskLevel === 'high' || risks.performanceRisk.riskLevel === 'critical') {
        insights.push('Performance risk factors identified')
      }
      
      return insights
    }
  }
}

// Export types for convenience
export type {
  AdvancedVisionAnalysisResult,
  IntegratedInsights,
  BehavioralProfile,
  RiskAssessment,
  VisionRecommendations
}
