// Frontend WebRTC Interview Client
// Handles real-time video/audio communication and analysis

export interface InterviewClientConfig {
  wsUrl: string
  stunServers?: string[]
  turnServers?: Array<{
    urls: string
    username?: string
    credential?: string
  }>
  mediaConstraints?: {
    video: boolean | MediaTrackConstraints
    audio: boolean | MediaTrackConstraints
  }
  analysisEnabled?: boolean
  recordingEnabled?: boolean
}

export interface ParticipantInfo {
  id: string
  userId: string
  role: 'interviewer' | 'candidate' | 'observer'
  isConnected: boolean
  capabilities: {
    video: boolean
    audio: boolean
    screenShare: boolean
  }
}

export interface RealTimeFeedback {
  engagement: number
  confidence: number
  speechRate: number
  eyeContact: number
  facialSentiment: number
  voiceEnergy: number
  responseQuality: number
  timestamp: number
}

export class WebRTCInterviewClient extends EventTarget {
  private ws: WebSocket | null = null
  private peerConnections: Map<string, RTCPeerConnection> = new Map()
  private localStream: MediaStream | null = null
  private remoteStreams: Map<string, MediaStream> = new Map()
  private connectionId: string | null = null
  private sessionId: string | null = null
  private participantId: string | null = null
  private config: InterviewClientConfig
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5

  constructor(config: InterviewClientConfig) {
    super()
    this.config = {
      stunServers: ['stun:stun.l.google.com:19302'],
      mediaConstraints: {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      },
      analysisEnabled: true,
      recordingEnabled: true,
      ...config
    }
  }

  /**
   * Connect to WebRTC server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.wsUrl)
        
        this.ws.onopen = () => {
          console.log('🔌 Connected to WebRTC server')
          this.isConnected = true
          this.reconnectAttempts = 0
          this.dispatchEvent(new CustomEvent('connected'))
        }

        this.ws.onmessage = (event) => {
          this.handleServerMessage(JSON.parse(event.data))
        }

        this.ws.onclose = (event) => {
          console.log('🔌 Disconnected from WebRTC server')
          this.isConnected = false
          this.handleDisconnection(event)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }

        // Wait for connection confirmation
        const handleConnected = (event: any) => {
          if (event.detail?.connectionId) {
            this.connectionId = event.detail.connectionId
            resolve()
          }
        }

        this.addEventListener('connected', handleConnected, { once: true })

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Join interview room
   */
  async joinRoom(
    sessionId: string,
    userId: string,
    role: 'interviewer' | 'candidate' | 'observer' = 'candidate',
    capabilities: { video: boolean; audio: boolean; screenShare: boolean } = {
      video: true,
      audio: true,
      screenShare: false
    }
  ): Promise<void> {
    if (!this.ws || !this.isConnected) {
      throw new Error('Not connected to server')
    }

    this.sessionId = sessionId

    // Get user media
    await this.getUserMedia()

    // Send join room request
    this.sendMessage({
      type: 'joinRoom',
      data: {
        sessionId,
        userId,
        role,
        capabilities
      }
    })
  }

  /**
   * Get user media (camera/microphone)
   */
  async getUserMedia(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(
        this.config.mediaConstraints as MediaStreamConstraints
      )

      console.log('📹 Got user media:', {
        video: this.localStream.getVideoTracks().length > 0,
        audio: this.localStream.getAudioTracks().length > 0
      })

      // Start real-time analysis if enabled
      if (this.config.analysisEnabled) {
        this.startRealTimeAnalysis()
      }

      this.dispatchEvent(new CustomEvent('localStreamReady', {
        detail: { stream: this.localStream }
      }))

      return this.localStream

    } catch (error) {
      console.error('Error getting user media:', error)
      throw error
    }
  }

  /**
   * Start real-time media analysis
   */
  private startRealTimeAnalysis(): void {
    if (!this.localStream) return

    // Audio analysis
    const audioTrack = this.localStream.getAudioTracks()[0]
    if (audioTrack) {
      this.startAudioAnalysis(audioTrack)
    }

    // Video analysis  
    const videoTrack = this.localStream.getVideoTracks()[0]
    if (videoTrack) {
      this.startVideoAnalysis(videoTrack)
    }
  }

  /**
   * Start audio analysis for real-time feedback
   */
  private startAudioAnalysis(audioTrack: MediaStreamTrack): void {
    try {
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]))
      const analyser = audioContext.createAnalyser()
      
      analyser.fftSize = 256
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      const analyze = () => {
        if (audioTrack.readyState === 'live') {
          analyser.getByteFrequencyData(dataArray)
          
          // Calculate voice energy
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          const voiceEnergy = average / 255

          // Send to server for analysis
          if (voiceEnergy > 0.1) { // Only send when there's actual audio
            this.sendMessage({
              type: 'mediaData',
              data: {
                sessionId: this.sessionId,
                type: 'audio',
                chunk: dataArray.buffer,
                timestamp: Date.now()
              }
            })
          }

          requestAnimationFrame(analyze)
        }
      }
      
      analyze()

    } catch (error) {
      console.error('Error starting audio analysis:', error)
    }
  }

  /**
   * Start video analysis for real-time feedback
   */
  private startVideoAnalysis(videoTrack: MediaStreamTrack): void {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = document.createElement('video')
      
      video.srcObject = new MediaStream([videoTrack])
      video.play()

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const captureFrame = () => {
          if (videoTrack.readyState === 'live' && ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            
            // Get image data for analysis
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            
            // Send frame for analysis (throttled to ~2 FPS)
            if (Date.now() % 500 < 50) {
              this.sendMessage({
                type: 'mediaData',
                data: {
                  sessionId: this.sessionId,
                  type: 'video',
                  chunk: imageData.data.buffer,
                  timestamp: Date.now()
                }
              })
            }

            requestAnimationFrame(captureFrame)
          }
        }
        
        captureFrame()
      }

    } catch (error) {
      console.error('Error starting video analysis:', error)
    }
  }

  /**
   * Handle server messages
   */
  private async handleServerMessage(message: any): Promise<void> {
    const { type, data } = message

    switch (type) {
      case 'connected':
        this.connectionId = data?.connectionId
        this.dispatchEvent(new CustomEvent('connected', { detail: data }))
        break

      case 'joinedRoom':
        this.participantId = data.participantId
        this.dispatchEvent(new CustomEvent('joinedRoom', { detail: data }))
        break

      case 'participantJoined':
        await this.handleParticipantJoined(data.participant)
        break

      case 'participantLeft':
        this.handleParticipantLeft(data.participantId)
        break

      case 'offer':
        await this.handleOffer(data)
        break

      case 'answer':
        await this.handleAnswer(data)
        break

      case 'iceCandidate':
        await this.handleIceCandidate(data)
        break

      case 'realTimeFeedback':
        this.handleRealTimeFeedback(data.data)
        break

      case 'streamAdded':
        this.handleStreamAdded(data)
        break

      case 'error':
        console.error('Server error:', data.error)
        this.dispatchEvent(new CustomEvent('error', { detail: data }))
        break

      default:
        console.warn('Unknown message type:', type)
    }
  }

  /**
   * Handle new participant joining
   */
  private async handleParticipantJoined(participant: ParticipantInfo): Promise<void> {
    console.log('👤 Participant joined:', participant)

    // Create peer connection for new participant
    const peerConnection = this.createPeerConnection(participant.id)
    this.peerConnections.set(participant.id, peerConnection)

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!)
      })
    }

    // Create and send offer
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: participant.capabilities.audio,
      offerToReceiveVideo: participant.capabilities.video
    })

    await peerConnection.setLocalDescription(offer)

    this.sendMessage({
      type: 'offer',
      data: {
        sessionId: this.sessionId,
        targetParticipantId: participant.id,
        offer
      }
    })

    this.dispatchEvent(new CustomEvent('participantJoined', { detail: participant }))
  }

  /**
   * Handle participant leaving
   */
  private handleParticipantLeft(participantId: string): void {
    console.log('👤 Participant left:', participantId)

    const peerConnection = this.peerConnections.get(participantId)
    if (peerConnection) {
      peerConnection.close()
      this.peerConnections.delete(participantId)
    }

    const remoteStream = this.remoteStreams.get(participantId)
    if (remoteStream) {
      this.remoteStreams.delete(participantId)
    }

    this.dispatchEvent(new CustomEvent('participantLeft', { detail: { participantId } }))
  }

  /**
   * Create RTCPeerConnection with optimal configuration
   */
  private createPeerConnection(participantId: string): RTCPeerConnection {
    const config: RTCConfiguration = {
      iceServers: [
        ...this.config.stunServers!.map(url => ({ urls: url })),
        ...(this.config.turnServers || [])
      ],
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    }

    const peerConnection = new RTCPeerConnection(config)

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendMessage({
          type: 'iceCandidate',
          data: {
            sessionId: this.sessionId,
            candidate: event.candidate
          }
        })
      }
    }

    // Handle remote streams
    peerConnection.ontrack = (event) => {
      console.log('📺 Received remote track:', event.track.kind)
      
      const remoteStream = event.streams[0]
      this.remoteStreams.set(participantId, remoteStream)

      this.dispatchEvent(new CustomEvent('remoteStreamAdded', {
        detail: {
          participantId,
          stream: remoteStream,
          track: event.track
        }
      }))
    }

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer connection state for ${participantId}: ${peerConnection.connectionState}`)
      
      this.dispatchEvent(new CustomEvent('connectionStateChange', {
        detail: {
          participantId,
          state: peerConnection.connectionState
        }
      }))
    }

    return peerConnection
  }

  /**
   * Handle WebRTC offer
   */
  private async handleOffer(data: any): Promise<void> {
    const { fromParticipant, offer } = data
    
    try {
      let peerConnection = this.peerConnections.get(fromParticipant)
      
      if (!peerConnection) {
        peerConnection = this.createPeerConnection(fromParticipant)
        this.peerConnections.set(fromParticipant, peerConnection)
      }

      await peerConnection.setRemoteDescription(offer)
      
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      this.sendMessage({
        type: 'answer',
        data: {
          sessionId: this.sessionId,
          fromParticipant: this.participantId,
          answer
        }
      })

    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  /**
   * Handle WebRTC answer
   */
  private async handleAnswer(data: any): Promise<void> {
    const { fromParticipant, answer } = data
    
    try {
      const peerConnection = this.peerConnections.get(fromParticipant)
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer)
      }
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  /**
   * Handle ICE candidate
   */
  private async handleIceCandidate(data: any): Promise<void> {
    const { fromParticipant, candidate } = data
    
    try {
      const peerConnection = this.peerConnections.get(fromParticipant)
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate)
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
  }

  /**
   * Handle real-time feedback
   */
  private handleRealTimeFeedback(feedback: RealTimeFeedback): void {
    this.dispatchEvent(new CustomEvent('realTimeFeedback', { detail: feedback }))
  }

  /**
   * Handle stream added
   */
  private handleStreamAdded(data: any): void {
    this.dispatchEvent(new CustomEvent('streamAdded', { detail: data }))
  }

  /**
   * Handle disconnection with reconnection logic
   */
  private handleDisconnection(event: CloseEvent): void {
    this.dispatchEvent(new CustomEvent('disconnected', { detail: event }))

    // Attempt reconnection if not intentional
    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000)
      
      console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`)
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error)
        })
      }, delay)
    }
  }

  /**
   * Send message to server
   */
  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('Cannot send message: WebSocket not connected')
    }
  }

  /**
   * Mute/unmute audio
   */
  toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false

    const audioTracks = this.localStream.getAudioTracks()
    const isEnabled = enabled !== undefined ? enabled : !audioTracks[0]?.enabled

    audioTracks.forEach(track => {
      track.enabled = isEnabled
    })

    this.dispatchEvent(new CustomEvent('audioToggled', { detail: { enabled: isEnabled } }))
    return isEnabled
  }

  /**
   * Enable/disable video
   */
  toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false

    const videoTracks = this.localStream.getVideoTracks()
    const isEnabled = enabled !== undefined ? enabled : !videoTracks[0]?.enabled

    videoTracks.forEach(track => {
      track.enabled = isEnabled
    })

    this.dispatchEvent(new CustomEvent('videoToggled', { detail: { enabled: isEnabled } }))
    return isEnabled
  }

  /**
   * Get connection statistics
   */
  async getConnectionStats(): Promise<Map<string, RTCStatsReport>> {
    const stats = new Map<string, RTCStatsReport>()
    
    for (const [participantId, peerConnection] of this.peerConnections) {
      try {
        const report = await peerConnection.getStats()
        stats.set(participantId, report)
      } catch (error) {
        console.error(`Error getting stats for ${participantId}:`, error)
      }
    }
    
    return stats
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    // Close all peer connections
    this.peerConnections.forEach(pc => pc.close())
    this.peerConnections.clear()

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.isConnected = false
    this.sessionId = null
    this.participantId = null
    this.connectionId = null

    console.log('🔌 Disconnected from interview platform')
  }

  /**
   * Get current state
   */
  getState(): {
    isConnected: boolean
    sessionId: string | null
    participantId: string | null
    participantCount: number
    hasLocalStream: boolean
    hasAudio: boolean
    hasVideo: boolean
  } {
    return {
      isConnected: this.isConnected,
      sessionId: this.sessionId,
      participantId: this.participantId,
      participantCount: this.peerConnections.size,
      hasLocalStream: !!this.localStream,
      hasAudio: this.localStream?.getAudioTracks().some(t => t.enabled) || false,
      hasVideo: this.localStream?.getVideoTracks().some(t => t.enabled) || false
    }
  }
}

export default WebRTCInterviewClient
