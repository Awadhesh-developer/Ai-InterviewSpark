/**
 * Unified Analytics Service
 * Combines and optimizes all analysis systems for comprehensive interview assessment
 */

import { type FacialAnalysisResult } from './facialAnalysisService'
import { type GazePoint, type AttentionMetrics } from './gazeTrackingService'
import { type BodyLanguageResult } from './bodyLanguageAnalysisService'

interface VoiceMetrics {
  clarity: number
  pace: number
  volume: number
  confidence: number
  engagement: number
}

interface UnifiedMetrics {
  overall: {
    performanceScore: number
    engagementLevel: number
    professionalPresence: number
    communicationEffectiveness: number
    confidenceLevel: number
  }
  voice: VoiceMetrics
  facial: {
    emotionalRange: number
    expressiveness: number
    eyeContactQuality: number
    facialEngagement: number
  }
  gaze: {
    attentionFocus: number
    gazeStability: number
    screenEngagement: number
    distractionLevel: number
  }
  bodyLanguage: {
    postureQuality: number
    gestureEffectiveness: number
    movementStability: number
    professionalDemeanor: number
  }
  temporal: {
    consistencyScore: number
    improvementTrend: number
    peakPerformanceMoments: Array<{ timestamp: number; score: number }>
    challengingMoments: Array<{ timestamp: number; issue: string }>
  }
}

interface PerformanceInsights {
  strengths: string[]
  areasForImprovement: string[]
  recommendations: string[]
  overallAssessment: string
  scoreBreakdown: {
    category: string
    score: number
    weight: number
    contribution: number
  }[]
}

interface OptimizationConfig {
  analysisFrequency: number
  memoryOptimization: boolean
  realTimeProcessing: boolean
  adaptiveThresholds: boolean
  performanceMonitoring: boolean
}

class UnifiedAnalyticsService {
  private config: OptimizationConfig = {
    analysisFrequency: 500,
    memoryOptimization: true,
    realTimeProcessing: true,
    adaptiveThresholds: true,
    performanceMonitoring: true
  }

  private analysisHistory: Array<{
    timestamp: number
    facial?: {
      engagement: number
      eyeContact: boolean
    }
    gaze?: {
      focus: number
      stability: number
    }
    bodyLanguage?: {
      posture: string
      confidence: number
    }
    voice?: {
      confidence: number
      clarity: number
    }
    unified: UnifiedMetrics
  }> = []

  private performanceMetrics = {
    processingTimes: [] as number[],
    memoryUsage: [] as number[],
    analysisAccuracy: [] as number[],
    systemLoad: [] as number[]
  }

  private eventHandlers: Map<string, Function[]> = new Map()

  constructor(config?: Partial<OptimizationConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    this.initializeOptimizations()
  }

  private initializeOptimizations(): void {
    if (this.config.performanceMonitoring) {
      this.startPerformanceMonitoring()
    }
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.collectPerformanceMetrics()
    }, 1000)
  }

  private collectPerformanceMetrics(): void {
    const startTime = performance.now()
    
    // Memory usage estimation
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      this.performanceMetrics.memoryUsage.push(memInfo.usedJSHeapSize / 1024 / 1024) // MB
    }

    // Keep only recent metrics
    const maxMetrics = 300 // 5 minutes at 1Hz
    Object.keys(this.performanceMetrics).forEach(key => {
      const metrics = this.performanceMetrics[key as keyof typeof this.performanceMetrics]
      if (metrics.length > maxMetrics) {
        metrics.splice(0, metrics.length - maxMetrics)
      }
    })

    const processingTime = performance.now() - startTime
    this.performanceMetrics.processingTimes.push(processingTime)
  }

  async processAnalysisData(data: {
    facial?: FacialAnalysisResult
    gaze?: GazePoint & { metrics: AttentionMetrics }
    bodyLanguage?: BodyLanguageResult
    voice?: VoiceMetrics
  }): Promise<UnifiedMetrics> {
    const startTime = performance.now()

    try {
      const unifiedMetrics = this.calculateUnifiedMetrics(data)
      
      // Store analysis with optimization
      if (this.config.memoryOptimization) {
        this.optimizedStorage(data, unifiedMetrics)
      } else {
        // Use the same compressed format for consistency
        this.optimizedStorage(data, unifiedMetrics)
      }

      // Emit real-time updates
      if (this.config.realTimeProcessing) {
        this.emit('metrics.updated', unifiedMetrics)
      }

      // Performance tracking
      const processingTime = performance.now() - startTime
      this.performanceMetrics.processingTimes.push(processingTime)

      return unifiedMetrics

    } catch (error) {
      console.error('Error processing analysis data:', error)
      this.emit('analysis.error', { error, timestamp: Date.now() })
      throw error
    }
  }

  private calculateUnifiedMetrics(data: {
    facial?: FacialAnalysisResult
    gaze?: GazePoint & { metrics: AttentionMetrics }
    bodyLanguage?: BodyLanguageResult
    voice?: VoiceMetrics
  }): UnifiedMetrics {
    // Calculate individual component scores
    const voiceScore = this.calculateVoiceScore(data.voice)
    const facialScore = this.calculateFacialScore(data.facial)
    const gazeScore = this.calculateGazeScore(data.gaze)
    const bodyLanguageScore = this.calculateBodyLanguageScore(data.bodyLanguage)

    // Calculate overall metrics with weighted scoring
    const weights = {
      voice: 0.25,
      facial: 0.25,
      gaze: 0.25,
      bodyLanguage: 0.25
    }

    const performanceScore = (
      voiceScore.overall * weights.voice +
      facialScore.overall * weights.facial +
      gazeScore.overall * weights.gaze +
      bodyLanguageScore.overall * weights.bodyLanguage
    )

    const engagementLevel = (
      voiceScore.engagement * weights.voice +
      facialScore.engagement * weights.facial +
      gazeScore.engagement * weights.gaze +
      bodyLanguageScore.engagement * weights.bodyLanguage
    )

    const professionalPresence = (
      voiceScore.professionalism * weights.voice +
      facialScore.professionalism * weights.facial +
      gazeScore.professionalism * weights.gaze +
      bodyLanguageScore.professionalism * weights.bodyLanguage
    )

    const communicationEffectiveness = (
      voiceScore.clarity * weights.voice +
      facialScore.expressiveness * weights.facial +
      gazeScore.attention * weights.gaze +
      bodyLanguageScore.gestures * weights.bodyLanguage
    )

    const confidenceLevel = (
      voiceScore.confidence * weights.voice +
      facialScore.confidence * weights.facial +
      gazeScore.stability * weights.gaze +
      bodyLanguageScore.confidence * weights.bodyLanguage
    )

    // Calculate temporal metrics
    const temporal = this.calculateTemporalMetrics()

    return {
      overall: {
        performanceScore,
        engagementLevel,
        professionalPresence,
        communicationEffectiveness,
        confidenceLevel
      },
      voice: data.voice || {
        clarity: 0,
        pace: 0,
        volume: 0,
        confidence: 0,
        engagement: 0
      },
      facial: {
        emotionalRange: facialScore.emotionalRange,
        expressiveness: facialScore.expressiveness,
        eyeContactQuality: facialScore.eyeContact,
        facialEngagement: facialScore.engagement
      },
      gaze: {
        attentionFocus: gazeScore.attention,
        gazeStability: gazeScore.stability,
        screenEngagement: gazeScore.engagement,
        distractionLevel: gazeScore.distraction
      },
      bodyLanguage: {
        postureQuality: bodyLanguageScore.posture,
        gestureEffectiveness: bodyLanguageScore.gestures,
        movementStability: bodyLanguageScore.stability,
        professionalDemeanor: bodyLanguageScore.professionalism
      },
      temporal
    }
  }

  private calculateVoiceScore(voice?: VoiceMetrics) {
    if (!voice) {
      return {
        overall: 0,
        engagement: 0,
        professionalism: 0,
        clarity: 0,
        confidence: 0
      }
    }

    return {
      overall: (voice.clarity + voice.confidence + voice.engagement) / 3,
      engagement: voice.engagement,
      professionalism: (voice.clarity + voice.pace) / 2,
      clarity: voice.clarity,
      confidence: voice.confidence
    }
  }

  private calculateFacialScore(facial?: FacialAnalysisResult) {
    if (!facial || !facial.faceDetected) {
      return {
        overall: 0,
        engagement: 0,
        professionalism: 0,
        expressiveness: 0,
        eyeContact: 0,
        confidence: 0,
        emotionalRange: 0
      }
    }

    const emotionalRange = 1 - facial.emotions.neutral
    const expressiveness = facial.engagement.expressiveness
    const eyeContact = facial.eyeContact.isLookingAtCamera ? 1 : 0
    const engagement = facial.engagement.overallEngagement
    const professionalism = facial.engagement.professionalPresence
    const confidence = facial.engagement.attentiveness

    return {
      overall: (engagement + professionalism + eyeContact) / 3,
      engagement,
      professionalism,
      expressiveness,
      eyeContact,
      confidence,
      emotionalRange
    }
  }

  private calculateGazeScore(gaze?: GazePoint & { metrics: AttentionMetrics }) {
    if (!gaze) {
      return {
        overall: 0,
        engagement: 0,
        professionalism: 0,
        attention: 0,
        stability: 0,
        distraction: 0
      }
    }

    const attention = gaze.metrics.focusScore
    const stability = gaze.metrics.gazeStability
    const engagement = gaze.metrics.screenCoverage
    const distraction = 1 - (gaze.metrics.distractionEvents / 10) // Normalize
    const professionalism = (attention + stability) / 2

    return {
      overall: (attention + stability + engagement) / 3,
      engagement,
      professionalism,
      attention,
      stability,
      distraction: Math.max(0, distraction)
    }
  }

  private calculateBodyLanguageScore(bodyLanguage?: BodyLanguageResult) {
    if (!bodyLanguage || !bodyLanguage.poseDetected) {
      return {
        overall: 0,
        engagement: 0,
        professionalism: 0,
        posture: 0,
        gestures: 0,
        stability: 0,
        confidence: 0
      }
    }

    const posture = bodyLanguage.posture.overallPosture
    const gestures = bodyLanguage.gestures.gestureIntensity
    const stability = bodyLanguage.movement.stability
    const confidence = bodyLanguage.professionalPresence.confidence
    const engagement = bodyLanguage.professionalPresence.engagement
    const professionalism = bodyLanguage.professionalPresence.authority

    return {
      overall: (posture + confidence + engagement) / 3,
      engagement,
      professionalism,
      posture,
      gestures,
      stability,
      confidence
    }
  }

  private calculateTemporalMetrics() {
    if (this.analysisHistory.length < 10) {
      return {
        consistencyScore: 0.5,
        improvementTrend: 0,
        peakPerformanceMoments: [],
        challengingMoments: []
      }
    }

    const recentHistory = this.analysisHistory.slice(-60) // Last 30 seconds
    const scores = recentHistory.map(h => h.unified.overall.performanceScore)

    // Consistency calculation
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
    const consistencyScore = Math.max(0, 1 - Math.sqrt(variance))

    // Improvement trend
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
    const secondHalf = scores.slice(Math.floor(scores.length / 2))
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length
    const improvementTrend = secondAvg - firstAvg

    // Peak performance moments
    const peakThreshold = mean + Math.sqrt(variance)
    const peakPerformanceMoments = recentHistory
      .filter(h => h.unified.overall.performanceScore > peakThreshold)
      .map(h => ({
        timestamp: h.timestamp,
        score: h.unified.overall.performanceScore
      }))
      .slice(-5) // Keep only recent peaks

    // Challenging moments
    const challengeThreshold = mean - Math.sqrt(variance)
    const challengingMoments = recentHistory
      .filter(h => h.unified.overall.performanceScore < challengeThreshold)
      .map(h => ({
        timestamp: h.timestamp,
        issue: this.identifyPerformanceIssue(h)
      }))
      .slice(-5) // Keep only recent challenges

    return {
      consistencyScore,
      improvementTrend,
      peakPerformanceMoments,
      challengingMoments
    }
  }

  private identifyPerformanceIssue(analysis: any): string {
    const issues = []
    
    if (analysis.facial && analysis.facial.engagement.overallEngagement < 0.5) {
      issues.push('Low facial engagement')
    }
    if (analysis.gaze && analysis.gaze.metrics.focusScore < 0.5) {
      issues.push('Poor attention focus')
    }
    if (analysis.bodyLanguage && analysis.bodyLanguage.posture.overallPosture < 0.5) {
      issues.push('Poor posture')
    }
    if (analysis.voice && analysis.voice.confidence < 0.5) {
      issues.push('Low voice confidence')
    }

    return issues.length > 0 ? issues[0] : 'General performance dip'
  }

  private optimizedStorage(data: any, unifiedMetrics: UnifiedMetrics): void {
    // Store only essential data with compression
    const compressedEntry = {
      timestamp: Date.now(),
      unified: unifiedMetrics,
      // Store only key metrics from each system
      facial: data.facial ? {
        engagement: data.facial.engagement.overallEngagement,
        eyeContact: data.facial.eyeContact.isLookingAtCamera
      } : null,
      gaze: data.gaze ? {
        focus: data.gaze.metrics.focusScore,
        stability: data.gaze.metrics.gazeStability
      } : null,
      bodyLanguage: data.bodyLanguage ? {
        posture: data.bodyLanguage.posture.overallPosture,
        confidence: data.bodyLanguage.professionalPresence.confidence
      } : null,
      voice: data.voice ? {
        confidence: data.voice.confidence,
        clarity: data.voice.clarity
      } : null
    }

    this.analysisHistory.push(compressedEntry)

    // Maintain memory limits
    if (this.analysisHistory.length > 1200) { // 10 minutes at 2Hz
      this.analysisHistory = this.analysisHistory.slice(-1200)
    }
  }

  generatePerformanceInsights(metrics: UnifiedMetrics): PerformanceInsights {
    const strengths: string[] = []
    const areasForImprovement: string[] = []
    const recommendations: string[] = []

    // Analyze strengths
    if (metrics.overall.performanceScore > 0.8) {
      strengths.push('Excellent overall performance')
    }
    if (metrics.facial.eyeContactQuality > 0.8) {
      strengths.push('Strong eye contact and engagement')
    }
    if (metrics.bodyLanguage.postureQuality > 0.8) {
      strengths.push('Professional posture and presence')
    }
    if (metrics.gaze.attentionFocus > 0.8) {
      strengths.push('Excellent attention and focus')
    }

    // Identify areas for improvement
    if (metrics.overall.performanceScore < 0.6) {
      areasForImprovement.push('Overall interview performance')
      recommendations.push('Practice interview techniques and build confidence')
    }
    if (metrics.facial.eyeContactQuality < 0.6) {
      areasForImprovement.push('Eye contact consistency')
      recommendations.push('Practice maintaining eye contact with the camera')
    }
    if (metrics.bodyLanguage.postureQuality < 0.6) {
      areasForImprovement.push('Posture and body language')
      recommendations.push('Work on sitting up straight and maintaining good posture')
    }
    if (metrics.gaze.attentionFocus < 0.6) {
      areasForImprovement.push('Attention and focus')
      recommendations.push('Minimize distractions and maintain focus on the interview')
    }

    // Generate overall assessment
    let overallAssessment = ''
    if (metrics.overall.performanceScore > 0.8) {
      overallAssessment = 'Excellent interview performance with strong professional presence'
    } else if (metrics.overall.performanceScore > 0.6) {
      overallAssessment = 'Good interview performance with room for improvement'
    } else {
      overallAssessment = 'Interview performance needs significant improvement'
    }

    // Score breakdown
    const scoreBreakdown = [
      { category: 'Voice & Communication', score: metrics.voice.confidence, weight: 0.25, contribution: metrics.voice.confidence * 0.25 },
      { category: 'Facial Expression', score: metrics.facial.facialEngagement, weight: 0.25, contribution: metrics.facial.facialEngagement * 0.25 },
      { category: 'Attention & Focus', score: metrics.gaze.attentionFocus, weight: 0.25, contribution: metrics.gaze.attentionFocus * 0.25 },
      { category: 'Body Language', score: metrics.bodyLanguage.professionalDemeanor, weight: 0.25, contribution: metrics.bodyLanguage.professionalDemeanor * 0.25 }
    ]

    return {
      strengths,
      areasForImprovement,
      recommendations,
      overallAssessment,
      scoreBreakdown
    }
  }

  getPerformanceMetrics() {
    return {
      averageProcessingTime: this.performanceMetrics.processingTimes.length > 0 
        ? this.performanceMetrics.processingTimes.reduce((sum, time) => sum + time, 0) / this.performanceMetrics.processingTimes.length 
        : 0,
      memoryUsage: this.performanceMetrics.memoryUsage.length > 0 
        ? this.performanceMetrics.memoryUsage[this.performanceMetrics.memoryUsage.length - 1] 
        : 0,
      analysisHistory: this.analysisHistory.length,
      systemHealth: this.calculateSystemHealth()
    }
  }

  private calculateSystemHealth(): number {
    const avgProcessingTime = this.performanceMetrics.processingTimes.length > 0 
      ? this.performanceMetrics.processingTimes.reduce((sum, time) => sum + time, 0) / this.performanceMetrics.processingTimes.length 
      : 0

    // Health based on processing time (lower is better)
    const processingHealth = Math.max(0, 1 - (avgProcessingTime / 100)) // 100ms threshold
    
    // Memory health (assuming 100MB is reasonable)
    const currentMemory = this.performanceMetrics.memoryUsage.length > 0 
      ? this.performanceMetrics.memoryUsage[this.performanceMetrics.memoryUsage.length - 1] 
      : 0
    const memoryHealth = Math.max(0, 1 - (currentMemory / 100))

    return (processingHealth + memoryHealth) / 2
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
        console.error(`Error in unified analytics event handler for ${event}:`, error)
      }
    })
  }

  // Cleanup
  destroy(): void {
    this.eventHandlers.clear()
    this.analysisHistory = []
    this.performanceMetrics = {
      processingTimes: [],
      memoryUsage: [],
      analysisAccuracy: [],
      systemLoad: []
    }
  }
}

// Performance optimization utilities
class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private performanceObserver: PerformanceObserver | null = null
  private memoryMonitor: number | null = null

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  startMonitoring(): void {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`Long task detected: ${entry.duration}ms`)
          }
        })
      })

      try {
        this.performanceObserver.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        console.log('Long task monitoring not supported')
      }
    }

    // Monitor memory usage
    this.memoryMonitor = window.setInterval(() => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory
        const usedMB = memInfo.usedJSHeapSize / 1024 / 1024

        if (usedMB > 150) { // Alert if using more than 150MB
          console.warn(`High memory usage: ${usedMB.toFixed(1)}MB`)
        }
      }
    }, 5000)
  }

  stopMonitoring(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
      this.performanceObserver = null
    }

    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor)
      this.memoryMonitor = null
    }
  }

  // Debounce function for performance optimization
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // Throttle function for performance optimization
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // Memory cleanup utility
  static cleanupArrays(...arrays: any[][]): void {
    arrays.forEach(array => {
      if (Array.isArray(array)) {
        array.length = 0
      }
    })
  }

  // Efficient object pooling for frequent allocations
  static createObjectPool<T>(
    createFn: () => T,
    resetFn: (obj: T) => void,
    initialSize: number = 10
  ) {
    const pool: T[] = []

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      pool.push(createFn())
    }

    return {
      acquire(): T {
        return pool.pop() || createFn()
      },

      release(obj: T): void {
        resetFn(obj)
        if (pool.length < initialSize * 2) { // Prevent unlimited growth
          pool.push(obj)
        }
      },

      size(): number {
        return pool.length
      }
    }
  }
}

export {
  UnifiedAnalyticsService,
  PerformanceOptimizer,
  type UnifiedMetrics,
  type PerformanceInsights,
  type OptimizationConfig
}
