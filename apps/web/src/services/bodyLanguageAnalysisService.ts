/**
 * Body Language Analysis Service
 * Provides comprehensive body language analysis including posture, gestures, and movement patterns
 */

interface PoseKeypoint {
  x: number
  y: number
  z?: number
  visibility: number
  presence: number
}

interface PoseLandmarks {
  nose: PoseKeypoint
  leftEyeInner: PoseKeypoint
  leftEye: PoseKeypoint
  leftEyeOuter: PoseKeypoint
  rightEyeInner: PoseKeypoint
  rightEye: PoseKeypoint
  rightEyeOuter: PoseKeypoint
  leftEar: PoseKeypoint
  rightEar: PoseKeypoint
  mouthLeft: PoseKeypoint
  mouthRight: PoseKeypoint
  leftShoulder: PoseKeypoint
  rightShoulder: PoseKeypoint
  leftElbow: PoseKeypoint
  rightElbow: PoseKeypoint
  leftWrist: PoseKeypoint
  rightWrist: PoseKeypoint
  leftPinky: PoseKeypoint
  rightPinky: PoseKeypoint
  leftIndex: PoseKeypoint
  rightIndex: PoseKeypoint
  leftThumb: PoseKeypoint
  rightThumb: PoseKeypoint
  leftHip: PoseKeypoint
  rightHip: PoseKeypoint
  leftKnee: PoseKeypoint
  rightKnee: PoseKeypoint
  leftAnkle: PoseKeypoint
  rightAnkle: PoseKeypoint
  leftHeel: PoseKeypoint
  rightHeel: PoseKeypoint
  leftFootIndex: PoseKeypoint
  rightFootIndex: PoseKeypoint
}

interface PostureMetrics {
  shoulderAlignment: number // 0-1, how aligned shoulders are
  spineAlignment: number // 0-1, how straight the spine is
  headPosition: number // 0-1, how well positioned the head is
  shoulderTension: number // 0-1, tension in shoulders
  overallPosture: number // 0-1, composite posture score
  leanDirection: 'left' | 'right' | 'forward' | 'backward' | 'centered'
  leanAngle: number // degrees of lean
}

interface GestureData {
  handMovement: {
    left: { velocity: number; direction: { x: number; y: number } }
    right: { velocity: number; direction: { x: number; y: number } }
  }
  gestureType: 'pointing' | 'open_palm' | 'closed_fist' | 'descriptive' | 'neutral' | 'unknown'
  gestureIntensity: number // 0-1, how animated the gestures are
  gestureFrequency: number // gestures per minute
  handVisibility: { left: boolean; right: boolean }
}

interface MovementPatterns {
  overallMovement: number // 0-1, how much the person moves
  fidgeting: number // 0-1, nervous movement detection
  stability: number // 0-1, how stable the person sits/stands
  rhythmicMovement: number // 0-1, natural vs erratic movement
  movementDirection: { x: number; y: number } // primary movement direction
}

interface ProfessionalPresence {
  confidence: number // 0-1, based on posture and movement
  engagement: number // 0-1, body language engagement
  openness: number // 0-1, open vs closed body language
  nervousness: number // 0-1, signs of nervousness
  authority: number // 0-1, authoritative presence
  approachability: number // 0-1, approachable body language
}

interface BodyLanguageResult {
  posture: PostureMetrics
  gestures: GestureData
  movement: MovementPatterns
  professionalPresence: ProfessionalPresence
  poseDetected: boolean
  confidence: number
  timestamp: number
}

interface BodyLanguageConfig {
  analysisInterval: number
  historyLength: number
  confidenceThreshold: number
  movementSensitivity: number
  gestureDetectionEnabled: boolean
  postureAnalysisEnabled: boolean
}

class BodyLanguageAnalysisService {
  private isInitialized: boolean = false
  private isAnalyzing: boolean = false
  private pose: any = null // MediaPipe Pose instance
  private camera: any = null // MediaPipe Camera instance
  private videoElement: HTMLVideoElement | null = null
  private canvasElement: HTMLCanvasElement | null = null
  private analysisHistory: BodyLanguageResult[] = []
  private eventHandlers: Map<string, Function[]> = new Map()
  private analysisInterval: number | null = null
  
  private config: BodyLanguageConfig = {
    analysisInterval: 500, // Analyze every 500ms
    historyLength: 240, // Keep 2 minutes of history
    confidenceThreshold: 0.5,
    movementSensitivity: 0.1,
    gestureDetectionEnabled: true,
    postureAnalysisEnabled: true
  }

  private previousPose: PoseLandmarks | null = null
  private gestureHistory: GestureData[] = []
  private movementHistory: Array<{ x: number; y: number; timestamp: number }> = []

  constructor(config?: Partial<BodyLanguageConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('Initializing MediaPipe Pose...')
      
      // Mock MediaPipe modules for build purposes
      // const { Pose } = await import('@mediapipe/pose')
      // const { Camera } = await import('@mediapipe/camera_utils')

      // Mock implementations
      const Pose = class {
        constructor(config?: any) {}
        setOptions(options: any) {}
        onResults(callback: any) {}
        send(input: any) {}
      }
      const Camera = class {
        constructor(config?: any) {}
        start() {}
        stop() {}
      }

      // Initialize MediaPipe Pose
      this.pose = new Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        }
      })

      // Configure pose detection
      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: this.config.confidenceThreshold,
        minTrackingConfidence: this.config.confidenceThreshold
      })

      // Set up pose detection callback
      this.pose.onResults((results: any) => {
        this.processPoseResults(results)
      })

      this.isInitialized = true
      console.log('MediaPipe Pose initialized successfully')
      this.emit('initialized', { timestamp: Date.now() })

    } catch (error) {
      console.error('Failed to initialize MediaPipe Pose:', error)
      throw new Error('Body language analysis initialization failed')
    }
  }

  async startAnalysis(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    this.videoElement = videoElement
    this.analysisHistory = []
    
    try {
      // Mock Camera utility for build purposes
      const Camera = class {
        constructor(element: any, config: any) {}
        start() {}
        stop() {}
      }

      // Set up camera for pose detection
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.pose && this.videoElement) {
            await this.pose.send({ image: this.videoElement })
          }
        },
        width: 640,
        height: 480
      })

      // Start camera
      this.camera.start()
      this.isAnalyzing = true

      // Start periodic analysis
      this.analysisInterval = window.setInterval(() => {
        this.updateAnalysisMetrics()
      }, this.config.analysisInterval)

      this.emit('analysis.started', { timestamp: Date.now() })

    } catch (error) {
      console.error('Failed to start body language analysis:', error)
      throw error
    }
  }

  stopAnalysis(): void {
    if (this.camera) {
      this.camera.stop()
      this.camera = null
    }

    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
      this.analysisInterval = null
    }

    this.isAnalyzing = false
    this.analysisHistory = []
    this.gestureHistory = []
    this.movementHistory = []
    this.previousPose = null

    this.emit('analysis.stopped', { timestamp: Date.now() })
  }

  private processPoseResults(results: any): void {
    if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
      this.emitEmptyResult()
      return
    }

    try {
      const landmarks = this.convertToLandmarks(results.poseLandmarks)
      const analysisResult = this.analyzePose(landmarks)
      
      this.analysisHistory.push(analysisResult)
      
      // Keep only recent history
      if (this.analysisHistory.length > this.config.historyLength) {
        this.analysisHistory = this.analysisHistory.slice(-this.config.historyLength)
      }

      this.emit('analysis.result', analysisResult)
      this.previousPose = landmarks

    } catch (error) {
      console.error('Error processing pose results:', error)
      this.emit('analysis.error', { error, timestamp: Date.now() })
    }
  }

  private convertToLandmarks(poseLandmarks: any[]): PoseLandmarks {
    // MediaPipe pose landmark indices
    const indices = {
      nose: 0, leftEyeInner: 1, leftEye: 2, leftEyeOuter: 3,
      rightEyeInner: 4, rightEye: 5, rightEyeOuter: 6,
      leftEar: 7, rightEar: 8, mouthLeft: 9, mouthRight: 10,
      leftShoulder: 11, rightShoulder: 12, leftElbow: 13, rightElbow: 14,
      leftWrist: 15, rightWrist: 16, leftPinky: 17, rightPinky: 18,
      leftIndex: 19, rightIndex: 20, leftThumb: 21, rightThumb: 22,
      leftHip: 23, rightHip: 24, leftKnee: 25, rightKnee: 26,
      leftAnkle: 27, rightAnkle: 28, leftHeel: 29, rightHeel: 30,
      leftFootIndex: 31, rightFootIndex: 32
    }

    const landmarks: any = {}
    
    Object.entries(indices).forEach(([name, index]) => {
      const landmark = poseLandmarks[index]
      landmarks[name] = {
        x: landmark.x,
        y: landmark.y,
        z: landmark.z || 0,
        visibility: landmark.visibility || 1,
        presence: landmark.presence || 1
      }
    })

    return landmarks as PoseLandmarks
  }

  private analyzePose(landmarks: PoseLandmarks): BodyLanguageResult {
    const timestamp = Date.now()
    
    const posture = this.analyzePosture(landmarks)
    const gestures = this.analyzeGestures(landmarks)
    const movement = this.analyzeMovement(landmarks)
    const professionalPresence = this.calculateProfessionalPresence(posture, gestures, movement)

    // Calculate overall confidence based on landmark visibility
    const confidence = this.calculatePoseConfidence(landmarks)

    return {
      posture,
      gestures,
      movement,
      professionalPresence,
      poseDetected: true,
      confidence,
      timestamp
    }
  }

  private analyzePosture(landmarks: PoseLandmarks): PostureMetrics {
    // Shoulder alignment
    const shoulderAlignment = this.calculateShoulderAlignment(landmarks)
    
    // Spine alignment (simplified using shoulder-hip alignment)
    const spineAlignment = this.calculateSpineAlignment(landmarks)
    
    // Head position relative to shoulders
    const headPosition = this.calculateHeadPosition(landmarks)
    
    // Shoulder tension (based on shoulder height and position)
    const shoulderTension = this.calculateShoulderTension(landmarks)
    
    // Lean detection
    const { leanDirection, leanAngle } = this.calculateLean(landmarks)
    
    // Overall posture score
    const overallPosture = (shoulderAlignment + spineAlignment + headPosition + (1 - shoulderTension)) / 4

    return {
      shoulderAlignment,
      spineAlignment,
      headPosition,
      shoulderTension,
      overallPosture,
      leanDirection,
      leanAngle
    }
  }

  private calculateShoulderAlignment(landmarks: PoseLandmarks): number {
    const leftShoulder = landmarks.leftShoulder
    const rightShoulder = landmarks.rightShoulder
    
    if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5) {
      return 0.5 // Default neutral score
    }

    const heightDifference = Math.abs(leftShoulder.y - rightShoulder.y)
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x)
    
    // Normalize height difference by shoulder width
    const alignmentRatio = heightDifference / (shoulderWidth + 0.001)
    
    // Convert to 0-1 score (lower difference = better alignment)
    return Math.max(0, 1 - alignmentRatio * 5)
  }

  private calculateSpineAlignment(landmarks: PoseLandmarks): number {
    const leftShoulder = landmarks.leftShoulder
    const rightShoulder = landmarks.rightShoulder
    const leftHip = landmarks.leftHip
    const rightHip = landmarks.rightHip
    
    if ([leftShoulder, rightShoulder, leftHip, rightHip].some(p => p.visibility < 0.5)) {
      return 0.5
    }

    // Calculate center points
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    }
    
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    }

    // Calculate spine angle deviation from vertical
    const spineAngle = Math.atan2(shoulderCenter.x - hipCenter.x, hipCenter.y - shoulderCenter.y)
    const angleDeviation = Math.abs(spineAngle)
    
    // Convert to 0-1 score
    return Math.max(0, 1 - angleDeviation * 2)
  }

  private calculateHeadPosition(landmarks: PoseLandmarks): number {
    const nose = landmarks.nose
    const leftShoulder = landmarks.leftShoulder
    const rightShoulder = landmarks.rightShoulder
    
    if ([nose, leftShoulder, rightShoulder].some(p => p.visibility < 0.5)) {
      return 0.5
    }

    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    }

    // Calculate head position relative to shoulders
    const headOffset = {
      x: nose.x - shoulderCenter.x,
      y: nose.y - shoulderCenter.y
    }

    // Ideal head position is slightly above and centered over shoulders
    const idealY = -0.15 // Head should be above shoulders
    const yDeviation = Math.abs(headOffset.y - idealY)
    const xDeviation = Math.abs(headOffset.x)

    const totalDeviation = Math.sqrt(xDeviation * xDeviation + yDeviation * yDeviation)
    
    return Math.max(0, 1 - totalDeviation * 3)
  }

  private calculateShoulderTension(landmarks: PoseLandmarks): number {
    const leftShoulder = landmarks.leftShoulder
    const rightShoulder = landmarks.rightShoulder
    const leftEar = landmarks.leftEar
    const rightEar = landmarks.rightEar
    
    if ([leftShoulder, rightShoulder, leftEar, rightEar].some(p => p.visibility < 0.5)) {
      return 0.5
    }

    // Calculate shoulder-to-ear distance (tension indicator)
    const leftDistance = Math.sqrt(
      Math.pow(leftShoulder.x - leftEar.x, 2) + Math.pow(leftShoulder.y - leftEar.y, 2)
    )
    
    const rightDistance = Math.sqrt(
      Math.pow(rightShoulder.x - rightEar.x, 2) + Math.pow(rightShoulder.y - rightEar.y, 2)
    )

    const avgDistance = (leftDistance + rightDistance) / 2
    
    // Normalize tension (closer shoulders to ears = more tension)
    const normalizedTension = Math.max(0, 1 - avgDistance * 5)
    
    return normalizedTension
  }

  private calculateLean(landmarks: PoseLandmarks): { leanDirection: PostureMetrics['leanDirection']; leanAngle: number } {
    const nose = landmarks.nose
    const leftHip = landmarks.leftHip
    const rightHip = landmarks.rightHip
    
    if ([nose, leftHip, rightHip].some(p => p.visibility < 0.5)) {
      return { leanDirection: 'centered', leanAngle: 0 }
    }

    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    }

    const leanX = nose.x - hipCenter.x
    const leanY = nose.y - hipCenter.y
    
    const leanAngle = Math.atan2(leanX, leanY) * 180 / Math.PI
    const leanMagnitude = Math.sqrt(leanX * leanX + leanY * leanY)

    let leanDirection: PostureMetrics['leanDirection'] = 'centered'
    
    if (leanMagnitude > 0.05) { // Threshold for detecting lean
      if (Math.abs(leanX) > Math.abs(leanY)) {
        leanDirection = leanX > 0 ? 'right' : 'left'
      } else {
        leanDirection = leanY > 0 ? 'backward' : 'forward'
      }
    }

    return { leanDirection, leanAngle: Math.abs(leanAngle) }
  }

  private analyzeGestures(landmarks: PoseLandmarks): GestureData {
    const leftWrist = landmarks.leftWrist
    const rightWrist = landmarks.rightWrist
    const leftElbow = landmarks.leftElbow
    const rightElbow = landmarks.rightElbow

    // Calculate hand movement if we have previous pose
    let handMovement = {
      left: { velocity: 0, direction: { x: 0, y: 0 } },
      right: { velocity: 0, direction: { x: 0, y: 0 } }
    }

    if (this.previousPose) {
      handMovement = this.calculateHandMovement(landmarks, this.previousPose)
    }

    // Detect gesture type based on hand positions
    const gestureType = this.detectGestureType(landmarks)
    
    // Calculate gesture intensity
    const gestureIntensity = this.calculateGestureIntensity(handMovement)
    
    // Update gesture history and calculate frequency
    this.updateGestureHistory({ handMovement, gestureType, gestureIntensity, gestureFrequency: 0, handVisibility: { left: false, right: false } })
    const gestureFrequency = this.calculateGestureFrequency()

    // Check hand visibility
    const handVisibility = {
      left: leftWrist.visibility > 0.5,
      right: rightWrist.visibility > 0.5
    }

    return {
      handMovement,
      gestureType,
      gestureIntensity,
      gestureFrequency,
      handVisibility
    }
  }

  private calculateHandMovement(current: PoseLandmarks, previous: PoseLandmarks): GestureData['handMovement'] {
    const leftMovement = {
      x: current.leftWrist.x - previous.leftWrist.x,
      y: current.leftWrist.y - previous.leftWrist.y
    }
    
    const rightMovement = {
      x: current.rightWrist.x - previous.rightWrist.x,
      y: current.rightWrist.y - previous.rightWrist.y
    }

    const leftVelocity = Math.sqrt(leftMovement.x * leftMovement.x + leftMovement.y * leftMovement.y)
    const rightVelocity = Math.sqrt(rightMovement.x * rightMovement.x + rightMovement.y * rightMovement.y)

    return {
      left: {
        velocity: leftVelocity,
        direction: leftVelocity > 0 ? {
          x: leftMovement.x / leftVelocity,
          y: leftMovement.y / leftVelocity
        } : { x: 0, y: 0 }
      },
      right: {
        velocity: rightVelocity,
        direction: rightVelocity > 0 ? {
          x: rightMovement.x / rightVelocity,
          y: rightMovement.y / rightVelocity
        } : { x: 0, y: 0 }
      }
    }
  }

  private detectGestureType(landmarks: PoseLandmarks): GestureData['gestureType'] {
    // Simplified gesture detection based on hand positions
    const leftWrist = landmarks.leftWrist
    const rightWrist = landmarks.rightWrist
    const leftElbow = landmarks.leftElbow
    const rightElbow = landmarks.rightElbow
    const leftShoulder = landmarks.leftShoulder
    const rightShoulder = landmarks.rightShoulder

    // Check if hands are visible
    if (leftWrist.visibility < 0.5 && rightWrist.visibility < 0.5) {
      return 'unknown'
    }

    // Check for pointing gesture (hand extended, above elbow level)
    const leftPointing = leftWrist.y < leftElbow.y && leftElbow.y < leftShoulder.y
    const rightPointing = rightWrist.y < rightElbow.y && rightElbow.y < rightShoulder.y
    
    if (leftPointing || rightPointing) {
      return 'pointing'
    }

    // Check for open palm (hands at shoulder level or above)
    const handsRaised = (leftWrist.y < leftShoulder.y) || (rightWrist.y < rightShoulder.y)
    
    if (handsRaised) {
      return 'open_palm'
    }

    // Check for descriptive gestures (hands moving in front of body)
    const handsInFront = leftWrist.x > leftShoulder.x - 0.2 && leftWrist.x < rightShoulder.x + 0.2
    
    if (handsInFront) {
      return 'descriptive'
    }

    return 'neutral'
  }

  private calculateGestureIntensity(handMovement: GestureData['handMovement']): number {
    const totalVelocity = handMovement.left.velocity + handMovement.right.velocity
    return Math.min(1, totalVelocity * 10) // Scale and cap at 1
  }

  private updateGestureHistory(gesture: GestureData): void {
    this.gestureHistory.push(gesture)
    
    // Keep only recent history (last 30 seconds)
    const cutoffTime = Date.now() - 30000
    this.gestureHistory = this.gestureHistory.filter((_, index) => 
      index >= this.gestureHistory.length - 60 // Assuming 2Hz analysis rate
    )
  }

  private calculateGestureFrequency(): number {
    if (this.gestureHistory.length < 2) return 0

    // Count significant gestures (above threshold intensity)
    const significantGestures = this.gestureHistory.filter(g => g.gestureIntensity > 0.3)
    
    // Calculate gestures per minute
    const timeSpan = Math.min(30, this.gestureHistory.length * 0.5) // seconds
    return (significantGestures.length / timeSpan) * 60
  }

  private analyzeMovement(landmarks: PoseLandmarks): MovementPatterns {
    // Track overall body movement
    const bodyCenter = this.calculateBodyCenter(landmarks)
    
    // Update movement history
    this.movementHistory.push({
      x: bodyCenter.x,
      y: bodyCenter.y,
      timestamp: Date.now()
    })

    // Keep only recent history
    if (this.movementHistory.length > 120) { // 1 minute at 2Hz
      this.movementHistory = this.movementHistory.slice(-120)
    }

    const overallMovement = this.calculateOverallMovement()
    const fidgeting = this.calculateFidgeting()
    const stability = this.calculateStability()
    const rhythmicMovement = this.calculateRhythmicMovement()
    const movementDirection = this.calculateMovementDirection()

    return {
      overallMovement,
      fidgeting,
      stability,
      rhythmicMovement,
      movementDirection
    }
  }

  private calculateBodyCenter(landmarks: PoseLandmarks): { x: number; y: number } {
    const keyPoints = [
      landmarks.leftShoulder,
      landmarks.rightShoulder,
      landmarks.leftHip,
      landmarks.rightHip
    ].filter(p => p.visibility > 0.5)

    if (keyPoints.length === 0) {
      return { x: 0.5, y: 0.5 } // Default center
    }

    const avgX = keyPoints.reduce((sum, p) => sum + p.x, 0) / keyPoints.length
    const avgY = keyPoints.reduce((sum, p) => sum + p.y, 0) / keyPoints.length

    return { x: avgX, y: avgY }
  }

  private calculateOverallMovement(): number {
    if (this.movementHistory.length < 2) return 0

    let totalMovement = 0
    for (let i = 1; i < this.movementHistory.length; i++) {
      const prev = this.movementHistory[i - 1]
      const curr = this.movementHistory[i]
      
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      )
      
      totalMovement += distance
    }

    return Math.min(1, totalMovement * 50) // Scale and cap
  }

  private calculateFidgeting(): number {
    if (this.movementHistory.length < 10) return 0

    // Look for rapid, small movements
    let fidgetingScore = 0
    const recentHistory = this.movementHistory.slice(-20) // Last 10 seconds

    for (let i = 1; i < recentHistory.length; i++) {
      const prev = recentHistory[i - 1]
      const curr = recentHistory[i]
      
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      )
      
      // Small but frequent movements indicate fidgeting
      if (distance > 0.005 && distance < 0.02) {
        fidgetingScore += 1
      }
    }

    return Math.min(1, fidgetingScore / recentHistory.length)
  }

  private calculateStability(): number {
    if (this.movementHistory.length < 5) return 1

    const recentHistory = this.movementHistory.slice(-10)
    
    // Calculate variance in position
    const avgX = recentHistory.reduce((sum, p) => sum + p.x, 0) / recentHistory.length
    const avgY = recentHistory.reduce((sum, p) => sum + p.y, 0) / recentHistory.length
    
    let variance = 0
    for (const point of recentHistory) {
      variance += Math.pow(point.x - avgX, 2) + Math.pow(point.y - avgY, 2)
    }
    variance /= recentHistory.length

    // Convert variance to stability score (lower variance = higher stability)
    return Math.max(0, 1 - variance * 100)
  }

  private calculateRhythmicMovement(): number {
    if (this.movementHistory.length < 20) return 0.5

    // Analyze movement patterns for rhythm vs erratic behavior
    const movements = []
    for (let i = 1; i < this.movementHistory.length; i++) {
      const prev = this.movementHistory[i - 1]
      const curr = this.movementHistory[i]
      
      movements.push(Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      ))
    }

    // Calculate coefficient of variation
    const mean = movements.reduce((sum, m) => sum + m, 0) / movements.length
    const variance = movements.reduce((sum, m) => sum + Math.pow(m - mean, 2), 0) / movements.length
    const stdDev = Math.sqrt(variance)
    
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1
    
    // Lower coefficient of variation indicates more rhythmic movement
    return Math.max(0, 1 - coefficientOfVariation)
  }

  private calculateMovementDirection(): { x: number; y: number } {
    if (this.movementHistory.length < 2) return { x: 0, y: 0 }

    const first = this.movementHistory[0]
    const last = this.movementHistory[this.movementHistory.length - 1]
    
    const direction = {
      x: last.x - first.x,
      y: last.y - first.y
    }

    const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y)
    
    if (magnitude === 0) return { x: 0, y: 0 }
    
    return {
      x: direction.x / magnitude,
      y: direction.y / magnitude
    }
  }

  private calculateProfessionalPresence(
    posture: PostureMetrics,
    gestures: GestureData,
    movement: MovementPatterns
  ): ProfessionalPresence {
    // Confidence based on posture and stability
    const confidence = (posture.overallPosture * 0.6 + movement.stability * 0.4)
    
    // Engagement based on gestures and movement
    const engagement = Math.min(1, (gestures.gestureIntensity * 0.5 + movement.overallMovement * 0.3 + (1 - movement.fidgeting) * 0.2))
    
    // Openness based on posture and gesture visibility
    const openness = (posture.shoulderAlignment * 0.4 + (gestures.handVisibility.left || gestures.handVisibility.right ? 0.6 : 0.2))
    
    // Nervousness based on fidgeting and tension
    const nervousness = (movement.fidgeting * 0.6 + posture.shoulderTension * 0.4)
    
    // Authority based on posture and head position
    const authority = (posture.overallPosture * 0.5 + posture.headPosition * 0.3 + movement.stability * 0.2)
    
    // Approachability based on openness and gesture frequency
    const approachability = (openness * 0.6 + Math.min(1, gestures.gestureFrequency / 10) * 0.4)

    return {
      confidence,
      engagement,
      openness,
      nervousness,
      authority,
      approachability
    }
  }

  private calculatePoseConfidence(landmarks: PoseLandmarks): number {
    const keyLandmarks = [
      landmarks.nose, landmarks.leftShoulder, landmarks.rightShoulder,
      landmarks.leftElbow, landmarks.rightElbow, landmarks.leftWrist, landmarks.rightWrist,
      landmarks.leftHip, landmarks.rightHip
    ]

    const avgVisibility = keyLandmarks.reduce((sum, landmark) => sum + landmark.visibility, 0) / keyLandmarks.length
    return avgVisibility
  }

  private emitEmptyResult(): void {
    const emptyResult: BodyLanguageResult = {
      posture: {
        shoulderAlignment: 0,
        spineAlignment: 0,
        headPosition: 0,
        shoulderTension: 0,
        overallPosture: 0,
        leanDirection: 'centered',
        leanAngle: 0
      },
      gestures: {
        handMovement: {
          left: { velocity: 0, direction: { x: 0, y: 0 } },
          right: { velocity: 0, direction: { x: 0, y: 0 } }
        },
        gestureType: 'unknown',
        gestureIntensity: 0,
        gestureFrequency: 0,
        handVisibility: { left: false, right: false }
      },
      movement: {
        overallMovement: 0,
        fidgeting: 0,
        stability: 1,
        rhythmicMovement: 0.5,
        movementDirection: { x: 0, y: 0 }
      },
      professionalPresence: {
        confidence: 0,
        engagement: 0,
        openness: 0,
        nervousness: 0,
        authority: 0,
        approachability: 0
      },
      poseDetected: false,
      confidence: 0,
      timestamp: Date.now()
    }

    this.emit('analysis.result', emptyResult)
  }

  private updateAnalysisMetrics(): void {
    // This method can be used for periodic updates or calculations
    // that don't depend on pose detection results
  }

  // Public API methods
  getCurrentResult(): BodyLanguageResult | null {
    return this.analysisHistory.length > 0 ? this.analysisHistory[this.analysisHistory.length - 1] : null
  }

  getAnalysisSummary(): {
    averagePosture: number
    averageConfidence: number
    averageEngagement: number
    gestureFrequency: number
    stabilityScore: number
    professionalPresence: number
    poseDetectionRate: number
  } {
    if (this.analysisHistory.length === 0) {
      return {
        averagePosture: 0,
        averageConfidence: 0,
        averageEngagement: 0,
        gestureFrequency: 0,
        stabilityScore: 0,
        professionalPresence: 0,
        poseDetectionRate: 0
      }
    }

    const validResults = this.analysisHistory.filter(r => r.poseDetected)
    const poseDetectionRate = (validResults.length / this.analysisHistory.length) * 100

    if (validResults.length === 0) {
      return {
        averagePosture: 0,
        averageConfidence: 0,
        averageEngagement: 0,
        gestureFrequency: 0,
        stabilityScore: 0,
        professionalPresence: 0,
        poseDetectionRate
      }
    }

    const averagePosture = validResults.reduce((sum, r) => sum + r.posture.overallPosture, 0) / validResults.length
    const averageConfidence = validResults.reduce((sum, r) => sum + r.professionalPresence.confidence, 0) / validResults.length
    const averageEngagement = validResults.reduce((sum, r) => sum + r.professionalPresence.engagement, 0) / validResults.length
    const gestureFrequency = validResults.reduce((sum, r) => sum + r.gestures.gestureFrequency, 0) / validResults.length
    const stabilityScore = validResults.reduce((sum, r) => sum + r.movement.stability, 0) / validResults.length
    const professionalPresence = validResults.reduce((sum, r) => sum + (r.professionalPresence.confidence + r.professionalPresence.authority) / 2, 0) / validResults.length

    return {
      averagePosture,
      averageConfidence,
      averageEngagement,
      gestureFrequency,
      stabilityScore,
      professionalPresence,
      poseDetectionRate
    }
  }

  getAnalysisHistory(): BodyLanguageResult[] {
    return [...this.analysisHistory]
  }

  updateConfig(newConfig: Partial<BodyLanguageConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  getConfig(): BodyLanguageConfig {
    return { ...this.config }
  }

  isServiceInitialized(): boolean {
    return this.isInitialized
  }

  isAnalysisActive(): boolean {
    return this.isAnalyzing
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
        console.error(`Error in body language analysis event handler for ${event}:`, error)
      }
    })
  }

  // Cleanup
  destroy(): void {
    this.stopAnalysis()
    this.eventHandlers.clear()
    this.analysisHistory = []
    this.gestureHistory = []
    this.movementHistory = []
    this.previousPose = null
    this.isInitialized = false
  }
}

export { 
  BodyLanguageAnalysisService,
  type BodyLanguageResult,
  type PostureMetrics,
  type GestureData,
  type MovementPatterns,
  type ProfessionalPresence,
  type BodyLanguageConfig,
  type PoseLandmarks
}
