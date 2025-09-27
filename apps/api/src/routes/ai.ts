// --- START api/routes/ai.ts --- //
// AI routes for AI-InterviewSpark API
// Handles AI service endpoints for question generation, answer analysis, and emotional analysis

import { Router } from 'express';
import { z } from 'zod';
import { AIService } from '../services/aiService';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../types';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// ============================================================================
// QUESTION GENERATION
// ============================================================================

// Enhanced question generation with LLM integration and web scraping
const generateQuestionsSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  industry: z.string().min(1, 'Industry is required'),
  company: z.string().optional(),
  jobDescription: z.string().optional(),
  resumeSkills: z.array(z.string()).optional(),
  questionTypes: z.array(z.enum(['behavioral', 'technical', 'situational', 'company-specific'])),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().min(1).max(20),
  includeWebScraping: z.boolean().default(true),
  includeSampleAnswers: z.boolean().default(false),
  llmProvider: z.enum(['openai', 'gemini', 'claude', 'auto']).default('auto')
});

// Generate sample answers for questions
const generateAnswersSchema = z.object({
  questionIds: z.array(z.string()),
  jobTitle: z.string(),
  industry: z.string(),
  company: z.string().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).default('mid')
});

// Get trending interview topics
const getTrendsSchema = z.object({
  industry: z.string(),
  timeframe: z.enum(['week', 'month', 'quarter']).default('month')
});

router.post('/questions',
  authenticateToken,
  validateRequest(generateQuestionsSchema),
  async (req, res, next) => {
    try {
      const questions = await AIService.generateEnhancedQuestions(req.body);

      res.json({
        success: true,
        data: questions,
        metadata: {
          totalGenerated: questions.length,
          llmProvider: req.body.llmProvider,
          includesWebScraping: req.body.includeWebScraping,
          averageFreshnessScore: questions.reduce((sum, q) => sum + (q.freshnessScore || 0), 0) / questions.length
        },
        message: 'Enhanced questions generated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Generate sample answers for existing questions
router.post('/questions/answers',
  authenticateToken,
  validateRequest(generateAnswersSchema),
  async (req, res, next) => {
    try {
      const answers = await AIService.generateSampleAnswers(req.body);

      res.json({
        success: true,
        data: answers,
        message: 'Sample answers generated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get industry trends and insights
router.get('/trends/:industry',
  authenticateToken,
  async (req, res, next) => {
    try {
      const { industry } = req.params;
      const { timeframe = 'month' } = req.query;

      const trends = await AIService.getIndustryTrends(industry, timeframe as string);

      res.json({
        success: true,
        data: trends,
        message: 'Industry trends retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get company-specific insights
router.get('/companies/:company/insights',
  authenticateToken,
  async (req, res, next) => {
    try {
      const { company } = req.params;
      const insights = await AIService.getCompanyInsights(company);

      res.json({
        success: true,
        data: insights,
        message: 'Company insights retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// ANSWER ANALYSIS
// ============================================================================

// Analyze answer content
const analyzeAnswerSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  questionType: z.enum(['behavioral', 'technical', 'situational', 'strengths', 'weaknesses']),
  expectedKeywords: z.array(z.string()).optional(),
});

router.post('/analyze-answer', 
  authenticateToken,
  validateRequest(analyzeAnswerSchema),
  async (req, res, next) => {
    try {
      const analysis = await AIService.analyzeAnswer(req.body);
      
      res.json({
        success: true,
        data: analysis,
        message: 'Answer analyzed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// EMOTIONAL ANALYSIS
// ============================================================================

// Analyze voice emotion
router.post('/analyze-emotion/voice', 
  authenticateToken,
  upload.single('audio'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Audio file is required'
        });
      }

      const emotionData = await AIService.analyzeVoiceEmotion(req.file.buffer);
      
      res.json({
        success: true,
        data: emotionData,
        message: 'Voice emotion analyzed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Analyze facial emotion
router.post('/analyze-emotion/facial', 
  authenticateToken,
  upload.single('video'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Video file is required'
        });
      }

      const emotionData = await AIService.analyzeFacialEmotion(req.file.buffer);
      
      res.json({
        success: true,
        data: emotionData,
        message: 'Facial emotion analyzed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// RESUME ANALYSIS
// ============================================================================

// Analyze resume for ATS optimization
const analyzeResumeSchema = z.object({
  resumeText: z.string().min(1),
  jobDescription: z.string().optional(),
  targetRole: z.string().optional(),
});

router.post('/analyze-resume', 
  authenticateToken,
  validateRequest(analyzeResumeSchema),
  async (req, res, next) => {
    try {
      const analysis = await AIService.analyzeResume(req.body);
      
      res.json({
        success: true,
        data: analysis,
        message: 'Resume analyzed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router; 