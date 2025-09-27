export interface RecordingSegment {
  id: string
  startTime: number
  endTime: number
  questionId: string
  questionText: string
  audioBlob?: Blob
  videoBlob?: Blob
  transcript?: string
  analysis?: {
    confidence: number
    clarity: number
    pace: number
    fillerWords: number
    keyPoints: string[]
    improvements: string[]
  }
}

export interface RecordingSession {
  id: string
  userId: string
  sessionName: string
  startTime: Date
  endTime?: Date
  totalDuration: number
  segments: RecordingSegment[]
  overallScore: number
  metadata: {
    interviewType: string
    jobRole: string
    difficulty: string
    questions: number
  }
}

export interface TimestampedFeedback {
  timestamp: number
  type: 'tip' | 'warning' | 'success' | 'improvement'
  category: 'voice' | 'body' | 'content' | 'timing'
  message: string
  severity: 'low' | 'medium' | 'high'
}

class RecordingService {
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private currentSegment: RecordingSegment | null = null
  private recordingSession: RecordingSession | null = null
  private isRecording = false
  private startTime = 0

  // Start a new recording session
  async startSession(sessionData: {
    userId: string
    sessionName: string
    interviewType: string
    jobRole: string
    difficulty: string
  }): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.recordingSession = {
      id: sessionId,
      userId: sessionData.userId,
      sessionName: sessionData.sessionName,
      startTime: new Date(),
      totalDuration: 0,
      segments: [],
      overallScore: 0,
      metadata: {
        interviewType: sessionData.interviewType,
        jobRole: sessionData.jobRole,
        difficulty: sessionData.difficulty,
        questions: 0
      }
    }

    return sessionId
  }

  // Start recording a specific question segment
  async startRecording(
    mediaStream: MediaStream,
    questionId: string,
    questionText: string,
    options: {
      mimeType?: string
      videoBitsPerSecond?: number
      audioBitsPerSecond?: number
    } = {}
  ): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording already in progress')
    }

    if (!this.recordingSession) {
      throw new Error('No active recording session')
    }

    try {
      // Configure MediaRecorder options
      const recordingOptions: MediaRecorderOptions = {
        mimeType: options.mimeType || this.getSupportedMimeType(),
        videoBitsPerSecond: options.videoBitsPerSecond || 2500000, // 2.5 Mbps
        audioBitsPerSecond: options.audioBitsPerSecond || 128000   // 128 kbps
      }

      this.mediaRecorder = new MediaRecorder(mediaStream, recordingOptions)
      this.recordedChunks = []
      this.startTime = Date.now()

      // Create new segment
      this.currentSegment = {
        id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: this.startTime,
        endTime: 0,
        questionId,
        questionText
      }

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop()
      }

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        this.isRecording = false
      }

      // Start recording
      this.mediaRecorder.start(1000) // Collect data every second
      this.isRecording = true

    } catch (error) {
      console.error('Error starting recording:', error)
      throw error
    }
  }

  // Stop recording current segment
  async stopRecording(): Promise<RecordingSegment | null> {
    if (!this.isRecording || !this.mediaRecorder || !this.currentSegment) {
      return null
    }

    return new Promise((resolve) => {
      const segment = this.currentSegment!
      
      this.mediaRecorder!.onstop = () => {
        const finalSegment = this.handleRecordingStop()
        resolve(finalSegment)
      }

      this.mediaRecorder!.stop()
      this.isRecording = false
    })
  }

  // Handle recording stop and process the recorded data
  private handleRecordingStop(): RecordingSegment | null {
    if (!this.currentSegment || this.recordedChunks.length === 0) {
      return null
    }

    const endTime = Date.now()
    this.currentSegment.endTime = endTime

    // Create blob from recorded chunks
    const mimeType = this.mediaRecorder?.mimeType || 'video/webm'
    const recordedBlob = new Blob(this.recordedChunks, { type: mimeType })

    // Determine if it's video or audio only
    if (mimeType.startsWith('video/')) {
      this.currentSegment.videoBlob = recordedBlob
    } else {
      this.currentSegment.audioBlob = recordedBlob
    }

    // Add segment to session
    if (this.recordingSession) {
      this.recordingSession.segments.push(this.currentSegment)
      this.recordingSession.metadata.questions = this.recordingSession.segments.length
    }

    const completedSegment = { ...this.currentSegment }
    this.currentSegment = null
    this.recordedChunks = []

    return completedSegment
  }

  // End the recording session
  async endSession(): Promise<RecordingSession | null> {
    if (!this.recordingSession) {
      return null
    }

    // Stop any active recording
    if (this.isRecording) {
      await this.stopRecording()
    }

    // Calculate total duration and overall score
    this.recordingSession.endTime = new Date()
    this.recordingSession.totalDuration = this.recordingSession.segments.reduce(
      (total, segment) => total + (segment.endTime - segment.startTime),
      0
    )

    // Calculate overall score (placeholder logic)
    const scores = this.recordingSession.segments
      .map(segment => segment.analysis?.confidence || 75)
      .filter(score => score > 0)
    
    this.recordingSession.overallScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0

    const completedSession = { ...this.recordingSession }
    this.recordingSession = null

    return completedSession
  }

  // Get supported MIME type for recording
  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4'
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return 'video/webm' // Fallback
  }

  // Analyze recorded segment (placeholder for AI analysis)
  async analyzeSegment(segment: RecordingSegment): Promise<RecordingSegment> {
    // In a real implementation, this would send the audio/video to AI services
    // For now, we'll simulate the analysis
    
    const analysis = {
      confidence: Math.random() * 40 + 60, // 60-100
      clarity: Math.random() * 30 + 70,    // 70-100
      pace: Math.random() * 40 + 60,       // 60-100
      fillerWords: Math.floor(Math.random() * 5), // 0-4
      keyPoints: [
        'Good eye contact maintained',
        'Clear articulation of main points',
        'Relevant examples provided'
      ],
      improvements: [
        'Reduce speaking pace slightly',
        'Add more specific examples',
        'Improve posture and body language'
      ]
    }

    // Simulate transcript generation
    const transcript = `This is a simulated transcript for the question: "${segment.questionText}". The candidate provided a comprehensive answer covering the main points with relevant examples.`

    return {
      ...segment,
      analysis,
      transcript
    }
  }

  // Generate timestamped feedback for playback
  generateTimestampedFeedback(segment: RecordingSegment): TimestampedFeedback[] {
    const feedback: TimestampedFeedback[] = []
    const duration = segment.endTime - segment.startTime
    const analysis = segment.analysis

    if (!analysis) return feedback

    // Generate feedback based on analysis
    if (analysis.confidence < 70) {
      feedback.push({
        timestamp: Math.random() * duration * 0.3, // Early in the response
        type: 'warning',
        category: 'content',
        message: 'Consider speaking with more confidence',
        severity: 'medium'
      })
    }

    if (analysis.pace < 60) {
      feedback.push({
        timestamp: Math.random() * duration * 0.5, // Mid response
        type: 'tip',
        category: 'voice',
        message: 'Try to speak a bit faster for better engagement',
        severity: 'low'
      })
    }

    if (analysis.fillerWords > 2) {
      feedback.push({
        timestamp: Math.random() * duration * 0.7, // Later in response
        type: 'improvement',
        category: 'voice',
        message: 'Reduce filler words like "um" and "uh"',
        severity: 'medium'
      })
    }

    if (analysis.clarity > 85) {
      feedback.push({
        timestamp: Math.random() * duration * 0.8,
        type: 'success',
        category: 'voice',
        message: 'Excellent clarity and articulation!',
        severity: 'low'
      })
    }

    return feedback.sort((a, b) => a.timestamp - b.timestamp)
  }

  // Save recording to storage (placeholder)
  async saveRecording(session: RecordingSession): Promise<string> {
    // In a real implementation, this would upload to cloud storage
    // For now, we'll simulate saving and return a URL
    
    const sessionData = {
      ...session,
      // Convert blobs to base64 for storage simulation
      segments: session.segments.map(segment => ({
        ...segment,
        audioBlob: undefined, // Would be uploaded separately
        videoBlob: undefined  // Would be uploaded separately
      }))
    }

    // Simulate API call to save session
    console.log('Saving recording session:', sessionData)
    
    return `recording_${session.id}`
  }

  // Load recording from storage (placeholder)
  async loadRecording(recordingId: string): Promise<RecordingSession | null> {
    // In a real implementation, this would fetch from API/storage
    // For now, return null to indicate not found
    console.log('Loading recording:', recordingId)
    return null
  }

  // Get current recording status
  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      hasActiveSession: !!this.recordingSession,
      currentSegment: this.currentSegment,
      sessionId: this.recordingSession?.id
    }
  }

  // Clean up resources
  cleanup() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
    }
    
    this.mediaRecorder = null
    this.recordedChunks = []
    this.currentSegment = null
    this.recordingSession = null
    this.isRecording = false
  }
}

export const recordingService = new RecordingService()
export default recordingService
