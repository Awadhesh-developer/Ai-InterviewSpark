/**
 * React Hook for ML Integration Orchestrator
 * Provides comprehensive AI-powered interview intelligence
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  MLIntegrationOrchestrator,
  type ComprehensiveAnalysisResult,
  type RealTimeInsights,
  type InterviewIntelligence,
  type SystemRecommendations,
  type MLOrchestratorConfig
} from '@/services/mlIntegrationOrchestrator'
import { type GeneratedQuestion, type DifficultyLevel } from '@/services/adaptiveQuestionService'

interface UseMLIntegrationOptions {
  autoInitialize?: boolean
  enableRealTimeAnalysis?: boolean
  analysisInterval?: number
  adaptationSensitivity?: number
  enableAutoAdaptation?: boolean
}

interface MLIntegrationHookState {
  isInitialized: boolean
  isInitializing: boolean
  isAnalyzing: boolean
  latestAnalysis: ComprehensiveAnalysisResult | null
  analysisHistory: ComprehensiveAnalysisResult[]
  realTimeInsights: RealTimeInsights | null
  interviewIntelligence: InterviewIntelligence | null
  recommendations: SystemRecommendations | null
  currentDifficulty: DifficultyLevel
  nextQuestion: GeneratedQuestion | null
  overallConfidence: number
  error: string | null
}

interface MLIntegrationActions {
  initialize: () => Promise<void>
  performAnalysis: (data: AnalysisData) => Promise<ComprehensiveAnalysisResult>
  updateConfig: (config: Partial<MLOrchestratorConfig>) => void
  getCurrentInsights: () => RealTimeInsights | null
  getInterviewIntelligence: () => InterviewIntelligence | null
  getRecommendations: () => SystemRecommendations | null
  clearHistory: () => void
  destroy: () => void
}

interface AnalysisData {
  audioData?: Float32Array
  videoFrame?: ImageData
  responseText?: string
  currentDifficulty?: DifficultyLevel
  questionHistory?: GeneratedQuestion[]
  context?: any
}

export function useMLIntegration(options: UseMLIntegrationOptions = {}): [MLIntegrationHookState, MLIntegrationActions] {
  const {
    autoInitialize = false,
    enableRealTimeAnalysis = true,
    analysisInterval = 5000,
    adaptationSensitivity = 0.7,
    enableAutoAdaptation = true
  } = options

  const orchestratorRef = useRef<MLIntegrationOrchestrator | null>(null)
  const analysisIntervalRef = useRef<number | null>(null)
  
  const [state, setState] = useState<MLIntegrationHookState>({
    isInitialized: false,
    isInitializing: false,
    isAnalyzing: false,
    latestAnalysis: null,
    analysisHistory: [],
    realTimeInsights: null,
    interviewIntelligence: null,
    recommendations: null,
    currentDifficulty: 'medium',
    nextQuestion: null,
    overallConfidence: 0,
    error: null
  })

  // Initialize ML orchestrator
  const initialize = useCallback(async () => {
    if (state.isInitializing || state.isInitialized) return

    setState(prev => ({ ...prev, isInitializing: true, error: null }))

    try {
      orchestratorRef.current = new MLIntegrationOrchestrator({
        enableRealTimeAnalysis,
        analysisInterval,
        adaptationSensitivity,
        enableAutoAdaptation
      })

      await orchestratorRef.current.initialize()

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isInitializing: false
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ML Integration initialization failed'
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: errorMessage
      }))
      throw error
    }
  }, [state.isInitializing, state.isInitialized, enableRealTimeAnalysis, analysisInterval, adaptationSensitivity, enableAutoAdaptation])

  // Perform comprehensive analysis
  const performAnalysis = useCallback(async (data: AnalysisData): Promise<ComprehensiveAnalysisResult> => {
    if (!orchestratorRef.current) {
      throw new Error('ML Integration Orchestrator not initialized')
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }))

    try {
      const result = await orchestratorRef.current.performComprehensiveAnalysis(
        data.audioData,
        data.videoFrame,
        data.responseText,
        data.currentDifficulty,
        data.questionHistory,
        data.context
      )

      setState(prev => ({
        ...prev,
        latestAnalysis: result,
        analysisHistory: [...prev.analysisHistory, result].slice(-50), // Keep last 50
        realTimeInsights: result.realTimeInsights,
        interviewIntelligence: result.interviewIntelligence,
        recommendations: result.recommendations,
        currentDifficulty: result.difficultyAdjustment.recommendedDifficulty,
        nextQuestion: result.nextQuestion,
        overallConfidence: result.confidence,
        isAnalyzing: false
      }))

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed'
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }))
      throw error
    }
  }, [])

  // Update configuration
  const updateConfig = useCallback((config: Partial<MLOrchestratorConfig>) => {
    if (orchestratorRef.current) {
      orchestratorRef.current.updateConfig(config)
    }
  }, [])

  // Get current insights
  const getCurrentInsights = useCallback((): RealTimeInsights | null => {
    return state.realTimeInsights
  }, [state.realTimeInsights])

  // Get interview intelligence
  const getInterviewIntelligence = useCallback((): InterviewIntelligence | null => {
    return state.interviewIntelligence
  }, [state.interviewIntelligence])

  // Get recommendations
  const getRecommendations = useCallback((): SystemRecommendations | null => {
    return state.recommendations
  }, [state.recommendations])

  // Clear history
  const clearHistory = useCallback(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.clearHistory()
    }
    
    setState(prev => ({
      ...prev,
      latestAnalysis: null,
      analysisHistory: [],
      realTimeInsights: null,
      interviewIntelligence: null,
      recommendations: null,
      nextQuestion: null,
      overallConfidence: 0
    }))
  }, [])

  // Destroy orchestrator
  const destroy = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }

    if (orchestratorRef.current) {
      orchestratorRef.current.destroy()
      orchestratorRef.current = null
    }

    setState({
      isInitialized: false,
      isInitializing: false,
      isAnalyzing: false,
      latestAnalysis: null,
      analysisHistory: [],
      realTimeInsights: null,
      interviewIntelligence: null,
      recommendations: null,
      currentDifficulty: 'medium',
      nextQuestion: null,
      overallConfidence: 0,
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

  const actions: MLIntegrationActions = {
    initialize,
    performAnalysis,
    updateConfig,
    getCurrentInsights,
    getInterviewIntelligence,
    getRecommendations,
    clearHistory,
    destroy
  }

  return [state, actions]
}

// Specialized hook for real-time interview monitoring
export function useRealTimeInterviewMonitoring() {
  const [state, actions] = useMLIntegration({
    autoInitialize: true,
    enableRealTimeAnalysis: true,
    analysisInterval: 3000,
    adaptationSensitivity: 0.8,
    enableAutoAdaptation: true
  })

  return {
    ...state,
    ...actions,
    
    // Convenience getters
    overallPerformance: state.latestAnalysis?.performancePrediction.overallSuccessProbability || 0,
    currentSentiment: state.latestAnalysis?.sentimentAnalysis.fusedSentiment.overallSentiment || 0,
    stressLevel: state.latestAnalysis?.sentimentAnalysis.realTimeInsights.stressLevel || 0,
    engagementLevel: state.latestAnalysis?.sentimentAnalysis.realTimeInsights.engagementLevel || 0,
    confidenceLevel: state.latestAnalysis?.sentimentAnalysis.realTimeInsights.confidenceLevel || 0,
    
    // Performance trends
    performanceTrend: state.interviewIntelligence?.performanceTrends.overallTrend || 'stable',
    technicalTrend: state.interviewIntelligence?.performanceTrends.technicalTrend || 'stable',
    communicationTrend: state.interviewIntelligence?.performanceTrends.communicationTrend || 'stable',
    
    // Candidate profile
    experienceLevel: state.interviewIntelligence?.candidateProfile.experienceLevel || 'mid',
    communicationStyle: state.interviewIntelligence?.candidateProfile.communicationStyle || 'balanced',
    technicalStrength: state.interviewIntelligence?.candidateProfile.technicalStrength || 0.5,
    interpersonalSkills: state.interviewIntelligence?.candidateProfile.interpersonalSkills || 0.5,
    
    // Interview progress
    interviewDuration: state.interviewIntelligence?.interviewProgress.duration || 0,
    questionsAsked: state.interviewIntelligence?.interviewProgress.questionsAsked || 0,
    completionPercentage: state.interviewIntelligence?.interviewProgress.completionPercentage || 0,
    estimatedRemainingTime: state.interviewIntelligence?.interviewProgress.estimatedRemainingTime || 0,
    
    // Adaptation metrics
    difficultyAdjustments: state.interviewIntelligence?.adaptationHistory.difficultyAdjustments || 0,
    adaptationEffectiveness: state.interviewIntelligence?.adaptationHistory.adaptationEffectiveness || 0,
    
    // Recommendations
    candidateRecommendations: state.recommendations?.forCandidate || [],
    interviewerRecommendations: state.recommendations?.forInterviewer || [],
    systemRecommendations: state.recommendations?.forSystem || [],
    recommendationPriority: state.recommendations?.priority || 'medium',
    
    // Helper methods
    getOverallAssessment: () => {
      if (!state.realTimeInsights) return 'No assessment available'
      return state.realTimeInsights.overallAssessment
    },
    
    getPredictedOutcome: () => {
      if (!state.realTimeInsights) return 'Outcome pending'
      return state.realTimeInsights.predictedOutcome
    },
    
    getKeyStrengths: () => {
      return state.realTimeInsights?.keyStrengths || []
    },
    
    getAreasForImprovement: () => {
      return state.realTimeInsights?.areasForImprovement || []
    },
    
    getImmediateActions: () => {
      return state.realTimeInsights?.immediateActions || []
    },
    
    getDifficultyProgression: () => {
      return state.interviewIntelligence?.interviewProgress.difficultyProgression || []
    },
    
    getPerformanceProgression: () => {
      return state.interviewIntelligence?.interviewProgress.performanceProgression || []
    },
    
    getEmotionalJourney: () => {
      return state.interviewIntelligence?.emotionalJourney || null
    },
    
    isPerformingWell: () => {
      const performance = state.latestAnalysis?.performancePrediction.overallSuccessProbability || 0
      return performance > 0.7
    },
    
    needsSupport: () => {
      const stress = state.latestAnalysis?.sentimentAnalysis.realTimeInsights.stressLevel || 0
      const confidence = state.latestAnalysis?.sentimentAnalysis.realTimeInsights.confidenceLevel || 0
      return stress > 0.7 || confidence < 0.4
    },
    
    isEngaged: () => {
      const engagement = state.latestAnalysis?.sentimentAnalysis.realTimeInsights.engagementLevel || 0
      return engagement > 0.6
    },
    
    shouldAdjustDifficulty: () => {
      if (!state.latestAnalysis) return false
      return state.latestAnalysis.difficultyAdjustment.currentDifficulty !== 
             state.latestAnalysis.difficultyAdjustment.recommendedDifficulty
    },
    
    getAdaptationReason: () => {
      return state.latestAnalysis?.difficultyAdjustment.adjustmentReason || 'No adaptation needed'
    }
  }
}

// Hook for interview coaching and guidance
export function useInterviewCoaching() {
  const [state, actions] = useMLIntegration({
    autoInitialize: true,
    enableRealTimeAnalysis: true,
    analysisInterval: 2000,
    adaptationSensitivity: 0.9
  })

  return {
    isActive: state.isInitialized,
    
    // Real-time coaching
    getLiveCoaching: () => {
      const insights = state.realTimeInsights
      if (!insights) return []
      
      const coaching: string[] = []
      
      // Add immediate actions
      coaching.push(...insights.immediateActions)
      
      // Add performance-based coaching
      if (state.latestAnalysis) {
        const performance = state.latestAnalysis.performancePrediction.overallSuccessProbability
        if (performance < 0.5) {
          coaching.push('Focus on providing more detailed examples and explanations')
        }
        
        const stress = state.latestAnalysis.sentimentAnalysis.realTimeInsights.stressLevel
        if (stress > 0.7) {
          coaching.push('Take a deep breath and speak more slowly')
        }
        
        const confidence = state.latestAnalysis.sentimentAnalysis.realTimeInsights.confidenceLevel
        if (confidence < 0.5) {
          coaching.push('Speak with more conviction and certainty')
        }
      }
      
      return coaching.slice(0, 3) // Limit to top 3 recommendations
    },
    
    getPositiveFeedback: () => {
      const insights = state.realTimeInsights
      if (!insights) return []
      
      const feedback: string[] = []
      
      if (state.latestAnalysis) {
        const performance = state.latestAnalysis.performancePrediction.overallSuccessProbability
        if (performance > 0.7) {
          feedback.push('Excellent performance! Keep up the great work')
        }
        
        const engagement = state.latestAnalysis.sentimentAnalysis.realTimeInsights.engagementLevel
        if (engagement > 0.7) {
          feedback.push('Great engagement and enthusiasm!')
        }
        
        const confidence = state.latestAnalysis.sentimentAnalysis.realTimeInsights.confidenceLevel
        if (confidence > 0.7) {
          feedback.push('Strong confidence level - very impressive')
        }
      }
      
      // Add key strengths
      feedback.push(...insights.keyStrengths.slice(0, 2))
      
      return feedback
    },
    
    getInterviewerGuidance: () => {
      return state.recommendations?.forInterviewer || []
    },
    
    // Actions
    ...actions
  }
}

// Export types for convenience
export type {
  ComprehensiveAnalysisResult,
  RealTimeInsights,
  InterviewIntelligence,
  SystemRecommendations,
  MLOrchestratorConfig
}
