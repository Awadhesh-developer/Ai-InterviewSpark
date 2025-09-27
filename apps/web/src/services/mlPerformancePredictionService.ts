/**
 * ML-Based Performance Prediction Service
 * Uses machine learning models to predict interview performance and behavioral patterns
 */

// Mock TensorFlow.js implementation for build compatibility
interface MockTensor {
  dataSync: () => number[]
  data(): Promise<Float32Array>
  dispose(): void
}

interface MockLayersModel {
  add: (layer: any) => void
  compile: (config: any) => void
  fit: (x: any, y: any, config?: any) => Promise<any>
  predict: (x: any) => MockTensor
  save: (path: string) => Promise<any>
  dispose: () => void
}

// Create a comprehensive mock TensorFlow.js namespace
const tf = {
  // Core tensor operations
  ready: (): Promise<void> => Promise.resolve(),

  tensor: (data: any): MockTensor => ({
    dataSync: () => [0.5],
    data: () => Promise.resolve(new Float32Array([0.5])),
    dispose: () => {}
  }),

  tensor2d: (data: any, shape?: any): MockTensor => ({
    dataSync: () => [0.5],
    data: () => Promise.resolve(new Float32Array([0.5])),
    dispose: () => {}
  }),

  // Model operations
  sequential: (config?: any): MockLayersModel => ({
    add: () => {},
    compile: () => {},
    fit: () => Promise.resolve({}),
    predict: () => ({
      dataSync: () => [0.5],
      data: () => Promise.resolve(new Float32Array([0.5])),
      dispose: () => {}
    }),
    save: () => Promise.resolve({}),
    dispose: () => {}
  }),

  loadLayersModel: (path: string): Promise<MockLayersModel> => Promise.resolve({
    add: () => {},
    compile: () => {},
    fit: () => Promise.resolve({}),
    predict: () => ({
      dataSync: () => [0.5],
      data: () => Promise.resolve(new Float32Array([0.5])),
      dispose: () => {}
    }),
    save: () => Promise.resolve({}),
    dispose: () => {}
  }),

  // Layers
  layers: {
    dense: (config?: any) => ({}),
    dropout: (config?: any) => ({})
  },

  // Losses
  losses: {
    meanSquaredError: 'mse'
  },

  // Optimizers
  optimizers: {
    adam: () => ({})
  },

  // Regularizers
  regularizers: {
    l2: (config?: any) => ({})
  },

  // Training
  train: {
    adam: (learningRate?: number) => ({})
  }
}

// Type definitions for TypeScript
declare namespace tf {
  interface LayersModel extends MockLayersModel {}
  interface Tensor extends MockTensor {}
}
import { type UnifiedMetrics } from './unifiedAnalyticsService'
import { type TextAnalysisResult } from './nlpAnalysisService'
import { type CandidateProfile } from './adaptiveQuestionService'

interface PerformancePrediction {
  overallSuccessProbability: number
  categoryPredictions: {
    technical: number
    communication: number
    leadership: number
    problemSolving: number
    culturalFit: number
  }
  confidenceInterval: {
    lower: number
    upper: number
  }
  riskFactors: string[]
  strengthIndicators: string[]
  improvementPotential: number
  timeToImprovement: number // in weeks
}

interface BehavioralPattern {
  id: string
  name: string
  description: string
  indicators: string[]
  frequency: number
  confidence: number
  trend: 'increasing' | 'decreasing' | 'stable'
  impact: 'positive' | 'negative' | 'neutral'
}

interface PerformanceFeatures {
  // Behavioral metrics
  averageConfidence: number
  communicationConsistency: number
  stressResponse: number
  adaptability: number
  engagement: number
  
  // Technical metrics
  technicalAccuracy: number
  problemSolvingApproach: number
  innovationLevel: number
  
  // Temporal metrics
  responseTime: number
  improvementRate: number
  consistencyScore: number
  
  // Interaction metrics
  eyeContactQuality: number
  postureStability: number
  gestureEffectiveness: number
  voiceClarity: number
  
  // Content metrics
  responseDepth: number
  exampleQuality: number
  relevanceScore: number
  creativityLevel: number
}

interface TrainingData {
  features: PerformanceFeatures
  outcome: {
    hired: boolean
    performanceRating: number // 1-5 scale
    timeToProductivity: number // in weeks
    retentionPeriod: number // in months
  }
  metadata: {
    position: string
    industry: string
    experienceLevel: string
    interviewDate: Date
  }
}

interface ModelPrediction {
  prediction: number
  confidence: number
  featureImportance: Record<string, number>
  explanation: string[]
}

class MLPerformancePredictionService {
  private performanceModel: tf.LayersModel | null = null
  private behaviorModel: tf.LayersModel | null = null
  private isInitialized: boolean = false
  private trainingData: TrainingData[] = []
  private behavioralPatterns: Map<string, BehavioralPattern> = new Map()
  private featureScaler: { mean: number[]; std: number[] } | null = null

  constructor() {
    this.initializeBehavioralPatterns()
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('Initializing ML Performance Prediction Service...')
      
      // Initialize TensorFlow.js
      await tf.ready()
      
      // Load or create models
      await this.loadOrCreateModels()
      
      // Load training data (in production, this would come from a database)
      await this.loadTrainingData()
      
      this.isInitialized = true
      console.log('ML Performance Prediction Service initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize ML Performance Prediction Service:', error)
      throw error
    }
  }

  private async loadOrCreateModels(): Promise<void> {
    try {
      // Try to load existing models
      this.performanceModel = await tf.loadLayersModel('/models/performance-model.json')
      this.behaviorModel = await tf.loadLayersModel('/models/behavior-model.json')
      console.log('Loaded existing ML models')
    } catch (error) {
      console.log('Creating new ML models...')
      // Create new models if loading fails
      this.performanceModel = this.createPerformanceModel()
      this.behaviorModel = this.createBehaviorModel()
    }
  }

  private createPerformanceModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [20], // 20 performance features
          units: 64,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid' // Output probability of success
        })
      ]
    })

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    })

    return model
  }

  private createBehaviorModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [15], // 15 behavioral features
          units: 48,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 24,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 8, // 8 behavioral pattern categories
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

  private async loadTrainingData(): Promise<void> {
    // In production, this would load from a database
    // For now, we'll generate synthetic training data
    this.trainingData = this.generateSyntheticTrainingData(1000)
    
    // Calculate feature scaling parameters
    this.calculateFeatureScaling()
  }

  private generateSyntheticTrainingData(count: number): TrainingData[] {
    const data: TrainingData[] = []
    
    for (let i = 0; i < count; i++) {
      const features: PerformanceFeatures = {
        averageConfidence: Math.random(),
        communicationConsistency: Math.random(),
        stressResponse: Math.random(),
        adaptability: Math.random(),
        engagement: Math.random(),
        technicalAccuracy: Math.random(),
        problemSolvingApproach: Math.random(),
        innovationLevel: Math.random(),
        responseTime: Math.random() * 300 + 30, // 30-330 seconds
        improvementRate: Math.random(),
        consistencyScore: Math.random(),
        eyeContactQuality: Math.random(),
        postureStability: Math.random(),
        gestureEffectiveness: Math.random(),
        voiceClarity: Math.random(),
        responseDepth: Math.random(),
        exampleQuality: Math.random(),
        relevanceScore: Math.random(),
        creativityLevel: Math.random()
      }

      // Generate correlated outcome based on features
      const performanceScore = (
        features.averageConfidence * 0.2 +
        features.communicationConsistency * 0.15 +
        features.technicalAccuracy * 0.2 +
        features.engagement * 0.15 +
        features.problemSolvingApproach * 0.15 +
        features.eyeContactQuality * 0.1 +
        features.relevanceScore * 0.05
      )

      const hired = performanceScore > 0.6 + (Math.random() - 0.5) * 0.2
      const performanceRating = Math.min(5, Math.max(1, Math.round(performanceScore * 5)))

      data.push({
        features,
        outcome: {
          hired,
          performanceRating,
          timeToProductivity: Math.round((1 - performanceScore) * 12 + 2), // 2-14 weeks
          retentionPeriod: Math.round(performanceScore * 24 + 6) // 6-30 months
        },
        metadata: {
          position: ['Software Engineer', 'Product Manager', 'Data Scientist'][Math.floor(Math.random() * 3)],
          industry: ['Technology', 'Finance', 'Healthcare'][Math.floor(Math.random() * 3)],
          experienceLevel: ['Junior', 'Mid', 'Senior'][Math.floor(Math.random() * 3)],
          interviewDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
        }
      })
    }

    return data
  }

  private calculateFeatureScaling(): void {
    const features = this.trainingData.map(d => Object.values(d.features))
    const featureCount = features[0].length
    
    const mean = new Array(featureCount).fill(0)
    const std = new Array(featureCount).fill(0)

    // Calculate mean
    features.forEach(feature => {
      feature.forEach((value, index) => {
        mean[index] += value
      })
    })
    mean.forEach((sum, index) => {
      mean[index] = sum / features.length
    })

    // Calculate standard deviation
    features.forEach(feature => {
      feature.forEach((value, index) => {
        std[index] += Math.pow(value - mean[index], 2)
      })
    })
    std.forEach((sum, index) => {
      std[index] = Math.sqrt(sum / features.length)
    })

    this.featureScaler = { mean, std }
  }

  private initializeBehavioralPatterns(): void {
    const patterns: BehavioralPattern[] = [
      {
        id: 'high_performer',
        name: 'High Performer',
        description: 'Consistently demonstrates excellence across multiple dimensions',
        indicators: ['high_confidence', 'clear_communication', 'strong_technical_skills'],
        frequency: 0,
        confidence: 0,
        trend: 'stable',
        impact: 'positive'
      },
      {
        id: 'growth_potential',
        name: 'Growth Potential',
        description: 'Shows strong learning ability and improvement trajectory',
        indicators: ['improving_performance', 'adaptability', 'curiosity'],
        frequency: 0,
        confidence: 0,
        trend: 'increasing',
        impact: 'positive'
      },
      {
        id: 'communication_leader',
        name: 'Communication Leader',
        description: 'Exceptional communication and interpersonal skills',
        indicators: ['clear_articulation', 'active_listening', 'empathy'],
        frequency: 0,
        confidence: 0,
        trend: 'stable',
        impact: 'positive'
      },
      {
        id: 'technical_expert',
        name: 'Technical Expert',
        description: 'Deep technical knowledge and problem-solving abilities',
        indicators: ['technical_accuracy', 'innovative_solutions', 'systematic_thinking'],
        frequency: 0,
        confidence: 0,
        trend: 'stable',
        impact: 'positive'
      },
      {
        id: 'stress_sensitive',
        name: 'Stress Sensitive',
        description: 'Performance may decline under pressure',
        indicators: ['nervousness', 'inconsistent_performance', 'stress_indicators'],
        frequency: 0,
        confidence: 0,
        trend: 'stable',
        impact: 'negative'
      },
      {
        id: 'detail_oriented',
        name: 'Detail Oriented',
        description: 'Strong attention to detail and thoroughness',
        indicators: ['comprehensive_answers', 'accuracy', 'methodical_approach'],
        frequency: 0,
        confidence: 0,
        trend: 'stable',
        impact: 'positive'
      },
      {
        id: 'creative_thinker',
        name: 'Creative Thinker',
        description: 'Demonstrates innovation and creative problem-solving',
        indicators: ['unique_solutions', 'creative_examples', 'out_of_box_thinking'],
        frequency: 0,
        confidence: 0,
        trend: 'stable',
        impact: 'positive'
      },
      {
        id: 'team_player',
        name: 'Team Player',
        description: 'Strong collaboration and teamwork orientation',
        indicators: ['collaboration_examples', 'team_focus', 'interpersonal_skills'],
        frequency: 0,
        confidence: 0,
        trend: 'stable',
        impact: 'positive'
      }
    ]

    patterns.forEach(pattern => {
      this.behavioralPatterns.set(pattern.id, pattern)
    })
  }

  async predictPerformance(
    currentMetrics: UnifiedMetrics,
    responseAnalysis: TextAnalysisResult[],
    candidateProfile: CandidateProfile,
    interviewHistory: any[]
  ): Promise<PerformancePrediction> {
    if (!this.isInitialized || !this.performanceModel) {
      throw new Error('ML Performance Prediction Service not initialized')
    }

    // Extract features from current data
    const features = this.extractFeatures(currentMetrics, responseAnalysis, candidateProfile, interviewHistory)
    
    // Scale features
    const scaledFeatures = this.scaleFeatures(features)
    
    // Make prediction
    const prediction = await this.makePrediction(scaledFeatures)
    
    // Analyze behavioral patterns
    const patterns = await this.analyzeBehavioralPatterns(features)
    
    // Generate comprehensive prediction
    return this.generatePerformancePrediction(prediction, patterns, features)
  }

  private extractFeatures(
    metrics: UnifiedMetrics,
    responseAnalysis: TextAnalysisResult[],
    profile: CandidateProfile,
    history: any[]
  ): PerformanceFeatures {
    // Calculate average metrics from response analysis
    const avgSentiment = responseAnalysis.length > 0 
      ? responseAnalysis.reduce((sum, r) => sum + r.sentiment.overall, 0) / responseAnalysis.length 
      : 0.5

    const avgCommunication = responseAnalysis.length > 0
      ? responseAnalysis.reduce((sum, r) => sum + (
          r.communication.clarity + r.communication.coherence + r.communication.completeness
        ) / 3, 0) / responseAnalysis.length
      : 0.5

    const avgContent = responseAnalysis.length > 0
      ? responseAnalysis.reduce((sum, r) => sum + (
          r.content.topicRelevance + r.content.exampleQuality + r.content.technicalAccuracy
        ) / 3, 0) / responseAnalysis.length
      : 0.5

    // Calculate improvement rate
    const improvementRate = history.length > 2
      ? this.calculateImprovementRate(history)
      : 0.5

    return {
      averageConfidence: profile.confidenceLevel,
      communicationConsistency: avgCommunication,
      stressResponse: 1 - (profile.emotionalState === 'stressed' ? 0.2 : 
                           profile.emotionalState === 'nervous' ? 0.4 : 0.8),
      adaptability: improvementRate,
      engagement: metrics.overall.engagementLevel,
      technicalAccuracy: avgContent,
      problemSolvingApproach: metrics.overall.communicationEffectiveness,
      innovationLevel: responseAnalysis.length > 0 
        ? responseAnalysis.reduce((sum, r) => sum + r.content.creativityLevel, 0) / responseAnalysis.length 
        : 0.5,
      responseTime: history.length > 0 
        ? history.reduce((sum: number, h: any) => sum + (h.responseTime || 120000), 0) / history.length / 1000
        : 120,
      improvementRate,
      consistencyScore: metrics.temporal?.consistencyScore || 0.5,
      eyeContactQuality: metrics.facial.eyeContactQuality,
      postureStability: metrics.bodyLanguage.movementStability,
      gestureEffectiveness: metrics.bodyLanguage.gestureEffectiveness,
      voiceClarity: metrics.voice.clarity,
      responseDepth: avgContent,
      exampleQuality: responseAnalysis.length > 0
        ? responseAnalysis.reduce((sum, r) => sum + r.content.exampleQuality, 0) / responseAnalysis.length
        : 0.5,
      relevanceScore: responseAnalysis.length > 0
        ? responseAnalysis.reduce((sum, r) => sum + r.keywords.relevanceScore, 0) / responseAnalysis.length
        : 0.5,
      creativityLevel: responseAnalysis.length > 0
        ? responseAnalysis.reduce((sum, r) => sum + r.content.creativityLevel, 0) / responseAnalysis.length
        : 0.5
    }
  }

  private calculateImprovementRate(history: any[]): number {
    if (history.length < 2) return 0.5

    const scores = history.map(h => h.metrics?.overall?.performanceScore || 0.5)
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
    const secondHalf = scores.slice(Math.floor(scores.length / 2))

    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length

    // Normalize improvement rate to 0-1 scale
    return Math.max(0, Math.min(1, (secondAvg - firstAvg + 0.5)))
  }

  private scaleFeatures(features: PerformanceFeatures): number[] {
    const featureArray = Object.values(features)
    
    if (!this.featureScaler) {
      return featureArray // Return unscaled if no scaler available
    }

    return featureArray.map((value, index) => {
      const mean = this.featureScaler!.mean[index] || 0
      const std = this.featureScaler!.std[index] || 1
      return (value - mean) / std
    })
  }

  private async makePrediction(scaledFeatures: number[]): Promise<ModelPrediction> {
    if (!this.performanceModel) {
      throw new Error('Performance model not available')
    }

    const inputTensor = tf.tensor2d([scaledFeatures])
    const prediction = this.performanceModel.predict(inputTensor) as tf.Tensor
    const predictionValue = await prediction.data()
    
    // Calculate feature importance (simplified)
    const featureImportance = this.calculateFeatureImportance(scaledFeatures)
    
    // Generate explanation
    const explanation = this.generatePredictionExplanation(predictionValue[0], featureImportance)

    // Cleanup tensors
    inputTensor.dispose()
    prediction.dispose()

    return {
      prediction: predictionValue[0],
      confidence: Math.min(0.95, Math.max(0.6, predictionValue[0])), // Simplified confidence
      featureImportance,
      explanation
    }
  }

  private calculateFeatureImportance(features: number[]): Record<string, number> {
    // Simplified feature importance calculation
    // In production, this would use SHAP values or similar techniques
    const featureNames = [
      'averageConfidence', 'communicationConsistency', 'stressResponse', 'adaptability',
      'engagement', 'technicalAccuracy', 'problemSolvingApproach', 'innovationLevel',
      'responseTime', 'improvementRate', 'consistencyScore', 'eyeContactQuality',
      'postureStability', 'gestureEffectiveness', 'voiceClarity', 'responseDepth',
      'exampleQuality', 'relevanceScore', 'creativityLevel'
    ]

    const importance: Record<string, number> = {}
    
    features.forEach((value, index) => {
      if (index < featureNames.length) {
        // Simple importance based on absolute value and predefined weights
        const weights = [0.2, 0.15, 0.1, 0.12, 0.15, 0.2, 0.15, 0.08, 0.05, 0.1, 0.08, 0.1, 0.05, 0.05, 0.1, 0.12, 0.08, 0.1, 0.08]
        importance[featureNames[index]] = Math.abs(value) * (weights[index] || 0.05)
      }
    })

    return importance
  }

  private generatePredictionExplanation(prediction: number, importance: Record<string, number>): string[] {
    const explanations: string[] = []
    
    // Overall prediction explanation
    if (prediction > 0.8) {
      explanations.push('Strong likelihood of interview success based on comprehensive analysis')
    } else if (prediction > 0.6) {
      explanations.push('Good potential for success with some areas for improvement')
    } else if (prediction > 0.4) {
      explanations.push('Mixed indicators - success depends on addressing key weaknesses')
    } else {
      explanations.push('Significant challenges identified that may impact success')
    }

    // Top contributing factors
    const sortedImportance = Object.entries(importance)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)

    sortedImportance.forEach(([feature, value]) => {
      const featureName = feature.replace(/([A-Z])/g, ' $1').toLowerCase()
      explanations.push(`${featureName} is a key contributing factor (importance: ${(value * 100).toFixed(1)}%)`)
    })

    return explanations
  }

  private async analyzeBehavioralPatterns(features: PerformanceFeatures): Promise<BehavioralPattern[]> {
    const detectedPatterns: BehavioralPattern[] = []

    // High Performer Pattern
    if (features.averageConfidence > 0.8 && features.technicalAccuracy > 0.8 && features.communicationConsistency > 0.8) {
      const pattern = { ...this.behavioralPatterns.get('high_performer')! }
      pattern.confidence = (features.averageConfidence + features.technicalAccuracy + features.communicationConsistency) / 3
      detectedPatterns.push(pattern)
    }

    // Growth Potential Pattern
    if (features.improvementRate > 0.7 && features.adaptability > 0.7) {
      const pattern = { ...this.behavioralPatterns.get('growth_potential')! }
      pattern.confidence = (features.improvementRate + features.adaptability) / 2
      detectedPatterns.push(pattern)
    }

    // Communication Leader Pattern
    if (features.communicationConsistency > 0.8 && features.voiceClarity > 0.8 && features.eyeContactQuality > 0.8) {
      const pattern = { ...this.behavioralPatterns.get('communication_leader')! }
      pattern.confidence = (features.communicationConsistency + features.voiceClarity + features.eyeContactQuality) / 3
      detectedPatterns.push(pattern)
    }

    // Technical Expert Pattern
    if (features.technicalAccuracy > 0.8 && features.problemSolvingApproach > 0.8 && features.innovationLevel > 0.7) {
      const pattern = { ...this.behavioralPatterns.get('technical_expert')! }
      pattern.confidence = (features.technicalAccuracy + features.problemSolvingApproach + features.innovationLevel) / 3
      detectedPatterns.push(pattern)
    }

    // Stress Sensitive Pattern
    if (features.stressResponse < 0.4 && features.consistencyScore < 0.5) {
      const pattern = { ...this.behavioralPatterns.get('stress_sensitive')! }
      pattern.confidence = 1 - (features.stressResponse + features.consistencyScore) / 2
      detectedPatterns.push(pattern)
    }

    // Detail Oriented Pattern
    if (features.responseDepth > 0.8 && features.exampleQuality > 0.8) {
      const pattern = { ...this.behavioralPatterns.get('detail_oriented')! }
      pattern.confidence = (features.responseDepth + features.exampleQuality) / 2
      detectedPatterns.push(pattern)
    }

    // Creative Thinker Pattern
    if (features.creativityLevel > 0.7 && features.innovationLevel > 0.7) {
      const pattern = { ...this.behavioralPatterns.get('creative_thinker')! }
      pattern.confidence = (features.creativityLevel + features.innovationLevel) / 2
      detectedPatterns.push(pattern)
    }

    return detectedPatterns.filter(p => p.confidence > 0.6) // Only return high-confidence patterns
  }

  private generatePerformancePrediction(
    prediction: ModelPrediction,
    patterns: BehavioralPattern[],
    features: PerformanceFeatures
  ): PerformancePrediction {
    // Calculate category predictions
    const categoryPredictions = {
      technical: Math.min(1, (features.technicalAccuracy + features.problemSolvingApproach + features.innovationLevel) / 3),
      communication: Math.min(1, (features.communicationConsistency + features.voiceClarity + features.eyeContactQuality) / 3),
      leadership: Math.min(1, (features.averageConfidence + features.adaptability + features.engagement) / 3),
      problemSolving: Math.min(1, (features.problemSolvingApproach + features.innovationLevel + features.creativityLevel) / 3),
      culturalFit: Math.min(1, (features.engagement + features.adaptability + features.stressResponse) / 3)
    }

    // Calculate confidence interval
    const margin = 0.1 * (1 - prediction.confidence)
    const confidenceInterval = {
      lower: Math.max(0, prediction.prediction - margin),
      upper: Math.min(1, prediction.prediction + margin)
    }

    // Identify risk factors
    const riskFactors: string[] = []
    if (features.stressResponse < 0.4) riskFactors.push('High stress sensitivity may impact performance under pressure')
    if (features.communicationConsistency < 0.5) riskFactors.push('Inconsistent communication may affect team collaboration')
    if (features.consistencyScore < 0.5) riskFactors.push('Performance variability may indicate reliability concerns')
    if (features.adaptability < 0.4) riskFactors.push('Limited adaptability may challenge growth in dynamic environments')

    // Identify strength indicators
    const strengthIndicators: string[] = []
    if (features.technicalAccuracy > 0.8) strengthIndicators.push('Strong technical competency demonstrated')
    if (features.communicationConsistency > 0.8) strengthIndicators.push('Excellent communication skills evident')
    if (features.improvementRate > 0.7) strengthIndicators.push('Strong learning and improvement trajectory')
    if (features.creativityLevel > 0.7) strengthIndicators.push('High creativity and innovation potential')

    // Calculate improvement potential
    const improvementPotential = Math.min(1, features.improvementRate + (1 - prediction.prediction) * 0.3)
    
    // Estimate time to improvement (in weeks)
    const timeToImprovement = Math.max(2, Math.round((1 - features.improvementRate) * 12 + 2))

    return {
      overallSuccessProbability: prediction.prediction,
      categoryPredictions,
      confidenceInterval,
      riskFactors,
      strengthIndicators,
      improvementPotential,
      timeToImprovement
    }
  }

  // Public API methods
  async trainModel(newTrainingData: TrainingData[]): Promise<void> {
    if (!this.performanceModel) {
      throw new Error('Performance model not available')
    }

    // Add new training data
    this.trainingData.push(...newTrainingData)
    
    // Recalculate feature scaling
    this.calculateFeatureScaling()
    
    // Prepare training data
    const features = this.trainingData.map(d => this.scaleFeatures(d.features))
    const labels = this.trainingData.map(d => d.outcome.hired ? 1 : 0)

    const xs = tf.tensor2d(features)
    const ys = tf.tensor2d(labels, [labels.length, 1])

    // Train the model
    await this.performanceModel.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    })

    // Cleanup tensors
    xs.dispose()
    ys.dispose()

    console.log('Model retrained with new data')
  }

  getBehavioralPatterns(): BehavioralPattern[] {
    return Array.from(this.behavioralPatterns.values())
  }

  getModelMetrics(): any {
    return {
      trainingDataSize: this.trainingData.length,
      isInitialized: this.isInitialized,
      hasPerformanceModel: !!this.performanceModel,
      hasBehaviorModel: !!this.behaviorModel,
      featureCount: this.featureScaler?.mean.length || 0
    }
  }

  async saveModels(): Promise<void> {
    if (this.performanceModel && this.behaviorModel) {
      await this.performanceModel.save('localstorage://performance-model')
      await this.behaviorModel.save('localstorage://behavior-model')
      console.log('Models saved to local storage')
    }
  }

  destroy(): void {
    if (this.performanceModel) {
      this.performanceModel.dispose()
      this.performanceModel = null
    }
    if (this.behaviorModel) {
      this.behaviorModel.dispose()
      this.behaviorModel = null
    }
    this.trainingData = []
    this.isInitialized = false
  }
}

export { 
  MLPerformancePredictionService,
  type PerformancePrediction,
  type BehavioralPattern,
  type PerformanceFeatures,
  type TrainingData,
  type ModelPrediction
}
