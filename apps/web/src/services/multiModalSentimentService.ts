/**
 * Multi-Modal Sentiment Fusion Service
 * Integrates text, voice, facial, and behavioral sentiment analysis for comprehensive emotional understanding
 */

import { type AdvancedSentimentResult, type EmotionType } from './advancedSentimentService'
import { type FacialAnalysisResult } from './facialAnalysisService'
import { type UnifiedMetrics } from './unifiedAnalyticsService'

interface MultiModalSentimentResult {
  fusedSentiment: FusedSentimentAnalysis
  modalityBreakdown: ModalityBreakdown
  emotionalCoherence: EmotionalCoherence
  sentimentReliability: SentimentReliability
  culturalContext: CulturalContext
  realTimeInsights: RealTimeInsights
  confidence: number
}

interface FusedSentimentAnalysis {
  overallSentiment: number // -1 to 1
  primaryEmotion: EmotionType
  secondaryEmotion: EmotionType
  emotionalIntensity: number
  emotionalStability: number
  professionalAlignment: number
  authenticityScore: number
}

interface ModalityBreakdown {
  textSentiment: {
    sentiment: number
    confidence: number
    weight: number
    primaryEmotion: EmotionType
  }
  voiceSentiment: {
    sentiment: number
    confidence: number
    weight: number
    tonalQuality: number
    stressIndicators: number
  }
  facialSentiment: {
    sentiment: number
    confidence: number
    weight: number
    expressiveness: number
    microExpressions: number
  }
  behavioralSentiment: {
    sentiment: number
    confidence: number
    weight: number
    postureAlignment: number
    gestureCongruence: number
  }
}

interface EmotionalCoherence {
  crossModalConsistency: number
  temporalConsistency: number
  contextualAppropriatenss: number
  emotionalCongruence: number
  overallCoherence: number
}

interface SentimentReliability {
  dataQuality: number
  modalityAgreement: number
  temporalStability: number
  contextualValidity: number
  overallReliability: number
}

interface CulturalContext {
  culturalNorms: string[]
  communicationStyle: 'direct' | 'indirect' | 'high-context' | 'low-context'
  emotionalExpressiveness: 'reserved' | 'moderate' | 'expressive'
  professionalExpectations: string[]
  culturalAdaptations: string[]
}

interface RealTimeInsights {
  emotionalTrend: 'improving' | 'declining' | 'stable' | 'fluctuating'
  stressLevel: number
  engagementLevel: number
  confidenceLevel: number
  professionalPresence: number
  adaptationRecommendations: string[]
  interviewerGuidance: string[]
}

interface SentimentFusionWeights {
  text: number
  voice: number
  facial: number
  behavioral: number
}

interface EmotionalCalibration {
  baseline: {
    sentiment: number
    emotionalRange: number
    expressiveness: number
    stability: number
  }
  current: {
    deviation: number
    adaptation: number
    stress: number
    fatigue: number
  }
}

class MultiModalSentimentService {
  private fusionWeights: SentimentFusionWeights = {
    text: 0.3,
    voice: 0.25,
    facial: 0.25,
    behavioral: 0.2
  }
  
  private emotionalCalibration: EmotionalCalibration | null = null
  private sentimentHistory: MultiModalSentimentResult[] = []
  private culturalProfile: CulturalContext | null = null
  private isCalibrated: boolean = false

  constructor() {
    this.initializeDefaultCulturalContext()
  }

  private initializeDefaultCulturalContext(): void {
    this.culturalProfile = {
      culturalNorms: ['professional_communication', 'moderate_expressiveness', 'direct_communication'],
      communicationStyle: 'direct',
      emotionalExpressiveness: 'moderate',
      professionalExpectations: [
        'maintain_composure',
        'clear_communication',
        'appropriate_confidence',
        'respectful_interaction'
      ],
      culturalAdaptations: []
    }
  }

  async analyzeFusedSentiment(
    textSentiment: AdvancedSentimentResult,
    facialAnalysis: FacialAnalysisResult,
    unifiedMetrics: UnifiedMetrics,
    voiceMetrics?: {
      tonalSentiment: number
      stressLevel: number
      confidence: number
      clarity: number
    },
    context?: {
      questionType: string
      timeInInterview: number
      culturalBackground?: string
    }
  ): Promise<MultiModalSentimentResult> {
    
    // Calibrate emotional baseline if not done
    if (!this.isCalibrated) {
      this.calibrateEmotionalBaseline(textSentiment, facialAnalysis, unifiedMetrics)
    }

    // Extract sentiment from each modality
    const modalityBreakdown = this.extractModalitySentiments(
      textSentiment,
      facialAnalysis,
      unifiedMetrics,
      voiceMetrics
    )

    // Adapt fusion weights based on data quality and context
    const adaptedWeights = this.adaptFusionWeights(modalityBreakdown, context)

    // Perform sentiment fusion
    const fusedSentiment = this.performSentimentFusion(modalityBreakdown, adaptedWeights)

    // Analyze emotional coherence across modalities
    const emotionalCoherence = this.analyzeEmotionalCoherence(modalityBreakdown, fusedSentiment)

    // Assess sentiment reliability
    const sentimentReliability = this.assessSentimentReliability(modalityBreakdown, emotionalCoherence)

    // Generate real-time insights
    const realTimeInsights = this.generateRealTimeInsights(fusedSentiment, modalityBreakdown, context)

    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(sentimentReliability, emotionalCoherence)

    const result: MultiModalSentimentResult = {
      fusedSentiment,
      modalityBreakdown,
      emotionalCoherence,
      sentimentReliability,
      culturalContext: this.culturalProfile!,
      realTimeInsights,
      confidence
    }

    // Store in history
    this.sentimentHistory.push(result)
    if (this.sentimentHistory.length > 50) {
      this.sentimentHistory = this.sentimentHistory.slice(-50)
    }

    return result
  }

  private calibrateEmotionalBaseline(
    textSentiment: AdvancedSentimentResult,
    facialAnalysis: FacialAnalysisResult,
    unifiedMetrics: UnifiedMetrics
  ): void {
    this.emotionalCalibration = {
      baseline: {
        sentiment: textSentiment.overallSentiment,
        emotionalRange: textSentiment.emotionalProfile.intensity,
        expressiveness: facialAnalysis.engagement?.expressiveness || 0.5,
        stability: textSentiment.emotionalProfile.stability
      },
      current: {
        deviation: 0,
        adaptation: 0,
        stress: 0,
        fatigue: 0
      }
    }
    this.isCalibrated = true
  }

  private extractModalitySentiments(
    textSentiment: AdvancedSentimentResult,
    facialAnalysis: FacialAnalysisResult,
    unifiedMetrics: UnifiedMetrics,
    voiceMetrics?: any
  ): ModalityBreakdown {
    // Text sentiment extraction
    const textModalitySentiment = {
      sentiment: textSentiment.overallSentiment,
      confidence: textSentiment.confidence,
      weight: this.fusionWeights.text,
      primaryEmotion: textSentiment.emotionalProfile.primary
    }

    // Voice sentiment extraction
    const voiceModalitySentiment = {
      sentiment: voiceMetrics?.tonalSentiment || 0,
      confidence: voiceMetrics?.confidence || 0.5,
      weight: this.fusionWeights.voice,
      tonalQuality: voiceMetrics?.clarity || 0.5,
      stressIndicators: voiceMetrics?.stressLevel || 0
    }

    // Facial sentiment extraction
    const facialModalitySentiment = {
      sentiment: this.calculateFacialSentiment(facialAnalysis),
      confidence: facialAnalysis.faceDetected ? 0.8 : 0.2,
      weight: this.fusionWeights.facial,
      expressiveness: facialAnalysis.engagement?.expressiveness || 0.5,
      microExpressions: this.analyzeMicroExpressions(facialAnalysis)
    }

    // Behavioral sentiment extraction
    const behavioralModalitySentiment = {
      sentiment: this.calculateBehavioralSentiment(unifiedMetrics),
      confidence: 0.7,
      weight: this.fusionWeights.behavioral,
      postureAlignment: unifiedMetrics.bodyLanguage?.postureQuality || 0.5,
      gestureCongruence: unifiedMetrics.bodyLanguage?.gestureEffectiveness || 0.5
    }

    return {
      textSentiment: textModalitySentiment,
      voiceSentiment: voiceModalitySentiment,
      facialSentiment: facialModalitySentiment,
      behavioralSentiment: behavioralModalitySentiment
    }
  }

  private calculateFacialSentiment(facialAnalysis: FacialAnalysisResult): number {
    if (!facialAnalysis.faceDetected || !facialAnalysis.emotions) {
      return 0
    }

    const emotions = facialAnalysis.emotions
    const positiveEmotions = emotions.happy + emotions.surprised * 0.5
    const negativeEmotions = emotions.sad + emotions.angry + emotions.fearful + emotions.disgusted
    
    // Calculate sentiment based on emotional balance
    const sentiment = (positiveEmotions - negativeEmotions) * 2 - 1
    return Math.max(-1, Math.min(1, sentiment))
  }

  private analyzeMicroExpressions(facialAnalysis: FacialAnalysisResult): number {
    if (!facialAnalysis.faceDetected) return 0

    // Analyze subtle facial expressions that might indicate hidden emotions
    const microExpressionScore = 
      (facialAnalysis.emotions?.surprised || 0) * 0.3 +
      (facialAnalysis.emotions?.fearful || 0) * 0.4 +
      (1 - (facialAnalysis.emotions?.neutral || 1)) * 0.3

    return Math.min(1, microExpressionScore)
  }

  private calculateBehavioralSentiment(unifiedMetrics: UnifiedMetrics): number {
    const engagement = unifiedMetrics.overall?.engagementLevel || 0.5
    const confidence = unifiedMetrics.overall?.confidenceLevel || 0.5
    const professionalPresence = unifiedMetrics.overall?.professionalPresence || 0.5
    
    // Behavioral sentiment based on positive behavioral indicators
    const behavioralSentiment = (engagement + confidence + professionalPresence) / 3
    
    // Convert to -1 to 1 scale
    return (behavioralSentiment - 0.5) * 2
  }

  private adaptFusionWeights(
    modalityBreakdown: ModalityBreakdown,
    context?: any
  ): SentimentFusionWeights {
    const adaptedWeights = { ...this.fusionWeights }

    // Increase weight for high-confidence modalities
    if (modalityBreakdown.textSentiment.confidence > 0.8) {
      adaptedWeights.text *= 1.2
    }
    if (modalityBreakdown.facialSentiment.confidence > 0.8) {
      adaptedWeights.facial *= 1.2
    }
    if (modalityBreakdown.voiceSentiment.confidence > 0.8) {
      adaptedWeights.voice *= 1.2
    }

    // Decrease weight for low-confidence modalities
    if (modalityBreakdown.textSentiment.confidence < 0.4) {
      adaptedWeights.text *= 0.7
    }
    if (modalityBreakdown.facialSentiment.confidence < 0.4) {
      adaptedWeights.facial *= 0.7
    }
    if (modalityBreakdown.voiceSentiment.confidence < 0.4) {
      adaptedWeights.voice *= 0.7
    }

    // Normalize weights
    const totalWeight = Object.values(adaptedWeights).reduce((sum, weight) => sum + weight, 0)
    Object.keys(adaptedWeights).forEach(key => {
      adaptedWeights[key as keyof SentimentFusionWeights] /= totalWeight
    })

    return adaptedWeights
  }

  private performSentimentFusion(
    modalityBreakdown: ModalityBreakdown,
    weights: SentimentFusionWeights
  ): FusedSentimentAnalysis {
    // Weighted sentiment fusion
    const overallSentiment = 
      modalityBreakdown.textSentiment.sentiment * weights.text +
      modalityBreakdown.voiceSentiment.sentiment * weights.voice +
      modalityBreakdown.facialSentiment.sentiment * weights.facial +
      modalityBreakdown.behavioralSentiment.sentiment * weights.behavioral

    // Determine primary emotion from strongest modality
    const primaryEmotion = modalityBreakdown.textSentiment.primaryEmotion

    // Calculate secondary emotion from facial analysis
    const secondaryEmotion = this.determineSecondaryEmotion(modalityBreakdown)

    // Calculate emotional intensity
    const emotionalIntensity = Math.abs(overallSentiment)

    // Calculate emotional stability
    const emotionalStability = this.calculateEmotionalStability(modalityBreakdown)

    // Calculate professional alignment
    const professionalAlignment = this.calculateProfessionalAlignment(modalityBreakdown)

    // Calculate authenticity score
    const authenticityScore = this.calculateAuthenticityScore(modalityBreakdown)

    return {
      overallSentiment,
      primaryEmotion,
      secondaryEmotion,
      emotionalIntensity,
      emotionalStability,
      professionalAlignment,
      authenticityScore
    }
  }

  private determineSecondaryEmotion(modalityBreakdown: ModalityBreakdown): EmotionType {
    // Simple heuristic - could be enhanced with more sophisticated analysis
    if (modalityBreakdown.facialSentiment.sentiment > 0.3) {
      return 'confidence'
    } else if (modalityBreakdown.facialSentiment.sentiment < -0.3) {
      return 'nervousness'
    } else {
      return 'neutral'
    }
  }

  private calculateEmotionalStability(modalityBreakdown: ModalityBreakdown): number {
    // Calculate variance across modalities
    const sentiments = [
      modalityBreakdown.textSentiment.sentiment,
      modalityBreakdown.voiceSentiment.sentiment,
      modalityBreakdown.facialSentiment.sentiment,
      modalityBreakdown.behavioralSentiment.sentiment
    ]

    const mean = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
    const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / sentiments.length
    
    // Convert variance to stability score (lower variance = higher stability)
    return Math.max(0, 1 - variance)
  }

  private calculateProfessionalAlignment(modalityBreakdown: ModalityBreakdown): number {
    // Professional alignment based on behavioral and text sentiment
    const behavioralProfessionalism = (modalityBreakdown.behavioralSentiment.sentiment + 1) / 2
    const textProfessionalism = (modalityBreakdown.textSentiment.sentiment + 1) / 2
    
    return (behavioralProfessionalism + textProfessionalism) / 2
  }

  private calculateAuthenticityScore(modalityBreakdown: ModalityBreakdown): number {
    // Authenticity based on cross-modal consistency
    const sentimentRange = Math.max(
      modalityBreakdown.textSentiment.sentiment,
      modalityBreakdown.voiceSentiment.sentiment,
      modalityBreakdown.facialSentiment.sentiment,
      modalityBreakdown.behavioralSentiment.sentiment
    ) - Math.min(
      modalityBreakdown.textSentiment.sentiment,
      modalityBreakdown.voiceSentiment.sentiment,
      modalityBreakdown.facialSentiment.sentiment,
      modalityBreakdown.behavioralSentiment.sentiment
    )

    // Lower range indicates higher authenticity
    return Math.max(0, 1 - sentimentRange / 2)
  }

  private analyzeEmotionalCoherence(
    modalityBreakdown: ModalityBreakdown,
    fusedSentiment: FusedSentimentAnalysis
  ): EmotionalCoherence {
    // Cross-modal consistency
    const crossModalConsistency = this.calculateCrossModalConsistency(modalityBreakdown)

    // Temporal consistency
    const temporalConsistency = this.calculateTemporalConsistency()

    // Contextual appropriateness
    const contextualAppropriatenss = this.calculateContextualAppropriateness(fusedSentiment)

    // Emotional congruence
    const emotionalCongruence = this.calculateEmotionalCongruence(modalityBreakdown)

    // Overall coherence
    const overallCoherence = (
      crossModalConsistency + 
      temporalConsistency + 
      contextualAppropriatenss + 
      emotionalCongruence
    ) / 4

    return {
      crossModalConsistency,
      temporalConsistency,
      contextualAppropriatenss,
      emotionalCongruence,
      overallCoherence
    }
  }

  private calculateCrossModalConsistency(modalityBreakdown: ModalityBreakdown): number {
    const sentiments = [
      modalityBreakdown.textSentiment.sentiment,
      modalityBreakdown.voiceSentiment.sentiment,
      modalityBreakdown.facialSentiment.sentiment,
      modalityBreakdown.behavioralSentiment.sentiment
    ]

    // Calculate standard deviation
    const mean = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
    const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / sentiments.length
    const stdDev = Math.sqrt(variance)

    // Convert to consistency score (lower std dev = higher consistency)
    return Math.max(0, 1 - stdDev)
  }

  private calculateTemporalConsistency(): number {
    if (this.sentimentHistory.length < 3) return 0.5

    const recentSentiments = this.sentimentHistory.slice(-3).map(h => h.fusedSentiment.overallSentiment)
    const variance = this.calculateVariance(recentSentiments)
    
    return Math.max(0, 1 - variance * 2)
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  }

  private calculateContextualAppropriateness(fusedSentiment: FusedSentimentAnalysis): number {
    // Simple heuristic for interview context appropriateness
    if (fusedSentiment.professionalAlignment > 0.7 && 
        fusedSentiment.emotionalStability > 0.6) {
      return 0.9
    } else if (fusedSentiment.professionalAlignment > 0.5) {
      return 0.7
    } else {
      return 0.4
    }
  }

  private calculateEmotionalCongruence(modalityBreakdown: ModalityBreakdown): number {
    // Check if emotions align across modalities
    const textPositive = modalityBreakdown.textSentiment.sentiment > 0
    const facialPositive = modalityBreakdown.facialSentiment.sentiment > 0
    const behavioralPositive = modalityBreakdown.behavioralSentiment.sentiment > 0

    const agreements = [
      textPositive === facialPositive,
      textPositive === behavioralPositive,
      facialPositive === behavioralPositive
    ].filter(Boolean).length

    return agreements / 3
  }

  private assessSentimentReliability(
    modalityBreakdown: ModalityBreakdown,
    emotionalCoherence: EmotionalCoherence
  ): SentimentReliability {
    // Data quality based on confidence scores
    const dataQuality = (
      modalityBreakdown.textSentiment.confidence +
      modalityBreakdown.voiceSentiment.confidence +
      modalityBreakdown.facialSentiment.confidence +
      modalityBreakdown.behavioralSentiment.confidence
    ) / 4

    // Modality agreement
    const modalityAgreement = emotionalCoherence.crossModalConsistency

    // Temporal stability
    const temporalStability = emotionalCoherence.temporalConsistency

    // Contextual validity
    const contextualValidity = emotionalCoherence.contextualAppropriatenss

    // Overall reliability
    const overallReliability = (dataQuality + modalityAgreement + temporalStability + contextualValidity) / 4

    return {
      dataQuality,
      modalityAgreement,
      temporalStability,
      contextualValidity,
      overallReliability
    }
  }

  private generateRealTimeInsights(
    fusedSentiment: FusedSentimentAnalysis,
    modalityBreakdown: ModalityBreakdown,
    context?: any
  ): RealTimeInsights {
    // Emotional trend analysis
    const emotionalTrend = this.analyzeEmotionalTrend()

    // Calculate real-time metrics
    const stressLevel = this.calculateStressLevel(modalityBreakdown)
    const engagementLevel = this.calculateEngagementLevel(modalityBreakdown)
    const confidenceLevel = (fusedSentiment.overallSentiment + 1) / 2
    const professionalPresence = fusedSentiment.professionalAlignment

    // Generate adaptation recommendations
    const adaptationRecommendations = this.generateAdaptationRecommendations(fusedSentiment, modalityBreakdown)

    // Generate interviewer guidance
    const interviewerGuidance = this.generateInterviewerGuidance(fusedSentiment, stressLevel)

    return {
      emotionalTrend,
      stressLevel,
      engagementLevel,
      confidenceLevel,
      professionalPresence,
      adaptationRecommendations,
      interviewerGuidance
    }
  }

  private analyzeEmotionalTrend(): RealTimeInsights['emotionalTrend'] {
    if (this.sentimentHistory.length < 3) return 'stable'

    const recentSentiments = this.sentimentHistory.slice(-3).map(h => h.fusedSentiment.overallSentiment)
    const trend = recentSentiments[2] - recentSentiments[0]
    const variance = this.calculateVariance(recentSentiments)

    if (variance > 0.3) return 'fluctuating'
    if (trend > 0.2) return 'improving'
    if (trend < -0.2) return 'declining'
    return 'stable'
  }

  private calculateStressLevel(modalityBreakdown: ModalityBreakdown): number {
    const voiceStress = modalityBreakdown.voiceSentiment.stressIndicators
    const facialStress = 1 - modalityBreakdown.facialSentiment.expressiveness
    const behavioralStress = 1 - modalityBreakdown.behavioralSentiment.postureAlignment

    return (voiceStress + facialStress + behavioralStress) / 3
  }

  private calculateEngagementLevel(modalityBreakdown: ModalityBreakdown): number {
    const facialEngagement = modalityBreakdown.facialSentiment.expressiveness
    const behavioralEngagement = modalityBreakdown.behavioralSentiment.gestureCongruence
    const textEngagement = (modalityBreakdown.textSentiment.sentiment + 1) / 2

    return (facialEngagement + behavioralEngagement + textEngagement) / 3
  }

  private generateAdaptationRecommendations(
    fusedSentiment: FusedSentimentAnalysis,
    modalityBreakdown: ModalityBreakdown
  ): string[] {
    const recommendations: string[] = []

    if (fusedSentiment.emotionalStability < 0.5) {
      recommendations.push('Take a moment to center yourself and regulate your emotions')
    }

    if (modalityBreakdown.behavioralSentiment.postureAlignment < 0.6) {
      recommendations.push('Adjust your posture to project more confidence')
    }

    if (fusedSentiment.professionalAlignment < 0.6) {
      recommendations.push('Focus on maintaining professional communication tone')
    }

    if (fusedSentiment.authenticityScore < 0.6) {
      recommendations.push('Ensure your verbal and non-verbal communication are aligned')
    }

    return recommendations
  }

  private generateInterviewerGuidance(
    fusedSentiment: FusedSentimentAnalysis,
    stressLevel: number
  ): string[] {
    const guidance: string[] = []

    if (stressLevel > 0.7) {
      guidance.push('Consider providing reassurance or taking a brief break')
    }

    if (fusedSentiment.emotionalIntensity > 0.8) {
      guidance.push('Candidate is showing high emotional intensity - monitor for overwhelm')
    }

    if (fusedSentiment.professionalAlignment < 0.5) {
      guidance.push('Gently guide conversation back to professional topics')
    }

    return guidance
  }

  private calculateOverallConfidence(
    sentimentReliability: SentimentReliability,
    emotionalCoherence: EmotionalCoherence
  ): number {
    return (sentimentReliability.overallReliability + emotionalCoherence.overallCoherence) / 2
  }

  // Public API methods
  getSentimentHistory(): MultiModalSentimentResult[] {
    return [...this.sentimentHistory]
  }

  updateCulturalContext(culturalContext: Partial<CulturalContext>): void {
    this.culturalProfile = { ...this.culturalProfile!, ...culturalContext }
  }

  updateFusionWeights(weights: Partial<SentimentFusionWeights>): void {
    this.fusionWeights = { ...this.fusionWeights, ...weights }
  }

  getEmotionalCalibration(): EmotionalCalibration | null {
    return this.emotionalCalibration
  }

  resetCalibration(): void {
    this.emotionalCalibration = null
    this.isCalibrated = false
  }

  clearHistory(): void {
    this.sentimentHistory = []
  }
}

export { 
  MultiModalSentimentService,
  type MultiModalSentimentResult,
  type FusedSentimentAnalysis,
  type ModalityBreakdown,
  type EmotionalCoherence,
  type SentimentReliability,
  type CulturalContext,
  type RealTimeInsights,
  type SentimentFusionWeights
}
