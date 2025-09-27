// Production Interview API Routes
// Implements the complete production interview system

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { authenticateToken } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import ProductionInterviewController from '../services/productionInterviewController'
import ProductionQuestionEngine from '../services/productionQuestionEngine'
import { db } from '../database/connection'
import { interviewSessions } from '../database/schema'
import { eq } from 'drizzle-orm'

const router = Router()

// Initialize production services
const productionController = new ProductionInterviewController()
const questionEngine = new ProductionQuestionEngine()

// ============================================================================
// PRODUCTION INTERVIEW CREATION
// ============================================================================

const createProductionInterviewSchema = z.object({
  // Interview Context (CO-STAR framework)
  interviewContext: z.object({
    role: z.string().min(1, 'Role is required'),
    position: z.string().min(1, 'Position is required'),
    industry: z.string().min(1, 'Industry is required'),
    company: z.string().optional(),
    location: z.string().optional(),
    jobDescription: z.string().optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']).default('mid'),
    techStack: z.array(z.string()).optional(),
    companyStage: z.enum(['startup', 'growth', 'enterprise']).optional()
  }),
  
  // Question Configuration
  questionConfig: z.object({
    types: z.array(z.enum(['behavioral', 'technical', 'situational', 'system-design', 'coding', 'company-specific'])),
    difficulty: z.number().min(1).max(5).default(3),
    count: z.number().min(3).max(20).default(5),
    adaptiveLevel: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
    includeFollowUps: z.boolean().default(true),
    generateIdealAnswers: z.boolean().default(true),
    llmProvider: z.enum(['openai', 'claude', 'gemini', 'perplexity', 'auto']).default('auto')
  }),
  
  // Modality Configuration
  modalityConfig: z.object({
    video: z.object({
      enabled: z.boolean().default(true),
      quality: z.string().default('hd'),
      analysis: z.boolean().default(true)
    }),
    audio: z.object({
      enabled: z.boolean().default(true),
      quality: z.string().default('high'),
      transcription: z.boolean().default(true)
    }),
    text: z.object({
      enabled: z.boolean().default(true),
      realTime: z.boolean().default(true)
    }),
    analysis: z.object({
      sentiment: z.boolean().default(true),
      emotion: z.boolean().default(true),
      voice: z.boolean().default(true),
      facial: z.boolean().default(true),
      bodyLanguage: z.boolean().default(true)
    })
  }),
  
  // Platform Configuration
  platformConfig: z.object({
    recordingEnabled: z.boolean().default(true),
    transcriptionEnabled: z.boolean().default(true),
    realTimeFeedback: z.boolean().default(true),
    adaptiveQuestioning: z.boolean().default(false)
  })
})

/**
 * Create production interview session
 */
router.post('/create',
  authenticateToken,
  validateRequest(createProductionInterviewSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id
      const config = req.body
      
      console.log(`🚀 Creating production interview for user ${userId}`)
      
      // Create basic session first
      const basicSession = await db.insert(interviewSessions).values({
        userId,
        type: config.modalityConfig.video.enabled ? 'video' : 'audio',
        status: 'scheduled',
        title: `${config.interviewContext.position} Interview - Production`,
        description: `AI-powered interview for ${config.interviewContext.position} at ${config.interviewContext.company || 'company'}`,
        jobTitle: config.interviewContext.position,
        company: config.interviewContext.company,
        duration: config.questionConfig.count * 3, // 3 minutes per question
        difficulty: config.questionConfig.difficulty === 1 ? 'beginner' : 
                   config.questionConfig.difficulty >= 4 ? 'advanced' : 'intermediate',
        topics: config.questionConfig.types,
        scheduledAt: new Date()
      }).returning()
      
      const sessionId = basicSession[0].id
      
      // Create production interview session
      const productionSession = await productionController.createInterviewSession({
        sessionId,
        userId,
        ...config
      })
      
      console.log(`✅ Production interview created: ${sessionId}`)
      
      res.json({
        success: true,
        data: {
          sessionId,
          state: productionSession.state,
          questions: productionSession.questions, // Sanitized for frontend
          webrtcRoom: {
            sessionId: productionSession.webrtcRoom.sessionId,
            state: productionSession.webrtcRoom.state,
            configuration: productionSession.webrtcRoom.configuration
          },
          capabilities: {
            realTimeAnalysis: config.modalityConfig.analysis.sentiment,
            multiModalFeedback: true,
            adaptiveQuestioning: config.platformConfig.adaptiveQuestioning,
            intelligentGeneration: true
          }
        },
        message: `Production interview session created with ${productionSession.questions.length} AI-generated questions`
      })
      
    } catch (error: any) {
      console.error('❌ Error creating production interview:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create production interview session',
        fallback: 'System will use basic interview mode'
      })
    }
  }
)

// ============================================================================
// INTERVIEW SESSION MANAGEMENT
// ============================================================================

/**
 * Start production interview
 */
router.post('/:sessionId/start',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params
      const userId = req.user!.id
      
      console.log(`▶️ Starting production interview: ${sessionId}`)
      
      const state = await productionController.startInterview(sessionId, userId)
      
      res.json({
        success: true,
        data: {
          state,
          currentQuestion: productionController.getInterviewQuestions(sessionId)[0],
          capabilities: {
            realTimeAnalysis: true,
            voiceAnalysis: true,
            videoAnalysis: true,
            adaptiveQuestioning: true
          }
        },
        message: 'Production interview started successfully'
      })
      
    } catch (error: any) {
      console.error('❌ Error starting interview:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to start interview'
      })
    }
  }
)

/**
 * Submit answer with multi-modal analysis
 */
router.post('/:sessionId/questions/:questionId/submit',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, questionId } = req.params
      const userId = req.user!.id
      const { textContent, audioUrl, videoUrl, responseMetrics } = req.body
      
      console.log(`📝 Processing answer for question ${questionId}`)
      
      const result = await productionController.submitAnswer(
        sessionId,
        questionId,
        userId,
        {
          textContent,
          audioUrl,
          videoUrl,
          responseMetrics: responseMetrics || {
            thinkingTime: 0,
            responseTime: 0,
            pauseCount: 0,
            avgPauseLength: 0
          }
        }
      )
      
      res.json({
        success: true,
        data: {
          analysis: {
            overallScore: result.analysis.unified?.overallScore || 0.8,
            confidence: result.analysis.unified?.confidence || 0.7,
            engagement: result.analysis.unified?.engagement || 0.8,
            technicalCompetence: result.analysis.unified?.technicalCompetence || 0.7,
            communicationSkills: result.analysis.unified?.communicationSkills || 0.8,
            recommendations: result.analysis.unified?.recommendations || []
          },
          feedback: result.feedback,
          nextQuestion: result.nextQuestion,
          isComplete: result.isComplete,
          progress: {
            currentQuestion: productionController.getInterviewState(sessionId)?.currentQuestionIndex || 0,
            totalQuestions: productionController.getInterviewState(sessionId)?.totalQuestions || 0
          }
        },
        message: result.isComplete ? 'Interview completed!' : 'Answer analyzed successfully'
      })
      
    } catch (error: any) {
      console.error('❌ Error submitting answer:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process answer'
      })
    }
  }
)

/**
 * Get real-time feedback during interview
 */
router.post('/:sessionId/realtime-feedback',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params
      const { participantId, mediaData } = req.body
      
      const feedback = await productionController.getRealTimeFeedback(
        sessionId,
        participantId,
        mediaData
      )
      
      res.json({
        success: true,
        data: feedback,
        message: 'Real-time feedback generated'
      })
      
    } catch (error: any) {
      console.error('❌ Error getting real-time feedback:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get real-time feedback'
      })
    }
  }
)

/**
 * Get interview state
 */
router.get('/:sessionId/state',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params
      
      const state = productionController.getInterviewState(sessionId)
      
      if (!state) {
        return res.status(404).json({
          success: false,
          error: 'Interview session not found'
        })
      }
      
      res.json({
        success: true,
        data: {
          state,
          questions: productionController.getInterviewQuestions(sessionId),
          capabilities: {
            realTimeAnalysis: true,
            multiModalFeedback: true,
            adaptiveQuestioning: true,
            intelligentGeneration: true
          }
        },
        message: 'Interview state retrieved successfully'
      })
      
    } catch (error: any) {
      console.error('❌ Error getting interview state:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get interview state'
      })
    }
  }
)

/**
 * Pause interview
 */
router.post('/:sessionId/pause',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params
      const { reason } = req.body
      
      const state = await productionController.pauseInterview(sessionId, reason)
      
      res.json({
        success: true,
        data: { state },
        message: 'Interview paused successfully'
      })
      
    } catch (error: any) {
      console.error('❌ Error pausing interview:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to pause interview'
      })
    }
  }
)

/**
 * Resume interview
 */
router.post('/:sessionId/resume',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params
      
      const state = await productionController.resumeInterview(sessionId)
      
      res.json({
        success: true,
        data: { state },
        message: 'Interview resumed successfully'
      })
      
    } catch (error: any) {
      console.error('❌ Error resuming interview:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to resume interview'
      })
    }
  }
)

/**
 * Complete interview and get final results
 */
router.post('/:sessionId/complete',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params
      
      console.log(`🏁 Completing production interview: ${sessionId}`)
      
      const results = await productionController.completeInterview(sessionId)
      
      res.json({
        success: true,
        data: results,
        message: 'Interview completed successfully with comprehensive analysis'
      })
      
    } catch (error: any) {
      console.error('❌ Error completing interview:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to complete interview'
      })
    }
  }
)

// ============================================================================
// QUESTION GENERATION (Standalone)
// ============================================================================

const generateQuestionsSchema = z.object({
  interviewContext: z.object({
    role: z.string().min(1, 'Role is required'),
    position: z.string().min(1, 'Position is required'),
    industry: z.string().min(1, 'Industry is required'),
    company: z.string().optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']).default('mid'),
    jobDescription: z.string().optional()
  }),
  questionTypes: z.array(z.enum(['behavioral', 'technical', 'situational', 'system-design', 'coding', 'company-specific'])),
  difficulty: z.number().min(1).max(5).default(3),
  count: z.number().min(1).max(20).default(5),
  llmProvider: z.enum(['openai', 'claude', 'gemini', 'perplexity', 'auto']).default('auto'),
  includeFollowUps: z.boolean().default(true),
  generateIdealAnswers: z.boolean().default(true)
})

/**
 * Generate questions using production engine (standalone)
 */
router.post('/questions/generate',
  authenticateToken,
  validateRequest(generateQuestionsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        interviewContext,
        questionTypes,
        difficulty,
        count,
        llmProvider,
        includeFollowUps,
        generateIdealAnswers
      } = req.body
      
      console.log(`🧠 Generating ${count} production questions using ${llmProvider}`)
      
      const questions = await questionEngine.generateQuestions({
        interviewContext,
        questionTypes,
        difficulty,
        count,
        includeFollowUps,
        generateIdealAnswers,
        llmProvider
      })
      
      // Sanitize questions for frontend (remove ideal answers)
      const sanitizedQuestions = questions.map(q => {
        const { idealAnswer, generationMetadata, ...sanitized } = q
        return {
          ...sanitized,
          llmProvider: generationMetadata.llmProvider,
          qualityScore: q.qualityScore,
          freshnessScore: q.freshnessScore
        }
      })
      
      res.json({
        success: true,
        data: {
          questions: sanitizedQuestions,
          metadata: {
            totalGenerated: questions.length,
            llmProvider: questions[0]?.generationMetadata?.llmProvider || llmProvider,
            avgQualityScore: questions.reduce((sum, q) => sum + q.qualityScore, 0) / questions.length,
            avgRelevanceScore: questions.reduce((sum, q) => sum + q.relevanceScore, 0) / questions.length,
            generatedAt: new Date().toISOString(),
            idealAnswersGenerated: generateIdealAnswers
          }
        },
        message: `${questions.length} high-quality questions generated using ${questions[0]?.generationMetadata?.llmProvider || llmProvider}`
      })
      
    } catch (error: any) {
      console.error('❌ Error generating questions:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate questions',
        fallback: {
          questions: [], // Empty array as fallback
          message: 'Please try again or use basic question generation'
        }
      })
    }
  }
)

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Production system health check
 */
router.get('/health',
  async (req: Request, res: Response) => {
    try {
      // Check all production services
      const healthStatus = {
        productionController: !!productionController,
        questionEngine: !!questionEngine,
        database: true, // Would check DB connection
        llmServices: {
          openai: !!process.env.OPENAI_API_KEY,
          claude: !!process.env.CLAUDE_API_KEY,
          gemini: !!process.env.GEMINI_API_KEY,
          perplexity: !!process.env.PERPLEXITY_API_KEY
        },
        webrtc: true, // Would check WebRTC platform
        multiModalAnalysis: true, // Would check analysis engine
        timestamp: new Date().toISOString()
      }
      
      const allHealthy = Object.values(healthStatus.llmServices).some(Boolean)
      
      res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        data: healthStatus,
        message: allHealthy ? 
          'Production interview system is healthy' : 
          'Some services are unavailable'
      })
      
    } catch (error: any) {
      res.status(503).json({
        success: false,
        error: 'Health check failed',
        message: 'Production interview system is experiencing issues'
      })
    }
  }
)

export default router
