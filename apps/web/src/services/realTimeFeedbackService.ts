import { RealTimeFeedbackData, FeedbackAlert } from '@/components/interview/RealTimeFeedback'

export interface AudioAnalysisData {
  volume: number
  pitch: number
  pace: number
  clarity: number
  fillerWords: string[]
  pauseLength: number
}

export interface VideoAnalysisData {
  eyeContact: number
  posture: number
  gestures: number
  facialExpressions: {
    confidence: number
    nervousness: number
    engagement: number
  }
  headMovement: number
}

export interface ContentAnalysisData {
  relevance: number
  structure: number
  keywordMatch: number
  depth: number
  examples: number
}

class RealTimeFeedbackService {
  private feedbackHistory: RealTimeFeedbackData[] = []
  private alertHistory: FeedbackAlert[] = []
  private analysisInterval: NodeJS.Timeout | null = null
  private callbacks: ((data: RealTimeFeedbackData, alerts: FeedbackAlert[]) => void)[] = []

  // Start real-time analysis
  startAnalysis(mediaStream: MediaStream, options: {
    enableAudio: boolean
    enableVideo: boolean
    analysisInterval: number
  }) {
    this.stopAnalysis() // Stop any existing analysis

    this.analysisInterval = setInterval(() => {
      this.performAnalysis(mediaStream, options)
    }, options.analysisInterval)
  }

  // Stop real-time analysis
  stopAnalysis() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
      this.analysisInterval = null
    }
  }

  // Subscribe to feedback updates
  subscribe(callback: (data: RealTimeFeedbackData, alerts: FeedbackAlert[]) => void) {
    this.callbacks.push(callback)
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback)
    }
  }

  // Perform analysis on current media stream
  private async performAnalysis(mediaStream: MediaStream, options: {
    enableAudio: boolean
    enableVideo: boolean
  }) {
    try {
      const audioData = options.enableAudio ? await this.analyzeAudio(mediaStream) : null
      const videoData = options.enableVideo ? await this.analyzeVideo(mediaStream) : null
      
      const feedbackData = this.generateFeedbackData(audioData, videoData)
      const alerts = this.generateAlerts(feedbackData, audioData, videoData)
      
      this.feedbackHistory.push(feedbackData)
      this.alertHistory.push(...alerts)
      
      // Keep only recent history
      this.feedbackHistory = this.feedbackHistory.slice(-50)
      this.alertHistory = this.alertHistory.slice(-20)
      
      // Notify subscribers
      this.callbacks.forEach(callback => callback(feedbackData, alerts))
    } catch (error) {
      console.error('Error performing real-time analysis:', error)
    }
  }

  // Analyze audio stream
  private async analyzeAudio(mediaStream: MediaStream): Promise<AudioAnalysisData> {
    // In a real implementation, this would use Web Audio API
    // For now, we'll simulate the analysis
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          volume: Math.random() * 40 + 60, // 60-100
          pitch: Math.random() * 30 + 70,  // 70-100
          pace: Math.random() * 40 + 60,   // 60-100
          clarity: Math.random() * 30 + 70, // 70-100
          fillerWords: this.detectFillerWords(),
          pauseLength: Math.random() * 3 + 1 // 1-4 seconds
        })
      }, 100)
    })
  }

  // Analyze video stream
  private async analyzeVideo(mediaStream: MediaStream): Promise<VideoAnalysisData> {
    // In a real implementation, this would use computer vision
    // For now, we'll simulate the analysis
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          eyeContact: Math.random() * 40 + 60, // 60-100
          posture: Math.random() * 30 + 70,    // 70-100
          gestures: Math.random() * 50 + 50,   // 50-100
          facialExpressions: {
            confidence: Math.random() * 40 + 60,
            nervousness: Math.random() * 30 + 10,
            engagement: Math.random() * 30 + 70
          },
          headMovement: Math.random() * 20 + 80 // 80-100
        })
      }, 150)
    })
  }

  // Generate comprehensive feedback data
  private generateFeedbackData(
    audioData: AudioAnalysisData | null,
    videoData: VideoAnalysisData | null
  ): RealTimeFeedbackData {
    const confidence = this.calculateConfidence(audioData, videoData)
    const clarity = audioData?.clarity || 75
    const pace = audioData?.pace || 75
    const eyeContact = videoData?.eyeContact || 75
    const posture = videoData?.posture || 75
    const fillerWords = audioData?.fillerWords.length || 0
    const engagement = this.calculateEngagement(audioData, videoData)

    return {
      confidence,
      clarity,
      pace,
      eyeContact,
      posture,
      fillerWords,
      engagement,
      timestamp: Date.now()
    }
  }

  // Generate contextual alerts and tips
  private generateAlerts(
    feedbackData: RealTimeFeedbackData,
    audioData: AudioAnalysisData | null,
    videoData: VideoAnalysisData | null
  ): FeedbackAlert[] {
    const alerts: FeedbackAlert[] = []
    const timestamp = Date.now()

    // Confidence alerts
    if (feedbackData.confidence < 50) {
      alerts.push({
        id: `confidence-${timestamp}`,
        type: 'warning',
        category: 'content',
        message: 'Your confidence seems low. Take a deep breath and speak with conviction.',
        action: 'Try sitting up straighter and making more eye contact',
        priority: 'high',
        timestamp
      })
    }

    // Eye contact alerts
    if (feedbackData.eyeContact < 60) {
      alerts.push({
        id: `eyecontact-${timestamp}`,
        type: 'tip',
        category: 'body',
        message: 'Remember to maintain eye contact with the camera.',
        action: 'Look directly at the camera lens, not the screen',
        priority: 'medium',
        timestamp
      })
    }

    // Speaking pace alerts
    if (feedbackData.pace < 50) {
      alerts.push({
        id: `pace-slow-${timestamp}`,
        type: 'tip',
        category: 'voice',
        message: 'You\'re speaking quite slowly. Try to pick up the pace slightly.',
        action: 'Aim for 150-160 words per minute',
        priority: 'medium',
        timestamp
      })
    } else if (feedbackData.pace > 90) {
      alerts.push({
        id: `pace-fast-${timestamp}`,
        type: 'warning',
        category: 'voice',
        message: 'You\'re speaking very quickly. Slow down for better clarity.',
        action: 'Take pauses between sentences',
        priority: 'high',
        timestamp
      })
    }

    // Filler words alerts
    if (feedbackData.fillerWords > 3) {
      alerts.push({
        id: `filler-${timestamp}`,
        type: 'warning',
        category: 'voice',
        message: `You're using too many filler words (${feedbackData.fillerWords}/min).`,
        action: 'Pause instead of saying "um" or "uh"',
        priority: 'medium',
        timestamp
      })
    }

    // Posture alerts
    if (feedbackData.posture < 60) {
      alerts.push({
        id: `posture-${timestamp}`,
        type: 'tip',
        category: 'body',
        message: 'Check your posture. Sit up straight and lean slightly forward.',
        action: 'Adjust your chair height and camera angle',
        priority: 'medium',
        timestamp
      })
    }

    // Clarity alerts
    if (feedbackData.clarity < 60) {
      alerts.push({
        id: `clarity-${timestamp}`,
        type: 'warning',
        category: 'voice',
        message: 'Your speech clarity could be improved.',
        action: 'Speak more slowly and articulate clearly',
        priority: 'high',
        timestamp
      })
    }

    // Positive reinforcement
    if (feedbackData.confidence > 80 && feedbackData.eyeContact > 80) {
      alerts.push({
        id: `success-${timestamp}`,
        type: 'success',
        category: 'content',
        message: 'Excellent! You\'re showing great confidence and eye contact.',
        priority: 'low',
        timestamp
      })
    }

    return alerts
  }

  // Calculate overall confidence score
  private calculateConfidence(
    audioData: AudioAnalysisData | null,
    videoData: VideoAnalysisData | null
  ): number {
    let score = 75 // Base score

    if (audioData) {
      score += (audioData.volume - 70) * 0.3
      score += (audioData.pitch - 70) * 0.2
      score -= audioData.fillerWords.length * 2
    }

    if (videoData) {
      score += (videoData.eyeContact - 70) * 0.4
      score += (videoData.posture - 70) * 0.3
      score += (videoData.facialExpressions.confidence - 70) * 0.5
      score -= (videoData.facialExpressions.nervousness - 20) * 0.3
    }

    return Math.max(0, Math.min(100, score))
  }

  // Calculate engagement score
  private calculateEngagement(
    audioData: AudioAnalysisData | null,
    videoData: VideoAnalysisData | null
  ): number {
    let score = 70 // Base score

    if (audioData) {
      score += (audioData.volume - 60) * 0.2
      score += (audioData.pace - 60) * 0.1
    }

    if (videoData) {
      score += (videoData.gestures - 50) * 0.2
      score += videoData.facialExpressions.engagement * 0.4
      score += (videoData.eyeContact - 60) * 0.3
    }

    return Math.max(0, Math.min(100, score))
  }

  // Simulate filler word detection
  private detectFillerWords(): string[] {
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'actually']
    const detected: string[] = []
    
    // Randomly detect 0-3 filler words
    const count = Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      detected.push(fillerWords[Math.floor(Math.random() * fillerWords.length)])
    }
    
    return detected
  }

  // Get historical data for trends
  getHistoricalData(): RealTimeFeedbackData[] {
    return [...this.feedbackHistory]
  }

  // Get recent alerts
  getRecentAlerts(): FeedbackAlert[] {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    return this.alertHistory.filter(alert => alert.timestamp > fiveMinutesAgo)
  }

  // Clear all data
  clearData() {
    this.feedbackHistory = []
    this.alertHistory = []
  }
}

export const realTimeFeedbackService = new RealTimeFeedbackService()
export default realTimeFeedbackService
