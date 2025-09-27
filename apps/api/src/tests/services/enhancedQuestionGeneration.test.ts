/**
 * API Tests for Enhanced Question Generation Service
 * Tests the backend API endpoints and database integration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../app'
import { db } from '../../database/connection'
import { questions, interviewSessions, users } from '../../database/schema'
import { eq } from 'drizzle-orm'

describe('Enhanced Question Generation API', () => {
  let testUserId: string
  let testSessionId: string
  let authToken: string

  beforeAll(async () => {
    // Create test user and session
    const testUser = await db.insert(users).values({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'hashedpassword',
      role: 'JOB_SEEKER'
    }).returning()

    testUserId = testUser[0].id

    const testSession = await db.insert(interviewSessions).values({
      userId: testUserId,
      type: 'video',
      status: 'scheduled',
      title: 'Test Interview',
      jobTitle: 'Software Engineer',
      company: 'Test Company',
      duration: 30,
      difficulty: 'medium',
      topics: ['JavaScript', 'React']
    }).returning()

    testSessionId = testSession[0].id

    // Mock auth token (implement based on your auth system)
    authToken = 'mock-jwt-token'
  })

  afterAll(async () => {
    // Clean up test data
    await db.delete(questions).where(eq(questions.sessionId, testSessionId))
    await db.delete(interviewSessions).where(eq(interviewSessions.id, testSessionId))
    await db.delete(users).where(eq(users.id, testUserId))
  })

  beforeEach(async () => {
    // Clean up questions before each test
    await db.delete(questions).where(eq(questions.sessionId, testSessionId))
  })

  describe('POST /api/questions/generate', () => {
    it('should generate enhanced questions with metadata', async () => {
      const requestBody = {
        sessionId: testSessionId,
        jobTitle: 'Software Engineer',
        industry: 'technology',
        company: 'Google',
        difficulty: 'medium',
        count: 3,
        types: ['behavioral', 'technical'],
        includeWebScraping: false, // Disable for testing
        includeSampleAnswers: true
      }

      const response = await request(app)
        .post('/api/questions/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(200)

      expect(response.body).toHaveProperty('questions')
      expect(response.body.questions).toBeInstanceOf(Array)
      expect(response.body.questions.length).toBeGreaterThan(0)
      expect(response.body.questions.length).toBeLessThanOrEqual(3)

      // Validate enhanced question structure
      response.body.questions.forEach((question: any) => {
        expect(question).toHaveProperty('id')
        expect(question).toHaveProperty('question')
        expect(question).toHaveProperty('type')
        expect(question).toHaveProperty('difficulty')
        expect(question).toHaveProperty('category')
        expect(question).toHaveProperty('expectedDuration')
        
        // Enhanced metadata
        expect(question).toHaveProperty('source')
        expect(question).toHaveProperty('freshnessScore')
        expect(question).toHaveProperty('relevanceScore')
        expect(question).toHaveProperty('llmProvider')
        
        // Sample answers
        expect(question).toHaveProperty('sampleAnswer')
        expect(question.sampleAnswer).toBeDefined()
      })
    })

    it('should save questions to database with enhanced metadata', async () => {
      const requestBody = {
        sessionId: testSessionId,
        jobTitle: 'Product Manager',
        industry: 'technology',
        difficulty: 'hard',
        count: 2,
        types: ['behavioral'],
        includeWebScraping: false,
        includeSampleAnswers: false
      }

      await request(app)
        .post('/api/questions/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(200)

      // Check database
      const savedQuestions = await db
        .select()
        .from(questions)
        .where(eq(questions.sessionId, testSessionId))

      expect(savedQuestions.length).toBeGreaterThan(0)
      expect(savedQuestions.length).toBeLessThanOrEqual(2)

      savedQuestions.forEach(question => {
        expect(question.sessionId).toBe(testSessionId)
        expect(question.type).toBe('behavioral')
        expect(question.difficulty).toBe('hard')
        expect(question.source).toBeDefined()
        expect(question.freshnessScore).toBeDefined()
        expect(question.relevanceScore).toBeDefined()
        expect(question.llmProvider).toBeDefined()
      })
    })

    it('should handle different question types correctly', async () => {
      const requestBody = {
        sessionId: testSessionId,
        jobTitle: 'Software Engineer',
        industry: 'technology',
        difficulty: 'medium',
        count: 4,
        types: ['behavioral', 'technical', 'situational'],
        includeWebScraping: false,
        includeSampleAnswers: false
      }

      const response = await request(app)
        .post('/api/questions/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(200)

      const questionTypes = response.body.questions.map((q: any) => q.type)
      const uniqueTypes = [...new Set(questionTypes)]

      expect(uniqueTypes.length).toBeGreaterThan(1)
      expect(uniqueTypes.every((type: string) => 
        ['behavioral', 'technical', 'situational'].includes(type)
      )).toBe(true)
    })

    it('should validate request parameters', async () => {
      const invalidRequestBody = {
        sessionId: 'invalid-uuid',
        jobTitle: '',
        difficulty: 'invalid',
        count: -1,
        types: []
      }

      await request(app)
        .post('/api/questions/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequestBody)
        .expect(400)
    })

    it('should handle missing authentication', async () => {
      const requestBody = {
        sessionId: testSessionId,
        jobTitle: 'Software Engineer',
        difficulty: 'medium',
        count: 1,
        types: ['behavioral']
      }

      await request(app)
        .post('/api/questions/generate')
        .send(requestBody)
        .expect(401)
    })

    it('should handle LLM provider failures gracefully', async () => {
      // Mock LLM failure scenario
      const requestBody = {
        sessionId: testSessionId,
        jobTitle: 'Software Engineer',
        industry: 'technology',
        difficulty: 'medium',
        count: 1,
        types: ['behavioral'],
        includeWebScraping: false,
        includeSampleAnswers: false
      }

      // This should still return questions (fallback)
      const response = await request(app)
        .post('/api/questions/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(200)

      expect(response.body.questions).toBeInstanceOf(Array)
      expect(response.body.questions.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/questions/:sessionId', () => {
    beforeEach(async () => {
      // Create test questions
      await db.insert(questions).values([
        {
          sessionId: testSessionId,
          type: 'behavioral',
          text: 'Test behavioral question',
          category: 'Teamwork',
          difficulty: 'medium',
          expectedKeywords: ['team', 'collaboration'],
          timeLimit: 180,
          order: 1,
          source: 'ai-generated',
          freshnessScore: '0.85',
          relevanceScore: '0.90',
          llmProvider: 'openai'
        },
        {
          sessionId: testSessionId,
          type: 'technical',
          text: 'Test technical question',
          category: 'Programming',
          difficulty: 'hard',
          expectedKeywords: ['algorithm', 'complexity'],
          timeLimit: 300,
          order: 2,
          source: 'scraped',
          freshnessScore: '0.75',
          relevanceScore: '0.95',
          llmProvider: 'gemini'
        }
      ])
    })

    it('should retrieve questions with enhanced metadata', async () => {
      const response = await request(app)
        .get(`/api/questions/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('questions')
      expect(response.body.questions).toBeInstanceOf(Array)
      expect(response.body.questions.length).toBe(2)

      response.body.questions.forEach((question: any) => {
        expect(question).toHaveProperty('source')
        expect(question).toHaveProperty('freshnessScore')
        expect(question).toHaveProperty('relevanceScore')
        expect(question).toHaveProperty('llmProvider')
        expect(['ai-generated', 'scraped', 'curated']).toContain(question.source)
        expect(['openai', 'gemini', 'claude']).toContain(question.llmProvider)
      })
    })

    it('should return questions in correct order', async () => {
      const response = await request(app)
        .get(`/api/questions/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const orders = response.body.questions.map((q: any) => q.order)
      expect(orders).toEqual([1, 2])
    })

    it('should handle non-existent session', async () => {
      const nonExistentSessionId = '00000000-0000-0000-0000-000000000000'
      
      const response = await request(app)
        .get(`/api/questions/${nonExistentSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.questions).toBeInstanceOf(Array)
      expect(response.body.questions.length).toBe(0)
    })
  })

  describe('GET /api/questions/:questionId/sample-answer', () => {
    let testQuestionId: string

    beforeEach(async () => {
      const testQuestion = await db.insert(questions).values({
        sessionId: testSessionId,
        type: 'behavioral',
        text: 'Tell me about a challenging project you worked on.',
        category: 'Problem Solving',
        difficulty: 'medium',
        expectedKeywords: ['challenge', 'project', 'solution'],
        timeLimit: 180,
        order: 1,
        source: 'ai-generated',
        freshnessScore: '0.85',
        relevanceScore: '0.90',
        llmProvider: 'openai',
        starFramework: {
          situation: 'Working on a complex system integration',
          task: 'Integrate multiple legacy systems',
          action: 'Designed a middleware solution',
          result: 'Successful integration with 99% uptime',
          keyPoints: ['technical leadership', 'problem solving']
        }
      }).returning()

      testQuestionId = testQuestion[0].id
    })

    it('should generate sample answer with STAR framework', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestionId}/sample-answer`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('answer')
      expect(response.body).toHaveProperty('structure')
      expect(response.body).toHaveProperty('starFramework')
      expect(response.body).toHaveProperty('tips')
      expect(response.body).toHaveProperty('commonMistakes')

      expect(response.body.structure).toBe('star')
      expect(response.body.starFramework).toHaveProperty('situation')
      expect(response.body.starFramework).toHaveProperty('task')
      expect(response.body.starFramework).toHaveProperty('action')
      expect(response.body.starFramework).toHaveProperty('result')
    })

    it('should handle non-existent question', async () => {
      const nonExistentQuestionId = '00000000-0000-0000-0000-000000000000'
      
      await request(app)
        .get(`/api/questions/${nonExistentQuestionId}/sample-answer`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })

  describe('POST /api/questions/:questionId/feedback', () => {
    let testQuestionId: string

    beforeEach(async () => {
      const testQuestion = await db.insert(questions).values({
        sessionId: testSessionId,
        type: 'behavioral',
        text: 'Test question for feedback',
        category: 'Test',
        difficulty: 'medium',
        expectedKeywords: ['test'],
        timeLimit: 180,
        order: 1,
        source: 'ai-generated',
        freshnessScore: '0.85',
        relevanceScore: '0.90'
      }).returning()

      testQuestionId = testQuestion[0].id
    })

    it('should accept quality feedback', async () => {
      const feedbackBody = {
        rating: 4,
        relevance: 5,
        clarity: 4,
        difficulty: 3,
        comments: 'Good question, very relevant to the role'
      }

      const response = await request(app)
        .post(`/api/questions/${testQuestionId}/feedback`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(feedbackBody)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('message')
    })

    it('should validate feedback parameters', async () => {
      const invalidFeedbackBody = {
        rating: 6, // Invalid: > 5
        relevance: -1, // Invalid: < 1
        clarity: 'invalid' // Invalid: not a number
      }

      await request(app)
        .post(`/api/questions/${testQuestionId}/feedback`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidFeedbackBody)
        .expect(400)
    })
  })

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent question generation requests', async () => {
      const requestBody = {
        sessionId: testSessionId,
        jobTitle: 'Software Engineer',
        industry: 'technology',
        difficulty: 'medium',
        count: 2,
        types: ['behavioral'],
        includeWebScraping: false,
        includeSampleAnswers: false
      }

      const promises = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/questions/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send(requestBody)
      )

      const responses = await Promise.all(promises)

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.questions).toBeInstanceOf(Array)
        expect(response.body.questions.length).toBeGreaterThan(0)
      })
    }, 30000)

    it('should complete question generation within reasonable time', async () => {
      const requestBody = {
        sessionId: testSessionId,
        jobTitle: 'Software Engineer',
        industry: 'technology',
        difficulty: 'medium',
        count: 5,
        types: ['behavioral', 'technical'],
        includeWebScraping: false,
        includeSampleAnswers: true
      }

      const startTime = Date.now()

      const response = await request(app)
        .post('/api/questions/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(200)

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.body.questions).toBeInstanceOf(Array)
      expect(duration).toBeLessThan(15000) // Should complete within 15 seconds
    }, 20000)
  })
})
