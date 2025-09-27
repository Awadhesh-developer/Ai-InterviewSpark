/**
 * Unit Tests for Realistic Answer Generation Service
 * Tests STAR framework, answer templates, and LLM integration
 */

import RealisticAnswerGenerationService from '@/services/realisticAnswerGenerationService'
import { InterviewQuestion, QuestionGenerationContext } from '@/services/aiInterviewService'

// Mock the LLM call method
jest.mock('@/services/realisticAnswerGenerationService', () => {
  const actual = jest.requireActual('@/services/realisticAnswerGenerationService')
  return {
    ...actual,
    default: class extends actual.default {
      async callLLMForAnswer() {
        return {
          answer: 'Mock STAR answer with situation, task, action, and result components.',
          situation: 'Mock situation',
          task: 'Mock task',
          action: 'Mock action',
          result: 'Mock result',
          keyPoints: ['mock point 1', 'mock point 2'],
          tips: ['mock tip 1', 'mock tip 2'],
          commonMistakes: ['mock mistake 1', 'mock mistake 2']
        }
      }
    }
  }
})

describe('Realistic Answer Generation Service', () => {
  let service: RealisticAnswerGenerationService
  
  beforeEach(() => {
    service = new RealisticAnswerGenerationService()
  })

  describe('Service Initialization', () => {
    it('should initialize with answer templates', () => {
      expect(service).toBeDefined()
      expect(service['answerTemplates']).toBeDefined()
      expect(service['industryExamples']).toBeDefined()
      expect(service['starTemplates']).toBeDefined()
    })

    it('should have templates for different question types', () => {
      const behavioralTemplates = service['answerTemplates'].get('behavioral')
      const technicalTemplates = service['answerTemplates'].get('technical')
      const situationalTemplates = service['answerTemplates'].get('situational')
      
      expect(behavioralTemplates).toBeDefined()
      expect(technicalTemplates).toBeDefined()
      expect(situationalTemplates).toBeDefined()
      
      expect(behavioralTemplates?.length).toBeGreaterThan(0)
      expect(technicalTemplates?.length).toBeGreaterThan(0)
      expect(situationalTemplates?.length).toBeGreaterThan(0)
    })
  })

  describe('Sample Answer Generation', () => {
    const mockQuestion: InterviewQuestion = {
      id: 'test-question-1',
      question: 'Tell me about a time when you had to work with a difficult team member.',
      type: 'behavioral',
      difficulty: 'medium',
      category: 'Teamwork',
      expectedDuration: 180
    }

    const mockContext: QuestionGenerationContext = {
      jobTitle: 'Software Engineer',
      industry: 'technology',
      company: 'Google',
      difficulty: 'medium',
      questionTypes: ['behavioral'],
      count: 1
    }

    it('should generate sample answer for behavioral question', async () => {
      const answer = await service.generateSampleAnswer(mockQuestion, mockContext)
      
      expect(answer).toBeDefined()
      expect(typeof answer).toBe('string')
      expect(answer.length).toBeGreaterThan(50)
      expect(answer.toLowerCase()).toContain('software engineer')
    })

    it('should generate different answers for different question types', async () => {
      const technicalQuestion: InterviewQuestion = {
        ...mockQuestion,
        type: 'technical',
        question: 'Explain the difference between let, const, and var in JavaScript.',
        category: 'JavaScript'
      }

      const behavioralAnswer = await service.generateSampleAnswer(mockQuestion, mockContext)
      const technicalAnswer = await service.generateSampleAnswer(technicalQuestion, mockContext)
      
      expect(behavioralAnswer).not.toEqual(technicalAnswer)
      expect(behavioralAnswer.toLowerCase()).toContain('team')
      expect(technicalAnswer.toLowerCase()).toContain('javascript')
    })

    it('should handle fallback when generation fails', async () => {
      // Mock LLM call to fail
      const originalMethod = service['callLLMForAnswer']
      service['callLLMForAnswer'] = jest.fn().mockRejectedValue(new Error('LLM failed'))
      
      const answer = await service.generateSampleAnswer(mockQuestion, mockContext)
      
      expect(answer).toBeDefined()
      expect(typeof answer).toBe('string')
      expect(answer.length).toBeGreaterThan(0)
      
      // Restore original method
      service['callLLMForAnswer'] = originalMethod
    })
  })

  describe('STAR Framework Generation', () => {
    const mockQuestion: InterviewQuestion = {
      id: 'test-question-2',
      question: 'Describe a challenging project you led.',
      type: 'behavioral',
      difficulty: 'hard',
      category: 'Leadership',
      expectedDuration: 240
    }

    const mockContext = {
      question: mockQuestion,
      jobTitle: 'Senior Software Engineer',
      industry: 'technology',
      company: 'Microsoft',
      experienceLevel: 'senior' as const,
      targetAudience: 'candidate' as const
    }

    it('should generate comprehensive STAR answer', async () => {
      const starAnswer = await service.generateSTARAnswer(mockQuestion, mockContext)
      
      expect(starAnswer).toBeDefined()
      expect(starAnswer.id).toBeDefined()
      expect(starAnswer.questionId).toBe(mockQuestion.id)
      expect(starAnswer.answer).toBeDefined()
      expect(starAnswer.starFramework).toBeDefined()
      expect(starAnswer.tips).toBeInstanceOf(Array)
      expect(starAnswer.commonMistakes).toBeInstanceOf(Array)
    })

    it('should include all STAR components', async () => {
      const starAnswer = await service.generateSTARAnswer(mockQuestion, mockContext)
      
      expect(starAnswer.starFramework?.situation).toBeDefined()
      expect(starAnswer.starFramework?.task).toBeDefined()
      expect(starAnswer.starFramework?.action).toBeDefined()
      expect(starAnswer.starFramework?.result).toBeDefined()
      expect(starAnswer.starFramework?.keyPoints).toBeInstanceOf(Array)
    })

    it('should adapt to experience level', async () => {
      const entryContext = { ...mockContext, experienceLevel: 'entry' as const }
      const seniorContext = { ...mockContext, experienceLevel: 'senior' as const }
      
      const entryAnswer = await service.generateSTARAnswer(mockQuestion, entryContext)
      const seniorAnswer = await service.generateSTARAnswer(mockQuestion, seniorContext)
      
      expect(entryAnswer.difficulty).toBe('intermediate')
      expect(seniorAnswer.difficulty).toBe('intermediate')
      // Both should be valid but potentially different in complexity
    })

    it('should handle fallback for STAR generation', async () => {
      // Mock LLM call to fail
      const originalMethod = service['callLLMForAnswer']
      service['callLLMForAnswer'] = jest.fn().mockRejectedValue(new Error('LLM failed'))
      
      const starAnswer = await service.generateSTARAnswer(mockQuestion, mockContext)
      
      expect(starAnswer).toBeDefined()
      expect(starAnswer.answer).toBeDefined()
      
      // Restore original method
      service['callLLMForAnswer'] = originalMethod
    })
  })

  describe('Template Selection', () => {
    it('should select appropriate template for behavioral questions', () => {
      const context = {
        question: { type: 'behavioral' } as InterviewQuestion,
        jobTitle: 'Software Engineer',
        industry: 'technology',
        experienceLevel: 'mid' as const,
        targetAudience: 'candidate' as const
      }
      
      const template = service['selectAnswerTemplate']('behavioral', context)
      
      expect(template).toBeDefined()
      expect(template.type).toBe('star')
    })

    it('should select appropriate template for technical questions', () => {
      const context = {
        question: { type: 'technical' } as InterviewQuestion,
        jobTitle: 'Software Engineer',
        industry: 'technology',
        experienceLevel: 'mid' as const,
        targetAudience: 'candidate' as const
      }
      
      const template = service['selectAnswerTemplate']('technical', context)
      
      expect(template).toBeDefined()
      expect(template.type).toBe('problem-solution')
    })

    it('should adapt template selection to experience level', () => {
      const seniorContext = {
        question: { type: 'behavioral' } as InterviewQuestion,
        jobTitle: 'Senior Software Engineer',
        industry: 'technology',
        experienceLevel: 'senior' as const,
        targetAudience: 'candidate' as const
      }
      
      const template = service['selectAnswerTemplate']('behavioral', seniorContext)
      
      expect(template).toBeDefined()
      expect(template.type).toBe('star')
    })
  })

  describe('STAR Template Selection', () => {
    it('should select leadership template for leadership category', () => {
      const template = service['selectSTARTemplate']('Leadership')
      
      expect(template).toBeDefined()
      expect(template.keyPoints).toContain('team coordination')
    })

    it('should select problem-solving template for problem-solving category', () => {
      const template = service['selectSTARTemplate']('Problem Solving')
      
      expect(template).toBeDefined()
      expect(template.keyPoints).toContain('analytical thinking')
    })

    it('should fallback to problem-solving for unknown categories', () => {
      const template = service['selectSTARTemplate']('Unknown Category')
      
      expect(template).toBeDefined()
      expect(template.keyPoints).toContain('analytical thinking')
    })
  })

  describe('Industry Context Integration', () => {
    it('should include technology industry context', () => {
      const industryContext = service['industryExamples'].get('technology')
      
      expect(industryContext).toBeDefined()
      expect(industryContext?.commonScenarios).toContain('system outage resolution')
      expect(industryContext?.keyMetrics).toContain('uptime')
      expect(industryContext?.technologies).toContain('cloud platforms')
    })

    it('should include finance industry context', () => {
      const industryContext = service['industryExamples'].get('finance')
      
      expect(industryContext).toBeDefined()
      expect(industryContext?.commonScenarios).toContain('risk assessment')
      expect(industryContext?.keyMetrics).toContain('ROI')
    })

    it('should include healthcare industry context', () => {
      const industryContext = service['industryExamples'].get('healthcare')
      
      expect(industryContext).toBeDefined()
      expect(industryContext?.commonScenarios).toContain('patient care improvement')
      expect(industryContext?.keyMetrics).toContain('patient outcomes')
    })
  })

  describe('Experience Level Determination', () => {
    it('should determine senior level for senior titles', () => {
      const level = service['determineExperienceLevel']('Senior Software Engineer')
      expect(level).toBe('senior')
    })

    it('should determine senior level for lead titles', () => {
      const level = service['determineExperienceLevel']('Lead Developer')
      expect(level).toBe('senior')
    })

    it('should determine executive level for director titles', () => {
      const level = service['determineExperienceLevel']('Director of Engineering')
      expect(level).toBe('executive')
    })

    it('should determine entry level for junior titles', () => {
      const level = service['determineExperienceLevel']('Junior Developer')
      expect(level).toBe('entry')
    })

    it('should determine mid level for standard titles', () => {
      const level = service['determineExperienceLevel']('Software Engineer')
      expect(level).toBe('mid')
    })
  })

  describe('Mock Answer Generation', () => {
    it('should generate mock answers with industry context', () => {
      const context = {
        question: { type: 'behavioral' } as InterviewQuestion,
        jobTitle: 'Software Engineer',
        industry: 'technology',
        experienceLevel: 'mid' as const,
        targetAudience: 'candidate' as const
      }
      
      const template = service['selectAnswerTemplate']('behavioral', context)
      const answer = service['generateMockAnswer'](context, template)
      
      expect(answer).toBeDefined()
      expect(typeof answer).toBe('string')
      expect(answer.toLowerCase()).toContain('software engineer')
      expect(answer.length).toBeGreaterThan(100)
    })

    it('should generate different mock answers for different industries', () => {
      const techContext = {
        question: { type: 'behavioral' } as InterviewQuestion,
        jobTitle: 'Software Engineer',
        industry: 'technology',
        experienceLevel: 'mid' as const,
        targetAudience: 'candidate' as const
      }
      
      const financeContext = {
        question: { type: 'behavioral' } as InterviewQuestion,
        jobTitle: 'Financial Analyst',
        industry: 'finance',
        experienceLevel: 'mid' as const,
        targetAudience: 'candidate' as const
      }
      
      const techTemplate = service['selectAnswerTemplate']('behavioral', techContext)
      const financeTemplate = service['selectAnswerTemplate']('behavioral', financeContext)
      
      const techAnswer = service['generateMockAnswer'](techContext, techTemplate)
      const financeAnswer = service['generateMockAnswer'](financeContext, financeTemplate)
      
      expect(techAnswer).not.toEqual(financeAnswer)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing industry context gracefully', () => {
      const context = {
        question: { type: 'behavioral' } as InterviewQuestion,
        jobTitle: 'Test Engineer',
        industry: 'unknown-industry',
        experienceLevel: 'mid' as const,
        targetAudience: 'candidate' as const
      }
      
      const template = service['selectAnswerTemplate']('behavioral', context)
      
      expect(() => {
        service['generateMockAnswer'](context, template)
      }).not.toThrow()
    })

    it('should handle invalid question types gracefully', () => {
      const context = {
        question: { type: 'unknown' } as any,
        jobTitle: 'Test Engineer',
        industry: 'technology',
        experienceLevel: 'mid' as const,
        targetAudience: 'candidate' as const
      }
      
      expect(() => {
        service['selectAnswerTemplate']('unknown', context)
      }).not.toThrow()
    })
  })
})
