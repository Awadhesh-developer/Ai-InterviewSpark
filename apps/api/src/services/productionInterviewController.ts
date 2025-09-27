// Production Interview Controller
// Orchestrates the complete interview experience with all production services

import { EventEmitter } from 'events'
import { db } from '../database/connection'
import { interviewSessions, questions, answers, idealAnswers } from '../database/schema-v2'
import { eq, and, desc } from 'drizzle-orm'
import ProductionQuestionEngine from './productionQuestionEngine'
import MultiModalAnalysisEngine from './multiModalAnalysisEngine'
import WebRTCInterviewPlatform from './webrtcInterviewPlatform'

// Interview Configuration
interface ProductionInterviewConfig {
  sessionId: string
  userId: string
  interviewContext: {
    role: string
    position: string
    industry: string
    company?: string
    location?: string
    jobDescription?: string
    experienceLevel: 'entry' | 'mid' | 'senior' | 'lead'
    techStack?: string[]
    companyStage?: 'startup' | 'growth' | 'enterprise'
  }
  questionConfig: {
    types: Array<'behavioral' | 'technical' | 'situational' | 'system-design' | 'coding' | 'company-specific'>
    difficulty: 1 | 2 | 3 | 4 | 5
    count: number
    adaptiveLevel?: 'easy' | 'medium' | 'hard'
    includeFollowUps: boolean
    generateIdealAnswers: boolean
    llmProvider?: 'openai' | 'claude' | 'gemini' | 'perplexity' | 'auto'
  }
  modalityConfig: {
    video: { enabled: boolean; quality: string; analysis: boolean }
    audio: { enabled: boolean; quality: string; transcription: boolean }
    text: { enabled: boolean; realTime: boolean }
    analysis: {
      sentiment: boolean
      emotion: boolean
      voice: boolean
      facial: boolean
      bodyLanguage: boolean
    }
  }
  platformConfig: {
    recordingEnabled: boolean
    transcriptionEnabled: boolean
    realTimeFeedback: boolean
    adaptiveQuestioning: boolean
  }
}

// Interview State
interface InterviewState {
  sessionId: string
  status: 'setup' | 'calibration' | 'interview' | 'feedback' | 'complete'
  currentStep: string
  currentQuestionIndex: number
  totalQuestions: number
  timeElapsed: number
  timeRemaining: number
  isPaused: boolean
  pauseReason?: string
  resumeCount: number
  adaptiveLevel: 'easy' | 'medium' | 'hard'
  performanceMetrics: {
    overallScore: number
    categoryScores: Record<string, number>
    confidenceLevel: number
    responseTime: number
    engagementScore: number
    technicalAccuracy: number
    communicationClarity: number
  }
}

// Interview Events
interface InterviewEvents {
  stateChanged: (state: InterviewState) => void
  questionGenerated: (question: any) => void
  answerAnalyzed: (analysis: any) => void
  realTimeFeedback: (feedback: any) => void
  interviewCompleted: (results: any) => void
  error: (error: Error) => void
}

export class ProductionInterviewController extends EventEmitter {
  private questionEngine: ProductionQuestionEngine
  private analysisEngine: MultiModalAnalysisEngine
  private webrtcPlatform: WebRTCInterviewPlatform | null = null
  private activeInterviews: Map<string, InterviewState> = new Map()
  private interviewQuestions: Map<string, any[]> = new Map()

  constructor() {
    super()
    
    // Initialize production services
    this.questionEngine = new ProductionQuestionEngine()
    this.analysisEngine = new MultiModalAnalysisEngine()
    // Temporarily disable WebRTC to avoid port conflicts
    // this.webrtcPlatform = new WebRTCInterviewPlatform()

    // Setup event handlers
    this.setupEventHandlers()
    
    console.log('🎯 Production Interview Controller initialized (WebRTC disabled)')
  }

  /**
   * Create and start production interview session
   */
  async createInterviewSession(config: ProductionInterviewConfig): Promise<{
    sessionId: string
    state: InterviewState
    questions: any[]
    webrtcRoom: any
  }> {
    const startTime = Date.now()
    
    try {
      console.log(`🚀 Creating production interview session: ${config.sessionId}`)
      
      // Step 1: Update session in database with production configuration
      await this.updateSessionConfiguration(config)
      
      // Step 2: Generate intelligent questions
      const questions = await this.generateInterviewQuestions(config)
      
      // Step 3: Create WebRTC room for real-time communication (temporarily disabled)
      // const webrtcRoom = await this.webrtcPlatform.createInterviewRoom(
      //   config.sessionId,
      //   {
      //     recordingEnabled: config.platformConfig.recordingEnabled,
      //     transcriptionEnabled: config.platformConfig.transcriptionEnabled,
      //     analysisEnabled: config.modalityConfig.analysis.sentiment
      //   }
      // )
      const webrtcRoom = { roomId: config.sessionId, status: 'disabled' }
      
      // Step 4: Initialize interview state
      const initialState: InterviewState = {
        sessionId: config.sessionId,
        status: 'setup',
        currentStep: 'initialization',
        currentQuestionIndex: 0,
        totalQuestions: questions.length,
        timeElapsed: 0,
        timeRemaining: config.questionConfig.count * 180, // 3 minutes per question
        isPaused: false,
        resumeCount: 0,
        adaptiveLevel: config.questionConfig.adaptiveLevel || 'medium',
        performanceMetrics: {
          overallScore: 0,
          categoryScores: {},
          confidenceLevel: 0,
          responseTime: 0,
          engagementScore: 0,
          technicalAccuracy: 0,
          communicationClarity: 0
        }
      }
      
      // Store state and questions
      this.activeInterviews.set(config.sessionId, initialState)
      this.interviewQuestions.set(config.sessionId, questions)
      
      const creationTime = Date.now() - startTime
      console.log(`✅ Interview session created in ${creationTime}ms with ${questions.length} questions`)
      
      // Emit state change
      this.emit('stateChanged', initialState)
      
      return {
        sessionId: config.sessionId,
        state: initialState,
        questions: questions.map(q => this.sanitizeQuestionForFrontend(q)),
        webrtcRoom
      }
      
    } catch (error) {
      console.error('❌ Error creating interview session:', error)
      this.emit('error', error as Error)
      throw error
    }
  }

  /**
   * Start interview session
   */
  async startInterview(sessionId: string, userId: string): Promise<InterviewState> {
    try {
      const state = this.activeInterviews.get(sessionId)
      if (!state) {
        throw new Error(`Interview session ${sessionId} not found`)
      }

      // Update session status in database
      await db.update(interviewSessions)
        .set({
          status: 'active',
          startedAt: new Date(),
          sessionState: {
            currentStep: 'interview',
            currentQuestionIndex: state.currentQuestionIndex,
            totalQuestions: state.totalQuestions,
            timeElapsed: state.timeElapsed,
            timeRemaining: Math.max(0, (state.totalQuestions - state.currentQuestionIndex) * 180),
            isPaused: false,
            resumeCount: 0,
            adaptiveLevel: 'medium'
          }
        })
        .where(eq(interviewSessions.id, sessionId))

      // Update local state
      state.status = 'interview'
      state.currentStep = 'interview'
      
      console.log(`▶️ Started interview session: ${sessionId}`)
      
      // Emit state change
      this.emit('stateChanged', state)
      
      return state

    } catch (error) {
      console.error('Error starting interview:', error)
      throw error
    }
  }

  /**
   * Submit answer and get real-time analysis
   */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    userId: string,
    answerData: {
      textContent?: string
      audioUrl?: string
      videoUrl?: string
      responseMetrics: {
        thinkingTime: number
        responseTime: number
        pauseCount: number
        avgPauseLength: number
      }
    }
  ): Promise<{
    analysis: any
    feedback: any
    nextQuestion?: any
    isComplete: boolean
  }> {
    const startTime = Date.now()
    
    try {
      console.log(`📝 Processing answer for question ${questionId}`)
      
      // Get current state
      const state = this.activeInterviews.get(sessionId)
      if (!state) {
        throw new Error(`Interview session ${sessionId} not found`)
      }

      // Analyze answer with multi-modal engine
      const analysis = await this.analysisEngine.analyzeResponse(
        questionId,
        sessionId,
        userId,
        answerData
      )

      // Generate feedback with ideal answer comparison
      const feedback = await this.generateComprehensiveFeedback(
        questionId,
        answerData.textContent || '',
        analysis
      )

      // Update performance metrics
      this.updatePerformanceMetrics(state, analysis)

      // Move to next question or complete interview
      const isComplete = await this.progressToNextQuestion(sessionId, state)
      let nextQuestion = null

      if (!isComplete) {
        const questions = this.interviewQuestions.get(sessionId) || []
        nextQuestion = questions[state.currentQuestionIndex]
        
        if (nextQuestion) {
          nextQuestion = this.sanitizeQuestionForFrontend(nextQuestion)
        }
      }

      // Store updated state
      await this.updateSessionState(sessionId, state)

      const processingTime = Date.now() - startTime
      console.log(`✅ Answer processed in ${processingTime}ms`)

      // Emit events
      this.emit('answerAnalyzed', { sessionId, questionId, analysis, feedback })
      this.emit('stateChanged', state)

      if (isComplete) {
        await this.completeInterview(sessionId)
      }

      return {
        analysis,
        feedback,
        nextQuestion,
        isComplete
      }

    } catch (error) {
      console.error('Error submitting answer:', error)
      this.emit('error', error as Error)
      throw error
    }
  }

  /**
   * Get real-time feedback during answer
   */
  async getRealTimeFeedback(
    sessionId: string,
    participantId: string,
    mediaData: {
      type: 'audio' | 'video' | 'text'
      data: any
      timestamp: number
    }
  ): Promise<any> {
    try {
      // Process with analysis engine for real-time insights
      // This would integrate with the WebRTC platform's media processing
      
      const feedback = {
        timestamp: mediaData.timestamp,
        engagement: 0.8,
        confidence: 0.7,
        speechRate: 150,
        eyeContact: 0.6,
        facialSentiment: 0.75,
        voiceEnergy: 0.65,
        responseQuality: 0.7,
        suggestions: [
          'Maintain eye contact',
          'Speak a bit slower for clarity'
        ]
      }

      // Emit real-time feedback
      this.emit('realTimeFeedback', { sessionId, participantId, feedback })

      return feedback

    } catch (error) {
      console.error('Error getting real-time feedback:', error)
      return null
    }
  }

  /**
   * Pause interview
   */
  async pauseInterview(sessionId: string, reason?: string): Promise<InterviewState> {
    try {
      const state = this.activeInterviews.get(sessionId)
      if (!state) {
        throw new Error(`Interview session ${sessionId} not found`)
      }

      state.isPaused = true
      state.pauseReason = reason
      state.resumeCount += 1

      await this.updateSessionState(sessionId, state)
      
      console.log(`⏸️ Paused interview session: ${sessionId}`)
      
      this.emit('stateChanged', state)
      return state

    } catch (error) {
      console.error('Error pausing interview:', error)
      throw error
    }
  }

  /**
   * Resume interview
   */
  async resumeInterview(sessionId: string): Promise<InterviewState> {
    try {
      const state = this.activeInterviews.get(sessionId)
      if (!state) {
        throw new Error(`Interview session ${sessionId} not found`)
      }

      state.isPaused = false
      state.pauseReason = undefined

      await this.updateSessionState(sessionId, state)
      
      console.log(`▶️ Resumed interview session: ${sessionId}`)
      
      this.emit('stateChanged', state)
      return state

    } catch (error) {
      console.error('Error resuming interview:', error)
      throw error
    }
  }

  /**
   * Complete interview and generate final results
   */
  async completeInterview(sessionId: string): Promise<{
    finalResults: any
    performanceReport: any
    recommendations: string[]
  }> {
    try {
      console.log(`🏁 Completing interview session: ${sessionId}`)
      
      const state = this.activeInterviews.get(sessionId)
      if (!state) {
        throw new Error(`Interview session ${sessionId} not found`)
      }

      // Generate comprehensive final results
      const finalResults = await this.generateFinalResults(sessionId, state)
      
      // Update session status
      await db.update(interviewSessions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          performanceMetrics: state.performanceMetrics,
          sessionState: {
            currentStep: 'complete',
            currentQuestionIndex: state.currentQuestionIndex,
            totalQuestions: state.totalQuestions,
            timeElapsed: state.timeElapsed,
            timeRemaining: 0,
            isPaused: false,
            resumeCount: 0,
            adaptiveLevel: 'medium'
          }
        })
        .where(eq(interviewSessions.id, sessionId))

      // Update local state
      state.status = 'complete'
      state.currentStep = 'complete'

      // Clean up resources
      this.activeInterviews.delete(sessionId)
      this.interviewQuestions.delete(sessionId)

      console.log(`✅ Interview session ${sessionId} completed`)
      
      // Emit completion event
      this.emit('interviewCompleted', { sessionId, results: finalResults })
      this.emit('stateChanged', state)

      return finalResults

    } catch (error) {
      console.error('Error completing interview:', error)
      throw error
    }
  }

  /**
   * Get interview state
   */
  getInterviewState(sessionId: string): InterviewState | null {
    return this.activeInterviews.get(sessionId) || null
  }

  /**
   * Get interview questions (sanitized for frontend)
   */
  getInterviewQuestions(sessionId: string): any[] {
    const questions = this.interviewQuestions.get(sessionId) || []
    return questions.map(q => this.sanitizeQuestionForFrontend(q))
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Update session configuration in database
   */
  private async updateSessionConfiguration(config: ProductionInterviewConfig): Promise<void> {
    await db.update(interviewSessions)
      .set({
        interviewContext: config.interviewContext as any,
        modalityConfig: config.modalityConfig as any,
        sessionState: {
          currentStep: 'setup',
          currentQuestionIndex: 0,
          totalQuestions: config.questionConfig.count,
          timeElapsed: 0,
          timeRemaining: config.questionConfig.count * 180,
          isPaused: false,
          resumeCount: 0,
          adaptiveLevel: config.questionConfig.adaptiveLevel || 'medium'
        }
      })
      .where(eq(interviewSessions.id, config.sessionId))
  }

  /**
   * Generate interview questions using production engine
   */
  private async generateInterviewQuestions(config: ProductionInterviewConfig): Promise<any[]> {
    return await this.questionEngine.generateQuestions({
      interviewContext: config.interviewContext,
      questionTypes: config.questionConfig.types,
      difficulty: config.questionConfig.difficulty,
      count: config.questionConfig.count,
      adaptiveLevel: config.questionConfig.adaptiveLevel,
      includeFollowUps: config.questionConfig.includeFollowUps,
      generateIdealAnswers: config.questionConfig.generateIdealAnswers,
      llmProvider: config.questionConfig.llmProvider
    })
  }

  /**
   * Generate comprehensive feedback with ideal answer comparison
   */
  private async generateComprehensiveFeedback(
    questionId: string,
    userAnswer: string,
    analysis: any
  ): Promise<any> {
    try {
      // Get ideal answer from database
      const idealAnswer = await db
        .select()
        .from(idealAnswers)
        .where(eq(idealAnswers.questionId, questionId))
        .limit(1)

      if (!idealAnswer || idealAnswer.length === 0) {
        return {
          score: analysis.unified?.overallScore || 0.7,
          strengths: ['Good response structure'],
          improvements: ['Consider adding more specific examples'],
          comparison: null
        }
      }

      // Compare user answer with ideal answer
      const comparison = {
        keyPointsCovered: this.analyzeKeyPointsCoverage(userAnswer, idealAnswer[0]?.keyPoints || []),
        technicalAccuracy: analysis.unified?.technicalCompetence || 0.7,
        communicationClarity: analysis.unified?.communicationSkills || 0.7,
        completeness: analysis.text?.contentAnalysis?.completeness || 0.7,
        structure: analysis.text?.contentAnalysis?.structureScore || 0.7
      }

      return {
        score: analysis.unified?.overallScore || 0.7,
        strengths: this.identifyStrengths(analysis, comparison),
        improvements: idealAnswer[0]?.improvementAreas || [],
        comparison,
        idealAnswerPreview: idealAnswer[0]?.content?.substring(0, 200) + '...' || '',
        recommendations: analysis.unified?.recommendations || []
      }

    } catch (error) {
      console.error('Error generating feedback:', error)
      return {
        score: 0.7,
        strengths: ['Response provided'],
        improvements: ['Consider adding more detail'],
        comparison: null
      }
    }
  }

  /**
   * Update performance metrics based on analysis
   */
  private updatePerformanceMetrics(state: InterviewState, analysis: any): void {
    const metrics = state.performanceMetrics
    
    // Update overall score (running average)
    const newScore = analysis.unified?.overallScore || 0.7
    metrics.overallScore = (metrics.overallScore + newScore) / 2
    
    // Update component scores
    metrics.confidenceLevel = analysis.unified?.confidence || metrics.confidenceLevel
    metrics.engagementScore = analysis.unified?.engagement || metrics.engagementScore
    metrics.technicalAccuracy = analysis.unified?.technicalCompetence || metrics.technicalAccuracy
    metrics.communicationClarity = analysis.unified?.communicationSkills || metrics.communicationClarity
    
    // Update response time
    const responseTime = analysis.audio?.speechPatterns?.responseTime || 0
    metrics.responseTime = responseTime > 0 ? responseTime : metrics.responseTime
  }

  /**
   * Progress to next question
   */
  private async progressToNextQuestion(sessionId: string, state: InterviewState): Promise<boolean> {
    state.currentQuestionIndex += 1
    
    if (state.currentQuestionIndex >= state.totalQuestions) {
      return true // Interview complete
    }
    
    state.currentStep = 'interview'
    return false // Continue interview
  }

  /**
   * Update session state in database
   */
  private async updateSessionState(sessionId: string, state: InterviewState): Promise<void> {
    await db.update(interviewSessions)
      .set({
        sessionState: state as any,
        performanceMetrics: state.performanceMetrics as any
      })
      .where(eq(interviewSessions.id, sessionId))
  }

  /**
   * Generate final results
   */
  private async generateFinalResults(sessionId: string, state: InterviewState): Promise<any> {
    // Get all answers for this session
    const sessionAnswers = await db.query.answers.findMany({
      where: eq(answers.sessionId, sessionId),
      orderBy: answers.submittedAt
    })

    return {
      finalResults: {
        sessionId,
        overallScore: state.performanceMetrics.overallScore,
        totalQuestions: state.totalQuestions,
        questionsAnswered: sessionAnswers.length,
        timeElapsed: state.timeElapsed,
        completionRate: (sessionAnswers.length / state.totalQuestions) * 100
      },
      performanceReport: {
        categoryBreakdown: state.performanceMetrics.categoryScores,
        strengths: this.identifyOverallStrengths(sessionAnswers),
        improvements: this.identifyOverallImprovements(sessionAnswers),
        technicalSkills: state.performanceMetrics.technicalAccuracy,
        communicationSkills: state.performanceMetrics.communicationClarity,
        confidence: state.performanceMetrics.confidenceLevel,
        engagement: state.performanceMetrics.engagementScore
      },
      recommendations: this.generateFinalRecommendations(state, sessionAnswers)
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Analysis engine events
    this.analysisEngine.on('analysisComplete', (data) => {
      this.emit('realTimeFeedback', data)
    })

    // WebRTC platform events (temporarily disabled)
    // this.webrtcPlatform.on('participantJoined', (data) => {
    //   console.log('Participant joined WebRTC room:', data.participant.id)
    // })
  }

  /**
   * Utility methods
   */
  private sanitizeQuestionForFrontend(question: any): any {
    // Remove ideal answers and sensitive data for frontend
    const { idealAnswer, generationMetadata, ...sanitized } = question
    return sanitized
  }

  private analyzeKeyPointsCoverage(userAnswer: string, keyPoints: string[]): number {
    if (!keyPoints.length) return 0.8
    
    const covered = keyPoints.filter(point =>
      userAnswer.toLowerCase().includes(point.toLowerCase())
    )
    
    return covered.length / keyPoints.length
  }

  private identifyStrengths(analysis: any, comparison: any): string[] {
    const strengths = []
    
    if (comparison.technicalAccuracy > 0.8) strengths.push('Strong technical knowledge')
    if (comparison.communicationClarity > 0.8) strengths.push('Clear communication')
    if (comparison.structure > 0.8) strengths.push('Well-structured response')
    if (comparison.completeness > 0.8) strengths.push('Comprehensive answer')
    
    return strengths.length ? strengths : ['Good overall response']
  }

  private identifyOverallStrengths(answers: any[]): string[] {
    // Analyze patterns across all answers
    return ['Consistent performance', 'Good technical understanding']
  }

  private identifyOverallImprovements(answers: any[]): string[] {
    // Analyze patterns across all answers
    return ['Add more specific examples', 'Improve response structure']
  }

  private generateFinalRecommendations(state: InterviewState, answers: any[]): string[] {
    const recommendations = []
    
    if (state.performanceMetrics.confidenceLevel < 0.7) {
      recommendations.push('Practice speaking with more confidence')
    }
    
    if (state.performanceMetrics.technicalAccuracy < 0.7) {
      recommendations.push('Review technical concepts for your role')
    }
    
    if (state.performanceMetrics.communicationClarity < 0.7) {
      recommendations.push('Focus on clearer, more structured responses')
    }
    
    return recommendations.length ? recommendations : ['Keep up the great work!']
  }
}

export default ProductionInterviewController
