/**
 * Dynamic Difficulty Adjustment Service
 * Adapts interview difficulty in real-time based on candidate performance, sentiment, and ML predictions
 */

import { type UnifiedMetrics } from './unifiedAnalyticsService'
import { type PerformancePrediction } from './mlPerformancePredictionService'
import { type MultiModalSentimentResult } from './multiModalSentimentService'
import { type GeneratedQuestion, type DifficultyLevel, type QuestionCategory } from './adaptiveQuestionService'

interface DifficultyAdjustmentResult {
  currentDifficulty: DifficultyLevel
  recommendedDifficulty: DifficultyLevel
  adjustmentReason: string
  confidenceLevel: number
  adaptationStrategy: AdaptationStrategy
  performanceZone: PerformanceZone
  difficultyProgression: DifficultyProgression
  realTimeAdjustments: RealTimeAdjustment[]
}

interface AdaptationStrategy {
  type: 'gradual_increase' | 'gradual_decrease' | 'maintain_level' | 'challenge_boost' | 'support_mode'
  intensity: number // 0-1 scale
  duration: number // Expected duration in questions
  reasoning: string
  fallbackStrategy: string
}

interface PerformanceZone {
  zone: 'comfort' | 'challenge' | 'optimal' | 'stress' | 'overwhelm'
  stability: number
  timeInZone: number
  zoneHistory: Array<{ zone: string; timestamp: number; duration: number }>
}

interface DifficultyProgression {
  startingDifficulty: DifficultyLevel
  currentProgression: number // 0-1 scale
  targetProgression: number
  progressionRate: number
  milestones: DifficultyMilestone[]
}

interface DifficultyMilestone {
  difficulty: DifficultyLevel
  achievedAt: number
  performanceAtAchievement: number
  timeToAchieve: number
  stabilityScore: number
}

interface RealTimeAdjustment {
  timestamp: number
  trigger: string
  fromDifficulty: DifficultyLevel
  toDifficulty: DifficultyLevel
  confidence: number
  reasoning: string
  expectedImpact: string
}

interface DifficultyFactors {
  performanceScore: number
  sentimentStability: number
  stressLevel: number
  confidenceLevel: number
  engagementLevel: number
  improvementRate: number
  consistencyScore: number
  timeInInterview: number
}

interface DifficultyThresholds {
  easy: { min: 0, max: 0.4 }
  medium: { min: 0.3, max: 0.7 }
  hard: { min: 0.6, max: 0.9 }
  expert: { min: 0.8, max: 1.0 }
}

class DynamicDifficultyService {
  private difficultyHistory: DifficultyAdjustmentResult[] = []
  private performanceZoneHistory: PerformanceZone[] = []
  private difficultyThresholds: DifficultyThresholds
  private adaptationSensitivity: number = 0.7
  private stabilityRequirement: number = 0.6
  private maxDifficultyJump: number = 1 // Maximum difficulty levels to jump at once

  constructor() {
    this.difficultyThresholds = {
      easy: { min: 0, max: 0.4 },
      medium: { min: 0.3, max: 0.7 },
      hard: { min: 0.6, max: 0.9 },
      expert: { min: 0.8, max: 1.0 }
    }
  }

  async adjustDifficulty(
    currentDifficulty: DifficultyLevel,
    unifiedMetrics: UnifiedMetrics,
    performancePrediction: PerformancePrediction,
    sentimentResult: MultiModalSentimentResult,
    questionHistory: GeneratedQuestion[],
    context?: {
      timeInInterview: number
      targetDuration: number
      candidateExperience: string
      interviewType: string
    }
  ): Promise<DifficultyAdjustmentResult> {
    
    // Extract difficulty factors from all data sources
    const difficultyFactors = this.extractDifficultyFactors(
      unifiedMetrics,
      performancePrediction,
      sentimentResult,
      context
    )

    // Analyze current performance zone
    const performanceZone = this.analyzePerformanceZone(difficultyFactors, currentDifficulty)

    // Calculate recommended difficulty
    const recommendedDifficulty = this.calculateRecommendedDifficulty(
      currentDifficulty,
      difficultyFactors,
      performanceZone
    )

    // Determine adaptation strategy
    const adaptationStrategy = this.determineAdaptationStrategy(
      currentDifficulty,
      recommendedDifficulty,
      difficultyFactors,
      performanceZone
    )

    // Calculate difficulty progression
    const difficultyProgression = this.calculateDifficultyProgression(
      questionHistory,
      currentDifficulty,
      recommendedDifficulty
    )

    // Generate adjustment reasoning
    const adjustmentReason = this.generateAdjustmentReason(
      currentDifficulty,
      recommendedDifficulty,
      difficultyFactors,
      performanceZone,
      adaptationStrategy
    )

    // Calculate confidence in adjustment
    const confidenceLevel = this.calculateAdjustmentConfidence(
      difficultyFactors,
      performanceZone,
      adaptationStrategy
    )

    // Create real-time adjustment record
    const realTimeAdjustment: RealTimeAdjustment = {
      timestamp: Date.now(),
      trigger: this.identifyAdjustmentTrigger(difficultyFactors, performanceZone),
      fromDifficulty: currentDifficulty,
      toDifficulty: recommendedDifficulty,
      confidence: confidenceLevel,
      reasoning: adjustmentReason,
      expectedImpact: this.predictAdjustmentImpact(currentDifficulty, recommendedDifficulty, difficultyFactors)
    }

    const result: DifficultyAdjustmentResult = {
      currentDifficulty,
      recommendedDifficulty,
      adjustmentReason,
      confidenceLevel,
      adaptationStrategy,
      performanceZone,
      difficultyProgression,
      realTimeAdjustments: [...this.getRecentAdjustments(), realTimeAdjustment]
    }

    // Store in history
    this.difficultyHistory.push(result)
    this.performanceZoneHistory.push(performanceZone)

    // Keep only recent history
    if (this.difficultyHistory.length > 100) {
      this.difficultyHistory = this.difficultyHistory.slice(-100)
    }
    if (this.performanceZoneHistory.length > 100) {
      this.performanceZoneHistory = this.performanceZoneHistory.slice(-100)
    }

    return result
  }

  private extractDifficultyFactors(
    unifiedMetrics: UnifiedMetrics,
    performancePrediction: PerformancePrediction,
    sentimentResult: MultiModalSentimentResult,
    context?: any
  ): DifficultyFactors {
    return {
      performanceScore: unifiedMetrics.overall.performanceScore,
      sentimentStability: sentimentResult.emotionalCoherence.temporalConsistency,
      stressLevel: sentimentResult.realTimeInsights.stressLevel,
      confidenceLevel: sentimentResult.realTimeInsights.confidenceLevel,
      engagementLevel: sentimentResult.realTimeInsights.engagementLevel,
      improvementRate: performancePrediction.improvementPotential,
      consistencyScore: unifiedMetrics.temporal?.consistencyScore || 0.5,
      timeInInterview: context?.timeInInterview || 0
    }
  }

  private analyzePerformanceZone(factors: DifficultyFactors, currentDifficulty: DifficultyLevel): PerformanceZone {
    // Determine performance zone based on multiple factors
    let zone: PerformanceZone['zone'] = 'optimal'
    
    // Stress-based zone detection
    if (factors.stressLevel > 0.8) {
      zone = 'overwhelm'
    } else if (factors.stressLevel > 0.6) {
      zone = 'stress'
    } else if (factors.performanceScore > 0.8 && factors.confidenceLevel > 0.7) {
      zone = 'challenge'
    } else if (factors.performanceScore < 0.4 || factors.confidenceLevel < 0.4) {
      zone = 'comfort'
    } else {
      zone = 'optimal'
    }

    // Calculate stability (consistency of performance zone)
    const recentZones = this.performanceZoneHistory.slice(-5).map(p => p.zone)
    const zoneConsistency = recentZones.filter(z => z === zone).length / Math.max(recentZones.length, 1)
    const stability = zoneConsistency

    // Calculate time in current zone
    const timeInZone = this.calculateTimeInZone(zone)

    // Build zone history
    const zoneHistory = this.performanceZoneHistory.slice(-10).map(p => ({
      zone: p.zone,
      timestamp: Date.now() - (this.performanceZoneHistory.length - this.performanceZoneHistory.indexOf(p)) * 30000,
      duration: 30000 // Approximate duration
    }))

    return { zone, stability, timeInZone, zoneHistory }
  }

  private calculateTimeInZone(currentZone: string): number {
    let timeInZone = 0
    for (let i = this.performanceZoneHistory.length - 1; i >= 0; i--) {
      if (this.performanceZoneHistory[i].zone === currentZone) {
        timeInZone += 30000 // Approximate 30 seconds per measurement
      } else {
        break
      }
    }
    return timeInZone
  }

  private calculateRecommendedDifficulty(
    currentDifficulty: DifficultyLevel,
    factors: DifficultyFactors,
    performanceZone: PerformanceZone
  ): DifficultyLevel {
    const difficultyLevels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert']
    const currentIndex = difficultyLevels.indexOf(currentDifficulty)
    
    // Base recommendation on performance zone
    let recommendedIndex = currentIndex
    
    switch (performanceZone.zone) {
      case 'overwhelm':
        // Significant difficulty reduction needed
        recommendedIndex = Math.max(0, currentIndex - 2)
        break
        
      case 'stress':
        // Moderate difficulty reduction
        recommendedIndex = Math.max(0, currentIndex - 1)
        break
        
      case 'comfort':
        // Increase difficulty if performance is strong
        if (factors.performanceScore > 0.7 && factors.confidenceLevel > 0.6) {
          recommendedIndex = Math.min(difficultyLevels.length - 1, currentIndex + 1)
        }
        break
        
      case 'challenge':
        // Maintain or slightly increase if very stable
        if (performanceZone.stability > 0.8 && factors.performanceScore > 0.8) {
          recommendedIndex = Math.min(difficultyLevels.length - 1, currentIndex + 1)
        }
        break
        
      case 'optimal':
        // Gradual progression based on performance
        if (factors.performanceScore > 0.75 && factors.improvementRate > 0.6) {
          recommendedIndex = Math.min(difficultyLevels.length - 1, currentIndex + 1)
        } else if (factors.performanceScore < 0.5) {
          recommendedIndex = Math.max(0, currentIndex - 1)
        }
        break
    }

    // Apply constraints
    const maxJump = this.maxDifficultyJump
    recommendedIndex = Math.max(currentIndex - maxJump, Math.min(currentIndex + maxJump, recommendedIndex))

    // Consider time constraints
    if (factors.timeInInterview > 1800000) { // 30 minutes
      // Late in interview - be more conservative
      recommendedIndex = Math.min(recommendedIndex, currentIndex)
    }

    return difficultyLevels[recommendedIndex]
  }

  private determineAdaptationStrategy(
    currentDifficulty: DifficultyLevel,
    recommendedDifficulty: DifficultyLevel,
    factors: DifficultyFactors,
    performanceZone: PerformanceZone
  ): AdaptationStrategy {
    const difficultyLevels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert']
    const currentIndex = difficultyLevels.indexOf(currentDifficulty)
    const recommendedIndex = difficultyLevels.indexOf(recommendedDifficulty)
    const difficultyChange = recommendedIndex - currentIndex

    let type: AdaptationStrategy['type'] = 'maintain_level'
    let intensity = 0.5
    let duration = 3
    let reasoning = ''
    let fallbackStrategy = ''

    if (difficultyChange > 0) {
      // Increasing difficulty
      if (performanceZone.zone === 'challenge' && factors.performanceScore > 0.8) {
        type = 'challenge_boost'
        intensity = 0.8
        duration = 2
        reasoning = 'Candidate performing excellently, applying challenge boost'
        fallbackStrategy = 'Reduce to gradual increase if stress indicators appear'
      } else {
        type = 'gradual_increase'
        intensity = 0.6
        duration = 4
        reasoning = 'Gradual difficulty increase based on strong performance'
        fallbackStrategy = 'Maintain current level if performance drops'
      }
    } else if (difficultyChange < 0) {
      // Decreasing difficulty
      if (performanceZone.zone === 'overwhelm' || factors.stressLevel > 0.8) {
        type = 'support_mode'
        intensity = 0.9
        duration = 5
        reasoning = 'Providing support due to high stress or overwhelm'
        fallbackStrategy = 'Gradual increase once stress levels normalize'
      } else {
        type = 'gradual_decrease'
        intensity = 0.5
        duration = 3
        reasoning = 'Gradual difficulty reduction to optimize performance'
        fallbackStrategy = 'Maintain level if performance stabilizes'
      }
    } else {
      // Maintaining difficulty
      type = 'maintain_level'
      intensity = 0.4
      duration = 2
      reasoning = 'Maintaining current difficulty level for optimal performance'
      fallbackStrategy = 'Adjust based on performance trends'
    }

    return { type, intensity, duration, reasoning, fallbackStrategy }
  }

  private calculateDifficultyProgression(
    questionHistory: GeneratedQuestion[],
    currentDifficulty: DifficultyLevel,
    recommendedDifficulty: DifficultyLevel
  ): DifficultyProgression {
    const difficultyLevels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert']
    
    // Find starting difficulty
    const startingDifficulty = questionHistory.length > 0 ? questionHistory[0].difficulty : 'easy'
    
    // Calculate current progression (0-1 scale)
    const currentIndex = difficultyLevels.indexOf(currentDifficulty)
    const currentProgression = currentIndex / (difficultyLevels.length - 1)
    
    // Calculate target progression
    const targetIndex = difficultyLevels.indexOf(recommendedDifficulty)
    const targetProgression = targetIndex / (difficultyLevels.length - 1)
    
    // Calculate progression rate (change per question)
    const progressionRate = questionHistory.length > 1 ? 
      (currentProgression - (difficultyLevels.indexOf(startingDifficulty) / (difficultyLevels.length - 1))) / questionHistory.length :
      0

    // Extract milestones from history
    const milestones: DifficultyMilestone[] = []
    let lastDifficulty = startingDifficulty
    
    questionHistory.forEach((question, index) => {
      if (question.difficulty !== lastDifficulty) {
        milestones.push({
          difficulty: question.difficulty,
          achievedAt: index,
          performanceAtAchievement: 0.7, // Mock performance score
          timeToAchieve: index * 120000, // Approximate time
          stabilityScore: 0.8 // Mock stability
        })
        lastDifficulty = question.difficulty
      }
    })

    return {
      startingDifficulty,
      currentProgression,
      targetProgression,
      progressionRate,
      milestones
    }
  }

  private generateAdjustmentReason(
    currentDifficulty: DifficultyLevel,
    recommendedDifficulty: DifficultyLevel,
    factors: DifficultyFactors,
    performanceZone: PerformanceZone,
    strategy: AdaptationStrategy
  ): string {
    if (currentDifficulty === recommendedDifficulty) {
      return `Maintaining ${currentDifficulty} difficulty - candidate in ${performanceZone.zone} zone with stable performance`
    }

    const difficultyLevels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert']
    const isIncreasing = difficultyLevels.indexOf(recommendedDifficulty) > difficultyLevels.indexOf(currentDifficulty)

    if (isIncreasing) {
      if (factors.performanceScore > 0.8) {
        return `Increasing to ${recommendedDifficulty} difficulty - excellent performance (${Math.round(factors.performanceScore * 100)}%) indicates readiness for greater challenge`
      } else if (performanceZone.zone === 'comfort') {
        return `Increasing to ${recommendedDifficulty} difficulty - candidate in comfort zone, applying appropriate challenge`
      } else {
        return `Increasing to ${recommendedDifficulty} difficulty - strong confidence (${Math.round(factors.confidenceLevel * 100)}%) and engagement (${Math.round(factors.engagementLevel * 100)}%)`
      }
    } else {
      if (factors.stressLevel > 0.7) {
        return `Reducing to ${recommendedDifficulty} difficulty - high stress level (${Math.round(factors.stressLevel * 100)}%) detected, providing support`
      } else if (performanceZone.zone === 'overwhelm') {
        return `Reducing to ${recommendedDifficulty} difficulty - candidate showing signs of overwhelm, optimizing for performance`
      } else {
        return `Reducing to ${recommendedDifficulty} difficulty - performance indicators suggest need for adjustment to maintain optimal zone`
      }
    }
  }

  private calculateAdjustmentConfidence(
    factors: DifficultyFactors,
    performanceZone: PerformanceZone,
    strategy: AdaptationStrategy
  ): number {
    let confidence = 0.7 // Base confidence

    // Increase confidence for stable performance zones
    if (performanceZone.stability > 0.8) {
      confidence += 0.2
    }

    // Increase confidence for clear performance indicators
    if (factors.performanceScore > 0.8 || factors.performanceScore < 0.3) {
      confidence += 0.1
    }

    // Increase confidence for consistent stress/confidence levels
    if (Math.abs(factors.stressLevel - 0.5) > 0.3) {
      confidence += 0.1
    }

    // Decrease confidence for inconsistent factors
    if (performanceZone.stability < 0.4) {
      confidence -= 0.2
    }

    // Adjust based on strategy intensity
    confidence += (strategy.intensity - 0.5) * 0.1

    return Math.max(0.3, Math.min(1.0, confidence))
  }

  private identifyAdjustmentTrigger(factors: DifficultyFactors, performanceZone: PerformanceZone): string {
    if (factors.stressLevel > 0.8) return 'high_stress_detected'
    if (factors.performanceScore > 0.85) return 'excellent_performance'
    if (performanceZone.zone === 'overwhelm') return 'overwhelm_zone'
    if (performanceZone.zone === 'comfort' && factors.confidenceLevel > 0.7) return 'comfort_zone_with_confidence'
    if (factors.engagementLevel < 0.4) return 'low_engagement'
    if (performanceZone.stability > 0.8) return 'stable_performance_zone'
    return 'routine_assessment'
  }

  private predictAdjustmentImpact(
    currentDifficulty: DifficultyLevel,
    recommendedDifficulty: DifficultyLevel,
    factors: DifficultyFactors
  ): string {
    const difficultyLevels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert']
    const isIncreasing = difficultyLevels.indexOf(recommendedDifficulty) > difficultyLevels.indexOf(currentDifficulty)

    if (currentDifficulty === recommendedDifficulty) {
      return 'Maintain current performance level and engagement'
    }

    if (isIncreasing) {
      if (factors.confidenceLevel > 0.7) {
        return 'Expected to maintain high performance with increased engagement'
      } else {
        return 'May initially decrease performance but should improve engagement and learning'
      }
    } else {
      if (factors.stressLevel > 0.6) {
        return 'Expected to reduce stress and improve performance stability'
      } else {
        return 'Should optimize performance while maintaining appropriate challenge level'
      }
    }
  }

  private getRecentAdjustments(): RealTimeAdjustment[] {
    return this.difficultyHistory
      .slice(-5)
      .map(h => h.realTimeAdjustments)
      .flat()
      .slice(-10)
  }

  // Public API methods
  getDifficultyHistory(): DifficultyAdjustmentResult[] {
    return [...this.difficultyHistory]
  }

  getPerformanceZoneHistory(): PerformanceZone[] {
    return [...this.performanceZoneHistory]
  }

  getCurrentPerformanceZone(): PerformanceZone | null {
    return this.performanceZoneHistory.length > 0 ? 
      this.performanceZoneHistory[this.performanceZoneHistory.length - 1] : null
  }

  getAdaptationSensitivity(): number {
    return this.adaptationSensitivity
  }

  setAdaptationSensitivity(sensitivity: number): void {
    this.adaptationSensitivity = Math.max(0.1, Math.min(1.0, sensitivity))
  }

  getDifficultyThresholds(): DifficultyThresholds {
    return { ...this.difficultyThresholds }
  }

  updateDifficultyThresholds(thresholds: Partial<DifficultyThresholds>): void {
    this.difficultyThresholds = { ...this.difficultyThresholds, ...thresholds }
  }

  getOptimalDifficultyForCandidate(
    performanceHistory: number[],
    stressHistory: number[],
    engagementHistory: number[]
  ): DifficultyLevel {
    if (performanceHistory.length === 0) return 'medium'

    const avgPerformance = performanceHistory.reduce((sum, p) => sum + p, 0) / performanceHistory.length
    const avgStress = stressHistory.reduce((sum, s) => sum + s, 0) / stressHistory.length
    const avgEngagement = engagementHistory.reduce((sum, e) => sum + e, 0) / engagementHistory.length

    // Find optimal difficulty based on historical data
    if (avgPerformance > 0.8 && avgStress < 0.4 && avgEngagement > 0.7) {
      return 'expert'
    } else if (avgPerformance > 0.6 && avgStress < 0.6) {
      return 'hard'
    } else if (avgPerformance > 0.4 && avgStress < 0.7) {
      return 'medium'
    } else {
      return 'easy'
    }
  }

  clearHistory(): void {
    this.difficultyHistory = []
    this.performanceZoneHistory = []
  }
}

export { 
  DynamicDifficultyService,
  type DifficultyAdjustmentResult,
  type AdaptationStrategy,
  type PerformanceZone,
  type DifficultyProgression,
  type RealTimeAdjustment,
  type DifficultyFactors
}
