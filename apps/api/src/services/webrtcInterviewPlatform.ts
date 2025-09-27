// Enterprise WebRTC Interview Platform
// Implements SFU architecture with real-time processing capabilities

import { EventEmitter } from 'events'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { db } from '../database/connection'
import { interviewSessions, sessionAnalytics } from '../database/schema-v2'
import { eq } from 'drizzle-orm'
import MultiModalAnalysisEngine from './multiModalAnalysisEngine'

// WebRTC Configuration
interface RTCConfiguration {
  iceServers: RTCIceServer[]
  iceTransportPolicy: 'all' | 'relay'
  bundlePolicy: 'balanced' | 'max-compat' | 'max-bundle'
  rtcpMuxPolicy: 'negotiate' | 'require'
}

// Interview Session Types
interface InterviewParticipant {
  id: string
  userId: string
  role: 'interviewer' | 'candidate' | 'observer'
  connectionId: string
  peerConnection?: RTCPeerConnection
  mediaStreams: Map<string, MediaStream>
  isConnected: boolean
  quality: 'low' | 'medium' | 'high'
  capabilities: {
    video: boolean
    audio: boolean
    screenShare: boolean
  }
}

interface InterviewRoom {
  sessionId: string
  participants: Map<string, InterviewParticipant>
  state: 'waiting' | 'active' | 'paused' | 'ended'
  configuration: {
    maxParticipants: number
    recordingEnabled: boolean
    transcriptionEnabled: boolean
    analysisEnabled: boolean
  }
  mediaProcessor: MediaProcessor
  startTime?: Date
  endTime?: Date
}

// Media Processing Types
interface MediaChunk {
  participantId: string
  type: 'audio' | 'video'
  data: ArrayBuffer
  timestamp: number
  sequenceNumber: number
}

interface ProcessingResult {
  transcription?: string
  sentiment?: any
  engagement?: number
  qualityMetrics?: any
}

export class WebRTCInterviewPlatform extends EventEmitter {
  private rooms: Map<string, InterviewRoom> = new Map()
  private connections: Map<string, WebSocket> = new Map()
  private wsServer: WebSocketServer
  private analysisEngine: MultiModalAnalysisEngine
  private mediaProcessor: MediaProcessor

  constructor(port: number = 8082) {
    super()
    
    // Initialize WebSocket server
    const server = createServer()
    this.wsServer = new WebSocketServer({ server })
    
    // Initialize analysis engine
    this.analysisEngine = new MultiModalAnalysisEngine()
    this.mediaProcessor = new MediaProcessor()
    
    // Setup WebSocket handling
    this.setupWebSocketHandlers()
    
    // Start server
    server.listen(port, () => {
      console.log(`🎥 WebRTC Interview Platform running on port ${port}`)
    })
  }

  /**
   * Create new interview room
   */
  async createInterviewRoom(
    sessionId: string,
    configuration: {
      maxParticipants?: number
      recordingEnabled?: boolean
      transcriptionEnabled?: boolean
      analysisEnabled?: boolean
    } = {}
  ): Promise<InterviewRoom> {
    try {
      // Validate session exists
      const session = await db.query.interviewSessions.findFirst({
        where: eq(interviewSessions.id, sessionId)
      })

      if (!session) {
        throw new Error(`Interview session ${sessionId} not found`)
      }

      // Create room
      const room: InterviewRoom = {
        sessionId,
        participants: new Map(),
        state: 'waiting',
        configuration: {
          maxParticipants: configuration.maxParticipants || 10,
          recordingEnabled: configuration.recordingEnabled ?? true,
          transcriptionEnabled: configuration.transcriptionEnabled ?? true,
          analysisEnabled: configuration.analysisEnabled ?? true
        },
        mediaProcessor: new MediaProcessor()
      }

      this.rooms.set(sessionId, room)
      
      console.log(`✅ Created interview room for session ${sessionId}`)
      
      // Emit room created event
      this.emit('roomCreated', { sessionId, room })
      
      return room

    } catch (error) {
      console.error('Error creating interview room:', error)
      throw error
    }
  }

  /**
   * Join interview room
   */
  async joinRoom(
    sessionId: string,
    userId: string,
    connectionId: string,
    role: 'interviewer' | 'candidate' | 'observer' = 'candidate',
    capabilities: { video: boolean; audio: boolean; screenShare: boolean } = {
      video: true,
      audio: true,
      screenShare: false
    }
  ): Promise<InterviewParticipant> {
    try {
      const room = this.rooms.get(sessionId)
      
      if (!room) {
        throw new Error(`Interview room ${sessionId} not found`)
      }

      if (room.participants.size >= room.configuration.maxParticipants) {
        throw new Error('Interview room is full')
      }

      // Create participant
      const participant: InterviewParticipant = {
        id: `${userId}_${Date.now()}`,
        userId,
        role,
        connectionId,
        mediaStreams: new Map(),
        isConnected: false,
        quality: 'high',
        capabilities
      }

      // Add to room
      room.participants.set(participant.id, participant)
      
      console.log(`👤 User ${userId} joined room ${sessionId} as ${role}`)
      
      // Notify other participants
      this.broadcastToRoom(sessionId, {
        type: 'participantJoined',
        participant: {
          id: participant.id,
          userId: participant.userId,
          role: participant.role,
          capabilities: participant.capabilities
        }
      }, participant.id)

      // Emit participant joined event
      this.emit('participantJoined', { sessionId, participant })
      
      return participant

    } catch (error) {
      console.error('Error joining room:', error)
      throw error
    }
  }

  /**
   * Setup WebSocket message handlers
   */
  private setupWebSocketHandlers(): void {
    this.wsServer.on('connection', (ws: WebSocket, request) => {
      const connectionId = this.generateConnectionId()
      this.connections.set(connectionId, ws)
      
      console.log(`🔌 New WebSocket connection: ${connectionId}`)

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        connectionId
      }))

      // Handle messages
      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())
          await this.handleWebSocketMessage(connectionId, message)
        } catch (error) {
          console.error('Error handling WebSocket message:', error)
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Invalid message format'
          }))
        }
      })

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(connectionId)
      })

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${connectionId}:`, error)
        this.handleDisconnection(connectionId)
      })
    })
  }

  /**
   * Handle WebSocket messages
   */
  private async handleWebSocketMessage(connectionId: string, message: any): Promise<void> {
    const { type, data } = message

    switch (type) {
      case 'joinRoom':
        await this.handleJoinRoom(connectionId, data)
        break
        
      case 'offer':
        await this.handleOffer(connectionId, data)
        break
        
      case 'answer':
        await this.handleAnswer(connectionId, data)
        break
        
      case 'iceCandidate':
        await this.handleIceCandidate(connectionId, data)
        break
        
      case 'mediaData':
        await this.handleMediaData(connectionId, data)
        break
        
      case 'startRecording':
        await this.handleStartRecording(connectionId, data)
        break
        
      case 'stopRecording':
        await this.handleStopRecording(connectionId, data)
        break
        
      case 'qualityChange':
        await this.handleQualityChange(connectionId, data)
        break
        
      default:
        console.warn(`Unknown message type: ${type}`)
    }
  }

  /**
   * Handle join room request
   */
  private async handleJoinRoom(connectionId: string, data: any): Promise<void> {
    try {
      const { sessionId, userId, role, capabilities } = data
      
      // Ensure room exists
      if (!this.rooms.has(sessionId)) {
        await this.createInterviewRoom(sessionId)
      }
      
      // Join room
      const participant = await this.joinRoom(sessionId, userId, connectionId, role, capabilities)
      
      // Send success response
      const ws = this.connections.get(connectionId)
      if (ws) {
        ws.send(JSON.stringify({
          type: 'joinedRoom',
          data: {
            sessionId,
            participantId: participant.id,
            room: this.getRoomInfo(sessionId)
          }
        }))
      }

    } catch (error) {
      const ws = this.connections.get(connectionId)
      if (ws) {
        ws.send(JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Failed to join room'
        }))
      }
    }
  }

  /**
   * Handle WebRTC offer
   */
  private async handleOffer(connectionId: string, data: any): Promise<void> {
    const { sessionId, targetParticipantId, offer } = data
    
    try {
      const room = this.rooms.get(sessionId)
      if (!room) {
        throw new Error('Room not found')
      }

      const participant = this.findParticipantByConnection(sessionId, connectionId)
      if (!participant) {
        throw new Error('Participant not found')
      }

      // Create peer connection if it doesn't exist
      if (!participant.peerConnection) {
        participant.peerConnection = this.createPeerConnection(sessionId, participant.id)
      }

      // Set remote description
      await participant.peerConnection.setRemoteDescription(offer)
      
      // Create and send answer
      const answer = await participant.peerConnection.createAnswer()
      await participant.peerConnection.setLocalDescription(answer)

      // Send answer to target participant
      this.sendToParticipant(sessionId, targetParticipantId, {
        type: 'answer',
        answer,
        fromParticipant: participant.id
      })

    } catch (error) {
      console.error('Error handling offer:', error)
      const ws = this.connections.get(connectionId)
      if (ws) {
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Failed to process offer'
        }))
      }
    }
  }

  /**
   * Handle WebRTC answer
   */
  private async handleAnswer(connectionId: string, data: any): Promise<void> {
    const { sessionId, fromParticipant, answer } = data
    
    try {
      const participant = this.findParticipantByConnection(sessionId, connectionId)
      if (!participant?.peerConnection) {
        throw new Error('Peer connection not found')
      }

      await participant.peerConnection.setRemoteDescription(answer)

    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  /**
   * Handle ICE candidate
   */
  private async handleIceCandidate(connectionId: string, data: any): Promise<void> {
    const { sessionId, candidate } = data
    
    try {
      const participant = this.findParticipantByConnection(sessionId, connectionId)
      if (!participant?.peerConnection) {
        return
      }

      await participant.peerConnection.addIceCandidate(candidate)

    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
  }

  /**
   * Handle media data for real-time processing
   */
  private async handleMediaData(connectionId: string, data: any): Promise<void> {
    try {
      const { sessionId, type, chunk, timestamp } = data
      
      const participant = this.findParticipantByConnection(sessionId, connectionId)
      if (!participant) {
        return
      }

      const room = this.rooms.get(sessionId)
      if (!room || !room.configuration.analysisEnabled) {
        return
      }

      // Process media chunk
      const mediaChunk: MediaChunk = {
        participantId: participant.id,
        type,
        data: chunk,
        timestamp,
        sequenceNumber: Date.now()
      }

      // Send to media processor
      const result = await room.mediaProcessor.processChunk(mediaChunk)
      
      if (result) {
        // Store analytics
        await this.storeRealTimeAnalytics(sessionId, participant.id, result)
        
        // Send real-time feedback
        this.sendToParticipant(sessionId, participant.id, {
          type: 'realTimeFeedback',
          data: result
        })
      }

    } catch (error) {
      console.error('Error processing media data:', error)
    }
  }

  /**
   * Create RTCPeerConnection with optimal configuration
   */
  private createPeerConnection(sessionId: string, participantId: string): RTCPeerConnection {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Add TURN servers for production
        // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
      ],
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    }

    const pc = new RTCPeerConnection(config as any)

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.broadcastToRoom(sessionId, {
          type: 'iceCandidate',
          candidate: event.candidate,
          fromParticipant: participantId
        }, participantId)
      }
    }

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Peer connection state for ${participantId}: ${pc.connectionState}`)
      
      if (pc.connectionState === 'connected') {
        this.updateParticipantConnection(sessionId, participantId, true)
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.updateParticipantConnection(sessionId, participantId, false)
      }
    }

    // Handle incoming streams
    pc.ontrack = (event) => {
      const participant = this.findParticipantById(sessionId, participantId)
      if (participant) {
        participant.mediaStreams.set(event.track.kind, event.streams[0])
        
        // Notify other participants about new stream
        this.broadcastToRoom(sessionId, {
          type: 'streamAdded',
          participantId,
          streamType: event.track.kind
        }, participantId)
      }
    }

    return pc
  }

  /**
   * Broadcast message to all participants in room
   */
  private broadcastToRoom(sessionId: string, message: any, excludeParticipant?: string): void {
    const room = this.rooms.get(sessionId)
    if (!room) return

    room.participants.forEach((participant) => {
      if (participant.id !== excludeParticipant) {
        this.sendToParticipant(sessionId, participant.id, message)
      }
    })
  }

  /**
   * Send message to specific participant
   */
  private sendToParticipant(sessionId: string, participantId: string, message: any): void {
    const participant = this.findParticipantById(sessionId, participantId)
    if (!participant) return

    const ws = this.connections.get(participant.connectionId)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  /**
   * Store real-time analytics
   */
  private async storeRealTimeAnalytics(
    sessionId: string, 
    participantId: string, 
    result: ProcessingResult
  ): Promise<void> {
    try {
      await db.insert(sessionAnalytics).values({
        sessionId,
        timestamp: new Date(),
        metrics: {
          engagement: result.engagement || 0,
          confidence: result.sentiment?.confidence || 0,
          speechRate: 0, // Would be calculated from audio
          eyeContact: 0, // Would be calculated from video
          facialSentiment: result.sentiment?.overall === 'positive' ? 0.8 : 0.5,
          voiceEnergy: 0, // Would be calculated from audio
          responseQuality: 0.7 // Would be calculated from content analysis
        },
        cumulativeStats: {
          avgEngagement: result.engagement || 0,
          avgConfidence: result.sentiment?.confidence || 0,
          totalPauses: 0,
          totalFillerWords: 0,
          questionsCompleted: 0,
          timeElapsed: 0
        }
      })
    } catch (error) {
      console.error('Error storing real-time analytics:', error)
    }
  }

  /**
   * Helper methods
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private findParticipantByConnection(sessionId: string, connectionId: string): InterviewParticipant | undefined {
    const room = this.rooms.get(sessionId)
    if (!room) return undefined

    for (const participant of room.participants.values()) {
      if (participant.connectionId === connectionId) {
        return participant
      }
    }
    return undefined
  }

  private findParticipantById(sessionId: string, participantId: string): InterviewParticipant | undefined {
    const room = this.rooms.get(sessionId)
    return room?.participants.get(participantId)
  }

  private updateParticipantConnection(sessionId: string, participantId: string, isConnected: boolean): void {
    const participant = this.findParticipantById(sessionId, participantId)
    if (participant) {
      participant.isConnected = isConnected
      
      // Notify room about connection change
      this.broadcastToRoom(sessionId, {
        type: 'participantConnectionChanged',
        participantId,
        isConnected
      })
    }
  }

  private getRoomInfo(sessionId: string): any {
    const room = this.rooms.get(sessionId)
    if (!room) return null

    return {
      sessionId: room.sessionId,
      state: room.state,
      participantCount: room.participants.size,
      configuration: room.configuration,
      participants: Array.from(room.participants.values()).map(p => ({
        id: p.id,
        userId: p.userId,
        role: p.role,
        isConnected: p.isConnected,
        capabilities: p.capabilities
      }))
    }
  }

  private handleDisconnection(connectionId: string): void {
    console.log(`🔌 Connection ${connectionId} disconnected`)
    
    // Find and remove participant from all rooms
    for (const [sessionId, room] of this.rooms.entries()) {
      for (const [participantId, participant] of room.participants.entries()) {
        if (participant.connectionId === connectionId) {
          // Close peer connection
          if (participant.peerConnection) {
            participant.peerConnection.close()
          }
          
          // Remove from room
          room.participants.delete(participantId)
          
          // Notify other participants
          this.broadcastToRoom(sessionId, {
            type: 'participantLeft',
            participantId
          })
          
          console.log(`👤 Participant ${participantId} left room ${sessionId}`)
          break
        }
      }
    }
    
    // Remove connection
    this.connections.delete(connectionId)
  }

  // Placeholder methods for additional handlers
  private async handleStartRecording(connectionId: string, data: any): Promise<void> {
    // Implementation for starting recording
  }

  private async handleStopRecording(connectionId: string, data: any): Promise<void> {
    // Implementation for stopping recording
  }

  private async handleQualityChange(connectionId: string, data: any): Promise<void> {
    // Implementation for quality adaptation
  }
}

/**
 * Media Processor for real-time analysis
 */
class MediaProcessor {
  async processChunk(chunk: MediaChunk): Promise<ProcessingResult | null> {
    try {
      // This would integrate with the MultiModalAnalysisEngine
      // For now, return mock data
      
      if (chunk.type === 'audio') {
        return {
          transcription: 'Sample transcription...',
          sentiment: {
            overall: 'positive',
            confidence: 0.8
          },
          engagement: 0.7
        }
      }
      
      if (chunk.type === 'video') {
        return {
          engagement: 0.8,
          qualityMetrics: {
            lighting: 0.9,
            stability: 0.8
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('Error processing media chunk:', error)
      return null
    }
  }
}

export default WebRTCInterviewPlatform
