// --- START api/routes/resumes.ts --- //
// Resumes routes for AI-InterviewSpark API
// Handles resume upload, parsing, and ATS optimization

import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../types';
import { db } from '../database/connection';
import { resumes } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import multer from 'multer';
import { AIService } from '../services/aiService';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  },
});

// ============================================================================
// RESUME UPLOAD & MANAGEMENT
// ============================================================================

// Upload resume
router.post('/upload', 
  authenticateToken,
  upload.single('resume'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Resume file is required'
        });
      }

      const userId = req.user!.id;
      const fileName = req.file.originalname;
      const fileSize = req.file.size;

      // TODO: Upload to cloud storage (AWS S3, etc.)
      const fileUrl = `https://example.com/resumes/${userId}/${fileName}`;

      // Parse resume content using AI
      const resumeText = req.file.buffer.toString('utf-8'); // Simplified - would need proper PDF/DOC parsing
      const parsedData = await AIService.analyzeResume({
        resumeText,
        targetRole: req.body.targetRole
      });

      // Create resume record
      const resume = await db.insert(resumes).values({
        userId,
        fileName,
        fileUrl,
        fileSize,
        parsedData: {
          skills: parsedData.keywords || [],
          experience: [], // Would be extracted from AI analysis
          education: [], // Would be extracted from AI analysis
        },
        atsScore: parsedData.atsScore !== undefined ? String(parsedData.atsScore) : undefined,
        keywords: Array.isArray(parsedData.keywords) ? parsedData.keywords : [],
      }).returning();

      res.status(201).json({
        success: true,
        data: resume[0],
        message: 'Resume uploaded and analyzed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's resumes
router.get('/', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      
      const userResumes = await db.query.resumes.findMany({
        where: eq(resumes.userId, userId),
        orderBy: desc(resumes.uploadDate)
      });

      res.json({
        success: true,
        data: userResumes
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get specific resume
router.get('/:resumeId', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const { resumeId } = req.params;
      const userId = req.user!.id;

      const resume = await db.query.resumes.findFirst({
        where: and(
          eq(resumes.id, resumeId),
          eq(resumes.userId, userId)
        )
      });

      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }

      res.json({
        success: true,
        data: resume
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete resume
router.delete('/:resumeId', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const { resumeId } = req.params;
      const userId = req.user!.id;

      const deletedResume = await db.delete(resumes)
        .where(and(
          eq(resumes.id, resumeId),
          eq(resumes.userId, userId)
        ))
        .returning();

      if (deletedResume.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }

      res.json({
        success: true,
        message: 'Resume deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// RESUME ANALYSIS & OPTIMIZATION
// ============================================================================

// Analyze resume for specific job
const analyzeResumeForJobSchema = z.object({
  jobTitle: z.string().min(1),
  jobDescription: z.string().min(1),
  company: z.string().optional(),
});

router.post('/:resumeId/analyze', 
  authenticateToken,
  validateRequest(analyzeResumeForJobSchema),
  async (req, res, next) => {
    try {
      const { resumeId } = req.params;
      const userId = req.user!.id;
      const { jobTitle, jobDescription, company } = req.body;

      // Get resume
      const resume = await db.query.resumes.findFirst({
        where: and(
          eq(resumes.id, resumeId),
          eq(resumes.userId, userId)
        )
      });

      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }

      // Analyze resume for the specific job
      const analysis = await AIService.analyzeResume({
        resumeText: resume.parsedData?.skills?.join(', ') || '',
        jobDescription,
        targetRole: jobTitle
      });

      res.json({
        success: true,
        data: {
          ...analysis,
          resumeId: resume.id,
          jobTitle,
          company
        },
        message: 'Resume analyzed for job successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get resume optimization suggestions
router.get('/:resumeId/suggestions', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const { resumeId } = req.params;
      const userId = req.user!.id;

      const resume = await db.query.resumes.findFirst({
        where: and(
          eq(resumes.id, resumeId),
          eq(resumes.userId, userId)
        )
      });

      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }

      // Generate optimization suggestions
      const suggestions = {
        atsScore: resume.atsScore || 0,
        keywords: resume.keywords || [],
        suggestions: resume.parsedData?.skills ? [
          'Add more specific technical skills',
          'Include quantifiable achievements',
          'Optimize for ATS keywords',
          'Improve formatting and structure'
        ] : [],
        strengths: resume.parsedData?.skills?.slice(0, 3) || [],
        areasForImprovement: [
          'Add more relevant keywords',
          'Include specific metrics',
          'Improve action verbs'
        ]
      };

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// RESUME TEMPLATES
// ============================================================================

// Get resume templates
router.get('/templates', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const templates = [
        {
          id: 'modern',
          name: 'Modern Professional',
          description: 'Clean and contemporary design',
          category: 'professional'
        },
        {
          id: 'creative',
          name: 'Creative Portfolio',
          description: 'Stand out with creative elements',
          category: 'creative'
        },
        {
          id: 'minimal',
          name: 'Minimalist',
          description: 'Simple and focused design',
          category: 'minimal'
        },
        {
          id: 'ats-friendly',
          name: 'ATS Optimized',
          description: 'Designed for applicant tracking systems',
          category: 'professional'
        }
      ];

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router; 