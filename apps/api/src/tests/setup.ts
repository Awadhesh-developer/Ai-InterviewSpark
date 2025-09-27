// --- START api/tests/setup.ts --- //
// Test setup for AI-InterviewSpark API tests

import { beforeAll, afterAll, vi } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_interviewspark';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-64-characters-long';
process.env.JWT_EXPIRES_IN = '1h';

// Mock external services
vi.mock('../services/emailService', () => ({
  EmailService: {
    initialize: vi.fn(),
    sendEmail: vi.fn().mockResolvedValue(true),
    sendWelcomeEmail: vi.fn().mockResolvedValue(true),
    sendInterviewReminder: vi.fn().mockResolvedValue(true),
    sendFeedbackReady: vi.fn().mockResolvedValue(true),
    sendPasswordReset: vi.fn().mockResolvedValue(true),
    isAvailable: vi.fn().mockReturnValue(true),
  },
}));

vi.mock('../services/notificationService', () => ({
  NotificationService: {
    initialize: vi.fn(),
    createNotification: vi.fn().mockResolvedValue('notification-id'),
    sendNotification: vi.fn().mockResolvedValue(undefined),
    sendPushNotification: vi.fn().mockResolvedValue(true),
    sendSMS: vi.fn().mockResolvedValue(true),
    getUserNotifications: vi.fn().mockResolvedValue([]),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAllAsRead: vi.fn().mockResolvedValue(undefined),
    getUnreadCount: vi.fn().mockResolvedValue(0),
    deleteNotification: vi.fn().mockResolvedValue(undefined),
    getAvailableServices: vi.fn().mockReturnValue({
      email: true,
      push: true,
      sms: true,
    }),
  },
}));

// Mock AI services
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                questions: [],
                feedback: 'Good answer',
                score: 85,
              }),
            },
          }],
        }),
      },
    },
  })),
}));

// Mock AWS SDK
vi.mock('aws-sdk', () => ({
  default: {
    S3: vi.fn().mockImplementation(() => ({
      upload: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({
          Location: 'https://s3.amazonaws.com/test-bucket/test-file.pdf',
          Key: 'test-file.pdf',
        }),
      }),
      getSignedUrl: vi.fn().mockReturnValue('https://s3.amazonaws.com/presigned-url'),
      deleteObject: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({}),
      }),
      headObject: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({
          ContentLength: 1024,
          ContentType: 'application/pdf',
        }),
      }),
      listObjectsV2: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({
          Contents: [],
        }),
      }),
      headBucket: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({}),
      }),
    })),
  },
}));

// Mock Socket.IO
vi.mock('socket.io', () => ({
  Server: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    to: vi.fn().mockReturnValue({
      emit: vi.fn(),
    }),
    use: vi.fn(),
  })),
}));

// Mock database connection
vi.mock('../database/connection', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      users: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      interviewSessions: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      questions: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      answers: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      feedback: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      notifications: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  },
  initializeDatabase: vi.fn().mockResolvedValue(undefined),
  closeDatabaseConnection: vi.fn().mockResolvedValue(undefined),
}));

beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  
  // Initialize any global test setup here
  // For example, you might want to set up a test database
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean up any global test resources here
  vi.clearAllMocks();
});
