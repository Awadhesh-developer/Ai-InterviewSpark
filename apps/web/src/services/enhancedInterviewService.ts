// Enhanced Interview Service - Frontend
// Handles communication with the enhanced interview API

import { unifiedApiClient } from '@/lib/unified-api';

export interface EnhancedInterviewConfig {
  jobTitle: string;
  company?: string;
  industry: string;
  jobDescription?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  questionTypes: string[];
  interviewMode: 'text' | 'voice' | 'video' | 'hybrid';
  
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

export interface InterviewSession {
  id: string;
  userId: string;
  type: string;
  status: string;
  title: string;
  description: string;
  jobTitle: string;
  company?: string;
  duration: number;
  difficulty: string;
  topics: string[];
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  sessionState: any;
  realTimeData: any;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  sessionId: string;
  type: string;
  text: string;
  category: string;
  difficulty: string;
  expectedKeywords: string[];
  timeLimit: number;
  order: number;
  source: string;
  freshnessScore: number;
  relevanceScore: number;
  companySpecific: boolean;
  industryTrends: string[];
  llmProvider: string;
  starFramework: any;
  followUpQuestions: string[];
  tips: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RealTimeState {
  sessionId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  mode: string;
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number;
  currentQuestion: Question | null;
  questionStartTime: string | null;
  answerStartTime: string | null;
  liveGenerationEnabled: boolean;
  nextQuestionsReady: Question[];
  adaptiveLevel: 'easy' | 'medium' | 'hard';
  emotionalState?: {
    confidence: number;
    stress: number;
    engagement: number;
    timestamp: string;
  };
  voiceMetrics?: {
    clarity: number;
    pace: number;
    volume: number;
    timestamp: string;
  };
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

export interface AnswerSubmission {
  sessionId: string;
  questionId: string;
  textAnswer?: string;
  audioUrl?: string;
  videoUrl?: string;
  duration: number;
}

export interface InterviewCapabilities {
  perplexityEnabled: boolean;
  supportedModes: string[];
  features: {
    realTimeGeneration: boolean;
    adaptiveQuestioning: boolean;
    emotionalAnalysis: boolean;
    voiceAnalysis: boolean;
    companySpecificQuestions: boolean;
    industryTrends: boolean;
  };
  limits: {
    maxDuration: number;
    maxQuestions: number;
    maxCustomPrompts: number;
  };
}

class EnhancedInterviewService {
  private baseUrl = '/api/enhanced-interviews';

  /**
   * Create an enhanced interview session
   */
  async createSession(config: EnhancedInterviewConfig): Promise<{
    session: InterviewSession;
    features: InterviewModeFeatures;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create interview session');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Error creating enhanced session:', error);
      throw error;
    }
  }

  /**
   * Start an interview session
   */
  async startSession(sessionId: string, mode: string): Promise<{
    state: RealTimeState;
    features: InterviewModeFeatures;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({ sessionId, mode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start interview session');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  /**
   * Get the next question
   */
  async getNextQuestion(
    sessionId: string,
    previousAnswerQuality?: 'poor' | 'average' | 'excellent'
  ): Promise<{
    question: Question | null;
    state: RealTimeState;
    completed: boolean;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/next-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({ sessionId, previousAnswerQuality }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get next question');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Error getting next question:', error);
      throw error;
    }
  }

  /**
   * Submit an answer
   */
  async submitAnswer(answerData: AnswerSubmission): Promise<{
    feedback: any;
    nextQuestion: Question | null;
    realTimeAnalysis?: any;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/submit-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(answerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit answer');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }

  /**
   * Get real-time session state
   */
  async getSessionState(sessionId: string): Promise<RealTimeState> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/state`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get session state');
      }

      const data = await response.json();
      return data.data.state;
    } catch (error: any) {
      console.error('Error getting session state:', error);
      throw error;
    }
  }

  /**
   * Toggle pause/resume session
   */
  async togglePause(sessionId: string): Promise<RealTimeState> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/toggle-pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle pause');
      }

      const data = await response.json();
      return data.data.state;
    } catch (error: any) {
      console.error('Error toggling pause:', error);
      throw error;
    }
  }

  /**
   * Test Perplexity API connection
   */
  async testPerplexityConnection(): Promise<{
    perplexityEnabled: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/perplexity/test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to test Perplexity connection');
      }

      const data = await response.json();
      return {
        perplexityEnabled: data.success,
        message: data.message,
      };
    } catch (error: any) {
      console.error('Error testing Perplexity connection:', error);
      return {
        perplexityEnabled: false,
        message: error.message,
      };
    }
  }

  /**
   * Generate questions using Perplexity API
   */
  async generatePerplexityQuestions(params: {
    jobTitle: string;
    company?: string;
    industry: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    questionTypes: string[];
    count?: number;
    includeRealTimeContext?: boolean;
    includeCompanyNews?: boolean;
    includeIndustryTrends?: boolean;
    customContext?: string;
  }): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/perplexity/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          ...params,
          difficulty: params.difficulty || 'medium',
          count: params.count || 5,
          includeRealTimeContext: params.includeRealTimeContext !== false,
          includeCompanyNews: params.includeCompanyNews !== false,
          includeIndustryTrends: params.includeIndustryTrends !== false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate questions');
      }

      const data = await response.json();
      return data.data.questions;
    } catch (error: any) {
      console.error('Error generating Perplexity questions:', error);
      throw error;
    }
  }

  /**
   * Get available interview modes and features
   */
  async getInterviewModes(): Promise<{
    modes: Array<{
      mode: string;
      features: InterviewModeFeatures;
      description: string;
    }>;
    recommended: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/modes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get interview modes');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Error getting interview modes:', error);
      throw error;
    }
  }

  /**
   * Get system capabilities
   */
  async getCapabilities(): Promise<InterviewCapabilities> {
    try {
      const response = await fetch(`${this.baseUrl}/capabilities`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get capabilities');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Error getting capabilities:', error);
      throw error;
    }
  }

  /**
   * Upload audio/video file for processing
   */
  async uploadMediaFile(file: File, type: 'audio' | 'video'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload/media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload media file');
      }

      const data = await response.json();
      return data.data.url;
    } catch (error: any) {
      console.error('Error uploading media file:', error);
      throw error;
    }
  }

  /**
   * Get interview analytics and performance data
   */
  async getInterviewAnalytics(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`/api/analytics/interview/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get interview analytics');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Error getting interview analytics:', error);
      throw error;
    }
  }

  /**
   * Get authentication token from localStorage or cookie
   */
  private getAuthToken(): string {
    // Try localStorage first
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) return token;

      // Fallback to cookie
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'auth_token') {
          return value;
        }
      }
    }
    return '';
  }

  /**
   * Create a WebSocket connection for real-time updates
   */
  createWebSocketConnection(sessionId: string): WebSocket | null {
    try {
      if (typeof window === 'undefined') return null;

      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/interview/${sessionId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connection established for session:', sessionId);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          // Handle real-time updates
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed for session:', sessionId);
      };

      return ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      return null;
    }
  }
}

// Export singleton instance
export const enhancedInterviewService = new EnhancedInterviewService();
export default enhancedInterviewService;
