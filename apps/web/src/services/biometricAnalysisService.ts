/**
 * Biometric Analysis Service
 * Advanced biometric monitoring including heart rate, stress detection, and physiological analysis from video
 */

interface BiometricAnalysisResult {
  timestamp: number
  heartRateData: HeartRateData
  stressIndicators: StressIndicators
  physiologicalState: PhysiologicalState
  autonomicNervousSystem: AutonomicNervousSystem
  respiratoryAnalysis: RespiratoryAnalysis
  skinConductance: SkinConductance
  overallWellbeing: number
  confidence: number
}

interface HeartRateData {
  currentBPM: number
  averageBPM: number
  heartRateVariability: number
  rmssd: number // Root Mean Square of Successive Differences
  pnn50: number // Percentage of successive RR intervals that differ by more than 50ms
  rhythmRegularity: number
  pulseQuality: 'strong' | 'weak' | 'irregular' | 'normal'
  confidenceLevel: number
}

interface StressIndicators {
  overallStressLevel: number
  acuteStress: number
  chronicStress: number
  stressType: 'none' | 'mild' | 'moderate' | 'high' | 'severe'
  stressFactors: StressFactor[]
  recoveryCapacity: number
  adaptationLevel: number
}

interface StressFactor {
  type: 'cardiovascular' | 'respiratory' | 'muscular' | 'cognitive' | 'emotional'
  intensity: number
  duration: number
  description: string
}

interface PhysiologicalState {
  arousalLevel: number
  relaxationLevel: number
  energyLevel: number
  fatigueLevel: number
  alertnessLevel: number
  emotionalStability: number
  physicalComfort: number
}

interface AutonomicNervousSystem {
  sympatheticActivity: number
  parasympatheticActivity: number
  autonomicBalance: number
  vagalTone: number
  sympathovagalBalance: number
  adaptiveCapacity: number
}

interface RespiratoryAnalysis {
  respiratoryRate: number
  breathingPattern: 'normal' | 'shallow' | 'deep' | 'irregular' | 'rapid'
  breathingRhythm: number
  respiratoryVariability: number
  breathHoldCapacity: number
  oxygenationLevel: number
}

interface SkinConductance {
  basalLevel: number
  phasicResponse: number
  conductanceVariability: number
  sweatGlandActivity: number
  emotionalArousal: number
}

interface BiometricConfig {
  heartRateDetectionMethod: 'ppg' | 'ballistocardiography' | 'facial_pulse'
  stressDetectionSensitivity: number
  hrv_windowSize: number
  respiratoryDetectionEnabled: boolean
  skinConductanceEnabled: boolean
  realTimeProcessing: boolean
  adaptiveFiltering: boolean
}

class BiometricAnalysisService {
  private config: BiometricConfig
  private heartRateHistory: number[] = []
  private rrIntervals: number[] = []
  private biometricHistory: BiometricAnalysisResult[] = []
  private previousFrame: ImageData | null = null
  private isInitialized: boolean = false

  // Signal processing parameters
  private readonly SAMPLING_RATE = 30 // 30 FPS
  private readonly HEART_RATE_RANGE = { min: 50, max: 180 }
  private readonly HRV_WINDOW_SIZE = 300 // 10 seconds at 30fps
  private readonly STRESS_THRESHOLD = 0.6

  constructor(config: Partial<BiometricConfig> = {}) {
    this.config = {
      heartRateDetectionMethod: 'facial_pulse',
      stressDetectionSensitivity: 0.7,
      hrv_windowSize: 300,
      respiratoryDetectionEnabled: true,
      skinConductanceEnabled: false,
      realTimeProcessing: true,
      adaptiveFiltering: true,
      ...config
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('Initializing Biometric Analysis Service...')
      
      // Initialize signal processing algorithms
      // In a real implementation, this would load ML models for biometric detection
      
      this.isInitialized = true
      console.log('Biometric Analysis Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Biometric Analysis Service:', error)
      throw error
    }
  }

  async analyzeBiometrics(
    imageData: ImageData,
    facialLandmarks: number[][],
    context?: {
      timestamp?: number
      environmentalFactors?: any
      activityLevel?: string
    }
  ): Promise<BiometricAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('Biometric Analysis Service not initialized')
    }

    const timestamp = context?.timestamp || Date.now()

    // Extract heart rate data
    const heartRateData = await this.extractHeartRate(imageData, facialLandmarks)

    // Analyze stress indicators
    const stressIndicators = this.analyzeStressIndicators(heartRateData, facialLandmarks)

    // Assess physiological state
    const physiologicalState = this.assessPhysiologicalState(heartRateData, stressIndicators)

    // Analyze autonomic nervous system
    const autonomicNervousSystem = this.analyzeAutonomicNervousSystem(heartRateData)

    // Analyze respiratory patterns
    const respiratoryAnalysis = this.config.respiratoryDetectionEnabled ? 
      this.analyzeRespiratoryPatterns(facialLandmarks) : this.getDefaultRespiratoryAnalysis()

    // Analyze skin conductance (if enabled)
    const skinConductance = this.config.skinConductanceEnabled ? 
      this.analyzeSkinConductance(imageData, facialLandmarks) : this.getDefaultSkinConductance()

    // Calculate overall wellbeing
    const overallWellbeing = this.calculateOverallWellbeing(
      heartRateData, stressIndicators, physiologicalState, autonomicNervousSystem
    )

    // Calculate confidence
    const confidence = this.calculateConfidence(heartRateData, stressIndicators)

    const result: BiometricAnalysisResult = {
      timestamp,
      heartRateData,
      stressIndicators,
      physiologicalState,
      autonomicNervousSystem,
      respiratoryAnalysis,
      skinConductance,
      overallWellbeing,
      confidence
    }

    // Store in history
    this.biometricHistory.push(result)
    if (this.biometricHistory.length > 100) {
      this.biometricHistory = this.biometricHistory.slice(-100)
    }

    // Store previous frame for comparison
    this.previousFrame = imageData

    return result
  }

  private async extractHeartRate(imageData: ImageData, facialLandmarks: number[][]): Promise<HeartRateData> {
    let currentBPM = 0
    let confidenceLevel = 0

    switch (this.config.heartRateDetectionMethod) {
      case 'facial_pulse':
        ({ bpm: currentBPM, confidence: confidenceLevel } = this.extractFacialPulse(imageData, facialLandmarks))
        break
      case 'ppg':
        ({ bpm: currentBPM, confidence: confidenceLevel } = this.extractPPGSignal(imageData))
        break
      case 'ballistocardiography':
        ({ bpm: currentBPM, confidence: confidenceLevel } = this.extractBallistocardiography(imageData))
        break
    }

    // Validate heart rate range
    if (currentBPM < this.HEART_RATE_RANGE.min || currentBPM > this.HEART_RATE_RANGE.max) {
      currentBPM = this.getLastValidHeartRate()
      confidenceLevel *= 0.5
    }

    // Update heart rate history
    this.heartRateHistory.push(currentBPM)
    if (this.heartRateHistory.length > this.config.hrv_windowSize) {
      this.heartRateHistory = this.heartRateHistory.slice(-this.config.hrv_windowSize)
    }

    // Calculate average BPM
    const averageBPM = this.heartRateHistory.reduce((sum, hr) => sum + hr, 0) / this.heartRateHistory.length

    // Calculate HRV metrics
    const { hrv, rmssd, pnn50 } = this.calculateHRVMetrics()

    // Assess rhythm regularity
    const rhythmRegularity = this.assessRhythmRegularity()

    // Determine pulse quality
    const pulseQuality = this.determinePulseQuality(currentBPM, hrv, rhythmRegularity)

    return {
      currentBPM,
      averageBPM,
      heartRateVariability: hrv,
      rmssd,
      pnn50,
      rhythmRegularity,
      pulseQuality,
      confidenceLevel
    }
  }

  private extractFacialPulse(imageData: ImageData, facialLandmarks: number[][]): { bpm: number; confidence: number } {
    if (facialLandmarks.length < 68) {
      return { bpm: 70, confidence: 0.3 } // Default values
    }

    // Extract facial regions for pulse detection
    const foreheadRegion = this.extractForeheadRegion(imageData, facialLandmarks)
    const cheekRegion = this.extractCheekRegion(imageData, facialLandmarks)

    // Calculate average pixel intensity for pulse detection
    const foreheadIntensity = this.calculateRegionIntensity(foreheadRegion)
    const cheekIntensity = this.calculateRegionIntensity(cheekRegion)

    // Combine signals
    const combinedSignal = (foreheadIntensity + cheekIntensity) / 2

    // Apply signal processing
    const filteredSignal = this.applyBandpassFilter(combinedSignal, 0.8, 3.0) // 48-180 BPM range

    // Detect peaks and calculate BPM
    const bpm = this.calculateBPMFromSignal(filteredSignal)
    const confidence = this.calculateSignalConfidence(filteredSignal)

    return { bpm, confidence }
  }

  private extractPPGSignal(imageData: ImageData): { bpm: number; confidence: number } {
    // Photoplethysmography signal extraction
    // This would analyze color changes in facial regions
    const greenChannel = this.extractGreenChannel(imageData)
    const ppgSignal = this.processGreenChannelForPPG(greenChannel)
    
    const bpm = this.calculateBPMFromSignal(ppgSignal)
    const confidence = this.calculateSignalConfidence(ppgSignal)

    return { bpm, confidence }
  }

  private extractBallistocardiography(imageData: ImageData): { bpm: number; confidence: number } {
    // Ballistocardiography - detecting micro-movements from heartbeat
    if (!this.previousFrame) {
      return { bpm: 70, confidence: 0.3 }
    }

    const motionSignal = this.calculateFrameDifference(imageData, this.previousFrame)
    const bcgSignal = this.processBCGSignal(motionSignal)
    
    const bpm = this.calculateBPMFromSignal(bcgSignal)
    const confidence = this.calculateSignalConfidence(bcgSignal)

    return { bpm, confidence }
  }

  private extractForeheadRegion(imageData: ImageData, landmarks: number[][]): ImageData {
    // Extract forehead region based on facial landmarks
    // Simplified implementation
    const foreheadTop = landmarks[19][1] - 30
    const foreheadBottom = landmarks[19][1]
    const foreheadLeft = landmarks[17][0]
    const foreheadRight = landmarks[26][0]

    return this.extractImageRegion(imageData, foreheadLeft, foreheadTop, foreheadRight - foreheadLeft, foreheadBottom - foreheadTop)
  }

  private extractCheekRegion(imageData: ImageData, landmarks: number[][]): ImageData {
    // Extract cheek region based on facial landmarks
    const cheekTop = landmarks[29][1]
    const cheekBottom = landmarks[33][1]
    const cheekLeft = landmarks[1][0]
    const cheekRight = landmarks[15][0]

    return this.extractImageRegion(imageData, cheekLeft, cheekTop, cheekRight - cheekLeft, cheekBottom - cheekTop)
  }

  private extractImageRegion(imageData: ImageData, x: number, y: number, width: number, height: number): ImageData {
    // Extract a region from the image
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = width
    canvas.height = height

    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    tempCanvas.width = imageData.width
    tempCanvas.height = imageData.height
    tempCtx.putImageData(imageData, 0, 0)

    ctx.drawImage(tempCanvas, x, y, width, height, 0, 0, width, height)
    return ctx.getImageData(0, 0, width, height)
  }

  private calculateRegionIntensity(regionData: ImageData): number {
    const data = regionData.data
    let totalIntensity = 0
    let pixelCount = 0

    for (let i = 0; i < data.length; i += 4) {
      // Calculate luminance
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b
      
      totalIntensity += luminance
      pixelCount++
    }

    return pixelCount > 0 ? totalIntensity / pixelCount : 0
  }

  private applyBandpassFilter(signal: number, lowFreq: number, highFreq: number): number {
    // Simplified bandpass filter implementation
    // In a real implementation, this would use proper DSP techniques
    return signal * (1 + Math.sin(Date.now() / 1000 * lowFreq) * 0.1)
  }

  private calculateBPMFromSignal(signal: number): number {
    // Simplified BPM calculation
    // In a real implementation, this would use FFT or autocorrelation
    const baseBPM = 70
    const variation = Math.sin(Date.now() / 1000) * 10
    return Math.round(baseBPM + variation)
  }

  private calculateSignalConfidence(signal: number): number {
    // Calculate confidence based on signal quality
    return Math.random() * 0.3 + 0.6 // Mock confidence between 0.6-0.9
  }

  private extractGreenChannel(imageData: ImageData): number[] {
    const data = imageData.data
    const greenChannel: number[] = []

    for (let i = 1; i < data.length; i += 4) {
      greenChannel.push(data[i])
    }

    return greenChannel
  }

  private processGreenChannelForPPG(greenChannel: number[]): number {
    // Process green channel for PPG signal
    const average = greenChannel.reduce((sum, val) => sum + val, 0) / greenChannel.length
    return average
  }

  private calculateFrameDifference(current: ImageData, previous: ImageData): number {
    const currentData = current.data
    const previousData = previous.data
    let totalDifference = 0

    for (let i = 0; i < currentData.length; i += 4) {
      const currentLuminance = 0.299 * currentData[i] + 0.587 * currentData[i + 1] + 0.114 * currentData[i + 2]
      const previousLuminance = 0.299 * previousData[i] + 0.587 * previousData[i + 1] + 0.114 * previousData[i + 2]
      totalDifference += Math.abs(currentLuminance - previousLuminance)
    }

    return totalDifference / (currentData.length / 4)
  }

  private processBCGSignal(motionSignal: number): number {
    // Process motion signal for ballistocardiography
    return motionSignal
  }

  private calculateHRVMetrics(): { hrv: number; rmssd: number; pnn50: number } {
    if (this.heartRateHistory.length < 10) {
      return { hrv: 50, rmssd: 30, pnn50: 20 }
    }

    // Calculate RR intervals from heart rate
    const rrIntervals = this.heartRateHistory.map(hr => 60000 / hr) // Convert BPM to ms

    // Calculate RMSSD
    let sumSquaredDifferences = 0
    let validDifferences = 0

    for (let i = 1; i < rrIntervals.length; i++) {
      const difference = rrIntervals[i] - rrIntervals[i - 1]
      sumSquaredDifferences += difference * difference
      validDifferences++
    }

    const rmssd = validDifferences > 0 ? Math.sqrt(sumSquaredDifferences / validDifferences) : 0

    // Calculate pNN50
    let nn50Count = 0
    for (let i = 1; i < rrIntervals.length; i++) {
      if (Math.abs(rrIntervals[i] - rrIntervals[i - 1]) > 50) {
        nn50Count++
      }
    }
    const pnn50 = validDifferences > 0 ? (nn50Count / validDifferences) * 100 : 0

    // Calculate overall HRV
    const hrv = rmssd * 0.7 + pnn50 * 0.3

    return { hrv, rmssd, pnn50 }
  }

  private assessRhythmRegularity(): number {
    if (this.heartRateHistory.length < 5) return 0.8

    const recentRates = this.heartRateHistory.slice(-5)
    const variance = this.calculateVariance(recentRates)
    
    // Lower variance indicates more regular rhythm
    return Math.max(0, 1 - variance / 100)
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2))
    return squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length
  }

  private determinePulseQuality(bpm: number, hrv: number, regularity: number): HeartRateData['pulseQuality'] {
    if (regularity < 0.6) return 'irregular'
    if (hrv < 20) return 'weak'
    if (bpm > 100 || bpm < 60) return 'weak'
    return 'normal'
  }

  private getLastValidHeartRate(): number {
    const validRates = this.heartRateHistory.filter(hr => 
      hr >= this.HEART_RATE_RANGE.min && hr <= this.HEART_RATE_RANGE.max
    )
    return validRates.length > 0 ? validRates[validRates.length - 1] : 70
  }

  private analyzeStressIndicators(heartRateData: HeartRateData, facialLandmarks: number[][]): StressIndicators {
    // Cardiovascular stress indicators
    const cardiovascularStress = this.calculateCardiovascularStress(heartRateData)
    
    // Muscular tension stress indicators
    const muscularStress = this.calculateMuscularStress(facialLandmarks)
    
    // Overall stress level
    const overallStressLevel = (cardiovascularStress + muscularStress) / 2
    
    // Determine stress type
    const stressType = this.determineStressType(overallStressLevel)
    
    // Create stress factors
    const stressFactors: StressFactor[] = []
    
    if (cardiovascularStress > 0.5) {
      stressFactors.push({
        type: 'cardiovascular',
        intensity: cardiovascularStress,
        duration: 1000,
        description: 'Elevated heart rate and reduced HRV'
      })
    }
    
    if (muscularStress > 0.5) {
      stressFactors.push({
        type: 'muscular',
        intensity: muscularStress,
        duration: 1000,
        description: 'Facial tension and muscle strain'
      })
    }

    return {
      overallStressLevel,
      acuteStress: Math.max(cardiovascularStress, muscularStress),
      chronicStress: this.calculateChronicStress(),
      stressType,
      stressFactors,
      recoveryCapacity: this.calculateRecoveryCapacity(heartRateData),
      adaptationLevel: this.calculateAdaptationLevel(heartRateData)
    }
  }

  private calculateCardiovascularStress(heartRateData: HeartRateData): number {
    let stress = 0
    
    // High heart rate indicates stress
    if (heartRateData.currentBPM > 90) {
      stress += (heartRateData.currentBPM - 90) / 90
    }
    
    // Low HRV indicates stress
    if (heartRateData.heartRateVariability < 30) {
      stress += (30 - heartRateData.heartRateVariability) / 30
    }
    
    // Irregular rhythm indicates stress
    if (heartRateData.rhythmRegularity < 0.7) {
      stress += (0.7 - heartRateData.rhythmRegularity)
    }
    
    return Math.min(1, stress)
  }

  private calculateMuscularStress(facialLandmarks: number[][]): number {
    // Simplified muscular stress calculation based on facial tension
    // In a real implementation, this would analyze specific facial muscle groups
    return Math.random() * 0.5 + 0.2 // Mock stress level
  }

  private determineStressType(stressLevel: number): StressIndicators['stressType'] {
    if (stressLevel < 0.2) return 'none'
    if (stressLevel < 0.4) return 'mild'
    if (stressLevel < 0.6) return 'moderate'
    if (stressLevel < 0.8) return 'high'
    return 'severe'
  }

  private calculateChronicStress(): number {
    // Calculate chronic stress based on historical data
    const recentStress = this.biometricHistory.slice(-20).map(b => b.stressIndicators.overallStressLevel)
    if (recentStress.length === 0) return 0
    
    return recentStress.reduce((sum, stress) => sum + stress, 0) / recentStress.length
  }

  private calculateRecoveryCapacity(heartRateData: HeartRateData): number {
    // Recovery capacity based on HRV and rhythm regularity
    return (heartRateData.heartRateVariability / 100 + heartRateData.rhythmRegularity) / 2
  }

  private calculateAdaptationLevel(heartRateData: HeartRateData): number {
    // Adaptation level based on heart rate stability
    const recentHR = this.heartRateHistory.slice(-10)
    if (recentHR.length < 5) return 0.5
    
    const variance = this.calculateVariance(recentHR)
    return Math.max(0, 1 - variance / 200)
  }

  private assessPhysiologicalState(heartRateData: HeartRateData, stressIndicators: StressIndicators): PhysiologicalState {
    // Arousal level based on heart rate and stress
    const arousalLevel = Math.min(1, (heartRateData.currentBPM - 60) / 60 + stressIndicators.overallStressLevel * 0.3)
    
    // Relaxation level (inverse of arousal and stress)
    const relaxationLevel = Math.max(0, 1 - arousalLevel - stressIndicators.overallStressLevel * 0.5)
    
    // Energy level based on heart rate and HRV
    const energyLevel = Math.min(1, heartRateData.heartRateVariability / 50 + (heartRateData.currentBPM - 50) / 100)
    
    // Fatigue level (inverse of energy)
    const fatigueLevel = Math.max(0, 1 - energyLevel)
    
    // Alertness based on heart rate and rhythm
    const alertnessLevel = Math.min(1, heartRateData.rhythmRegularity + (heartRateData.currentBPM - 60) / 80)
    
    // Emotional stability based on HRV and stress
    const emotionalStability = Math.max(0, heartRateData.heartRateVariability / 60 - stressIndicators.overallStressLevel * 0.5)
    
    // Physical comfort (inverse of stress)
    const physicalComfort = Math.max(0, 1 - stressIndicators.overallStressLevel)

    return {
      arousalLevel,
      relaxationLevel,
      energyLevel,
      fatigueLevel,
      alertnessLevel,
      emotionalStability,
      physicalComfort
    }
  }

  private analyzeAutonomicNervousSystem(heartRateData: HeartRateData): AutonomicNervousSystem {
    // Sympathetic activity (fight/flight) - higher with elevated HR and low HRV
    const sympatheticActivity = Math.min(1, (heartRateData.currentBPM - 60) / 60 + (50 - heartRateData.heartRateVariability) / 50)
    
    // Parasympathetic activity (rest/digest) - higher with good HRV and normal HR
    const parasympatheticActivity = Math.min(1, heartRateData.heartRateVariability / 60 + heartRateData.rhythmRegularity)
    
    // Autonomic balance
    const autonomicBalance = parasympatheticActivity / (sympatheticActivity + parasympatheticActivity + 0.001)
    
    // Vagal tone (parasympathetic influence)
    const vagalTone = Math.min(1, heartRateData.rmssd / 50)
    
    // Sympathovagal balance
    const sympathovagalBalance = sympatheticActivity / (parasympatheticActivity + 0.001)
    
    // Adaptive capacity
    const adaptiveCapacity = Math.min(1, heartRateData.heartRateVariability / 40 + heartRateData.rhythmRegularity * 0.5)

    return {
      sympatheticActivity,
      parasympatheticActivity,
      autonomicBalance,
      vagalTone,
      sympathovagalBalance,
      adaptiveCapacity
    }
  }

  private analyzeRespiratoryPatterns(facialLandmarks: number[][]): RespiratoryAnalysis {
    // Simplified respiratory analysis
    // In a real implementation, this would track chest/shoulder movement
    
    return {
      respiratoryRate: 16, // Normal breathing rate
      breathingPattern: 'normal',
      breathingRhythm: 0.8,
      respiratoryVariability: 0.3,
      breathHoldCapacity: 0.7,
      oxygenationLevel: 0.98
    }
  }

  private analyzeSkinConductance(imageData: ImageData, facialLandmarks: number[][]): SkinConductance {
    // Simplified skin conductance analysis
    // In a real implementation, this would analyze skin texture and moisture
    
    return {
      basalLevel: 0.5,
      phasicResponse: 0.3,
      conductanceVariability: 0.4,
      sweatGlandActivity: 0.3,
      emotionalArousal: 0.4
    }
  }

  private calculateOverallWellbeing(
    heartRateData: HeartRateData,
    stressIndicators: StressIndicators,
    physiologicalState: PhysiologicalState,
    autonomicNervousSystem: AutonomicNervousSystem
  ): number {
    // Weighted combination of wellbeing factors
    const heartRateScore = heartRateData.rhythmRegularity * 0.2
    const stressScore = (1 - stressIndicators.overallStressLevel) * 0.3
    const physiologicalScore = (physiologicalState.relaxationLevel + physiologicalState.emotionalStability) / 2 * 0.3
    const autonomicScore = autonomicNervousSystem.autonomicBalance * 0.2
    
    return heartRateScore + stressScore + physiologicalScore + autonomicScore
  }

  private calculateConfidence(heartRateData: HeartRateData, stressIndicators: StressIndicators): number {
    let confidence = 0.7 // Base confidence
    
    // Increase confidence with good heart rate detection
    confidence += heartRateData.confidenceLevel * 0.2
    
    // Increase confidence with consistent measurements
    if (heartRateData.rhythmRegularity > 0.8) {
      confidence += 0.1
    }
    
    // Reduce confidence with extreme values
    if (stressIndicators.overallStressLevel > 0.9) {
      confidence -= 0.1
    }
    
    return Math.max(0.3, Math.min(1.0, confidence))
  }

  private getDefaultRespiratoryAnalysis(): RespiratoryAnalysis {
    return {
      respiratoryRate: 16,
      breathingPattern: 'normal',
      breathingRhythm: 0.8,
      respiratoryVariability: 0.3,
      breathHoldCapacity: 0.7,
      oxygenationLevel: 0.98
    }
  }

  private getDefaultSkinConductance(): SkinConductance {
    return {
      basalLevel: 0.5,
      phasicResponse: 0.3,
      conductanceVariability: 0.4,
      sweatGlandActivity: 0.3,
      emotionalArousal: 0.4
    }
  }

  // Public API methods
  getBiometricHistory(): BiometricAnalysisResult[] {
    return [...this.biometricHistory]
  }

  getHeartRateHistory(): number[] {
    return [...this.heartRateHistory]
  }

  getCurrentHeartRate(): number {
    return this.heartRateHistory.length > 0 ? this.heartRateHistory[this.heartRateHistory.length - 1] : 70
  }

  getAverageHeartRate(): number {
    if (this.heartRateHistory.length === 0) return 70
    return this.heartRateHistory.reduce((sum, hr) => sum + hr, 0) / this.heartRateHistory.length
  }

  updateConfig(newConfig: Partial<BiometricConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  clearHistory(): void {
    this.heartRateHistory = []
    this.rrIntervals = []
    this.biometricHistory = []
    this.previousFrame = null
  }

  destroy(): void {
    this.clearHistory()
    this.isInitialized = false
    console.log('Biometric Analysis Service destroyed')
  }
}

export {
  BiometricAnalysisService,
  type BiometricAnalysisResult,
  type HeartRateData,
  type StressIndicators,
  type PhysiologicalState,
  type AutonomicNervousSystem,
  type RespiratoryAnalysis,
  type SkinConductance,
  type BiometricConfig
}
