/**
 * WebRTC Service for Real-Time Communication
 * Provides peer-to-peer video/audio communication with advanced streaming capabilities
 */

interface WebRTCConfig {
  iceServers: RTCIceServer[]
  videoConstraints: MediaStreamConstraints['video']
  audioConstraints: MediaStreamConstraints['audio']
  enableDataChannel: boolean
  enableScreenShare: boolean
  enableRecording: boolean
  bitrateLimit: number
  frameRate: number
}

interface ConnectionState {
  connectionState: RTCPeerConnectionState
  iceConnectionState: RTCIceConnectionState
  signalingState: RTCSignalingState
  isConnected: boolean
  isReconnecting: boolean
  lastConnectedAt: number
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor'
}

interface StreamQuality {
  video: {
    resolution: string
    frameRate: number
    bitrate: number
    packetsLost: number
    jitter: number
  }
  audio: {
    bitrate: number
    packetsLost: number
    jitter: number
    audioLevel: number
  }
  network: {
    rtt: number
    bandwidth: number
    packetLoss: number
  }
}

interface WebRTCCallbacks {
  onConnectionStateChange: (state: ConnectionState) => void
  onStreamReceived: (stream: MediaStream, type: 'video' | 'audio' | 'screen') => void
  onStreamEnded: (streamId: string) => void
  onDataChannelMessage: (data: any) => void
  onQualityChange: (quality: StreamQuality) => void
  onError: (error: Error) => void
}

interface RecordingOptions {
  video: boolean
  audio: boolean
  mimeType: string
  videoBitsPerSecond: number
  audioBitsPerSecond: number
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private screenStream: MediaStream | null = null
  private dataChannel: RTCDataChannel | null = null
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  
  private config: WebRTCConfig
  private callbacks: Partial<WebRTCCallbacks> = {}
  private connectionState: ConnectionState
  private streamQuality: StreamQuality
  private qualityMonitorInterval: number | null = null
  private isInitialized: boolean = false

  constructor(config: Partial<WebRTCConfig> = {}) {
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ],
      videoConstraints: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 60 },
        facingMode: 'user'
      },
      audioConstraints: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1
      },
      enableDataChannel: true,
      enableScreenShare: true,
      enableRecording: true,
      bitrateLimit: 2000000, // 2 Mbps
      frameRate: 30,
      ...config
    }

    this.connectionState = {
      connectionState: 'new',
      iceConnectionState: 'new',
      signalingState: 'stable',
      isConnected: false,
      isReconnecting: false,
      lastConnectedAt: 0,
      connectionQuality: 'good'
    }

    this.streamQuality = {
      video: {
        resolution: '1280x720',
        frameRate: 30,
        bitrate: 0,
        packetsLost: 0,
        jitter: 0
      },
      audio: {
        bitrate: 0,
        packetsLost: 0,
        jitter: 0,
        audioLevel: 0
      },
      network: {
        rtt: 0,
        bandwidth: 0,
        packetLoss: 0
      }
    }
  }

  async initialize(callbacks: Partial<WebRTCCallbacks> = {}): Promise<void> {
    if (this.isInitialized) return

    try {
      this.callbacks = callbacks
      await this.setupPeerConnection()
      this.isInitialized = true
      console.log('WebRTC Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize WebRTC Service:', error)
      throw error
    }
  }

  private async setupPeerConnection(): Promise<void> {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers,
      iceCandidatePoolSize: 10
    })

    // Set up event listeners
    this.peerConnection.onconnectionstatechange = () => {
      this.updateConnectionState()
    }

    this.peerConnection.oniceconnectionstatechange = () => {
      this.updateConnectionState()
    }

    this.peerConnection.onsignalingstatechange = () => {
      this.updateConnectionState()
    }

    this.peerConnection.ontrack = (event) => {
      const [stream] = event.streams
      this.remoteStream = stream
      this.callbacks.onStreamReceived?.(stream, 'video')
    }

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer via signaling server
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate
        })
      }
    }

    // Set up data channel if enabled
    if (this.config.enableDataChannel) {
      this.setupDataChannel()
    }

    // Start quality monitoring
    this.startQualityMonitoring()
  }

  private setupDataChannel(): void {
    if (!this.peerConnection) return

    this.dataChannel = this.peerConnection.createDataChannel('interview-data', {
      ordered: true,
      maxRetransmits: 3
    })

    this.dataChannel.onopen = () => {
      console.log('Data channel opened')
    }

    this.dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.callbacks.onDataChannelMessage?.(data)
      } catch (error) {
        console.error('Failed to parse data channel message:', error)
      }
    }

    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error)
    }

    // Handle incoming data channels
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel
      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.callbacks.onDataChannelMessage?.(data)
        } catch (error) {
          console.error('Failed to parse incoming data channel message:', error)
        }
      }
    }
  }

  async startLocalStream(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: this.config.videoConstraints,
        audio: this.config.audioConstraints
      })

      this.localStream = stream

      // Add tracks to peer connection
      if (this.peerConnection) {
        stream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, stream)
        })
      }

      // Apply bitrate constraints
      await this.applyBitrateConstraints()

      return stream
    } catch (error) {
      console.error('Failed to start local stream:', error)
      throw error
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    if (!this.config.enableScreenShare) {
      throw new Error('Screen sharing is disabled')
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: true
      })

      this.screenStream = stream

      // Replace video track in peer connection
      if (this.peerConnection && this.localStream) {
        const videoTrack = stream.getVideoTracks()[0]
        const sender = this.peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        )

        if (sender) {
          await sender.replaceTrack(videoTrack)
        }
      }

      // Handle screen share end
      stream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare()
      }

      this.callbacks.onStreamReceived?.(stream, 'screen')
      return stream
    } catch (error) {
      console.error('Failed to start screen share:', error)
      throw error
    }
  }

  async stopScreenShare(): Promise<void> {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop())
      this.screenStream = null

      // Restore camera video track
      if (this.peerConnection && this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0]
        const sender = this.peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        )

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack)
        }
      }
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })

      await this.peerConnection.setLocalDescription(offer)
      return offer
    } catch (error) {
      console.error('Failed to create offer:', error)
      throw error
    }
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      await this.peerConnection.setRemoteDescription(offer)
      
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)
      
      return answer
    } catch (error) {
      console.error('Failed to create answer:', error)
      throw error
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      await this.peerConnection.setRemoteDescription(answer)
    } catch (error) {
      console.error('Failed to handle answer:', error)
      throw error
    }
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      await this.peerConnection.addIceCandidate(candidate)
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error)
      throw error
    }
  }

  sendDataChannelMessage(data: any): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify(data))
      } catch (error) {
        console.error('Failed to send data channel message:', error)
      }
    }
  }

  async startRecording(options: Partial<RecordingOptions> = {}): Promise<void> {
    if (!this.config.enableRecording) {
      throw new Error('Recording is disabled')
    }

    const recordingOptions: RecordingOptions = {
      video: true,
      audio: true,
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: 2500000,
      audioBitsPerSecond: 128000,
      ...options
    }

    try {
      // Create composite stream for recording
      const recordingStream = new MediaStream()

      if (recordingOptions.video && this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0]
        if (videoTrack) recordingStream.addTrack(videoTrack)
      }

      if (recordingOptions.audio && this.localStream) {
        const audioTrack = this.localStream.getAudioTracks()[0]
        if (audioTrack) recordingStream.addTrack(audioTrack)
      }

      this.mediaRecorder = new MediaRecorder(recordingStream, {
        mimeType: recordingOptions.mimeType,
        videoBitsPerSecond: recordingOptions.videoBitsPerSecond,
        audioBitsPerSecond: recordingOptions.audioBitsPerSecond
      })

      this.recordedChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: recordingOptions.mimeType })
        this.downloadRecording(blob)
      }

      this.mediaRecorder.start(1000) // Collect data every second
      console.log('Recording started')
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
      console.log('Recording stopped')
    }
  }

  private downloadRecording(blob: Blob): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview-recording-${new Date().toISOString()}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  private async applyBitrateConstraints(): Promise<void> {
    if (!this.peerConnection) return

    const senders = this.peerConnection.getSenders()
    
    for (const sender of senders) {
      if (sender.track && sender.track.kind === 'video') {
        const params = sender.getParameters()
        
        if (!params.encodings) {
          params.encodings = [{}]
        }

        params.encodings[0].maxBitrate = this.config.bitrateLimit
        params.encodings[0].maxFramerate = this.config.frameRate

        try {
          await sender.setParameters(params)
        } catch (error) {
          console.error('Failed to set video parameters:', error)
        }
      }
    }
  }

  private updateConnectionState(): void {
    if (!this.peerConnection) return

    const newState: ConnectionState = {
      connectionState: this.peerConnection.connectionState,
      iceConnectionState: this.peerConnection.iceConnectionState,
      signalingState: this.peerConnection.signalingState,
      isConnected: this.peerConnection.connectionState === 'connected',
      isReconnecting: this.peerConnection.connectionState === 'connecting' && this.connectionState.isConnected,
      lastConnectedAt: this.peerConnection.connectionState === 'connected' ? Date.now() : this.connectionState.lastConnectedAt,
      connectionQuality: this.calculateConnectionQuality()
    }

    this.connectionState = newState
    this.callbacks.onConnectionStateChange?.(newState)
  }

  private calculateConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    const { rtt, packetLoss } = this.streamQuality.network
    
    if (rtt < 100 && packetLoss < 0.01) return 'excellent'
    if (rtt < 200 && packetLoss < 0.03) return 'good'
    if (rtt < 400 && packetLoss < 0.05) return 'fair'
    return 'poor'
  }

  private startQualityMonitoring(): void {
    this.qualityMonitorInterval = window.setInterval(async () => {
      await this.updateStreamQuality()
    }, 5000) // Update every 5 seconds
  }

  private async updateStreamQuality(): Promise<void> {
    if (!this.peerConnection) return

    try {
      const stats = await this.peerConnection.getStats()
      
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          this.streamQuality.video.bitrate = report.bytesReceived * 8 / report.timestamp * 1000
          this.streamQuality.video.packetsLost = report.packetsLost || 0
          this.streamQuality.video.jitter = report.jitter || 0
          this.streamQuality.video.frameRate = report.framesPerSecond || 0
        }
        
        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
          this.streamQuality.audio.bitrate = report.bytesReceived * 8 / report.timestamp * 1000
          this.streamQuality.audio.packetsLost = report.packetsLost || 0
          this.streamQuality.audio.jitter = report.jitter || 0
          this.streamQuality.audio.audioLevel = report.audioLevel || 0
        }
        
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          this.streamQuality.network.rtt = report.currentRoundTripTime * 1000 || 0
          this.streamQuality.network.bandwidth = report.availableOutgoingBitrate || 0
        }
      })

      // Calculate packet loss percentage
      const totalPackets = this.streamQuality.video.packetsLost + this.streamQuality.audio.packetsLost
      this.streamQuality.network.packetLoss = totalPackets > 0 ? totalPackets / 1000 : 0

      this.callbacks.onQualityChange?.(this.streamQuality)
    } catch (error) {
      console.error('Failed to update stream quality:', error)
    }
  }

  private sendSignalingMessage(message: any): void {
    // This would typically send to a signaling server
    // For now, we'll just log it
    console.log('Signaling message:', message)
  }

  // Public API methods
  getConnectionState(): ConnectionState {
    return { ...this.connectionState }
  }

  getStreamQuality(): StreamQuality {
    return { ...this.streamQuality }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }

  async toggleMute(): Promise<void> {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
      }
    }
  }

  async toggleVideo(): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
      }
    }
  }

  destroy(): void {
    // Stop quality monitoring
    if (this.qualityMonitorInterval) {
      clearInterval(this.qualityMonitorInterval)
      this.qualityMonitorInterval = null
    }

    // Stop recording
    this.stopRecording()

    // Stop streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop())
      this.screenStream = null
    }

    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close()
      this.dataChannel = null
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    this.isInitialized = false
    console.log('WebRTC Service destroyed')
  }
}

export { 
  WebRTCService,
  type WebRTCConfig,
  type ConnectionState,
  type StreamQuality,
  type WebRTCCallbacks,
  type RecordingOptions
}
