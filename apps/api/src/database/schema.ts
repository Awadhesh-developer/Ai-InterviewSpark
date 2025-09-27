// --- START api/database/schema.ts --- //
// Database schema for AI-InterviewSpark using Drizzle ORM
// Defines all tables and relationships for the application

import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, decimal, serial, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password'), // Made optional for OAuth-only users
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: text('role', { enum: ['job_seeker', 'expert', 'admin'] }).notNull().default('job_seeker'),
  avatar: text('avatar'),
  bio: text('bio'),
  location: text('location'),
  timezone: text('timezone'),
  language: text('language').notNull().default('en'),
  accessibility: jsonb('accessibility').$type<{
    highContrast: boolean;
    screenReader: boolean;
    captions: boolean;
  }>().default({ highContrast: false, screenReader: false, captions: true }),
  emailVerified: boolean('email_verified').notNull().default(false),
  lastLoginAt: timestamp('last_login_at'),
  
  // Enhanced user fields
  phoneNumber: text('phone_number'),
  status: text('status', { enum: ['active', 'inactive', 'suspended', 'deleted', 'pending'] }).notNull().default('active'),
  lastActivityAt: timestamp('last_activity_at'),
  emailVerificationToken: text('email_verification_token'),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpiresAt: timestamp('password_reset_expires_at'),
  
  // User preferences and settings
  notificationPreferences: jsonb('notification_preferences').$type<{
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
  }>().default({
    email: {
      sessionReminders: true,
      feedbackReady: true,
      peerRequests: true,
      expertMessages: true,
      weeklyReports: true,
    },
    push: {
      sessionReminders: true,
      feedbackReady: true,
      peerRequests: true,
      expertMessages: true,
    },
    sms: {
      sessionReminders: false,
      urgentOnly: true,
    },
  }),
  
  userSettings: jsonb('user_settings').$type<{
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
  }>().default({
    theme: 'light',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
    },
    interview: {
      defaultDifficulty: 'intermediate',
      defaultDuration: 30,
      autoSave: true,
      showHints: true,
    },
  }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// OAuth providers table
export const oauthProviders = pgTable('oauth_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: ['google', 'facebook', 'linkedin'] }).notNull(),
  providerId: text('provider_id').notNull(), // The user's ID from the OAuth provider
  providerEmail: text('provider_email'), // Email from the OAuth provider
  accessToken: text('access_token'), // Encrypted access token
  refreshToken: text('refresh_token'), // Encrypted refresh token
  tokenExpiresAt: timestamp('token_expires_at'),
  providerData: jsonb('provider_data').$type<{
    name?: string;
    picture?: string;
    locale?: string;
    verified_email?: boolean;
    [key: string]: any;
  }>(), // Additional data from the provider
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Ensure one provider account per user per provider
  uniqueUserProvider: uniqueIndex('unique_user_provider').on(table.userId, table.provider),
  // Ensure unique provider ID per provider
  uniqueProviderAccount: uniqueIndex('unique_provider_account').on(table.provider, table.providerId),
}));

// Interview sessions table
export const interviewSessions: any = pgTable('interview_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['video', 'audio', 'text', 'peer', 'expert'] }).notNull(),
  status: text('status', { enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] }).notNull().default('scheduled'),
  title: text('title').notNull(),
  description: text('description'),
  jobTitle: text('job_title'),
  company: text('company'),
  duration: integer('duration').notNull(), // minutes
  difficulty: text('difficulty', { enum: ['beginner', 'intermediate', 'advanced'] }).notNull(),
  topics: text('topics').array().notNull().default([]),
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  // Enhanced session fields
  currentQuestionId: uuid('current_question_id'),
  sessionState: jsonb('session_state').$type<{
    currentStep: string;
    questionIndex: number;
    totalQuestions: number;
    timeRemaining: number;
    isPaused: boolean;
    pausedAt: string | null;
    resumedAt: string | null;
  }>().default({
    currentStep: 'waiting',
    questionIndex: 0,
    totalQuestions: 0,
    timeRemaining: 0,
    isPaused: false,
    pausedAt: null,
    resumedAt: null,
  }),
  realTimeData: jsonb('real_time_data').$type<{
    emotionData: Array<{
      emotion: string;
      confidence: number;
      timestamp: number;
      source: string;
    }>;
    voiceAnalysis: Array<{
      analysis: string;
      confidence: number;
      timestamp: number;
    }>;
    facialAnalysis: Array<{
      analysis: string;
      confidence: number;
      timestamp: number;
    }>;
    performanceMetrics: Record<string, any>;
    liveFeedback: Array<{
      type: string;
      message: string;
      timestamp: number;
    }>;
  }>().default({
    emotionData: [],
    voiceAnalysis: [],
    facialAnalysis: [],
    performanceMetrics: {},
    liveFeedback: [],
  }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Enhanced Questions table with metadata
export const questions: any = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => interviewSessions.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['behavioral', 'technical', 'situational', 'company-specific'] }).notNull(),
  text: text('text').notNull(),
  category: text('category').notNull(),
  difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }).notNull(),
  expectedKeywords: text('expected_keywords').array(),
  timeLimit: integer('time_limit'), // seconds
  order: integer('order').notNull(),

  // Enhanced metadata fields
  source: text('source', { enum: ['ai-generated', 'scraped', 'curated'] }).default('ai-generated'),
  freshnessScore: decimal('freshness_score', { precision: 3, scale: 2 }), // 0.00 to 1.00
  relevanceScore: decimal('relevance_score', { precision: 3, scale: 2 }), // 0.00 to 1.00
  companySpecific: boolean('company_specific').default(false),
  industryTrends: text('industry_trends').array().default([]),
  llmProvider: text('llm_provider', { enum: ['openai', 'gemini', 'claude'] }),

  // STAR framework data
  starFramework: jsonb('star_framework').$type<{
    situation: string;
    task: string;
    action: string;
    result: string;
    keyPoints: string[];
  }>(),

  // Follow-up questions and tips
  followUpQuestions: text('follow_up_questions').array().default([]),
  tips: text('tips').array().default([]),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes
  sessionIdIdx: index('idx_questions_session_id').on(table.sessionId),
  typeIdx: index('idx_questions_type').on(table.type),
  difficultyIdx: index('idx_questions_difficulty').on(table.difficulty),
  sourceIdx: index('idx_questions_source').on(table.source),
  companySpecificIdx: index('idx_questions_company_specific').on(table.companySpecific),
  llmProviderIdx: index('idx_questions_llm_provider').on(table.llmProvider),
  createdAtIdx: index('idx_questions_created_at').on(table.createdAt),
  updatedAtIdx: index('idx_questions_updated_at').on(table.updatedAt),

  // Composite indexes for common queries
  sessionTypeIdx: index('idx_questions_session_type').on(table.sessionId, table.type),
  typeDifficultyIdx: index('idx_questions_type_difficulty').on(table.type, table.difficulty),
  sessionOrderIdx: index('idx_questions_session_order').on(table.sessionId, table.order),

  // Partial indexes for performance
  freshQuestionsIdx: index('idx_questions_fresh').on(table.freshnessScore).where(sql`${table.freshnessScore} > 0.7`),
  relevantQuestionsIdx: index('idx_questions_relevant').on(table.relevanceScore).where(sql`${table.relevanceScore} > 0.7`),
}));

// Sample Answers table
export const sampleAnswers = pgTable('sample_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  answer: text('answer').notNull(),
  structure: text('structure', { enum: ['star', 'problem-solution', 'feature-benefit', 'comparison'] }).notNull(),
  keyPoints: text('key_points').array().default([]),
  estimatedDuration: integer('estimated_duration'), // seconds
  difficulty: text('difficulty', { enum: ['beginner', 'intermediate', 'advanced'] }).notNull(),
  industry: text('industry').notNull(),
  role: text('role').notNull(),
  tips: text('tips').array().default([]),
  commonMistakes: text('common_mistakes').array().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes
  questionIdIdx: index('idx_sample_answers_question_id').on(table.questionId),
  industryIdx: index('idx_sample_answers_industry').on(table.industry),
  roleIdx: index('idx_sample_answers_role').on(table.role),
  difficultyIdx: index('idx_sample_answers_difficulty').on(table.difficulty),
  structureIdx: index('idx_sample_answers_structure').on(table.structure),

  // Composite indexes
  industryRoleIdx: index('idx_sample_answers_industry_role').on(table.industry, table.role),
  difficultyStructureIdx: index('idx_sample_answers_difficulty_structure').on(table.difficulty, table.structure),
}));

// Question Trends table
export const questionTrends = pgTable('question_trends', {
  id: uuid('id').primaryKey().defaultRandom(),
  industry: text('industry').notNull(),
  topic: text('topic').notNull(),
  frequency: integer('frequency').notNull(),
  growth: decimal('growth', { precision: 5, scale: 2 }), // percentage growth
  relatedSkills: text('related_skills').array().default([]),
  timeframe: text('timeframe', { enum: ['week', 'month', 'quarter'] }).notNull(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes
  industryIdx: index('idx_question_trends_industry').on(table.industry),
  topicIdx: index('idx_question_trends_topic').on(table.topic),
  timeframeIdx: index('idx_question_trends_timeframe').on(table.timeframe),
  frequencyIdx: index('idx_question_trends_frequency').on(table.frequency),
  lastUpdatedIdx: index('idx_question_trends_last_updated').on(table.lastUpdated),

  // Composite indexes
  industryTimeframeIdx: index('idx_question_trends_industry_timeframe').on(table.industry, table.timeframe),
  topicFrequencyIdx: index('idx_question_trends_topic_frequency').on(table.topic, table.frequency),

  // Unique constraint
  industryTopicTimeframeIdx: uniqueIndex('idx_question_trends_unique').on(table.industry, table.topic, table.timeframe),
}));

// Company Insights table
export const companyInsights = pgTable('company_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyName: text('company_name').notNull(),
  culture: text('culture').array().default([]),
  values: text('values').array().default([]),
  recentNews: text('recent_news').array().default([]),
  interviewStyle: text('interview_style').notNull(),
  commonQuestions: text('common_questions').array().default([]),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes
  companyNameIdx: uniqueIndex('idx_company_insights_company_name').on(table.companyName),
  interviewStyleIdx: index('idx_company_insights_interview_style').on(table.interviewStyle),
  lastUpdatedIdx: index('idx_company_insights_last_updated').on(table.lastUpdated),
}));

// Answers table
export const answers = pgTable('answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').notNull().references(() => interviewSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  text: text('text'),
  audioUrl: text('audio_url'),
  videoUrl: text('video_url'),
  duration: integer('duration'), // seconds
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Feedback table
export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  answerId: uuid('answer_id').notNull().references(() => answers.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').notNull().references(() => interviewSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: text('category', { 
    enum: ['content', 'delivery', 'confidence', 'clarity', 'relevance', 'emotional_state'] 
  }).notNull(),
  score: decimal('score', { precision: 3, scale: 1 }).notNull(), // 0.0 to 10.0
  feedback: text('feedback').notNull(),
  suggestions: jsonb('suggestions').$type<string[]>().notNull().default([]),
  emotionalAnalysis: jsonb('emotional_analysis').$type<Array<{
    emotion: string;
    confidence: number;
    timestamp: number;
    source: string;
  }>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Resumes table
export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').notNull(),
  uploadDate: timestamp('upload_date').notNull().defaultNow(),
  parsedData: jsonb('parsed_data').$type<{
    skills: string[];
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      degree: string;
      institution: string;
      year: number;
    }>;
  }>(),
  atsScore: decimal('ats_score', { precision: 5, scale: 2 }), // 0.00 to 100.00
  keywords: jsonb('keywords').$type<string[]>(),
});

// Expert profiles table
export const expertProfiles = pgTable('expert_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  specialties: jsonb('specialties').$type<string[]>().notNull().default([]),
  experience: integer('experience').notNull(), // years
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }).notNull(),
  availability: jsonb('availability').$type<Array<{
    day: number;
    startTime: string;
    endTime: string;
  }>>().notNull().default([]),
  rating: decimal('rating', { precision: 3, scale: 2 }), // 0.00 to 5.00
  totalSessions: integer('total_sessions').notNull().default(0),
  isVerified: boolean('is_verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Performance metrics table
export const performanceMetrics = pgTable('performance_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => interviewSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  overallScore: decimal('overall_score', { precision: 5, scale: 2 }).notNull(), // 0.00 to 100.00
  categoryScores: jsonb('category_scores').$type<Record<string, number>>().notNull(),
  emotionalTrends: jsonb('emotional_trends').$type<Array<{
    emotion: string;
    averageConfidence: number;
    frequency: number;
  }>>().notNull().default([]),
  improvementAreas: jsonb('improvement_areas').$type<string[]>().notNull().default([]),
  strengths: jsonb('strengths').$type<string[]>().notNull().default([]),
  sessionDuration: integer('session_duration').notNull(), // minutes
  questionsAnswered: integer('questions_answered').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Peer sessions table (for peer-to-peer interviews)
export const peerSessions = pgTable('peer_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => interviewSessions.id, { onDelete: 'cascade' }),
  peerUserId: uuid('peer_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'accepted', 'declined', 'completed'] }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Expert sessions table (for expert coaching)
export const expertSessions = pgTable('expert_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => interviewSessions.id, { onDelete: 'cascade' }),
  expertId: uuid('expert_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['scheduled', 'confirmed', 'completed', 'cancelled'] }).notNull().default('scheduled'),
  notes: text('notes'),
  rating: integer('rating'), // 1-5 stars
  review: text('review'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { 
    enum: ['session_reminder', 'feedback_ready', 'peer_request', 'expert_confirmation', 'system'] 
  }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data').$type<Record<string, any>>(),
  isRead: boolean('is_read').notNull().default(false),
  
  // Enhanced notification fields
  priority: text('priority', { enum: ['low', 'normal', 'high', 'urgent'] }).notNull().default('normal'),
  deliveryStatus: text('delivery_status', { enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'] }).notNull().default('pending'),
  deliveryAttempts: integer('delivery_attempts').notNull().default(0),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),
  expiresAt: timestamp('expires_at'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Push notification subscriptions table
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dhKey: text('p256dh_key').notNull(),
  authKey: text('auth_key').notNull(),
  userAgent: text('user_agent'),
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at'),
  lastAccessedAt: timestamp('last_accessed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_push_subscriptions_user_id').on(table.userId),
  endpointIdx: index('idx_push_subscriptions_endpoint').on(table.endpoint),
  activeIdx: index('idx_push_subscriptions_active').on(table.isActive),
}));

// WebSocket connections table
export const websocketConnections = pgTable('websocket_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').references(() => interviewSessions.id, { onDelete: 'cascade' }),
  connectionId: text('connection_id').notNull(),
  socketId: text('socket_id').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  isActive: boolean('is_active').notNull().default(true),
  connectedAt: timestamp('connected_at').notNull().defaultNow(),
  disconnectedAt: timestamp('disconnected_at'),
  lastPingAt: timestamp('last_ping_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_websocket_connections_user_id').on(table.userId),
  sessionIdIdx: index('idx_websocket_connections_session_id').on(table.sessionId),
  activeIdx: index('idx_websocket_connections_active').on(table.isActive),
  connectionIdIdx: index('idx_websocket_connections_connection_id').on(table.connectionId),
}));

// Performance metrics data table
export const performanceMetricsData = pgTable('performance_metrics_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => interviewSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  metricType: text('metric_type').notNull(),
  metricName: text('metric_name').notNull(),
  metricValue: decimal('metric_value', { precision: 10, scale: 4 }).notNull(),
  metricUnit: text('metric_unit'),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  recordedAt: timestamp('recorded_at').notNull().defaultNow(),
}, (table) => ({
  sessionIdIdx: index('idx_performance_metrics_session_id').on(table.sessionId),
  userIdIdx: index('idx_performance_metrics_user_id').on(table.userId),
  typeIdx: index('idx_performance_metrics_type').on(table.metricType),
  recordedAtIdx: index('idx_performance_metrics_recorded_at').on(table.recordedAt),
}));

// Cache entries table
export const cacheEntries = pgTable('cache_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  cacheKey: text('cache_key').notNull().unique(),
  cacheValue: jsonb('cache_value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  hitCount: integer('hit_count').notNull().default(0),
  lastAccessedAt: timestamp('last_accessed_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  keyIdx: index('idx_cache_entries_key').on(table.cacheKey),
  expiresAtIdx: index('idx_cache_entries_expires_at').on(table.expiresAt),
  lastAccessedIdx: index('idx_cache_entries_last_accessed').on(table.lastAccessedAt),
}));

// User activities table
export const userActivities = pgTable('user_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityType: text('activity_type').notNull(),
  activityDescription: text('activity_description').notNull(),
  metadata: jsonb('metadata').$type<Record<string, any> | null>().default({}),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_activities_user_id').on(table.userId),
  typeIdx: index('idx_user_activities_type').on(table.activityType),
  createdAtIdx: index('idx_user_activities_created_at').on(table.createdAt),
}));

// System configurations table
export const systemConfigurations = pgTable('system_configurations', {
  id: uuid('id').primaryKey().defaultRandom(),
  configKey: text('config_key').notNull().unique(),
  configValue: jsonb('config_value').notNull(),
  configType: text('config_type').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  keyIdx: index('idx_system_configurations_key').on(table.configKey),
  typeIdx: index('idx_system_configurations_type').on(table.configType),
  activeIdx: index('idx_system_configurations_active').on(table.isActive),
}));

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id'),
  oldValues: jsonb('old_values').$type<Record<string, any> | null>(),
  newValues: jsonb('new_values').$type<Record<string, any> | null>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_audit_logs_user_id').on(table.userId),
  actionIdx: index('idx_audit_logs_action').on(table.action),
  resourceIdx: index('idx_audit_logs_resource').on(table.resourceType, table.resourceId),
  createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt),
}));

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  interviewSessions: many(interviewSessions),
  answers: many(answers),
  feedback: many(feedback),
  resumes: many(resumes),
  expertProfile: many(expertProfiles),
  performanceMetrics: many(performanceMetrics),
  notifications: many(notifications),
  oauthProviders: many(oauthProviders),
}));

export const oauthProvidersRelations = relations(oauthProviders, ({ one }) => ({
  user: one(users, {
    fields: [oauthProviders.userId],
    references: [users.id],
  }),
}));

export const interviewSessionsRelations = relations(interviewSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [interviewSessions.userId],
    references: [users.id],
  }),
  questions: many(questions),
  answers: many(answers),
  feedback: many(feedback),
  performanceMetrics: many(performanceMetrics),
  peerSession: many(peerSessions),
  expertSession: many(expertSessions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  session: one(interviewSessions, {
    fields: [questions.sessionId],
    references: [interviewSessions.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one, many }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  session: one(interviewSessions, {
    fields: [answers.sessionId],
    references: [interviewSessions.id],
  }),
  user: one(users, {
    fields: [answers.userId],
    references: [users.id],
  }),
  feedback: many(feedback),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  answer: one(answers, {
    fields: [feedback.answerId],
    references: [answers.id],
  }),
  session: one(interviewSessions, {
    fields: [feedback.sessionId],
    references: [interviewSessions.id],
  }),
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  session: one(interviewSessions, {
    fields: [performanceMetrics.sessionId],
    references: [interviewSessions.id],
  }),
  user: one(users, {
    fields: [performanceMetrics.userId],
    references: [users.id],
  }),
}));

// Create Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['job_seeker', 'expert', 'admin']).default('job_seeker'),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().default('en'),
  accessibility: z.object({
    highContrast: z.boolean().default(false),
    screenReader: z.boolean().default(false),
    captions: z.boolean().default(true),
  }).default({ highContrast: false, screenReader: false, captions: true }),
});

export const selectUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['job_seeker', 'expert', 'admin']),
  avatar: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  timezone: z.string().nullable(),
  language: z.string(),
  accessibility: z.object({
    highContrast: z.boolean(),
    screenReader: z.boolean(),
    captions: z.boolean(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertInterviewSessionSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['video', 'audio', 'text', 'peer', 'expert']),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
  title: z.string().min(1),
  description: z.string().optional(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  duration: z.number().positive(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  topics: z.array(z.string()).default([]),
  scheduledAt: z.date().optional(),
});

export const selectInterviewSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['video', 'audio', 'text', 'peer', 'expert']),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  title: z.string(),
  description: z.string().nullable(),
  jobTitle: z.string().nullable(),
  company: z.string().nullable(),
  duration: z.number(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  topics: z.array(z.string()),
  scheduledAt: z.date().nullable(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertQuestionSchema = z.object({
  sessionId: z.string().uuid(),
  type: z.enum(['behavioral', 'technical', 'situational', 'strengths', 'weaknesses']),
  text: z.string().min(1),
  category: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  expectedKeywords: z.array(z.string()).optional(),
  timeLimit: z.number().positive().optional(),
  order: z.number().positive(),
});

export const selectQuestionSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  type: z.enum(['behavioral', 'technical', 'situational', 'strengths', 'weaknesses']),
  text: z.string(),
  category: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  expectedKeywords: z.array(z.string()).nullable(),
  timeLimit: z.number().nullable(),
  order: z.number(),
  createdAt: z.date(),
});

export const insertAnswerSchema = z.object({
  questionId: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  text: z.string().optional(),
  audioUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().positive().optional(),
});

export const selectAnswerSchema = z.object({
  id: z.string().uuid(),
  questionId: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  text: z.string().nullable(),
  audioUrl: z.string().nullable(),
  videoUrl: z.string().nullable(),
  duration: z.number().nullable(),
  createdAt: z.date(),
});

export const insertFeedbackSchema = z.object({
  answerId: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  category: z.enum(['content', 'delivery', 'confidence', 'clarity', 'relevance', 'emotional_state']),
  score: z.number().min(0).max(10),
  feedback: z.string().min(1),
  suggestions: z.array(z.string()).default([]),
  emotionalAnalysis: z.array(z.object({
    emotion: z.string(),
    confidence: z.number(),
    timestamp: z.number(),
    source: z.string(),
  })).optional(),
});

export const selectFeedbackSchema = z.object({
  id: z.string().uuid(),
  answerId: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  category: z.enum(['content', 'delivery', 'confidence', 'clarity', 'relevance', 'emotional_state']),
  score: z.number(),
  feedback: z.string(),
  suggestions: z.array(z.string()),
  emotionalAnalysis: z.array(z.object({
    emotion: z.string(),
    confidence: z.number(),
    timestamp: z.number(),
    source: z.string(),
  })).nullable(),
  createdAt: z.date(),
});

export const insertResumeSchema = z.object({
  userId: z.string().uuid(),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileSize: z.number().positive(),
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

export const selectResumeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fileName: z.string(),
  fileUrl: z.string(),
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
  }).nullable(),
  atsScore: z.number().nullable(),
  keywords: z.array(z.string()).nullable(),
});

export const insertExpertProfileSchema = z.object({
  userId: z.string().uuid(),
  specialties: z.array(z.string()).default([]),
  experience: z.number().min(0),
  hourlyRate: z.string(),
  availability: z.array(z.object({
    day: z.number().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
  })).default([]),
  rating: z.string().optional(),
  totalSessions: z.number().default(0),
  isVerified: z.boolean().default(false),
});

export const selectExpertProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  specialties: z.array(z.string()),
  experience: z.number(),
  hourlyRate: z.string(),
  availability: z.array(z.object({
    day: z.number(),
    startTime: z.string(),
    endTime: z.string(),
  })),
  rating: z.string().nullable(),
  totalSessions: z.number(),
  isVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertPerformanceMetricsSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  overallScore: z.number().min(0).max(100),
  categoryScores: z.record(z.string(), z.number()),
  emotionalTrends: z.array(z.object({
    emotion: z.string(),
    averageConfidence: z.number(),
    frequency: z.number(),
  })).default([]),
  improvementAreas: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  sessionDuration: z.number().positive(),
  questionsAnswered: z.number().default(0),
});

export const selectPerformanceMetricsSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  overallScore: z.number(),
  categoryScores: z.record(z.string(), z.number()),
  emotionalTrends: z.array(z.object({
    emotion: z.string(),
    averageConfidence: z.number(),
    frequency: z.number(),
  })),
  improvementAreas: z.array(z.string()),
  strengths: z.array(z.string()),
  sessionDuration: z.number(),
  questionsAnswered: z.number(),
  createdAt: z.date(),
});

// Export types
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;

export type InterviewSession = z.infer<typeof selectInterviewSessionSchema>;
export type NewInterviewSession = z.infer<typeof insertInterviewSessionSchema>;

export type Question = z.infer<typeof selectQuestionSchema>;
export type NewQuestion = z.infer<typeof insertQuestionSchema>;

export type Answer = z.infer<typeof selectAnswerSchema>;
export type NewAnswer = z.infer<typeof insertAnswerSchema>;

export type Feedback = z.infer<typeof selectFeedbackSchema>;
export type NewFeedback = z.infer<typeof insertFeedbackSchema>;

// OAuth Provider schemas
export const insertOAuthProviderSchema = z.object({
  userId: z.string().uuid(),
  provider: z.enum(['google', 'facebook', 'linkedin']),
  providerId: z.string(),
  providerEmail: z.string().email().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.date().optional(),
  providerData: z.record(z.string(), z.any()).optional(),
});

export const selectOAuthProviderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  provider: z.enum(['google', 'facebook', 'linkedin']),
  providerId: z.string(),
  providerEmail: z.string().email().nullable(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  tokenExpiresAt: z.date().nullable(),
  providerData: z.record(z.string(), z.any()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OAuthProvider = z.infer<typeof selectOAuthProviderSchema>;
export type NewOAuthProvider = z.infer<typeof insertOAuthProviderSchema>;

export type Resume = z.infer<typeof selectResumeSchema>;
export type NewResume = z.infer<typeof insertResumeSchema>;

export type ExpertProfile = z.infer<typeof selectExpertProfileSchema>;
export type NewExpertProfile = z.infer<typeof insertExpertProfileSchema>;

export type PerformanceMetrics = z.infer<typeof selectPerformanceMetricsSchema>;
export type NewPerformanceMetrics = z.infer<typeof insertPerformanceMetricsSchema>; 