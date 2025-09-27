// Enhanced Interview Service with Perplexity Integration
// Supports Voice, Video, Text interview modes with real-time question generation

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
import { PerplexityService, PerplexityGenerationParams } from './perplexityService';
import { AIService } from './aiService';
import { createError, QuestionType } from '../types';
import { eq, and, desc, count, avg } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export type InterviewMode = 'voice' | 'video' | 'text' | 'hybrid';

export interface EnhancedInterviewConfig {
  jobTitle: string;
  company?: string;
  industry: string;
  jobDescription?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  questionTypes: QuestionType[];
  topics?: string[];
  interviewMode: InterviewMode;
  
  // Enhanced features
  usePerplexityAPI?: boolean;
  includeRealTimeContext?: boolean;
  includeCompanyNews?: boolean;
  includeIndustryTrends?: boolean;
  adaptiveQuestioning?: boolean;
  emotionalAnalysis?: boolean;
  voiceAnalysis?: boolean;
  customPrompts?: string[];
  
  // Real-time features
  enableLiveGeneration?: boolean;
  questionPoolSize?: number;
  difficultyProgression?: boolean;
  personalizedFeedback?: boolean;
}

export interface InterviewModeFeatures {
  supportsVideo: boolean;
  supportsAudio: boolean;
  supportsText: boolean;
  requiresCamera: boolean;
  requiresMicrophone: boolean;
  realTimeAnalysis: boolean;
  emotionalAnalysis: boolean;
  voiceAnalysis: boolean;
}

export interface RealTimeInterviewState {
  sessionId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  mode: InterviewMode;
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number;
  
  // Current question state
  currentQuestion: Question | null;
  questionStartTime: Date | null;
  answerStartTime: Date | null;
  
  // Real-time features
  liveGenerationEnabled: boolean;
  nextQuestionsReady: Question[];
  adaptiveLevel: 'easy' | 'medium' | 'hard';
  
  // Analysis data
  emotionalState?: {
    confidence: number;
    stress: number;
    engagement: number;
    timestamp: Date;
  };
  voiceMetrics?: {
    clarity: number;
    pace: number;
    volume: number;
    timestamp: Date;
  };
}

export class EnhancedInterviewService {
  private perplexityService: PerplexityService;
  private activeSessions = new Map<string, RealTimeInterviewState>();

  constructor() {
    this.perplexityService = new PerplexityService();
  }

  /**
   * Create a new enhanced interview session with real-time capabilities
   */
  async createEnhancedSession(
    userId: string, 
    config: EnhancedInterviewConfig
  ): Promise<InterviewSession> {
    try {
      // Get user's resume for context
      const userResume = await db.query.resumes.findFirst({
        where: eq(resumes.userId, userId),
        orderBy: desc(resumes.uploadDate)
      });

      // Generate initial questions using Perplexity if enabled
      let generatedQuestions: Question[] = [];
      
      if (config.usePerplexityAPI) {
        const perplexityQuestions = await this.generatePerplexityQuestions(config, userResume);
        generatedQuestions = perplexityQuestions;
      } else {
        // Fallback to existing AI service
        const aiQuestions = await AIService.generateEnhancedQuestions({
          jobTitle: config.jobTitle,
          industry: config.industry,
          company: config.company,
          jobDescription: config.jobDescription,
          resumeSkills: userResume?.parsedData?.skills || [],
          questionTypes: config.questionTypes,
          difficulty: this.mapDifficultyToPerplexity(config.difficulty),
          count: config.questionPoolSize || Math.ceil(config.duration / 3),
        });
        generatedQuestions = this.convertToQuestions(aiQuestions);
      }

      // Create interview session
      const session = await db.insert(interviewSessions).values({
        userId,
        type: this.mapInterviewModeToType(config.interviewMode),
        status: 'scheduled',
        title: `${config.jobTitle} Interview Practice - ${config.interviewMode.toUpperCase()}`,
        description: this.generateSessionDescription(config),
        jobTitle: config.jobTitle,
        company: config.company,
        duration: config.duration,
        difficulty: config.difficulty,
        topics: config.topics || [],
        scheduledAt: new Date(),
        sessionState: {
          currentStep: 'setup',
          questionIndex: 0,
          totalQuestions: generatedQuestions.length,
          timeRemaining: config.duration * 60,
          isPaused: false,
          pausedAt: null,
          resumedAt: null,
        },
        realTimeData: {
          mode: config.interviewMode,
          features: this.getInterviewModeFeatures(config.interviewMode),
          config: {
            usePerplexityAPI: config.usePerplexityAPI || false,
            adaptiveQuestioning: config.adaptiveQuestioning || false,
            emotionalAnalysis: config.emotionalAnalysis || false,
            voiceAnalysis: config.voiceAnalysis || false,
          },
        },
      }).returning();

      const newSession = session[0];

      // Insert generated questions
      if (generatedQuestions.length > 0) {
        await this.insertQuestions(newSession.id, generatedQuestions);
      }

      // Initialize real-time state if live generation is enabled
      if (config.enableLiveGeneration) {
        await this.initializeRealTimeState(newSession.id, config);
      }

      return newSession;

    } catch (error) {
      console.error('Error creating enhanced interview session:', error);
      throw createError('Failed to create interview session', 500);
    }
  }

  /**
   * Generate questions using Perplexity API
   */
  private async generatePerplexityQuestions(
    config: EnhancedInterviewConfig, 
    userResume?: any
  ): Promise<Question[]> {
    const params: PerplexityGenerationParams = {
      jobTitle: config.jobTitle,
      company: config.company,
      industry: config.industry,
      difficulty: this.mapDifficultyToPerplexity(config.difficulty),
      questionTypes: config.questionTypes,
      count: config.questionPoolSize || Math.ceil(config.duration / 3),
      includeRealTimeContext: config.includeRealTimeContext,
      includeCompanyNews: config.includeCompanyNews,
      includeIndustryTrends: config.includeIndustryTrends,
      customContext: this.buildCustomContext(config, userResume),
    };

    const perplexityQuestions = await this.perplexityService.generateRealTimeQuestions(params);
    
    return perplexityQuestions.map((pq, index) => ({
      id: pq.id,
      sessionId: '', // Will be set when inserting
      type: pq.type as any,
      text: pq.question,
      category: pq.category,
      difficulty: this.mapDifficultyToDatabase(pq.difficulty),
      expectedKeywords: [],
      timeLimit: this.calculateTimeLimit(pq.difficulty),
      order: index + 1,
      source: 'perplexity',
      freshnessScore: pq.freshnessScore,
      relevanceScore: pq.relevanceScore,
      companySpecific: pq.companySpecific,
      industryTrends: pq.industryTrends,
      llmProvider: 'perplexity',
      starFramework: null,
      followUpQuestions: pq.followUpQuestions,
      tips: pq.tips,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  /**
   * Start an interview session with specified mode
   */
  async startInterviewSession(
    sessionId: string,
    mode: InterviewMode
  ): Promise<RealTimeInterviewState> {
    try {
      // Get session and questions
      const session = await db.query.interviewSessions.findFirst({
        where: eq(interviewSessions.id, sessionId),
        with: {
          questions: {
            orderBy: questions.order,
          },
        },
      });

      if (!session) {
        throw createError('Interview session not found', 404);
      }

      // Update session status
      await db.update(interviewSessions)
        .set({
          status: 'in_progress',
          startedAt: new Date(),
          sessionState: {
            currentStep: 'active',
            questionIndex: 0,
            totalQuestions: session.questions?.length || 0,
            timeRemaining: session.duration * 60,
            isPaused: false,
            pausedAt: null,
            resumedAt: null,
          },
        })
        .where(eq(interviewSessions.id, sessionId));

      // Initialize real-time state
      const realTimeState: RealTimeInterviewState = {
        sessionId,
        currentQuestionIndex: 0,
        totalQuestions: session.questions?.length || 0,
        mode,
        isActive: true,
        isPaused: false,
        timeRemaining: session.duration * 60,
        currentQuestion: session.questions?.[0] || null,
        questionStartTime: new Date(),
        answerStartTime: null,
        liveGenerationEnabled: session.realTimeData?.config?.enableLiveGeneration || false,
        nextQuestionsReady: [],
        adaptiveLevel: session.difficulty === 'beginner' ? 'easy' : 
                      session.difficulty === 'advanced' ? 'hard' : 'medium',
      };

      // Store active session
      this.activeSessions.set(sessionId, realTimeState);

      // Pre-generate next questions if live generation is enabled
      if (realTimeState.liveGenerationEnabled) {
        await this.preGenerateNextQuestions(sessionId);
      }

      return realTimeState;

    } catch (error) {
      console.error('Error starting interview session:', error);
      throw createError('Failed to start interview session', 500);
    }
  }

  /**
   * Get next question with real-time adaptation
   */
  async getNextQuestion(
    sessionId: string,
    previousAnswerQuality?: 'poor' | 'average' | 'excellent'
  ): Promise<Question | null> {
    try {
      const state = this.activeSessions.get(sessionId);
      if (!state || !state.isActive) {
        throw createError('Interview session not active', 400);
      }

      // Adapt difficulty based on previous answer if adaptive questioning is enabled
      if (previousAnswerQuality && state.liveGenerationEnabled) {
        await this.adaptDifficulty(sessionId, previousAnswerQuality);
      }

      // Move to next question
      state.currentQuestionIndex++;
      
      if (state.currentQuestionIndex >= state.totalQuestions) {
        // End of interview
        await this.endInterviewSession(sessionId);
        return null;
      }

      // Get next question from pre-generated pool or database
      let nextQuestion: Question | null = null;
      
      if (state.nextQuestionsReady.length > 0) {
        nextQuestion = state.nextQuestionsReady.shift() || null;
      } else {
        // Fallback to database questions
        const sessionQuestions = await db.query.questions.findMany({
          where: eq(questions.sessionId, sessionId),
          orderBy: questions.order,
        });
        nextQuestion = sessionQuestions[state.currentQuestionIndex] as any || null;
      }

      // Update state
      state.currentQuestion = nextQuestion;
      state.questionStartTime = new Date();
      state.answerStartTime = null;

      // Generate more questions if running low
      if (state.liveGenerationEnabled && state.nextQuestionsReady.length < 2) {
        this.preGenerateNextQuestions(sessionId).catch(console.error);
      }

      return nextQuestion;

    } catch (error) {
      console.error('Error getting next question:', error);
      throw createError('Failed to get next question', 500);
    }
  }

  /**
   * Submit answer and get real-time feedback
   */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    answerData: {
      textAnswer?: string;
      audioUrl?: string;
      videoUrl?: string;
      duration: number;
    }
  ): Promise<{
    feedback: any;
    nextQuestion: Question | null;
    realTimeAnalysis?: any;
  }> {
    try {
      const state = this.activeSessions.get(sessionId);
      if (!state || !state.isActive) {
        throw createError('Interview session not active', 400);
      }

      // Store answer in database
      await db.insert(answers).values({
        sessionId,
        questionId,
        userId: '', // Will be filled from session
        text: answerData.textAnswer,
        audioUrl: answerData.audioUrl,
        videoUrl: answerData.videoUrl,
        duration: answerData.duration,
      });

      // Generate real-time feedback
      const feedback = await this.generateRealTimeFeedback(
        questionId,
        answerData,
        state.mode
      );

      // Get next question with adaptation
      const answerQuality = this.assessAnswerQuality(answerData, feedback);
      const nextQuestion = await this.getNextQuestion(sessionId, answerQuality);

      // Real-time analysis for voice/video modes
      let realTimeAnalysis = null;
      if (state.mode === 'voice' || state.mode === 'video') {
        realTimeAnalysis = await this.performRealTimeAnalysis(answerData, state.mode);
      }

      return {
        feedback,
        nextQuestion,
        realTimeAnalysis,
      };

    } catch (error) {
      console.error('Error submitting answer:', error);
      throw createError('Failed to submit answer', 500);
    }
  }

  /**
   * Get interview mode features and capabilities
   */
  getInterviewModeFeatures(mode: InterviewMode): InterviewModeFeatures {
    const features: Record<InterviewMode, InterviewModeFeatures> = {
      text: {
        supportsVideo: false,
        supportsAudio: false,
        supportsText: true,
        requiresCamera: false,
        requiresMicrophone: false,
        realTimeAnalysis: false,
        emotionalAnalysis: false,
        voiceAnalysis: false,
      },
      voice: {
        supportsVideo: false,
        supportsAudio: true,
        supportsText: true,
        requiresCamera: false,
        requiresMicrophone: true,
        realTimeAnalysis: true,
        emotionalAnalysis: false,
        voiceAnalysis: true,
      },
      video: {
        supportsVideo: true,
        supportsAudio: true,
        supportsText: true,
        requiresCamera: true,
        requiresMicrophone: true,
        realTimeAnalysis: true,
        emotionalAnalysis: true,
        voiceAnalysis: true,
      },
      hybrid: {
        supportsVideo: true,
        supportsAudio: true,
        supportsText: true,
        requiresCamera: false,
        requiresMicrophone: false,
        realTimeAnalysis: true,
        emotionalAnalysis: true,
        voiceAnalysis: true,
      },
    };

    return features[mode];
  }

  /**
   * Get real-time interview state
   */
  getRealTimeState(sessionId: string): RealTimeInterviewState | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Pause/Resume interview session
   */
  async togglePauseSession(sessionId: string): Promise<RealTimeInterviewState> {
    const state = this.activeSessions.get(sessionId);
    if (!state) {
      throw createError('Interview session not found', 404);
    }

    state.isPaused = !state.isPaused;
    
    // Update database
    await db.update(interviewSessions)
      .set({
        sessionState: {
          ...state,
          isPaused: state.isPaused,
          pausedAt: state.isPaused ? new Date().toISOString() : null,
          resumedAt: !state.isPaused ? new Date().toISOString() : null,
        },
      })
      .where(eq(interviewSessions.id, sessionId));

    return state;
  }

  // Helper methods
  private mapDifficultyToPerplexity(difficulty: string): 'easy' | 'medium' | 'hard' {
    const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
      'beginner': 'easy',
      'intermediate': 'medium',
      'advanced': 'hard',
    };
    return difficultyMap[difficulty] || 'medium';
  }

  private mapInterviewModeToType(mode: InterviewMode): 'video' | 'audio' | 'text' {
    const modeMap: Record<InterviewMode, 'video' | 'audio' | 'text'> = {
      'video': 'video',
      'voice': 'audio',
      'text': 'text',
      'hybrid': 'video',
    };
    return modeMap[mode];
  }

  private generateSessionDescription(config: EnhancedInterviewConfig): string {
    const features = [];
    if (config.usePerplexityAPI) features.push('Real-time questions');
    if (config.adaptiveQuestioning) features.push('Adaptive difficulty');
    if (config.emotionalAnalysis) features.push('Emotional analysis');
    if (config.voiceAnalysis) features.push('Voice analysis');
    
    return `${config.interviewMode.toUpperCase()} interview for ${config.jobTitle}${config.company ? ` at ${config.company}` : ''}${features.length > 0 ? ` with ${features.join(', ')}` : ''}`;
  }

  private buildCustomContext(config: EnhancedInterviewConfig, userResume?: any): string {
    let context = '';
    
    if (userResume?.parsedData?.skills) {
      context += `User skills: ${userResume.parsedData.skills.join(', ')}. `;
    }
    
    if (config.customPrompts) {
      context += `Additional context: ${config.customPrompts.join(' ')}. `;
    }
    
    return context.trim();
  }

  private mapDifficultyToDatabase(difficulty: string): 'beginner' | 'intermediate' | 'advanced' {
    switch (difficulty) {
      case 'easy':
        return 'beginner';
      case 'medium':
        return 'intermediate';
      case 'hard':
        return 'advanced';
      default:
        return 'intermediate';
    }
  }

  private calculateTimeLimit(difficulty: string): number {
    const timeLimits = {
      'easy': 120,    // 2 minutes
      'medium': 180,  // 3 minutes
      'hard': 240,    // 4 minutes
    };
    return timeLimits[difficulty as keyof typeof timeLimits] || 180;
  }

  private convertToQuestions(aiQuestions: any[]): Question[] {
    return aiQuestions.map((q, index) => ({
      id: q.id || uuidv4(),
      sessionId: '',
      type: q.type || 'behavioral',
      text: q.question || q.text,
      category: q.category || 'General',
      difficulty: q.difficulty || 'medium',
      expectedKeywords: q.expectedKeywords || [],
      timeLimit: q.timeLimit || 180,
      order: index + 1,
      source: q.source || 'ai-generated',
      freshnessScore: q.freshnessScore || 0.8,
      relevanceScore: q.relevanceScore || 0.8,
      companySpecific: q.companySpecific || false,
      industryTrends: q.industryTrends || [],
      llmProvider: q.llmProvider || 'openai',
      starFramework: q.starFramework || null,
      followUpQuestions: q.followUpQuestions || [],
      tips: q.tips || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  private async insertQuestions(sessionId: string, questionsToInsert: Question[]): Promise<void> {
    const questionsWithSessionId = questionsToInsert.map(q => ({
      ...q,
      sessionId,
    }));

    await db.insert(questions).values(questionsWithSessionId);
  }

  private async initializeRealTimeState(sessionId: string, config: EnhancedInterviewConfig): Promise<void> {
    // Pre-generate additional questions for live generation
    if (config.enableLiveGeneration) {
      await this.preGenerateNextQuestions(sessionId);
    }
  }

  private async preGenerateNextQuestions(sessionId: string): Promise<void> {
    // Implementation for pre-generating questions would go here
    // This would use Perplexity API to generate questions based on current interview progress
  }

  private async adaptDifficulty(sessionId: string, answerQuality: 'poor' | 'average' | 'excellent'): Promise<void> {
    const state = this.activeSessions.get(sessionId);
    if (!state) return;

    // Adjust difficulty based on answer quality
    if (answerQuality === 'poor' && state.adaptiveLevel !== 'easy') {
      state.adaptiveLevel = state.adaptiveLevel === 'hard' ? 'medium' : 'easy';
    } else if (answerQuality === 'excellent' && state.adaptiveLevel !== 'hard') {
      state.adaptiveLevel = state.adaptiveLevel === 'easy' ? 'medium' : 'hard';
    }
  }

  private async endInterviewSession(sessionId: string): Promise<void> {
    const state = this.activeSessions.get(sessionId);
    if (state) {
      state.isActive = false;
      this.activeSessions.delete(sessionId);
    }

    await db.update(interviewSessions)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(interviewSessions.id, sessionId));
  }

  private async generateRealTimeFeedback(
    questionId: string,
    answerData: any,
    mode: InterviewMode
  ): Promise<any> {
    // Implementation for real-time feedback generation
    return {
      score: 0.8,
      strengths: ['Clear communication'],
      improvements: ['Provide more specific examples'],
      suggestions: ['Consider using the STAR method'],
    };
  }

  private assessAnswerQuality(answerData: any, feedback: any): 'poor' | 'average' | 'excellent' {
    const score = feedback.score || 0.5;
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'average';
    return 'poor';
  }

  private async performRealTimeAnalysis(answerData: any, mode: InterviewMode): Promise<any> {
    // Implementation for real-time voice/video analysis
    return {
      emotionalState: {
        confidence: 0.7,
        stress: 0.3,
        engagement: 0.8,
        timestamp: new Date(),
      },
      voiceMetrics: mode === 'voice' || mode === 'video' ? {
        clarity: 0.8,
        pace: 0.7,
        volume: 0.9,
        timestamp: new Date(),
      } : undefined,
    };
  }
}

export default EnhancedInterviewService;
