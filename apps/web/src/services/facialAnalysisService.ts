/**
 * Facial Analysis Service
 * Provides comprehensive facial analysis including emotion detection, eye contact tracking, and engagement metrics
 * Note: This is a mock implementation for demonstration purposes
 */

interface EyeTrackingData {
  left: {
    center: { x: number; y: number }
    landmarks: Array<{ x: number; y: number }>
    isOpen: boolean
    aspectRatio: number
    pupilPosition: { x: number; y: number }
  }
  right: {
    center: { x: number; y: number }
    landmarks: Array<{ x: number; y: number }>
    isOpen: boolean
    aspectRatio: number
    pupilPosition: { x: number; y: number }
  }
}

interface FacialAnalysisResult {
  emotions: EmotionScores
  eyeContact: EyeContactMetrics
  headPose: HeadPoseData
  engagement: EngagementMetrics
  eyeTrackingData: EyeTrackingData
  confidence: number
  timestamp: number
  faceDetected: boolean
}

interface EmotionScores {
  happy: number
  sad: number
  angry: number
  surprised: number
  fearful: number
  disgusted: number
  neutral: number
}

interface EyeContactMetrics {
  isLookingAtCamera: boolean
  gazeDirection: { x: number; y: number }
  eyeContactDuration: number
  eyeContactFrequency: number
  averageGazeStability: number
  blinkRate: number
}

interface HeadPoseData {
  yaw: number    // Left-right rotation (-45 to 45 degrees)
  pitch: number  // Up-down rotation (-30 to 30 degrees)
  roll: number   // Tilt rotation (-30 to 30 degrees)
  stability: number
  isWellPositioned: boolean
}

interface EngagementMetrics {
  overallEngagement: number
  attentiveness: number
  expressiveness: number
  consistency: number
  professionalPresence: number
}

interface FacialAnalysisConfig {
  analysisInterval: number // ms between analyses
  historyLength: number    // number of results to keep in history
  confidenceThreshold: number
  enableDetailedLogging: boolean
}

class FacialAnalysisService {
  private isInitialized: boolean = false
  private modelLoadPromise: Promise<void> | null = null
  private analysisHistory: FacialAnalysisResult[] = []
  private videoElement: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private analysisInterval: number | null = null
  private eventHandlers: Map<string, Function[]> = new Map()
  
  private config: FacialAnalysisConfig = {
    analysisInterval: 500, // Analyze every 500ms
    historyLength: 240,    // Keep 2 minutes of history at 2Hz
    confidenceThreshold: 0.5,
    enableDetailedLogging: false
  }

  private blinkDetection = {
    lastBlinkTime: 0,
    blinkCount: 0,
    eyeAspectRatioHistory: [] as number[]
  }

  constructor(config?: Partial<FacialAnalysisConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return
    if (this.modelLoadPromise) return this.modelLoadPromise

    this.modelLoadPromise = this.loadModels()
    await this.modelLoadPromise
    this.isInitialized = true
  }

  private async loadModels(): Promise<void> {
    try {
      console.log('Loading facial analysis models...')

      // Mock model loading - in a real implementation, this would load ML models
      await new Promise(resolve => setTimeout(resolve, 100))

      console.log('Face-api.js models loaded successfully')
      this.emit('models.loaded', { timestamp: Date.now() })
    } catch (error) {
      console.error('Failed to load face-api.js models:', error)
      throw new Error('Failed to initialize facial analysis models')
    }
  }

  async startAnalysis(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    this.videoElement = videoElement
    this.canvas = document.createElement('canvas')
    this.analysisHistory = []
    this.resetBlinkDetection()

    // Start continuous analysis
    this.analysisInterval = window.setInterval(() => {
      this.performAnalysis()
    }, this.config.analysisInterval)

    this.emit('analysis.started', { timestamp: Date.now() })
  }

  stopAnalysis(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
      this.analysisInterval = null
    }
    
    this.analysisHistory = []
    this.resetBlinkDetection()
    this.emit('analysis.stopped', { timestamp: Date.now() })
  }

  private async performAnalysis(): Promise<void> {
    if (!this.videoElement || !this.canvas) return

    try {
      // Mock facial analysis - in a real implementation, this would use ML models
      const mockDetections = this.generateMockDetections()
      const result = await this.analyzeDetections(mockDetections)

      this.analysisHistory.push(result)

      // Keep only recent history
      if (this.analysisHistory.length > this.config.historyLength) {
        this.analysisHistory = this.analysisHistory.slice(-this.config.historyLength)
      }

      // Emit analysis result
      this.emit('analysis.result', result)

      if (this.config.enableDetailedLogging) {
        console.log('Facial analysis result:', result)
      }

    } catch (error) {
      console.error('Error in facial analysis:', error)
      this.emit('analysis.error', { error, timestamp: Date.now() })
    }
  }

  private generateMockDetections(): any[] {
    // Generate mock detection data for demonstration
    return [{
      detection: {
        box: { x: 100, y: 100, width: 200, height: 200 },
        score: 0.95
      },
      landmarks: {
        positions: Array.from({ length: 68 }, (_, i) => ({ x: 100 + i, y: 100 + i }))
      },
      expressions: {
        neutral: 0.7,
        happy: 0.2,
        sad: 0.05,
        angry: 0.02,
        fearful: 0.01,
        disgusted: 0.01,
        surprised: 0.01
      },
      ageAndGender: {
        age: 25,
        gender: 'male',
        genderProbability: 0.8
      }
    }]
  }

  private async analyzeDetections(detections: any[]): Promise<FacialAnalysisResult> {
    const timestamp = Date.now()

    if (detections.length === 0) {
      return this.createEmptyResult(timestamp)
    }

    const detection = detections[0] // Use first detected face
    const emotions = this.normalizeEmotions(detection.expressions)
    const eyeContact = this.analyzeEyeContact(detection.landmarks)
    const headPose = this.calculateHeadPose(detection.landmarks)
    const eyeTrackingData = this.extractEyeTrackingData(detection.landmarks)
    const engagement = this.calculateEngagement(emotions, eyeContact, headPose)

    return {
      emotions,
      eyeContact,
      headPose,
      engagement,
      eyeTrackingData,
      confidence: detection.detection.score,
      timestamp,
      faceDetected: true
    }
  }

  private createEmptyResult(timestamp: number): FacialAnalysisResult {
    const emptyEyeData = {
      center: { x: 0, y: 0 },
      landmarks: [],
      isOpen: false,
      aspectRatio: 0,
      pupilPosition: { x: 0, y: 0 }
    }

    return {
      emotions: { happy: 0, sad: 0, angry: 0, surprised: 0, fearful: 0, disgusted: 0, neutral: 1 },
      eyeContact: {
        isLookingAtCamera: false,
        gazeDirection: { x: 0, y: 0 },
        eyeContactDuration: 0,
        eyeContactFrequency: 0,
        averageGazeStability: 0,
        blinkRate: 0
      },
      headPose: { yaw: 0, pitch: 0, roll: 0, stability: 0, isWellPositioned: false },
      engagement: { overallEngagement: 0, attentiveness: 0, expressiveness: 0, consistency: 0, professionalPresence: 0 },
      eyeTrackingData: { left: emptyEyeData, right: emptyEyeData },
      confidence: 0,
      timestamp,
      faceDetected: false
    }
  }

  private normalizeEmotions(expressions: any): EmotionScores {
    return {
      happy: expressions.happy || 0,
      sad: expressions.sad || 0,
      angry: expressions.angry || 0,
      surprised: expressions.surprised || 0,
      fearful: expressions.fearful || 0,
      disgusted: expressions.disgusted || 0,
      neutral: expressions.neutral || 0
    }
  }

  private analyzeEyeContact(landmarks: any): EyeContactMetrics {
    const leftEye = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()
    const nose = landmarks.getNose()

    // Calculate eye centers
    const leftEyeCenter = this.getEyeCenter(leftEye)
    const rightEyeCenter = this.getEyeCenter(rightEye)
    const noseCenter = nose[3] // Nose tip

    // Estimate gaze direction
    const gazeDirection = this.estimateGazeDirection(leftEyeCenter, rightEyeCenter, noseCenter)
    const isLookingAtCamera = this.isLookingAtCamera(gazeDirection)

    // Calculate blink rate
    const blinkRate = this.calculateBlinkRate(leftEye, rightEye)

    // Calculate metrics based on recent history
    const recentHistory = this.analysisHistory.slice(-20) // Last 10 seconds
    const eyeContactDuration = this.calculateEyeContactDuration(recentHistory)
    const eyeContactFrequency = this.calculateEyeContactFrequency(recentHistory)
    const gazeStability = this.calculateGazeStability(recentHistory)

    return {
      isLookingAtCamera,
      gazeDirection,
      eyeContactDuration,
      eyeContactFrequency,
      averageGazeStability: gazeStability,
      blinkRate
    }
  }

  private getEyeCenter(eyePoints: any[]): { x: number; y: number } {
    const x = eyePoints.reduce((sum, point) => sum + point.x, 0) / eyePoints.length
    const y = eyePoints.reduce((sum, point) => sum + point.y, 0) / eyePoints.length
    return { x, y }
  }

  private estimateGazeDirection(leftEye: any, rightEye: any, nose: any): { x: number; y: number } {
    // Simplified gaze estimation based on eye and nose positions
    const eyeCenter = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2
    }

    // Normalize relative to face center
    return {
      x: (nose.x - eyeCenter.x) / 100,
      y: (nose.y - eyeCenter.y) / 100
    }
  }

  private isLookingAtCamera(gazeDirection: { x: number; y: number }): boolean {
    const threshold = 0.3
    return Math.abs(gazeDirection.x) < threshold && Math.abs(gazeDirection.y) < threshold
  }

  private calculateBlinkRate(leftEye: any[], rightEye: any[]): number {
    // Calculate Eye Aspect Ratio (EAR)
    const leftEAR = this.calculateEyeAspectRatio(leftEye)
    const rightEAR = this.calculateEyeAspectRatio(rightEye)
    const avgEAR = (leftEAR + rightEAR) / 2

    this.blinkDetection.eyeAspectRatioHistory.push(avgEAR)
    
    // Keep only recent history (last 30 frames = ~15 seconds)
    if (this.blinkDetection.eyeAspectRatioHistory.length > 30) {
      this.blinkDetection.eyeAspectRatioHistory.shift()
    }

    // Detect blink (EAR drops below threshold)
    const blinkThreshold = 0.25
    const now = Date.now()
    
    if (avgEAR < blinkThreshold && (now - this.blinkDetection.lastBlinkTime) > 200) {
      this.blinkDetection.blinkCount++
      this.blinkDetection.lastBlinkTime = now
    }

    // Calculate blinks per minute
    const timeWindow = Math.min(now - (this.blinkDetection.lastBlinkTime - 60000), 60000)
    return timeWindow > 0 ? (this.blinkDetection.blinkCount / timeWindow) * 60000 : 0
  }

  private calculateEyeAspectRatio(eyePoints: any[]): number {
    // Calculate Eye Aspect Ratio using landmark points
    if (eyePoints.length < 6) return 0.3 // Default open eye ratio

    const p1 = eyePoints[1]
    const p2 = eyePoints[5]
    const p3 = eyePoints[2]
    const p4 = eyePoints[4]
    const p5 = eyePoints[0]
    const p6 = eyePoints[3]

    // Vertical distances
    const vertical1 = Math.sqrt(Math.pow(p2.x - p6.x, 2) + Math.pow(p2.y - p6.y, 2))
    const vertical2 = Math.sqrt(Math.pow(p3.x - p5.x, 2) + Math.pow(p3.y - p5.y, 2))
    
    // Horizontal distance
    const horizontal = Math.sqrt(Math.pow(p1.x - p4.x, 2) + Math.pow(p1.y - p4.y, 2))

    return (vertical1 + vertical2) / (2 * horizontal)
  }

  private extractEyeTrackingData(landmarks: any): EyeTrackingData {
    const leftEye = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()

    const leftEyeCenter = this.getEyeCenter(leftEye)
    const rightEyeCenter = this.getEyeCenter(rightEye)

    const leftEAR = this.calculateEyeAspectRatio(leftEye)
    const rightEAR = this.calculateEyeAspectRatio(rightEye)

    // Estimate pupil position (simplified - in production use more sophisticated methods)
    const leftPupilPosition = this.estimatePupilPosition(leftEye, leftEyeCenter)
    const rightPupilPosition = this.estimatePupilPosition(rightEye, rightEyeCenter)

    return {
      left: {
        center: leftEyeCenter,
        landmarks: leftEye.map((point: any) => ({ x: point.x, y: point.y })),
        isOpen: leftEAR > 0.25,
        aspectRatio: leftEAR,
        pupilPosition: leftPupilPosition
      },
      right: {
        center: rightEyeCenter,
        landmarks: rightEye.map((point: any) => ({ x: point.x, y: point.y })),
        isOpen: rightEAR > 0.25,
        aspectRatio: rightEAR,
        pupilPosition: rightPupilPosition
      }
    }
  }

  private estimatePupilPosition(eyePoints: any[], eyeCenter: { x: number; y: number }): { x: number; y: number } {
    // Simplified pupil estimation - in production, use more sophisticated iris/pupil detection
    // For now, assume pupil is at eye center with slight random variation for demonstration
    return {
      x: eyeCenter.x + (Math.random() - 0.5) * 2,
      y: eyeCenter.y + (Math.random() - 0.5) * 2
    }
  }

  private calculateHeadPose(landmarks: any): HeadPoseData {
    const nose = landmarks.getNose()
    const leftEye = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()
    const mouth = landmarks.getMouth()

    const noseCenter = nose[3]
    const leftEyeCenter = this.getEyeCenter(leftEye)
    const rightEyeCenter = this.getEyeCenter(rightEye)
    const mouthCenter = this.getEyeCenter(mouth)

    // Calculate angles (simplified 2D estimation)
    const yaw = Math.atan2(noseCenter.x - (leftEyeCenter.x + rightEyeCenter.x) / 2, 100) * 180 / Math.PI
    const pitch = Math.atan2(noseCenter.y - (leftEyeCenter.y + rightEyeCenter.y) / 2, 100) * 180 / Math.PI
    const roll = Math.atan2(rightEyeCenter.y - leftEyeCenter.y, rightEyeCenter.x - leftEyeCenter.x) * 180 / Math.PI

    // Clamp angles to reasonable ranges
    const clampedYaw = Math.max(-45, Math.min(45, yaw))
    const clampedPitch = Math.max(-30, Math.min(30, pitch))
    const clampedRoll = Math.max(-30, Math.min(30, roll))

    const stability = this.calculateHeadStability()
    const isWellPositioned = Math.abs(clampedYaw) < 15 && Math.abs(clampedPitch) < 10 && Math.abs(clampedRoll) < 10

    return {
      yaw: clampedYaw,
      pitch: clampedPitch,
      roll: clampedRoll,
      stability,
      isWellPositioned
    }
  }

  private calculateEngagement(
    emotions: EmotionScores,
    eyeContact: EyeContactMetrics,
    headPose: HeadPoseData
  ): EngagementMetrics {
    // Calculate individual metrics
    const expressiveness = 1 - emotions.neutral // Higher when showing emotions
    const attentiveness = eyeContact.isLookingAtCamera ? 1 : 0.5
    const posture = headPose.isWellPositioned ? 1 : 0.7
    const consistency = this.calculateConsistency()
    
    // Professional presence combines multiple factors
    const professionalPresence = (
      (headPose.isWellPositioned ? 0.3 : 0) +
      (eyeContact.eyeContactDuration > 0.6 ? 0.3 : eyeContact.eyeContactDuration * 0.5) +
      (emotions.happy > 0.1 ? 0.2 : 0) +
      (emotions.neutral > 0.3 ? 0.2 : 0)
    )

    const overallEngagement = (
      expressiveness * 0.25 + 
      attentiveness * 0.35 + 
      posture * 0.2 + 
      consistency * 0.2
    )

    return {
      overallEngagement: Math.max(0, Math.min(1, overallEngagement)),
      attentiveness,
      expressiveness,
      consistency,
      professionalPresence: Math.max(0, Math.min(1, professionalPresence))
    }
  }

  private calculateEyeContactDuration(history: FacialAnalysisResult[]): number {
    if (history.length === 0) return 0
    
    const eyeContactFrames = history.filter(h => h.eyeContact.isLookingAtCamera).length
    return (eyeContactFrames / history.length) * 100 // Percentage
  }

  private calculateEyeContactFrequency(history: FacialAnalysisResult[]): number {
    if (history.length < 2) return 0

    let transitions = 0
    for (let i = 1; i < history.length; i++) {
      if (history[i].eyeContact.isLookingAtCamera !== history[i-1].eyeContact.isLookingAtCamera) {
        transitions++
      }
    }

    return transitions / (history.length - 1) // Transitions per frame
  }

  private calculateGazeStability(history: FacialAnalysisResult[]): number {
    if (history.length < 2) return 1

    let totalVariation = 0
    for (let i = 1; i < history.length; i++) {
      const prev = history[i-1].eyeContact.gazeDirection
      const curr = history[i].eyeContact.gazeDirection
      
      const variation = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      )
      totalVariation += variation
    }

    const averageVariation = totalVariation / (history.length - 1)
    return Math.max(0, 1 - averageVariation) // Higher stability = lower variation
  }

  private calculateHeadStability(): number {
    const recentHistory = this.analysisHistory.slice(-10)
    if (recentHistory.length < 2) return 1

    let totalMovement = 0
    for (let i = 1; i < recentHistory.length; i++) {
      const prev = recentHistory[i-1].headPose
      const curr = recentHistory[i].headPose
      
      const movement = Math.sqrt(
        Math.pow(curr.yaw - prev.yaw, 2) +
        Math.pow(curr.pitch - prev.pitch, 2) +
        Math.pow(curr.roll - prev.roll, 2)
      )
      totalMovement += movement
    }

    const averageMovement = totalMovement / (recentHistory.length - 1)
    return Math.max(0, 1 - averageMovement / 30) // Normalize by expected max movement
  }

  private calculateConsistency(): number {
    const recentHistory = this.analysisHistory.slice(-20)
    if (recentHistory.length < 5) return 1

    // Calculate consistency in engagement over time
    const engagementScores = recentHistory.map(h => h.engagement.overallEngagement)
    const mean = engagementScores.reduce((sum, score) => sum + score, 0) / engagementScores.length
    const variance = engagementScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / engagementScores.length
    const standardDeviation = Math.sqrt(variance)

    return Math.max(0, 1 - standardDeviation) // Lower deviation = higher consistency
  }

  private resetBlinkDetection(): void {
    this.blinkDetection = {
      lastBlinkTime: Date.now(),
      blinkCount: 0,
      eyeAspectRatioHistory: []
    }
  }

  // Public API methods
  getAnalysisSummary(): {
    averageEngagement: number
    emotionalRange: EmotionScores
    eyeContactPercentage: number
    headPoseStability: number
    professionalPresence: number
    faceDetectionRate: number
  } {
    if (this.analysisHistory.length === 0) {
      return {
        averageEngagement: 0,
        emotionalRange: { happy: 0, sad: 0, angry: 0, surprised: 0, fearful: 0, disgusted: 0, neutral: 1 },
        eyeContactPercentage: 0,
        headPoseStability: 0,
        professionalPresence: 0,
        faceDetectionRate: 0
      }
    }

    const validResults = this.analysisHistory.filter(h => h.faceDetected)
    const faceDetectionRate = (validResults.length / this.analysisHistory.length) * 100

    if (validResults.length === 0) {
      return {
        averageEngagement: 0,
        emotionalRange: { happy: 0, sad: 0, angry: 0, surprised: 0, fearful: 0, disgusted: 0, neutral: 1 },
        eyeContactPercentage: 0,
        headPoseStability: 0,
        professionalPresence: 0,
        faceDetectionRate
      }
    }

    const avgEngagement = validResults.reduce((sum, h) => sum + h.engagement.overallEngagement, 0) / validResults.length
    const eyeContactFrames = validResults.filter(h => h.eyeContact.isLookingAtCamera).length
    const eyeContactPercentage = (eyeContactFrames / validResults.length) * 100

    // Calculate average emotions
    const emotionalRange = validResults.reduce((acc, h) => {
      Object.keys(h.emotions).forEach(emotion => {
        acc[emotion as keyof EmotionScores] += h.emotions[emotion as keyof EmotionScores]
      })
      return acc
    }, { happy: 0, sad: 0, angry: 0, surprised: 0, fearful: 0, disgusted: 0, neutral: 0 })

    Object.keys(emotionalRange).forEach(emotion => {
      emotionalRange[emotion as keyof EmotionScores] /= validResults.length
    })

    const avgHeadStability = validResults.reduce((sum, h) => sum + h.headPose.stability, 0) / validResults.length
    const avgProfessionalPresence = validResults.reduce((sum, h) => sum + h.engagement.professionalPresence, 0) / validResults.length

    return {
      averageEngagement: avgEngagement,
      emotionalRange,
      eyeContactPercentage,
      headPoseStability: avgHeadStability,
      professionalPresence: avgProfessionalPresence,
      faceDetectionRate
    }
  }

  getCurrentResult(): FacialAnalysisResult | null {
    return this.analysisHistory.length > 0 ? this.analysisHistory[this.analysisHistory.length - 1] : null
  }

  async analyzeFace(imageData: ImageData): Promise<FacialAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      // Mock facial analysis for single frame - in a real implementation, this would use ML models
      const mockDetections = this.generateMockDetections()
      const result = await this.analyzeDetections(mockDetections)

      return result
    } catch (error) {
      console.error('Error analyzing face:', error)
      return this.createEmptyResult(Date.now())
    }
  }

  getAnalysisHistory(): FacialAnalysisResult[] {
    return [...this.analysisHistory]
  }

  updateConfig(newConfig: Partial<FacialAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  getConfig(): FacialAnalysisConfig {
    return { ...this.config }
  }

  isServiceInitialized(): boolean {
    return this.isInitialized
  }

  isAnalysisActive(): boolean {
    return this.analysisInterval !== null
  }

  // Event handling
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error(`Error in facial analysis event handler for ${event}:`, error)
      }
    })
  }

  // Cleanup
  destroy(): void {
    this.stopAnalysis()
    this.eventHandlers.clear()
    this.analysisHistory = []
    this.resetBlinkDetection()
    this.isInitialized = false
    this.modelLoadPromise = null
  }
}

export { 
  FacialAnalysisService, 
  type FacialAnalysisResult, 
  type EmotionScores, 
  type EyeContactMetrics,
  type HeadPoseData,
  type EngagementMetrics,
  type FacialAnalysisConfig
}
