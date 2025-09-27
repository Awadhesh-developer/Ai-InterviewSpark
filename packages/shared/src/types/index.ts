// --- START shared/types/index.ts --- //
// Core type definitions for AI-InterviewSpark application
// Defines interfaces for users, interviews, feedback, and emotional analysis

import { z } from 'zod';

// User-related types
export const UserRoleSchema = z.enum(['job_seeker', 'expert', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: UserRoleSchema,
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().default('en'),
  accessibility: z.object({
    highContrast: z.boolean().default(false),
    screenReader: z.boolean().default(false),
    captions: z.boolean().default(true),
  }).default({highContrast: false,
    screenReader: false,
    captions: false}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Interview-related types
export const InterviewTypeSchema = z.enum(['video', 'audio', 'text', 'peer', 'expert']);
export type InterviewType = z.infer<typeof InterviewTypeSchema>;

export const InterviewStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']);
export type InterviewStatus = z.infer<typeof InterviewStatusSchema>;

export const InterviewSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: InterviewTypeSchema,
  status: InterviewStatusSchema,
  title: z.string(),
  description: z.string().optional(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  duration: z.number().min(5).max(120), // minutes
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  topics: z.array(z.string()),
  scheduledAt: z.date().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InterviewSession = z.infer<typeof InterviewSessionSchema>;

// Question and Answer types
export const QuestionTypeSchema = z.enum(['behavioral', 'technical', 'situational', 'strengths', 'weaknesses']);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  type: QuestionTypeSchema,
  text: z.string(),
  category: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  expectedKeywords: z.array(z.string()).optional(),
  timeLimit: z.number().optional(), // seconds
  order: z.number(),
  createdAt: z.date(),
});

export type Question = z.infer<typeof QuestionSchema>;

export const AnswerSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  sessionId: z.string(),
  userId: z.string(),
  text: z.string().optional(), // For text-based answers
  audioUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().optional(), // seconds
  createdAt: z.date(),
});

export type Answer = z.infer<typeof AnswerSchema>;

// Emotional Analysis types
export const EmotionTypeSchema = z.enum([
  'confidence', 'nervousness', 'enthusiasm', 'confusion', 
  'engagement', 'frustration', 'calmness', 'excitement'
]);
export type EmotionType = z.infer<typeof EmotionTypeSchema>;

export const EmotionDataSchema = z.object({
  emotion: EmotionTypeSchema,
  confidence: z.number().min(0).max(1),
  timestamp: z.number(), // milliseconds from session start
  source: z.enum(['voice', 'facial', 'combined']),
});

export type EmotionData = z.infer<typeof EmotionDataSchema>;

// Feedback types
export const FeedbackCategorySchema = z.enum([
  'content', 'delivery', 'confidence', 'clarity', 'relevance', 'emotional_state'
]);
export type FeedbackCategory = z.infer<typeof FeedbackCategorySchema>;

export const FeedbackSchema = z.object({
  id: z.string(),
  answerId: z.string(),
  sessionId: z.string(),
  userId: z.string(),
  category: FeedbackCategorySchema,
  score: z.number().min(0).max(10),
  feedback: z.string(),
  suggestions: z.array(z.string()),
  emotionalAnalysis: z.array(EmotionDataSchema).optional(),
  createdAt: z.date(),
});

export type Feedback = z.infer<typeof FeedbackSchema>;

// Resume and ATS types
export const ResumeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fileName: z.string(),
  fileUrl: z.string().url(),
  fileSize: z.number(),
  uploadDate: z.date(),
  parsedData: z.object({
    skills: z.array(z.string()),
    experience: z.array(z.object({
      title: z.string(),
      company: z.string(),
      duration: z.string(),
      description: z.string(),
    })),
    education: z.array(z.object({
      degree: z.string(),
      institution: z.string(),
      year: z.number(),
    })),
  }).optional(),
  atsScore: z.number().min(0).max(100).optional(),
  keywords: z.array(z.string()).optional(),
});

export type Resume = z.infer<typeof ResumeSchema>;

// Peer and Expert types
export const ExpertProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  specialties: z.array(z.string()),
  experience: z.number().min(0), // years
  hourlyRate: z.number().min(0),
  availability: z.array(z.object({
    day: z.number().min(0).max(6), // 0 = Sunday
    startTime: z.string(), // HH:MM format
    endTime: z.string(), // HH:MM format
  })),
  rating: z.number().min(0).max(5).optional(),
  totalSessions: z.number().min(0).default(0),
  isVerified: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ExpertProfile = z.infer<typeof ExpertProfileSchema>;

// Analytics types
export const PerformanceMetricsSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  overallScore: z.number().min(0).max(100),
  categoryScores: z.record(FeedbackCategorySchema, z.number().min(0).max(10)),
  emotionalTrends: z.array(z.object({
    emotion: EmotionTypeSchema,
    averageConfidence: z.number().min(0).max(1),
    frequency: z.number().min(0),
  })),
  improvementAreas: z.array(z.string()),
  strengths: z.array(z.string()),
  sessionDuration: z.number(), // minutes
  questionsAnswered: z.number().min(0),
  createdAt: z.date(),
});

export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;

// API Response types
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// WebSocket message types
export const WebSocketMessageSchema = z.object({
  type: z.enum(['emotion_update', 'feedback_update', 'session_status', 'error']),
  sessionId: z.string(),
  data: z.any(),
  timestamp: z.number(),
});

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

// Export all schemas for validation
export const schemas = {
  UserRole: UserRoleSchema,
  UserProfile: UserProfileSchema,
  InterviewType: InterviewTypeSchema,
  InterviewStatus: InterviewStatusSchema,
  InterviewSession: InterviewSessionSchema,
  QuestionType: QuestionTypeSchema,
  Question: QuestionSchema,
  Answer: AnswerSchema,
  EmotionType: EmotionTypeSchema,
  EmotionData: EmotionDataSchema,
  FeedbackCategory: FeedbackCategorySchema,
  Feedback: FeedbackSchema,
  Resume: ResumeSchema,
  ExpertProfile: ExpertProfileSchema,
  PerformanceMetrics: PerformanceMetricsSchema,
  WebSocketMessage: WebSocketMessageSchema,
};