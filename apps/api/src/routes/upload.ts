// --- START api/routes/upload.ts --- //
// File upload routes for AI-InterviewSpark API
// Handles resume uploads, video/audio storage, and file management

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../types';
import StorageService from '../services/storageService';
import { db } from '../database/connection';
import { users, interviewSessions, answers, resumes } from '../database/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

// ============================================================================
// FILE UPLOAD ENDPOINTS
// ============================================================================

// Upload resume
const uploadResumeSchema = z.object({
  fileName: z.string().optional(),
});

router.post('/resume',
  authenticateToken,
  upload.single('resume'),
  validateRequest(uploadResumeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Upload file to storage
      const uploadResult = await StorageService.uploadFile(
        {
          buffer: file.buffer,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
        userId,
        'resume'
      );

      // Create resume record
      await db.insert(resumes).values({
        userId,
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
      });

      res.json({
        success: true,
        data: {
          fileUrl: uploadResult.fileUrl,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
        },
        message: 'Resume uploaded successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Upload interview recording (audio/video)
const uploadRecordingSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid().optional(),
  recordingType: z.enum(['audio', 'video']),
});

router.post('/recording',
  authenticateToken,
  upload.single('recording'),
  validateRequest(uploadRecordingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const file = req.file;
      const { sessionId, questionId, recordingType } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No recording file uploaded'
        });
      }

      // Verify session belongs to user
      const session = await db.query.interviewSessions.findFirst({
        where: and(
          eq(interviewSessions.id, sessionId),
          eq(interviewSessions.userId, userId)
        ),
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Upload recording to storage
      const uploadResult = await StorageService.uploadFile(
        {
          buffer: file.buffer,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
        userId,
        recordingType === 'audio' ? 'audio' : 'video'
      );

      // Update answer with recording URL if questionId provided
      if (questionId) {
        const updateData = recordingType === 'audio' 
          ? { audioUrl: uploadResult.fileUrl }
          : { videoUrl: uploadResult.fileUrl };

        await db
          .update(answers)
          .set(updateData)
          .where(and(
            eq(answers.questionId, questionId),
            eq(answers.sessionId, sessionId),
            eq(answers.userId, userId)
          ));
      }

      res.json({
        success: true,
        data: {
          fileUrl: uploadResult.fileUrl,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          recordingType,
        },
        message: 'Recording uploaded successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Upload profile avatar
router.post('/avatar',
  authenticateToken,
  upload.single('avatar'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No avatar file uploaded'
        });
      }

      // Upload avatar to storage
      const uploadResult = await StorageService.uploadFile(
        {
          buffer: file.buffer,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
        userId,
        'image'
      );

      // Update user profile with avatar URL
      await db
        .update(users)
        .set({ avatar: uploadResult.fileUrl })
        .where(eq(users.id, userId));

      res.json({
        success: true,
        data: {
          avatarUrl: uploadResult.fileUrl,
        },
        message: 'Avatar uploaded successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// PRESIGNED URL ENDPOINTS
// ============================================================================

// Generate presigned URL for direct upload
const presignedUrlSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.enum(['resume', 'audio', 'video', 'image']),
  contentType: z.string().optional(),
});

router.post('/presigned-url',
  authenticateToken,
  validateRequest(presignedUrlSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { fileName, fileType } = req.body;

      const { uploadUrl, key } = await StorageService.generatePresignedUploadUrl(
        userId,
        fileName,
        fileType
      );

      res.json({
        success: true,
        data: {
          uploadUrl,
          key,
          expiresIn: 3600, // 1 hour
        },
        message: 'Presigned URL generated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Generate presigned URL for download
router.get('/download/:key',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      const userId = req.user!.id;

      // Verify user has access to this file
      if (!key.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const downloadUrl = await StorageService.generatePresignedDownloadUrl(key);

      res.json({
        success: true,
        data: {
          downloadUrl,
          expiresIn: 3600, // 1 hour
        },
        message: 'Download URL generated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// FILE MANAGEMENT ENDPOINTS
// ============================================================================

// List user files
router.get('/files',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { fileType } = req.query;

      const files = await StorageService.listUserFiles(
        userId,
        fileType as string
      );

      res.json({
        success: true,
        data: files.map(file => ({
          key: file.Key,
          size: file.Size,
          lastModified: file.LastModified,
          etag: file.ETag,
        })),
        message: 'Files retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete file
router.delete('/files/:key',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      const userId = req.user!.id;

      // Verify user has access to this file
      if (!key.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await StorageService.deleteFile(key);

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get file metadata
router.get('/files/:key/metadata',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      const userId = req.user!.id;

      // Verify user has access to this file
      if (!key.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const metadata = await StorageService.getFileMetadata(key);

      res.json({
        success: true,
        data: {
          contentLength: metadata.ContentLength,
          contentType: metadata.ContentType,
          lastModified: metadata.LastModified,
          etag: metadata.ETag,
          metadata: metadata.Metadata,
        },
        message: 'File metadata retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// HEALTH CHECK
// ============================================================================

// Check storage service health
router.get('/health',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isS3Available = await StorageService.checkS3Connection();

      res.json({
        success: true,
        data: {
          s3Available: isS3Available,
          timestamp: new Date().toISOString(),
        },
        message: 'Storage service health check completed'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
