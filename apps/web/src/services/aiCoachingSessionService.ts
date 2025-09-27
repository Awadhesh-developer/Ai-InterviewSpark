import { 
  llmIntegrationService, 
  CoachingContext, 
  ConversationMessage, 
  AICoachResponse 
} from './llmIntegrationService'

export interface AICoachingSession {
  id: string
  userId: string
  role: string
  sessionType: 'practice' | 'mock-interview' | 'skill-assessment' | 'behavioral'
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  startTime: Date
  endTime?: Date
  duration: number // in seconds
  
  // Session Configuration
  config: {
    difficulty: number
    focusAreas: string[]
    timeLimit?: number
    questionCount?: number
    adaptiveDifficulty: boolean
    emotionalAnalysis: boolean
  }
  
  // Conversation Data
  messages: ConversationMessage[]
  currentQuestion?: AICoachResponse
  questionHistory: AICoachResponse[]
  
  // User Profile & Context
  userProfile: {
    level: 'novice' | 'intermediate' | 'advanced' | 'expert'
    experience: string[]
    weaknesses: string[]
    goals: string[]
    previousSessions: string[]
  }
  
  // Performance Tracking
  performance: {
    questionsAnswered: number
    averageScore: number
    scores: number[]
    timePerQuestion: number[]
    difficultyProgression: number[]
    strengths: string[]
    improvements: string[]
  }
  
  // Emotional Intelligence Data
  emotionalData: {
    states: Array<{
      timestamp: number
      confidence: number
      stress: number
      engagement: number
      clarity: number
    }>
    interventions: Array<{
      timestamp: number
      trigger: string
      action: string
      effectiveness?: number
    }>
    overallTrends: {
      confidenceChange: number
      stressChange: number
      engagementChange: number
    }
  }
  
  // Session Analytics
  analytics: {
    totalTokensUsed: number
    llmCalls: number
    averageResponseTime: number
    adaptations: number
    hintsUsed: number
    followUpQuestions: number
  }
  
  // Session Summary
  summary?: {
    overallScore: number
    keyStrengths: string[]
    areasForImprovement: string[]
    recommendations: string[]
    nextSteps: string[]
    estimatedLevel: string
  }
}

export interface SessionProgress {
  currentQuestionIndex: number
  totalQuestions: number
  timeElapsed: number
  timeRemaining?: number
  completionPercentage: number
  currentDifficulty: number
  averageScore: number
  recentPerformance: number[]
}

// Global session storage to persist across API calls
const globalActiveSessions = new Map<string, AICoachingSession>()
const globalSessionStorage = new Map<string, AICoachingSession[]>()

class AICoachingSessionService {
  private activeSessions: Map<string, AICoachingSession> = globalActiveSessions
  private sessionStorage: Map<string, AICoachingSession[]> = globalSessionStorage

  // Create a new AI coaching session
  async createSession(params: {
    userId: string
    role: string
    sessionType: 'practice' | 'mock-interview' | 'skill-assessment' | 'behavioral'
    config: {
      difficulty?: number
      focusAreas: string[]
      timeLimit?: number
      questionCount?: number
      adaptiveDifficulty?: boolean
      emotionalAnalysis?: boolean
    }
    userProfile: {
      level: 'novice' | 'intermediate' | 'advanced' | 'expert'
      experience: string[]
      weaknesses: string[]
      goals: string[]
    }
  }): Promise<AICoachingSession> {
    const sessionId = `ai-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const session: AICoachingSession = {
      id: sessionId,
      userId: params.userId,
      role: params.role,
      sessionType: params.sessionType,
      status: 'active',
      startTime: new Date(),
      duration: 0,
      
      config: {
        difficulty: params.config.difficulty || this.getDefaultDifficulty(params.userProfile.level),
        focusAreas: params.config.focusAreas,
        timeLimit: params.config.timeLimit,
        questionCount: params.config.questionCount || 10,
        adaptiveDifficulty: params.config.adaptiveDifficulty ?? true,
        emotionalAnalysis: params.config.emotionalAnalysis ?? true
      },
      
      messages: [],
      questionHistory: [],
      
      userProfile: {
        ...params.userProfile,
        previousSessions: this.getUserSessionHistory(params.userId).map(s => s.id)
      },
      
      performance: {
        questionsAnswered: 0,
        averageScore: 0,
        scores: [],
        timePerQuestion: [],
        difficultyProgression: [],
        strengths: [],
        improvements: []
      },
      
      emotionalData: {
        states: [],
        interventions: [],
        overallTrends: {
          confidenceChange: 0,
          stressChange: 0,
          engagementChange: 0
        }
      },
      
      analytics: {
        totalTokensUsed: 0,
        llmCalls: 0,
        averageResponseTime: 0,
        adaptations: 0,
        hintsUsed: 0,
        followUpQuestions: 0
      }
    }
    
    // Store session
    this.activeSessions.set(sessionId, session)
    
    // Generate first question
    await this.generateNextQuestion(sessionId)
    
    return session
  }

  // Generate the next question in the session
  async generateNextQuestion(sessionId: string, userResponse?: string): Promise<AICoachResponse> {
    const session = this.getSession(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const startTime = Date.now()
    
    try {
      // Build coaching context
      const context: CoachingContext = {
        role: session.role,
        userLevel: session.userProfile.level,
        sessionType: session.sessionType,
        focusAreas: session.config.focusAreas,
        previousResponses: session.messages,
        userProfile: {
          experience: session.userProfile.experience,
          weaknesses: session.userProfile.weaknesses,
          goals: session.userProfile.goals
        },
        emotionalState: this.getCurrentEmotionalState(session)
      }

      // Generate AI response
      const aiResponse = await llmIntegrationService.generateCoachingResponse(context, userResponse)
      
      // Adapt difficulty if enabled
      if (session.config.adaptiveDifficulty && session.performance.scores.length > 0) {
        const recentPerformance = this.getRecentPerformance(session)
        const emotionalState = this.getCurrentEmotionalState(session)
        
        aiResponse.difficulty = llmIntegrationService.adaptDifficulty(
          aiResponse.difficulty,
          recentPerformance,
          emotionalState
        )
        
        session.analytics.adaptations++
      }
      
      // Store question and update session
      session.currentQuestion = aiResponse
      session.questionHistory.push(aiResponse)
      session.performance.difficultyProgression.push(aiResponse.difficulty)
      
      // Add AI message to conversation
      session.messages.push({
        role: 'assistant',
        content: aiResponse.message,
        timestamp: Date.now(),
        metadata: {
          questionType: aiResponse.questionType,
          difficulty: aiResponse.difficulty,
          category: aiResponse.category
        }
      })
      
      // Update analytics
      session.analytics.llmCalls++
      session.analytics.averageResponseTime = this.updateAverageResponseTime(
        session.analytics.averageResponseTime,
        session.analytics.llmCalls,
        Date.now() - startTime
      )
      
      return aiResponse
    } catch (error) {
      console.error('Error generating next question:', error)
      throw error
    }
  }

  // Process user response and evaluate it
  async processUserResponse(
    sessionId: string,
    userResponse: string,
    responseTime: number
  ): Promise<{
    evaluation: any
    nextQuestion?: AICoachResponse
    sessionComplete: boolean
  }> {
    const session = this.getSession(sessionId)
    if (!session || !session.currentQuestion) {
      throw new Error(`Session or current question not found: ${sessionId}`)
    }

    // Add user message to conversation
    session.messages.push({
      role: 'user',
      content: userResponse,
      timestamp: Date.now()
    })

    // Evaluate the response
    const evaluation = await llmIntegrationService.evaluateResponse(
      userResponse,
      session.currentQuestion.evaluation?.expectedPoints || [],
      {
        role: session.role,
        userLevel: session.userProfile.level,
        sessionType: session.sessionType,
        focusAreas: session.config.focusAreas,
        previousResponses: session.messages,
        userProfile: {
          experience: session.userProfile.experience,
          weaknesses: session.userProfile.weaknesses,
          goals: session.userProfile.goals
        }
      }
    )

    // Update performance metrics
    session.performance.questionsAnswered++
    session.performance.scores.push(evaluation.score)
    session.performance.timePerQuestion.push(responseTime)
    session.performance.averageScore = this.calculateAverageScore(session.performance.scores)
    session.performance.strengths.push(...evaluation.strengths)
    session.performance.improvements.push(...evaluation.improvements)

    // Check if session should continue
    const sessionComplete = this.shouldCompleteSession(session)
    let nextQuestion: AICoachResponse | undefined

    if (!sessionComplete) {
      // Generate next question
      nextQuestion = await this.generateNextQuestion(sessionId)
    } else {
      // Complete the session
      await this.completeSession(sessionId)
    }

    return {
      evaluation,
      nextQuestion,
      sessionComplete
    }
  }

  // Update emotional state
  updateEmotionalState(
    sessionId: string,
    emotionalState: {
      confidence: number
      stress: number
      engagement: number
      clarity: number
    }
  ): void {
    const session = this.getSession(sessionId)
    if (!session) return

    session.emotionalData.states.push({
      timestamp: Date.now(),
      ...emotionalState
    })

    // Update trends
    if (session.emotionalData.states.length > 1) {
      const previous = session.emotionalData.states[session.emotionalData.states.length - 2]
      const current = session.emotionalData.states[session.emotionalData.states.length - 1]
      
      session.emotionalData.overallTrends.confidenceChange = current.confidence - previous.confidence
      session.emotionalData.overallTrends.stressChange = current.stress - previous.stress
      session.emotionalData.overallTrends.engagementChange = current.engagement - previous.engagement
    }

    // Check for interventions needed
    this.checkEmotionalInterventions(session, emotionalState)
  }

  // Get session progress
  getSessionProgress(sessionId: string): SessionProgress {
    const session = this.getSession(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const timeElapsed = Math.floor((Date.now() - session.startTime.getTime()) / 1000)
    const totalQuestions = session.config.questionCount || 10
    const currentQuestionIndex = session.performance.questionsAnswered
    
    return {
      currentQuestionIndex,
      totalQuestions,
      timeElapsed,
      timeRemaining: session.config.timeLimit ? session.config.timeLimit - timeElapsed : undefined,
      completionPercentage: Math.round((currentQuestionIndex / totalQuestions) * 100),
      currentDifficulty: session.currentQuestion?.difficulty || session.config.difficulty,
      averageScore: session.performance.averageScore,
      recentPerformance: session.performance.scores.slice(-3)
    }
  }

  // Complete session and generate summary
  private async completeSession(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId)
    if (!session) return

    session.status = 'completed'
    session.endTime = new Date()
    session.duration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)

    // Generate session summary
    session.summary = {
      overallScore: session.performance.averageScore,
      keyStrengths: [...new Set(session.performance.strengths)].slice(0, 5),
      areasForImprovement: [...new Set(session.performance.improvements)].slice(0, 5),
      recommendations: this.generateRecommendations(session),
      nextSteps: this.generateNextSteps(session),
      estimatedLevel: this.estimateUserLevel(session)
    }

    // Store in user history
    this.storeSessionInHistory(session)
    
    // Remove from active sessions
    this.activeSessions.delete(sessionId)
  }

  // Helper methods
  private getSession(sessionId: string): AICoachingSession | undefined {
    return this.activeSessions.get(sessionId)
  }

  private getDefaultDifficulty(level: string): number {
    const difficultyMap = {
      'novice': 3,
      'intermediate': 5,
      'advanced': 7,
      'expert': 9
    }
    return difficultyMap[level as keyof typeof difficultyMap] || 5
  }

  private getCurrentEmotionalState(session: AICoachingSession) {
    const states = session.emotionalData.states
    return states.length > 0 ? states[states.length - 1] : undefined
  }

  private getRecentPerformance(session: AICoachingSession): number {
    const recentScores = session.performance.scores.slice(-3)
    return recentScores.length > 0 
      ? recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length 
      : 50
  }

  private shouldCompleteSession(session: AICoachingSession): boolean {
    // Check question count
    if (session.config.questionCount && session.performance.questionsAnswered >= session.config.questionCount) {
      return true
    }
    
    // Check time limit
    if (session.config.timeLimit) {
      const elapsed = Math.floor((Date.now() - session.startTime.getTime()) / 1000)
      if (elapsed >= session.config.timeLimit) {
        return true
      }
    }
    
    return false
  }

  private calculateAverageScore(scores: number[]): number {
    return scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0
  }

  private updateAverageResponseTime(currentAvg: number, count: number, newTime: number): number {
    return Math.round(((currentAvg * (count - 1)) + newTime) / count)
  }

  private checkEmotionalInterventions(session: AICoachingSession, state: any): void {
    // High stress intervention
    if (state.stress > 0.7) {
      session.emotionalData.interventions.push({
        timestamp: Date.now(),
        trigger: 'high_stress',
        action: 'breathing_exercise_suggestion'
      })
    }
    
    // Low confidence intervention
    if (state.confidence < 0.3) {
      session.emotionalData.interventions.push({
        timestamp: Date.now(),
        trigger: 'low_confidence',
        action: 'encouragement_message'
      })
    }
  }

  private generateRecommendations(session: AICoachingSession): string[] {
    const recommendations: string[] = []
    
    if (session.performance.averageScore < 60) {
      recommendations.push('Focus on fundamental concepts before advancing to complex topics')
    }
    
    if (session.performance.averageScore > 80) {
      recommendations.push('Consider practicing more advanced scenarios to challenge yourself')
    }
    
    return recommendations
  }

  private generateNextSteps(session: AICoachingSession): string[] {
    return [
      'Review the areas for improvement identified in this session',
      'Practice similar questions to reinforce learning',
      'Schedule another coaching session to track progress'
    ]
  }

  private estimateUserLevel(session: AICoachingSession): string {
    const avgScore = session.performance.averageScore
    
    if (avgScore >= 90) return 'expert'
    if (avgScore >= 75) return 'advanced'
    if (avgScore >= 60) return 'intermediate'
    return 'novice'
  }

  private getUserSessionHistory(userId: string): AICoachingSession[] {
    return this.sessionStorage.get(userId) || []
  }

  private storeSessionInHistory(session: AICoachingSession): void {
    const userSessions = this.getUserSessionHistory(session.userId)
    userSessions.push(session)
    this.sessionStorage.set(session.userId, userSessions)
  }

  // Public methods for session management
  pauseSession(sessionId: string): void {
    const session = this.getSession(sessionId)
    if (session) {
      session.status = 'paused'
    }
  }

  resumeSession(sessionId: string): void {
    const session = this.getSession(sessionId)
    if (session) {
      session.status = 'active'
    }
  }

  cancelSession(sessionId: string): void {
    const session = this.getSession(sessionId)
    if (session) {
      session.status = 'cancelled'
      session.endTime = new Date()
      this.activeSessions.delete(sessionId)
    }
  }

  getActiveSession(userId: string): AICoachingSession | undefined {
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId && session.status === 'active') {
        return session
      }
    }
    return undefined
  }

  getUserSessions(userId: string): AICoachingSession[] {
    return this.getUserSessionHistory(userId)
  }
}

export const aiCoachingSessionService = new AICoachingSessionService()
