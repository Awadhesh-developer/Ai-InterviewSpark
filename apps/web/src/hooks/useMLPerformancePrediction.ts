/**
 * React Hook for ML Performance Prediction
 * Provides machine learning-based performance prediction and behavioral pattern analysis
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  MLPerformancePredictionService,
  type PerformancePrediction,
  type BehavioralPattern,
  type PerformanceFeatures,
  type TrainingData
} from '@/services/mlPerformancePredictionService'
import { type UnifiedMetrics } from '@/services/unifiedAnalyticsService'
import { type TextAnalysisResult } from '@/services/nlpAnalysisService'
import { type CandidateProfile } from '@/services/adaptiveQuestionService'

interface UseMLPerformancePredictionOptions {
  autoInitialize?: boolean
  enableRealTimePrediction?: boolean
  predictionInterval?: number
  confidenceThreshold?: number
}

interface MLPerformancePredictionHookState {
  isInitialized: boolean
  isInitializing: boolean
  isPredicting: boolean
  currentPrediction: PerformancePrediction | null
  behavioralPatterns: BehavioralPattern[]
  predictionHistory: Array<{
    timestamp: number
    prediction: PerformancePrediction
    confidence: number
  }>
  modelMetrics: any
  error: string | null
}

interface MLPerformancePredictionActions {
  initialize: () => Promise<void>
  predictPerformance: (
    metrics: UnifiedMetrics,
    responseAnalysis: TextAnalysisResult[],
    candidateProfile: CandidateProfile,
    interviewHistory: any[]
  ) => Promise<PerformancePrediction>
  getBehavioralPatterns: () => BehavioralPattern[]
  getModelMetrics: () => any
  trainModel: (trainingData: TrainingData[]) => Promise<void>
  saveModels: () => Promise<void>
  destroy: () => void
}

export function useMLPerformancePrediction(options: UseMLPerformancePredictionOptions = {}): [MLPerformancePredictionHookState, MLPerformancePredictionActions] {
  const {
    autoInitialize = false,
    enableRealTimePrediction = true,
    predictionInterval = 10000, // 10 seconds
    confidenceThreshold = 0.7
  } = options

  const serviceRef = useRef<MLPerformancePredictionService | null>(null)
  const predictionIntervalRef = useRef<number | null>(null)
  
  const [state, setState] = useState<MLPerformancePredictionHookState>({
    isInitialized: false,
    isInitializing: false,
    isPredicting: false,
    currentPrediction: null,
    behavioralPatterns: [],
    predictionHistory: [],
    modelMetrics: null,
    error: null
  })

  // Initialize ML service
  const initialize = useCallback(async () => {
    if (serviceRef.current || state.isInitializing) return

    setState(prev => ({ ...prev, isInitializing: true, error: null }))

    try {
      serviceRef.current = new MLPerformancePredictionService()
      await serviceRef.current.initialize()
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isInitializing: false,
        behavioralPatterns: serviceRef.current!.getBehavioralPatterns(),
        modelMetrics: serviceRef.current!.getModelMetrics()
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ML initialization failed'
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: errorMessage
      }))
      throw error
    }
  }, [state.isInitializing])

  // Predict performance
  const predictPerformance = useCallback(async (
    metrics: UnifiedMetrics,
    responseAnalysis: TextAnalysisResult[],
    candidateProfile: CandidateProfile,
    interviewHistory: any[]
  ): Promise<PerformancePrediction> => {
    if (!serviceRef.current) {
      throw new Error('ML Performance Prediction service not initialized')
    }

    setState(prev => ({ ...prev, isPredicting: true, error: null }))

    try {
      const prediction = await serviceRef.current.predictPerformance(
        metrics,
        responseAnalysis,
        candidateProfile,
        interviewHistory
      )

      // Update state with new prediction
      setState(prev => ({
        ...prev,
        currentPrediction: prediction,
        predictionHistory: [
          ...prev.predictionHistory,
          {
            timestamp: Date.now(),
            prediction,
            confidence: prediction.confidenceInterval.upper - prediction.confidenceInterval.lower
          }
        ].slice(-50), // Keep only recent predictions
        isPredicting: false
      }))

      return prediction

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Prediction failed'
      setState(prev => ({
        ...prev,
        isPredicting: false,
        error: errorMessage
      }))
      throw error
    }
  }, [])

  // Get behavioral patterns
  const getBehavioralPatterns = useCallback((): BehavioralPattern[] => {
    return serviceRef.current?.getBehavioralPatterns() || []
  }, [])

  // Get model metrics
  const getModelMetrics = useCallback(() => {
    return serviceRef.current?.getModelMetrics() || null
  }, [])

  // Train model with new data
  const trainModel = useCallback(async (trainingData: TrainingData[]) => {
    if (!serviceRef.current) {
      throw new Error('ML Performance Prediction service not initialized')
    }

    try {
      await serviceRef.current.trainModel(trainingData)
      
      setState(prev => ({
        ...prev,
        modelMetrics: serviceRef.current!.getModelMetrics()
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Model training failed'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Save models
  const saveModels = useCallback(async () => {
    if (!serviceRef.current) {
      throw new Error('ML Performance Prediction service not initialized')
    }

    try {
      await serviceRef.current.saveModels()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Model saving failed'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Destroy service
  const destroy = useCallback(() => {
    if (predictionIntervalRef.current) {
      clearInterval(predictionIntervalRef.current)
      predictionIntervalRef.current = null
    }

    if (serviceRef.current) {
      serviceRef.current.destroy()
      serviceRef.current = null
    }
    
    setState({
      isInitialized: false,
      isInitializing: false,
      isPredicting: false,
      currentPrediction: null,
      behavioralPatterns: [],
      predictionHistory: [],
      modelMetrics: null,
      error: null
    })
  }, [])

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize && !state.isInitialized && !state.isInitializing) {
      initialize().catch(console.error)
    }
  }, [autoInitialize, initialize, state.isInitialized, state.isInitializing])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroy()
    }
  }, [destroy])

  const actions: MLPerformancePredictionActions = {
    initialize,
    predictPerformance,
    getBehavioralPatterns,
    getModelMetrics,
    trainModel,
    saveModels,
    destroy
  }

  return [state, actions]
}

// Specialized hook for interview performance prediction
export function useInterviewPerformancePrediction() {
  const [state, actions] = useMLPerformancePrediction({
    autoInitialize: true,
    enableRealTimePrediction: true,
    predictionInterval: 10000,
    confidenceThreshold: 0.7
  })

  return {
    ...state,
    ...actions,
    
    // Convenience getters
    successProbability: state.currentPrediction?.overallSuccessProbability || 0,
    technicalScore: state.currentPrediction?.categoryPredictions.technical || 0,
    communicationScore: state.currentPrediction?.categoryPredictions.communication || 0,
    leadershipScore: state.currentPrediction?.categoryPredictions.leadership || 0,
    problemSolvingScore: state.currentPrediction?.categoryPredictions.problemSolving || 0,
    culturalFitScore: state.currentPrediction?.categoryPredictions.culturalFit || 0,
    
    // Risk and strength analysis
    riskFactors: state.currentPrediction?.riskFactors || [],
    strengthIndicators: state.currentPrediction?.strengthIndicators || [],
    improvementPotential: state.currentPrediction?.improvementPotential || 0,
    timeToImprovement: state.currentPrediction?.timeToImprovement || 0,
    
    // Confidence metrics
    predictionConfidence: state.currentPrediction ? 
      (state.currentPrediction.confidenceInterval.upper - state.currentPrediction.confidenceInterval.lower) : 0,
    confidenceLower: state.currentPrediction?.confidenceInterval.lower || 0,
    confidenceUpper: state.currentPrediction?.confidenceInterval.upper || 0,
    
    // Behavioral insights
    detectedPatterns: state.behavioralPatterns.filter(p => p.confidence > 0.6),
    positivePatterns: state.behavioralPatterns.filter(p => p.impact === 'positive' && p.confidence > 0.6),
    riskPatterns: state.behavioralPatterns.filter(p => p.impact === 'negative' && p.confidence > 0.6),
    
    // Prediction trends
    predictionTrend: state.predictionHistory.length > 1 ? 
      (state.predictionHistory[state.predictionHistory.length - 1].prediction.overallSuccessProbability - 
       state.predictionHistory[0].prediction.overallSuccessProbability) : 0,
    
    // Model performance
    modelAccuracy: state.modelMetrics?.accuracy || 0,
    trainingDataSize: state.modelMetrics?.trainingDataSize || 0,
    
    // Prediction quality indicators
    isPredictionReliable: state.currentPrediction ? 
      (state.currentPrediction.confidenceInterval.upper - state.currentPrediction.confidenceInterval.lower) < 0.3 : false,
    
    // Helper methods
    getTopStrengths: (count: number = 3) => 
      state.currentPrediction?.strengthIndicators.slice(0, count) || [],
    
    getTopRisks: (count: number = 3) => 
      state.currentPrediction?.riskFactors.slice(0, count) || [],
    
    getCategoryScores: () => state.currentPrediction?.categoryPredictions || {
      technical: 0,
      communication: 0,
      leadership: 0,
      problemSolving: 0,
      culturalFit: 0
    },
    
    getPredictionSummary: () => {
      if (!state.currentPrediction) return null
      
      const probability = state.currentPrediction.overallSuccessProbability
      let summary = ''
      
      if (probability > 0.8) {
        summary = 'Excellent candidate with high success probability'
      } else if (probability > 0.6) {
        summary = 'Strong candidate with good potential'
      } else if (probability > 0.4) {
        summary = 'Moderate potential with areas for development'
      } else {
        summary = 'Significant challenges identified'
      }
      
      return {
        summary,
        probability,
        confidence: state.currentPrediction.confidenceInterval.upper - state.currentPrediction.confidenceInterval.lower,
        topStrength: state.currentPrediction.strengthIndicators[0] || 'No specific strengths identified',
        topRisk: state.currentPrediction.riskFactors[0] || 'No significant risks identified'
      }
    }
  }
}

// Hook for behavioral pattern analysis
export function useBehavioralPatternAnalysis() {
  const [state, actions] = useMLPerformancePrediction({
    autoInitialize: true
  })

  return {
    patterns: state.behavioralPatterns,
    isAnalyzing: state.isPredicting,
    error: state.error,
    
    // Pattern categorization
    leadershipPatterns: state.behavioralPatterns.filter(p => 
      p.indicators.some(i => i.includes('leadership') || i.includes('influence'))),
    
    communicationPatterns: state.behavioralPatterns.filter(p => 
      p.indicators.some(i => i.includes('communication') || i.includes('articulation'))),
    
    technicalPatterns: state.behavioralPatterns.filter(p => 
      p.indicators.some(i => i.includes('technical') || i.includes('problem'))),
    
    stressPatterns: state.behavioralPatterns.filter(p => 
      p.indicators.some(i => i.includes('stress') || i.includes('pressure'))),
    
    // Pattern insights
    dominantPattern: state.behavioralPatterns.reduce((prev, current) => 
      (prev.confidence > current.confidence) ? prev : current, 
      { confidence: 0 } as BehavioralPattern),
    
    patternCount: state.behavioralPatterns.length,
    averageConfidence: state.behavioralPatterns.length > 0 ? 
      state.behavioralPatterns.reduce((sum, p) => sum + p.confidence, 0) / state.behavioralPatterns.length : 0,
    
    // Actions
    analyzePatterns: actions.predictPerformance,
    getPatterns: actions.getBehavioralPatterns
  }
}

// Export types for convenience
export type {
  PerformancePrediction,
  BehavioralPattern,
  PerformanceFeatures,
  TrainingData
}
