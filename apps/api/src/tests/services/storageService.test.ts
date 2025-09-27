// --- START api/tests/services/storageService.test.ts --- //
// Tests for storage service functionality

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from '../../services/storageService';
import AWS from 'aws-sdk';

// Mock AWS SDK
vi.mock('aws-sdk', () => ({
  default: {
    S3: vi.fn(() => ({
      upload: vi.fn(),
      getSignedUrl: vi.fn(),
      deleteObject: vi.fn(),
      headObject: vi.fn(),
      listObjectsV2: vi.fn(),
      headBucket: vi.fn(),
      deleteObjects: vi.fn()
    }))
  }
}));

// Mock config
vi.mock('../../config', () => ({
  config: {
    storage: {
      aws: {
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'us-east-1',
        s3Bucket: 'test-bucket',
        enabled: true,
      },
    },
  },
}));

describe('StorageService', () => {
  let mockS3: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get the mock S3 instance
    mockS3 = new (AWS as any).S3();

    // Setup default mock implementations with proper promise chains
    mockS3.upload.mockReturnValue({
      promise: vi.fn().mockResolvedValue({
        Location: 'https://test-bucket.s3.amazonaws.com/test-file.pdf',
        ETag: '"test-etag"',
        Bucket: 'test-bucket',
        Key: 'test-file.pdf'
      })
    });

    mockS3.getSignedUrl.mockReturnValue('https://signed-url.com');

    mockS3.deleteObject.mockReturnValue({
      promise: vi.fn().mockResolvedValue({})
    });

    mockS3.headObject.mockReturnValue({
      promise: vi.fn().mockResolvedValue({
        ContentLength: 1024,
        LastModified: new Date(),
        ContentType: 'application/pdf'
      })
    });

    mockS3.listObjectsV2.mockReturnValue({
      promise: vi.fn().mockResolvedValue({
        Contents: [
          {
            Key: 'resume/user-123/file1.pdf',
            LastModified: new Date(),
            Size: 1024
          }
        ]
      })
    });

    mockS3.headBucket.mockReturnValue({
      promise: vi.fn().mockResolvedValue({})
    });

    mockS3.deleteObjects.mockReturnValue({
      promise: vi.fn().mockResolvedValue({})
    });
  });

  describe('validateFile', () => {
    it('should validate file type and size for resume', () => {
      const validFile = {
        buffer: Buffer.from('test'),
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        size: 1024 * 1024, // 1MB
      };

      expect(() => StorageService.validateFile(validFile, 'resume')).not.toThrow();
    });

    it('should throw error for invalid file type', () => {
      const invalidFile = {
        buffer: Buffer.from('test'),
        originalName: 'resume.txt',
        mimeType: 'text/plain',
        size: 1024,
      };

      expect(() => StorageService.validateFile(invalidFile, 'resume')).toThrow('Invalid file type');
    });

    it('should throw error for file size too large', () => {
      const largeFile = {
        buffer: Buffer.from('test'),
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        size: 20 * 1024 * 1024, // 20MB (exceeds 10MB limit for resume)
      };

      expect(() => StorageService.validateFile(largeFile, 'resume')).toThrow('File size exceeds maximum');
    });

    it('should throw error for invalid file extension', () => {
      const invalidExtensionFile = {
        buffer: Buffer.from('test'),
        originalName: 'resume.exe',
        mimeType: 'application/pdf', // MIME type is correct but extension is wrong
        size: 1024,
      };

      expect(() => StorageService.validateFile(invalidExtensionFile, 'resume')).toThrow('Invalid file extension');
    });
  });

  describe('generateFileKey', () => {
    it('should generate secure file key', () => {
      const userId = 'user-123';
      const fileType = 'resume';
      const originalName = 'my resume.pdf';

      const key = StorageService.generateFileKey(userId, fileType, originalName);

      expect(key).toMatch(/^resume\/user-123\/\d+_[a-f0-9-]+_my_resume\.pdf$/);
    });

    it('should sanitize file names', () => {
      const userId = 'user-123';
      const fileType = 'resume';
      const originalName = 'my@resume#with$special%chars.pdf';

      const key = StorageService.generateFileKey(userId, fileType, originalName);

      expect(key).toMatch(/^resume\/user-123\/\d+_[a-f0-9-]+_my_resume_with_special_chars\.pdf$/);
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const file = {
        buffer: Buffer.from('test content'),
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        size: 1024,
      };
      const userId = 'user-123';
      const fileType = 'resume';

      const mockUploadResult = {
        Location: 'https://s3.amazonaws.com/test-bucket/resume/user-123/file.pdf',
        Key: 'resume/user-123/file.pdf',
      };

      mockS3.upload.mockReturnValue({
        promise: vi.fn().mockResolvedValue(mockUploadResult)
      });

      const result = await StorageService.uploadFile(file, userId, fileType);

      expect(mockS3.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Body: file.buffer,
          ContentType: file.mimeType,
          ContentLength: file.size,
          ServerSideEncryption: 'AES256',
        })
      );

      expect(result).toEqual({
        fileUrl: mockUploadResult.Location,
        fileName: file.originalName,
        fileSize: file.size,
        key: mockUploadResult.Key,
      });
    });

    it('should throw error for invalid file', async () => {
      const invalidFile = {
        buffer: Buffer.from('test'),
        originalName: 'resume.txt',
        mimeType: 'text/plain',
        size: 1024,
      };
      const userId = 'user-123';
      const fileType = 'resume';

      await expect(StorageService.uploadFile(invalidFile, userId, fileType)).rejects.toThrow('Invalid file type');
    });

    it('should handle S3 upload errors', async () => {
      const file = {
        buffer: Buffer.from('test content'),
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        size: 1024,
      };
      const userId = 'user-123';
      const fileType = 'resume';

      mockS3.upload.mockReturnValue({
        promise: vi.fn().mockRejectedValue(new Error('S3 upload failed'))
      });

      await expect(StorageService.uploadFile(file, userId, fileType)).rejects.toThrow('Failed to upload file');
    });
  });

  describe('generatePresignedUploadUrl', () => {
    it('should generate presigned upload URL', async () => {
      const userId = 'user-123';
      const fileName = 'resume.pdf';
      const fileType = 'resume';

      const mockSignedUrl = 'https://s3.amazonaws.com/presigned-upload-url';
      mockS3.getSignedUrl.mockReturnValue(mockSignedUrl);

      const result = await StorageService.generatePresignedUploadUrl(userId, fileName, fileType);

      expect(mockS3.getSignedUrl).toHaveBeenCalledWith('putObject', expect.objectContaining({
        Bucket: 'test-bucket',
        Expires: 3600,
        ServerSideEncryption: 'AES256',
      }));

      expect(result).toEqual({
        uploadUrl: mockSignedUrl,
        key: expect.stringMatching(/^resume\/user-123\/\d+_[a-f0-9-]+_resume\.pdf$/),
      });
    });
  });

  describe('generatePresignedDownloadUrl', () => {
    it('should generate presigned download URL', async () => {
      const key = 'resume/user-123/file.pdf';
      const mockSignedUrl = 'https://s3.amazonaws.com/presigned-download-url';

      mockS3.getSignedUrl.mockReturnValue(mockSignedUrl);

      const result = await StorageService.generatePresignedDownloadUrl(key);

      expect(mockS3.getSignedUrl).toHaveBeenCalledWith('getObject', {
        Bucket: 'test-bucket',
        Key: key,
        Expires: 3600,
      });

      expect(result).toBe(mockSignedUrl);
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const key = 'resume/user-123/file.pdf';

      mockS3.deleteObject.mockReturnValue({
        promise: vi.fn().mockResolvedValue({})
      });

      await StorageService.deleteFile(key);

      expect(mockS3.deleteObject).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: key,
      });
    });

    it('should handle delete errors', async () => {
      const key = 'resume/user-123/file.pdf';

      mockS3.deleteObject.mockReturnValue({
        promise: vi.fn().mockRejectedValue(new Error('Delete failed'))
      });

      await expect(StorageService.deleteFile(key)).rejects.toThrow('Failed to delete file');
    });
  });

  describe('getFileMetadata', () => {
    it('should get file metadata successfully', async () => {
      const key = 'resume/user-123/file.pdf';
      const mockMetadata = {
        ContentLength: 1024,
        ContentType: 'application/pdf',
        LastModified: new Date(),
        ETag: '"abc123"',
        Metadata: {
          userId: 'user-123',
          fileType: 'resume',
        },
      };

      mockS3.headObject.mockReturnValue({
        promise: vi.fn().mockResolvedValue(mockMetadata)
      });

      const result = await StorageService.getFileMetadata(key);

      expect(mockS3.headObject).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: key,
      });

      expect(result).toEqual(mockMetadata);
    });
  });

  describe('listUserFiles', () => {
    it('should list user files successfully', async () => {
      const userId = 'user-123';
      const fileType = 'resume';

      const mockListResult = {
        Contents: [
          {
            Key: 'resume/user-123/file1.pdf',
            Size: 1024,
            LastModified: new Date(),
            ETag: '"abc123"',
          },
          {
            Key: 'resume/user-123/file2.pdf',
            Size: 2048,
            LastModified: new Date(),
            ETag: '"def456"',
          },
        ],
      };

      mockS3.listObjectsV2.mockReturnValue({
        promise: vi.fn().mockResolvedValue(mockListResult)
      });

      const result = await StorageService.listUserFiles(userId, fileType);

      expect(mockS3.listObjectsV2).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Prefix: 'resume/user-123/',
      });

      expect(result).toEqual(mockListResult.Contents);
    });
  });

  describe('checkS3Connection', () => {
    it('should return true for successful connection', async () => {
      mockS3.headBucket.mockReturnValue({
        promise: vi.fn().mockResolvedValue({})
      });

      const result = await StorageService.checkS3Connection();

      expect(result).toBe(true);
      expect(mockS3.headBucket).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
      });
    });

    it('should return false for failed connection', async () => {
      mockS3.headBucket.mockReturnValue({
        promise: vi.fn().mockRejectedValue(new Error('Connection failed'))
      });

      const result = await StorageService.checkS3Connection();

      expect(result).toBe(false);
    });
  });

  describe('cleanupOldFiles', () => {
    it('should cleanup old files successfully', async () => {
      const olderThanDays = 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const oldFile = new Date();
      oldFile.setDate(oldFile.getDate() - 35); // 35 days old

      const recentFile = new Date();
      recentFile.setDate(recentFile.getDate() - 10); // 10 days old

      const mockListResult = {
        Contents: [
          {
            Key: 'old-file.pdf',
            LastModified: oldFile,
          },
          {
            Key: 'recent-file.pdf',
            LastModified: recentFile,
          },
        ],
      };

      mockS3.listObjectsV2.mockReturnValue({
        promise: vi.fn().mockResolvedValue(mockListResult)
      });
      mockS3.deleteObjects.mockReturnValue({
        promise: vi.fn().mockResolvedValue({})
      });

      const result = await StorageService.cleanupOldFiles(olderThanDays);

      expect(result).toBe(1); // Only one old file should be deleted
      expect(mockS3.deleteObjects).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Delete: {
          Objects: [{ Key: 'old-file.pdf' }],
        },
      });
    });
  });
});
