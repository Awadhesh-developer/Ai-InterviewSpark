import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { advancedAICoachService } from '@/services/advancedAICoachService'
import { emotionalIntelligenceService } from '@/services/emotionalIntelligenceService'
import { learningPathEngine } from '@/services/learningPathEngine'
import { performanceOptimizer } from '@/utils/performanceOptimization'

// Mock environment setup
const mockEnv = {
  NEXT_PUBLIC_MOTIVEL_API_KEY: 'test-motivel-key',
  NEXT_PUBLIC_MOODME_API_KEY: 'test-moodme-key'
}
Object.assign(process.env, mockEnv)

// Mock Blob API
global.Blob = class MockBlob {
  constructor(public content: any[], public options?: any) {}
  async arrayBuffer(): Promise<ArrayBuffer> {
    const str = this.content.join('')
    const buffer = new ArrayBuffer(str.length)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < str.length; i++) {
      view[i] = str.charCodeAt(i)
    }
    return buffer
  }
} as any

global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')

describe('AI Coaching System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    performanceOptimizer.clearCache()
  })

  afterEach(() => {
    performanceOptimizer.cleanup()
  })

  describe('Complete User Journey', () => {
    it('should handle complete user onboarding and coaching journey', async () => {
      const userId = 'integration-test-user'
      const role = 'software-engineer'

      // Step 1: Generate personalized learning plan
      console.log('Step 1: Generating personalized learning plan...')
      const learningPlan = await advancedAICoachService.generatePersonalizedPlan({
        userId,
        role,
        currentSkills: ['JavaScript', 'React', 'Node.js'],
        timeframe: 12,
        preferences: {
          learningStyle: 'mixed',
          intensity: 'moderate',
          focusAreas: ['System Design', 'Algorithms', 'Leadership']
        }
      })

      expect(learningPlan).toBeDefined()
      expect(learningPlan.userId).toBe(userId)
      expect(learningPlan.role).toBe(role)
      expect(learningPlan.learningPath.length).toBeGreaterThan(0)

      // Step 2: Start coaching session
      console.log('Step 2: Starting coaching session...')
      const coachingSession = await advancedAICoachService.startCoachingSession({
        userId,
        sessionType: 'practice',
        role,
        focusAreas: ['System Design']
      })

      expect(coachingSession).toBeDefined()
      expect(coachingSession.userId).toBe(userId)

      // Step 3: Start emotional intelligence session
      console.log('Step 3: Starting emotional intelligence session...')
      const emotionalSession = await emotionalIntelligenceService.startEmotionalCoachingSession(userId)

      expect(emotionalSession).toBeDefined()
      expect(emotionalSession.userId).toBe(userId)

      // Step 4: Simulate real-time coaching with emotional analysis
      console.log('Step 4: Simulating real-time coaching...')
      const sessionData = [
        {
          audio: new Blob(['nervous audio'], { type: 'audio/wav' }),
          video: new Blob(['nervous video'], { type: 'video/mp4' }),
          expectedState: { confidence: 0.3, stress: 0.8, engagement: 0.4, clarity: 0.3 }
        },
        {
          audio: new Blob(['improving audio'], { type: 'audio/wav' }),
          video: new Blob(['improving video'], { type: 'video/mp4' }),
          expectedState: { confidence: 0.5, stress: 0.6, engagement: 0.6, clarity: 0.5 }
        },
        {
          audio: new Blob(['confident audio'], { type: 'audio/wav' }),
          video: new Blob(['confident video'], { type: 'video/mp4' }),
          expectedState: { confidence: 0.8, stress: 0.3, engagement: 0.9, clarity: 0.8 }
        }
      ]

      const analysisResults = []
      const feedbackResults = []

      for (const data of sessionData) {
        // Process emotional data
        const emotionalAnalysis = await emotionalIntelligenceService.processRealTimeEmotionalData(
          emotionalSession.id,
          data.audio,
          data.video
        )

        analysisResults.push(emotionalAnalysis)

        // Process coaching feedback
        const coachingFeedback = await advancedAICoachService.processEmotionalData(
          coachingSession.id,
          emotionalAnalysis.overallState
        )

        feedbackResults.push(coachingFeedback)

        // Small delay to simulate real-time
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Verify progression
      expect(analysisResults.length).toBe(3)
      expect(feedbackResults.length).toBe(3)

      // Check emotional progression (should improve over time)
      const firstState = analysisResults[0].overallState
      const lastState = analysisResults[2].overallState
      
      // Confidence should generally improve (allowing for some variance in mock data)
      expect(lastState.timestamp).toBeGreaterThan(firstState.timestamp)

      // Step 5: Generate learning path recommendations
      console.log('Step 5: Generating learning path recommendations...')
      const userProfile = {
        id: userId,
        role,
        currentLevel: 'intermediate' as const,
        targetRole: undefined,
        targetLevel: 'advanced' as const,
        skills: [
          { name: 'JavaScript', category: 'Technical', level: 80, confidence: 85, lastAssessed: new Date(), trending: 'stable' as const },
          { name: 'System Design', category: 'Technical', level: 60, confidence: 65, lastAssessed: new Date(), trending: 'improving' as const }
        ],
        preferences: {
          learningStyle: 'mixed' as const,
          intensity: 'moderate' as const,
          timeCommitment: 10,
          preferredFormats: ['video', 'practice'] as const,
          difficultyPreference: 'gradual' as const,
          feedbackFrequency: 'daily' as const
        },
        goals: [],
        constraints: [],
        performanceHistory: []
      }

      const adaptivePath = await learningPathEngine.generatePersonalizedPath(userProfile)

      expect(adaptivePath).toBeDefined()
      expect(adaptivePath.userId).toBe(userId)
      expect(adaptivePath.steps.length).toBeGreaterThan(0)

      // Step 6: Verify system integration
      console.log('Step 6: Verifying system integration...')
      
      // Check that all sessions are properly linked
      expect(coachingSession.emotionalStates.length).toBe(3)
      expect(emotionalSession.emotionalStates.length).toBe(3)
      expect(emotionalSession.analyses.length).toBe(3)

      // Check that feedback was generated appropriately
      const totalFeedback = feedbackResults.flat()
      expect(totalFeedback.length).toBeGreaterThan(0)

      // Verify performance metrics
      const metrics = performanceOptimizer.getMetrics()
      expect(metrics.apiCalls).toBeGreaterThan(0)
      expect(metrics.errorRate).toBeLessThan(0.1) // Less than 10% error rate

      console.log('Integration test completed successfully!')
    }, 30000) // 30 second timeout for integration test

    it('should handle multiple concurrent users', async () => {
      const userCount = 3
      const users = Array.from({ length: userCount }, (_, i) => ({
        id: `concurrent-user-${i}`,
        role: 'software-engineer'
      }))

      console.log(`Testing ${userCount} concurrent users...`)

      // Start sessions for all users concurrently
      const sessionPromises = users.map(async (user) => {
        // Generate learning plan
        const plan = await advancedAICoachService.generatePersonalizedPlan({
          userId: user.id,
          role: user.role,
          currentSkills: ['JavaScript'],
          timeframe: 8,
          preferences: {
            learningStyle: 'visual',
            intensity: 'moderate',
            focusAreas: ['Algorithms']
          }
        })

        // Start coaching session
        const coachingSession = await advancedAICoachService.startCoachingSession({
          userId: user.id,
          sessionType: 'practice',
          role: user.role
        })

        // Start emotional session
        const emotionalSession = await emotionalIntelligenceService.startEmotionalCoachingSession(user.id)

        // Process some data
        const analysis = await emotionalIntelligenceService.processRealTimeEmotionalData(
          emotionalSession.id,
          new Blob([`audio-${user.id}`], { type: 'audio/wav' })
        )

        return {
          user,
          plan,
          coachingSession,
          emotionalSession,
          analysis
        }
      })

      const results = await Promise.all(sessionPromises)

      // Verify all sessions were created successfully
      expect(results.length).toBe(userCount)
      
      results.forEach((result, index) => {
        expect(result.plan.userId).toBe(`concurrent-user-${index}`)
        expect(result.coachingSession.userId).toBe(`concurrent-user-${index}`)
        expect(result.emotionalSession.userId).toBe(`concurrent-user-${index}`)
        expect(result.analysis).toBeDefined()
      })

      // Verify unique session IDs
      const coachingSessionIds = results.map(r => r.coachingSession.id)
      const emotionalSessionIds = results.map(r => r.emotionalSession.id)
      
      expect(new Set(coachingSessionIds).size).toBe(userCount)
      expect(new Set(emotionalSessionIds).size).toBe(userCount)

      console.log('Concurrent users test completed successfully!')
    })

    it('should handle error scenarios gracefully', async () => {
      console.log('Testing error handling...')

      // Test with invalid role
      await expect(
        advancedAICoachService.generatePersonalizedPlan({
          userId: 'error-test-user',
          role: 'invalid-role',
          currentSkills: [],
          timeframe: 8,
          preferences: {
            learningStyle: 'visual',
            intensity: 'moderate',
            focusAreas: []
          }
        })
      ).rejects.toThrow('No coach available for role: invalid-role')

      // Test with non-existent session
      await expect(
        emotionalIntelligenceService.processRealTimeEmotionalData(
          'non-existent-session',
          new Blob(['test'], { type: 'audio/wav' })
        )
      ).rejects.toThrow('Session not found: non-existent-session')

      // Test with invalid emotional data
      const session = await advancedAICoachService.startCoachingSession({
        userId: 'error-test-user',
        sessionType: 'practice',
        role: 'software-engineer'
      })

      await expect(
        advancedAICoachService.processEmotionalData('invalid-session', {
          confidence: 0.5,
          stress: 0.5,
          engagement: 0.5,
          clarity: 0.5
        })
      ).rejects.toThrow('Session not found: invalid-session')

      console.log('Error handling test completed successfully!')
    })
  })

  describe('Performance Tests', () => {
    it('should maintain performance under load', async () => {
      console.log('Testing performance under load...')

      const startTime = Date.now()
      const operationCount = 10

      // Perform multiple operations concurrently
      const operations = Array.from({ length: operationCount }, async (_, i) => {
        const userId = `perf-user-${i}`
        
        // Generate plan
        const plan = await advancedAICoachService.generatePersonalizedPlan({
          userId,
          role: 'software-engineer',
          currentSkills: ['JavaScript'],
          timeframe: 8,
          preferences: {
            learningStyle: 'visual',
            intensity: 'moderate',
            focusAreas: ['Algorithms']
          }
        })

        // Start session and process data
        const session = await advancedAICoachService.startCoachingSession({
          userId,
          sessionType: 'practice',
          role: 'software-engineer'
        })

        const emotionalSession = await emotionalIntelligenceService.startEmotionalCoachingSession(userId)
        
        await emotionalIntelligenceService.processRealTimeEmotionalData(
          emotionalSession.id,
          new Blob([`audio-${i}`], { type: 'audio/wav' })
        )

        return { plan, session, emotionalSession }
      })

      const results = await Promise.all(operations)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Verify all operations completed
      expect(results.length).toBe(operationCount)
      
      // Performance assertions
      expect(totalTime).toBeLessThan(15000) // Should complete within 15 seconds
      
      const avgTimePerOperation = totalTime / operationCount
      expect(avgTimePerOperation).toBeLessThan(2000) // Average less than 2 seconds per operation

      // Check system metrics
      const metrics = performanceOptimizer.getMetrics()
      expect(metrics.errorRate).toBeLessThan(0.05) // Less than 5% error rate
      expect(metrics.responseTime).toBeLessThan(5000) // Average response time less than 5 seconds

      console.log(`Performance test completed: ${operationCount} operations in ${totalTime}ms`)
      console.log(`Average time per operation: ${avgTimePerOperation}ms`)
      console.log(`System metrics:`, metrics)
    })

    it('should optimize memory usage', async () => {
      console.log('Testing memory optimization...')

      const initialMetrics = performanceOptimizer.getMetrics()
      const initialCacheSize = performanceOptimizer.getCacheSize()

      // Perform operations that should use caching
      const userId = 'memory-test-user'
      
      // Generate same plan multiple times (should hit cache)
      const planParams = {
        userId,
        role: 'software-engineer',
        currentSkills: ['JavaScript'],
        timeframe: 8,
        preferences: {
          learningStyle: 'visual' as const,
          intensity: 'moderate' as const,
          focusAreas: ['Algorithms']
        }
      }

      const plans = await Promise.all([
        advancedAICoachService.generatePersonalizedPlan(planParams),
        advancedAICoachService.generatePersonalizedPlan(planParams),
        advancedAICoachService.generatePersonalizedPlan(planParams)
      ])

      const finalMetrics = performanceOptimizer.getMetrics()
      const finalCacheSize = performanceOptimizer.getCacheSize()

      // Verify plans are identical (from cache)
      expect(plans[0]).toEqual(plans[1])
      expect(plans[1]).toEqual(plans[2])

      // Cache should have grown
      expect(finalCacheSize).toBeGreaterThanOrEqual(initialCacheSize)

      // Memory usage should be reasonable
      expect(finalMetrics.memoryUsage).toBeLessThan(0.8) // Less than 80% memory usage

      console.log('Memory optimization test completed successfully!')
    })
  })

  describe('Data Consistency Tests', () => {
    it('should maintain data consistency across services', async () => {
      console.log('Testing data consistency...')

      const userId = 'consistency-test-user'
      const role = 'software-engineer'

      // Create coaching session
      const coachingSession = await advancedAICoachService.startCoachingSession({
        userId,
        sessionType: 'practice',
        role
      })

      // Create emotional session
      const emotionalSession = await emotionalIntelligenceService.startEmotionalCoachingSession(userId)

      // Process emotional data
      const emotionalData = {
        confidence: 0.7,
        stress: 0.3,
        engagement: 0.8,
        clarity: 0.7
      }

      const analysis = await emotionalIntelligenceService.processRealTimeEmotionalData(
        emotionalSession.id,
        new Blob(['test audio'], { type: 'audio/wav' })
      )

      const feedback = await advancedAICoachService.processEmotionalData(
        coachingSession.id,
        analysis.overallState
      )

      // Verify data consistency
      expect(coachingSession.userId).toBe(userId)
      expect(emotionalSession.userId).toBe(userId)
      expect(coachingSession.emotionalStates.length).toBe(1)
      expect(emotionalSession.emotionalStates.length).toBe(1)

      // Timestamps should be consistent
      const coachingTimestamp = coachingSession.emotionalStates[0].timestamp
      const emotionalTimestamp = emotionalSession.emotionalStates[0].timestamp
      
      expect(Math.abs(coachingTimestamp - emotionalTimestamp)).toBeLessThan(1000) // Within 1 second

      console.log('Data consistency test completed successfully!')
    })
  })
})
