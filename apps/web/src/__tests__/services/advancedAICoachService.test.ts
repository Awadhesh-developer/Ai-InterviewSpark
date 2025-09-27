import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { advancedAICoachService } from '@/services/advancedAICoachService'
import { RoleSpecificCoachFactory } from '@/services/roleSpecificCoaches'

// Mock API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}))

describe('AdvancedAICoachService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generatePersonalizedPlan', () => {
    it('should generate a personalized coaching plan for software engineer', async () => {
      const params = {
        userId: 'test-user-1',
        role: 'software-engineer',
        currentSkills: ['JavaScript', 'React', 'Node.js'],
        timeframe: 12,
        preferences: {
          learningStyle: 'visual' as const,
          intensity: 'moderate' as const,
          focusAreas: ['System Design', 'Algorithms']
        }
      }

      const plan = await advancedAICoachService.generatePersonalizedPlan(params)

      expect(plan).toBeDefined()
      expect(plan.userId).toBe(params.userId)
      expect(plan.role).toBe(params.role)
      expect(plan.learningPath).toBeInstanceOf(Array)
      expect(plan.learningPath.length).toBeGreaterThan(0)
      expect(plan.currentLevel).toMatch(/^(novice|intermediate|advanced|expert)$/)
      expect(plan.targetLevel).toMatch(/^(novice|intermediate|advanced|expert)$/)
    })

    it('should handle invalid role gracefully', async () => {
      const params = {
        userId: 'test-user-1',
        role: 'invalid-role',
        currentSkills: [],
        timeframe: 12,
        preferences: {
          learningStyle: 'visual' as const,
          intensity: 'moderate' as const,
          focusAreas: []
        }
      }

      await expect(advancedAICoachService.generatePersonalizedPlan(params))
        .rejects.toThrow('No coach available for role: invalid-role')
    })

    it('should adapt learning path based on user preferences', async () => {
      const intensiveParams = {
        userId: 'test-user-1',
        role: 'software-engineer',
        currentSkills: ['JavaScript'],
        timeframe: 8,
        preferences: {
          learningStyle: 'kinesthetic' as const,
          intensity: 'intensive' as const,
          focusAreas: ['Algorithms']
        }
      }

      const lightParams = {
        ...intensiveParams,
        preferences: {
          ...intensiveParams.preferences,
          intensity: 'light' as const
        }
      }

      const intensivePlan = await advancedAICoachService.generatePersonalizedPlan(intensiveParams)
      const lightPlan = await advancedAICoachService.generatePersonalizedPlan(lightParams)

      // Intensive plan should have shorter estimated times
      const intensiveTotal = intensivePlan.learningPath.reduce((sum, step) => sum + step.estimatedTime, 0)
      const lightTotal = lightPlan.learningPath.reduce((sum, step) => sum + step.estimatedTime, 0)
      
      expect(intensiveTotal).toBeLessThan(lightTotal)
    })
  })

  describe('startCoachingSession', () => {
    it('should start a coaching session successfully', async () => {
      const params = {
        userId: 'test-user-1',
        sessionType: 'practice' as const,
        role: 'software-engineer',
        focusAreas: ['System Design']
      }

      const session = await advancedAICoachService.startCoachingSession(params)

      expect(session).toBeDefined()
      expect(session.id).toMatch(/^session-\d+$/)
      expect(session.userId).toBe(params.userId)
      expect(session.coachProfile).toBeDefined()
      expect(session.coachProfile.role).toBe(params.role)
      expect(session.startTime).toBeInstanceOf(Date)
      expect(session.emotionalStates).toEqual([])
      expect(session.realTimeFeedback).toEqual([])
    })

    it('should handle invalid role in session start', async () => {
      const params = {
        userId: 'test-user-1',
        sessionType: 'practice' as const,
        role: 'invalid-role',
        focusAreas: []
      }

      await expect(advancedAICoachService.startCoachingSession(params))
        .rejects.toThrow('No coach available for role: invalid-role')
    })
  })

  describe('processEmotionalData', () => {
    it('should process emotional data and generate feedback', async () => {
      // First start a session
      const session = await advancedAICoachService.startCoachingSession({
        userId: 'test-user-1',
        sessionType: 'practice',
        role: 'software-engineer'
      })

      const emotionalData = {
        confidence: 0.3, // Low confidence
        stress: 0.8,     // High stress
        engagement: 0.2, // Low engagement
        clarity: 0.4     // Poor clarity
      }

      const feedback = await advancedAICoachService.processEmotionalData(
        session.id,
        emotionalData
      )

      expect(feedback).toBeInstanceOf(Array)
      expect(feedback.length).toBeGreaterThan(0)
      
      // Should generate feedback for low confidence
      const confidenceFeedback = feedback.find(f => f.context === 'low_confidence')
      expect(confidenceFeedback).toBeDefined()
      expect(confidenceFeedback?.type).toBe('encouragement')

      // Should generate feedback for high stress
      const stressFeedback = feedback.find(f => f.context === 'high_stress')
      expect(stressFeedback).toBeDefined()
      expect(stressFeedback?.type).toBe('guidance')
    })

    it('should handle non-existent session', async () => {
      const emotionalData = {
        confidence: 0.7,
        stress: 0.3,
        engagement: 0.8,
        clarity: 0.7
      }

      await expect(advancedAICoachService.processEmotionalData('invalid-session', emotionalData))
        .rejects.toThrow('Session not found: invalid-session')
    })

    it('should not generate feedback for good emotional state', async () => {
      const session = await advancedAICoachService.startCoachingSession({
        userId: 'test-user-1',
        sessionType: 'practice',
        role: 'software-engineer'
      })

      const goodEmotionalData = {
        confidence: 0.8,
        stress: 0.2,
        engagement: 0.9,
        clarity: 0.8
      }

      const feedback = await advancedAICoachService.processEmotionalData(
        session.id,
        goodEmotionalData
      )

      expect(feedback).toBeInstanceOf(Array)
      expect(feedback.length).toBe(0) // No feedback needed for good state
    })
  })
})

describe('RoleSpecificCoachFactory', () => {
  describe('createSoftwareEngineerCoach', () => {
    it('should create a comprehensive software engineer coach', () => {
      const coach = RoleSpecificCoachFactory.createSoftwareEngineerCoach()

      expect(coach.role).toBe('software-engineer')
      expect(coach.expertise).toBeInstanceOf(Array)
      expect(coach.expertise.length).toBeGreaterThan(10)
      expect(coach.expertise).toContain('System Design')
      expect(coach.expertise).toContain('Data Structures & Algorithms')
      
      expect(coach.questionTemplates).toBeInstanceOf(Array)
      expect(coach.questionTemplates.length).toBeGreaterThan(0)
      
      const technicalTemplate = coach.questionTemplates.find(t => t.category === 'Technical Problem Solving')
      expect(technicalTemplate).toBeDefined()
      expect(technicalTemplate?.questions.length).toBeGreaterThan(0)
      expect(technicalTemplate?.followUps.length).toBeGreaterThan(0)
      expect(technicalTemplate?.evaluationPoints.length).toBeGreaterThan(0)

      expect(coach.evaluationCriteria).toBeDefined()
      expect(coach.evaluationCriteria.technical.weight).toBe(0.4)
      expect(coach.evaluationCriteria.behavioral.weight).toBe(0.25)
      expect(coach.evaluationCriteria.communication.weight).toBe(0.2)

      expect(coach.learningPath).toBeInstanceOf(Array)
      expect(coach.learningPath.length).toBeGreaterThan(0)
      
      expect(coach.industryInsights).toBeInstanceOf(Array)
      expect(coach.industryInsights.length).toBeGreaterThan(0)
    })
  })

  describe('createProductManagerCoach', () => {
    it('should create a comprehensive product manager coach', () => {
      const coach = RoleSpecificCoachFactory.createProductManagerCoach()

      expect(coach.role).toBe('product-manager')
      expect(coach.expertise).toContain('Product Strategy')
      expect(coach.expertise).toContain('Stakeholder Management')
      expect(coach.expertise).toContain('Data Analysis')

      const strategyTemplate = coach.questionTemplates.find(t => t.category === 'Product Strategy')
      expect(strategyTemplate).toBeDefined()
      expect(strategyTemplate?.questions).toContain(
        'How would you prioritize features for a product with limited engineering resources?'
      )

      // Product manager should have different evaluation criteria weights
      expect(coach.evaluationCriteria.technical.weight).toBe(0.2)
      expect(coach.evaluationCriteria.behavioral.weight).toBe(0.3)
      expect(coach.evaluationCriteria.communication.weight).toBe(0.25)
    })
  })
})

describe('Integration Tests', () => {
  it('should handle complete coaching workflow', async () => {
    // 1. Generate personalized plan
    const plan = await advancedAICoachService.generatePersonalizedPlan({
      userId: 'integration-test-user',
      role: 'software-engineer',
      currentSkills: ['JavaScript', 'React'],
      timeframe: 8,
      preferences: {
        learningStyle: 'mixed',
        intensity: 'moderate',
        focusAreas: ['System Design', 'Algorithms']
      }
    })

    expect(plan).toBeDefined()

    // 2. Start coaching session
    const session = await advancedAICoachService.startCoachingSession({
      userId: plan.userId,
      sessionType: 'practice',
      role: plan.role
    })

    expect(session).toBeDefined()

    // 3. Process emotional data multiple times
    const emotionalDataSequence = [
      { confidence: 0.3, stress: 0.8, engagement: 0.4, clarity: 0.3 }, // Poor start
      { confidence: 0.5, stress: 0.6, engagement: 0.6, clarity: 0.5 }, // Improving
      { confidence: 0.7, stress: 0.4, engagement: 0.8, clarity: 0.7 }  // Good end
    ]

    for (const emotionalData of emotionalDataSequence) {
      const feedback = await advancedAICoachService.processEmotionalData(
        session.id,
        emotionalData
      )
      expect(feedback).toBeInstanceOf(Array)
    }

    // Session should have accumulated emotional states and feedback
    expect(session.emotionalStates.length).toBe(emotionalDataSequence.length)
    expect(session.realTimeFeedback.length).toBeGreaterThan(0)
  })

  it('should handle error scenarios gracefully', async () => {
    // Test with invalid user ID
    await expect(advancedAICoachService.generatePersonalizedPlan({
      userId: '',
      role: 'software-engineer',
      currentSkills: [],
      timeframe: 8,
      preferences: {
        learningStyle: 'visual',
        intensity: 'moderate',
        focusAreas: []
      }
    })).resolves.toBeDefined() // Should still work with empty user ID

    // Test with extreme values
    const extremePlan = await advancedAICoachService.generatePersonalizedPlan({
      userId: 'extreme-test',
      role: 'software-engineer',
      currentSkills: new Array(100).fill('skill'), // Many skills
      timeframe: 1, // Very short timeframe
      preferences: {
        learningStyle: 'mixed',
        intensity: 'intensive',
        focusAreas: ['System Design']
      }
    })

    expect(extremePlan).toBeDefined()
    expect(extremePlan.estimatedCompletion).toBeInstanceOf(Date)
  })
})

describe('Performance Tests', () => {
  it('should generate personalized plan within reasonable time', async () => {
    const startTime = Date.now()
    
    await advancedAICoachService.generatePersonalizedPlan({
      userId: 'perf-test-user',
      role: 'software-engineer',
      currentSkills: ['JavaScript', 'Python', 'React', 'Node.js'],
      timeframe: 12,
      preferences: {
        learningStyle: 'mixed',
        intensity: 'moderate',
        focusAreas: ['System Design', 'Algorithms', 'Leadership']
      }
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    // Should complete within 1 second
    expect(duration).toBeLessThan(1000)
  })

  it('should handle multiple concurrent sessions', async () => {
    const sessionPromises = Array.from({ length: 5 }, (_, i) =>
      advancedAICoachService.startCoachingSession({
        userId: `concurrent-user-${i}`,
        sessionType: 'practice',
        role: 'software-engineer'
      })
    )

    const sessions = await Promise.all(sessionPromises)
    
    expect(sessions).toHaveLength(5)
    sessions.forEach((session, index) => {
      expect(session.userId).toBe(`concurrent-user-${index}`)
      expect(session.id).toBeDefined()
    })

    // All sessions should have unique IDs
    const sessionIds = sessions.map(s => s.id)
    const uniqueIds = new Set(sessionIds)
    expect(uniqueIds.size).toBe(sessions.length)
  })
})
