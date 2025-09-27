// Production Interview Service
// Frontend service for production-grade interview system

import { getAuthToken } from '@/lib/auth'

// Production Interview Types
export interface ProductionInterviewConfig {
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

export interface ProductionInterviewState {
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

export interface ProductionQuestion {
  id: string
  content: string
  type: string
  category: string
  subcategory?: string
  difficulty: number
  complexity: {
    technical: number
    behavioral: number
    analytical: number
    communication: number
  }
  estimatedDuration: number
  expectedKeywords: string[]
  skillsAssessed: string[]
  tips: string[]
  followUpQuestions: string[]
  starFramework?: {
    situation: string
    task: string
    action: string
    result: string
    keyPoints: string[]
  }
  qualityScore: number
  relevanceScore: number
  freshnessScore: number
  llmProvider?: string
}

export interface ProductionAnalysis {
  overallScore: number
  confidence: number
  engagement: number
  technicalCompetence: number
  communicationSkills: number
  recommendations: string[]
}

export interface ProductionFeedback {
  score: number
  strengths: string[]
  improvements: string[]
  comparison: {
    keyPointsCovered: number
    technicalAccuracy: number
    communicationClarity: number
    completeness: number
    structure: number
  } | null
  idealAnswerPreview?: string
  recommendations: string[]
}

export class ProductionInterviewService {
  private baseUrl = '/api/production-interviews'
  private currentSessionId: string | null = null

  /**
   * Create production interview session
   */
  async createInterviewSession(config: ProductionInterviewConfig): Promise<{
    sessionId: string
    state: ProductionInterviewState
    questions: ProductionQuestion[]
    webrtcRoom: any
    capabilities: {
      realTimeAnalysis: boolean
      multiModalFeedback: boolean
      adaptiveQuestioning: boolean
      intelligentGeneration: boolean
    }
  }> {
    try {
      console.log('🚀 Creating production interview session...')
      
      const response = await fetch(`${this.baseUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create production interview')
      }

      this.currentSessionId = data.data.sessionId
      
      console.log(`✅ Production interview created: ${data.data.sessionId}`)
      console.log(`🧠 Generated ${data.data.questions.length} questions with ${data.capabilities?.intelligentGeneration ? 'AI' : 'basic'} generation`)

      return data.data

    } catch (error) {
      console.error('❌ Error creating production interview:', error)
      throw error
    }
  }

  /**
   * Start production interview
   */
  async startInterview(sessionId: string): Promise<{
    state: ProductionInterviewState
    currentQuestion: ProductionQuestion
    capabilities: {
      realTimeAnalysis: boolean
      voiceAnalysis: boolean
      videoAnalysis: boolean
      adaptiveQuestioning: boolean
    }
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to start interview')
      }

      console.log(`▶️ Production interview started: ${sessionId}`)

      return data.data

    } catch (error) {
      console.error('❌ Error starting interview:', error)
      throw error
    }
  }

  /**
   * Submit answer with multi-modal analysis
   */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    answerData: {
      textContent?: string
      audioUrl?: string
      videoUrl?: string
      responseMetrics?: {
        thinkingTime: number
        responseTime: number
        pauseCount: number
        avgPauseLength: number
      }
    }
  ): Promise<{
    analysis: ProductionAnalysis
    feedback: ProductionFeedback
    nextQuestion?: ProductionQuestion
    isComplete: boolean
    progress: {
      currentQuestion: number
      totalQuestions: number
    }
  }> {
    try {
      console.log(`📝 Submitting answer for question ${questionId}`)
      
      const response = await fetch(`${this.baseUrl}/${sessionId}/questions/${questionId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(answerData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit answer')
      }

      console.log(`✅ Answer analyzed - Score: ${data.data.analysis.overallScore}, Confidence: ${data.data.analysis.confidence}`)

      return data.data

    } catch (error) {
      console.error('❌ Error submitting answer:', error)
      throw error
    }
  }

  /**
   * Get real-time feedback during interview
   */
  async getRealTimeFeedback(
    sessionId: string,
    participantId: string,
    mediaData: {
      type: 'audio' | 'video' | 'text'
      data: any
      timestamp: number
    }
  ): Promise<{
    engagement: number
    confidence: number
    speechRate: number
    eyeContact: number
    facialSentiment: number
    voiceEnergy: number
    responseQuality: number
    suggestions: string[]
    timestamp: number
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${sessionId}/realtime-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ participantId, mediaData })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to get real-time feedback')
      }

      return data.data

    } catch (error) {
      console.error('❌ Error getting real-time feedback:', error)
      throw error
    }
  }

  /**
   * Get interview state
   */
  async getInterviewState(sessionId: string): Promise<{
    state: ProductionInterviewState
    questions: ProductionQuestion[]
    capabilities: {
      realTimeAnalysis: boolean
      multiModalFeedback: boolean
      adaptiveQuestioning: boolean
      intelligentGeneration: boolean
    }
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${sessionId}/state`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to get interview state')
      }

      return data.data

    } catch (error) {
      console.error('❌ Error getting interview state:', error)
      throw error
    }
  }

  /**
   * Pause interview
   */
  async pauseInterview(sessionId: string, reason?: string): Promise<ProductionInterviewState> {
    try {
      const response = await fetch(`${this.baseUrl}/${sessionId}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ reason })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to pause interview')
      }

      console.log(`⏸️ Interview paused: ${sessionId}`)

      return data.data.state

    } catch (error) {
      console.error('❌ Error pausing interview:', error)
      throw error
    }
  }

  /**
   * Resume interview
   */
  async resumeInterview(sessionId: string): Promise<ProductionInterviewState> {
    try {
      const response = await fetch(`${this.baseUrl}/${sessionId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to resume interview')
      }

      console.log(`▶️ Interview resumed: ${sessionId}`)

      return data.data.state

    } catch (error) {
      console.error('❌ Error resuming interview:', error)
      throw error
    }
  }

  /**
   * Complete interview and get final results
   */
  async completeInterview(sessionId: string): Promise<{
    finalResults: {
      sessionId: string
      overallScore: number
      totalQuestions: number
      questionsAnswered: number
      timeElapsed: number
      completionRate: number
    }
    performanceReport: {
      categoryBreakdown: Record<string, number>
      strengths: string[]
      improvements: string[]
      technicalSkills: number
      communicationSkills: number
      confidence: number
      engagement: number
    }
    recommendations: string[]
  }> {
    try {
      console.log(`🏁 Completing interview: ${sessionId}`)
      
      const response = await fetch(`${this.baseUrl}/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to complete interview')
      }

      console.log(`✅ Interview completed with score: ${data.data.finalResults.overallScore}`)

      return data.data

    } catch (error) {
      console.error('❌ Error completing interview:', error)
      throw error
    }
  }

  /**
   * Generate questions using production engine (standalone)
   */
  async generateQuestions(params: {
    interviewContext: {
      role: string
      position: string
      industry: string
      company?: string
      experienceLevel: 'entry' | 'mid' | 'senior' | 'lead'
      jobDescription?: string
    }
    questionTypes: Array<'behavioral' | 'technical' | 'situational' | 'system-design' | 'coding' | 'company-specific'>
    difficulty: 1 | 2 | 3 | 4 | 5
    count: number
    llmProvider?: 'openai' | 'claude' | 'gemini' | 'perplexity' | 'auto'
    includeFollowUps?: boolean
    generateIdealAnswers?: boolean
  }): Promise<{
    questions: ProductionQuestion[]
    metadata: {
      totalGenerated: number
      llmProvider: string
      avgQualityScore: number
      avgRelevanceScore: number
      generatedAt: string
      idealAnswersGenerated: boolean
    }
  }> {
    try {
      console.log(`🧠 Generating ${params.count} questions using ${params.llmProvider || 'auto'}`)
      
      const response = await fetch(`${this.baseUrl}/questions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          ...params,
          includeFollowUps: params.includeFollowUps ?? true,
          generateIdealAnswers: params.generateIdealAnswers ?? true,
          llmProvider: params.llmProvider || 'auto'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate questions')
      }

      console.log(`✅ Generated ${data.data.questions.length} questions with ${data.data.metadata.llmProvider}`)
      console.log(`📊 Quality: ${data.data.metadata.avgQualityScore.toFixed(2)}, Relevance: ${data.data.metadata.avgRelevanceScore.toFixed(2)}`)

      return data.data

    } catch (error) {
      console.error('❌ Error generating questions:', error)
      throw error
    }
  }

  /**
   * Check production system health
   */
  async checkHealth(): Promise<{
    productionController: boolean
    questionEngine: boolean
    database: boolean
    llmServices: {
      openai: boolean
      claude: boolean
      gemini: boolean
      perplexity: boolean
    }
    webrtc: boolean
    multiModalAnalysis: boolean
    timestamp: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET'
      })

      const data = await response.json()

      return data.data

    } catch (error) {
      console.error('❌ Error checking health:', error)
      throw error
    }
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId
  }

  /**
   * Set current session ID
   */
  setCurrentSessionId(sessionId: string): void {
    this.currentSessionId = sessionId
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSessionId = null
  }
}

export default ProductionInterviewService
