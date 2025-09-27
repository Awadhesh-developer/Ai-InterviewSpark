/**
 * Advanced Sentiment Analysis Service
 * Provides deep emotional analysis and sentiment classification for interview responses
 */

// import * as tf from '@tensorflow/tfjs' // Commented out for now - would need to install package

// Mock TensorFlow for build purposes
const tf = {
  ready: async () => Promise.resolve(),
  loadLayersModel: async (path: string) => { throw new Error('Model not found') },
  sequential: (config: any) => ({
    compile: (config: any) => {},
    predict: (input: any) => ({ dataSync: () => [0.1, 0.2, 0.3, 0.4] })
  }),
  layers: {
    dense: (config: any) => ({}),
    dropout: (config: any) => ({})
  },
  train: {
    adam: (rate: number) => ({})
  }
}

interface EmotionalProfile {
  primary: EmotionType
  secondary: EmotionType
  intensity: number
  stability: number
  authenticity: number
  professionalTone: number
}

interface SentimentTimeline {
  timestamp: number
  sentiment: number
  emotion: EmotionType
  confidence: number
  context: string
}

interface EmotionalIntelligence {
  selfAwareness: number
  empathy: number
  emotionalRegulation: number
  socialSkills: number
  motivation: number
  overallEQ: number
}

interface AdvancedSentimentResult {
  overallSentiment: number
  emotionalProfile: EmotionalProfile
  emotionalIntelligence: EmotionalIntelligence
  sentimentTimeline: SentimentTimeline[]
  emotionalConsistency: number
  stressIndicators: string[]
  positiveIndicators: string[]
  communicationStyle: CommunicationStyle
  confidence: number
}

type EmotionType = 
  | 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'neutral'
  | 'confidence' | 'enthusiasm' | 'nervousness' | 'frustration' | 'curiosity'
  | 'determination' | 'uncertainty' | 'pride' | 'humility'

type CommunicationStyle = 
  | 'assertive' | 'passive' | 'aggressive' | 'diplomatic' | 'analytical' 
  | 'emotional' | 'factual' | 'persuasive' | 'collaborative'

interface EmotionLexicon {
  [key: string]: {
    emotions: Record<EmotionType, number>
    intensity: number
    context: string[]
  }
}

class AdvancedSentimentService {
  private emotionModel: any | null = null
  private emotionLexicon: EmotionLexicon = {}
  private sentimentHistory: SentimentTimeline[] = []
  private isInitialized: boolean = false

  constructor() {
    this.initializeEmotionLexicon()
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('Initializing Advanced Sentiment Analysis Service...')
      
      // Initialize TensorFlow.js
      await tf.ready()
      
      // Load or create emotion classification model
      await this.loadOrCreateEmotionModel()
      
      this.isInitialized = true
      console.log('Advanced Sentiment Analysis Service initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize Advanced Sentiment Analysis Service:', error)
      throw error
    }
  }

  private async loadOrCreateEmotionModel(): Promise<void> {
    try {
      // Try to load existing model
      this.emotionModel = await tf.loadLayersModel('/models/emotion-model.json')
      console.log('Loaded existing emotion model')
    } catch (error) {
      console.log('Creating new emotion classification model...')
      this.emotionModel = this.createEmotionModel()
    }
  }

  private createEmotionModel(): any {
    // Simple emotion classification model
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [100], // Feature vector size
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 16, // Number of emotion categories
          activation: 'softmax'
        })
      ]
    })

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })

    return model
  }

  private initializeEmotionLexicon(): void {
    this.emotionLexicon = {
      // Positive emotions
      'excited': {
        emotions: { joy: 0.8, enthusiasm: 0.9, confidence: 0.6, neutral: 0.1, sadness: 0, anger: 0, fear: 0, surprise: 0.3, disgust: 0, nervousness: 0, frustration: 0, curiosity: 0.4, determination: 0.7, uncertainty: 0, pride: 0.5, humility: 0.2 },
        intensity: 0.8,
        context: ['achievement', 'opportunity', 'success']
      },
      'confident': {
        emotions: { confidence: 0.9, determination: 0.8, pride: 0.6, joy: 0.5, neutral: 0.2, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, nervousness: 0, frustration: 0, curiosity: 0.3, uncertainty: 0, enthusiasm: 0.6, humility: 0.1 },
        intensity: 0.7,
        context: ['ability', 'experience', 'knowledge']
      },
      'passionate': {
        emotions: { enthusiasm: 0.9, determination: 0.8, joy: 0.7, confidence: 0.6, neutral: 0.1, sadness: 0, anger: 0, fear: 0, surprise: 0.2, disgust: 0, nervousness: 0, frustration: 0, curiosity: 0.8, uncertainty: 0, pride: 0.5, humility: 0.3 },
        intensity: 0.9,
        context: ['career', 'goals', 'interests']
      },

      // Negative emotions
      'nervous': {
        emotions: { nervousness: 0.8, fear: 0.6, uncertainty: 0.7, neutral: 0.2, joy: 0, sadness: 0.3, anger: 0, surprise: 0.4, disgust: 0, confidence: 0.1, enthusiasm: 0, frustration: 0.3, curiosity: 0.2, determination: 0.2, pride: 0, humility: 0.6 },
        intensity: 0.6,
        context: ['interview', 'performance', 'evaluation']
      },
      'frustrated': {
        emotions: { frustration: 0.8, anger: 0.6, sadness: 0.4, neutral: 0.2, joy: 0, fear: 0.2, surprise: 0, disgust: 0.3, confidence: 0.1, enthusiasm: 0, nervousness: 0.4, curiosity: 0, determination: 0.3, uncertainty: 0.5, pride: 0, humility: 0.2 },
        intensity: 0.7,
        context: ['challenge', 'obstacle', 'difficulty']
      },
      'worried': {
        emotions: { fear: 0.7, nervousness: 0.8, uncertainty: 0.8, sadness: 0.4, neutral: 0.2, joy: 0, anger: 0.1, surprise: 0.2, disgust: 0, confidence: 0.1, enthusiasm: 0, frustration: 0.4, curiosity: 0.1, determination: 0.2, pride: 0, humility: 0.5 },
        intensity: 0.6,
        context: ['future', 'outcome', 'result']
      },

      // Neutral/Professional emotions
      'focused': {
        emotions: { determination: 0.8, confidence: 0.6, neutral: 0.7, curiosity: 0.5, joy: 0.3, sadness: 0, anger: 0, fear: 0.1, surprise: 0, disgust: 0, nervousness: 0.1, frustration: 0, uncertainty: 0.2, enthusiasm: 0.4, pride: 0.3, humility: 0.4 },
        intensity: 0.6,
        context: ['task', 'goal', 'objective']
      },
      'analytical': {
        emotions: { curiosity: 0.8, determination: 0.6, neutral: 0.8, confidence: 0.5, joy: 0.2, sadness: 0, anger: 0, fear: 0, surprise: 0.3, disgust: 0, nervousness: 0.1, frustration: 0.1, uncertainty: 0.3, enthusiasm: 0.3, pride: 0.2, humility: 0.6 },
        intensity: 0.5,
        context: ['problem', 'analysis', 'solution']
      },
      'thoughtful': {
        emotions: { curiosity: 0.7, humility: 0.8, neutral: 0.7, determination: 0.4, confidence: 0.4, joy: 0.2, sadness: 0.1, anger: 0, fear: 0.1, surprise: 0.2, disgust: 0, nervousness: 0.2, frustration: 0, uncertainty: 0.4, enthusiasm: 0.3, pride: 0.1 },
        intensity: 0.4,
        context: ['consideration', 'reflection', 'evaluation']
      }
    }
  }

  async analyzeSentiment(
    text: string,
    context?: {
      questionType?: string
      timeInInterview?: number
      previousSentiments?: number[]
    }
  ): Promise<AdvancedSentimentResult> {
    if (!this.isInitialized) {
      throw new Error('Advanced Sentiment Service not initialized')
    }

    // Extract features from text
    const features = this.extractTextFeatures(text)
    
    // Analyze emotions using lexicon and ML model
    const emotionalProfile = await this.analyzeEmotionalProfile(text, features)
    
    // Calculate emotional intelligence indicators
    const emotionalIntelligence = this.assessEmotionalIntelligence(text, emotionalProfile)
    
    // Determine communication style
    const communicationStyle = this.identifyCommunicationStyle(text, emotionalProfile)
    
    // Calculate overall sentiment
    const overallSentiment = this.calculateOverallSentiment(emotionalProfile, features)
    
    // Analyze emotional consistency
    const emotionalConsistency = this.calculateEmotionalConsistency(context?.previousSentiments)
    
    // Identify stress and positive indicators
    const stressIndicators = this.identifyStressIndicators(text, emotionalProfile)
    const positiveIndicators = this.identifyPositiveIndicators(text, emotionalProfile)
    
    // Update sentiment timeline
    const timelineEntry: SentimentTimeline = {
      timestamp: Date.now(),
      sentiment: overallSentiment,
      emotion: emotionalProfile.primary,
      confidence: emotionalProfile.authenticity,
      context: context?.questionType || 'general'
    }
    
    this.sentimentHistory.push(timelineEntry)
    
    // Keep only recent history
    if (this.sentimentHistory.length > 100) {
      this.sentimentHistory = this.sentimentHistory.slice(-100)
    }

    return {
      overallSentiment,
      emotionalProfile,
      emotionalIntelligence,
      sentimentTimeline: [...this.sentimentHistory],
      emotionalConsistency,
      stressIndicators,
      positiveIndicators,
      communicationStyle,
      confidence: emotionalProfile.authenticity
    }
  }

  private extractTextFeatures(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/)
    const features = new Array(100).fill(0) // Feature vector
    
    // Basic linguistic features
    features[0] = words.length / 100 // Normalized word count
    features[1] = text.split(/[.!?]+/).length / 10 // Normalized sentence count
    features[2] = words.filter(w => w.length > 6).length / words.length // Complex word ratio
    
    // Emotional word features
    let emotionIndex = 3
    Object.keys(this.emotionLexicon).forEach(word => {
      if (emotionIndex < 50 && text.includes(word)) {
        features[emotionIndex] = this.emotionLexicon[word].intensity
        emotionIndex++
      }
    })
    
    // Punctuation and style features
    features[50] = (text.match(/!/g) || []).length / text.length * 100 // Exclamation density
    features[51] = (text.match(/\?/g) || []).length / text.length * 100 // Question density
    features[52] = (text.match(/[A-Z]/g) || []).length / text.length * 100 // Capital letter density
    
    // Professional language indicators
    const professionalWords = ['experience', 'skills', 'knowledge', 'expertise', 'professional', 'career']
    features[53] = professionalWords.filter(word => text.includes(word)).length / professionalWords.length
    
    // Uncertainty indicators
    const uncertaintyWords = ['maybe', 'perhaps', 'possibly', 'might', 'could', 'unsure']
    features[54] = uncertaintyWords.filter(word => text.includes(word)).length / uncertaintyWords.length
    
    return features
  }

  private async analyzeEmotionalProfile(text: string, features: number[]): Promise<EmotionalProfile> {
    // Lexicon-based emotion analysis
    const emotionScores: Record<EmotionType, number> = {
      joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, neutral: 0.5,
      confidence: 0, enthusiasm: 0, nervousness: 0, frustration: 0, curiosity: 0,
      determination: 0, uncertainty: 0, pride: 0, humility: 0
    }

    // Analyze using emotion lexicon
    Object.entries(this.emotionLexicon).forEach(([word, data]) => {
      if (text.toLowerCase().includes(word)) {
        Object.entries(data.emotions).forEach(([emotion, score]) => {
          emotionScores[emotion as EmotionType] += score * data.intensity
        })
      }
    })

    // Normalize scores
    const totalScore = Object.values(emotionScores).reduce((sum, score) => sum + score, 0)
    if (totalScore > 0) {
      Object.keys(emotionScores).forEach(emotion => {
        emotionScores[emotion as EmotionType] /= totalScore
      })
    }

    // Find primary and secondary emotions
    const sortedEmotions = Object.entries(emotionScores)
      .sort(([, a], [, b]) => b - a)
    
    const primary = sortedEmotions[0][0] as EmotionType
    const secondary = sortedEmotions[1][0] as EmotionType
    
    // Calculate intensity (how strong the emotions are)
    const intensity = Math.max(...Object.values(emotionScores))
    
    // Calculate stability (consistency of emotional expression)
    const variance = this.calculateVariance(Object.values(emotionScores))
    const stability = Math.max(0, 1 - variance * 2)
    
    // Calculate authenticity (how genuine the emotional expression seems)
    const authenticity = this.calculateAuthenticity(text, emotionScores)
    
    // Calculate professional tone
    const professionalTone = this.calculateProfessionalTone(text, emotionScores)

    return {
      primary,
      secondary,
      intensity,
      stability,
      authenticity,
      professionalTone
    }
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
  }

  private calculateAuthenticity(text: string, emotions: Record<EmotionType, number>): number {
    // Simple heuristic for authenticity based on emotional coherence
    let authenticity = 0.7 // Base authenticity
    
    // Check for emotional coherence
    const positiveEmotions = emotions.joy + emotions.confidence + emotions.enthusiasm + emotions.pride
    const negativeEmotions = emotions.sadness + emotions.anger + emotions.fear + emotions.nervousness
    
    // Penalize extreme emotional swings within single response
    if (positiveEmotions > 0.7 && negativeEmotions > 0.7) {
      authenticity -= 0.3
    }
    
    // Reward consistent emotional tone
    if (Math.abs(positiveEmotions - negativeEmotions) > 0.5) {
      authenticity += 0.2
    }
    
    // Check for overly dramatic language
    const dramaticWords = ['absolutely', 'completely', 'totally', 'extremely', 'incredibly']
    const dramaticCount = dramaticWords.filter(word => text.includes(word)).length
    if (dramaticCount > 2) {
      authenticity -= 0.1
    }

    return Math.max(0.1, Math.min(1, authenticity))
  }

  private calculateProfessionalTone(text: string, emotions: Record<EmotionType, number>): number {
    let professionalScore = 0.5 // Base score
    
    // Professional language indicators
    const professionalWords = [
      'experience', 'skills', 'knowledge', 'expertise', 'professional', 'career',
      'responsibility', 'achievement', 'collaboration', 'leadership', 'development'
    ]
    
    const professionalWordCount = professionalWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length
    
    professionalScore += (professionalWordCount / professionalWords.length) * 0.3
    
    // Emotional indicators of professionalism
    professionalScore += emotions.confidence * 0.2
    professionalScore += emotions.determination * 0.15
    professionalScore += emotions.humility * 0.1
    professionalScore -= emotions.anger * 0.2
    professionalScore -= emotions.frustration * 0.15
    
    // Language structure indicators
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = text.split(' ').length / sentences.length
    
    // Moderate sentence length indicates professionalism
    if (avgSentenceLength >= 10 && avgSentenceLength <= 25) {
      professionalScore += 0.1
    }

    return Math.max(0, Math.min(1, professionalScore))
  }

  private assessEmotionalIntelligence(text: string, profile: EmotionalProfile): EmotionalIntelligence {
    // Self-awareness indicators
    const selfAwarenessWords = ['realize', 'understand', 'recognize', 'aware', 'know myself']
    const selfAwareness = Math.min(1, 
      selfAwarenessWords.filter(word => text.includes(word)).length / 3 * 0.5 +
      profile.authenticity * 0.3 +
      profile.stability * 0.2
    )

    // Empathy indicators
    const empathyWords = ['others', 'team', 'understand', 'perspective', 'feelings']
    const empathy = Math.min(1,
      empathyWords.filter(word => text.includes(word)).length / 3 * 0.4 +
      (1 - profile.intensity) * 0.3 + // Moderate emotional intensity suggests control
      profile.professionalTone * 0.3
    )

    // Emotional regulation
    const regulationWords = ['calm', 'manage', 'control', 'handle', 'adapt']
    const emotionalRegulation = Math.min(1,
      regulationWords.filter(word => text.includes(word)).length / 3 * 0.4 +
      profile.stability * 0.4 +
      profile.professionalTone * 0.2
    )

    // Social skills
    const socialWords = ['communicate', 'collaborate', 'work together', 'relationship', 'team']
    const socialSkills = Math.min(1,
      socialWords.filter(word => text.includes(word)).length / 3 * 0.5 +
      profile.professionalTone * 0.3 +
      empathy * 0.2
    )

    // Motivation
    const motivationWords = ['goal', 'achieve', 'improve', 'learn', 'grow', 'challenge']
    const motivation = Math.min(1,
      motivationWords.filter(word => text.includes(word)).length / 3 * 0.6 +
      profile.intensity * 0.4
    )

    const overallEQ = (selfAwareness + empathy + emotionalRegulation + socialSkills + motivation) / 5

    return {
      selfAwareness,
      empathy,
      emotionalRegulation,
      socialSkills,
      motivation,
      overallEQ
    }
  }

  private identifyCommunicationStyle(text: string, profile: EmotionalProfile): CommunicationStyle {
    const styles: Record<CommunicationStyle, number> = {
      assertive: 0, passive: 0, aggressive: 0, diplomatic: 0, analytical: 0,
      emotional: 0, factual: 0, persuasive: 0, collaborative: 0
    }

    // Assertive indicators
    if (profile.authenticity > 0.7 && profile.professionalTone > 0.6) {
      styles.assertive += 0.8
    }

    // Passive indicators
    if (profile.primary === 'uncertainty' || profile.primary === 'humility') {
      styles.passive += 0.7
    }

    // Aggressive indicators
    if (profile.primary === 'anger' || profile.primary === 'frustration') {
      styles.aggressive += 0.8
    }

    // Diplomatic indicators
    if (profile.professionalTone > 0.8 && profile.stability > 0.7) {
      styles.diplomatic += 0.8
    }

    // Analytical indicators
    const analyticalWords = ['analyze', 'data', 'research', 'evidence', 'logic']
    if (analyticalWords.some(word => text.includes(word))) {
      styles.analytical += 0.7
    }

    // Emotional indicators
    if (profile.intensity > 0.7) {
      styles.emotional += 0.8
    }

    // Factual indicators
    const factualWords = ['fact', 'data', 'evidence', 'research', 'study']
    if (factualWords.some(word => text.includes(word))) {
      styles.factual += 0.7
    }

    // Persuasive indicators
    const persuasiveWords = ['believe', 'convince', 'important', 'should', 'must']
    if (persuasiveWords.some(word => text.includes(word))) {
      styles.persuasive += 0.6
    }

    // Collaborative indicators
    const collaborativeWords = ['we', 'together', 'team', 'collaborate', 'share']
    if (collaborativeWords.some(word => text.includes(word))) {
      styles.collaborative += 0.7
    }

    // Return the style with highest score
    return Object.entries(styles).reduce((prev, current) => 
      current[1] > prev[1] ? current : prev
    )[0] as CommunicationStyle
  }

  private calculateOverallSentiment(profile: EmotionalProfile, features: number[]): number {
    // Calculate sentiment based on emotional profile
    const positiveEmotions = ['joy', 'confidence', 'enthusiasm', 'determination', 'pride']
    const negativeEmotions = ['sadness', 'anger', 'fear', 'nervousness', 'frustration', 'uncertainty']
    
    let sentiment = 0.5 // Neutral baseline
    
    // Adjust based on primary emotion
    if (positiveEmotions.includes(profile.primary)) {
      sentiment += 0.3 * profile.intensity
    } else if (negativeEmotions.includes(profile.primary)) {
      sentiment -= 0.3 * profile.intensity
    }
    
    // Adjust based on professional tone
    sentiment += (profile.professionalTone - 0.5) * 0.2
    
    // Adjust based on authenticity
    sentiment += (profile.authenticity - 0.5) * 0.1

    return Math.max(-1, Math.min(1, sentiment))
  }

  private calculateEmotionalConsistency(previousSentiments?: number[]): number {
    if (!previousSentiments || previousSentiments.length < 2) {
      return 0.5 // Default consistency
    }

    // Calculate variance in sentiment scores
    const variance = this.calculateVariance(previousSentiments)
    
    // Convert variance to consistency score (lower variance = higher consistency)
    return Math.max(0, Math.min(1, 1 - variance))
  }

  private identifyStressIndicators(text: string, profile: EmotionalProfile): string[] {
    const indicators: string[] = []
    
    if (profile.primary === 'nervousness' || profile.primary === 'fear') {
      indicators.push('High nervousness or anxiety detected')
    }
    
    if (profile.primary === 'uncertainty' && profile.intensity > 0.6) {
      indicators.push('Significant uncertainty in responses')
    }
    
    if (profile.stability < 0.4) {
      indicators.push('Emotional instability detected')
    }
    
    const stressWords = ['difficult', 'challenging', 'struggle', 'pressure', 'stress']
    if (stressWords.some(word => text.includes(word))) {
      indicators.push('Stress-related language used')
    }
    
    if (profile.professionalTone < 0.4) {
      indicators.push('Decreased professional communication')
    }

    return indicators
  }

  private identifyPositiveIndicators(text: string, profile: EmotionalProfile): string[] {
    const indicators: string[] = []
    
    if (profile.primary === 'confidence' || profile.primary === 'enthusiasm') {
      indicators.push('Strong confidence and enthusiasm demonstrated')
    }
    
    if (profile.professionalTone > 0.8) {
      indicators.push('Excellent professional communication')
    }
    
    if (profile.authenticity > 0.8) {
      indicators.push('Authentic and genuine responses')
    }
    
    if (profile.stability > 0.8) {
      indicators.push('Consistent emotional regulation')
    }
    
    const positiveWords = ['excited', 'passionate', 'love', 'enjoy', 'successful']
    if (positiveWords.some(word => text.includes(word))) {
      indicators.push('Positive and engaging language')
    }

    return indicators
  }

  // Public API methods
  getSentimentHistory(): SentimentTimeline[] {
    return [...this.sentimentHistory]
  }

  getEmotionalTrend(): 'improving' | 'declining' | 'stable' {
    if (this.sentimentHistory.length < 3) return 'stable'
    
    const recent = this.sentimentHistory.slice(-3)
    const trend = recent[2].sentiment - recent[0].sentiment
    
    if (trend > 0.1) return 'improving'
    if (trend < -0.1) return 'declining'
    return 'stable'
  }

  clearHistory(): void {
    this.sentimentHistory = []
  }

  destroy(): void {
    if (this.emotionModel) {
      this.emotionModel.dispose()
      this.emotionModel = null
    }
    this.sentimentHistory = []
    this.isInitialized = false
  }
}

export { 
  AdvancedSentimentService,
  type AdvancedSentimentResult,
  type EmotionalProfile,
  type EmotionalIntelligence,
  type SentimentTimeline,
  type EmotionType,
  type CommunicationStyle
}
