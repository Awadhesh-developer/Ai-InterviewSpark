import {
  User,
  UserRole,
  InterviewSession,
  InterviewConfig,
  Question,
  Answer,
  Feedback,
  PerformanceMetrics,
  Resume,
  ExpertProfile,
  AnalyticsData,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  SessionStatus,
  Difficulty,
  QuestionType
} from '@/types'

// Mock data
const mockUser: User = {
  id: 'user-123',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  role: UserRole.JOB_SEEKER,
  bio: 'Software engineer with 5 years of experience',
  location: 'San Francisco, CA',
  timezone: 'America/Los_Angeles',
  language: 'en',
  accessibility: {
    highContrast: false,
    screenReader: false,
    captions: true
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString()
}

const mockSessions: InterviewSession[] = [
  {
    id: 'session-1',
    userId: 'user-123',
    jobTitle: 'Senior Software Engineer',
    company: 'Google',
    difficulty: Difficulty.INTERMEDIATE,
    duration: 45,
    questionTypes: [QuestionType.TECHNICAL, QuestionType.BEHAVIORAL],
    includeEmotionalAnalysis: true,
    includeResumeAnalysis: true,
    status: SessionStatus.COMPLETED,
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
    questions: [],
    answers: [],
    performanceMetrics: {
      id: 'perf-1',
      sessionId: 'session-1',
      userId: 'user-123',
      overallScore: 85,
      categoryScores: {
        technical: 82,
        behavioral: 88,
        communication: 85,
        problemSolving: 83
      },
      emotionalTrends: [],
      improvementAreas: ['More specific examples', 'Better structure'],
      strengths: ['Clear communication', 'Strong technical knowledge'],
      recommendations: ['Practice system design', 'Prepare more STAR examples'],
      createdAt: new Date('2024-01-15').toISOString()
    }
  },
  {
    id: 'session-2',
    userId: 'user-123',
    jobTitle: 'Product Manager',
    company: 'Meta',
    difficulty: Difficulty.ADVANCED,
    duration: 60,
    questionTypes: [QuestionType.BEHAVIORAL, QuestionType.SITUATIONAL],
    includeEmotionalAnalysis: true,
    includeResumeAnalysis: false,
    status: SessionStatus.COMPLETED,
    createdAt: new Date('2024-01-12').toISOString(),
    updatedAt: new Date('2024-01-12').toISOString(),
    questions: [],
    answers: [],
    performanceMetrics: {
      id: 'perf-2',
      sessionId: 'session-2',
      userId: 'user-123',
      overallScore: 78,
      categoryScores: {
        strategic: 80,
        analytical: 75,
        communication: 82,
        leadership: 76
      },
      emotionalTrends: [],
      improvementAreas: ['Data analysis depth', 'Leadership examples'],
      strengths: ['Strategic thinking', 'Good communication'],
      recommendations: ['Practice case studies', 'Prepare leadership stories'],
      createdAt: new Date('2024-01-12').toISOString()
    }
  },
  {
    id: 'session-3',
    userId: 'user-123',
    jobTitle: 'Data Scientist',
    company: 'Netflix',
    difficulty: Difficulty.INTERMEDIATE,
    duration: 30,
    questionTypes: [QuestionType.TECHNICAL, QuestionType.BEHAVIORAL],
    includeEmotionalAnalysis: false,
    includeResumeAnalysis: true,
    status: SessionStatus.IN_PROGRESS,
    createdAt: new Date('2024-01-20').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString(),
    questions: [],
    answers: []
  }
]

const mockQuestions: Question[] = [
  {
    id: 'q1',
    sessionId: 'session-1',
    text: 'Tell me about a challenging project you worked on recently.',
    type: QuestionType.BEHAVIORAL,
    category: 'experience',
    difficulty: Difficulty.INTERMEDIATE,
    timeLimit: 180,
    order: 1,
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: 'q2',
    sessionId: 'session-1',
    text: 'How would you design a URL shortener like bit.ly?',
    type: QuestionType.TECHNICAL,
    category: 'system-design',
    difficulty: Difficulty.ADVANCED,
    timeLimit: 300,
    order: 2,
    createdAt: new Date('2024-01-15').toISOString()
  }
]

// Mock API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class MockApiClient {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    await delay(1000)

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(credentials.email)) {
      throw new Error('Invalid email format')
    }

    // Validate password (minimum 6 characters for demo)
    if (!credentials.password || credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    // For demo purposes, accept any valid email/password combination
    // In production, this would validate against a real database
    const token = 'mock-jwt-token'
    this.setToken(token)

    // Create user object based on email
    const emailParts = credentials.email.split('@')[0].split('.')
    const firstName = emailParts[0] ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1) : 'User'
    const lastName = emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : 'Demo'

    const user = {
      ...mockUser,
      email: credentials.email,
      firstName,
      lastName
    }

    return {
      user,
      token,
      refreshToken: 'mock-refresh-token'
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    await delay(1000)

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format')
    }

    // Validate password
    if (!userData.password || userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    // Validate required fields
    if (!userData.firstName || !userData.lastName) {
      throw new Error('First name and last name are required')
    }

    const newUser: User = {
      ...mockUser,
      id: `user-${Date.now()}`,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const token = 'mock-jwt-token'
    this.setToken(token)
    return {
      user: newUser,
      token,
      refreshToken: 'mock-refresh-token'
    }
  }

  async logout(): Promise<void> {
    await delay(500)
    this.removeToken()
  }

  async getCurrentUser(): Promise<User> {
    await delay(500)
    const token = this.getToken()
    console.log('MockAPI - getCurrentUser called, token exists:', !!token)

    if (!token) {
      console.log('MockAPI - No token found, throwing error')
      throw new Error('Not authenticated')
    }

    console.log('MockAPI - Returning mock user')
    // Return user based on stored token
    // In a real app, this would decode the JWT or make an API call
    return mockUser
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    await delay(1000)
    return { ...mockUser, ...data, updatedAt: new Date().toISOString() }
  }

  // Interview methods
  async createInterviewSession(config: InterviewConfig): Promise<InterviewSession> {
    await delay(1000)
    
    const newSession: InterviewSession = {
      id: `session-${Date.now()}`,
      userId: mockUser.id,
      jobTitle: config.jobTitle,
      company: config.company,
      jobDescription: config.jobDescription,
      difficulty: config.difficulty,
      duration: config.duration,
      questionTypes: config.questionTypes,
      topics: config.topics,
      includeEmotionalAnalysis: config.includeEmotionalAnalysis || false,
      includeResumeAnalysis: config.includeResumeAnalysis || false,
      status: SessionStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: mockQuestions,
      answers: []
    }
    
    mockSessions.unshift(newSession)
    return newSession
  }

  async getInterviewSessions(): Promise<InterviewSession[]> {
    await delay(800)
    return mockSessions
  }

  async getInterviewSession(sessionId: string): Promise<InterviewSession> {
    await delay(500)
    const session = mockSessions.find(s => s.id === sessionId)
    if (!session) throw new Error('Session not found')
    return session
  }

  async startInterviewSession(sessionId: string): Promise<Question> {
    await delay(1000)
    const session = mockSessions.find(s => s.id === sessionId)
    if (!session) throw new Error('Session not found')
    
    session.status = SessionStatus.IN_PROGRESS
    session.startedAt = new Date().toISOString()
    
    return mockQuestions[0]
  }

  async submitAnswer(sessionId: string, data: {
    questionId: string
    textResponse?: string
    audioBlob?: Blob
    videoBlob?: Blob
    duration: number
  }): Promise<{ feedback: Feedback; nextQuestion?: Question }> {
    await delay(2000) // Simulate AI processing time
    
    const feedback: Feedback = {
      id: `feedback-${Date.now()}`,
      answerId: `answer-${Date.now()}`,
      overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
      contentScore: Math.floor(Math.random() * 20) + 80,
      deliveryScore: Math.floor(Math.random() * 20) + 80,
      confidenceScore: Math.floor(Math.random() * 20) + 80,
      clarityScore: Math.floor(Math.random() * 20) + 80,
      strengths: [
        'Clear communication',
        'Good structure',
        'Relevant examples'
      ],
      improvements: [
        'More specific details',
        'Better time management',
        'Stronger conclusion'
      ],
      suggestions: [
        'Use the STAR method',
        'Practice with a timer',
        'Prepare more examples'
      ],
      createdAt: new Date().toISOString()
    }
    
    const nextQuestion = mockQuestions[1] // Return next question or undefined if last
    
    return { feedback, nextQuestion }
  }

  async completeInterviewSession(sessionId: string): Promise<PerformanceMetrics> {
    await delay(1500)
    
    const session = mockSessions.find(s => s.id === sessionId)
    if (!session) throw new Error('Session not found')
    
    session.status = SessionStatus.COMPLETED
    session.completedAt = new Date().toISOString()
    
    const metrics: PerformanceMetrics = {
      id: `perf-${Date.now()}`,
      sessionId: sessionId,
      userId: mockUser.id,
      overallScore: Math.floor(Math.random() * 25) + 75, // 75-100
      categoryScores: {
        technical: Math.floor(Math.random() * 30) + 70,
        behavioral: Math.floor(Math.random() * 30) + 70,
        communication: Math.floor(Math.random() * 30) + 70,
        problemSolving: Math.floor(Math.random() * 30) + 70
      },
      emotionalTrends: [],
      strengths: [
        'Strong technical knowledge',
        'Clear communication',
        'Good problem-solving approach'
      ],
      improvementAreas: [
        'More detailed examples',
        'Better time management',
        'Stronger closing statements'
      ],
      recommendations: [
        'Practice more behavioral questions',
        'Work on system design skills',
        'Prepare industry-specific examples'
      ],
      createdAt: new Date().toISOString()
    }
    
    session.performanceMetrics = metrics
    return metrics
  }

  async getSessionResults(sessionId: string): Promise<{
    session: InterviewSession
    metrics: PerformanceMetrics
    feedback: Feedback[]
  }> {
    await delay(1000)
    
    const session = mockSessions.find(s => s.id === sessionId)
    if (!session) throw new Error('Session not found')
    
    const mockFeedback: Feedback[] = [
      {
        id: 'feedback-1',
        answerId: 'answer-1',
        overallScore: 85,
        contentScore: 80,
        deliveryScore: 85,
        confidenceScore: 90,
        clarityScore: 85,
        strengths: ['Clear structure', 'Good examples'],
        improvements: ['More specific metrics'],
        suggestions: ['Use STAR method'],
        createdAt: new Date().toISOString()
      }
    ]
    
    return {
      session,
      metrics: session.performanceMetrics!,
      feedback: mockFeedback
    }
  }

  // Resume methods
  async uploadResume(file: File): Promise<Resume> {
    await delay(2000)
    
    return {
      id: `resume-${Date.now()}`,
      userId: mockUser.id,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      fileSize: file.size,
      uploadDate: new Date().toISOString(),
      parsedData: {
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        experience: [{
          title: 'Software Engineer',
          company: 'Tech Corp',
          duration: '2 years',
          description: 'Developed web applications'
        }],
        education: [{
          degree: 'Computer Science',
          institution: 'University',
          year: 2020
        }]
      },
      atsScore: 85,
      keywords: ['JavaScript', 'React', 'Node.js', 'Python']
    }
  }

  async getResumes(): Promise<Resume[]> {
    await delay(500)
    return []
  }

  async analyzeResume(resumeId: string): Promise<{
    atsScore: number
    keywords: string[]
    suggestions: string[]
  }> {
    await delay(3000)
    
    return {
      atsScore: Math.floor(Math.random() * 30) + 70,
      keywords: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
      suggestions: [
        'Add more quantifiable achievements',
        'Include relevant certifications',
        'Optimize for ATS keywords',
        'Improve formatting consistency'
      ]
    }
  }

  // Expert methods
  async getExperts(): Promise<ExpertProfile[]> {
    await delay(1000)
    return []
  }

  async bookExpertSession(expertId: string, data: any): Promise<any> {
    await delay(1000)
    return { success: true, bookingId: `booking-${Date.now()}` }
  }

  // Analytics methods
  async getAnalytics(): Promise<AnalyticsData> {
    await delay(1000)
    
    // Return mock analytics data
    return {
      totalSessions: mockSessions.length,
      averageScore: 82,
      improvementRate: 15,
      completionRate: 85,
      topSkills: ['JavaScript', 'React', 'Communication'],
      weakAreas: ['System Design', 'Leadership'],
      emotionalTrends: [],
      progressOverTime: [
        { date: '2024-01-20', score: 85, category: 'technical' },
        { date: '2024-01-19', score: 78, category: 'behavioral' },
        { date: '2024-01-18', score: 82, category: 'technical' }
      ]
    }
  }

  // AI methods
  async generateQuestions(data: any): Promise<Question[]> {
    await delay(2000)
    return mockQuestions
  }

  async analyzeAnswer(data: any): Promise<Feedback> {
    await delay(1500)
    
    return {
      id: `feedback-${Date.now()}`,
      answerId: `answer-${Date.now()}`,
      overallScore: Math.floor(Math.random() * 30) + 70,
      contentScore: Math.floor(Math.random() * 20) + 80,
      deliveryScore: Math.floor(Math.random() * 20) + 80,
      confidenceScore: Math.floor(Math.random() * 20) + 80,
      clarityScore: Math.floor(Math.random() * 20) + 80,
      strengths: ['Clear communication', 'Good structure'],
      improvements: ['More specific examples'],
      suggestions: ['Use STAR method', 'Practice timing'],
      createdAt: new Date().toISOString()
    }
  }

  async analyzeEmotion(data: any): Promise<any> {
    await delay(1000)
    
    return {
      confidence: 0.85,
      emotions: {
        confident: 0.7,
        nervous: 0.2,
        excited: 0.1
      },
      recommendations: ['Maintain eye contact', 'Speak more slowly']
    }
  }
}

// Create and export singleton
export const mockApiClient = new MockApiClient()
export default mockApiClient
