/**
 * Micro-Expression Detection Service
 * Advanced facial analysis for detecting subtle emotional expressions and deception indicators
 */

interface MicroExpressionResult {
  timestamp: number
  detectedExpressions: MicroExpression[]
  emotionalLeakage: EmotionalLeakage
  deceptionIndicators: DeceptionIndicator[]
  facialTension: FacialTension
  asymmetryAnalysis: AsymmetryAnalysis
  temporalAnalysis: TemporalAnalysis
  confidence: number
}

interface MicroExpression {
  type: MicroExpressionType
  intensity: number
  duration: number
  facialRegion: FacialRegion
  confidence: number
  actionUnits: ActionUnit[]
  suppressionLevel: number
}

interface EmotionalLeakage {
  detectedEmotion: string
  suppressedEmotion: string
  leakageIntensity: number
  leakageRegions: FacialRegion[]
  suppressionEffort: number
  authenticity: number
}

interface DeceptionIndicator {
  type: 'micro_expression' | 'asymmetry' | 'timing' | 'suppression' | 'incongruence'
  severity: number
  confidence: number
  description: string
  facialRegions: FacialRegion[]
  temporalPattern: string
}

interface FacialTension {
  overallTension: number
  regionTension: {
    forehead: number
    eyebrows: number
    eyes: number
    nose: number
    mouth: number
    jaw: number
    cheeks: number
  }
  tensionPattern: 'uniform' | 'asymmetric' | 'localized' | 'dynamic'
  stressIndicators: string[]
}

interface AsymmetryAnalysis {
  overallAsymmetry: number
  regionAsymmetry: {
    eyebrows: number
    eyes: number
    mouth: number
    cheeks: number
  }
  asymmetryType: 'natural' | 'emotional' | 'suppression' | 'pathological'
  significantAsymmetries: string[]
}

interface TemporalAnalysis {
  expressionOnset: number
  expressionOffset: number
  peakIntensity: number
  riseTime: number
  fallTime: number
  symmetryTiming: number
  naturalness: number
}

interface ActionUnit {
  id: string
  name: string
  intensity: number
  activation: number
  region: FacialRegion
}

interface FacialRegion {
  name: string
  landmarks: number[]
  boundingBox: { x: number; y: number; width: number; height: number }
}

type MicroExpressionType = 
  | 'contempt' | 'disgust' | 'anger' | 'fear' | 'sadness' | 'surprise' | 'joy'
  | 'duping_delight' | 'masked_fear' | 'suppressed_anger' | 'false_smile'
  | 'eye_roll' | 'lip_compression' | 'nostril_flare' | 'brow_flash'

interface MicroExpressionConfig {
  sensitivityThreshold: number
  temporalWindow: number
  minimumDuration: number
  maximumDuration: number
  asymmetryThreshold: number
  tensionThreshold: number
  enableDeceptionDetection: boolean
  enableEmotionalLeakage: boolean
}

class MicroExpressionService {
  private config: MicroExpressionConfig
  private previousFrames: ImageData[] = []
  private expressionHistory: MicroExpressionResult[] = []
  private facialLandmarks: any[] = []
  private isInitialized: boolean = false

  // Facial Action Unit definitions (simplified FACS)
  private actionUnits: Record<string, ActionUnit> = {
    'AU1': { id: 'AU1', name: 'Inner Brow Raiser', intensity: 0, activation: 0, region: { name: 'eyebrows', landmarks: [17, 18, 19, 20], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } },
    'AU2': { id: 'AU2', name: 'Outer Brow Raiser', intensity: 0, activation: 0, region: { name: 'eyebrows', landmarks: [21, 22, 23, 24], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } },
    'AU4': { id: 'AU4', name: 'Brow Lowerer', intensity: 0, activation: 0, region: { name: 'eyebrows', landmarks: [17, 18, 19, 20, 21, 22], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } },
    'AU5': { id: 'AU5', name: 'Upper Lid Raiser', intensity: 0, activation: 0, region: { name: 'eyes', landmarks: [37, 38, 40, 41, 43, 44, 46, 47], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } },
    'AU6': { id: 'AU6', name: 'Cheek Raiser', intensity: 0, activation: 0, region: { name: 'cheeks', landmarks: [1, 2, 3, 13, 14, 15], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } },
    'AU7': { id: 'AU7', name: 'Lid Tightener', intensity: 0, activation: 0, region: { name: 'eyes', landmarks: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } },
    'AU9': { id: 'AU9', name: 'Nose Wrinkler', intensity: 0, activation: 0, region: { name: 'nose', landmarks: [27, 28, 29, 30, 31, 32, 33, 34, 35], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } },
    'AU10': { id: 'AU10', name: 'Upper Lip Raiser', intensity: 0, activation: 0, region: { name: 'mouth', landmarks: [48, 49, 50, 51, 52, 53, 54], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } },
    'AU12': { id: 'AU12', name: 'Lip Corner Puller', intensity: 0, activation: 0, region: { name: 'mouth', landmarks: [48, 54], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } },
    'AU14': { id: 'AU14', name: 'Dimpler', intensity: 0, activation: 0, region: { name: 'mouth', landmarks: [48, 54], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } },
    'AU15': { id: 'AU15', name: 'Lip Corner Depressor', intensity: 0, activation: 0, region: { name: 'mouth', landmarks: [48, 54], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } },
    'AU17': { id: 'AU17', name: 'Chin Raiser', intensity: 0, activation: 0, region: { name: 'mouth', landmarks: [8, 9, 10], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } },
    'AU20': { id: 'AU20', name: 'Lip Stretcher', intensity: 0, activation: 0, region: { name: 'mouth', landmarks: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } },
    'AU23': { id: 'AU23', name: 'Lip Tightener', intensity: 0, activation: 0, region: { name: 'mouth', landmarks: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } },
    'AU24': { id: 'AU24', name: 'Lip Pressor', intensity: 0, activation: 0, region: { name: 'mouth', landmarks: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59], boundingBox: { x: 0, y: 0, width: 0, height: 0 } } }
  }

  constructor(config: Partial<MicroExpressionConfig> = {}) {
    this.config = {
      sensitivityThreshold: 0.3,
      temporalWindow: 500, // 500ms
      minimumDuration: 40, // 40ms (1/25th second)
      maximumDuration: 500, // 500ms (1/2 second)
      asymmetryThreshold: 0.15,
      tensionThreshold: 0.4,
      enableDeceptionDetection: true,
      enableEmotionalLeakage: true,
      ...config
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize facial landmark detection
      // In a real implementation, this would load ML models
      console.log('Initializing Micro-Expression Detection Service...')
      
      this.isInitialized = true
      console.log('Micro-Expression Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Micro-Expression Service:', error)
      throw error
    }
  }

  async analyzeMicroExpressions(
    imageData: ImageData,
    facialLandmarks: number[][],
    context?: {
      previousFrame?: ImageData
      timestamp?: number
      emotionalContext?: string
    }
  ): Promise<MicroExpressionResult> {
    if (!this.isInitialized) {
      throw new Error('Micro-Expression Service not initialized')
    }

    const timestamp = context?.timestamp || Date.now()
    
    // Store current landmarks
    this.facialLandmarks = facialLandmarks

    // Update frame history
    this.updateFrameHistory(imageData)

    // Extract facial action units
    const actionUnits = this.extractActionUnits(facialLandmarks)

    // Detect micro-expressions
    const detectedExpressions = this.detectMicroExpressions(actionUnits, timestamp)

    // Analyze emotional leakage
    const emotionalLeakage = this.analyzeEmotionalLeakage(detectedExpressions, actionUnits)

    // Detect deception indicators
    const deceptionIndicators = this.config.enableDeceptionDetection ? 
      this.detectDeceptionIndicators(detectedExpressions, actionUnits) : []

    // Analyze facial tension
    const facialTension = this.analyzeFacialTension(actionUnits, facialLandmarks)

    // Analyze facial asymmetry
    const asymmetryAnalysis = this.analyzeAsymmetry(facialLandmarks, actionUnits)

    // Perform temporal analysis
    const temporalAnalysis = this.performTemporalAnalysis(detectedExpressions)

    // Calculate overall confidence
    const confidence = this.calculateConfidence(detectedExpressions, actionUnits, facialTension)

    const result: MicroExpressionResult = {
      timestamp,
      detectedExpressions,
      emotionalLeakage,
      deceptionIndicators,
      facialTension,
      asymmetryAnalysis,
      temporalAnalysis,
      confidence
    }

    // Store in history
    this.expressionHistory.push(result)
    if (this.expressionHistory.length > 100) {
      this.expressionHistory = this.expressionHistory.slice(-100)
    }

    return result
  }

  private updateFrameHistory(imageData: ImageData): void {
    this.previousFrames.push(imageData)
    if (this.previousFrames.length > 10) {
      this.previousFrames = this.previousFrames.slice(-10)
    }
  }

  private extractActionUnits(facialLandmarks: number[][]): ActionUnit[] {
    const extractedAUs: ActionUnit[] = []

    // Extract each action unit based on facial landmarks
    Object.values(this.actionUnits).forEach(au => {
      const intensity = this.calculateActionUnitIntensity(au, facialLandmarks)
      const activation = intensity > this.config.sensitivityThreshold ? 1 : 0

      extractedAUs.push({
        ...au,
        intensity,
        activation
      })
    })

    return extractedAUs
  }

  private calculateActionUnitIntensity(au: ActionUnit, landmarks: number[][]): number {
    // Simplified AU intensity calculation
    // In a real implementation, this would use sophisticated geometric analysis
    
    switch (au.id) {
      case 'AU1': // Inner Brow Raiser
        return this.calculateBrowRaise(landmarks, 'inner')
      case 'AU2': // Outer Brow Raiser
        return this.calculateBrowRaise(landmarks, 'outer')
      case 'AU4': // Brow Lowerer
        return this.calculateBrowLower(landmarks)
      case 'AU6': // Cheek Raiser
        return this.calculateCheekRaise(landmarks)
      case 'AU12': // Lip Corner Puller
        return this.calculateLipCornerPull(landmarks)
      case 'AU15': // Lip Corner Depressor
        return this.calculateLipCornerDepress(landmarks)
      case 'AU24': // Lip Pressor
        return this.calculateLipPress(landmarks)
      default:
        return Math.random() * 0.5 // Placeholder
    }
  }

  private calculateBrowRaise(landmarks: number[][], type: 'inner' | 'outer'): number {
    if (landmarks.length < 68) return 0

    // Calculate brow height relative to eye
    const eyeY = (landmarks[37][1] + landmarks[44][1]) / 2
    const browY = type === 'inner' ? 
      (landmarks[19][1] + landmarks[24][1]) / 2 : 
      (landmarks[17][1] + landmarks[26][1]) / 2

    const distance = eyeY - browY
    return Math.max(0, Math.min(1, distance / 20)) // Normalize
  }

  private calculateBrowLower(landmarks: number[][]): number {
    if (landmarks.length < 68) return 0

    // Calculate brow lowering based on distance to eyes
    const eyeY = (landmarks[37][1] + landmarks[44][1]) / 2
    const browY = (landmarks[19][1] + landmarks[24][1]) / 2

    const distance = browY - eyeY
    return Math.max(0, Math.min(1, distance / 15)) // Normalize
  }

  private calculateCheekRaise(landmarks: number[][]): number {
    if (landmarks.length < 68) return 0

    // Calculate cheek elevation
    const cheekY = (landmarks[1][1] + landmarks[15][1]) / 2
    const mouthY = landmarks[51][1]

    const distance = mouthY - cheekY
    return Math.max(0, Math.min(1, (30 - distance) / 30)) // Normalize
  }

  private calculateLipCornerPull(landmarks: number[][]): number {
    if (landmarks.length < 68) return 0

    // Calculate lip corner movement
    const leftCorner = landmarks[48]
    const rightCorner = landmarks[54]
    const mouthCenter = landmarks[51]

    const leftDistance = Math.sqrt(Math.pow(leftCorner[0] - mouthCenter[0], 2) + Math.pow(leftCorner[1] - mouthCenter[1], 2))
    const rightDistance = Math.sqrt(Math.pow(rightCorner[0] - mouthCenter[0], 2) + Math.pow(rightCorner[1] - mouthCenter[1], 2))

    const avgDistance = (leftDistance + rightDistance) / 2
    return Math.max(0, Math.min(1, (avgDistance - 20) / 20)) // Normalize
  }

  private calculateLipCornerDepress(landmarks: number[][]): number {
    if (landmarks.length < 68) return 0

    // Calculate downward lip corner movement
    const leftCorner = landmarks[48]
    const rightCorner = landmarks[54]
    const upperLip = landmarks[51]

    const leftDepression = leftCorner[1] - upperLip[1]
    const rightDepression = rightCorner[1] - upperLip[1]

    const avgDepression = (leftDepression + rightDepression) / 2
    return Math.max(0, Math.min(1, avgDepression / 10)) // Normalize
  }

  private calculateLipPress(landmarks: number[][]): number {
    if (landmarks.length < 68) return 0

    // Calculate lip compression
    const upperLip = landmarks[51]
    const lowerLip = landmarks[57]

    const lipDistance = Math.abs(upperLip[1] - lowerLip[1])
    return Math.max(0, Math.min(1, (8 - lipDistance) / 8)) // Normalize
  }

  private detectMicroExpressions(actionUnits: ActionUnit[], timestamp: number): MicroExpression[] {
    const detectedExpressions: MicroExpression[] = []

    // Contempt detection (AU12 + AU14 asymmetric)
    const contemptScore = this.detectContempt(actionUnits)
    if (contemptScore > this.config.sensitivityThreshold) {
      detectedExpressions.push({
        type: 'contempt',
        intensity: contemptScore,
        duration: this.config.minimumDuration,
        facialRegion: { name: 'mouth', landmarks: [48, 54], boundingBox: { x: 0, y: 0, width: 0, height: 0 } },
        confidence: contemptScore,
        actionUnits: actionUnits.filter(au => ['AU12', 'AU14'].includes(au.id)),
        suppressionLevel: 0
      })
    }

    // Duping delight detection (AU12 + AU6 brief)
    const dupingDelightScore = this.detectDupingDelight(actionUnits)
    if (dupingDelightScore > this.config.sensitivityThreshold) {
      detectedExpressions.push({
        type: 'duping_delight',
        intensity: dupingDelightScore,
        duration: this.config.minimumDuration,
        facialRegion: { name: 'mouth', landmarks: [48, 54], boundingBox: { x: 0, y: 0, width: 0, height: 0 } },
        confidence: dupingDelightScore,
        actionUnits: actionUnits.filter(au => ['AU12', 'AU6'].includes(au.id)),
        suppressionLevel: 0.3
      })
    }

    // Suppressed anger detection (AU4 + AU23/24)
    const suppressedAngerScore = this.detectSuppressedAnger(actionUnits)
    if (suppressedAngerScore > this.config.sensitivityThreshold) {
      detectedExpressions.push({
        type: 'suppressed_anger',
        intensity: suppressedAngerScore,
        duration: this.config.minimumDuration * 2,
        facialRegion: { name: 'eyebrows', landmarks: [17, 18, 19, 20, 21, 22], boundingBox: { x: 0, y: 0, width: 0, height: 0 } },
        confidence: suppressedAngerScore,
        actionUnits: actionUnits.filter(au => ['AU4', 'AU23', 'AU24'].includes(au.id)),
        suppressionLevel: 0.7
      })
    }

    // False smile detection (AU12 without AU6)
    const falseSmileScore = this.detectFalseSmile(actionUnits)
    if (falseSmileScore > this.config.sensitivityThreshold) {
      detectedExpressions.push({
        type: 'false_smile',
        intensity: falseSmileScore,
        duration: this.config.minimumDuration * 3,
        facialRegion: { name: 'mouth', landmarks: [48, 54], boundingBox: { x: 0, y: 0, width: 0, height: 0 } },
        confidence: falseSmileScore,
        actionUnits: actionUnits.filter(au => au.id === 'AU12'),
        suppressionLevel: 0.5
      })
    }

    return detectedExpressions
  }

  private detectContempt(actionUnits: ActionUnit[]): number {
    const au12 = actionUnits.find(au => au.id === 'AU12')
    const au14 = actionUnits.find(au => au.id === 'AU14')

    if (!au12 || !au14) return 0

    // Contempt is characterized by asymmetric lip corner pull
    const asymmetry = Math.abs(au12.intensity - au14.intensity)
    const intensity = Math.max(au12.intensity, au14.intensity)

    return asymmetry > 0.2 && intensity > 0.3 ? intensity * asymmetry : 0
  }

  private detectDupingDelight(actionUnits: ActionUnit[]): number {
    const au12 = actionUnits.find(au => au.id === 'AU12')
    const au6 = actionUnits.find(au => au.id === 'AU6')

    if (!au12 || !au6) return 0

    // Duping delight is a brief, genuine smile that leaks through
    const smileIntensity = au12.intensity
    const eyeInvolvement = au6.intensity

    return smileIntensity > 0.4 && eyeInvolvement > 0.3 ? (smileIntensity + eyeInvolvement) / 2 : 0
  }

  private detectSuppressedAnger(actionUnits: ActionUnit[]): number {
    const au4 = actionUnits.find(au => au.id === 'AU4')
    const au23 = actionUnits.find(au => au.id === 'AU23')
    const au24 = actionUnits.find(au => au.id === 'AU24')

    if (!au4) return 0

    const browLower = au4.intensity
    const lipTension = Math.max(au23?.intensity || 0, au24?.intensity || 0)

    return browLower > 0.3 && lipTension > 0.2 ? (browLower + lipTension) / 2 : 0
  }

  private detectFalseSmile(actionUnits: ActionUnit[]): number {
    const au12 = actionUnits.find(au => au.id === 'AU12')
    const au6 = actionUnits.find(au => au.id === 'AU6')

    if (!au12) return 0

    const smileIntensity = au12.intensity
    const eyeInvolvement = au6?.intensity || 0

    // False smile has lip corner pull without eye involvement
    return smileIntensity > 0.4 && eyeInvolvement < 0.2 ? smileIntensity : 0
  }

  private analyzeEmotionalLeakage(expressions: MicroExpression[], actionUnits: ActionUnit[]): EmotionalLeakage {
    // Analyze for emotional leakage patterns
    const suppressedExpressions = expressions.filter(expr => expr.suppressionLevel > 0.3)
    
    if (suppressedExpressions.length === 0) {
      return {
        detectedEmotion: 'neutral',
        suppressedEmotion: 'none',
        leakageIntensity: 0,
        leakageRegions: [],
        suppressionEffort: 0,
        authenticity: 1
      }
    }

    const primarySuppressed = suppressedExpressions[0]
    
    return {
      detectedEmotion: 'controlled',
      suppressedEmotion: primarySuppressed.type,
      leakageIntensity: primarySuppressed.intensity,
      leakageRegions: [primarySuppressed.facialRegion],
      suppressionEffort: primarySuppressed.suppressionLevel,
      authenticity: 1 - primarySuppressed.suppressionLevel
    }
  }

  private detectDeceptionIndicators(expressions: MicroExpression[], actionUnits: ActionUnit[]): DeceptionIndicator[] {
    const indicators: DeceptionIndicator[] = []

    // Micro-expression based indicators
    expressions.forEach(expr => {
      if (expr.type === 'duping_delight') {
        indicators.push({
          type: 'micro_expression',
          severity: expr.intensity,
          confidence: expr.confidence,
          description: 'Duping delight detected - possible enjoyment of deception',
          facialRegions: [expr.facialRegion],
          temporalPattern: 'brief_flash'
        })
      }

      if (expr.type === 'suppressed_anger' || expr.type === 'contempt') {
        indicators.push({
          type: 'suppression',
          severity: expr.suppressionLevel,
          confidence: expr.confidence,
          description: 'Emotional suppression detected - possible concealment',
          facialRegions: [expr.facialRegion],
          temporalPattern: 'sustained_tension'
        })
      }

      if (expr.type === 'false_smile') {
        indicators.push({
          type: 'incongruence',
          severity: expr.intensity,
          confidence: expr.confidence,
          description: 'False smile detected - possible masking of true emotion',
          facialRegions: [expr.facialRegion],
          temporalPattern: 'forced_expression'
        })
      }
    })

    return indicators
  }

  private analyzeFacialTension(actionUnits: ActionUnit[], landmarks: number[][]): FacialTension {
    const regionTension = {
      forehead: this.calculateRegionTension(['AU1', 'AU2'], actionUnits),
      eyebrows: this.calculateRegionTension(['AU4'], actionUnits),
      eyes: this.calculateRegionTension(['AU5', 'AU7'], actionUnits),
      nose: this.calculateRegionTension(['AU9'], actionUnits),
      mouth: this.calculateRegionTension(['AU10', 'AU12', 'AU15', 'AU20', 'AU23', 'AU24'], actionUnits),
      jaw: this.calculateRegionTension(['AU17'], actionUnits),
      cheeks: this.calculateRegionTension(['AU6'], actionUnits)
    }

    const overallTension = Object.values(regionTension).reduce((sum, tension) => sum + tension, 0) / 7

    const stressIndicators: string[] = []
    if (regionTension.eyebrows > this.config.tensionThreshold) stressIndicators.push('Brow tension')
    if (regionTension.mouth > this.config.tensionThreshold) stressIndicators.push('Lip tension')
    if (regionTension.jaw > this.config.tensionThreshold) stressIndicators.push('Jaw clenching')

    const tensionPattern = this.determineTensionPattern(regionTension)

    return {
      overallTension,
      regionTension,
      tensionPattern,
      stressIndicators
    }
  }

  private calculateRegionTension(auIds: string[], actionUnits: ActionUnit[]): number {
    const relevantAUs = actionUnits.filter(au => auIds.includes(au.id))
    if (relevantAUs.length === 0) return 0

    return relevantAUs.reduce((sum, au) => sum + au.intensity, 0) / relevantAUs.length
  }

  private determineTensionPattern(regionTension: any): FacialTension['tensionPattern'] {
    const tensions = Object.values(regionTension) as number[]
    const maxTension = Math.max(...tensions)
    const minTension = Math.min(...tensions)
    const avgTension = tensions.reduce((sum, t) => sum + t, 0) / tensions.length

    if (maxTension - minTension < 0.2) return 'uniform'
    if (maxTension > avgTension * 1.5) return 'localized'
    
    // Check for asymmetry (simplified)
    const leftSide = (regionTension.eyebrows + regionTension.mouth) / 2
    const rightSide = leftSide // Simplified - would need actual left/right calculation
    
    if (Math.abs(leftSide - rightSide) > 0.3) return 'asymmetric'
    
    return 'dynamic'
  }

  private analyzeAsymmetry(landmarks: number[][], actionUnits: ActionUnit[]): AsymmetryAnalysis {
    if (landmarks.length < 68) {
      return {
        overallAsymmetry: 0,
        regionAsymmetry: { eyebrows: 0, eyes: 0, mouth: 0, cheeks: 0 },
        asymmetryType: 'natural',
        significantAsymmetries: []
      }
    }

    // Calculate asymmetry for different facial regions
    const regionAsymmetry = {
      eyebrows: this.calculateBrowAsymmetry(landmarks),
      eyes: this.calculateEyeAsymmetry(landmarks),
      mouth: this.calculateMouthAsymmetry(landmarks),
      cheeks: this.calculateCheekAsymmetry(landmarks)
    }

    const overallAsymmetry = Object.values(regionAsymmetry).reduce((sum, asym) => sum + asym, 0) / 4

    const significantAsymmetries: string[] = []
    Object.entries(regionAsymmetry).forEach(([region, asymmetry]) => {
      if (asymmetry > this.config.asymmetryThreshold) {
        significantAsymmetries.push(`${region} asymmetry`)
      }
    })

    const asymmetryType = this.determineAsymmetryType(overallAsymmetry, significantAsymmetries)

    return {
      overallAsymmetry,
      regionAsymmetry,
      asymmetryType,
      significantAsymmetries
    }
  }

  private calculateBrowAsymmetry(landmarks: number[][]): number {
    const leftBrow = landmarks[19][1]
    const rightBrow = landmarks[24][1]
    return Math.abs(leftBrow - rightBrow) / 20 // Normalize
  }

  private calculateEyeAsymmetry(landmarks: number[][]): number {
    const leftEyeHeight = Math.abs(landmarks[37][1] - landmarks[41][1])
    const rightEyeHeight = Math.abs(landmarks[43][1] - landmarks[47][1])
    return Math.abs(leftEyeHeight - rightEyeHeight) / 10 // Normalize
  }

  private calculateMouthAsymmetry(landmarks: number[][]): number {
    const leftCorner = landmarks[48][1]
    const rightCorner = landmarks[54][1]
    return Math.abs(leftCorner - rightCorner) / 15 // Normalize
  }

  private calculateCheekAsymmetry(landmarks: number[][]): number {
    const leftCheek = landmarks[1][1]
    const rightCheek = landmarks[15][1]
    return Math.abs(leftCheek - rightCheek) / 20 // Normalize
  }

  private determineAsymmetryType(overallAsymmetry: number, significantAsymmetries: string[]): AsymmetryAnalysis['asymmetryType'] {
    if (overallAsymmetry < 0.1) return 'natural'
    if (significantAsymmetries.length > 2) return 'pathological'
    if (overallAsymmetry > 0.3) return 'suppression'
    return 'emotional'
  }

  private performTemporalAnalysis(expressions: MicroExpression[]): TemporalAnalysis {
    if (expressions.length === 0) {
      return {
        expressionOnset: 0,
        expressionOffset: 0,
        peakIntensity: 0,
        riseTime: 0,
        fallTime: 0,
        symmetryTiming: 1,
        naturalness: 1
      }
    }

    const primaryExpression = expressions[0]
    
    // Simplified temporal analysis
    return {
      expressionOnset: 0,
      expressionOffset: primaryExpression.duration,
      peakIntensity: primaryExpression.intensity,
      riseTime: primaryExpression.duration * 0.3,
      fallTime: primaryExpression.duration * 0.7,
      symmetryTiming: 1 - primaryExpression.suppressionLevel,
      naturalness: 1 - (primaryExpression.suppressionLevel * 0.5)
    }
  }

  private calculateConfidence(expressions: MicroExpression[], actionUnits: ActionUnit[], facialTension: FacialTension): number {
    let confidence = 0.7 // Base confidence

    // Increase confidence with clear expressions
    if (expressions.length > 0) {
      const avgExpressionConfidence = expressions.reduce((sum, expr) => sum + expr.confidence, 0) / expressions.length
      confidence += avgExpressionConfidence * 0.2
    }

    // Increase confidence with active action units
    const activeAUs = actionUnits.filter(au => au.activation > 0).length
    confidence += (activeAUs / actionUnits.length) * 0.1

    // Adjust for facial tension (high tension can indicate suppression)
    if (facialTension.overallTension > 0.6) {
      confidence += 0.1
    }

    return Math.max(0.3, Math.min(1.0, confidence))
  }

  // Public API methods
  getExpressionHistory(): MicroExpressionResult[] {
    return [...this.expressionHistory]
  }

  getActionUnits(): Record<string, ActionUnit> {
    return { ...this.actionUnits }
  }

  updateConfig(newConfig: Partial<MicroExpressionConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  clearHistory(): void {
    this.expressionHistory = []
    this.previousFrames = []
  }

  destroy(): void {
    this.clearHistory()
    this.isInitialized = false
    console.log('Micro-Expression Service destroyed')
  }
}

export { 
  MicroExpressionService,
  type MicroExpressionResult,
  type MicroExpression,
  type EmotionalLeakage,
  type DeceptionIndicator,
  type FacialTension,
  type AsymmetryAnalysis,
  type MicroExpressionType,
  type MicroExpressionConfig
}
