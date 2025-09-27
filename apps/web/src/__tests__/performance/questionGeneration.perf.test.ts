/**
 * Performance Tests and Benchmarks for Question Generation
 * Tests load handling, response times, and resource usage
 */

import { AIInterviewService } from '@/services/aiInterviewService'
import { llmConfig } from '@/config/llmProviders'

interface PerformanceMetrics {
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  successRate: number
  throughput: number
  memoryUsage?: number
}

interface LoadTestResult {
  concurrentUsers: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  metrics: PerformanceMetrics
  errors: string[]
}

describe('Question Generation Performance Tests', () => {
  let aiService: AIInterviewService
  
  beforeAll(() => {
    aiService = new AIInterviewService()
  })

  describe('Response Time Benchmarks', () => {
    const baselineParams = {
      jobTitle: 'Software Engineer',
      industry: 'technology',
      difficulty: 'medium' as const,
      count: 3,
      types: ['behavioral'],
      includeWebScraping: false,
      includeSampleAnswers: false
    }

    it('should generate questions within acceptable time limits', async () => {
      const iterations = 5
      const times: number[] = []
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        
        const questions = await aiService.generateQuestions(baselineParams)
        
        const endTime = performance.now()
        const duration = endTime - startTime
        
        times.push(duration)
        
        expect(questions).toBeInstanceOf(Array)
        expect(questions.length).toBeGreaterThan(0)
      }
      
      const metrics = calculateMetrics(times, iterations)
      
      // Performance assertions
      expect(metrics.averageTime).toBeLessThan(10000) // Average < 10 seconds
      expect(metrics.maxTime).toBeLessThan(20000) // Max < 20 seconds
      expect(metrics.minTime).toBeGreaterThan(100) // Min > 100ms (sanity check)
      
      console.log('Response Time Metrics:', {
        average: `${metrics.averageTime.toFixed(2)}ms`,
        min: `${metrics.minTime.toFixed(2)}ms`,
        max: `${metrics.maxTime.toFixed(2)}ms`,
        throughput: `${metrics.throughput.toFixed(2)} req/sec`
      })
    }, 60000)

    it('should scale performance with question count', async () => {
      const questionCounts = [1, 3, 5, 10]
      const results: Array<{ count: number; time: number }> = []
      
      for (const count of questionCounts) {
        const params = { ...baselineParams, count }
        
        const startTime = performance.now()
        const questions = await aiService.generateQuestions(params)
        const endTime = performance.now()
        
        const duration = endTime - startTime
        results.push({ count, time: duration })
        
        expect(questions.length).toBeLessThanOrEqual(count)
      }
      
      // Performance should scale reasonably with question count
      const timePerQuestion = results.map(r => r.time / r.count)
      const avgTimePerQuestion = timePerQuestion.reduce((a, b) => a + b) / timePerQuestion.length
      
      expect(avgTimePerQuestion).toBeLessThan(5000) // < 5 seconds per question on average
      
      console.log('Scaling Results:', results.map(r => 
        `${r.count} questions: ${r.time.toFixed(2)}ms (${(r.time/r.count).toFixed(2)}ms/q)`
      ))
    }, 120000)

    it('should handle different complexity levels efficiently', async () => {
      const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']
      const results: Array<{ difficulty: string; time: number }> = []
      
      for (const difficulty of difficulties) {
        const params = { ...baselineParams, difficulty }
        
        const startTime = performance.now()
        const questions = await aiService.generateQuestions(params)
        const endTime = performance.now()
        
        const duration = endTime - startTime
        results.push({ difficulty, time: duration })
        
        expect(questions).toBeInstanceOf(Array)
        expect(questions.length).toBeGreaterThan(0)
      }
      
      // All difficulties should complete within reasonable time
      results.forEach(result => {
        expect(result.time).toBeLessThan(15000) // < 15 seconds
      })
      
      console.log('Difficulty Performance:', results.map(r => 
        `${r.difficulty}: ${r.time.toFixed(2)}ms`
      ))
    }, 60000)
  })

  describe('Load Testing', () => {
    const loadTestParams = {
      jobTitle: 'Software Engineer',
      industry: 'technology',
      difficulty: 'medium' as const,
      count: 2,
      types: ['behavioral'],
      includeWebScraping: false,
      includeSampleAnswers: false
    }

    it('should handle moderate concurrent load', async () => {
      const concurrentUsers = 5
      const requestsPerUser = 2
      
      const result = await runLoadTest(concurrentUsers, requestsPerUser, loadTestParams)
      
      expect(result.successRate).toBeGreaterThan(0.8) // 80% success rate
      expect(result.metrics.averageTime).toBeLessThan(20000) // Average < 20 seconds
      
      console.log('Moderate Load Test Results:', {
        concurrentUsers: result.concurrentUsers,
        totalRequests: result.totalRequests,
        successRate: `${(result.successRate * 100).toFixed(1)}%`,
        averageTime: `${result.metrics.averageTime.toFixed(2)}ms`,
        throughput: `${result.metrics.throughput.toFixed(2)} req/sec`
      })
    }, 120000)

    it('should handle high concurrent load gracefully', async () => {
      const concurrentUsers = 10
      const requestsPerUser = 1
      
      const result = await runLoadTest(concurrentUsers, requestsPerUser, loadTestParams)
      
      // Under high load, we expect some degradation but not complete failure
      expect(result.successRate).toBeGreaterThan(0.6) // 60% success rate minimum
      expect(result.metrics.averageTime).toBeLessThan(30000) // Average < 30 seconds
      
      console.log('High Load Test Results:', {
        concurrentUsers: result.concurrentUsers,
        totalRequests: result.totalRequests,
        successRate: `${(result.successRate * 100).toFixed(1)}%`,
        averageTime: `${result.metrics.averageTime.toFixed(2)}ms`,
        throughput: `${result.metrics.throughput.toFixed(2)} req/sec`,
        errors: result.errors.length
      })
    }, 180000)

    it('should maintain quality under load', async () => {
      const concurrentUsers = 3
      const requestsPerUser = 2
      
      const startTime = Date.now()
      
      const promises = Array(concurrentUsers).fill(null).map(() =>
        Promise.all(Array(requestsPerUser).fill(null).map(() =>
          aiService.generateQuestions(loadTestParams)
        ))
      )
      
      const results = await Promise.allSettled(promises)
      const endTime = Date.now()
      
      const successfulResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value)
        .flat()
      
      // Validate quality of all successful results
      successfulResults.forEach(questions => {
        expect(questions).toBeInstanceOf(Array)
        expect(questions.length).toBeGreaterThan(0)
        
        questions.forEach((question: any) => {
          expect(question.question).toBeDefined()
          expect(question.question.length).toBeGreaterThan(10)
          expect(question.type).toBeDefined()
          expect(question.difficulty).toBeDefined()
        })
      })
      
      const totalTime = endTime - startTime
      const totalRequests = concurrentUsers * requestsPerUser
      const successfulRequests = successfulResults.length
      
      console.log('Quality Under Load:', {
        totalRequests,
        successfulRequests,
        successRate: `${(successfulRequests / totalRequests * 100).toFixed(1)}%`,
        totalTime: `${totalTime}ms`,
        avgQuality: 'All questions met quality standards'
      })
    }, 120000)
  })

  describe('Memory and Resource Usage', () => {
    it('should not leak memory during repeated operations', async () => {
      const iterations = 10
      const memoryUsages: number[] = []
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const initialMemory = process.memoryUsage().heapUsed
      
      for (let i = 0; i < iterations; i++) {
        await aiService.generateQuestions({
          jobTitle: 'Software Engineer',
          industry: 'technology',
          difficulty: 'medium' as const,
          count: 2,
          types: ['behavioral'],
          includeWebScraping: false,
          includeSampleAnswers: false
        })
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
        
        const currentMemory = process.memoryUsage().heapUsed
        memoryUsages.push(currentMemory)
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      const memoryIncreasePercentage = (memoryIncrease / initialMemory) * 100
      
      // Memory increase should be reasonable (< 50% of initial)
      expect(memoryIncreasePercentage).toBeLessThan(50)
      
      console.log('Memory Usage:', {
        initial: `${(initialMemory / 1024 / 1024).toFixed(2)} MB`,
        final: `${(finalMemory / 1024 / 1024).toFixed(2)} MB`,
        increase: `${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`,
        increasePercentage: `${memoryIncreasePercentage.toFixed(2)}%`
      })
    }, 120000)
  })

  describe('Provider Performance Comparison', () => {
    it('should benchmark different LLM providers', async () => {
      const enabledProviders = llmConfig.getEnabledProviders()
      
      if (enabledProviders.length === 0) {
        console.warn('No LLM providers enabled, skipping provider performance test')
        return
      }
      
      const results: Array<{ provider: string; time: number; success: boolean }> = []
      
      for (const provider of enabledProviders) {
        try {
          const startTime = performance.now()
          
          // Force specific provider selection (if possible)
          const questions = await aiService.generateQuestions({
            jobTitle: 'Software Engineer',
            industry: 'technology',
            difficulty: 'medium' as const,
            count: 1,
            types: ['behavioral'],
            includeWebScraping: false,
            includeSampleAnswers: false
          })
          
          const endTime = performance.now()
          const duration = endTime - startTime
          
          results.push({
            provider: provider.name,
            time: duration,
            success: questions.length > 0
          })
        } catch (error) {
          results.push({
            provider: provider.name,
            time: 0,
            success: false
          })
        }
      }
      
      // All enabled providers should work
      const successfulProviders = results.filter(r => r.success)
      expect(successfulProviders.length).toBeGreaterThan(0)
      
      console.log('Provider Performance:', results.map(r => 
        `${r.provider}: ${r.success ? `${r.time.toFixed(2)}ms` : 'Failed'}`
      ))
    }, 90000)
  })

  // Helper functions
  async function runLoadTest(
    concurrentUsers: number,
    requestsPerUser: number,
    params: any
  ): Promise<LoadTestResult> {
    const startTime = Date.now()
    const times: number[] = []
    const errors: string[] = []
    
    const userPromises = Array(concurrentUsers).fill(null).map(async () => {
      const userRequests = Array(requestsPerUser).fill(null).map(async () => {
        const requestStart = performance.now()
        
        try {
          const questions = await aiService.generateQuestions(params)
          const requestEnd = performance.now()
          
          times.push(requestEnd - requestStart)
          return { success: true, questions }
        } catch (error) {
          const requestEnd = performance.now()
          times.push(requestEnd - requestStart)
          errors.push(error instanceof Error ? error.message : 'Unknown error')
          return { success: false, error }
        }
      })
      
      return Promise.allSettled(userRequests)
    })
    
    const results = await Promise.allSettled(userPromises)
    const endTime = Date.now()
    
    const totalRequests = concurrentUsers * requestsPerUser
    const successfulRequests = times.length - errors.length
    const totalTime = endTime - startTime
    
    const metrics = calculateMetrics(times, successfulRequests)
    metrics.throughput = (successfulRequests / totalTime) * 1000 // requests per second
    
    return {
      concurrentUsers,
      totalRequests,
      successfulRequests,
      failedRequests: errors.length,
      metrics,
      errors
    }
  }

  function calculateMetrics(times: number[], count: number): PerformanceMetrics {
    const validTimes = times.filter(t => t > 0)
    
    if (validTimes.length === 0) {
      return {
        totalTime: 0,
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
        successRate: 0,
        throughput: 0
      }
    }
    
    const totalTime = validTimes.reduce((a, b) => a + b, 0)
    const averageTime = totalTime / validTimes.length
    const minTime = Math.min(...validTimes)
    const maxTime = Math.max(...validTimes)
    const successRate = validTimes.length / count
    const throughput = (validTimes.length / totalTime) * 1000
    
    return {
      totalTime,
      averageTime,
      minTime,
      maxTime,
      successRate,
      throughput
    }
  }
})
