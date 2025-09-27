import { AICoachingSession, SessionProgress } from './aiCoachingSessionService'
import { AICoachResponse } from './llmIntegrationService'

export interface CreateSessionRequest {
  userId: string
  role: string
  sessionType: 'practice' | 'mock-interview' | 'skill-assessment' | 'behavioral'
  config?: {
    difficulty?: number
    focusAreas: string[]
    timeLimit?: number
    questionCount?: number
    adaptiveDifficulty?: boolean
    emotionalAnalysis?: boolean
  }
  userProfile?: {
    level: 'novice' | 'intermediate' | 'advanced' | 'expert'
    experience: string[]
    weaknesses: string[]
    goals: string[]
  }
}

export interface ProcessResponseRequest {
  sessionId: string
  userResponse: string
  responseTime?: number
}

export interface ProcessResponseResult {
  evaluation: {
    score: number
    feedback: string[]
    strengths: string[]
    improvements: string[]
    nextSteps: string[]
  }
  nextQuestion?: AICoachResponse
  sessionComplete: boolean
  progress: SessionProgress
}

export interface UpdateSessionRequest {
  sessionId: string
  action: 'pause' | 'resume' | 'updateEmotionalState'
  data?: {
    emotionalState?: {
      confidence: number
      stress: number
      engagement: number
      clarity: number
    }
  }
}

class AICoachingClient {
  private baseUrl = '/api/ai-coaching'

  // Create a new AI coaching session
  async createSession(request: CreateSessionRequest): Promise<{
    success: boolean
    session?: Partial<AICoachingSession>
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session')
      }

      return data
    } catch (error) {
      console.error('Error creating AI coaching session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get session details
  async getSession(sessionId: string): Promise<{
    success: boolean
    session?: Partial<AICoachingSession>
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/session?sessionId=${sessionId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch session')
      }

      return data
    } catch (error) {
      console.error('Error fetching AI coaching session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get user's active session
  async getActiveSession(userId: string): Promise<{
    success: boolean
    session?: Partial<AICoachingSession>
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/session?userId=${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch active session')
      }

      return data
    } catch (error) {
      console.error('Error fetching active AI coaching session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Process user response
  async processResponse(request: ProcessResponseRequest): Promise<{
    success: boolean
    result?: ProcessResponseResult
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process response')
      }

      return {
        success: true,
        result: {
          evaluation: data.evaluation,
          nextQuestion: data.nextQuestion,
          sessionComplete: data.sessionComplete,
          progress: data.progress
        }
      }
    } catch (error) {
      console.error('Error processing user response:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Generate next question
  async generateQuestion(sessionId: string, userResponse?: string): Promise<{
    success: boolean
    question?: AICoachResponse
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, userResponse }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate question')
      }

      return {
        success: true,
        question: data.question
      }
    } catch (error) {
      console.error('Error generating question:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Update session
  async updateSession(request: UpdateSessionRequest): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/session`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update session')
      }

      return data
    } catch (error) {
      console.error('Error updating AI coaching session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Pause session
  async pauseSession(sessionId: string): Promise<{
    success: boolean
    error?: string
  }> {
    return this.updateSession({
      sessionId,
      action: 'pause'
    })
  }

  // Resume session
  async resumeSession(sessionId: string): Promise<{
    success: boolean
    error?: string
  }> {
    return this.updateSession({
      sessionId,
      action: 'resume'
    })
  }

  // Update emotional state
  async updateEmotionalState(
    sessionId: string,
    emotionalState: {
      confidence: number
      stress: number
      engagement: number
      clarity: number
    }
  ): Promise<{
    success: boolean
    error?: string
  }> {
    return this.updateSession({
      sessionId,
      action: 'updateEmotionalState',
      data: { emotionalState }
    })
  }

  // Cancel session
  async cancelSession(sessionId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/session?sessionId=${sessionId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel session')
      }

      return data
    } catch (error) {
      console.error('Error cancelling AI coaching session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get session progress
  async getSessionProgress(sessionId: string): Promise<{
    success: boolean
    progress?: SessionProgress
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/response?sessionId=${sessionId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch session progress')
      }

      return {
        success: true,
        progress: data.progress
      }
    } catch (error) {
      console.error('Error fetching session progress:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Utility method to handle API errors
  private handleApiError(error: any): string {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    return 'An unexpected error occurred'
  }

  // Utility method to validate session ID
  private validateSessionId(sessionId: string): boolean {
    return typeof sessionId === 'string' && sessionId.length > 0
  }

  // Utility method to validate user response
  private validateUserResponse(response: string): boolean {
    return typeof response === 'string' && response.trim().length > 0
  }

  // Method to check if session is active
  async isSessionActive(sessionId: string): Promise<boolean> {
    try {
      const result = await this.getSession(sessionId)
      return result.success && result.session?.status === 'active'
    } catch (error) {
      return false
    }
  }

  // Method to get session statistics
  async getSessionStats(sessionId: string): Promise<{
    success: boolean
    stats?: {
      questionsAnswered: number
      averageScore: number
      timeElapsed: number
      currentDifficulty: number
      completionPercentage: number
    }
    error?: string
  }> {
    try {
      const progressResult = await this.getSessionProgress(sessionId)
      
      if (!progressResult.success || !progressResult.progress) {
        return {
          success: false,
          error: progressResult.error || 'Failed to fetch session stats'
        }
      }

      const progress = progressResult.progress
      
      return {
        success: true,
        stats: {
          questionsAnswered: progress.currentQuestionIndex,
          averageScore: progress.averageScore,
          timeElapsed: progress.timeElapsed,
          currentDifficulty: progress.currentDifficulty,
          completionPercentage: progress.completionPercentage
        }
      }
    } catch (error) {
      return {
        success: false,
        error: this.handleApiError(error)
      }
    }
  }
}

export const aiCoachingClient = new AICoachingClient()
