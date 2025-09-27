// Enhanced Interview Routes with Perplexity Integration
// Supports Voice, Video, Text interview modes with real-time features

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { EnhancedInterviewService, EnhancedInterviewConfig, InterviewMode } from '../services/enhancedInterviewService';
import { PerplexityService } from '../services/perplexityService';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { QuestionType } from '../types';

const router = Router();
const enhancedInterviewService = new EnhancedInterviewService();
const perplexityService = new PerplexityService();

// Validation schemas
const createEnhancedSessionSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  company: z.string().optional(),
  industry: z.string().min(1, 'Industry is required'),
  jobDescription: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  duration: z.number().min(5).max(120), // 5-120 minutes
  questionTypes: z.array(z.enum(['behavioral', 'technical', 'situational', 'strengths', 'weaknesses', 'company'])),
  topics: z.array(z.string()).optional(),
  interviewMode: z.enum(['voice', 'video', 'text', 'hybrid']).default('video'),
  
  // Enhanced features
  usePerplexityAPI: z.boolean().default(false),
  includeRealTimeContext: z.boolean().default(true),
  includeCompanyNews: z.boolean().default(true),
  includeIndustryTrends: z.boolean().default(true),
  adaptiveQuestioning: z.boolean().default(false),
  emotionalAnalysis: z.boolean().default(false),
  voiceAnalysis: z.boolean().default(false),
  customPrompts: z.array(z.string()).optional(),
  
  // Real-time features
  enableLiveGeneration: z.boolean().default(false),
  questionPoolSize: z.number().min(5).max(50).default(10),
  difficultyProgression: z.boolean().default(false),
  personalizedFeedback: z.boolean().default(true),
});

const startSessionSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  mode: z.enum(['voice', 'video', 'text', 'hybrid']),
});

const submitAnswerSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  questionId: z.string().uuid('Invalid question ID'),
  textAnswer: z.string().optional(),
  audioUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().min(0),
});

const getNextQuestionSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  previousAnswerQuality: z.enum(['poor', 'average', 'excellent']).optional(),
});

// ============================================================================
// ENHANCED INTERVIEW SESSION MANAGEMENT
// ============================================================================

/**
 * Create enhanced interview session with Perplexity integration
 */
router.post('/sessions/enhanced', 
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = createEnhancedSessionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const config: EnhancedInterviewConfig = {
      ...validation.data,
      questionTypes: validation.data.questionTypes.map((type: string) => type as QuestionType)
    };
    const userId = req.user!.id;

    try {
      const session = await enhancedInterviewService.createEnhancedSession(userId, config);
      
      res.status(201).json({
        success: true,
        message: 'Enhanced interview session created successfully',
        data: {
          session,
          features: enhancedInterviewService.getInterviewModeFeatures(config.interviewMode),
        },
      });

    } catch (error: any) {
      console.error('Error creating enhanced session:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create interview session',
      });
    }
  })
);

/**
 * Start interview session with specified mode
 */
router.post('/sessions/start',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = startSessionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { sessionId, mode } = validation.data;

    try {
      const realTimeState = await enhancedInterviewService.startInterviewSession(sessionId, mode);
      
      res.json({
        success: true,
        message: 'Interview session started successfully',
        data: {
          state: realTimeState,
          features: enhancedInterviewService.getInterviewModeFeatures(mode),
        },
      });

    } catch (error: any) {
      console.error('Error starting interview session:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to start interview session',
      });
    }
  })
);

/**
 * Get next question with adaptive difficulty
 */
router.post('/sessions/next-question',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = getNextQuestionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { sessionId, previousAnswerQuality } = validation.data;

    try {
      const nextQuestion = await enhancedInterviewService.getNextQuestion(
        sessionId, 
        previousAnswerQuality
      );
      
      const realTimeState = enhancedInterviewService.getRealTimeState(sessionId);

      if (!nextQuestion) {
        return res.json({
          success: true,
          message: 'Interview completed',
          data: {
            question: null,
            state: realTimeState,
            completed: true,
          },
        });
      }

      res.json({
        success: true,
        message: 'Next question retrieved successfully',
        data: {
          question: nextQuestion,
          state: realTimeState,
          completed: false,
        },
      });

    } catch (error: any) {
      console.error('Error getting next question:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get next question',
      });
    }
  })
);

/**
 * Submit answer and get real-time feedback
 */
router.post('/sessions/submit-answer',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = submitAnswerSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { sessionId, questionId, textAnswer, audioUrl, videoUrl, duration } = validation.data;

    try {
      const result = await enhancedInterviewService.submitAnswer(sessionId, questionId, {
        textAnswer,
        audioUrl,
        videoUrl,
        duration,
      });
      
      res.json({
        success: true,
        message: 'Answer submitted successfully',
        data: result,
      });

    } catch (error: any) {
      console.error('Error submitting answer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit answer',
      });
    }
  })
);

/**
 * Get real-time interview state
 */
router.get('/sessions/:sessionId/state',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.params.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    try {
      const state = enhancedInterviewService.getRealTimeState(sessionId);
      
      if (!state) {
        return res.status(404).json({
          success: false,
          error: 'Interview session not found or not active',
        });
      }

      res.json({
        success: true,
        message: 'Real-time state retrieved successfully',
        data: { state },
      });

    } catch (error: any) {
      console.error('Error getting real-time state:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get interview state',
      });
    }
  })
);

/**
 * Pause/Resume interview session
 */
router.post('/sessions/:sessionId/toggle-pause',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.params.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    try {
      const state = await enhancedInterviewService.togglePauseSession(sessionId);
      
      res.json({
        success: true,
        message: `Interview session ${state.isPaused ? 'paused' : 'resumed'} successfully`,
        data: { state },
      });

    } catch (error: any) {
      console.error('Error toggling pause state:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to toggle pause state',
      });
    }
  })
);

// ============================================================================
// PERPLEXITY API INTEGRATION
// ============================================================================

/**
 * Test Perplexity API connection
 */
router.get('/perplexity/test',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = await perplexityService.testConnection();
      
      res.json({
        success: result.success,
        message: result.message,
        data: {
          perplexityEnabled: result.success,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error: any) {
      console.error('Error testing Perplexity connection:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to test Perplexity connection',
      });
    }
  })
);

/**
 * Generate real-time questions using Perplexity
 */
router.post('/perplexity/generate',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      jobTitle: z.string().min(1),
      company: z.string().optional(),
      industry: z.string().min(1),
      difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
      questionTypes: z.array(z.enum(['behavioral', 'technical', 'situational', 'strengths', 'weaknesses', 'company'])),
      count: z.number().min(1).max(20).default(5),
      includeRealTimeContext: z.boolean().default(true),
      includeCompanyNews: z.boolean().default(true),
      includeIndustryTrends: z.boolean().default(true),
      customContext: z.string().optional(),
    });

    const validation = schema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    try {
      const questions = await perplexityService.generateRealTimeQuestions({
        ...validation.data,
        questionTypes: validation.data.questionTypes.map((type: string) => type as QuestionType)
      });
      
      res.json({
        success: true,
        message: 'Questions generated successfully using Perplexity API',
        data: {
          questions,
          metadata: {
            source: 'perplexity',
            realTimeContext: validation.data.includeRealTimeContext,
            generatedAt: new Date().toISOString(),
          },
        },
      });

    } catch (error: any) {
      console.error('Error generating Perplexity questions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate questions',
      });
    }
  })
);

// ============================================================================
// INTERVIEW MODE UTILITIES
// ============================================================================

/**
 * Get available interview modes and their features
 */
router.get('/modes',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const modes: InterviewMode[] = ['text', 'voice', 'video', 'hybrid'];
    
    const modeDetails = modes.map(mode => ({
      mode,
      features: enhancedInterviewService.getInterviewModeFeatures(mode),
      description: getInterviewModeDescription(mode),
    }));

    res.json({
      success: true,
      message: 'Interview modes retrieved successfully',
      data: {
        modes: modeDetails,
        recommended: 'video', // Default recommendation
      },
    });
  })
);

/**
 * Get system capabilities and configuration
 */
router.get('/capabilities',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const perplexityTest = await perplexityService.testConnection();
      
      res.json({
        success: true,
        message: 'System capabilities retrieved successfully',
        data: {
          perplexityEnabled: perplexityTest.success,
          supportedModes: ['text', 'voice', 'video', 'hybrid'],
          features: {
            realTimeGeneration: perplexityTest.success,
            adaptiveQuestioning: true,
            emotionalAnalysis: true,
            voiceAnalysis: true,
            companySpecificQuestions: perplexityTest.success,
            industryTrends: perplexityTest.success,
          },
          limits: {
            maxDuration: 120, // minutes
            maxQuestions: 50,
            maxCustomPrompts: 10,
          },
        },
      });

    } catch (error: any) {
      console.error('Error getting system capabilities:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get system capabilities',
      });
    }
  })
);

// Helper functions
function getInterviewModeDescription(mode: InterviewMode): string {
  const descriptions: Record<InterviewMode, string> = {
    text: 'Text-based interview with written questions and answers. Perfect for practicing structured responses.',
    voice: 'Voice-only interview with audio recording. Practice your verbal communication and speaking skills.',
    video: 'Full video interview with camera and microphone. Complete interview simulation with visual and emotional analysis.',
    hybrid: 'Flexible interview mode supporting text, voice, and video. Choose your preferred input method for each question.',
  };
  
  return descriptions[mode];
}

export default router;
