/**
 * Unit Tests for Enhanced AI Interview Service
 * Tests the main service orchestration and integration
 */

import { AIInterviewService } from '@/services/aiInterviewService'

// Mock the dependencies
jest.mock('@/services/webScrapingIntelligenceService')
jest.mock('@/services/realisticAnswerGenerationService')

// Mock LLM services
const mockLLMService = {
  selectOptimalProvider: jest.fn(),
  generateQuestionsWithLLM: jest.fn()
}

const mockWebScrapingService = {
  getIndustryTrends: jest.fn(),
  getCompanyInsights: jest.fn(),
  getCompanySpecificQuestions: jest.fn()
}

const mockAnswerGenerationService = {
  generateSampleAnswer: jest.fn()
}

const mockQualityAssuranceService = {
  processQuestions: jest.fn()
}

describe('Enhanced AI Interview Service', () => {
  let service: AIInterviewService
  
  beforeEach(() => {
    service = new AIInterviewService()
    
    // Mock the private services
    service['llmService'] = mockLLMService as any
    service['webScrapingService'] = mockWebScrapingService as any
    service['answerGenerationService'] = mockAnswerGenerationService as any
    service['qualityAssuranceService'] = mockQualityAssuranceService as any
    
    // Reset all mocks
    jest.clearAllMocks()
  })

  describe('Enhanced Question Generation', () => {
    const mockParams = {
      jobTitle: 'Software Engineer',
      industry: 'technology',
      company: 'Google',
      difficulty: 'medium' as const,
      count: 5,
      types: ['behavioral', 'technical'],
      jobDescription: 'Senior software engineer role',
      includeWebScraping: true,
      includeSampleAnswers: true
    }

    beforeEach(() => {
      // Setup default mock responses
      mockWebScrapingService.getIndustryTrends.mockResolvedValue([
        'AI/Machine Learning',
        'Cloud Computing',
        'DevOps'
      ])
      
      mockWebScrapingService.getCompanyInsights.mockResolvedValue({
        companyName: 'Google',
        culture: ['Innovation', 'Collaboration'],
        values: ['Focus on the user', 'Think big'],
        recentNews: ['AI advancements'],
        interviewStyle: 'behavioral-technical-mix',
        commonQuestions: ['Why Google?']
      })
      
      mockLLMService.selectOptimalProvider.mockReturnValue({
        name: 'openai',
        model: 'gpt-4-turbo-preview',
        enabled: true
      })
      
      mockLLMService.generateQuestionsWithLLM.mockResolvedValue([
        {
          id: 'q1',
          question: 'Tell me about a challenging project you worked on.',
          type: 'behavioral',
          difficulty: 'medium',
          category: 'Problem Solving',
          expectedDuration: 180,
          source: 'ai-generated',
          freshnessScore: 0.9,
          relevanceScore: 0.85
        }
      ])
      
      mockWebScrapingService.getCompanySpecificQuestions.mockResolvedValue([
        {
          id: 'q2',
          question: 'How do you handle Google\'s fast-paced environment?',
          type: 'company-specific',
          difficulty: 'medium',
          category: 'Culture Fit',
          expectedDuration: 120,
          source: 'scraped',
          freshnessScore: 0.8,
          relevanceScore: 0.9,
          companySpecific: true
        }
      ])
      
      mockQualityAssuranceService.processQuestions.mockImplementation(questions => 
        Promise.resolve(questions)
      )
      
      mockAnswerGenerationService.generateSampleAnswer.mockResolvedValue(
        'Sample STAR method answer for the question.'
      )
    })

    it('should generate enhanced questions with all features', async () => {
      const questions = await service.generateQuestions(mockParams)
      
      expect(questions).toBeInstanceOf(Array)
      expect(questions.length).toBeGreaterThan(0)
      
      // Verify web scraping was called
      expect(mockWebScrapingService.getIndustryTrends).toHaveBeenCalledWith('technology')
      expect(mockWebScrapingService.getCompanyInsights).toHaveBeenCalledWith('Google')
      
      // Verify LLM generation was called
      expect(mockLLMService.selectOptimalProvider).toHaveBeenCalled()
      expect(mockLLMService.generateQuestionsWithLLM).toHaveBeenCalled()
      
      // Verify quality assurance was applied
      expect(mockQualityAssuranceService.processQuestions).toHaveBeenCalled()
    })

    it('should include sample answers when requested', async () => {
      const questions = await service.generateQuestions(mockParams)
      
      expect(mockAnswerGenerationService.generateSampleAnswer).toHaveBeenCalled()
      expect(questions[0]).toHaveProperty('sampleAnswer')
    })

    it('should skip sample answers when not requested', async () => {
      const paramsWithoutAnswers = { ...mockParams, includeSampleAnswers: false }
      
      await service.generateQuestions(paramsWithoutAnswers)
      
      expect(mockAnswerGenerationService.generateSampleAnswer).not.toHaveBeenCalled()
    })

    it('should skip web scraping when disabled', async () => {
      const paramsWithoutScraping = { ...mockParams, includeWebScraping: false }
      
      await service.generateQuestions(paramsWithoutScraping)
      
      expect(mockWebScrapingService.getIndustryTrends).not.toHaveBeenCalled()
      expect(mockWebScrapingService.getCompanyInsights).not.toHaveBeenCalled()
    })

    it('should handle web scraping failures gracefully', async () => {
      mockWebScrapingService.getIndustryTrends.mockRejectedValue(new Error('Scraping failed'))
      mockWebScrapingService.getCompanyInsights.mockRejectedValue(new Error('Scraping failed'))
      
      const questions = await service.generateQuestions(mockParams)
      
      expect(questions).toBeInstanceOf(Array)
      expect(questions.length).toBeGreaterThan(0)
    })

    it('should handle LLM generation failures with fallback', async () => {
      mockLLMService.generateQuestionsWithLLM.mockRejectedValue(new Error('LLM failed'))
      
      const questions = await service.generateQuestions(mockParams)
      
      // Should fallback to basic question generation
      expect(questions).toBeInstanceOf(Array)
    })

    it('should limit questions to requested count', async () => {
      const paramsWithLimit = { ...mockParams, count: 3 }
      
      // Mock more questions than requested
      mockLLMService.generateQuestionsWithLLM.mockResolvedValue(
        Array(10).fill(null).map((_, i) => ({
          id: `q${i}`,
          question: `Question ${i}`,
          type: 'behavioral',
          difficulty: 'medium',
          category: 'Test',
          expectedDuration: 120,
          source: 'ai-generated',
          freshnessScore: 0.8,
          relevanceScore: 0.8
        }))
      )
      
      const questions = await service.generateQuestions(paramsWithLimit)
      
      expect(questions.length).toBeLessThanOrEqual(3)
    })
  })

  describe('Question Type Distribution', () => {
    it('should generate questions for each requested type', async () => {
      const params = {
        jobTitle: 'Software Engineer',
        industry: 'technology',
        difficulty: 'medium' as const,
        count: 4,
        types: ['behavioral', 'technical'],
        includeWebScraping: false,
        includeSampleAnswers: false
      }
      
      // Mock different questions for different types
      mockLLMService.generateQuestionsWithLLM
        .mockResolvedValueOnce([
          {
            id: 'b1',
            question: 'Behavioral question',
            type: 'behavioral',
            difficulty: 'medium',
            category: 'Teamwork',
            expectedDuration: 180,
            source: 'ai-generated',
            freshnessScore: 0.9,
            relevanceScore: 0.85
          }
        ])
        .mockResolvedValueOnce([
          {
            id: 't1',
            question: 'Technical question',
            type: 'technical',
            difficulty: 'medium',
            category: 'Programming',
            expectedDuration: 240,
            source: 'ai-generated',
            freshnessScore: 0.9,
            relevanceScore: 0.85
          }
        ])
      
      const questions = await service.generateQuestions(params)
      
      expect(mockLLMService.generateQuestionsWithLLM).toHaveBeenCalledTimes(2)
      expect(questions.some(q => q.type === 'behavioral')).toBe(true)
      expect(questions.some(q => q.type === 'technical')).toBe(true)
    })
  })

  describe('Provider Selection', () => {
    it('should select optimal provider for each question type', async () => {
      const params = {
        jobTitle: 'Software Engineer',
        industry: 'technology',
        difficulty: 'medium' as const,
        count: 2,
        types: ['behavioral', 'technical'],
        includeWebScraping: false,
        includeSampleAnswers: false
      }
      
      await service.generateQuestions(params)
      
      expect(mockLLMService.selectOptimalProvider).toHaveBeenCalledWith('behavioral', 'medium')
      expect(mockLLMService.selectOptimalProvider).toHaveBeenCalledWith('technical', 'medium')
    })

    it('should handle missing provider gracefully', async () => {
      mockLLMService.selectOptimalProvider.mockReturnValue(null)
      
      const params = {
        jobTitle: 'Software Engineer',
        industry: 'technology',
        difficulty: 'medium' as const,
        count: 1,
        types: ['behavioral'],
        includeWebScraping: false,
        includeSampleAnswers: false
      }
      
      const questions = await service.generateQuestions(params)
      
      // Should still return questions (fallback)
      expect(questions).toBeInstanceOf(Array)
    })
  })

  describe('Error Handling and Fallbacks', () => {
    it('should handle complete service failure with fallback', async () => {
      // Mock all services to fail
      mockLLMService.generateQuestionsWithLLM.mockRejectedValue(new Error('LLM failed'))
      mockWebScrapingService.getIndustryTrends.mockRejectedValue(new Error('Scraping failed'))
      mockQualityAssuranceService.processQuestions.mockRejectedValue(new Error('QA failed'))
      
      const params = {
        jobTitle: 'Software Engineer',
        industry: 'technology',
        difficulty: 'medium' as const,
        count: 1,
        types: ['behavioral']
      }
      
      const questions = await service.generateQuestions(params)
      
      // Should return fallback questions
      expect(questions).toBeInstanceOf(Array)
      expect(questions.length).toBeGreaterThan(0)
    })

    it('should handle invalid parameters gracefully', async () => {
      const invalidParams = {
        jobTitle: '',
        industry: '',
        difficulty: 'invalid' as any,
        count: -1,
        types: []
      }
      
      const questions = await service.generateQuestions(invalidParams)
      
      expect(questions).toBeInstanceOf(Array)
    })
  })

  describe('Context Building', () => {
    it('should build comprehensive context for LLM generation', async () => {
      const params = {
        jobTitle: 'Product Manager',
        industry: 'finance',
        company: 'JPMorgan',
        difficulty: 'hard' as const,
        count: 3,
        types: ['behavioral'],
        jobDescription: 'Senior PM role',
        includeWebScraping: true
      }
      
      await service.generateQuestions(params)
      
      // Verify context was built with all available information
      const callArgs = mockLLMService.generateQuestionsWithLLM.mock.calls[0]
      const context = callArgs[1]
      
      expect(context.jobTitle).toBe('Product Manager')
      expect(context.industry).toBe('finance')
      expect(context.company).toBe('JPMorgan')
      expect(context.difficulty).toBe('hard')
      expect(context.jobDescription).toBe('Senior PM role')
      expect(context.recentTrends).toBeDefined()
      expect(context.companyInsights).toBeDefined()
    })
  })

  describe('Performance Considerations', () => {
    it('should handle concurrent question generation efficiently', async () => {
      const params = {
        jobTitle: 'Software Engineer',
        industry: 'technology',
        difficulty: 'medium' as const,
        count: 10,
        types: ['behavioral', 'technical', 'situational'],
        includeWebScraping: true,
        includeSampleAnswers: true
      }
      
      const startTime = Date.now()
      const questions = await service.generateQuestions(params)
      const endTime = Date.now()
      
      expect(questions).toBeInstanceOf(Array)
      expect(endTime - startTime).toBeLessThan(10000) // Should complete within 10 seconds
    })
  })
})
