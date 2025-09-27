/**
 * React Hook for Multi-Modal Sentiment Analysis
 * Provides comprehensive sentiment analysis combining text, voice, facial, and behavioral data
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  MultiModalSentimentService,
  type MultiModalSentimentResult,
  type FusedSentimentAnalysis,
  type ModalityBreakdown,
  type RealTimeInsights,
  type CulturalContext
} from '@/services/multiModalSentimentService'
import { 
  VoiceSentimentService,
  type VoiceSentimentResult
} from '@/services/voiceSentimentService'
import { 
  AdvancedSentimentService,
  type AdvancedSentimentResult
} from '@/services/advancedSentimentService'
import { type FacialAnalysisResult } from '@/services/facialAnalysisService'
import { type UnifiedMetrics } from '@/services/unifiedAnalyticsService'

interface UseMultiModalSentimentOptions {
  autoInitialize?: boolean
  enableVoiceAnalysis?: boolean
  enableRealTimeUpdates?: boolean
  updateInterval?: number
  culturalContext?: Partial<CulturalContext>
}

interface MultiModalSentimentHookState {
  isInitialized: boolean
  isInitializing: boolean
  isAnalyzing: boolean
  currentResult: MultiModalSentimentResult | null
  sentimentHistory: MultiModalSentimentResult[]
  voiceAnalysis: VoiceSentimentResult | null
  textAnalysis: AdvancedSentimentResult | null
  realTimeInsights: RealTimeInsights | null
  emotionalTrend: 'improving' | 'declining' | 'stable' | 'fluctuating'
  error: string | null
}

interface MultiModalSentimentActions {
  initialize: () => Promise<void>
  analyzeSentiment: (
    textSentiment: AdvancedSentimentResult,
    facialAnalysis: FacialAnalysisResult,
    unifiedMetrics: UnifiedMetrics,
    audioData?: Float32Array,
    context?: any
  ) => Promise<MultiModalSentimentResult>
  updateCulturalContext: (context: Partial<CulturalContext>) => void
  getEmotionalTrend: () => string
  getSentimentSummary: () => any
  clearHistory: () => void
  destroy: () => void
}

export function useMultiModalSentiment(options: UseMultiModalSentimentOptions = {}): [MultiModalSentimentHookState, MultiModalSentimentActions] {
  const {
    autoInitialize = false,
    enableVoiceAnalysis = true,
    enableRealTimeUpdates = true,
    updateInterval = 2000,
    culturalContext
  } = options

  const multiModalServiceRef = useRef<MultiModalSentimentService | null>(null)
  const voiceServiceRef = useRef<VoiceSentimentService | null>(null)
  const advancedSentimentServiceRef = useRef<AdvancedSentimentService | null>(null)
  const updateIntervalRef = useRef<number | null>(null)
  
  const [state, setState] = useState<MultiModalSentimentHookState>({
    isInitialized: false,
    isInitializing: false,
    isAnalyzing: false,
    currentResult: null,
    sentimentHistory: [],
    voiceAnalysis: null,
    textAnalysis: null,
    realTimeInsights: null,
    emotionalTrend: 'stable',
    error: null
  })

  // Initialize services
  const initialize = useCallback(async () => {
    if (state.isInitializing || state.isInitialized) return

    setState(prev => ({ ...prev, isInitializing: true, error: null }))

    try {
      // Initialize multi-modal sentiment service
      multiModalServiceRef.current = new MultiModalSentimentService()
      
      // Initialize voice sentiment service if enabled
      if (enableVoiceAnalysis) {
        voiceServiceRef.current = new VoiceSentimentService()
        await voiceServiceRef.current.initialize()
      }

      // Initialize advanced sentiment service
      advancedSentimentServiceRef.current = new AdvancedSentimentService()
      await advancedSentimentServiceRef.current.initialize()

      // Apply cultural context if provided
      if (culturalContext) {
        multiModalServiceRef.current.updateCulturalContext(culturalContext)
      }

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
  }, [state.isInitializing, state.isInitialized, enableVoiceAnalysis, culturalContext])

  // Analyze multi-modal sentiment
  const analyzeSentiment = useCallback(async (
    textSentiment: AdvancedSentimentResult,
    facialAnalysis: FacialAnalysisResult,
    unifiedMetrics: UnifiedMetrics,
    audioData?: Float32Array,
    context?: any
  ): Promise<MultiModalSentimentResult> => {
    if (!multiModalServiceRef.current) {
      throw new Error('Multi-modal sentiment service not initialized')
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }))

    try {
      // Analyze voice sentiment if audio data provided
      let voiceMetrics: any = undefined
      if (audioData && voiceServiceRef.current) {
        const voiceResult = await voiceServiceRef.current.analyzeVoiceSentiment(audioData, context)
        
        voiceMetrics = {
          tonalSentiment: voiceResult.overallSentiment,
          stressLevel: voiceResult.stressIndicators.overallStressLevel,
          confidence: voiceResult.confidenceMarkers.overallConfidence,
          clarity: voiceResult.communicationQuality.articulation
        }

        setState(prev => ({ ...prev, voiceAnalysis: voiceResult }))
      }

      // Perform multi-modal sentiment fusion
      const result = await multiModalServiceRef.current.analyzeFusedSentiment(
        textSentiment,
        facialAnalysis,
        unifiedMetrics,
        voiceMetrics,
        context
      )

      // Calculate emotional trend
      const emotionalTrend = calculateEmotionalTrend(state.sentimentHistory, result)

      // Update state
      setState(prev => ({
        ...prev,
        currentResult: result,
        sentimentHistory: [...prev.sentimentHistory, result].slice(-50), // Keep last 50
        textAnalysis: textSentiment,
        realTimeInsights: result.realTimeInsights,
        emotionalTrend,
        isAnalyzing: false
      }))

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sentiment analysis failed'
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }))
      throw error
    }
  }, [state.sentimentHistory])

  // Calculate emotional trend
  const calculateEmotionalTrend = useCallback((
    history: MultiModalSentimentResult[],
    current: MultiModalSentimentResult
  ): MultiModalSentimentHookState['emotionalTrend'] => {
    if (history.length < 3) return 'stable'

    const recentSentiments = [...history.slice(-2), current].map(r => r.fusedSentiment.overallSentiment)
    const variance = calculateVariance(recentSentiments)
    const trend = recentSentiments[2] - recentSentiments[0]

    if (variance > 0.3) return 'fluctuating'
    if (trend > 0.2) return 'improving'
    if (trend < -0.2) return 'declining'
    return 'stable'
  }, [])

  const calculateVariance = (values: number[]): number => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  }

  // Update cultural context
  const updateCulturalContext = useCallback((context: Partial<CulturalContext>) => {
    if (multiModalServiceRef.current) {
      multiModalServiceRef.current.updateCulturalContext(context)
    }
  }, [])

  // Get emotional trend
  const getEmotionalTrend = useCallback((): string => {
    return state.emotionalTrend
  }, [state.emotionalTrend])

  // Get sentiment summary
  const getSentimentSummary = useCallback(() => {
    if (!state.currentResult) return null

    const result = state.currentResult
    const fusedSentiment = result.fusedSentiment

    return {
      overallSentiment: fusedSentiment.overallSentiment,
      sentimentLabel: getSentimentLabel(fusedSentiment.overallSentiment),
      primaryEmotion: fusedSentiment.primaryEmotion,
      emotionalIntensity: fusedSentiment.emotionalIntensity,
      professionalAlignment: fusedSentiment.professionalAlignment,
      authenticity: fusedSentiment.authenticityScore,
      confidence: result.confidence,
      stressLevel: result.realTimeInsights.stressLevel,
      engagementLevel: result.realTimeInsights.engagementLevel,
      modalityBreakdown: {
        text: result.modalityBreakdown.textSentiment.sentiment,
        voice: result.modalityBreakdown.voiceSentiment.sentiment,
        facial: result.modalityBreakdown.facialSentiment.sentiment,
        behavioral: result.modalityBreakdown.behavioralSentiment.sentiment
      },
      insights: {
        strengths: result.realTimeInsights.adaptationRecommendations.filter(r => 
          r.includes('excellent') || r.includes('strong') || r.includes('good')
        ),
        improvements: result.realTimeInsights.adaptationRecommendations.filter(r => 
          r.includes('consider') || r.includes('focus') || r.includes('improve')
        ),
        recommendations: result.realTimeInsights.adaptationRecommendations
      }
    }
  }, [state.currentResult])

  const getSentimentLabel = (sentiment: number): string => {
    if (sentiment > 0.6) return 'Very Positive'
    if (sentiment > 0.2) return 'Positive'
    if (sentiment > -0.2) return 'Neutral'
    if (sentiment > -0.6) return 'Negative'
    return 'Very Negative'
  }

  // Clear history
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      sentimentHistory: [],
      currentResult: null,
      voiceAnalysis: null,
      textAnalysis: null,
      realTimeInsights: null,
      emotionalTrend: 'stable'
    }))

    if (multiModalServiceRef.current) {
      multiModalServiceRef.current.clearHistory()
    }
    if (voiceServiceRef.current) {
      voiceServiceRef.current.clearHistory()
    }
    if (advancedSentimentServiceRef.current) {
      advancedSentimentServiceRef.current.clearHistory()
    }
  }, [])

  // Destroy services
  const destroy = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }

    if (voiceServiceRef.current) {
      voiceServiceRef.current.destroy()
      voiceServiceRef.current = null
    }

    if (advancedSentimentServiceRef.current) {
      advancedSentimentServiceRef.current.destroy()
      advancedSentimentServiceRef.current = null
    }

    multiModalServiceRef.current = null

    setState({
      isInitialized: false,
      isInitializing: false,
      isAnalyzing: false,
      currentResult: null,
      sentimentHistory: [],
      voiceAnalysis: null,
      textAnalysis: null,
      realTimeInsights: null,
      emotionalTrend: 'stable',
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

  const actions: MultiModalSentimentActions = {
    initialize,
    analyzeSentiment,
    updateCulturalContext,
    getEmotionalTrend,
    getSentimentSummary,
    clearHistory,
    destroy
  }

  return [state, actions]
}

// Specialized hook for real-time sentiment monitoring
export function useRealTimeSentimentMonitoring() {
  const [state, actions] = useMultiModalSentiment({
    autoInitialize: true,
    enableVoiceAnalysis: true,
    enableRealTimeUpdates: true,
    updateInterval: 1000
  })

  return {
    ...state,
    ...actions,
    
    // Convenience getters
    currentSentiment: state.currentResult?.fusedSentiment.overallSentiment || 0,
    primaryEmotion: state.currentResult?.fusedSentiment.primaryEmotion || 'neutral',
    stressLevel: state.realTimeInsights?.stressLevel || 0,
    engagementLevel: state.realTimeInsights?.engagementLevel || 0,
    confidenceLevel: state.realTimeInsights?.confidenceLevel || 0,
    professionalPresence: state.realTimeInsights?.professionalPresence || 0,
    
    // Modality breakdown
    textSentiment: state.currentResult?.modalityBreakdown.textSentiment.sentiment || 0,
    voiceSentiment: state.currentResult?.modalityBreakdown.voiceSentiment.sentiment || 0,
    facialSentiment: state.currentResult?.modalityBreakdown.facialSentiment.sentiment || 0,
    behavioralSentiment: state.currentResult?.modalityBreakdown.behavioralSentiment.sentiment || 0,
    
    // Quality indicators
    emotionalCoherence: state.currentResult?.emotionalCoherence.overallCoherence || 0,
    sentimentReliability: state.currentResult?.sentimentReliability.overallReliability || 0,
    
    // Insights
    adaptationRecommendations: state.realTimeInsights?.adaptationRecommendations || [],
    interviewerGuidance: state.realTimeInsights?.interviewerGuidance || [],
    
    // Trend analysis
    isImproving: state.emotionalTrend === 'improving',
    isDeclining: state.emotionalTrend === 'declining',
    isFluctuating: state.emotionalTrend === 'fluctuating',
    isStable: state.emotionalTrend === 'stable',
    
    // Helper methods
    getSentimentLabel: () => {
      const sentiment = state.currentResult?.fusedSentiment.overallSentiment || 0
      if (sentiment > 0.6) return 'Very Positive'
      if (sentiment > 0.2) return 'Positive'
      if (sentiment > -0.2) return 'Neutral'
      if (sentiment > -0.6) return 'Negative'
      return 'Very Negative'
    },
    
    getEmotionalState: () => {
      if (!state.currentResult) return 'Unknown'
      
      const { primaryEmotion, emotionalIntensity } = state.currentResult.fusedSentiment
      const intensity = emotionalIntensity > 0.7 ? 'High' : emotionalIntensity > 0.4 ? 'Moderate' : 'Low'
      
      return `${intensity} ${primaryEmotion}`
    },
    
    getOverallAssessment: () => {
      if (!state.currentResult) return null
      
      const result = state.currentResult
      const sentiment = result.fusedSentiment.overallSentiment
      const reliability = result.sentimentReliability.overallReliability
      const coherence = result.emotionalCoherence.overallCoherence
      
      let assessment = 'Good'
      if (sentiment > 0.4 && reliability > 0.7 && coherence > 0.7) {
        assessment = 'Excellent'
      } else if (sentiment > 0.2 && reliability > 0.6 && coherence > 0.6) {
        assessment = 'Good'
      } else if (sentiment > -0.2 && reliability > 0.5) {
        assessment = 'Fair'
      } else {
        assessment = 'Needs Attention'
      }
      
      return {
        assessment,
        sentiment,
        reliability,
        coherence,
        confidence: result.confidence
      }
    }
  }
}

// Hook for sentiment coaching and feedback
export function useSentimentCoaching() {
  const [state, actions] = useMultiModalSentiment({
    autoInitialize: true,
    enableRealTimeUpdates: true
  })

  return {
    isActive: state.isInitialized,
    currentFeedback: state.realTimeInsights?.adaptationRecommendations || [],
    
    // Coaching insights
    getImmediateFeedback: () => {
      if (!state.currentResult) return []
      
      const feedback: string[] = []
      const insights = state.realTimeInsights
      
      if (insights?.stressLevel > 0.7) {
        feedback.push('Take a deep breath and try to relax')
      }
      
      if (insights?.engagementLevel < 0.4) {
        feedback.push('Try to show more enthusiasm and engagement')
      }
      
      if (insights?.confidenceLevel < 0.5) {
        feedback.push('Speak with more confidence and conviction')
      }
      
      if (state.currentResult.emotionalCoherence.crossModalConsistency < 0.6) {
        feedback.push('Ensure your words match your body language and tone')
      }
      
      return feedback
    },
    
    getPositiveReinforcement: () => {
      if (!state.currentResult) return []
      
      const reinforcement: string[] = []
      const insights = state.realTimeInsights
      
      if (insights?.confidenceLevel > 0.7) {
        reinforcement.push('Great confidence level!')
      }
      
      if (insights?.engagementLevel > 0.7) {
        reinforcement.push('Excellent engagement!')
      }
      
      if (state.currentResult.fusedSentiment.professionalAlignment > 0.8) {
        reinforcement.push('Very professional communication!')
      }
      
      if (state.currentResult.fusedSentiment.authenticityScore > 0.8) {
        reinforcement.push('Authentic and genuine responses!')
      }
      
      return reinforcement
    },
    
    // Actions
    ...actions
  }
}

// Export types for convenience
export type {
  MultiModalSentimentResult,
  FusedSentimentAnalysis,
  ModalityBreakdown,
  RealTimeInsights,
  CulturalContext
}
