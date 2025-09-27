import { apiClient } from '@/lib/api'
import { 
  RoleSpecificCoach, 
  PersonalizedCoachingPlan, 
  LearningPathStep, 
  AICoachSuggestion,
  AdaptiveAdjustment,
  IndustryInsight,
  QuestionTemplate,
  EvaluationCriteria
} from './aiInterviewService'

export interface EmotionalState {
  confidence: number
  stress: number
  engagement: number
  clarity: number
  timestamp: number
}

export interface RealTimeFeedback {
  type: 'encouragement' | 'correction' | 'guidance' | 'warning'
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  timestamp: number
  context: string
  actionable: boolean
}

export interface CoachingSession {
  id: string
  userId: string
  coachProfile: RoleSpecificCoach
  startTime: Date
  endTime?: Date
  emotionalStates: EmotionalState[]
  realTimeFeedback: RealTimeFeedback[]
  adaptiveAdjustments: AdaptiveAdjustment[]
  finalAssessment?: SessionAssessment
}

export interface SessionAssessment {
  overallScore: number
  categoryScores: Record<string, number>
  emotionalJourney: EmotionalAnalysis
  keyInsights: string[]
  improvementAreas: string[]
  nextSteps: string[]
  personalizedRecommendations: AICoachSuggestion[]
}

export interface EmotionalAnalysis {
  averageConfidence: number
  stressPatterns: StressPattern[]
  engagementTrends: EngagementTrend[]
  emotionalStability: number
  recommendations: string[]
}

export interface StressPattern {
  trigger: string
  intensity: number
  duration: number
  recovery: number
  suggestions: string[]
}

export interface EngagementTrend {
  phase: string
  level: number
  factors: string[]
  improvements: string[]
}

class AdvancedAICoachService {
  private roleCoaches: Map<string, RoleSpecificCoach> = new Map()
  private userPlans: Map<string, PersonalizedCoachingPlan> = new Map()
  private activeSessions: Map<string, CoachingSession> = new Map()

  constructor() {
    this.initializeRoleCoaches()
  }

  // Initialize role-specific AI coaches
  private initializeRoleCoaches(): void {
    const roles = [
      'software-engineer',
      'product-manager', 
      'data-scientist',
      'ux-designer',
      'marketing-manager',
      'sales-representative',
      'business-analyst',
      'project-manager',
      'devops-engineer',
      'security-engineer'
    ]

    roles.forEach(role => {
      this.roleCoaches.set(role, this.createRoleCoach(role))
    })
  }

  // Create role-specific coach profile
  private createRoleCoach(role: string): RoleSpecificCoach {
    const baseCoach: RoleSpecificCoach = {
      role,
      expertise: this.getRoleExpertise(role),
      questionTemplates: this.getRoleQuestionTemplates(role),
      evaluationCriteria: this.getRoleEvaluationCriteria(role),
      learningPath: this.getRoleLearningPath(role),
      industryInsights: this.getRoleIndustryInsights(role)
    }

    return baseCoach
  }

  // Get role-specific expertise areas
  private getRoleExpertise(role: string): string[] {
    const expertiseMap: Record<string, string[]> = {
      'software-engineer': [
        'Data Structures & Algorithms',
        'System Design',
        'Code Quality & Best Practices',
        'Testing & Debugging',
        'Performance Optimization',
        'API Design',
        'Database Design',
        'Security Principles',
        'DevOps & CI/CD',
        'Agile Development'
      ],
      'product-manager': [
        'Product Strategy',
        'Market Research',
        'User Experience Design',
        'Data Analysis',
        'Stakeholder Management',
        'Roadmap Planning',
        'A/B Testing',
        'Go-to-Market Strategy',
        'Competitive Analysis',
        'Metrics & KPIs'
      ],
      'data-scientist': [
        'Machine Learning',
        'Statistical Analysis',
        'Data Visualization',
        'Python/R Programming',
        'SQL & Databases',
        'Feature Engineering',
        'Model Deployment',
        'Business Intelligence',
        'Experimental Design',
        'Big Data Technologies'
      ],
      'ux-designer': [
        'User Research',
        'Information Architecture',
        'Interaction Design',
        'Visual Design',
        'Prototyping',
        'Usability Testing',
        'Design Systems',
        'Accessibility',
        'Design Thinking',
        'Cross-platform Design'
      ]
    }

    return expertiseMap[role] || []
  }

  // Generate personalized coaching plan
  async generatePersonalizedPlan(params: {
    userId: string
    role: string
    currentSkills: string[]
    targetRole?: string
    timeframe: number // weeks
    preferences: {
      learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed'
      intensity: 'light' | 'moderate' | 'intensive'
      focusAreas: string[]
    }
  }): Promise<PersonalizedCoachingPlan> {
    try {
      const coach = this.roleCoaches.get(params.role)
      if (!coach) {
        throw new Error(`No coach available for role: ${params.role}`)
      }

      // Assess current level based on skills
      const currentLevel = this.assessSkillLevel(params.currentSkills, coach.expertise)
      
      // Determine target level
      const targetLevel = params.targetRole ? 'expert' : this.getNextLevel(currentLevel)

      // Generate adaptive learning path
      const learningPath = await this.generateAdaptiveLearningPath({
        role: params.role,
        currentLevel,
        targetLevel,
        timeframe: params.timeframe,
        preferences: params.preferences,
        coach
      })

      const plan: PersonalizedCoachingPlan = {
        userId: params.userId,
        role: params.role,
        currentLevel,
        targetLevel,
        strengths: this.identifyStrengths(params.currentSkills, coach.expertise),
        weaknesses: this.identifyWeaknesses(params.currentSkills, coach.expertise),
        learningPath,
        milestones: this.generateMilestones(learningPath),
        estimatedCompletion: this.calculateCompletionDate(learningPath, params.timeframe),
        adaptiveAdjustments: []
      }

      this.userPlans.set(params.userId, plan)
      return plan
    } catch (error) {
      console.error('Error generating personalized plan:', error)
      throw error
    }
  }

  // Start real-time coaching session
  async startCoachingSession(params: {
    userId: string
    sessionType: 'practice' | 'mock-interview' | 'skill-assessment'
    role: string
    focusAreas?: string[]
  }): Promise<CoachingSession> {
    try {
      const coach = this.roleCoaches.get(params.role)
      if (!coach) {
        throw new Error(`No coach available for role: ${params.role}`)
      }

      const session: CoachingSession = {
        id: `session-${Date.now()}`,
        userId: params.userId,
        coachProfile: coach,
        startTime: new Date(),
        emotionalStates: [],
        realTimeFeedback: [],
        adaptiveAdjustments: []
      }

      this.activeSessions.set(session.id, session)
      return session
    } catch (error) {
      console.error('Error starting coaching session:', error)
      throw error
    }
  }

  // Process real-time emotional data
  async processEmotionalData(sessionId: string, emotionalData: {
    confidence: number
    stress: number
    engagement: number
    clarity: number
  }): Promise<RealTimeFeedback[]> {
    try {
      const session = this.activeSessions.get(sessionId)
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`)
      }

      const emotionalState: EmotionalState = {
        ...emotionalData,
        timestamp: Date.now()
      }

      session.emotionalStates.push(emotionalState)

      // Generate real-time feedback based on emotional state
      const feedback = this.generateRealTimeFeedback(emotionalState, session)
      session.realTimeFeedback.push(...feedback)

      return feedback
    } catch (error) {
      console.error('Error processing emotional data:', error)
      return []
    }
  }

  // Generate real-time feedback
  private generateRealTimeFeedback(
    emotionalState: EmotionalState, 
    session: CoachingSession
  ): RealTimeFeedback[] {
    const feedback: RealTimeFeedback[] = []

    // Low confidence detection
    if (emotionalState.confidence < 0.4) {
      feedback.push({
        type: 'encouragement',
        message: 'Take a deep breath. Remember your strengths and speak with confidence.',
        priority: 'medium',
        timestamp: emotionalState.timestamp,
        context: 'low_confidence',
        actionable: true
      })
    }

    // High stress detection
    if (emotionalState.stress > 0.7) {
      feedback.push({
        type: 'guidance',
        message: 'You seem stressed. Try to slow down and organize your thoughts.',
        priority: 'high',
        timestamp: emotionalState.timestamp,
        context: 'high_stress',
        actionable: true
      })
    }

    // Low engagement detection
    if (emotionalState.engagement < 0.3) {
      feedback.push({
        type: 'warning',
        message: 'Show more enthusiasm and engagement in your responses.',
        priority: 'medium',
        timestamp: emotionalState.timestamp,
        context: 'low_engagement',
        actionable: true
      })
    }

    // Poor clarity detection
    if (emotionalState.clarity < 0.4) {
      feedback.push({
        type: 'correction',
        message: 'Speak more clearly and structure your thoughts before responding.',
        priority: 'high',
        timestamp: emotionalState.timestamp,
        context: 'poor_clarity',
        actionable: true
      })
    }

    return feedback
  }

  // Helper methods (to be implemented)
  private assessSkillLevel(skills: string[], expertise: string[]): 'novice' | 'intermediate' | 'advanced' | 'expert' {
    const matchCount = skills.filter(skill => 
      expertise.some(exp => exp.toLowerCase().includes(skill.toLowerCase()))
    ).length
    
    const percentage = matchCount / expertise.length
    
    if (percentage >= 0.8) return 'expert'
    if (percentage >= 0.6) return 'advanced'
    if (percentage >= 0.3) return 'intermediate'
    return 'novice'
  }

  private getNextLevel(current: 'novice' | 'intermediate' | 'advanced' | 'expert'): 'novice' | 'intermediate' | 'advanced' | 'expert' {
    const levels = ['novice', 'intermediate', 'advanced', 'expert'] as const
    const currentIndex = levels.indexOf(current)
    return levels[Math.min(currentIndex + 1, levels.length - 1)]
  }

  private identifyStrengths(skills: string[], expertise: string[]): string[] {
    return skills.filter(skill => 
      expertise.some(exp => exp.toLowerCase().includes(skill.toLowerCase()))
    )
  }

  private identifyWeaknesses(skills: string[], expertise: string[]): string[] {
    return expertise.filter(exp =>
      !skills.some(skill => exp.toLowerCase().includes(skill.toLowerCase()))
    ).slice(0, 5) // Top 5 weaknesses
  }

  private async generateAdaptiveLearningPath(params: {
    role: string
    currentLevel: 'novice' | 'intermediate' | 'advanced' | 'expert'
    targetLevel: 'novice' | 'intermediate' | 'advanced' | 'expert'
    timeframe: number
    preferences: any
    coach: RoleSpecificCoach
  }): Promise<LearningPathStep[]> {
    // Generate learning path based on role and level
    const basePath = params.coach.learningPath

    // Filter and adapt based on current and target level
    return basePath.filter(step => {
      // Logic to filter steps based on level progression
      return true // Simplified for now
    }).map(step => ({
      ...step,
      estimatedTime: this.adjustTimeBasedOnIntensity(step.estimatedTime, params.preferences.intensity)
    }))
  }

  private adjustTimeBasedOnIntensity(baseTime: number, intensity: 'light' | 'moderate' | 'intensive'): number {
    const multipliers = { light: 1.5, moderate: 1.0, intensive: 0.7 }
    return Math.round(baseTime * multipliers[intensity])
  }

  private generateMilestones(learningPath: LearningPathStep[]): any[] {
    return learningPath.flatMap(step => step.milestones || [])
  }

  private calculateCompletionDate(learningPath: LearningPathStep[], timeframe: number): Date {
    const totalTime = learningPath.reduce((sum, step) => sum + step.estimatedTime, 0)
    const weeksNeeded = Math.ceil(totalTime / (timeframe * 7)) // Assuming hours per week
    const completionDate = new Date()
    completionDate.setDate(completionDate.getDate() + (weeksNeeded * 7))
    return completionDate
  }

  private getRoleQuestionTemplates(role: string): QuestionTemplate[] {
    const templateMap: Record<string, QuestionTemplate[]> = {
      'software-engineer': [
        {
          category: 'Technical Problem Solving',
          questions: [
            'Describe a complex technical challenge you faced and how you solved it.',
            'How do you approach debugging a system that\'s failing in production?',
            'Walk me through your process for designing a scalable system.'
          ],
          followUps: [
            'What alternative approaches did you consider?',
            'How did you measure the success of your solution?',
            'What would you do differently next time?'
          ],
          evaluationPoints: [
            'Problem decomposition',
            'Technical depth',
            'Solution creativity',
            'Implementation details',
            'Trade-off analysis'
          ],
          idealResponseStructure: 'STAR method with technical details and measurable outcomes'
        },
        {
          category: 'System Design',
          questions: [
            'Design a URL shortening service like bit.ly',
            'How would you design a chat application for millions of users?',
            'Design a recommendation system for an e-commerce platform.'
          ],
          followUps: [
            'How would you handle scale?',
            'What about data consistency?',
            'How would you monitor this system?'
          ],
          evaluationPoints: [
            'Scalability considerations',
            'Database design',
            'API design',
            'Caching strategies',
            'Monitoring and alerting'
          ],
          idealResponseStructure: 'Requirements gathering → High-level design → Deep dive → Scale considerations'
        }
      ],
      'product-manager': [
        {
          category: 'Product Strategy',
          questions: [
            'How would you prioritize features for a product with limited engineering resources?',
            'Describe a time when you had to pivot a product strategy.',
            'How do you balance user needs with business objectives?'
          ],
          followUps: [
            'What frameworks did you use?',
            'How did you measure success?',
            'What stakeholder challenges did you face?'
          ],
          evaluationPoints: [
            'Strategic thinking',
            'Data-driven decisions',
            'Stakeholder management',
            'User empathy',
            'Business acumen'
          ],
          idealResponseStructure: 'Context → Framework/Process → Decision rationale → Outcomes → Learnings'
        }
      ]
    }

    return templateMap[role] || []
  }

  private getRoleEvaluationCriteria(role: string): EvaluationCriteria {
    const criteriaMap: Record<string, EvaluationCriteria> = {
      'software-engineer': {
        technical: {
          weight: 0.4,
          keyIndicators: ['Code quality', 'System design', 'Problem solving', 'Best practices'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Basic understanding of programming concepts',
              examples: ['Can write simple functions', 'Understands basic data structures']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Solid programming skills with some system design knowledge',
              examples: ['Can design simple systems', 'Understands databases and APIs']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Strong technical skills with system design expertise',
              examples: ['Can design scalable systems', 'Understands distributed systems']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Expert-level technical skills and architecture knowledge',
              examples: ['Can design complex distributed systems', 'Deep understanding of performance optimization']
            }
          ]
        },
        behavioral: {
          weight: 0.25,
          keyIndicators: ['Teamwork', 'Communication', 'Learning agility', 'Conflict resolution'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Basic interpersonal skills',
              examples: ['Can work in a team', 'Communicates clearly']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Good collaboration and communication skills',
              examples: ['Mentors junior developers', 'Handles feedback well']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Strong leadership and mentoring abilities',
              examples: ['Leads technical discussions', 'Resolves team conflicts']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Exceptional leadership and influence',
              examples: ['Drives technical culture', 'Influences org-wide decisions']
            }
          ]
        },
        communication: {
          weight: 0.2,
          keyIndicators: ['Clarity', 'Technical explanation', 'Stakeholder communication'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Can communicate basic technical concepts',
              examples: ['Explains code to peers', 'Writes clear documentation']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Effectively communicates with technical and non-technical stakeholders',
              examples: ['Presents technical solutions', 'Writes technical proposals']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Excellent technical communication across all levels',
              examples: ['Influences technical decisions', 'Mentors through communication']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Exceptional technical communication and thought leadership',
              examples: ['Speaks at conferences', 'Writes influential technical content']
            }
          ]
        },
        leadership: {
          weight: 0.1,
          keyIndicators: ['Technical leadership', 'Mentoring', 'Decision making'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Shows potential for leadership',
              examples: ['Takes initiative on small tasks', 'Helps teammates']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Demonstrates technical leadership in team settings',
              examples: ['Leads small projects', 'Mentors junior developers']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Strong technical leadership across multiple teams',
              examples: ['Leads major initiatives', 'Influences technical strategy']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Exceptional technical leadership and vision',
              examples: ['Sets technical direction', 'Builds high-performing teams']
            }
          ]
        },
        problemSolving: {
          weight: 0.05,
          keyIndicators: ['Analytical thinking', 'Creativity', 'Systematic approach'],
          scoringRubric: [
            {
              level: 'novice',
              score: 25,
              description: 'Can solve basic problems with guidance',
              examples: ['Debugs simple issues', 'Follows established patterns']
            },
            {
              level: 'intermediate',
              score: 50,
              description: 'Independently solves complex problems',
              examples: ['Debugs complex issues', 'Designs solutions']
            },
            {
              level: 'advanced',
              score: 75,
              description: 'Excels at solving complex, ambiguous problems',
              examples: ['Solves novel problems', 'Creates innovative solutions']
            },
            {
              level: 'expert',
              score: 100,
              description: 'Exceptional problem-solving with strategic impact',
              examples: ['Solves organization-wide problems', 'Creates breakthrough solutions']
            }
          ]
        }
      }
    }

    return criteriaMap[role] || criteriaMap['software-engineer']
  }

  private getRoleLearningPath(role: string): LearningPathStep[] {
    const pathMap: Record<string, LearningPathStep[]> = {
      'software-engineer': [
        {
          id: 'se-fundamentals',
          title: 'Programming Fundamentals',
          description: 'Master core programming concepts and best practices',
          type: 'knowledge',
          prerequisites: [],
          estimatedTime: 40, // hours
          resources: [
            {
              type: 'course',
              title: 'Clean Code Principles',
              description: 'Learn to write maintainable, readable code',
              difficulty: 'beginner',
              estimatedTime: 10
            },
            {
              type: 'practice',
              title: 'Algorithm Practice',
              description: 'Solve data structure and algorithm problems',
              difficulty: 'intermediate',
              estimatedTime: 20
            }
          ],
          milestones: [
            {
              id: 'se-fund-1',
              title: 'Code Quality Assessment',
              description: 'Demonstrate ability to write clean, well-structured code',
              criteria: ['Follows naming conventions', 'Proper code organization', 'Includes appropriate comments'],
              assessmentType: 'project'
            }
          ]
        },
        {
          id: 'se-system-design',
          title: 'System Design Mastery',
          description: 'Learn to design scalable, distributed systems',
          type: 'skill',
          prerequisites: ['se-fundamentals'],
          estimatedTime: 60,
          resources: [
            {
              type: 'book',
              title: 'Designing Data-Intensive Applications',
              description: 'Comprehensive guide to system design',
              difficulty: 'advanced',
              estimatedTime: 40
            },
            {
              type: 'practice',
              title: 'System Design Practice',
              description: 'Practice designing real-world systems',
              difficulty: 'advanced',
              estimatedTime: 20
            }
          ],
          milestones: [
            {
              id: 'se-sys-1',
              title: 'System Design Interview',
              description: 'Successfully design a complex distributed system',
              criteria: ['Scalability considerations', 'Database design', 'API design', 'Monitoring strategy'],
              assessmentType: 'interview'
            }
          ]
        }
      ]
    }

    return pathMap[role] || []
  }

  private getRoleIndustryInsights(role: string): IndustryInsight[] {
    const insightsMap: Record<string, IndustryInsight[]> = {
      'software-engineer': [
        {
          topic: 'AI/ML Integration',
          trend: 'Increasing demand for AI-powered features in all software products',
          impact: 'high',
          timeframe: '2024-2026',
          recommendations: [
            'Learn machine learning fundamentals',
            'Understand AI model deployment',
            'Practice with AI APIs and frameworks'
          ],
          sources: ['Stack Overflow Developer Survey 2024', 'GitHub State of the Octoverse']
        },
        {
          topic: 'Cloud-Native Development',
          trend: 'Shift towards microservices and containerized applications',
          impact: 'high',
          timeframe: '2024-2025',
          recommendations: [
            'Master Docker and Kubernetes',
            'Learn cloud platforms (AWS, GCP, Azure)',
            'Understand serverless architectures'
          ],
          sources: ['CNCF Annual Survey', 'Developer Economics Survey']
        }
      ]
    }

    return insightsMap[role] || []
  }
}

export const advancedAICoachService = new AdvancedAICoachService()
