// --- START api/types/index.ts --- //
// Local types and utilities for AI-InterviewSpark API
// Replaces @shared/core imports

// User types
export enum UserRole {
  JOB_SEEKER = 'job_seeker',
  EXPERT = 'expert',
  ADMIN = 'admin'
}

// Type alias for database compatibility
export type UserRoleString = 'job_seeker' | 'expert' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  language: string;
  accessibility: {
    highContrast: boolean;
    screenReader: boolean;
    captions: boolean;
  };
  notificationPreferences?: {
    email: {
      sessionReminders: boolean;
      feedbackReady: boolean;
      peerRequests: boolean;
      expertMessages: boolean;
      weeklyReports: boolean;
    };
    push: {
      sessionReminders: boolean;
      feedbackReady: boolean;
      peerRequests: boolean;
      expertMessages: boolean;
    };
    sms: {
      sessionReminders: boolean;
      urgentOnly: boolean;
    };
  };
  userSettings?: {
    theme: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisibility: string;
      showEmail: boolean;
      showPhone: boolean;
    };
    interview: {
      defaultDifficulty: string;
      defaultDuration: number;
      autoSave: boolean;
      showHints: boolean;
    };
  };
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpertProfile {
  id: string;
  userId: string;
  specialties: string[];
  experience: number;
  hourlyRate: string;
  availability: Array<{
    day: number;
    startTime: string;
    endTime: string;
  }>;
  rating?: string;
  totalSessions: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Question types
export enum QuestionType {
  BEHAVIORAL = 'behavioral',
  TECHNICAL = 'technical',
  SITUATIONAL = 'situational',
  STRENGTHS = 'strengths',
  WEAKNESSES = 'weaknesses',
  COMPANY = 'company'
}

// Database entity interfaces
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string | null;
  role: UserRole;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  language: string;
  accessibility: {
    highContrast: boolean;
    screenReader: boolean;
    captions: boolean;
  };
  phoneNumber?: string;
  status: 'active' | 'inactive' | 'suspended' | 'deleted' | 'pending';
  lastActivityAt?: Date;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  notificationPreferences?: {
    email: {
      sessionReminders: boolean;
      feedbackReady: boolean;
      peerRequests: boolean;
      expertMessages: boolean;
      weeklyReports: boolean;
    };
    push: {
      sessionReminders: boolean;
      feedbackReady: boolean;
      peerRequests: boolean;
      expertMessages: boolean;
    };
    sms: {
      sessionReminders: boolean;
      urgentOnly: boolean;
    };
  } | null;
  userSettings?: {
    theme: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisibility: string;
      showEmail: boolean;
      showPhone: boolean;
    };
    interview: {
      defaultDifficulty: string;
      defaultDuration: number;
      autoSave: boolean;
      showHints: boolean;
    };
  } | null;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewSession {
  id: string;
  userId: string;
  type: 'video' | 'audio' | 'text' | 'peer' | 'expert';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  title: string;
  description?: string;
  jobTitle?: string;
  company?: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  currentQuestionId?: string;
  sessionState?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  sessionId: string;
  type: QuestionType;
  text: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  expectedKeywords: string[];
  timeLimit: number;
  order: number;
  skillsAssessed: string[];
  contextualHints?: string[];
  followUpQuestions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Feedback {
  id: string;
  answerId: string;
  userId: string;
  sessionId: string;
  category: 'content' | 'delivery' | 'confidence' | 'clarity' | 'relevance' | 'emotional_state';
  feedback: string;
  score: string; // decimal in database
  suggestions: string[];
  emotionalAnalysis?: any;
  createdAt: Date;
}

// Emotion types
export enum EmotionType {
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  FEAR = 'fear',
  SURPRISE = 'surprise',
  DISGUST = 'disgust',
  NEUTRAL = 'neutral',
  CONFIDENT = 'confident',
  NERVOUS = 'nervous',
  EXCITED = 'excited'
}

export interface EmotionData {
  emotion: EmotionType;
  confidence: number;
  timestamp: number;
  source: 'voice' | 'facial' | 'combined';
}

// Error utilities
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  return new AppError(message, statusCode);
};

// Validation utilities
export const validateRequest = (schema: any) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors
      });
    }
  };
};

// Export all types
export * from './index'; 