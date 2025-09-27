// --- START api/routes/interviews.ts --- //
// Interview routes for AI-InterviewSpark API
// Handles interview session management, real-time feedback, and analytics

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { InterviewService } from '../services/interviewService';
import IntelligentQuestionService from '../services/intelligentQuestionService';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../types';
import { db } from '../database/connection';
import { interviewSessions, questions, answers, feedback, peerSessions, performanceMetrics } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();
const intelligentQuestionService = new IntelligentQuestionService();

// ============================================================================
// QUESTION GENERATION
// ============================================================================

// Generate intelligent interview questions with LLM integration
const generateQuestionsSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  industry: z.string().min(1, 'Industry is required'),
  company: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  count: z.number().min(1).max(20).default(5),
  types: z.array(z.enum(['behavioral', 'technical', 'situational', 'company-specific'])).default(['behavioral', 'technical', 'situational']),
  jobDescription: z.string().optional(),
  llmProvider: z.enum(['openai', 'gemini', 'claude', 'perplexity', 'auto']).default('auto'),
  includeIdealAnswers: z.boolean().default(true),
  sessionId: z.string().uuid().optional(), // Optional for standalone generation
});

router.post('/generate',
  authenticateToken,
  validateRequest(generateQuestionsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const {
        jobTitle,
        industry,
        company,
        difficulty,
        count,
        types,
        jobDescription,
        llmProvider,
        includeIdealAnswers,
        sessionId
      } = req.body;

      console.log(`🧠 Generating ${count} questions for ${jobTitle} using ${llmProvider}`);

      // Create temporary session if none provided
      let actualSessionId = sessionId;
      if (!actualSessionId) {
        const tempSession = await db.insert(interviewSessions).values({
          userId,
          type: 'text',
          status: 'scheduled',
          title: `${jobTitle} Interview Practice`,
          description: `AI-generated questions for ${jobTitle} position`,
          jobTitle,
          company,
          duration: count * 3, // 3 minutes per question
          difficulty,
          topics: types,
          scheduledAt: new Date(),
        }).returning();
        actualSessionId = tempSession[0].id;
      }

      // Generate intelligent questions with ideal answers
      const questions = await intelligentQuestionService.generateQuestionsForUser({
        userId,
        sessionId: actualSessionId,
        jobTitle,
        company,
        industry,
        jobDescription,
        difficulty,
        questionTypes: types,
        count,
        llmProvider,
        includeIdealAnswers
      });

      // Return questions without ideal answers (they're for feedback later)
      const questionsForInterview = questions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        category: q.category,
        expectedDuration: q.timeLimit,
        followUpQuestions: q.followUpQuestions,
        tips: q.tips,
        source: q.source,
        freshnessScore: q.freshnessScore,
        relevanceScore: q.relevanceScore,
        companySpecific: q.companySpecific,
        industryTrends: q.industryTrends,
        starFramework: q.starFramework
      }));

      res.json({
        success: true,
        data: {
          questions: questionsForInterview,
          sessionId: actualSessionId,
          metadata: {
            jobTitle,
            industry,
            company,
            difficulty,
            llmProvider,
            count: questions.length,
            generatedAt: new Date().toISOString(),
            idealAnswersGenerated: includeIdealAnswers
          }
        },
        message: `${questions.length} intelligent questions generated successfully using ${llmProvider}`
      });

    } catch (error: any) {
      console.error('Error generating intelligent questions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate questions',
        questions: [] // Return empty array as fallback
      });
    }
  }
);

// Get questions for interview session (without ideal answers)
router.get('/sessions/:sessionId/questions',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.id;

      // Verify user owns this session
      const session = await db.query.interviewSessions.findFirst({
        where: and(
          eq(interviewSessions.id, sessionId),
          eq(interviewSessions.userId, userId)
        )
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Interview session not found'
        });
      }

      // Get questions for interview (without ideal answers)
      const questions = await intelligentQuestionService.getQuestionsForInterview(sessionId);

      res.json({
        success: true,
        data: {
          questions,
          sessionInfo: {
            id: session.id,
            title: session.title,
            jobTitle: session.jobTitle,
            company: session.company,
            difficulty: session.difficulty,
            duration: session.duration
          }
        },
        message: 'Questions retrieved successfully'
      });

    } catch (error: any) {
      console.error('Error getting interview questions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get questions'
      });
    }
  }
);

// Get ideal answer for feedback (after user submits their answer)
router.post('/questions/:questionId/feedback',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { questionId } = req.params;
      const { userAnswer } = req.body;
      const userId = req.user!.id;

      if (!userAnswer) {
        return res.status(400).json({
          success: false,
          error: 'User answer is required'
        });
      }

      // Get ideal answer and comparison for feedback
      const feedback = await intelligentQuestionService.getIdealAnswerForFeedback(
        questionId, 
        userAnswer
      );

      res.json({
        success: true,
        data: {
          feedback,
          timestamp: new Date().toISOString()
        },
        message: 'Feedback generated successfully'
      });

    } catch (error: any) {
      console.error('Error generating feedback:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate feedback'
      });
    }
  }
);

// ============================================================================
// INTERVIEW SESSION MANAGEMENT
// ============================================================================

// Create new interview session
const createSessionSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  company: z.string().optional(),
  jobDescription: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  duration: z.number().min(15).max(120), // 15-120 minutes
  questionTypes: z.array(z.enum(['behavioral', 'technical', 'situational', 'strengths', 'weaknesses'])),
  topics: z.array(z.string()).optional(),
  includeEmotionalAnalysis: z.boolean().default(true),
  includeResumeAnalysis: z.boolean().default(false),
});

router.post('/sessions', 
  authenticateToken,
  validateRequest(createSessionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const session = await InterviewService.createInterviewSession(userId, req.body);
      
      res.status(201).json({
        success: true,
        data: session,
        message: 'Interview session created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's interview sessions
router.get('/sessions', 
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { status, limit = 10, offset = 0 } = req.query;

      const whereConditions = [eq(interviewSessions.userId, userId)];
      if (status && typeof status === 'string') {
        whereConditions.push(eq(interviewSessions.status, status as any));
      }

      const sessions = await db.query.interviewSessions.findMany({
        where: and(...whereConditions),
        with: {
          questions: {
            orderBy: (questions: any, { asc }: any) => [asc(questions.order)]
          },
          performanceMetrics: true
        },
        orderBy: desc(interviewSessions.createdAt),
        limit: Number(limit),
        offset: Number(offset)
      });

      res.json({
        success: true,
        data: sessions,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: sessions.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get specific interview session
router.get('/sessions/:sessionId', 
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.id;

      const session = await db.query.interviewSessions.findFirst({
        where: and(
          eq(interviewSessions.id, sessionId),
          eq(interviewSessions.userId, userId)
        ),
        with: {
          questions: {
            orderBy: (questions: any, { asc }: any) => [asc(questions.order)]
          },
          answers: {
            with: {
              feedback: true
            }
          },
          performanceMetrics: true
        }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Interview session not found'
        });
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      next(error);
    }
  }
);

// Start interview session
router.put('/sessions/:sessionId/start', 
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const session = await InterviewService.startInterviewSession(sessionId);
      
      res.json({
        success: true,
        data: session,
        message: 'Interview session started successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Complete interview session
router.put('/sessions/:sessionId/complete', 
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const metrics = await InterviewService.completeInterviewSession(sessionId);
      
      res.json({
        success: true,
        data: metrics,
        message: 'Interview session completed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// REAL-TIME INTERVIEW OPERATIONS
// ============================================================================

// Get current interview state
router.get('/sessions/:sessionId/state', 
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const state = InterviewService.getInterviewState(sessionId);
      
      if (!state) {
        return res.status(404).json({
          success: false,
          message: 'Interview session not found or not active'
        });
      }

      const currentQuestion = await InterviewService.getCurrentQuestion(sessionId);
      const realTimeFeedback = await InterviewService.getRealTimeFeedback(sessionId);

      res.json({
        success: true,
        data: {
          currentQuestion,
          progress: realTimeFeedback.progress,
          emotionalState: realTimeFeedback.emotionalState,
          suggestions: realTimeFeedback.suggestions,
          isActive: state.isActive
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Submit answer
const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  text: z.string().optional(),
  audioUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().positive().optional(),
  emotionalData: z.array(z.object({
    emotion: z.string(),
    confidence: z.number().min(0).max(1),
    timestamp: z.number(),
    source: z.enum(['voice', 'facial'])
  })).optional(),
});

router.post('/sessions/:sessionId/answers', 
  authenticateToken,
  validateRequest(submitAnswerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.id;
      
      const result = await InterviewService.submitAnswer({
        sessionId,
        userId,
        ...req.body
      });

      res.json({
        success: true,
        data: result,
        message: 'Answer submitted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get real-time feedback
router.get('/sessions/:sessionId/feedback', 
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const feedback = await InterviewService.getRealTimeFeedback(sessionId);
      
      res.json({
        success: true,
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// ANALYTICS & INSIGHTS
// ============================================================================

// Get user analytics
router.get('/analytics', 
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const analytics = await InterviewService.getUserAnalytics(userId);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get session performance metrics
router.get('/sessions/:sessionId/metrics', 
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.id;

      const metrics = await db.query.performanceMetrics.findFirst({
        where: and(
          eq(performanceMetrics.sessionId, sessionId),
          eq(performanceMetrics.userId, userId)
        )
      });

      if (!metrics) {
        return res.status(404).json({
          success: false,
          message: 'Performance metrics not found'
        });
      }

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get detailed feedback for a session
router.get('/sessions/:sessionId/feedback-details', 
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.id;

      const feedbackDetails = await db.query.feedback.findMany({
        where: and(
          eq(feedback.sessionId, sessionId),
          eq(feedback.userId, userId)
        ),
        with: {
          answer: {
            with: {
              question: true
            }
          }
        },
        orderBy: desc(feedback.createdAt)
      });

      res.json({
        success: true,
        data: feedbackDetails
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// QUESTION MANAGEMENT
// ============================================================================

// Get questions for a session
router.get('/sessions/:sessionId/questions', 
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.id;

      // Verify session belongs to user
      const session = await db.query.interviewSessions.findFirst({
        where: and(
          eq(interviewSessions.id, sessionId),
          eq(interviewSessions.userId, userId)
        )
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Interview session not found'
        });
      }

      const sessionQuestions = await db.query.questions.findMany({
        where: eq(questions.sessionId, sessionId),
        orderBy: (questions, { asc }) => [asc(questions.order)]
      });

      res.json({
        success: true,
        data: sessionQuestions
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get specific question
router.get('/questions/:questionId', 
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { questionId } = req.params;
      const userId = req.user!.id;

      const question = await db.query.questions.findFirst({
        where: eq(questions.id, questionId),
        with: {
          session: true
        }
      });

      if (!question || !question.session || question.session.userId !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      res.json({
        success: true,
        data: question
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// EXPERT & PEER INTERVIEWS
// ============================================================================

// Create peer interview session
const createPeerSessionSchema = z.object({
  peerUserId: z.string().uuid(),
  jobTitle: z.string().min(1),
  duration: z.number().min(15).max(120),
  scheduledAt: z.string().datetime(),
});

router.post('/peer-sessions', 
  authenticateToken,
  validateRequest(createPeerSessionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { peerUserId, jobTitle, duration, scheduledAt } = req.body;

      // Create interview session
      const session = await InterviewService.createInterviewSession(userId, {
        jobTitle,
        difficulty: 'intermediate',
        duration,
        questionTypes: ['behavioral', 'situational'],
        topics: ['general']
      });

      // Create peer session record
      const peerSession = await db.insert(peerSessions).values({
        sessionId: session.id,
        peerUserId,
        status: 'pending'
      }).returning();

      res.status(201).json({
        success: true,
        data: {
          session,
          peerSession: peerSession[0]
        },
        message: 'Peer interview session created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Accept/decline peer interview
router.put('/peer-sessions/:sessionId/respond', 
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const { status } = req.body; // 'accepted' or 'declined'
      const userId = req.user!.id;

      const peerSession = await db.update(peerSessions)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(and(
          eq(peerSessions.sessionId, sessionId),
          eq(peerSessions.peerUserId, userId)
        ))
        .returning();

      if (peerSession.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Peer session not found'
        });
      }

      res.json({
        success: true,
        data: peerSession[0],
        message: `Peer interview ${status} successfully`
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router; 