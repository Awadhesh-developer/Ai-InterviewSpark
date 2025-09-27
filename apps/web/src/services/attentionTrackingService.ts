/**
 * Attention Tracking Service
 * Advanced gaze tracking, focus monitoring, and attention analysis for interviews
 */

interface AttentionTrackingResult {
  timestamp: number
  gazeData: GazeData
  focusMetrics: FocusMetrics
  attentionPatterns: AttentionPattern[]
  distractionEvents: DistractionEvent[]
  cognitiveLoad: CognitiveLoad
  engagementLevel: number
  confidence: number
}

interface GazeData {
  eyePosition: {
    left: EyePosition
    right: EyePosition
  }
  gazeDirection: {
    x: number // -1 to 1 (left to right)
    y: number // -1 to 1 (up to down)
    z: number // depth/distance
  }
  gazeTarget: GazeTarget
  fixationData: FixationData
  saccadeData: SaccadeData
  blinkData: BlinkData
}

interface EyePosition {
  center: { x: number; y: number }
  pupilDiameter: number
  eyelidOpenness: number
  eyeAspectRatio: number
  landmarks: number[][]
}

interface GazeTarget {
  region: 'camera' | 'screen_center' | 'screen_left' | 'screen_right' | 'screen_top' | 'screen_bottom' | 'off_screen'
  coordinates: { x: number; y: number }
  confidence: number
  duration: number
}

interface FixationData {
  isFixating: boolean
  fixationPoint: { x: number; y: number }
  fixationDuration: number
  fixationStability: number
  fixationCount: number
}

interface SaccadeData {
  isSaccading: boolean
  saccadeVelocity: number
  saccadeAmplitude: number
  saccadeDirection: number
  saccadeCount: number
  averageSaccadeSpeed: number
}

interface BlinkData {
  blinkRate: number
  blinkDuration: number
  blinkCompleteness: number
  blinkPattern: 'normal' | 'rapid' | 'slow' | 'incomplete'
  lastBlinkTime: number
}

interface FocusMetrics {
  overallFocus: number
  visualAttention: number
  sustainedAttention: number
  selectiveAttention: number
  dividedAttention: number
  attentionStability: number
  focusIntensity: number
}

interface AttentionPattern {
  type: 'sustained_focus' | 'scanning' | 'avoidance' | 'distraction' | 'fatigue' | 'anxiety'
  intensity: number
  duration: number
  frequency: number
  confidence: number
  description: string
}

interface DistractionEvent {
  timestamp: number
  type: 'gaze_away' | 'rapid_blinking' | 'eye_closure' | 'scanning' | 'fidgeting'
  severity: number
  duration: number
  recovery_time: number
  cause: string
}

interface CognitiveLoad {
  overallLoad: number
  processingDifficulty: number
  mentalEffort: number
  workingMemoryLoad: number
  attentionalDemand: number
  stressLevel: number
  fatigueLevel: number
}

interface AttentionTrackingConfig {
  gazeCalibrationPoints: number
  fixationThreshold: number
  saccadeThreshold: number
  blinkDetectionSensitivity: number
  attentionWindowSize: number
  distractionThreshold: number
  enableCognitiveLoadAnalysis: boolean
  enablePatternRecognition: boolean
}

class AttentionTrackingService {
  private config: AttentionTrackingConfig
  private gazeHistory: GazeData[] = []
  private attentionHistory: AttentionTrackingResult[] = []
  private calibrationData: any = null
  private isCalibrated: boolean = false
  private isInitialized: boolean = false

  // Eye tracking constants
  private readonly EYE_ASPECT_RATIO_THRESHOLD = 0.25
  private readonly BLINK_DURATION_THRESHOLD = 150 // ms
  private readonly FIXATION_DURATION_THRESHOLD = 100 // ms
  private readonly SACCADE_VELOCITY_THRESHOLD = 30 // degrees/second

  constructor(config: Partial<AttentionTrackingConfig> = {}) {
    this.config = {
      gazeCalibrationPoints: 9,
      fixationThreshold: 2.0, // degrees
      saccadeThreshold: 30.0, // degrees/second
      blinkDetectionSensitivity: 0.8,
      attentionWindowSize: 5000, // 5 seconds
      distractionThreshold: 0.3,
      enableCognitiveLoadAnalysis: true,
      enablePatternRecognition: true,
      ...config
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('Initializing Attention Tracking Service...')
      
      // Initialize eye tracking models
      // In a real implementation, this would load ML models for eye detection
      
      this.isInitialized = true
      console.log('Attention Tracking Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Attention Tracking Service:', error)
      throw error
    }
  }

  async calibrateGazeTracking(calibrationPoints: { x: number; y: number }[]): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Service not initialized')
    }

    try {
      console.log('Starting gaze calibration...')
      
      // Perform gaze calibration
      // In a real implementation, this would collect gaze data for each calibration point
      this.calibrationData = {
        points: calibrationPoints,
        timestamp: Date.now(),
        accuracy: 0.85 // Mock accuracy
      }

      this.isCalibrated = true
      console.log('Gaze calibration completed successfully')
      return true
    } catch (error) {
      console.error('Gaze calibration failed:', error)
      return false
    }
  }

  async trackAttention(
    imageData: ImageData,
    facialLandmarks: number[][],
    context?: {
      timestamp?: number
      screenDimensions?: { width: number; height: number }
      interactionContext?: string
    }
  ): Promise<AttentionTrackingResult> {
    if (!this.isInitialized) {
      throw new Error('Attention Tracking Service not initialized')
    }

    const timestamp = context?.timestamp || Date.now()

    // Extract gaze data
    const gazeData = this.extractGazeData(facialLandmarks, context)

    // Calculate focus metrics
    const focusMetrics = this.calculateFocusMetrics(gazeData)

    // Detect attention patterns
    const attentionPatterns = this.config.enablePatternRecognition ? 
      this.detectAttentionPatterns(gazeData, focusMetrics) : []

    // Detect distraction events
    const distractionEvents = this.detectDistractionEvents(gazeData, focusMetrics)

    // Analyze cognitive load
    const cognitiveLoad = this.config.enableCognitiveLoadAnalysis ? 
      this.analyzeCognitiveLoad(gazeData, focusMetrics, attentionPatterns) : this.getDefaultCognitiveLoad()

    // Calculate engagement level
    const engagementLevel = this.calculateEngagementLevel(focusMetrics, attentionPatterns, cognitiveLoad)

    // Calculate confidence
    const confidence = this.calculateConfidence(gazeData, focusMetrics)

    const result: AttentionTrackingResult = {
      timestamp,
      gazeData,
      focusMetrics,
      attentionPatterns,
      distractionEvents,
      cognitiveLoad,
      engagementLevel,
      confidence
    }

    // Store in history
    this.gazeHistory.push(gazeData)
    this.attentionHistory.push(result)

    // Maintain history size
    if (this.gazeHistory.length > 100) {
      this.gazeHistory = this.gazeHistory.slice(-100)
    }
    if (this.attentionHistory.length > 100) {
      this.attentionHistory = this.attentionHistory.slice(-100)
    }

    return result
  }

  private extractGazeData(facialLandmarks: number[][], context?: any): GazeData {
    if (facialLandmarks.length < 68) {
      return this.getDefaultGazeData()
    }

    // Extract eye positions
    const leftEye = this.extractEyePosition(facialLandmarks, 'left')
    const rightEye = this.extractEyePosition(facialLandmarks, 'right')

    // Calculate gaze direction
    const gazeDirection = this.calculateGazeDirection(leftEye, rightEye)

    // Determine gaze target
    const gazeTarget = this.determineGazeTarget(gazeDirection, context?.screenDimensions)

    // Analyze fixation
    const fixationData = this.analyzeFixation(gazeDirection)

    // Analyze saccades
    const saccadeData = this.analyzeSaccades(gazeDirection)

    // Analyze blinks
    const blinkData = this.analyzeBlinks(leftEye, rightEye)

    return {
      eyePosition: { left: leftEye, right: rightEye },
      gazeDirection,
      gazeTarget,
      fixationData,
      saccadeData,
      blinkData
    }
  }

  private extractEyePosition(landmarks: number[][], eye: 'left' | 'right'): EyePosition {
    // Eye landmark indices (68-point model)
    const leftEyeIndices = [36, 37, 38, 39, 40, 41]
    const rightEyeIndices = [42, 43, 44, 45, 46, 47]
    
    const eyeIndices = eye === 'left' ? leftEyeIndices : rightEyeIndices
    const eyeLandmarks = eyeIndices.map(i => landmarks[i])

    // Calculate eye center
    const center = {
      x: eyeLandmarks.reduce((sum, point) => sum + point[0], 0) / eyeLandmarks.length,
      y: eyeLandmarks.reduce((sum, point) => sum + point[1], 0) / eyeLandmarks.length
    }

    // Calculate eye aspect ratio (for blink detection)
    const eyeAspectRatio = this.calculateEyeAspectRatio(eyeLandmarks)

    // Estimate pupil diameter (simplified)
    const eyeWidth = Math.abs(eyeLandmarks[3][0] - eyeLandmarks[0][0])
    const pupilDiameter = eyeWidth * 0.3 // Simplified estimation

    // Calculate eyelid openness
    const eyelidOpenness = Math.max(0, Math.min(1, eyeAspectRatio / 0.3))

    return {
      center,
      pupilDiameter,
      eyelidOpenness,
      eyeAspectRatio,
      landmarks: eyeLandmarks
    }
  }

  private calculateEyeAspectRatio(eyeLandmarks: number[][]): number {
    // Calculate eye aspect ratio using landmark distances
    const verticalDist1 = Math.sqrt(
      Math.pow(eyeLandmarks[1][0] - eyeLandmarks[5][0], 2) +
      Math.pow(eyeLandmarks[1][1] - eyeLandmarks[5][1], 2)
    )
    const verticalDist2 = Math.sqrt(
      Math.pow(eyeLandmarks[2][0] - eyeLandmarks[4][0], 2) +
      Math.pow(eyeLandmarks[2][1] - eyeLandmarks[4][1], 2)
    )
    const horizontalDist = Math.sqrt(
      Math.pow(eyeLandmarks[0][0] - eyeLandmarks[3][0], 2) +
      Math.pow(eyeLandmarks[0][1] - eyeLandmarks[3][1], 2)
    )

    return (verticalDist1 + verticalDist2) / (2.0 * horizontalDist)
  }

  private calculateGazeDirection(leftEye: EyePosition, rightEye: EyePosition): GazeData['gazeDirection'] {
    // Simplified gaze direction calculation
    // In a real implementation, this would use sophisticated eye tracking algorithms
    
    const avgCenter = {
      x: (leftEye.center.x + rightEye.center.x) / 2,
      y: (leftEye.center.y + rightEye.center.y) / 2
    }

    // Normalize to -1 to 1 range (assuming screen coordinates)
    const x = (avgCenter.x - 320) / 320 // Assuming 640px width
    const y = (avgCenter.y - 240) / 240 // Assuming 480px height
    const z = 0 // Simplified depth

    return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)), z }
  }

  private determineGazeTarget(gazeDirection: GazeData['gazeDirection'], screenDimensions?: any): GazeTarget {
    const { x, y } = gazeDirection

    // Determine gaze region
    let region: GazeTarget['region'] = 'screen_center'
    
    if (Math.abs(x) < 0.2 && Math.abs(y) < 0.2) {
      region = 'camera'
    } else if (x < -0.3) {
      region = 'screen_left'
    } else if (x > 0.3) {
      region = 'screen_right'
    } else if (y < -0.3) {
      region = 'screen_top'
    } else if (y > 0.3) {
      region = 'screen_bottom'
    } else if (Math.abs(x) > 0.8 || Math.abs(y) > 0.8) {
      region = 'off_screen'
    }

    return {
      region,
      coordinates: { x, y },
      confidence: 0.8,
      duration: 0 // Will be calculated in temporal analysis
    }
  }

  private analyzeFixation(gazeDirection: GazeData['gazeDirection']): FixationData {
    const recentGaze = this.gazeHistory.slice(-5).map(g => g.gazeDirection)
    
    if (recentGaze.length < 2) {
      return {
        isFixating: false,
        fixationPoint: { x: gazeDirection.x, y: gazeDirection.y },
        fixationDuration: 0,
        fixationStability: 0,
        fixationCount: 0
      }
    }

    // Calculate gaze stability
    const gazeVariance = this.calculateGazeVariance(recentGaze)
    const isFixating = gazeVariance < this.config.fixationThreshold

    // Calculate fixation stability
    const fixationStability = Math.max(0, 1 - gazeVariance / this.config.fixationThreshold)

    return {
      isFixating,
      fixationPoint: { x: gazeDirection.x, y: gazeDirection.y },
      fixationDuration: isFixating ? recentGaze.length * 33 : 0, // Assuming 30fps
      fixationStability,
      fixationCount: this.countFixations()
    }
  }

  private calculateGazeVariance(gazePoints: GazeData['gazeDirection'][]): number {
    if (gazePoints.length < 2) return 0

    const avgX = gazePoints.reduce((sum, p) => sum + p.x, 0) / gazePoints.length
    const avgY = gazePoints.reduce((sum, p) => sum + p.y, 0) / gazePoints.length

    const variance = gazePoints.reduce((sum, p) => {
      return sum + Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2)
    }, 0) / gazePoints.length

    return Math.sqrt(variance)
  }

  private countFixations(): number {
    // Count fixations in recent history
    return this.gazeHistory.slice(-20).filter(g => g.fixationData?.isFixating).length
  }

  private analyzeSaccades(gazeDirection: GazeData['gazeDirection']): SaccadeData {
    const recentGaze = this.gazeHistory.slice(-3).map(g => g.gazeDirection)
    
    if (recentGaze.length < 2) {
      return {
        isSaccading: false,
        saccadeVelocity: 0,
        saccadeAmplitude: 0,
        saccadeDirection: 0,
        saccadeCount: 0,
        averageSaccadeSpeed: 0
      }
    }

    // Calculate saccade velocity
    const current = gazeDirection
    const previous = recentGaze[recentGaze.length - 1]
    
    const distance = Math.sqrt(
      Math.pow(current.x - previous.x, 2) + 
      Math.pow(current.y - previous.y, 2)
    )
    
    const velocity = distance * 30 // Assuming 30fps, convert to degrees/second
    const isSaccading = velocity > this.config.saccadeThreshold

    // Calculate saccade direction
    const direction = Math.atan2(current.y - previous.y, current.x - previous.x)

    return {
      isSaccading,
      saccadeVelocity: velocity,
      saccadeAmplitude: distance,
      saccadeDirection: direction,
      saccadeCount: this.countSaccades(),
      averageSaccadeSpeed: this.calculateAverageSaccadeSpeed()
    }
  }

  private countSaccades(): number {
    return this.gazeHistory.slice(-20).filter(g => g.saccadeData?.isSaccading).length
  }

  private calculateAverageSaccadeSpeed(): number {
    const recentSaccades = this.gazeHistory.slice(-20)
      .filter(g => g.saccadeData?.isSaccading)
      .map(g => g.saccadeData!.saccadeVelocity)
    
    if (recentSaccades.length === 0) return 0
    return recentSaccades.reduce((sum, v) => sum + v, 0) / recentSaccades.length
  }

  private analyzeBlinks(leftEye: EyePosition, rightEye: EyePosition): BlinkData {
    const avgEAR = (leftEye.eyeAspectRatio + rightEye.eyeAspectRatio) / 2
    const isBlinking = avgEAR < this.EYE_ASPECT_RATIO_THRESHOLD

    // Calculate blink rate (blinks per minute)
    const recentBlinks = this.gazeHistory.slice(-1800) // Last minute at 30fps
      .filter(g => g.blinkData?.blinkCompleteness > 0.5)
    const blinkRate = recentBlinks.length

    // Determine blink pattern
    let blinkPattern: BlinkData['blinkPattern'] = 'normal'
    if (blinkRate > 20) blinkPattern = 'rapid'
    else if (blinkRate < 5) blinkPattern = 'slow'
    else if (avgEAR > this.EYE_ASPECT_RATIO_THRESHOLD * 0.7) blinkPattern = 'incomplete'

    return {
      blinkRate,
      blinkDuration: isBlinking ? 150 : 0, // Simplified
      blinkCompleteness: Math.max(0, 1 - avgEAR / this.EYE_ASPECT_RATIO_THRESHOLD),
      blinkPattern,
      lastBlinkTime: isBlinking ? Date.now() : 0
    }
  }

  private calculateFocusMetrics(gazeData: GazeData): FocusMetrics {
    const { fixationData, saccadeData, blinkData, gazeTarget } = gazeData

    // Visual attention based on gaze target
    const visualAttention = gazeTarget.region === 'camera' ? 1.0 : 
                           gazeTarget.region === 'screen_center' ? 0.8 :
                           gazeTarget.region.startsWith('screen_') ? 0.6 : 0.2

    // Sustained attention based on fixation stability
    const sustainedAttention = fixationData.fixationStability

    // Selective attention based on fixation focus
    const selectiveAttention = fixationData.isFixating ? 0.9 : 0.3

    // Divided attention (inverse of focus intensity)
    const dividedAttention = 1 - selectiveAttention

    // Attention stability based on saccade frequency
    const attentionStability = Math.max(0, 1 - saccadeData.saccadeCount / 10)

    // Focus intensity based on multiple factors
    const focusIntensity = (visualAttention + sustainedAttention + selectiveAttention) / 3

    // Overall focus score
    const overallFocus = (visualAttention * 0.3 + sustainedAttention * 0.3 + 
                         selectiveAttention * 0.2 + attentionStability * 0.2)

    return {
      overallFocus,
      visualAttention,
      sustainedAttention,
      selectiveAttention,
      dividedAttention,
      attentionStability,
      focusIntensity
    }
  }

  private detectAttentionPatterns(gazeData: GazeData, focusMetrics: FocusMetrics): AttentionPattern[] {
    const patterns: AttentionPattern[] = []

    // Sustained focus pattern
    if (focusMetrics.sustainedAttention > 0.8 && gazeData.fixationData.fixationDuration > 1000) {
      patterns.push({
        type: 'sustained_focus',
        intensity: focusMetrics.sustainedAttention,
        duration: gazeData.fixationData.fixationDuration,
        frequency: 1,
        confidence: 0.9,
        description: 'Strong sustained attention detected'
      })
    }

    // Scanning pattern
    if (gazeData.saccadeData.saccadeCount > 5 && gazeData.saccadeData.averageSaccadeSpeed > 20) {
      patterns.push({
        type: 'scanning',
        intensity: Math.min(1, gazeData.saccadeData.saccadeCount / 10),
        duration: 1000, // Estimated
        frequency: gazeData.saccadeData.saccadeCount,
        confidence: 0.8,
        description: 'Active visual scanning behavior'
      })
    }

    // Avoidance pattern
    if (gazeData.gazeTarget.region === 'off_screen' || focusMetrics.visualAttention < 0.3) {
      patterns.push({
        type: 'avoidance',
        intensity: 1 - focusMetrics.visualAttention,
        duration: 500, // Estimated
        frequency: 1,
        confidence: 0.7,
        description: 'Gaze avoidance behavior detected'
      })
    }

    // Fatigue pattern
    if (gazeData.blinkData.blinkRate < 5 || gazeData.blinkData.blinkPattern === 'slow') {
      patterns.push({
        type: 'fatigue',
        intensity: Math.max(0, 1 - gazeData.blinkData.blinkRate / 15),
        duration: 2000, // Estimated
        frequency: 1,
        confidence: 0.6,
        description: 'Signs of visual fatigue detected'
      })
    }

    // Anxiety pattern
    if (gazeData.blinkData.blinkRate > 20 || gazeData.saccadeData.saccadeCount > 8) {
      patterns.push({
        type: 'anxiety',
        intensity: Math.min(1, gazeData.blinkData.blinkRate / 30),
        duration: 1500, // Estimated
        frequency: gazeData.blinkData.blinkRate,
        confidence: 0.7,
        description: 'Elevated blink rate suggesting anxiety'
      })
    }

    return patterns
  }

  private detectDistractionEvents(gazeData: GazeData, focusMetrics: FocusMetrics): DistractionEvent[] {
    const events: DistractionEvent[] = []
    const timestamp = Date.now()

    // Gaze away event
    if (gazeData.gazeTarget.region === 'off_screen') {
      events.push({
        timestamp,
        type: 'gaze_away',
        severity: 1 - focusMetrics.visualAttention,
        duration: 500, // Estimated
        recovery_time: 200,
        cause: 'Looking away from screen/camera'
      })
    }

    // Rapid blinking event
    if (gazeData.blinkData.blinkPattern === 'rapid') {
      events.push({
        timestamp,
        type: 'rapid_blinking',
        severity: Math.min(1, gazeData.blinkData.blinkRate / 30),
        duration: 1000,
        recovery_time: 500,
        cause: 'Stress or concentration difficulty'
      })
    }

    // Eye closure event
    if (gazeData.eyePosition.left.eyelidOpenness < 0.3 && gazeData.eyePosition.right.eyelidOpenness < 0.3) {
      events.push({
        timestamp,
        type: 'eye_closure',
        severity: 1 - Math.max(gazeData.eyePosition.left.eyelidOpenness, gazeData.eyePosition.right.eyelidOpenness),
        duration: 300,
        recovery_time: 100,
        cause: 'Fatigue or momentary inattention'
      })
    }

    return events
  }

  private analyzeCognitiveLoad(gazeData: GazeData, focusMetrics: FocusMetrics, patterns: AttentionPattern[]): CognitiveLoad {
    // Processing difficulty based on saccade patterns
    const processingDifficulty = Math.min(1, gazeData.saccadeData.saccadeCount / 10)

    // Mental effort based on fixation intensity
    const mentalEffort = focusMetrics.focusIntensity

    // Working memory load based on attention patterns
    const workingMemoryLoad = patterns.some(p => p.type === 'scanning') ? 0.8 : 0.4

    // Attentional demand based on focus metrics
    const attentionalDemand = 1 - focusMetrics.dividedAttention

    // Stress level based on blink patterns and anxiety indicators
    const stressLevel = patterns.some(p => p.type === 'anxiety') ? 0.8 : 
                       gazeData.blinkData.blinkRate > 20 ? 0.6 : 0.3

    // Fatigue level based on fatigue patterns
    const fatigueLevel = patterns.some(p => p.type === 'fatigue') ? 0.8 : 0.2

    // Overall cognitive load
    const overallLoad = (processingDifficulty + mentalEffort + workingMemoryLoad + 
                        attentionalDemand + stressLevel + fatigueLevel) / 6

    return {
      overallLoad,
      processingDifficulty,
      mentalEffort,
      workingMemoryLoad,
      attentionalDemand,
      stressLevel,
      fatigueLevel
    }
  }

  private calculateEngagementLevel(focusMetrics: FocusMetrics, patterns: AttentionPattern[], cognitiveLoad: CognitiveLoad): number {
    // Base engagement from focus metrics
    let engagement = focusMetrics.overallFocus

    // Boost for sustained focus patterns
    if (patterns.some(p => p.type === 'sustained_focus')) {
      engagement += 0.2
    }

    // Reduce for avoidance patterns
    if (patterns.some(p => p.type === 'avoidance')) {
      engagement -= 0.3
    }

    // Adjust for cognitive load (moderate load indicates engagement)
    if (cognitiveLoad.overallLoad > 0.3 && cognitiveLoad.overallLoad < 0.7) {
      engagement += 0.1
    }

    // Reduce for fatigue
    if (patterns.some(p => p.type === 'fatigue')) {
      engagement -= 0.2
    }

    return Math.max(0, Math.min(1, engagement))
  }

  private calculateConfidence(gazeData: GazeData, focusMetrics: FocusMetrics): number {
    let confidence = 0.7 // Base confidence

    // Increase confidence with good eye detection
    const eyeQuality = (gazeData.eyePosition.left.eyelidOpenness + gazeData.eyePosition.right.eyelidOpenness) / 2
    confidence += eyeQuality * 0.2

    // Increase confidence with stable gaze
    if (gazeData.fixationData.fixationStability > 0.7) {
      confidence += 0.1
    }

    // Reduce confidence for poor gaze target detection
    if (gazeData.gazeTarget.confidence < 0.5) {
      confidence -= 0.2
    }

    return Math.max(0.3, Math.min(1.0, confidence))
  }

  private getDefaultGazeData(): GazeData {
    return {
      eyePosition: {
        left: { center: { x: 0, y: 0 }, pupilDiameter: 0, eyelidOpenness: 1, eyeAspectRatio: 0.3, landmarks: [] },
        right: { center: { x: 0, y: 0 }, pupilDiameter: 0, eyelidOpenness: 1, eyeAspectRatio: 0.3, landmarks: [] }
      },
      gazeDirection: { x: 0, y: 0, z: 0 },
      gazeTarget: { region: 'screen_center', coordinates: { x: 0, y: 0 }, confidence: 0.5, duration: 0 },
      fixationData: { isFixating: false, fixationPoint: { x: 0, y: 0 }, fixationDuration: 0, fixationStability: 0, fixationCount: 0 },
      saccadeData: { isSaccading: false, saccadeVelocity: 0, saccadeAmplitude: 0, saccadeDirection: 0, saccadeCount: 0, averageSaccadeSpeed: 0 },
      blinkData: { blinkRate: 15, blinkDuration: 150, blinkCompleteness: 1, blinkPattern: 'normal', lastBlinkTime: 0 }
    }
  }

  private getDefaultCognitiveLoad(): CognitiveLoad {
    return {
      overallLoad: 0.5,
      processingDifficulty: 0.5,
      mentalEffort: 0.5,
      workingMemoryLoad: 0.5,
      attentionalDemand: 0.5,
      stressLevel: 0.3,
      fatigueLevel: 0.2
    }
  }

  // Public API methods
  getAttentionHistory(): AttentionTrackingResult[] {
    return [...this.attentionHistory]
  }

  getGazeHistory(): GazeData[] {
    return [...this.gazeHistory]
  }

  getCalibrationStatus(): boolean {
    return this.isCalibrated
  }

  getCalibrationData(): any {
    return this.calibrationData
  }

  updateConfig(newConfig: Partial<AttentionTrackingConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  clearHistory(): void {
    this.gazeHistory = []
    this.attentionHistory = []
  }

  destroy(): void {
    this.clearHistory()
    this.calibrationData = null
    this.isCalibrated = false
    this.isInitialized = false
    console.log('Attention Tracking Service destroyed')
  }
}

export { 
  AttentionTrackingService,
  type AttentionTrackingResult,
  type GazeData,
  type FocusMetrics,
  type AttentionPattern,
  type DistractionEvent,
  type CognitiveLoad,
  type AttentionTrackingConfig
}
