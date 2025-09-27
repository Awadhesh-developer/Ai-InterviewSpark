/**
 * Advanced Gaze Tracking Service
 * Provides sophisticated eye tracking, gaze estimation, and attention analysis
 */

interface GazePoint {
  x: number // Screen coordinates (0-1)
  y: number // Screen coordinates (0-1)
  timestamp: number
  confidence: number
}

interface EyeData {
  center: { x: number; y: number }
  landmarks: Array<{ x: number; y: number }>
  isOpen: boolean
  aspectRatio: number
  pupilPosition: { x: number; y: number }
}

interface GazeCalibration {
  isCalibrated: boolean
  calibrationPoints: Array<{
    screen: { x: number; y: number }
    gaze: { x: number; y: number }
  }>
  transformMatrix: number[][]
  accuracy: number
}

interface AttentionMetrics {
  focusScore: number // 0-1, how focused the user is
  distractionEvents: number // Count of distraction events
  averageGazeDuration: number // Average time spent looking at one area
  gazeStability: number // How stable the gaze is
  screenCoverage: number // Percentage of screen area looked at
  attentionSpan: number // Sustained attention duration
}

interface GazeHeatmapData {
  points: Array<{ x: number; y: number; intensity: number }>
  gridSize: number
  maxIntensity: number
}

interface GazeTrackingConfig {
  calibrationRequired: boolean
  smoothingFactor: number
  confidenceThreshold: number
  attentionWindowMs: number
  distractionThresholdMs: number
  heatmapEnabled: boolean
  heatmapGridSize: number
}

class GazeTrackingService {
  private isInitialized: boolean = false
  private isTracking: boolean = false
  private calibration: GazeCalibration = {
    isCalibrated: false,
    calibrationPoints: [],
    transformMatrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    accuracy: 0
  }
  
  private gazeHistory: GazePoint[] = []
  private attentionMetrics: AttentionMetrics = {
    focusScore: 0,
    distractionEvents: 0,
    averageGazeDuration: 0,
    gazeStability: 0,
    screenCoverage: 0,
    attentionSpan: 0
  }
  
  private heatmapData: GazeHeatmapData = {
    points: [],
    gridSize: 20,
    maxIntensity: 0
  }
  
  private eventHandlers: Map<string, Function[]> = new Map()
  private screenDimensions = { width: 0, height: 0 }
  private lastGazePoint: GazePoint | null = null
  private currentFixationStart: number = 0
  private fixationDurations: number[] = []
  
  private config: GazeTrackingConfig = {
    calibrationRequired: true,
    smoothingFactor: 0.3,
    confidenceThreshold: 0.7,
    attentionWindowMs: 5000,
    distractionThresholdMs: 1000,
    heatmapEnabled: true,
    heatmapGridSize: 20
  }

  constructor(config?: Partial<GazeTrackingConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    this.updateScreenDimensions()
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.updateScreenDimensions())
    }
  }

  private updateScreenDimensions(): void {
    if (typeof window !== 'undefined') {
      this.screenDimensions = {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.updateScreenDimensions()
      this.resetMetrics()
      this.isInitialized = true
      this.emit('initialized', { timestamp: Date.now() })
    } catch (error) {
      console.error('Failed to initialize gaze tracking:', error)
      throw error
    }
  }

  async startCalibration(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    this.calibration.calibrationPoints = []
    this.emit('calibration.started', { timestamp: Date.now() })
  }

  async addCalibrationPoint(screenX: number, screenY: number, eyeData: { left: EyeData; right: EyeData }): Promise<void> {
    const gazePoint = this.estimateGazeFromEyes(eyeData.left, eyeData.right)
    
    this.calibration.calibrationPoints.push({
      screen: { x: screenX, y: screenY },
      gaze: gazePoint
    })

    this.emit('calibration.point.added', {
      pointIndex: this.calibration.calibrationPoints.length - 1,
      screenPoint: { x: screenX, y: screenY },
      gazePoint
    })

    // Auto-complete calibration after 9 points (3x3 grid)
    if (this.calibration.calibrationPoints.length >= 9) {
      await this.completeCalibration()
    }
  }

  async completeCalibration(): Promise<void> {
    if (this.calibration.calibrationPoints.length < 4) {
      throw new Error('Insufficient calibration points. Need at least 4 points.')
    }

    try {
      this.calibration.transformMatrix = this.calculateTransformMatrix()
      this.calibration.accuracy = this.calculateCalibrationAccuracy()
      this.calibration.isCalibrated = true

      this.emit('calibration.completed', {
        accuracy: this.calibration.accuracy,
        pointCount: this.calibration.calibrationPoints.length
      })
    } catch (error) {
      console.error('Calibration failed:', error)
      this.emit('calibration.failed', { error })
      throw error
    }
  }

  private calculateTransformMatrix(): number[][] {
    // Simplified homography calculation for gaze transformation
    // In production, use more sophisticated algorithms like polynomial regression
    const points = this.calibration.calibrationPoints
    
    if (points.length < 4) {
      return [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    }

    // Calculate average offset and scaling
    let offsetX = 0, offsetY = 0, scaleX = 1, scaleY = 1
    
    for (const point of points) {
      offsetX += point.screen.x - point.gaze.x
      offsetY += point.screen.y - point.gaze.y
    }
    
    offsetX /= points.length
    offsetY /= points.length

    // Simple linear transformation matrix
    return [
      [scaleX, 0, offsetX],
      [0, scaleY, offsetY],
      [0, 0, 1]
    ]
  }

  private calculateCalibrationAccuracy(): number {
    const points = this.calibration.calibrationPoints
    let totalError = 0

    for (const point of points) {
      const predicted = this.transformGazePoint(point.gaze)
      const error = Math.sqrt(
        Math.pow(predicted.x - point.screen.x, 2) +
        Math.pow(predicted.y - point.screen.y, 2)
      )
      totalError += error
    }

    const averageError = totalError / points.length
    const maxError = Math.sqrt(2) // Maximum possible error (corner to corner)
    return Math.max(0, 1 - (averageError / maxError))
  }

  private transformGazePoint(gazePoint: { x: number; y: number }): { x: number; y: number } {
    const matrix = this.calibration.transformMatrix
    
    const x = matrix[0][0] * gazePoint.x + matrix[0][1] * gazePoint.y + matrix[0][2]
    const y = matrix[1][0] * gazePoint.x + matrix[1][1] * gazePoint.y + matrix[1][2]
    
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    }
  }

  startTracking(): void {
    if (!this.isInitialized) {
      throw new Error('Gaze tracking not initialized')
    }

    this.isTracking = true
    this.resetMetrics()
    this.emit('tracking.started', { timestamp: Date.now() })
  }

  stopTracking(): void {
    this.isTracking = false
    this.emit('tracking.stopped', { 
      timestamp: Date.now(),
      metrics: this.attentionMetrics,
      gazeHistory: this.gazeHistory.slice(-100) // Last 100 points
    })
  }

  processGazeData(leftEye: EyeData, rightEye: EyeData): GazePoint | null {
    if (!this.isTracking) return null

    try {
      const rawGaze = this.estimateGazeFromEyes(leftEye, rightEye)
      const confidence = this.calculateGazeConfidence(leftEye, rightEye)
      
      if (confidence < this.config.confidenceThreshold) {
        return null
      }

      let gazePoint: GazePoint
      
      if (this.calibration.isCalibrated) {
        const calibratedGaze = this.transformGazePoint(rawGaze)
        gazePoint = {
          x: calibratedGaze.x,
          y: calibratedGaze.y,
          timestamp: Date.now(),
          confidence
        }
      } else {
        gazePoint = {
          x: rawGaze.x,
          y: rawGaze.y,
          timestamp: Date.now(),
          confidence
        }
      }

      // Apply smoothing
      if (this.lastGazePoint) {
        gazePoint = this.smoothGazePoint(gazePoint, this.lastGazePoint)
      }

      this.updateGazeHistory(gazePoint)
      this.updateAttentionMetrics(gazePoint)
      this.updateHeatmap(gazePoint)
      
      this.lastGazePoint = gazePoint
      this.emit('gaze.update', gazePoint)
      
      return gazePoint
    } catch (error) {
      console.error('Error processing gaze data:', error)
      return null
    }
  }

  private estimateGazeFromEyes(leftEye: EyeData, rightEye: EyeData): { x: number; y: number } {
    // Simplified gaze estimation based on eye center and pupil position
    // In production, use more sophisticated algorithms considering head pose
    
    const avgEyeCenter = {
      x: (leftEye.center.x + rightEye.center.x) / 2,
      y: (leftEye.center.y + rightEye.center.y) / 2
    }

    const avgPupilPosition = {
      x: (leftEye.pupilPosition.x + rightEye.pupilPosition.x) / 2,
      y: (leftEye.pupilPosition.y + rightEye.pupilPosition.y) / 2
    }

    // Calculate gaze direction based on pupil displacement
    const gazeX = 0.5 + (avgPupilPosition.x - avgEyeCenter.x) * 2
    const gazeY = 0.5 + (avgPupilPosition.y - avgEyeCenter.y) * 2

    return {
      x: Math.max(0, Math.min(1, gazeX)),
      y: Math.max(0, Math.min(1, gazeY))
    }
  }

  private calculateGazeConfidence(leftEye: EyeData, rightEye: EyeData): number {
    // Calculate confidence based on eye openness and detection quality
    const leftOpenness = leftEye.isOpen ? 1 : 0
    const rightOpenness = rightEye.isOpen ? 1 : 0
    const avgOpenness = (leftOpenness + rightOpenness) / 2

    // Factor in eye aspect ratio for better confidence estimation
    const leftAspectRatio = Math.min(1, leftEye.aspectRatio / 0.3)
    const rightAspectRatio = Math.min(1, rightEye.aspectRatio / 0.3)
    const avgAspectRatio = (leftAspectRatio + rightAspectRatio) / 2

    return avgOpenness * avgAspectRatio
  }

  private smoothGazePoint(current: GazePoint, previous: GazePoint): GazePoint {
    const factor = this.config.smoothingFactor
    
    return {
      x: previous.x * (1 - factor) + current.x * factor,
      y: previous.y * (1 - factor) + current.y * factor,
      timestamp: current.timestamp,
      confidence: current.confidence
    }
  }

  private updateGazeHistory(gazePoint: GazePoint): void {
    this.gazeHistory.push(gazePoint)
    
    // Keep only recent history (last 5 minutes at 30fps = 9000 points)
    if (this.gazeHistory.length > 9000) {
      this.gazeHistory = this.gazeHistory.slice(-9000)
    }
  }

  private updateAttentionMetrics(gazePoint: GazePoint): void {
    const now = gazePoint.timestamp
    const recentHistory = this.gazeHistory.filter(p => now - p.timestamp < this.config.attentionWindowMs)
    
    if (recentHistory.length < 2) return

    // Calculate focus score based on gaze stability
    this.attentionMetrics.focusScore = this.calculateFocusScore(recentHistory)
    
    // Update gaze stability
    this.attentionMetrics.gazeStability = this.calculateGazeStability(recentHistory)
    
    // Check for distraction events
    this.checkForDistraction(gazePoint)
    
    // Update fixation tracking
    this.updateFixationTracking(gazePoint)
    
    // Calculate screen coverage
    this.attentionMetrics.screenCoverage = this.calculateScreenCoverage(recentHistory)
    
    // Update attention span
    this.attentionMetrics.attentionSpan = this.calculateAttentionSpan()
  }

  private calculateFocusScore(history: GazePoint[]): number {
    if (history.length < 2) return 0

    let totalVariation = 0
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1]
      const curr = history[i]
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      )
      totalVariation += distance
    }

    const avgVariation = totalVariation / (history.length - 1)
    return Math.max(0, 1 - avgVariation * 10) // Scale and invert
  }

  private calculateGazeStability(history: GazePoint[]): number {
    if (history.length < 3) return 1

    const centerX = history.reduce((sum, p) => sum + p.x, 0) / history.length
    const centerY = history.reduce((sum, p) => sum + p.y, 0) / history.length

    let totalDeviation = 0
    for (const point of history) {
      totalDeviation += Math.sqrt(
        Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
      )
    }

    const avgDeviation = totalDeviation / history.length
    return Math.max(0, 1 - avgDeviation * 5) // Scale and invert
  }

  private checkForDistraction(gazePoint: GazePoint): void {
    if (!this.lastGazePoint) return

    const timeDiff = gazePoint.timestamp - this.lastGazePoint.timestamp
    const distance = Math.sqrt(
      Math.pow(gazePoint.x - this.lastGazePoint.x, 2) +
      Math.pow(gazePoint.y - this.lastGazePoint.y, 2)
    )

    // Large movement in short time indicates distraction
    if (distance > 0.3 && timeDiff < this.config.distractionThresholdMs) {
      this.attentionMetrics.distractionEvents++
      this.emit('distraction.detected', {
        timestamp: gazePoint.timestamp,
        distance,
        timeDiff
      })
    }
  }

  private updateFixationTracking(gazePoint: GazePoint): void {
    const fixationThreshold = 0.05 // 5% of screen
    
    if (!this.lastGazePoint) {
      this.currentFixationStart = gazePoint.timestamp
      return
    }

    const distance = Math.sqrt(
      Math.pow(gazePoint.x - this.lastGazePoint.x, 2) +
      Math.pow(gazePoint.y - this.lastGazePoint.y, 2)
    )

    if (distance > fixationThreshold) {
      // End current fixation
      if (this.currentFixationStart > 0) {
        const fixationDuration = this.lastGazePoint.timestamp - this.currentFixationStart
        this.fixationDurations.push(fixationDuration)
        
        // Keep only recent fixations
        if (this.fixationDurations.length > 100) {
          this.fixationDurations = this.fixationDurations.slice(-100)
        }
      }
      
      // Start new fixation
      this.currentFixationStart = gazePoint.timestamp
    }

    // Update average fixation duration
    if (this.fixationDurations.length > 0) {
      this.attentionMetrics.averageGazeDuration = 
        this.fixationDurations.reduce((sum, d) => sum + d, 0) / this.fixationDurations.length
    }
  }

  private calculateScreenCoverage(history: GazePoint[]): number {
    if (history.length === 0) return 0

    const gridSize = 10
    const visited = new Set<string>()

    for (const point of history) {
      const gridX = Math.floor(point.x * gridSize)
      const gridY = Math.floor(point.y * gridSize)
      visited.add(`${gridX},${gridY}`)
    }

    return visited.size / (gridSize * gridSize)
  }

  private calculateAttentionSpan(): number {
    const now = Date.now()
    const recentHistory = this.gazeHistory.filter(p => now - p.timestamp < 60000) // Last minute
    
    if (recentHistory.length === 0) return 0

    const startTime = recentHistory[0].timestamp
    const endTime = recentHistory[recentHistory.length - 1].timestamp
    
    return endTime - startTime
  }

  private updateHeatmap(gazePoint: GazePoint): void {
    if (!this.config.heatmapEnabled) return

    const gridSize = this.config.heatmapGridSize
    const gridX = Math.floor(gazePoint.x * gridSize)
    const gridY = Math.floor(gazePoint.y * gridSize)

    // Find existing point or create new one
    let existingPoint = this.heatmapData.points.find(p => 
      Math.floor(p.x * gridSize) === gridX && Math.floor(p.y * gridSize) === gridY
    )

    if (existingPoint) {
      existingPoint.intensity += 1
    } else {
      this.heatmapData.points.push({
        x: gazePoint.x,
        y: gazePoint.y,
        intensity: 1
      })
    }

    // Update max intensity
    this.heatmapData.maxIntensity = Math.max(
      this.heatmapData.maxIntensity,
      existingPoint?.intensity || 1
    )

    // Limit heatmap points
    if (this.heatmapData.points.length > 1000) {
      this.heatmapData.points = this.heatmapData.points
        .sort((a, b) => b.intensity - a.intensity)
        .slice(0, 1000)
    }
  }

  private resetMetrics(): void {
    this.attentionMetrics = {
      focusScore: 0,
      distractionEvents: 0,
      averageGazeDuration: 0,
      gazeStability: 0,
      screenCoverage: 0,
      attentionSpan: 0
    }
    
    this.gazeHistory = []
    this.fixationDurations = []
    this.heatmapData.points = []
    this.heatmapData.maxIntensity = 0
    this.lastGazePoint = null
    this.currentFixationStart = 0
  }

  // Public API methods
  getCurrentGaze(): GazePoint | null {
    return this.lastGazePoint
  }

  getAttentionMetrics(): AttentionMetrics {
    return { ...this.attentionMetrics }
  }

  getHeatmapData(): GazeHeatmapData {
    return {
      points: [...this.heatmapData.points],
      gridSize: this.heatmapData.gridSize,
      maxIntensity: this.heatmapData.maxIntensity
    }
  }

  getCalibrationStatus(): GazeCalibration {
    return { ...this.calibration }
  }

  isCalibrated(): boolean {
    return this.calibration.isCalibrated
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking
  }

  updateConfig(newConfig: Partial<GazeTrackingConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  getConfig(): GazeTrackingConfig {
    return { ...this.config }
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
        console.error(`Error in gaze tracking event handler for ${event}:`, error)
      }
    })
  }

  // Cleanup
  destroy(): void {
    this.stopTracking()
    this.eventHandlers.clear()
    this.resetMetrics()
    this.isInitialized = false
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.updateScreenDimensions)
    }
  }
}

export { 
  GazeTrackingService,
  type GazePoint,
  type EyeData,
  type GazeCalibration,
  type AttentionMetrics,
  type GazeHeatmapData,
  type GazeTrackingConfig
}
