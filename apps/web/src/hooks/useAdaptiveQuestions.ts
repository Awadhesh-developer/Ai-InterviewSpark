/**
 * React Hook for Adaptive Question Generation
 * Provides dynamic question generation based on real-time candidate analysis
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  AdaptiveQuestionService,
  type GeneratedQuestion,
  type CandidateProfile,
  type InterviewProgress,
  type QuestionCategory,
  type DifficultyLevel
} from '@/services/adaptiveQuestionService'
import { type UnifiedMetrics } from '@/services/unifiedAnalyticsService'

interface UseAdaptiveQuestionsOptions {
  autoInitialize?: boolean
  interviewContext?: {
    position: string
    industry: string
    experienceLevel: string
  }
  maxQuestions?: number
  enableAdaptation?: boolean
}

interface AdaptiveQuestionsHookState {
  isInitialized: boolean
  currentQuestion: GeneratedQuestion | null
  questionHistory: GeneratedQuestion[]
  candidateProfile: CandidateProfile | null
  interviewProgress: InterviewProgress | null
  isGenerating: boolean
  error: string | null
  adaptationInsights: string[]
}

interface AdaptiveQuestionsActions {
  initialize: () => void
  generateNextQuestion: (metrics: UnifiedMetrics, responseHistory: any[]) => Promise<GeneratedQuestion>
  getCurrentQuestion: () => GeneratedQuestion | null
  getQuestionHistory: () => GeneratedQuestion[]
  getCandidateProfile: () => CandidateProfile | null
  getInterviewProgress: () => InterviewProgress | null
  addCustomQuestion: (question: Partial<GeneratedQuestion>) => void
  skipCurrentQuestion: (reason: string) => void
  addResponseToHistory: (question: string, response: string, metrics: UnifiedMetrics, responseTime: number) => void
  destroy: () => void
}

interface ResponseHistoryEntry {
  question: string
  response: string
  metrics: UnifiedMetrics
  responseTime: number
  timestamp: number
}

export function useAdaptiveQuestions(options: UseAdaptiveQuestionsOptions = {}): [AdaptiveQuestionsHookState, AdaptiveQuestionsActions] {
  const {
    autoInitialize = false,
    interviewContext = {
      position: 'Software Engineer',
      industry: 'Technology',
      experienceLevel: 'Mid-level'
    },
    maxQuestions = 10,
    enableAdaptation = true
  } = options

  const serviceRef = useRef<AdaptiveQuestionService | null>(null)
  const responseHistoryRef = useRef<ResponseHistoryEntry[]>([])
  
  const [state, setState] = useState<AdaptiveQuestionsHookState>({
    isInitialized: false,
    currentQuestion: null,
    questionHistory: [],
    candidateProfile: null,
    interviewProgress: null,
    isGenerating: false,
    error: null,
    adaptationInsights: []
  })

  // Initialize adaptive question service
  const initialize = useCallback(() => {
    if (serviceRef.current) return

    try {
      serviceRef.current = new AdaptiveQuestionService()
      
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
  }, [])

  // Generate next question based on current metrics and response history
  const generateNextQuestion = useCallback(async (
    metrics: UnifiedMetrics, 
    responseHistory: any[]
  ): Promise<GeneratedQuestion> => {
    if (!serviceRef.current) {
      throw new Error('Adaptive question service not initialized')
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      // Prepare context for question generation
      const context = {
        ...interviewContext,
        previousQuestions: state.questionHistory.map(q => q.text),
        responseHistory: responseHistoryRef.current,
        startTime: responseHistoryRef.current[0]?.timestamp || Date.now()
      }

      // Generate the next question
      const generatedQuestion = await serviceRef.current.generateNextQuestion(metrics, context)
      
      // Update state with new question and profiles
      setState(prev => ({
        ...prev,
        currentQuestion: generatedQuestion,
        questionHistory: [...prev.questionHistory, generatedQuestion],
        candidateProfile: serviceRef.current!.getCandidateProfile(),
        interviewProgress: serviceRef.current!.getInterviewProgress(),
        isGenerating: false,
        adaptationInsights: generateAdaptationInsights(generatedQuestion, metrics)
      }))

      return generatedQuestion

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Question generation failed'
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }))
      throw error
    }
  }, [interviewContext, state.questionHistory])

  // Generate insights about why this question was selected
  const generateAdaptationInsights = useCallback((
    question: GeneratedQuestion, 
    metrics: UnifiedMetrics
  ): string[] => {
    const insights: string[] = []
    
    // Performance-based insights
    if (metrics.overall.performanceScore > 0.8) {
      insights.push(`Selected ${question.difficulty} difficulty due to strong performance (${Math.round(metrics.overall.performanceScore * 100)}%)`)
    } else if (metrics.overall.performanceScore < 0.5) {
      insights.push(`Selected supportive question to build confidence (current score: ${Math.round(metrics.overall.performanceScore * 100)}%)`)
    }
    
    // Communication-based insights
    if (metrics.overall.communicationEffectiveness < 0.6) {
      insights.push(`Focusing on ${question.category} to assess communication skills`)
    }
    
    // Behavioral insights
    if (metrics.bodyLanguage.professionalDemeanor < 0.6) {
      insights.push(`Selected behavioral question to evaluate professional presence`)
    }
    
    // Attention insights
    if (metrics.gaze.attentionFocus < 0.6) {
      insights.push(`Chose engaging question format to maintain attention`)
    }
    
    // Adaptation context insights
    if (question.adaptationContext.adaptationReason) {
      insights.push(question.adaptationContext.adaptationReason)
    }
    
    return insights
  }, [])

  // Add response to history for future adaptation
  const addResponseToHistory = useCallback((
    question: string,
    response: string,
    metrics: UnifiedMetrics,
    responseTime: number
  ) => {
    const entry: ResponseHistoryEntry = {
      question,
      response,
      metrics,
      responseTime,
      timestamp: Date.now()
    }
    
    responseHistoryRef.current.push(entry)
    
    // Keep only recent history to manage memory
    if (responseHistoryRef.current.length > maxQuestions * 2) {
      responseHistoryRef.current = responseHistoryRef.current.slice(-maxQuestions)
    }
  }, [maxQuestions])

  // Get current question
  const getCurrentQuestion = useCallback((): GeneratedQuestion | null => {
    return state.currentQuestion
  }, [state.currentQuestion])

  // Get question history
  const getQuestionHistory = useCallback((): GeneratedQuestion[] => {
    return [...state.questionHistory]
  }, [state.questionHistory])

  // Get candidate profile
  const getCandidateProfile = useCallback((): CandidateProfile | null => {
    return state.candidateProfile
  }, [state.candidateProfile])

  // Get interview progress
  const getInterviewProgress = useCallback((): InterviewProgress | null => {
    return state.interviewProgress
  }, [state.interviewProgress])

  // Add custom question to the flow
  const addCustomQuestion = useCallback((question: Partial<GeneratedQuestion>) => {
    const customQuestion: GeneratedQuestion = {
      id: `custom_${Date.now()}`,
      text: question.text || 'Custom question',
      category: question.category || 'behavioral',
      difficulty: question.difficulty || 'medium',
      expectedDuration: question.expectedDuration || 120000,
      evaluationCriteria: question.evaluationCriteria || {
        expectedKeywords: [],
        responseLength: { min: 50, max: 300 },
        emotionalTone: ['professional']
      },
      adaptationContext: question.adaptationContext || {
        triggeredBy: 'manual_addition',
        performanceMetrics: {} as UnifiedMetrics,
        candidateProfile: {} as CandidateProfile,
        interviewProgress: {} as InterviewProgress,
        adaptationReason: 'Manually added custom question'
      }
    }

    setState(prev => ({
      ...prev,
      currentQuestion: customQuestion,
      questionHistory: [...prev.questionHistory, customQuestion]
    }))
  }, [])

  // Skip current question with reason
  const skipCurrentQuestion = useCallback((reason: string) => {
    if (state.currentQuestion) {
      setState(prev => ({
        ...prev,
        adaptationInsights: [...prev.adaptationInsights, `Question skipped: ${reason}`]
      }))
    }
  }, [state.currentQuestion])

  // Destroy service and cleanup
  const destroy = useCallback(() => {
    serviceRef.current = null
    responseHistoryRef.current = []
    
    setState({
      isInitialized: false,
      currentQuestion: null,
      questionHistory: [],
      candidateProfile: null,
      interviewProgress: null,
      isGenerating: false,
      error: null,
      adaptationInsights: []
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
      destroy()
    }
  }, [destroy])

  const actions: AdaptiveQuestionsActions = {
    initialize,
    generateNextQuestion,
    getCurrentQuestion,
    getQuestionHistory,
    getCandidateProfile,
    getInterviewProgress,
    addCustomQuestion,
    skipCurrentQuestion,
    addResponseToHistory,
    destroy
  }

  // Expose addResponseToHistory for external use
  const extendedActions = {
    ...actions,
    addResponseToHistory
  }

  return [state, extendedActions]
}

// Specialized hook for interview flow management
export function useInterviewFlow(interviewConfig: {
  position: string
  industry: string
  experienceLevel: string
  targetQuestions: number
}) {
  const [state, actions] = useAdaptiveQuestions({
    autoInitialize: true,
    interviewContext: interviewConfig,
    maxQuestions: interviewConfig.targetQuestions,
    enableAdaptation: true
  })

  return {
    ...state,
    ...actions,
    
    // Convenience getters
    isInterviewComplete: state.questionHistory.length >= interviewConfig.targetQuestions,
    progressPercentage: Math.round((state.questionHistory.length / interviewConfig.targetQuestions) * 100),
    remainingQuestions: Math.max(0, interviewConfig.targetQuestions - state.questionHistory.length),
    
    // Interview flow helpers
    canGenerateNext: state.isInitialized && !state.isGenerating && state.questionHistory.length < interviewConfig.targetQuestions,
    shouldAdaptDifficulty: state.candidateProfile?.confidenceLevel !== undefined,
    
    // Performance insights
    overallTrend: state.interviewProgress?.performanceTrend || 'stable',
    strengthAreas: state.candidateProfile?.strengths || [],
    improvementAreas: state.candidateProfile?.weaknesses || [],
    
    // Question insights
    currentDifficulty: state.currentQuestion?.difficulty || 'medium',
    currentCategory: state.currentQuestion?.category || 'behavioral',
    adaptationReason: state.currentQuestion?.adaptationContext.adaptationReason || '',
    
    // Time management
    averageResponseTime: state.interviewProgress?.averageResponseTime || 0,
    estimatedTimeRemaining: (state.interviewProgress?.averageResponseTime || 120000) * 
                           (interviewConfig.targetQuestions - state.questionHistory.length)
  }
}

// Export types for convenience
export type {
  GeneratedQuestion,
  CandidateProfile,
  InterviewProgress,
  QuestionCategory,
  DifficultyLevel,
  ResponseHistoryEntry
}
