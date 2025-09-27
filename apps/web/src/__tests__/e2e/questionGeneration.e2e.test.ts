/**
 * End-to-End Tests for Question Generation
 * Tests the complete flow from request to enhanced response
 */

import { AIInterviewService } from '@/services/aiInterviewService'
import { llmConfig } from '@/config/llmProviders'
import { questionGenerationConfig } from '@/config/questionGeneration'

describe('Question Generation End-to-End Tests', () => {
  let aiService: AIInterviewService
  
  beforeAll(() => {
    aiService = new AIInterviewService()
  })

  describe('Complete Question Generation Flow', () => {
    const testScenarios = [
      {
        name: 'Software Engineer at Tech Company',
        params: {
          jobTitle: 'Software Engineer',
          industry: 'technology',
          company: 'Google',
          difficulty: 'medium' as const,
          count: 3,
          types: ['behavioral', 'technical'],
          jobDescription: 'Senior software engineer role focusing on backend systems',
          includeWebScraping: true,
          includeSampleAnswers: true
        },
        expectedQuestionTypes: ['behavioral', 'technical'],
        expectedFeatures: ['source', 'freshnessScore', 'relevanceScore']
      },
      {
        name: 'Product Manager at Startup',
        params: {
          jobTitle: 'Product Manager',
          industry: 'technology',
          company: 'StartupCo',
          difficulty: 'hard' as const,
          count: 2,
          types: ['behavioral', 'situational'],
          includeWebScraping: false,
          includeSampleAnswers: false
        },
        expectedQuestionTypes: ['behavioral', 'situational'],
        expectedFeatures: ['source', 'relevanceScore']
      },
      {
        name: 'Financial Analyst at Bank',
        params: {
          jobTitle: 'Financial Analyst',
          industry: 'finance',
          company: 'JPMorgan',
          difficulty: 'easy' as const,
          count: 4,
          types: ['behavioral'],
          includeWebScraping: true,
          includeSampleAnswers: true
        },
        expectedQuestionTypes: ['behavioral'],
        expectedFeatures: ['source', 'freshnessScore', 'sampleAnswer']
      }
    ]

    testScenarios.forEach(scenario => {
      it(`should generate enhanced questions for ${scenario.name}`, async () => {
        const questions = await aiService.generateQuestions(scenario.params)
        
        // Basic validation
        expect(questions).toBeInstanceOf(Array)
        expect(questions.length).toBeGreaterThan(0)
        expect(questions.length).toBeLessThanOrEqual(scenario.params.count)
        
        // Question structure validation
        questions.forEach(question => {
          expect(question).toHaveProperty('id')
          expect(question).toHaveProperty('question')
          expect(question).toHaveProperty('type')
          expect(question).toHaveProperty('difficulty')
          expect(question).toHaveProperty('category')
          expect(question).toHaveProperty('expectedDuration')
          
          // Enhanced features validation
          scenario.expectedFeatures.forEach(feature => {
            expect(question).toHaveProperty(feature)
          })
          
          // Question type validation
          expect(scenario.expectedQuestionTypes).toContain(question.type)
          
          // Quality validation
          expect(question.question.length).toBeGreaterThan(10)
          expect(question.question.endsWith('?')).toBe(true)
        })
        
        // Sample answers validation (if requested)
        if (scenario.params.includeSampleAnswers) {
          questions.forEach(question => {
            expect(question).toHaveProperty('sampleAnswer')
            expect(question.sampleAnswer).toBeDefined()
            expect(question.sampleAnswer!.length).toBeGreaterThan(50)
          })
        }
        
        // Enhanced metadata validation
        questions.forEach(question => {
          if (question.source) {
            expect(['ai-generated', 'scraped', 'curated']).toContain(question.source)
          }
          
          if (question.freshnessScore !== undefined) {
            expect(question.freshnessScore).toBeGreaterThanOrEqual(0)
            expect(question.freshnessScore).toBeLessThanOrEqual(1)
          }
          
          if (question.relevanceScore !== undefined) {
            expect(question.relevanceScore).toBeGreaterThanOrEqual(0)
            expect(question.relevanceScore).toBeLessThanOrEqual(1)
          }
        })
      }, 60000) // 60 second timeout for complete flow
    })
  })

  describe('Configuration Integration', () => {
    it('should respect LLM provider configuration', async () => {
      const config = llmConfig.getConfiguration()
      const enabledProviders = llmConfig.getEnabledProviders()
      
      if (enabledProviders.length === 0) {
        console.warn('No LLM providers enabled, skipping provider integration test')
        return
      }
      
      const params = {
        jobTitle: 'Software Engineer',
        industry: 'technology',
        difficulty: 'medium' as const,
        count: 1,
        types: ['behavioral']
      }
      
      const questions = await aiService.generateQuestions(params)
      
      expect(questions).toBeInstanceOf(Array)
      expect(questions.length).toBeGreaterThan(0)
      
      // Should have LLM provider metadata if available
      if (questions[0].llmProvider) {
        expect(enabledProviders.some(p => p.name === questions[0].llmProvider)).toBe(true)
      }
    })

    it('should respect question generation configuration', async () => {
      const config = questionGenerationConfig.getConfiguration()
      
      const params = {
        jobTitle: 'Data Scientist',
        industry: 'technology',
        difficulty: 'medium' as const,
        count: 2,
        types: ['technical'],
        includeWebScraping: config.webScraping.enabled,
        includeSampleAnswers: config.quality.enableSampleAnswers
      }
      
      const questions = await aiService.generateQuestions(params)
      
      expect(questions).toBeInstanceOf(Array)
      expect(questions.length).toBeGreaterThan(0)
      
      // Validate configuration compliance
      if (config.quality.enableSampleAnswers && params.includeSampleAnswers) {
        questions.forEach(question => {
          expect(question).toHaveProperty('sampleAnswer')
        })
      }
    })
  })

  describe('Performance and Reliability', () => {
    it('should complete question generation within reasonable time', async () => {
      const startTime = Date.now()
      
      const params = {
        jobTitle: 'Software Engineer',
        industry: 'technology',
        difficulty: 'medium' as const,
        count: 5,
        types: ['behavioral', 'technical'],
        includeWebScraping: false, // Disable to focus on LLM performance
        includeSampleAnswers: false
      }
      
      const questions = await aiService.generateQuestions(params)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(questions).toBeInstanceOf(Array)
      expect(questions.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(30000) // Should complete within 30 seconds
    }, 35000)

    it('should handle concurrent requests efficiently', async () => {
      const params = {
        jobTitle: 'Product Manager',
        industry: 'technology',
        difficulty: 'medium' as const,
        count: 2,
        types: ['behavioral'],
        includeWebScraping: false,
        includeSampleAnswers: false
      }
      
      const startTime = Date.now()
      
      // Make 3 concurrent requests
      const promises = Array(3).fill(null).map(() => 
        aiService.generateQuestions(params)
      )
      
      const results = await Promise.all(promises)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // All requests should succeed
      results.forEach(questions => {
        expect(questions).toBeInstanceOf(Array)
        expect(questions.length).toBeGreaterThan(0)
      })
      
      // Should complete within reasonable time even with concurrent requests
      expect(duration).toBeLessThan(45000) // 45 seconds for 3 concurrent requests
    }, 50000)

    it('should maintain quality under load', async () => {
      const params = {
        jobTitle: 'Software Engineer',
        industry: 'technology',
        difficulty: 'medium' as const,
        count: 3,
        types: ['behavioral'],
        includeWebScraping: false,
        includeSampleAnswers: false
      }
      
      // Generate multiple batches
      const batches = await Promise.all([
        aiService.generateQuestions(params),
        aiService.generateQuestions(params),
        aiService.generateQuestions(params)
      ])
      
      // Validate quality across all batches
      batches.forEach(questions => {
        expect(questions).toBeInstanceOf(Array)
        expect(questions.length).toBeGreaterThan(0)
        
        questions.forEach(question => {
          expect(question.question.length).toBeGreaterThan(10)
          expect(question.question.trim()).toBe(question.question)
          expect(question.type).toBeDefined()
          expect(question.difficulty).toBeDefined()
        })
      })
      
      // Questions should be diverse across batches
      const allQuestions = batches.flat().map(q => q.question)
      const uniqueQuestions = new Set(allQuestions)
      expect(uniqueQuestions.size).toBeGreaterThan(allQuestions.length * 0.7) // At least 70% unique
    }, 60000)
  })

  describe('Error Recovery and Fallbacks', () => {
    it('should handle service failures gracefully', async () => {
      // Test with minimal configuration to trigger potential fallbacks
      const params = {
        jobTitle: 'Test Engineer',
        industry: 'unknown',
        difficulty: 'medium' as const,
        count: 1,
        types: ['behavioral'],
        includeWebScraping: false,
        includeSampleAnswers: false
      }
      
      const questions = await aiService.generateQuestions(params)
      
      // Should still return questions even with unknown industry
      expect(questions).toBeInstanceOf(Array)
      expect(questions.length).toBeGreaterThan(0)
      
      questions.forEach(question => {
        expect(question.question).toBeDefined()
        expect(question.type).toBeDefined()
        expect(question.difficulty).toBeDefined()
      })
    })

    it('should validate input parameters', async () => {
      const invalidParams = {
        jobTitle: '',
        industry: '',
        difficulty: 'invalid' as any,
        count: 0,
        types: []
      }
      
      // Should handle invalid parameters gracefully
      const questions = await aiService.generateQuestions(invalidParams)
      
      expect(questions).toBeInstanceOf(Array)
      // May return empty array or fallback questions
    })
  })

  describe('Data Quality and Consistency', () => {
    it('should generate contextually relevant questions', async () => {
      const techParams = {
        jobTitle: 'Software Engineer',
        industry: 'technology',
        difficulty: 'medium' as const,
        count: 3,
        types: ['technical'],
        includeWebScraping: false,
        includeSampleAnswers: false
      }
      
      const questions = await aiService.generateQuestions(techParams)
      
      expect(questions).toBeInstanceOf(Array)
      expect(questions.length).toBeGreaterThan(0)
      
      // Technical questions should contain technical terms
      const allQuestions = questions.map(q => q.question.toLowerCase()).join(' ')
      const technicalTerms = ['code', 'algorithm', 'system', 'design', 'implement', 'debug', 'optimize', 'architecture']
      const hasRelevantTerms = technicalTerms.some(term => allQuestions.includes(term))
      
      expect(hasRelevantTerms).toBe(true)
    })

    it('should maintain consistent difficulty levels', async () => {
      const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']
      
      for (const difficulty of difficulties) {
        const params = {
          jobTitle: 'Software Engineer',
          industry: 'technology',
          difficulty,
          count: 2,
          types: ['behavioral'],
          includeWebScraping: false,
          includeSampleAnswers: false
        }
        
        const questions = await aiService.generateQuestions(params)
        
        expect(questions).toBeInstanceOf(Array)
        expect(questions.length).toBeGreaterThan(0)
        
        // All questions should match requested difficulty
        questions.forEach(question => {
          expect(question.difficulty).toBe(difficulty)
        })
      }
    }, 45000)
  })
})
