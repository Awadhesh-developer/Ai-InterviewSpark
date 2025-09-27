import { apiClient } from '@/lib/api'

export interface EmotionalState {
  confidence: number
  stress: number
  engagement: number
  clarity: number
  enthusiasm: number
  nervousness: number
  timestamp: number
}

export interface VoiceEmotionData {
  pitch: number[]
  volume: number[]
  pace: number
  tonality: 'confident' | 'nervous' | 'excited' | 'calm' | 'uncertain'
  fillerWords: {
    count: number
    words: string[]
    timestamps: number[]
  }
  emotionalMarkers: {
    confidence: number
    stress: number
    engagement: number
  }
}

export interface FacialEmotionData {
  expressions: {
    smile: number
    frown: number
    surprise: number
    concentration: number
    confusion: number
  }
  eyeContact: {
    percentage: number
    consistency: number
    direction: 'camera' | 'away' | 'down' | 'side'
  }
  microExpressions: {
    confidence: number
    nervousness: number
    engagement: number
    authenticity: number
  }
  bodyLanguage: {
    posture: 'upright' | 'slouched' | 'leaning'
    gestures: number
    fidgeting: number
    stability: number
  }
}

export interface EmotionalAnalysis {
  overallState: EmotionalState
  voiceAnalysis?: VoiceEmotionData
  facialAnalysis?: FacialEmotionData
  trends: EmotionalTrend[]
  insights: EmotionalInsight[]
  recommendations: EmotionalRecommendation[]
  riskFactors: RiskFactor[]
}

export interface EmotionalTrend {
  metric: 'confidence' | 'stress' | 'engagement' | 'clarity'
  direction: 'improving' | 'declining' | 'stable'
  magnitude: number
  timeframe: string
  significance: 'low' | 'medium' | 'high'
}

export interface EmotionalInsight {
  type: 'strength' | 'concern' | 'pattern' | 'opportunity'
  title: string
  description: string
  evidence: string[]
  impact: 'low' | 'medium' | 'high'
  actionable: boolean
}

export interface EmotionalRecommendation {
  category: 'breathing' | 'posture' | 'voice' | 'mindset' | 'preparation'
  title: string
  description: string
  techniques: string[]
  immediateActions: string[]
  longTermStrategies: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface RiskFactor {
  type: 'anxiety' | 'overconfidence' | 'disengagement' | 'confusion'
  severity: 'low' | 'medium' | 'high' | 'critical'
  indicators: string[]
  interventions: string[]
  monitoring: string[]
}

export interface EmotionalCoachingSession {
  id: string
  userId: string
  startTime: Date
  endTime?: Date
  emotionalStates: EmotionalState[]
  analyses: EmotionalAnalysis[]
  interventions: EmotionalIntervention[]
  outcomes: SessionOutcome
}

export interface EmotionalIntervention {
  timestamp: number
  trigger: string
  type: 'breathing_exercise' | 'posture_adjustment' | 'confidence_boost' | 'stress_reduction'
  message: string
  effectiveness?: number
}

export interface SessionOutcome {
  emotionalGrowth: number
  stressManagement: number
  confidenceBuilding: number
  overallImprovement: number
  keyLearnings: string[]
  nextSteps: string[]
}

class EmotionalIntelligenceService {
  private motivelApiKey: string | null = null
  private moodmeApiKey: string | null = null
  private activeSessions: Map<string, EmotionalCoachingSession> = new Map()

  constructor() {
    // Initialize API keys from environment
    this.motivelApiKey = process.env.NEXT_PUBLIC_MOTIVEL_API_KEY || null
    this.moodmeApiKey = process.env.NEXT_PUBLIC_MOODME_API_KEY || null
  }

  // Analyze voice emotion using Motivel API
  async analyzeVoiceEmotion(audioBlob: Blob): Promise<VoiceEmotionData> {
    try {
      if (!this.motivelApiKey) {
        return this.generateMockVoiceAnalysis()
      }

      // Convert blob to base64 for API
      const arrayBuffer = await audioBlob.arrayBuffer()
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

      // Call Motivel API (mock implementation)
      const response = await this.callMotivelAPI(base64Audio)
      return this.parseMotivelResponse(response)
    } catch (error) {
      console.error('Error analyzing voice emotion:', error)
      return this.generateMockVoiceAnalysis()
    }
  }

  // Analyze facial emotion using Moodme API
  async analyzeFacialEmotion(videoBlob: Blob): Promise<FacialEmotionData> {
    try {
      if (!this.moodmeApiKey) {
        return this.generateMockFacialAnalysis()
      }

      // Extract frames from video for analysis
      const frames = await this.extractVideoFrames(videoBlob)
      
      // Call Moodme API (mock implementation)
      const response = await this.callMoodmeAPI(frames)
      return this.parseMoodmeResponse(response)
    } catch (error) {
      console.error('Error analyzing facial emotion:', error)
      return this.generateMockFacialAnalysis()
    }
  }

  // Comprehensive emotional analysis
  async performEmotionalAnalysis(
    audioBlob?: Blob,
    videoBlob?: Blob,
    previousStates?: EmotionalState[]
  ): Promise<EmotionalAnalysis> {
    try {
      const analyses: Partial<EmotionalAnalysis> = {}

      // Analyze voice if audio provided
      if (audioBlob) {
        analyses.voiceAnalysis = await this.analyzeVoiceEmotion(audioBlob)
      }

      // Analyze facial expressions if video provided
      if (videoBlob) {
        analyses.facialAnalysis = await this.analyzeFacialEmotion(videoBlob)
      }

      // Combine analyses to determine overall emotional state
      const overallState = this.calculateOverallEmotionalState(
        analyses.voiceAnalysis,
        analyses.facialAnalysis
      )

      // Generate trends if previous states available
      const trends = previousStates 
        ? this.calculateEmotionalTrends(previousStates, overallState)
        : []

      // Generate insights and recommendations
      const insights = this.generateEmotionalInsights(overallState, analyses)
      const recommendations = this.generateEmotionalRecommendations(overallState, insights)
      const riskFactors = this.identifyRiskFactors(overallState, trends)

      return {
        overallState,
        voiceAnalysis: analyses.voiceAnalysis,
        facialAnalysis: analyses.facialAnalysis,
        trends,
        insights,
        recommendations,
        riskFactors
      }
    } catch (error) {
      console.error('Error performing emotional analysis:', error)
      throw error
    }
  }

  // Start emotional coaching session
  async startEmotionalCoachingSession(userId: string): Promise<EmotionalCoachingSession> {
    const session: EmotionalCoachingSession = {
      id: `emotional-session-${Date.now()}`,
      userId,
      startTime: new Date(),
      emotionalStates: [],
      analyses: [],
      interventions: [],
      outcomes: {
        emotionalGrowth: 0,
        stressManagement: 0,
        confidenceBuilding: 0,
        overallImprovement: 0,
        keyLearnings: [],
        nextSteps: []
      }
    }

    this.activeSessions.set(session.id, session)
    return session
  }

  // Process real-time emotional data
  async processRealTimeEmotionalData(
    sessionId: string,
    audioBlob?: Blob,
    videoBlob?: Blob
  ): Promise<EmotionalAnalysis> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    // Perform emotional analysis
    const analysis = await this.performEmotionalAnalysis(
      audioBlob,
      videoBlob,
      session.emotionalStates
    )

    // Store emotional state and analysis
    session.emotionalStates.push(analysis.overallState)
    session.analyses.push(analysis)

    // Check for intervention triggers
    const interventions = this.checkInterventionTriggers(analysis)
    session.interventions.push(...interventions)

    return analysis
  }

  // Generate real-time interventions
  private checkInterventionTriggers(analysis: EmotionalAnalysis): EmotionalIntervention[] {
    const interventions: EmotionalIntervention[] = []
    const state = analysis.overallState

    // High stress intervention
    if (state.stress > 0.7) {
      interventions.push({
        timestamp: Date.now(),
        trigger: 'high_stress',
        type: 'breathing_exercise',
        message: 'Take a moment to breathe deeply. Inhale for 4 counts, hold for 4, exhale for 6.',
      })
    }

    // Low confidence intervention
    if (state.confidence < 0.4) {
      interventions.push({
        timestamp: Date.now(),
        trigger: 'low_confidence',
        type: 'confidence_boost',
        message: 'Remember your strengths and achievements. Speak with conviction about your experience.',
      })
    }

    // Low engagement intervention
    if (state.engagement < 0.3) {
      interventions.push({
        timestamp: Date.now(),
        trigger: 'low_engagement',
        type: 'posture_adjustment',
        message: 'Sit up straight and lean slightly forward to show engagement and interest.',
      })
    }

    return interventions
  }

  // Helper methods for mock implementations
  private generateMockVoiceAnalysis(): VoiceEmotionData {
    return {
      pitch: Array.from({ length: 10 }, () => Math.random() * 200 + 100),
      volume: Array.from({ length: 10 }, () => Math.random() * 0.8 + 0.2),
      pace: Math.random() * 50 + 150, // 150-200 WPM
      tonality: ['confident', 'nervous', 'excited', 'calm', 'uncertain'][Math.floor(Math.random() * 5)] as any,
      fillerWords: {
        count: Math.floor(Math.random() * 5),
        words: ['um', 'uh', 'like', 'you know'],
        timestamps: [2.1, 5.7, 12.3]
      },
      emotionalMarkers: {
        confidence: Math.random() * 0.4 + 0.6,
        stress: Math.random() * 0.3,
        engagement: Math.random() * 0.3 + 0.7
      }
    }
  }

  private generateMockFacialAnalysis(): FacialEmotionData {
    return {
      expressions: {
        smile: Math.random() * 0.4 + 0.3,
        frown: Math.random() * 0.2,
        surprise: Math.random() * 0.1,
        concentration: Math.random() * 0.3 + 0.4,
        confusion: Math.random() * 0.2
      },
      eyeContact: {
        percentage: Math.random() * 30 + 70,
        consistency: Math.random() * 25 + 75,
        direction: ['camera', 'away', 'down', 'side'][Math.floor(Math.random() * 4)] as any
      },
      microExpressions: {
        confidence: Math.random() * 0.3 + 0.7,
        nervousness: Math.random() * 0.3,
        engagement: Math.random() * 0.2 + 0.8,
        authenticity: Math.random() * 0.2 + 0.8
      },
      bodyLanguage: {
        posture: ['upright', 'slouched', 'leaning'][Math.floor(Math.random() * 3)] as any,
        gestures: Math.random() * 10 + 5,
        fidgeting: Math.random() * 5,
        stability: Math.random() * 0.3 + 0.7
      }
    }
  }

  private calculateOverallEmotionalState(
    voice?: VoiceEmotionData,
    facial?: FacialEmotionData
  ): EmotionalState {
    // Combine voice and facial analysis to determine overall state
    const confidence = this.combineMetrics(
      voice?.emotionalMarkers.confidence,
      facial?.microExpressions.confidence
    )
    
    const stress = this.combineMetrics(
      voice?.emotionalMarkers.stress,
      facial?.microExpressions.nervousness
    )
    
    const engagement = this.combineMetrics(
      voice?.emotionalMarkers.engagement,
      facial?.microExpressions.engagement
    )

    return {
      confidence: confidence || 0.7,
      stress: stress || 0.3,
      engagement: engagement || 0.8,
      clarity: Math.random() * 0.3 + 0.7,
      enthusiasm: Math.random() * 0.4 + 0.6,
      nervousness: stress || 0.3,
      timestamp: Date.now()
    }
  }

  private combineMetrics(metric1?: number, metric2?: number): number | undefined {
    if (metric1 !== undefined && metric2 !== undefined) {
      return (metric1 + metric2) / 2
    }
    return metric1 || metric2
  }

  private calculateEmotionalTrends(
    previousStates: EmotionalState[],
    currentState: EmotionalState
  ): EmotionalTrend[] {
    if (previousStates.length < 2) return []

    const trends: EmotionalTrend[] = []
    const metrics: ('confidence' | 'stress' | 'engagement' | 'clarity')[] = ['confidence', 'stress', 'engagement', 'clarity']

    metrics.forEach(metric => {

      const recentValues = previousStates.slice(-5).map(state => state[metric] as number)
      const currentValue = currentState[metric] as number
      
      const avgPrevious = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length
      const change = currentValue - avgPrevious
      
      let direction: 'improving' | 'declining' | 'stable'
      if (Math.abs(change) < 0.1) direction = 'stable'
      else if (change > 0) direction = metric === 'stress' ? 'declining' : 'improving'
      else direction = metric === 'stress' ? 'improving' : 'declining'

      trends.push({
        metric,
        direction,
        magnitude: Math.abs(change),
        timeframe: '5 minutes',
        significance: Math.abs(change) > 0.2 ? 'high' : Math.abs(change) > 0.1 ? 'medium' : 'low'
      })
    })

    return trends
  }

  private generateEmotionalInsights(
    state: EmotionalState,
    analyses: Partial<EmotionalAnalysis>
  ): EmotionalInsight[] {
    const insights: EmotionalInsight[] = []

    // Confidence insights
    if (state.confidence > 0.8) {
      insights.push({
        type: 'strength',
        title: 'Strong Confidence Level',
        description: 'You are displaying excellent confidence in your responses',
        evidence: ['Steady voice tone', 'Good eye contact', 'Clear articulation'],
        impact: 'high',
        actionable: false
      })
    } else if (state.confidence < 0.4) {
      insights.push({
        type: 'concern',
        title: 'Low Confidence Detected',
        description: 'Your confidence level appears lower than optimal for interview success',
        evidence: ['Uncertain voice patterns', 'Limited eye contact', 'Hesitant responses'],
        impact: 'high',
        actionable: true
      })
    }

    return insights
  }

  private generateEmotionalRecommendations(
    state: EmotionalState,
    insights: EmotionalInsight[]
  ): EmotionalRecommendation[] {
    const recommendations: EmotionalRecommendation[] = []

    // Stress management recommendations
    if (state.stress > 0.6) {
      recommendations.push({
        category: 'breathing',
        title: 'Stress Reduction Techniques',
        description: 'Implement breathing exercises to manage stress levels',
        techniques: ['4-7-8 breathing', 'Box breathing', 'Progressive muscle relaxation'],
        immediateActions: ['Take 3 deep breaths', 'Relax your shoulders', 'Slow down your speech'],
        longTermStrategies: ['Regular meditation practice', 'Interview preparation', 'Mock interview sessions'],
        priority: 'high'
      })
    }

    return recommendations
  }

  private identifyRiskFactors(
    state: EmotionalState,
    trends: EmotionalTrend[]
  ): RiskFactor[] {
    const riskFactors: RiskFactor[] = []

    // High stress risk
    if (state.stress > 0.7) {
      riskFactors.push({
        type: 'anxiety',
        severity: 'high',
        indicators: ['Elevated stress levels', 'Rapid speech', 'Fidgeting'],
        interventions: ['Breathing exercises', 'Positive self-talk', 'Grounding techniques'],
        monitoring: ['Stress level tracking', 'Voice pattern analysis', 'Body language assessment']
      })
    }

    return riskFactors
  }

  // Mock API calls (replace with actual implementations)
  private async callMotivelAPI(audioData: string): Promise<any> {
    // Mock Motivel API response
    return {
      emotions: { confidence: 0.8, stress: 0.2, engagement: 0.9 },
      voice_features: { pitch: [150, 160, 155], volume: [0.7, 0.8, 0.75] }
    }
  }

  private async callMoodmeAPI(frames: string[]): Promise<any> {
    // Mock Moodme API response
    return {
      emotions: { confidence: 0.75, nervousness: 0.25 },
      facial_features: { eye_contact: 0.85, smile: 0.6 }
    }
  }

  private parseMotivelResponse(response: any): VoiceEmotionData {
    return this.generateMockVoiceAnalysis() // Simplified for now
  }

  private parseMoodmeResponse(response: any): FacialEmotionData {
    return this.generateMockFacialAnalysis() // Simplified for now
  }

  private async extractVideoFrames(videoBlob: Blob): Promise<string[]> {
    // Extract frames from video for analysis
    return ['frame1', 'frame2', 'frame3'] // Mock implementation
  }
}

export const emotionalIntelligenceService = new EmotionalIntelligenceService()
