// --- START api/services/interviewService.ts --- //
// Mock Interview Engine Service for AI-InterviewSpark
// Manages interview sessions, question generation, real-time feedback, and AI integration

import { db } from '../database/connection';
import { 
  interviewSessions, 
  questions, 
  answers, 
  feedback, 
  performanceMetrics,
  users,
  resumes,
  type InterviewSession,
  type Question,
  type Answer,
  type Feedback,
  type PerformanceMetrics
} from '../database/schema';
import { AIService } from './aiService';
import { createError, QuestionType } from '../types';
import { eq, and, desc, count, avg } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Interview session configuration
interface InterviewConfig {
  jobTitle: string;
  company?: string;
  jobDescription?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  questionTypes: Array<'behavioral' | 'technical' | 'situational' | 'strengths' | 'weaknesses'>;
  topics?: string[];
  includeEmotionalAnalysis?: boolean;
  includeResumeAnalysis?: boolean;
}

// Real-time interview state
interface InterviewState {
  sessionId: string;
  currentQuestionIndex: number;
  questions: Question[];
  startTime: Date;
  isActive: boolean;
  emotionalData: Array<{
    emotion: string;
    confidence: number;
    timestamp: number;
    source: 'voice' | 'facial';
  }>;
}

// Interview session cache for real-time state
const activeSessions = new Map<string, InterviewState>();

export class InterviewService {
  
  // ============================================================================
  // QUESTION GENERATION
  // ============================================================================

  /**
   * Generate interview questions using AI service
   */
  static async generateQuestions(params: {
    jobTitle: string;
    industry: string;
    company?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questionTypes: Array<'behavioral' | 'technical' | 'situational' | 'strengths' | 'weaknesses'>;
    count: number;
    jobDescription?: string;
    includeWebScraping?: boolean;
    includeSampleAnswers?: boolean;
  }) {
    try {
      // Generate questions using AI service
      const generatedQuestions = await AIService.generateEnhancedQuestions({
        jobTitle: params.jobTitle,
        industry: params.industry,
        company: params.company,
        jobDescription: params.jobDescription,
        resumeSkills: [], // No specific user context for general generation
        questionTypes: params.questionTypes as QuestionType[],
        difficulty: params.difficulty === 'beginner' ? 'easy' : 
                    params.difficulty === 'advanced' ? 'hard' : 'medium',
        count: params.count,
        includeWebScraping: params.includeWebScraping,
        includeSampleAnswers: params.includeSampleAnswers,
      });

      // Transform to expected format
      return generatedQuestions.map((q, index) => ({
        id: q.id || `generated_${Date.now()}_${index}`,
        question: q.question || q.text,
        type: q.type,
        difficulty: q.difficulty,
        category: q.category || 'General',
        expectedDuration: q.timeLimit || 180, // 3 minutes default
        followUpQuestions: q.followUpQuestions || [],
        tips: q.tips || [],
        sampleAnswer: q.sampleAnswer,
        source: q.source || 'ai-generated',
        freshnessScore: q.freshnessScore || 0.8,
        relevanceScore: q.relevanceScore || 0.8,
        companySpecific: q.companySpecific || false,
        industryTrends: q.industryTrends || [],
        starFramework: q.starFramework || null
      }));

    } catch (error) {
      console.error('Error generating questions:', error);
      
      // Fallback to basic questions
      return this.getFallbackQuestions(params);
    }
  }

  /**
   * Get fallback questions when AI generation fails
   */
  private static getFallbackQuestions(params: any) {
    const fallbackQuestions = [
      {
        id: `fallback_${Date.now()}_1`,
        question: `Tell me about your experience with ${params.jobTitle} responsibilities.`,
        type: 'behavioral',
        difficulty: params.difficulty === 'beginner' ? 'easy' : 
                    params.difficulty === 'advanced' ? 'hard' : 'medium',
        category: 'Experience',
        expectedDuration: 180,
        followUpQuestions: [
          'What was your biggest achievement in this role?',
          'How did you handle challenges?'
        ],
        tips: [
          'Use the STAR method (Situation, Task, Action, Result)',
          'Be specific with examples',
          'Quantify your achievements where possible'
        ],
        sampleAnswer: null,
        source: 'fallback',
        freshnessScore: 0.5,
        relevanceScore: 0.7,
        companySpecific: false,
        industryTrends: [],
        starFramework: null
      },
      {
        id: `fallback_${Date.now()}_2`,
        question: `How do you stay updated with the latest trends in ${params.industry}?`,
        type: 'technical',
        difficulty: params.difficulty === 'beginner' ? 'easy' : 
                    params.difficulty === 'advanced' ? 'hard' : 'medium',
        category: 'Industry Knowledge',
        expectedDuration: 180,
        followUpQuestions: [
          'Can you give an example of a recent trend you implemented?',
          'How do you evaluate new technologies or methodologies?'
        ],
        tips: [
          'Mention specific resources you use (blogs, conferences, courses)',
          'Show genuine interest in continuous learning',
          'Connect trends to business value'
        ],
        sampleAnswer: null,
        source: 'fallback',
        freshnessScore: 0.6,
        relevanceScore: 0.8,
        companySpecific: false,
        industryTrends: [],
        starFramework: null
      },
      {
        id: `fallback_${Date.now()}_3`,
        question: `Describe a challenging situation you faced and how you resolved it.`,
        type: 'situational',
        difficulty: params.difficulty === 'beginner' ? 'easy' : 
                    params.difficulty === 'advanced' ? 'hard' : 'medium',
        category: 'Problem Solving',
        expectedDuration: 180,
        followUpQuestions: [
          'What would you do differently next time?',
          'How did this experience change your approach?'
        ],
        tips: [
          'Focus on your problem-solving process',
          'Highlight your analytical skills',
          'Show learning and growth mindset'
        ],
        sampleAnswer: null,
        source: 'fallback',
        freshnessScore: 0.5,
        relevanceScore: 0.9,
        companySpecific: false,
        industryTrends: [],
        starFramework: null
      }
    ];

    return fallbackQuestions.slice(0, params.count);
  }
  
  // ============================================================================
  // INTERVIEW SESSION MANAGEMENT
  // ============================================================================

  /**
   * Create a new interview session with AI-generated questions
   */
  static async createInterviewSession(
    userId: string, 
    config: InterviewConfig
  ): Promise<InterviewSession> {
    try {
      // Get user's resume for context if available
      const userResume = await db.query.resumes.findFirst({
        where: eq(resumes.userId, userId),
        orderBy: desc(resumes.uploadDate)
      });

      // Generate questions using AI service
      const generatedQuestions = await AIService.generateEnhancedQuestions({
        jobTitle: config.jobTitle,
        industry: 'Technology', // Default industry, could be made configurable
        company: config.company,
        jobDescription: config.jobDescription,
        resumeSkills: userResume?.parsedData?.skills || [],
        questionTypes: config.questionTypes as QuestionType[],
        difficulty: config.difficulty === 'beginner' ? 'easy' : config.difficulty === 'advanced' ? 'hard' : 'medium',
        count: Math.ceil(config.duration / 3), // ~3 minutes per question
      });

      // Create interview session
      const session = await db.insert(interviewSessions).values({
        userId,
        type: 'video', // Default to video, can be changed
        status: 'scheduled',
        title: `${config.jobTitle} Interview Practice`,
        description: `Mock interview for ${config.jobTitle} position${config.company ? ` at ${config.company}` : ''}`,
        jobTitle: config.jobTitle,
        company: config.company,
        duration: config.duration,
        difficulty: config.difficulty,
        topics: config.topics || [],
        scheduledAt: new Date(),
      }).returning();

      const newSession = session[0];

      // Insert generated questions
      const questionsToInsert = generatedQuestions.map((q, index) => ({
        sessionId: newSession.id,
        type: q.type,
        text: q.text,
        category: q.category,
        difficulty: q.difficulty,
        expectedKeywords: q.expectedKeywords,
        timeLimit: q.timeLimit || 180, // Default 3 minutes
        order: index + 1,
      }));

      await db.insert(questions).values(questionsToInsert);

      return newSession;
    } catch (error) {
      console.error('Error creating interview session:', error);
      throw createError('Failed to create interview session', 500);
    }
  }

  /**
   * Start an interview session and initialize real-time state
   */
  static async startInterviewSession(sessionId: string): Promise<InterviewSession> {
    try {
      // Get session with questions
      const session = await db.query.interviewSessions.findFirst({
        where: eq(interviewSessions.id, sessionId),
        with: {
          questions: {
            orderBy: questions.order
          }
        }
      });

      if (!session) {
        throw createError('Interview session not found', 404);
      }

      if (session.status !== 'scheduled') {
        throw createError('Interview session cannot be started', 400);
      }

      // Update session status
      const updatedSession = await db.update(interviewSessions)
        .set({
          status: 'in_progress',
          startedAt: new Date()
        })
        .where(eq(interviewSessions.id, sessionId))
        .returning();

      // Initialize real-time state
      const interviewState: InterviewState = {
        sessionId,
        currentQuestionIndex: 0,
        questions: (session.questions || []).map((q: any) => ({
          ...q,
          type: q.type as any, // Cast to expected type
          difficulty: q.difficulty === 'easy' ? 'beginner' : q.difficulty === 'hard' ? 'advanced' : 'intermediate'
        })),
        startTime: new Date(),
        isActive: true,
        emotionalData: []
      };

      activeSessions.set(sessionId, interviewState);

      return updatedSession[0] as any;
    } catch (error) {
      console.error('Error starting interview session:', error);
      throw createError('Failed to start interview session', 500);
    }
  }

  /**
   * Get current interview state for real-time updates
   */
  static getInterviewState(sessionId: string): InterviewState | null {
    return activeSessions.get(sessionId) || null;
  }

  /**
   * Get current question for the session
   */
  static async getCurrentQuestion(sessionId: string): Promise<Question | null> {
    const state = activeSessions.get(sessionId);
    if (!state || !state.isActive) {
      return null;
    }

    return state.questions[state.currentQuestionIndex] || null;
  }

  /**
   * Move to next question in the interview
   */
  static async nextQuestion(sessionId: string): Promise<Question | null> {
    const state = activeSessions.get(sessionId);
    if (!state || !state.isActive) {
      return null;
    }

    state.currentQuestionIndex++;
    
    if (state.currentQuestionIndex >= state.questions.length) {
      // Interview completed
      await this.completeInterviewSession(sessionId);
      return null;
    }

    return state.questions[state.currentQuestionIndex];
  }

  /**
   * Complete an interview session and generate final metrics
   */
  static async completeInterviewSession(sessionId: string): Promise<PerformanceMetrics> {
    try {
      const state = activeSessions.get(sessionId);
      if (!state) {
        throw createError('Interview session not found', 404);
      }

      // Update session status
      await db.update(interviewSessions)
        .set({
          status: 'completed',
          completedAt: new Date()
        })
        .where(eq(interviewSessions.id, sessionId));

      // Calculate session duration
      const sessionDuration = Math.round((Date.now() - state.startTime.getTime()) / 60000);

      // Get all answers and feedback for this session
      const sessionAnswers = await db.query.answers.findMany({
        where: eq(answers.sessionId, sessionId),
        with: {
          feedback: true
        }
      });

      // Calculate overall metrics using rubric/LLM scores
      const totalAnswers = sessionAnswers.length;
      const perAnswerAvg = sessionAnswers.map(a => {
        const list = a.feedback || [];
        if (!list.length) return 0;
        const sum = list.reduce((s, f) => s + Number(f.score), 0);
        return sum / list.length; // already 0-10 scale
      });
      const overallScore = totalAnswers > 0
        ? Math.round((perAnswerAvg.reduce((s, n) => s + n, 0) / totalAnswers) * 10) / 10
        : 0;

      // Calculate category scores
      const categoryScores: Record<string, number> = {};
      const categoryFeedback = sessionAnswers.flatMap(a => a.feedback || []);
      
      categoryFeedback.forEach(f => {
        if (!categoryScores[f.category]) {
          categoryScores[f.category] = 0;
        }
        categoryScores[f.category] += Number(f.score);
      });

      // Normalize category scores (0-10) with one decimal
      Object.keys(categoryScores).forEach(category => {
        const categoryCount = categoryFeedback.filter(f => f.category === category).length;
        const avg = categoryCount > 0 ? (categoryScores[category] / categoryCount) : 0;
        categoryScores[category] = Math.round(avg * 10) / 10;
      });

      // Analyze emotional trends
      const emotionalTrends = this.analyzeEmotionalTrends(state.emotionalData);

      // Generate improvement areas and strengths
      const { improvementAreas, strengths } = this.generateInsights(categoryScores, categoryFeedback as any);

      // Create performance metrics
      const recommendations = this.generateCoachingRecommendations({
        overallScore: overallScore,
        categoryScores: categoryScores,
        improvementAreas,
        strengths
      });

      const metrics = await db.insert(performanceMetrics).values({
        sessionId,
        userId: state.questions[0]?.sessionId ? await this.getUserIdFromSession(sessionId) : '',
        overallScore: overallScore.toString(),
        categoryScores,
        emotionalTrends,
        improvementAreas,
        strengths,
        sessionDuration,
        questionsAnswered: totalAnswers,
      }).returning();

      // Clean up active session
      activeSessions.delete(sessionId);

      return {
        ...metrics[0],
        overallScore: parseFloat(metrics[0].overallScore)
      };
    } catch (error) {
      console.error('Error completing interview session:', error);
      throw createError('Failed to complete interview session', 500);
    }
  }

  // ============================================================================
  // ANSWER PROCESSING & FEEDBACK
  // ============================================================================

  /**
   * Submit an answer and generate real-time feedback
   */
  static async submitAnswer(params: {
    sessionId: string;
    questionId: string;
    userId: string;
    text?: string;
    audioUrl?: string;
    videoUrl?: string;
    duration?: number;
    emotionalData?: Array<{
      emotion: string;
      confidence: number;
      timestamp: number;
      source: 'voice' | 'facial';
    }>;
  }): Promise<{
    answer: Answer;
    feedback: Feedback;
    nextQuestion?: Question;
  }> {
    try {
      const { sessionId, questionId, userId, text, audioUrl, videoUrl, duration, emotionalData } = params;

      // Get the question
      const question = await db.query.questions.findFirst({
        where: eq(questions.id, questionId)
      });

      if (!question) {
        throw createError('Question not found', 404);
      }

      // Create answer record
      const answer = await db.insert(answers).values({
        questionId,
        sessionId,
        userId,
        text,
        audioUrl,
        videoUrl,
        duration,
      }).returning();

      // Update emotional data in session state
      if (emotionalData && emotionalData.length > 0) {
        const state = activeSessions.get(sessionId);
        if (state) {
          state.emotionalData.push(...emotionalData);
        }
      }

      // Rubric-based deterministic scoring (always available)
      const tStart = Date.now()
      const rubric = this.scoreAnswerWithRubric({
        question: question.text,
        answer: text || '',
        questionType: question.type as QuestionType,
        expectedKeywords: (question.expectedKeywords as any) || [],
      });

      // Try LLM feedback (optional)
      let llm: { score: number; feedback: string; suggestions: string[] } | null = null;
      try {
        const raw = await AIService.analyzeAnswer({
          question: question.text,
          answer: text || '',
          questionType: question.type as QuestionType,
          expectedKeywords: question.expectedKeywords || [],
        });
        llm = this.normalizeLLMFeedback(raw);
      } catch (e) {
        llm = null;
      }

      // Combine rubric + LLM if available
      const finalScore = llm ? (rubric.score + this.clampTo10(llm.score)) / 2 : rubric.score;
      const finalFeedback = [rubric.feedback, llm?.feedback].filter(Boolean).join(' ');
      const finalSuggestions = this.mergeSuggestions(rubric.suggestions, llm?.suggestions || [], 5);

      // Analyze emotional state if data provided
      let emotionalAnalysis = null;
      if (emotionalData && emotionalData.length > 0) {
        emotionalAnalysis = this.analyzeEmotionalState(emotionalData);
      }

      // Create feedback record
      const feedbackRecord = await db.insert(feedback).values({
        answerId: answer[0].id,
        sessionId,
        userId,
        category: 'content',
        score: finalScore.toString(),
        feedback: finalFeedback,
        suggestions: finalSuggestions,
        emotionalAnalysis,
      }).returning();

      // Performance log
      try {
        const { logger } = await import('../utils/logger')
        logger.info('Answer analyzed', {
          sessionId,
          questionId,
          rubricScore: rubric.score,
          llmUsed: !!llm,
          finalScore,
          durationMs: Date.now() - tStart
        })
      } catch {}

      // Get next question
      const nextQuestion = await this.nextQuestion(sessionId);

      return {
        answer: answer[0],
        feedback: {
          ...feedbackRecord[0],
          score: parseFloat(feedbackRecord[0].score)
        },
        nextQuestion: nextQuestion || undefined,
      };
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw createError('Failed to submit answer', 500);
    }
  }

  // ---------------------------
  // Phase 2 helpers: scoring
  // ---------------------------
  private static clampTo10(n: any): number {
    const num = Number(n);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.min(10, num));
  }

  private static mergeSuggestions(a: string[] = [], b: string[] = [], limit = 5): string[] {
    const set = new Set<string>();
    [...a, ...b].forEach(s => {
      if (s && typeof s === 'string') set.add(s);
    });
    return Array.from(set).slice(0, limit);
  }

  private static normalizeLLMFeedback(raw: any): { score: number; feedback: string; suggestions: string[] } | null {
    if (!raw) return null;
    try {
      const score = this.clampTo10((raw as any).score);
      const feedback = (raw as any).feedback || '';
      const suggestions = Array.isArray((raw as any).suggestions) ? (raw as any).suggestions : [];
      return { score, feedback, suggestions };
    } catch {
      return null;
    }
  }

  private static scoreAnswerWithRubric(params: {
    question: string;
    answer: string;
    questionType: QuestionType;
    expectedKeywords: string[];
  }): { score: number; feedback: string; suggestions: string[] } {
    const answer = (params.answer || '').trim();
    if (!answer) {
      return {
        score: 2,
        feedback: 'No answer provided or too short. Provide a clear, structured response with specific examples.',
        suggestions: ['Use the STAR method', 'Include specific metrics', 'Keep it concise and relevant']
      };
    }

    // Length and clarity
    const words = answer.split(/\s+/).filter(Boolean).length;
    const lengthScore = words < 20 ? 4 : words < 60 ? 7 : words < 200 ? 9 : 7; // brevity vs depth

    // Keyword coverage
    const expected = (params.expectedKeywords || []).map(k => String(k).toLowerCase());
    const tokens = answer.toLowerCase();
    const matched = expected.filter(k => tokens.includes(k)).length;
    const coverage = expected.length > 0 ? matched / expected.length : 0.6; // default when none
    const keywordScore = Math.round(coverage * 10);

    // Structure detection for behavioral (STAR)
    let structureScore = 7;
    const hasSTAR = ['situation', 'task', 'action', 'result'].reduce((acc, k) => acc + (tokens.includes(k) ? 1 : 0), 0);
    if (params.questionType === 'behavioral') {
      structureScore = hasSTAR >= 3 ? 9 : hasSTAR === 2 ? 7 : 5;
    }

    // Relevance heuristic
    const relevanceScore = tokens.includes('i ') || tokens.includes("i'm") || tokens.includes('my ') ? 8 : 6;

    // Aggregate (0-10)
    const score = Math.round((lengthScore * 0.25 + keywordScore * 0.3 + structureScore * 0.25 + relevanceScore * 0.2) * 10) / 10;

    // Suggestions
    const suggestions: string[] = [];
    if (lengthScore < 7) suggestions.push('Expand your answer with one concise example');
    if (keywordScore < 7 && expected.length > 0) suggestions.push('Include role-specific keywords from the question');
    if (params.questionType === 'behavioral' && structureScore < 8) suggestions.push('Follow STAR: Situation, Task, Action, Result');
    if (relevanceScore < 7) suggestions.push('Connect your experience directly to the question requirements');

    const feedback = `Clear, ${score >= 8 ? 'well-supported' : 'partially supported'} answer. ${matched}/${expected.length || '—'} keywords covered. ${params.questionType === 'behavioral' ? (hasSTAR >= 3 ? 'Good STAR structure.' : 'Improve STAR structure.') : ''}`.trim();

    return { score, feedback, suggestions };
  }

  /**
   * Get real-time feedback for ongoing interview
   */
  static async getRealTimeFeedback(sessionId: string): Promise<{
    currentQuestion: Question | null;
    progress: {
      current: number;
      total: number;
      percentage: number;
    };
    emotionalState: {
      primaryEmotion: string;
      confidence: number;
      trend: 'improving' | 'declining' | 'stable';
    } | null;
    suggestions: string[];
  }> {
    const state = activeSessions.get(sessionId);
    if (!state) {
      throw createError('Interview session not found', 404);
    }

    const currentQuestion = state.questions[state.currentQuestionIndex] || null;
    const progress = {
      current: state.currentQuestionIndex + 1,
      total: state.questions.length,
      percentage: Math.round(((state.currentQuestionIndex + 1) / state.questions.length) * 100)
    };

    // Analyze current emotional state
    let emotionalState = null;
    if (state.emotionalData.length > 0) {
      const recentEmotions = state.emotionalData.slice(-10); // Last 10 data points
      const primaryEmotion = this.getPrimaryEmotion(recentEmotions);
      const trend = this.analyzeEmotionalTrend(recentEmotions);
      
      emotionalState = {
        primaryEmotion: primaryEmotion.emotion,
        confidence: primaryEmotion.confidence,
        trend
      };
    }

    // Generate real-time suggestions based on emotional state
    const suggestions = this.generateRealTimeSuggestions(emotionalState);

    return {
      currentQuestion,
      progress,
      emotionalState,
      suggestions,
    };
  }

  // ============================================================================
  // ANALYTICS & INSIGHTS
  // ============================================================================

  /**
   * Get user's interview history and performance analytics
   */
  static async getUserAnalytics(userId: string): Promise<{
    totalSessions: number;
    averageScore: number;
    improvementTrend: number;
    categoryBreakdown: Record<string, number>;
    recentSessions: Array<{
      id: string;
      title: string;
      score: number;
      date: Date;
    }>;
    emotionalInsights: {
      dominantEmotions: Array<{ emotion: string; frequency: number }>;
      confidenceTrend: number;
    };
  }> {
    try {
      // Get user's completed sessions
      const sessions = await db.query.interviewSessions.findMany({
        where: and(
          eq(interviewSessions.userId, userId),
          eq(interviewSessions.status, 'completed')
        ),
        with: {
          performanceMetrics: true
        },
        orderBy: desc(interviewSessions.completedAt)
      });

      const totalSessions = sessions.length;
      
      if (totalSessions === 0) {
        return {
          totalSessions: 0,
          averageScore: 0,
          improvementTrend: 0,
          categoryBreakdown: {},
          recentSessions: [],
          emotionalInsights: {
            dominantEmotions: [],
            confidenceTrend: 0
          }
        };
      }

      // Calculate average score
      const totalScore = sessions.reduce((sum, session) => {
        return sum + (Number(session.performanceMetrics?.[0]?.overallScore) || 0);
      }, 0);
      const averageScore = totalScore / totalSessions;

      // Calculate improvement trend (comparing recent vs older sessions)
      const recentSessions = sessions.slice(0, 5);
      const olderSessions = sessions.slice(-5);
      
      const recentAvg = recentSessions.reduce((sum, s) => sum + (Number(s.performanceMetrics?.[0]?.overallScore) || 0), 0) / recentSessions.length;
      const olderAvg = olderSessions.reduce((sum, s) => sum + (Number(s.performanceMetrics?.[0]?.overallScore) || 0), 0) / olderSessions.length;
      const improvementTrend = recentAvg - olderAvg;

      // Calculate category breakdown
      const categoryBreakdown: Record<string, number> = {};
      sessions.forEach(session => {
        const metrics = session.performanceMetrics?.[0];
        if (metrics?.categoryScores) {
          Object.entries(metrics.categoryScores).forEach(([category, score]) => {
            if (!categoryBreakdown[category]) {
              categoryBreakdown[category] = 0;
            }
            categoryBreakdown[category] += Number(score);
          });
        }
      });

      // Normalize category scores
      Object.keys(categoryBreakdown).forEach(category => {
        categoryBreakdown[category] = categoryBreakdown[category] / totalSessions;
      });

      // Get recent sessions for display
      const recentSessionsData = (recentSessions || []).map(session => ({
        id: session.id,
        title: session.title,
        score: Number(session.performanceMetrics?.[0]?.overallScore) || 0,
        date: session.completedAt || session.createdAt
      }));

      // Analyze emotional insights
      const emotionalInsights = this.analyzeUserEmotionalPatterns(sessions);

      return {
        totalSessions,
        averageScore,
        improvementTrend,
        categoryBreakdown,
        recentSessions: recentSessionsData,
        emotionalInsights,
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw createError('Failed to get user analytics', 500);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get user ID from session ID
   */
  private static async getUserIdFromSession(sessionId: string): Promise<string> {
    const session = await db.query.interviewSessions.findFirst({
      where: eq(interviewSessions.id, sessionId),
      columns: { userId: true }
    });
    return session?.userId || '';
  }

  /**
   * Analyze emotional trends from session data
   */
  private static analyzeEmotionalTrends(emotionalData: Array<{
    emotion: string;
    confidence: number;
    timestamp: number;
    source: string;
  }>): Array<{
    emotion: string;
    averageConfidence: number;
    frequency: number;
  }> {
    const emotionCounts: Record<string, { total: number; confidence: number; count: number }> = {};

    emotionalData.forEach(data => {
      if (!emotionCounts[data.emotion]) {
        emotionCounts[data.emotion] = { total: 0, confidence: 0, count: 0 };
      }
      emotionCounts[data.emotion].total += data.confidence;
      emotionCounts[data.emotion].count += 1;
    });

    return Object.entries(emotionCounts).map(([emotion, stats]) => ({
      emotion,
      averageConfidence: stats.count > 0 ? stats.total / stats.count : 0,
      frequency: stats.count,
    }));
  }

  /**
   * Analyze emotional state from recent data
   */
  private static analyzeEmotionalState(emotionalData: Array<{
    emotion: string;
    confidence: number;
    timestamp: number;
    source: string;
  }>): Array<{
    emotion: string;
    confidence: number;
    timestamp: number;
    source: string;
  }> {
    // Return the most recent emotional data points
    return emotionalData.slice(-5);
  }

  /**
   * Get primary emotion from recent data
   */
  private static getPrimaryEmotion(emotionalData: Array<{
    emotion: string;
    confidence: number;
    timestamp: number;
    source: string;
  }>): { emotion: string; confidence: number } {
    const emotionScores: Record<string, number> = {};

    emotionalData.forEach(data => {
      if (!emotionScores[data.emotion]) {
        emotionScores[data.emotion] = 0;
      }
      emotionScores[data.emotion] += data.confidence;
    });

    const primaryEmotion = Object.entries(emotionScores).reduce((max, current) => 
      current[1] > max[1] ? current : max
    );

    return {
      emotion: primaryEmotion[0],
      confidence: primaryEmotion[1] / emotionalData.length
    };
  }

  /**
   * Analyze emotional trend
   */
  private static analyzeEmotionalTrend(emotionalData: Array<{
    emotion: string;
    confidence: number;
    timestamp: number;
    source: string;
  }>): 'improving' | 'declining' | 'stable' {
    if (emotionalData.length < 3) return 'stable';

    const firstHalf = emotionalData.slice(0, Math.floor(emotionalData.length / 2));
    const secondHalf = emotionalData.slice(Math.floor(emotionalData.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.confidence, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.confidence, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Generate real-time suggestions based on emotional state
   */
  private static generateRealTimeSuggestions(emotionalState: {
    primaryEmotion: string;
    confidence: number;
    trend: 'improving' | 'declining' | 'stable';
  } | null): string[] {
    if (!emotionalState) return [];

    const suggestions: string[] = [];

    switch (emotionalState.primaryEmotion.toLowerCase()) {
      case 'nervous':
      case 'anxious':
        suggestions.push('Take a deep breath and pause before answering');
        suggestions.push('Remember to maintain eye contact and speak clearly');
        break;
      case 'confident':
        suggestions.push('Great confidence! Keep up the positive energy');
        break;
      case 'confused':
        suggestions.push('Don\'t hesitate to ask for clarification');
        suggestions.push('Take your time to think before responding');
        break;
      case 'excited':
        suggestions.push('Channel your enthusiasm into clear, structured answers');
        break;
    }

    if (emotionalState.trend === 'declining') {
      suggestions.push('Try to relax and focus on your breathing');
      suggestions.push('Remember your preparation and experience');
    }

    return suggestions;
  }

  /**
   * Generate insights from category scores and feedback
   */
  private static generateInsights(
    categoryScores: Record<string, number>,
    feedback: Array<{ category: string; feedback: string; suggestions: string[] }>
  ): { improvementAreas: string[]; strengths: string[] } {
    const improvementAreas: string[] = [];
    const strengths: string[] = [];

    // Analyze category scores
    Object.entries(categoryScores).forEach(([category, score]) => {
      if (score < 6.0) {
        improvementAreas.push(`Work on ${category} skills`);
      } else if (score > 8.0) {
        strengths.push(`Strong ${category} performance`);
      }
    });

    // Analyze feedback for common themes
    const feedbackText = feedback.map(f => f.feedback).join(' ').toLowerCase();
    
    if (feedbackText.includes('specific') || feedbackText.includes('example')) {
      improvementAreas.push('Provide more specific examples');
    }
    if (feedbackText.includes('clear') || feedbackText.includes('concise')) {
      strengths.push('Clear communication');
    }

    return { improvementAreas, strengths };
  }

  /**
   * Phase 4: Generate coaching recommendations from metrics
   */
  private static generateCoachingRecommendations(metrics: {
    overallScore: number;
    categoryScores: Record<string, number>;
    improvementAreas: string[];
    strengths: string[];
  }): Array<{ title: string; description: string; actionItems: string[]; priority: 'high' | 'medium' | 'low' }> {
    const recs: Array<{ title: string; description: string; actionItems: string[]; priority: 'high' | 'medium' | 'low' }> = [];

    const cat = metrics.categoryScores || {};
    const low = (k: string, thr = 6) => (cat[k] ?? 10) < thr;

    if (low('clarity') || low('content')) {
      recs.push({
        title: 'Improve structure with STAR',
        description: 'Your answers can be clearer and more structured. Use STAR to organize stories.',
        actionItems: ['Draft a STAR story for 3 key projects', 'Practice delivering each in 90 seconds', 'Record and review clarity'],
        priority: 'high'
      });
    }
    if (low('relevance')) {
      recs.push({
        title: 'Tighten relevance to the question',
        description: 'Connect examples directly to what is being asked and the target role.',
        actionItems: ['Paraphrase the question before answering', 'State the outcome/impact early', 'Map each point to a job requirement'],
        priority: 'high'
      });
    }
    if (low('content')) {
      recs.push({
        title: 'Add quantifiable evidence',
        description: 'Include metrics to demonstrate impact and results.',
        actionItems: ['Add 1–2 metrics to each story', 'Use before/after comparisons', 'Mention scale and constraints'],
        priority: 'medium'
      });
    }

    if ((metrics.overallScore || 0) >= 8) {
      recs.push({
        title: 'Maintain strengths while refining polish',
        description: 'You are performing well. Focus on polish and timing.',
        actionItems: ['Time answers to 60–120s', 'Remove filler phrases', 'Use vivid, concise language'],
        priority: 'low'
      });
    }

    // Ensure at least one recommendation
    if (!recs.length) {
      recs.push({
        title: 'Practice targeted mock set',
        description: 'A targeted set will help solidify your skills across categories.',
        actionItems: ['Run a 5-question mock: 2 behavioral, 2 technical, 1 situational', 'Review feedback after each answer'],
        priority: 'medium'
      });
    }

    return recs.slice(0, 5);
  }

  /**
   * Analyze user's emotional patterns across sessions
   */
  private static analyzeUserEmotionalPatterns(sessions: Array<{
    performanceMetrics?: Array<{ emotionalTrends: Array<{ emotion: string; frequency: number }> }>;
  }>): {
    dominantEmotions: Array<{ emotion: string; frequency: number }>;
    confidenceTrend: number;
  } {
    const emotionCounts: Record<string, number> = {};
    let totalConfidence = 0;
    let confidenceCount = 0;

    sessions.forEach(session => {
      session.performanceMetrics?.forEach(metrics => {
        (metrics.emotionalTrends || []).forEach(trend => {
          if (!emotionCounts[trend.emotion]) {
            emotionCounts[trend.emotion] = 0;
          }
          emotionCounts[trend.emotion] += trend.frequency;
        });
      });
    });

    const dominantEmotions = Object.entries(emotionCounts)
      .map(([emotion, frequency]) => ({ emotion, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    return {
      dominantEmotions,
      confidenceTrend: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
    };
  }
} 