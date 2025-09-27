// Production-Ready Interview System Database Schema v2.0
// Optimized for enterprise scale with millisecond query performance

import { pgTable, uuid, text, integer, timestamp, jsonb, decimal, boolean, index, serial } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================================
// CORE INTERVIEW SYSTEM TABLES
// ============================================================================

// Enhanced Interview Sessions with time-series optimization
export const interviewSessions = pgTable('interview_sessions_v2', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  
  // Core session metadata
  type: text('type', { 
    enum: ['video', 'audio', 'text', 'multimodal', 'hybrid'] 
  }).notNull(),
  status: text('status', { 
    enum: ['scheduled', 'active', 'paused', 'completed', 'cancelled', 'failed'] 
  }).notNull().default('scheduled'),
  
  // Interview context (CO-STAR framework)
  interviewContext: jsonb('interview_context').$type<{
    context: string;
    objective: string;
    style: string;
    tone: string;
    audience: string;
    responseFormat: string;
  }>().notNull(),
  
  // Position and company details
  jobTitle: text('job_title').notNull(),
  company: text('company'),
  industry: text('industry').notNull(),
  jobDescription: text('job_description'),
  
  // Session configuration
  difficulty: text('difficulty', { 
    enum: ['beginner', 'intermediate', 'advanced'] 
  }).notNull(),
  duration: integer('duration').notNull(), // seconds
  questionTypes: text('question_types').array().notNull(),
  
  // Multi-modal configuration
  modalityConfig: jsonb('modality_config').$type<{
    video: { enabled: boolean; quality: string; analysis: boolean };
    audio: { enabled: boolean; quality: string; transcription: boolean };
    text: { enabled: boolean; realTime: boolean };
    analysis: {
      sentiment: boolean;
      emotion: boolean;
      voice: boolean;
      facial: boolean;
      bodyLanguage: boolean;
    };
  }>().notNull(),
  
  // Real-time state management
  sessionState: jsonb('session_state').$type<{
    currentStep: 'setup' | 'calibration' | 'interview' | 'feedback' | 'complete';
    currentQuestionIndex: number;
    totalQuestions: number;
    timeElapsed: number;
    timeRemaining: number;
    isPaused: boolean;
    pauseReason?: string;
    resumeCount: number;
    adaptiveLevel: 'easy' | 'medium' | 'hard';
  }>().notNull(),
  
  // Performance metrics
  performanceMetrics: jsonb('performance_metrics').$type<{
    overallScore: number;
    categoryScores: Record<string, number>;
    confidenceLevel: number;
    responseTime: number;
    engagementScore: number;
    technicalAccuracy: number;
    communicationClarity: number;
  }>(),
  
  // Timestamps with timezone support
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  
}, (table) => ({
  // High-performance indexes for common queries
  userStatusIdx: index('idx_sessions_user_status').on(table.userId, table.status),
  typeCreatedIdx: index('idx_sessions_type_created').on(table.type, table.createdAt),
  industryDifficultyIdx: index('idx_sessions_industry_difficulty').on(table.industry, table.difficulty),
  statusTimestampIdx: index('idx_sessions_status_timestamp').on(table.status, table.createdAt),
}))

// Enhanced Questions with metadata and versioning
export const questions: any = pgTable('questions_v2', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => interviewSessions.id, { onDelete: 'cascade' }),
  
  // Question content and metadata
  content: text('content').notNull(),
  type: text('type', { 
    enum: ['behavioral', 'technical', 'situational', 'system-design', 'coding', 'company-specific'] 
  }).notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  
  // Difficulty and complexity
  difficulty: integer('difficulty').notNull(), // 1-5 scale
  complexity: jsonb('complexity').$type<{
    technical: number;
    behavioral: number;
    analytical: number;
    communication: number;
  }>().notNull(),
  
  // Question generation metadata
  generationContext: jsonb('generation_context').$type<{
    llmProvider: 'openai' | 'claude' | 'gemini' | 'perplexity';
    model: string;
    promptVersion: string;
    generationTime: number;
    tokens: { input: number; output: number };
    cost: number;
  }>().notNull(),
  
  // Question characteristics
  estimatedDuration: integer('estimated_duration').notNull(), // seconds
  expectedKeywords: text('expected_keywords').array().default([]),
  skillsAssessed: text('skills_assessed').array().notNull(),
  
  // Quality metrics
  qualityScore: decimal('quality_score', { precision: 3, scale: 2 }),
  relevanceScore: decimal('relevance_score', { precision: 3, scale: 2 }),
  freshnessScore: decimal('freshness_score', { precision: 3, scale: 2 }),
  
  // Question ordering and flow
  order: integer('order').notNull(),
  isFollowUp: boolean('is_follow_up').default(false),
  parentQuestionId: uuid('parent_question_id').references(() => questions.id, { onDelete: 'cascade' }),
  
  // Enhancement data
  tips: text('tips').array().default([]),
  followUpQuestions: text('follow_up_questions').array().default([]),
  starFramework: jsonb('star_framework').$type<{
    situation: string;
    task: string;
    action: string;
    result: string;
    keyPoints: string[];
  }>(),
  
  // Versioning and lifecycle
  version: integer('version').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  
}, (table) => ({
  sessionOrderIdx: index('idx_questions_session_order').on(table.sessionId, table.order),
  typeSkillsIdx: index('idx_questions_type_skills').on(table.type, table.skillsAssessed),
  difficultyActiveIdx: index('idx_questions_difficulty_active').on(table.difficulty, table.isActive),
  qualityScoreIdx: index('idx_questions_quality_score').on(table.qualityScore),
}))

// Multi-modal Answers with comprehensive analysis
export const answers = pgTable('answers_v2', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').notNull().references(() => interviewSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  
  // Multi-modal content
  textContent: text('text_content'),
  audioUrl: text('audio_url'),
  videoUrl: text('video_url'),
  
  // Media metadata
  mediaMetadata: jsonb('media_metadata').$type<{
    audio?: {
      duration: number;
      quality: string;
      fileSize: number;
      transcriptionConfidence: number;
    };
    video?: {
      duration: number;
      resolution: string;
      fileSize: number;
      frameRate: number;
    };
  }>(),
  
  // Response timing and behavior
  responseMetrics: jsonb('response_metrics').$type<{
    thinkingTime: number; // Time before starting to speak/type
    responseTime: number; // Total response duration
    pauseCount: number;
    avgPauseLength: number;
    speechRate: number; // words per minute
    fillerWordCount: number;
  }>().notNull(),
  
  // Multi-modal analysis results
  analysisResults: jsonb('analysis_results').$type<{
    transcription?: {
      text: string;
      confidence: number;
      words: Array<{ word: string; confidence: number; start: number; end: number }>;
    };
    sentiment: {
      overall: 'positive' | 'neutral' | 'negative';
      confidence: number;
      emotions: Record<string, number>;
    };
    voiceAnalysis?: {
      tone: string;
      energy: number;
      confidence: number;
      clarity: number;
    };
    facialAnalysis?: {
      emotions: Record<string, number>;
      eyeContact: number;
      engagement: number;
      expressions: Array<{ emotion: string; intensity: number; timestamp: number }>;
    };
    bodyLanguage?: {
      posture: string;
      gestures: number;
      movement: number;
      engagement: number;
    };
  }>(),
  
  // Content analysis
  contentAnalysis: jsonb('content_analysis').$type<{
    keywordMatches: string[];
    skillsDemonstrated: string[];
    technicalAccuracy: number;
    completeness: number;
    structure: number;
    clarity: number;
    relevance: number;
  }>(),
  
  // Scoring and feedback
  scores: jsonb('scores').$type<{
    overall: number;
    technical: number;
    communication: number;
    structure: number;
    relevance: number;
    confidence: number;
  }>().notNull(),
  
  // Answer state
  status: text('status', { 
    enum: ['draft', 'submitted', 'analyzing', 'analyzed', 'reviewed'] 
  }).notNull().default('draft'),
  
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  analyzedAt: timestamp('analyzed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  
}, (table) => ({
  sessionQuestionIdx: index('idx_answers_session_question').on(table.sessionId, table.questionId),
  userStatusIdx: index('idx_answers_user_status').on(table.userId, table.status),
  submittedAtIdx: index('idx_answers_submitted_at').on(table.submittedAt),
  overallScoreIdx: index('idx_answers_overall_score').on(table.scores),
}))

// Ideal Answers for comparison and feedback
export const idealAnswers = pgTable('ideal_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  
  // Ideal answer content
  content: text('content').notNull(),
  keyPoints: text('key_points').array().notNull(),
  
  // Scoring criteria
  scoringCriteria: jsonb('scoring_criteria').$type<{
    technical: { weight: number; description: string; examples: string[] };
    communication: { weight: number; description: string; examples: string[] };
    structure: { weight: number; description: string; examples: string[] };
    relevance: { weight: number; description: string; examples: string[] };
  }>().notNull(),
  
  // Generation metadata
  generatedBy: text('generated_by', { 
    enum: ['llm', 'expert', 'hybrid'] 
  }).notNull(),
  generationMetadata: jsonb('generation_metadata').$type<{
    llmProvider?: string;
    expertId?: string;
    reviewedBy?: string[];
    qualityScore: number;
  }>(),
  
  // Improvement suggestions
  improvementAreas: text('improvement_areas').array().default([]),
  commonMistakes: text('common_mistakes').array().default([]),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  
}, (table) => ({
  questionIdx: index('idx_ideal_answers_question').on(table.questionId),
  generatedByIdx: index('idx_ideal_answers_generated_by').on(table.generatedBy),
}))

// Real-time Session Analytics
export const sessionAnalytics = pgTable('session_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => interviewSessions.id, { onDelete: 'cascade' }),
  
  // Time-series metrics (stored every 30 seconds during interview)
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  metrics: jsonb('metrics').$type<{
    engagement: number;
    confidence: number;
    speechRate: number;
    eyeContact: number;
    facialSentiment: number;
    voiceEnergy: number;
    responseQuality: number;
  }>().notNull(),
  
  // Cumulative statistics
  cumulativeStats: jsonb('cumulative_stats').$type<{
    avgEngagement: number;
    avgConfidence: number;
    totalPauses: number;
    totalFillerWords: number;
    questionsCompleted: number;
    timeElapsed: number;
  }>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  
}, (table) => ({
  sessionTimestampIdx: index('idx_analytics_session_timestamp').on(table.sessionId, table.timestamp),
  timestampIdx: index('idx_analytics_timestamp').on(table.timestamp),
}))

// ============================================================================
// CACHING AND OPTIMIZATION TABLES
// ============================================================================

// Question cache for performance optimization
export const questionCache = pgTable('question_cache', {
  id: serial('id').primaryKey(),
  cacheKey: text('cache_key').notNull().unique(),
  
  // Cached content
  questions: jsonb('questions').notNull(),
  metadata: jsonb('metadata').$type<{
    generatedAt: string;
    llmProvider: string;
    contextHash: string;
    qualityScore: number;
  }>().notNull(),
  
  // Cache management
  accessCount: integer('access_count').notNull().default(0),
  lastAccessed: timestamp('last_accessed', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  
}, (table) => ({
  cacheKeyIdx: index('idx_question_cache_key').on(table.cacheKey),
  expiresAtIdx: index('idx_question_cache_expires').on(table.expiresAt),
  lastAccessedIdx: index('idx_question_cache_accessed').on(table.lastAccessed),
}))

// ============================================================================
// RELATIONS
// ============================================================================

export const interviewSessionsRelations = relations(interviewSessions, ({ many }) => ({
  questions: many(questions),
  answers: many(answers),
  analytics: many(sessionAnalytics),
}))

export const questionsRelations = relations(questions, ({ one, many }) => ({
  session: one(interviewSessions, {
    fields: [questions.sessionId],
    references: [interviewSessions.id],
  }),
  answers: many(answers),
  idealAnswer: one(idealAnswers, {
    fields: [questions.id],
    references: [idealAnswers.questionId],
  }),
  parentQuestion: one(questions, {
    fields: [questions.parentQuestionId],
    references: [questions.id],
  }),
  followUpQuestions: many(questions),
}))

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  session: one(interviewSessions, {
    fields: [answers.sessionId],
    references: [interviewSessions.id],
  }),
}))

export const idealAnswersRelations = relations(idealAnswers, ({ one }) => ({
  question: one(questions, {
    fields: [idealAnswers.questionId],
    references: [questions.id],
  }),
}))

export const sessionAnalyticsRelations = relations(sessionAnalytics, ({ one }) => ({
  session: one(interviewSessions, {
    fields: [sessionAnalytics.sessionId],
    references: [interviewSessions.id],
  }),
}))

// ============================================================================
// TYPES
// ============================================================================

export type InterviewSession = typeof interviewSessions.$inferSelect
export type NewInterviewSession = typeof interviewSessions.$inferInsert
export type Question = typeof questions.$inferSelect
export type NewQuestion = typeof questions.$inferInsert
export type Answer = typeof answers.$inferSelect
export type NewAnswer = typeof answers.$inferInsert
export type IdealAnswer = typeof idealAnswers.$inferSelect
export type SessionAnalytics = typeof sessionAnalytics.$inferSelect
