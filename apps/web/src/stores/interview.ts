import { create } from 'zustand'
import {
  InterviewSession,
  InterviewConfig,
  Question,
  Answer,
  Feedback,
  PerformanceMetrics,
  RecordingState,
  EmotionalAnalysis
} from '@/types'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

interface InterviewState {
  sessions: InterviewSession[]
  currentSession: InterviewSession | null
  currentQuestion: Question | null
  currentAnswer: string
  isLoading: boolean
  error: string | null

  // Real-time interview state
  isInterviewActive: boolean
  recordingState: RecordingState
  timeRemaining: number | null
  emotionalAnalysis: EmotionalAnalysis | null

  // Progress tracking
  progress: {
    current: number
    total: number
    percentage: number
  }
}

interface InterviewActions {
  // Session management
  createSession: (config: InterviewConfig) => Promise<InterviewSession>
  loadSessions: () => Promise<void>
  loadSession: (sessionId: string) => Promise<void>
  startSession: (sessionId: string) => Promise<void>
  completeSession: (sessionId: string) => Promise<PerformanceMetrics>

  // Question and answer handling
  submitAnswer: (sessionId: string, data: {
    questionId: string
    textResponse?: string
    audioBlob?: Blob
    videoBlob?: Blob
    duration: number
  }) => Promise<void>

  // Real-time state management
  setCurrentAnswer: (answer: string) => void
  setRecordingState: (state: Partial<RecordingState>) => void
  setTimeRemaining: (time: number | null) => void
  setEmotionalAnalysis: (analysis: EmotionalAnalysis | null) => void
  updateProgress: (current: number, total: number) => void

  // Utility actions
  clearError: () => void
  setLoading: (loading: boolean) => void
  resetInterviewState: () => void
}

type InterviewStore = InterviewState & InterviewActions

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  // Initial state
  sessions: [],
  currentSession: null,
  currentQuestion: null,
  currentAnswer: '',
  isLoading: false,
  error: null,

  isInterviewActive: false,
  recordingState: {
    isRecording: false,
    isPaused: false,
    duration: 0,
  },
  timeRemaining: null,
  emotionalAnalysis: null,

  progress: {
    current: 0,
    total: 0,
    percentage: 0,
  },

  // Actions
  createSession: async (config: InterviewConfig) => {
    try {
      set({ isLoading: true, error: null })

      const session = await apiClient.createInterviewSession(config)

      set(state => ({
        sessions: [session, ...state.sessions],
        currentSession: session,
        isLoading: false,
        error: null,
      }))

      toast.success('Interview session created successfully!')
      return session
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message,
      })
      toast.error(error.message || 'Failed to create interview session')
      throw error
    }
  },

  loadSessions: async () => {
    try {
      set({ isLoading: true, error: null })

      const sessions = await apiClient.getInterviewSessions()

      set({
        sessions,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message,
      })
      toast.error(error.message || 'Failed to load interview sessions')
    }
  },

  loadSession: async (sessionId: string) => {
    try {
      set({ isLoading: true, error: null })

      const session = await apiClient.getInterviewSession(sessionId)

      set({
        currentSession: session,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message,
      })
      toast.error(error.message || 'Failed to load interview session')
      throw error
    }
  },

  startSession: async (sessionId: string) => {
    try {
      set({ isLoading: true, error: null })

      const firstQuestion = await apiClient.startInterviewSession(sessionId)

      set(state => ({
        currentQuestion: firstQuestion,
        isInterviewActive: true,
        isLoading: false,
        error: null,
        progress: {
          current: 1,
          total: state.currentSession?.questions?.length || 1,
          percentage: (1 / (state.currentSession?.questions?.length || 1)) * 100,
        },
      }))

      toast.success('Interview started!')
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message,
      })
      toast.error(error.message || 'Failed to start interview')
      throw error
    }
  },

  completeSession: async (sessionId: string) => {
    try {
      set({ isLoading: true, error: null })

      const metrics = await apiClient.completeInterviewSession(sessionId)

      set({
        isInterviewActive: false,
        currentQuestion: null,
        currentAnswer: '',
        isLoading: false,
        error: null,
      })

      toast.success('Interview completed!')
      return metrics
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message,
      })
      toast.error(error.message || 'Failed to complete interview')
      throw error
    }
  },

  submitAnswer: async (sessionId: string, data) => {
    try {
      set({ isLoading: true, error: null })

      const result = await apiClient.submitAnswer(sessionId, data)

      set(state => {
        const newState: any = {
          currentAnswer: '',
          isLoading: false,
          error: null,
        }

        if (result.nextQuestion) {
          newState.currentQuestion = result.nextQuestion
          newState.progress = {
            current: state.progress.current + 1,
            total: state.progress.total,
            percentage: ((state.progress.current + 1) / state.progress.total) * 100,
          }
        } else {
          newState.isInterviewActive = false
          newState.currentQuestion = null
        }

        return newState
      })

      toast.success('Answer submitted successfully!')
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message,
      })
      toast.error(error.message || 'Failed to submit answer')
      throw error
    }
  },

  // Real-time state management
  setCurrentAnswer: (answer: string) => {
    set({ currentAnswer: answer })
  },

  setRecordingState: (state: Partial<RecordingState>) => {
    set(currentState => ({
      recordingState: { ...currentState.recordingState, ...state }
    }))
  },

  setTimeRemaining: (time: number | null) => {
    set({ timeRemaining: time })
  },

  setEmotionalAnalysis: (analysis: EmotionalAnalysis | null) => {
    set({ emotionalAnalysis: analysis })
  },

  updateProgress: (current: number, total: number) => {
    set({
      progress: {
        current,
        total,
        percentage: (current / total) * 100,
      }
    })
  },

  // Utility actions
  clearError: () => {
    set({ error: null })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  resetInterviewState: () => {
    set({
      currentSession: null,
      currentQuestion: null,
      currentAnswer: '',
      isInterviewActive: false,
      recordingState: {
        isRecording: false,
        isPaused: false,
        duration: 0,
      },
      timeRemaining: null,
      emotionalAnalysis: null,
      progress: {
        current: 0,
        total: 0,
        percentage: 0,
      },
      error: null,
    })
  },
}))