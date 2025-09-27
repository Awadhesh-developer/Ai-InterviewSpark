// --- START web/lib/websocket.ts --- //
// WebSocket client for AI-InterviewSpark frontend
// Handles real-time communication for interview sessions, emotion updates, and live feedback

import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

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
  'session-status': (data: { sessionId: string; status: string; currentQuestionIndex?: number; participants?: string[] }) => void;
  
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

// Event listener type
type EventListener<T = any> = (data: T) => void;

export class WebSocketClient {
  private socket: Socket | null = null;
  private baseURL: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private eventListeners: Map<string, EventListener[]> = new Map();

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  }

  // Connect to WebSocket server
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(this.baseURL, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        this.isConnected = false;
        
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          this.handleReconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.isConnected = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.handleReconnect();
        } else {
          reject(new Error('Failed to connect to WebSocket server'));
        }
      });

      this.socket.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        toast.error(error.message || 'WebSocket error occurred');
        this.emitToListeners('error', error);
      });

      // Set up event forwarding
      this.setupEventForwarding();
    });
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 WebSocket disconnected');
    }
  }

  // Handle reconnection
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      toast.error('Connection lost. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  // Set up event forwarding to registered listeners
  private setupEventForwarding(): void {
    if (!this.socket) return;

    const events: (keyof WebSocketEvents)[] = [
      'session-status', 'question-ready', 'answer-feedback', 'emotion-update',
      'emotion-analysis', 'feedback-update', 'coaching-tip', 'peer-join',
      'peer-leave', 'expert-join', 'expert-message', 'media-ready', 'media-error'
    ];

    events.forEach(event => {
      this.socket!.on(event, (data: any) => {
        this.emitToListeners(event, data);
      });
    });
  }

  // Emit event to server
  emit<K extends keyof WebSocketEvents>(event: K, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`⚠️ Cannot emit ${event}: WebSocket not connected`);
    }
  }

  // Add event listener
  on<K extends keyof WebSocketEvents>(event: K, listener: EventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  // Remove event listener
  off<K extends keyof WebSocketEvents>(event: K, listener: EventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Remove all listeners for an event
  removeAllListeners<K extends keyof WebSocketEvents>(event?: K): void {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }

  // Emit to registered listeners
  private emitToListeners<K extends keyof WebSocketEvents>(event: K, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Session management methods
  joinSession(sessionId: string): void {
    this.emit('join-session', sessionId);
  }

  leaveSession(sessionId: string): void {
    this.emit('leave-session', sessionId);
  }

  startSession(sessionId: string): void {
    this.emit('session-start', sessionId);
  }

  pauseSession(sessionId: string): void {
    this.emit('session-pause', sessionId);
  }

  resumeSession(sessionId: string): void {
    this.emit('session-resume', sessionId);
  }

  endSession(sessionId: string): void {
    this.emit('session-end', sessionId);
  }

  // Answer management methods
  startAnswer(sessionId: string, questionId: string): void {
    this.emit('answer-start', { sessionId, questionId });
  }

  submitAnswer(sessionId: string, questionId: string, answer: any): void {
    this.emit('answer-submit', { sessionId, questionId, answer });
  }

  // Emotion and feedback methods
  sendEmotionUpdate(sessionId: string, emotionData: any): void {
    this.emit('emotion-update', { sessionId, emotionData });
  }

  sendMediaReady(sessionId: string, mediaType: 'audio' | 'video'): void {
    this.emit('media-ready', { sessionId, mediaType });
  }

  sendMediaError(sessionId: string, error: string): void {
    this.emit('media-error', { sessionId, error });
  }

  // Connection status
  isConnectedToServer(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Get connection status
  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
  } {
    return {
      connected: this.isConnectedToServer(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }
}

// Create and export singleton instance
export const websocketClient = new WebSocketClient();
export default websocketClient;
