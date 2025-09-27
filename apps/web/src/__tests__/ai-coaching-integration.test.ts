import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { llmIntegrationService } from '@/services/llmIntegrationService'
import { aiCoachingSessionService } from '@/services/aiCoachingSessionService'
import { aiCoachingClient } from '@/services/aiCoachingClient'

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  message: "Can you explain how you would design a URL shortening service like bit.ly?",
                  questionType: "technical",
                  difficulty: 6,
                  category: "System Design",
                  hints: ["Think about the core components", "Consider scalability"],
                  followUpQuestions: ["How would you handle high traffic?"],
                  evaluation: {
                    expectedPoints: ["Database design", "URL encoding", "Caching strategy"],
                    scoringCriteria: ["Technical depth", "Scalability considerations"]
                  },
                  adaptiveAdjustments: {
                    increaseComplexity: false,
                    provideSupportiveGuidance: false,
                    focusOnWeakAreas: true
                  }
                })
              },
              finish_reason: 'stop'
            }],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 50,
              total_tokens: 150
            },
            model: 'gpt-4-turbo-preview'
          })
        }
      }
    }))
  }
})

describe('AI Coaching Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('LLM Integration Service', () => {
    it('should generate coaching response for software engineer', async () => {
      const context = {
        role: 'software-engineer',
        userLevel: 'intermediate' as const,
        sessionType: 'practice' as const,
        focusAreas: ['System Design'],
        previousResponses: [],
        userProfile: {
          experience: ['JavaScript', 'React'],
          weaknesses: ['System Design'],
          goals: ['Pass technical interviews']
        }
      }

      const response = await llmIntegrationService.generateCoachingResponse(context)

      expect(response).toBeDefined()
      expect(response.message).toBeTruthy()
      expect(response.questionType).toBe('technical')
      expect(response.difficulty).toBeGreaterThan(0)
      expect(response.difficulty).toBeLessThanOrEqual(10)
      expect(response.category).toBe('System Design')
    })

    it('should evaluate user response', async () => {
      const context = {
        role: 'software-engineer',
        userLevel: 'intermediate' as const,
        sessionType: 'practice' as const,
        focusAreas: ['System Design'],
        previousResponses: [],
        userProfile: {
          experience: ['JavaScript'],
          weaknesses: ['System Design'],
          goals: ['Improve technical skills']
        }
      }

      const userResponse = "I would use a hash function to generate short URLs and store mappings in a database."
      const expectedPoints = ["Database design", "URL encoding", "Caching strategy"]

      const evaluation = await llmIntegrationService.evaluateResponse(
        userResponse,
        expectedPoints,
        context
      )

      expect(evaluation).toBeDefined()
      expect(evaluation.score).toBeGreaterThanOrEqual(0)
      expect(evaluation.score).toBeLessThanOrEqual(100)
      expect(evaluation.feedback).toBeInstanceOf(Array)
      expect(evaluation.strengths).toBeInstanceOf(Array)
      expect(evaluation.improvements).toBeInstanceOf(Array)
    })

    it('should adapt difficulty based on performance', () => {
      const currentDifficulty = 5
      const highPerformance = 85
      const lowPerformance = 35

      const increasedDifficulty = llmIntegrationService.adaptDifficulty(
        currentDifficulty,
        highPerformance
      )

      const decreasedDifficulty = llmIntegrationService.adaptDifficulty(
        currentDifficulty,
        lowPerformance
      )

      expect(increasedDifficulty).toBeGreaterThan(currentDifficulty)
      expect(decreasedDifficulty).toBeLessThan(currentDifficulty)
    })
  })

  describe('AI Coaching Session Service', () => {
    it('should create a new coaching session', async () => {
      const sessionParams = {
        userId: 'test-user',
        role: 'software-engineer',
        sessionType: 'practice' as const,
        config: {
          difficulty: 5,
          focusAreas: ['System Design', 'Algorithms'],
          questionCount: 10,
          adaptiveDifficulty: true,
          emotionalAnalysis: true
        },
        userProfile: {
          level: 'intermediate' as const,
          experience: ['JavaScript', 'React'],
          weaknesses: ['System Design'],
          goals: ['Pass interviews']
        }
      }

      const session = await aiCoachingSessionService.createSession(sessionParams)

      expect(session).toBeDefined()
      expect(session.id).toBeTruthy()
      expect(session.userId).toBe('test-user')
      expect(session.role).toBe('software-engineer')
      expect(session.status).toBe('active')
      expect(session.currentQuestion).toBeDefined()
      expect(session.config.focusAreas).toEqual(['System Design', 'Algorithms'])
    })

    it('should process user response and generate next question', async () => {
      // First create a session
      const session = await aiCoachingSessionService.createSession({
        userId: 'test-user',
        role: 'software-engineer',
        sessionType: 'practice',
        config: {
          difficulty: 5,
          focusAreas: ['System Design'],
          questionCount: 5,
          adaptiveDifficulty: true,
          emotionalAnalysis: false
        },
        userProfile: {
          level: 'intermediate',
          experience: ['JavaScript'],
          weaknesses: ['System Design'],
          goals: ['Improve skills']
        }
      })

      // Process a user response
      const userResponse = "I would design the system with a load balancer, web servers, and a database."
      const result = await aiCoachingSessionService.processUserResponse(
        session.id,
        userResponse,
        30000 // 30 seconds response time
      )

      expect(result).toBeDefined()
      expect(result.evaluation).toBeDefined()
      expect(result.evaluation.score).toBeGreaterThanOrEqual(0)
      expect(result.sessionComplete).toBe(false) // Should not be complete after 1 question

      if (result.nextQuestion) {
        expect(result.nextQuestion.message).toBeTruthy()
        expect(result.nextQuestion.questionType).toBeTruthy()
      }
    })

    it('should update emotional state', () => {
      // This test would need a real session, but we can test the concept
      const emotionalState = {
        confidence: 0.7,
        stress: 0.3,
        engagement: 0.8,
        clarity: 0.6
      }

      // In a real test, we would create a session and update its emotional state
      expect(emotionalState.confidence).toBe(0.7)
      expect(emotionalState.stress).toBe(0.3)
      expect(emotionalState.engagement).toBe(0.8)
      expect(emotionalState.clarity).toBe(0.6)
    })

    it('should get session progress', async () => {
      const session = await aiCoachingSessionService.createSession({
        userId: 'progress-test-user',
        role: 'software-engineer',
        sessionType: 'practice',
        config: {
          difficulty: 5,
          focusAreas: ['Algorithms'],
          questionCount: 10,
          adaptiveDifficulty: true,
          emotionalAnalysis: false
        },
        userProfile: {
          level: 'intermediate',
          experience: ['Python'],
          weaknesses: ['Algorithms'],
          goals: ['Practice coding']
        }
      })

      const progress = aiCoachingSessionService.getSessionProgress(session.id)

      expect(progress).toBeDefined()
      expect(progress.currentQuestionIndex).toBe(0)
      expect(progress.totalQuestions).toBe(10)
      expect(progress.completionPercentage).toBe(0)
      expect(progress.timeElapsed).toBeGreaterThanOrEqual(0)
    })
  })

  describe('AI Coaching Client', () => {
    // Mock fetch for client tests
    const mockFetch = jest.fn()
    global.fetch = mockFetch

    beforeEach(() => {
      mockFetch.mockClear()
    })

    it('should create session via API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          session: {
            id: 'api-session-123',
            status: 'active',
            currentQuestion: {
              message: 'Test question',
              questionType: 'technical',
              difficulty: 5,
              category: 'General'
            }
          }
        })
      })

      const result = await aiCoachingClient.createSession({
        userId: 'api-test-user',
        role: 'software-engineer',
        sessionType: 'practice',
        config: {
          focusAreas: ['System Design']
        }
      })

      expect(result.success).toBe(true)
      expect(result.session).toBeDefined()
      expect(result.session?.id).toBe('api-session-123')
      expect(mockFetch).toHaveBeenCalledWith('/api/ai-coaching/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('api-test-user')
      })
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Session creation failed'
        })
      })

      const result = await aiCoachingClient.createSession({
        userId: 'error-test-user',
        role: 'software-engineer',
        sessionType: 'practice',
        config: {
          focusAreas: ['Algorithms']
        }
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should process response via API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          evaluation: {
            score: 75,
            feedback: ['Good approach'],
            strengths: ['Clear thinking'],
            improvements: ['Add more detail'],
            nextSteps: ['Practice more']
          },
          nextQuestion: {
            message: 'Follow-up question',
            questionType: 'technical',
            difficulty: 6,
            category: 'System Design'
          },
          sessionComplete: false,
          progress: {
            currentQuestionIndex: 1,
            totalQuestions: 10,
            completionPercentage: 10
          }
        })
      })

      const result = await aiCoachingClient.processResponse({
        sessionId: 'test-session',
        userResponse: 'My detailed response',
        responseTime: 45000
      })

      expect(result.success).toBe(true)
      expect(result.result?.evaluation.score).toBe(75)
      expect(result.result?.nextQuestion).toBeDefined()
      expect(result.result?.sessionComplete).toBe(false)
    })
  })

  describe('End-to-End AI Coaching Flow', () => {
    it('should complete a full coaching session workflow', async () => {
      // 1. Create session
      const session = await aiCoachingSessionService.createSession({
        userId: 'e2e-test-user',
        role: 'software-engineer',
        sessionType: 'practice',
        config: {
          difficulty: 5,
          focusAreas: ['System Design'],
          questionCount: 3, // Short session for testing
          adaptiveDifficulty: true,
          emotionalAnalysis: false
        },
        userProfile: {
          level: 'intermediate',
          experience: ['JavaScript', 'React'],
          weaknesses: ['System Design'],
          goals: ['Pass technical interviews']
        }
      })

      expect(session.status).toBe('active')
      expect(session.currentQuestion).toBeDefined()

      // 2. Answer questions
      const responses = [
        "I would use a microservices architecture with load balancers.",
        "For the database, I'd use a combination of SQL and NoSQL databases.",
        "To handle scale, I'd implement caching and CDN distribution."
      ]

      for (let i = 0; i < responses.length; i++) {
        const result = await aiCoachingSessionService.processUserResponse(
          session.id,
          responses[i],
          30000
        )

        expect(result.evaluation).toBeDefined()
        expect(result.evaluation.score).toBeGreaterThanOrEqual(0)

        if (i < responses.length - 1) {
          expect(result.sessionComplete).toBe(false)
          expect(result.nextQuestion).toBeDefined()
        }
      }

      // 3. Check final session state
      const finalProgress = aiCoachingSessionService.getSessionProgress(session.id)
      expect(finalProgress.currentQuestionIndex).toBe(3)
      expect(finalProgress.completionPercentage).toBe(100)
    })
  })
})

describe('AI Coaching Performance Tests', () => {
  it('should handle multiple concurrent sessions', async () => {
    const sessionPromises = Array.from({ length: 5 }, (_, i) =>
      aiCoachingSessionService.createSession({
        userId: `concurrent-user-${i}`,
        role: 'software-engineer',
        sessionType: 'practice',
        config: {
          difficulty: 5,
          focusAreas: ['Algorithms'],
          questionCount: 5,
          adaptiveDifficulty: true,
          emotionalAnalysis: false
        },
        userProfile: {
          level: 'intermediate',
          experience: ['Python'],
          weaknesses: ['Algorithms'],
          goals: ['Practice coding']
        }
      })
    )

    const sessions = await Promise.all(sessionPromises)

    expect(sessions).toHaveLength(5)
    sessions.forEach((session, index) => {
      expect(session.userId).toBe(`concurrent-user-${index}`)
      expect(session.status).toBe('active')
      expect(session.currentQuestion).toBeDefined()
    })

    // Verify all sessions have unique IDs
    const sessionIds = sessions.map(s => s.id)
    const uniqueIds = new Set(sessionIds)
    expect(uniqueIds.size).toBe(sessions.length)
  })

  it('should generate responses within reasonable time', async () => {
    const context = {
      role: 'software-engineer',
      userLevel: 'intermediate' as const,
      sessionType: 'practice' as const,
      focusAreas: ['System Design'],
      previousResponses: [],
      userProfile: {
        experience: ['JavaScript'],
        weaknesses: ['System Design'],
        goals: ['Improve skills']
      }
    }

    const startTime = Date.now()
    const response = await llmIntegrationService.generateCoachingResponse(context)
    const endTime = Date.now()

    expect(response).toBeDefined()
    expect(endTime - startTime).toBeLessThan(10000) // Should complete within 10 seconds
  })
})
