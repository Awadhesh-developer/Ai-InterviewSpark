// --- START api/services/websocketService.ts --- //
// WebSocket service for AI-InterviewSpark API
// Handles real-time communication for interview sessions, emotion updates, and live feedback

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { config } from '../config';
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/auth';
import { db } from '../database/connection';
import { interviewSessions, answers, feedback, questions } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import EmotionalAnalysisService from './emotionalAnalysisService';
import { AIService } from './aiService';

// WebSocket event types
export interface WebSocketEvents {
  // Connection events
  'join-session': (sessionId: string) => void;
  'leave-session': (sessionId: string) => void;
  
  // Interview session events
  'session-start': (sessionId: string) => void;
  'session-pause': (sessionId: string) => void;
  'session-resume': (sessionId: string) => void;
  'session-end': (sessionId: string) => void;
  'session-status': (data: { sessionId: string; status: string }) => void;
  
  // Question and answer events
  'question-ready': (data: { sessionId: string; question: any }) => void;
  'answer-start': (data: { sessionId: string; questionId: string }) => void;
  'answer-submit': (data: { sessionId: string; questionId: string; answer: any }) => void;
  'answer-feedback': (data: { sessionId: string; questionId: string; feedback: any }) => void;
  
  // Real-time emotion events
  'emotion-update': (data: { sessionId: string; emotionData: any }) => void;
  'emotion-analysis': (data: { sessionId: string; analysis: any }) => void;
  
  // Live feedback events
  'feedback-update': (data: { sessionId: string; feedback: any }) => void;
  'coaching-tip': (data: { sessionId: string; tip: string; type: string }) => void;
  
  // Peer and expert events
  'peer-join': (data: { sessionId: string; peerId: string }) => void;
  'peer-leave': (data: { sessionId: string; peerId: string }) => void;
  'expert-join': (data: { sessionId: string; expertId: string }) => void;
  'expert-message': (data: { sessionId: string; message: string }) => void;
  
  // Media events
  'media-ready': (data: { sessionId: string; mediaType: 'audio' | 'video' }) => void;
  'media-error': (data: { sessionId: string; error: string }) => void;
  
  // Error events
  'error': (error: { message: string; code?: string }) => void;
}

// Session state interface
interface SessionState {
  sessionId: string;
  userId: string;
  status: 'waiting' | 'active' | 'paused' | 'completed';
  currentQuestionIndex: number;
  startTime?: Date;
  participants: Set<string>;
  emotionBuffer: Array<{
    timestamp: number;
    emotion: string;
    confidence: number;
    source: string;
  }>;
}

export class WebSocketService {
  private io: SocketIOServer;
  private activeSessions: Map<string, SessionState> = new Map();
  private userSessions: Map<string, string> = new Map(); // userId -> sessionId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.securityConfig.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  // Setup authentication middleware
  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify token and attach user info
        const { verifyToken } = await import('../middleware/auth');
        const payload = verifyToken(token);
        
        if (!payload) {
          return next(new Error('Invalid token'));
        }

        (socket as any).userId = payload.userId;
        (socket as any).userEmail = payload.email;
        (socket as any).userRole = payload.role;
        
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const userId = (socket as any).userId;
      logger.info(`WebSocket client connected: ${socket.id} (User: ${userId})`);

      // Session management events
      socket.on('join-session', (sessionId: string) => this.handleJoinSession(socket, sessionId));
      socket.on('leave-session', (sessionId: string) => this.handleLeaveSession(socket, sessionId));
      
      // Interview session events
      socket.on('session-start', (sessionId: string) => this.handleSessionStart(socket, sessionId));
      socket.on('session-pause', (sessionId: string) => this.handleSessionPause(socket, sessionId));
      socket.on('session-resume', (sessionId: string) => this.handleSessionResume(socket, sessionId));
      socket.on('session-end', (sessionId: string) => this.handleSessionEnd(socket, sessionId));
      
      // Answer events
      socket.on('answer-start', (data) => this.handleAnswerStart(socket, data));
      socket.on('answer-submit', (data) => this.handleAnswerSubmit(socket, data));
      
      // Real-time emotion events
      socket.on('emotion-update', (data) => this.handleEmotionUpdate(socket, data));
      
      // Media events
      socket.on('media-ready', (data) => this.handleMediaReady(socket, data));
      socket.on('media-error', (data) => this.handleMediaError(socket, data));
      
      // Disconnect event
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  // Handle joining a session
  private async handleJoinSession(socket: Socket, sessionId: string): Promise<void> {
    try {
      const userId = (socket as any).userId;
      
      // Verify user has access to this session
      const session = await db.query.interviewSessions.findFirst({
        where: and(
          eq(interviewSessions.id, sessionId),
          eq(interviewSessions.userId, userId)
        ),
      });

      if (!session) {
        socket.emit('error', { message: 'Session not found or access denied' });
        return;
      }

      // Join the session room
      socket.join(`session-${sessionId}`);
      
      // Update session state
      if (!this.activeSessions.has(sessionId)) {
        this.activeSessions.set(sessionId, {
          sessionId,
          userId,
          status: 'waiting',
          currentQuestionIndex: 0,
          participants: new Set(),
          emotionBuffer: [],
        });
      }

      const sessionState = this.activeSessions.get(sessionId)!;
      sessionState.participants.add(userId);
      this.userSessions.set(userId, sessionId);

      logger.info(`User ${userId} joined session ${sessionId}`);
      
      // Notify other participants
      socket.to(`session-${sessionId}`).emit('peer-join', { sessionId, peerId: userId });
      
      // Send session state to the user
      socket.emit('session-status', { 
        sessionId, 
        status: sessionState.status,
        currentQuestionIndex: sessionState.currentQuestionIndex,
        participants: Array.from(sessionState.participants)
      });
    } catch (error) {
      logger.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  }

  // Handle leaving a session
  private handleLeaveSession(socket: Socket, sessionId: string): void {
    const userId = (socket as any).userId;
    
    socket.leave(`session-${sessionId}`);
    
    const sessionState = this.activeSessions.get(sessionId);
    if (sessionState) {
      sessionState.participants.delete(userId);
      
      // Clean up if no participants left
      if (sessionState.participants.size === 0) {
        this.activeSessions.delete(sessionId);
      }
    }
    
    this.userSessions.delete(userId);
    
    logger.info(`User ${userId} left session ${sessionId}`);
    socket.to(`session-${sessionId}`).emit('peer-leave', { sessionId, peerId: userId });
  }

  // Handle session start
  private async handleSessionStart(socket: Socket, sessionId: string): Promise<void> {
    try {
      const sessionState = this.activeSessions.get(sessionId);
      if (!sessionState) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      sessionState.status = 'active';
      sessionState.startTime = new Date();

      // Update database
      await db
        .update(interviewSessions)
        .set({ 
          status: 'in_progress',
          startedAt: sessionState.startTime
        })
        .where(eq(interviewSessions.id, sessionId));

      // Notify all participants
      this.io.to(`session-${sessionId}`).emit('session-status', { 
        sessionId, 
        status: 'active',
        startTime: sessionState.startTime
      });

      logger.info(`Session ${sessionId} started`);
    } catch (error) {
      logger.error('Error starting session:', error);
      socket.emit('error', { message: 'Failed to start session' });
    }
  }

  // Handle emotion updates
  private async handleEmotionUpdate(socket: Socket, data: { sessionId: string; emotionData: any }): Promise<void> {
    try {
      const sessionState = this.activeSessions.get(data.sessionId);
      if (!sessionState) {
        return;
      }

      // Add to emotion buffer
      sessionState.emotionBuffer.push({
        timestamp: Date.now(),
        emotion: data.emotionData.emotion,
        confidence: data.emotionData.confidence,
        source: data.emotionData.source,
      });

      // Keep only last 100 emotion data points
      if (sessionState.emotionBuffer.length > 100) {
        sessionState.emotionBuffer = sessionState.emotionBuffer.slice(-100);
      }

      // Broadcast emotion update to session participants
      socket.to(`session-${data.sessionId}`).emit('emotion-update', data.emotionData);

      // Generate coaching tips based on emotions
      if (sessionState.emotionBuffer.length % 10 === 0) {
        const recentEmotions = sessionState.emotionBuffer.slice(-10);
        const tip = this.generateCoachingTip(recentEmotions);
        
        if (tip) {
          this.io.to(`session-${data.sessionId}`).emit('coaching-tip', {
            sessionId: data.sessionId,
            tip: tip.message,
            type: tip.type,
          });
        }
      }
    } catch (error) {
      logger.error('Error handling emotion update:', error);
    }
  }

  // Handle answer submission
  private async handleAnswerSubmit(socket: Socket, data: { sessionId: string; questionId: string; answer: any }): Promise<void> {
    try {
      const userId = (socket as any).userId;
      
      // Save answer to database
      const [savedAnswer] = await db
        .insert(answers)
        .values({
          questionId: data.questionId,
          sessionId: data.sessionId,
          userId,
          text: data.answer.text,
          audioUrl: data.answer.audioUrl,
          videoUrl: data.answer.videoUrl,
          duration: data.answer.duration,
        })
        .returning();

      // Generate AI feedback
      const question = await db.query.questions.findFirst({
        where: eq(questions.id, data.questionId),
      });

      if (question) {
        const analysisResult = await AIService.analyzeAnswer({
          question: question.text,
          answer: data.answer.text,
          questionType: question.type as any,
          expectedKeywords: question.expectedKeywords || [],
        });

        // Save feedback to database
        await db.insert(feedback).values({
          answerId: savedAnswer.id,
          sessionId: data.sessionId,
          userId,
          category: 'content',
          score: analysisResult.score.toString(),
          feedback: analysisResult.feedback,
          suggestions: analysisResult.suggestions,
        });

        // Send feedback to client
        socket.emit('answer-feedback', {
          sessionId: data.sessionId,
          questionId: data.questionId,
          feedback,
        });
      }

      logger.info(`Answer submitted for session ${data.sessionId}, question ${data.questionId}`);
    } catch (error) {
      logger.error('Error handling answer submission:', error);
      socket.emit('error', { message: 'Failed to submit answer' });
    }
  }

  // Generate coaching tips based on emotion data
  private generateCoachingTip(emotions: Array<{ emotion: string; confidence: number }>): { message: string; type: string } | null {
    const nervousCount = emotions.filter(e => e.emotion === 'nervous').length;
    const confidenceAvg = emotions.filter(e => e.emotion === 'confident').reduce((sum, e) => sum + e.confidence, 0) / emotions.length;

    if (nervousCount > 5) {
      return {
        message: 'Take a deep breath and speak slowly. Remember, it\'s normal to feel nervous.',
        type: 'calming',
      };
    }

    if (confidenceAvg < 0.3) {
      return {
        message: 'Try to speak with more conviction. Believe in your abilities!',
        type: 'confidence',
      };
    }

    return null;
  }

  // Handle disconnect
  private handleDisconnect(socket: Socket): void {
    const userId = (socket as any).userId;
    const sessionId = this.userSessions.get(userId);
    
    if (sessionId) {
      this.handleLeaveSession(socket, sessionId);
    }
    
    logger.info(`WebSocket client disconnected: ${socket.id} (User: ${userId})`);
  }

  // Additional handler methods would go here...
  private handleSessionPause(socket: Socket, sessionId: string): void {
    // Implementation for session pause
  }

  private handleSessionResume(socket: Socket, sessionId: string): void {
    // Implementation for session resume
  }

  private async handleSessionEnd(socket: Socket, sessionId: string): Promise<void> {
    // Implementation for session end
  }

  private handleAnswerStart(socket: Socket, data: any): void {
    // Implementation for answer start
  }

  private handleMediaReady(socket: Socket, data: any): void {
    // Implementation for media ready
  }

  private handleMediaError(socket: Socket, data: any): void {
    // Implementation for media error
  }

  // Get active sessions count
  public getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }

  // Get session participants
  public getSessionParticipants(sessionId: string): string[] {
    const session = this.activeSessions.get(sessionId);
    return session ? Array.from(session.participants) : [];
  }

  // Broadcast message to session
  public broadcastToSession(sessionId: string, event: string, data: any): void {
    this.io.to(`session-${sessionId}`).emit(event, data);
  }
}

export default WebSocketService;
