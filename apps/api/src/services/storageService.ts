// --- START api/services/storageService.ts --- //
// File storage service for AI-InterviewSpark API
// Handles AWS S3 integration for resume uploads, video/audio storage, and file management

import AWS from 'aws-sdk';
import { config } from '../config';
import { createError } from '../types';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import crypto from 'crypto';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: config.storage.aws.accessKeyId,
  secretAccessKey: config.storage.aws.secretAccessKey,
  region: config.storage.aws.region,
});

// File type configurations
const ALLOWED_FILE_TYPES = {
  resume: {
    extensions: ['.pdf', '.doc', '.docx'],
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  audio: {
    extensions: ['.mp3', '.wav', '.m4a', '.ogg'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg'],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  video: {
    extensions: ['.mp4', '.webm', '.mov'],
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
};

// File upload interface
interface FileUpload {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

// Upload result interface
interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  key: string;
}

export class StorageService {
  // Validate file type and size
  static validateFile(file: FileUpload, fileType: keyof typeof ALLOWED_FILE_TYPES): void {
    const config = ALLOWED_FILE_TYPES[fileType];
    
    // Check file size
    if (file.size > config.maxSize) {
      throw createError(`File size exceeds maximum allowed size of ${config.maxSize / (1024 * 1024)}MB`, 400);
    }

    // Check MIME type
    if (!config.mimeTypes.includes(file.mimeType)) {
      throw createError(`Invalid file type. Allowed types: ${config.mimeTypes.join(', ')}`, 400);
    }

    // Check file extension
    const fileExtension = path.extname(file.originalName).toLowerCase();
    if (!config.extensions.includes(fileExtension)) {
      throw createError(`Invalid file extension. Allowed extensions: ${config.extensions.join(', ')}`, 400);
    }
  }

  // Generate secure file key
  static generateFileKey(userId: string, fileType: string, originalName: string): string {
    const timestamp = Date.now();
    const randomId = uuidv4();
    const fileExtension = path.extname(originalName);
    const sanitizedName = path.basename(originalName, fileExtension).replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${fileType}/${userId}/${timestamp}_${randomId}_${sanitizedName}${fileExtension}`;
  }

  // Upload file to S3
  static async uploadFile(
    file: FileUpload,
    userId: string,
    fileType: keyof typeof ALLOWED_FILE_TYPES
  ): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(file, fileType);

      // Generate secure file key
      const key = this.generateFileKey(userId, fileType, file.originalName);

      // Upload parameters
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: config.storage.aws.s3Bucket!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimeType,
        ContentLength: file.size,
        ServerSideEncryption: 'AES256',
        Metadata: {
          userId,
          fileType,
          originalName: file.originalName,
          uploadedAt: new Date().toISOString(),
        },
      };

      // Upload to S3
      const result = await s3.upload(uploadParams).promise();

      return {
        fileUrl: result.Location,
        fileName: file.originalName,
        fileSize: file.size,
        key: result.Key,
      };
    } catch (error) {
      console.error('File upload error:', error);
      if (error instanceof Error && (error as any).code) {
        throw error;
      }
      throw createError('Failed to upload file', 500);
    }
  }

  // Generate presigned URL for direct upload
  static async generatePresignedUploadUrl(
    userId: string,
    fileName: string,
    fileType: keyof typeof ALLOWED_FILE_TYPES,
    expiresIn: number = 3600 // 1 hour
  ): Promise<{ uploadUrl: string; key: string }> {
    try {
      const key = this.generateFileKey(userId, fileType, fileName);
      
      const uploadUrl = s3.getSignedUrl('putObject', {
        Bucket: config.storage.aws.s3Bucket!,
        Key: key,
        Expires: expiresIn,
        ContentType: ALLOWED_FILE_TYPES[fileType].mimeTypes[0],
        ServerSideEncryption: 'AES256',
      });

      return { uploadUrl, key };
    } catch (error) {
      console.error('Presigned URL generation error:', error);
      throw createError('Failed to generate upload URL', 500);
    }
  }

  // Generate presigned URL for download
  static async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600 // 1 hour
  ): Promise<string> {
    try {
      return s3.getSignedUrl('getObject', {
        Bucket: config.storage.aws.s3Bucket!,
        Key: key,
        Expires: expiresIn,
      });
    } catch (error) {
      console.error('Presigned download URL generation error:', error);
      throw createError('Failed to generate download URL', 500);
    }
  }

  // Delete file from S3
  static async deleteFile(key: string): Promise<void> {
    try {
      await s3.deleteObject({
        Bucket: config.storage.aws.s3Bucket!,
        Key: key,
      }).promise();
    } catch (error) {
      console.error('File deletion error:', error);
      throw createError('Failed to delete file', 500);
    }
  }

  // Get file metadata
  static async getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      return await s3.headObject({
        Bucket: config.storage.aws.s3Bucket!,
        Key: key,
      }).promise();
    } catch (error) {
      console.error('File metadata retrieval error:', error);
      throw createError('Failed to retrieve file metadata', 500);
    }
  }

  // List user files
  static async listUserFiles(userId: string, fileType?: string): Promise<AWS.S3.Object[]> {
    try {
      const prefix = fileType ? `${fileType}/${userId}/` : `${userId}/`;
      
      const result = await s3.listObjectsV2({
        Bucket: config.storage.aws.s3Bucket!,
        Prefix: prefix,
      }).promise();

      return result.Contents || [];
    } catch (error) {
      console.error('File listing error:', error);
      throw createError('Failed to list files', 500);
    }
  }

  // Check if S3 is configured and accessible
  static async checkS3Connection(): Promise<boolean> {
    try {
      if (!config.storage.aws.enabled) {
        return false;
      }

      await s3.headBucket({
        Bucket: config.storage.aws.s3Bucket!,
      }).promise();

      return true;
    } catch (error) {
      console.error('S3 connection check failed:', error);
      return false;
    }
  }

  // Cleanup old files (for maintenance)
  static async cleanupOldFiles(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await s3.listObjectsV2({
        Bucket: config.storage.aws.s3Bucket!,
      }).promise();

      const filesToDelete = (result.Contents || []).filter(
        obj => obj.LastModified && obj.LastModified < cutoffDate
      );

      if (filesToDelete.length === 0) {
        return 0;
      }

      await s3.deleteObjects({
        Bucket: config.storage.aws.s3Bucket!,
        Delete: {
          Objects: filesToDelete.map(obj => ({ Key: obj.Key! })),
        },
      }).promise();

      return filesToDelete.length;
    } catch (error) {
      console.error('File cleanup error:', error);
      throw createError('Failed to cleanup old files', 500);
    }
  }
}

export default StorageService;
