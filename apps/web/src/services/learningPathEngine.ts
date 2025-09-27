import { 
  LearningPathStep, 
  PersonalizedCoachingPlan, 
  AdaptiveAdjustment,
  LearningResource,
  Milestone
} from './aiInterviewService'

export interface UserProfile {
  id: string
  role: string
  currentLevel: 'novice' | 'intermediate' | 'advanced' | 'expert'
  targetRole?: string
  targetLevel: 'novice' | 'intermediate' | 'advanced' | 'expert'
  skills: UserSkill[]
  preferences: LearningPreferences
  goals: LearningGoal[]
  constraints: LearningConstraint[]
  performanceHistory: PerformanceRecord[]
}

export interface UserSkill {
  name: string
  category: string
  level: number // 0-100
  confidence: number // 0-100
  lastAssessed: Date
  trending: 'improving' | 'stable' | 'declining'
}

export interface LearningPreferences {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed'
  intensity: 'light' | 'moderate' | 'intensive'
  timeCommitment: number // hours per week
  preferredFormats: ('video' | 'article' | 'practice' | 'course' | 'book')[]
  difficultyPreference: 'gradual' | 'challenging' | 'mixed'
  feedbackFrequency: 'immediate' | 'daily' | 'weekly'
}

export interface LearningGoal {
  id: string
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  targetDate: Date
  measurableOutcomes: string[]
  dependencies: string[]
  progress: number // 0-100
}

export interface LearningConstraint {
  type: 'time' | 'budget' | 'access' | 'prerequisite'
  description: string
  impact: 'low' | 'medium' | 'high'
  workaround?: string
}

export interface PerformanceRecord {
  date: Date
  activity: string
  score: number
  category: string
  timeSpent: number
  feedback: string[]
  improvements: string[]
}

export interface AdaptiveLearningPath {
  id: string
  userId: string
  title: string
  description: string
  estimatedDuration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  steps: LearningPathStep[]
  adaptations: PathAdaptation[]
  milestones: Milestone[]
  prerequisites: string[]
  outcomes: LearningOutcome[]
  lastUpdated: Date
}

export interface PathAdaptation {
  trigger: string
  condition: string
  action: 'skip' | 'repeat' | 'supplement' | 'accelerate' | 'redirect'
  reason: string
  timestamp: Date
  effectiveness?: number
}

export interface LearningOutcome {
  skill: string
  expectedLevel: number
  assessmentMethod: string
  criteria: string[]
}

export interface IndustryTrend {
  skill: string
  demand: 'increasing' | 'stable' | 'decreasing'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  timeframe: string
  sources: string[]
  relatedSkills: string[]
  marketValue: number
}

export interface LearningRecommendation {
  type: 'skill_gap' | 'trending_skill' | 'career_advancement' | 'interview_prep'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  reasoning: string[]
  suggestedActions: string[]
  resources: LearningResource[]
  timeInvestment: number
  expectedROI: string
}

class LearningPathEngine {
  private userProfiles: Map<string, UserProfile> = new Map()
  private industryTrends: Map<string, IndustryTrend[]> = new Map()
  private adaptivePaths: Map<string, AdaptiveLearningPath> = new Map()

  constructor() {
    this.initializeIndustryTrends()
  }

  // Generate personalized learning path
  async generatePersonalizedPath(userProfile: UserProfile): Promise<AdaptiveLearningPath> {
    try {
      // Analyze skill gaps
      const skillGaps = this.analyzeSkillGaps(userProfile)
      
      // Get industry trends for user's role
      const trends = this.getRelevantTrends(userProfile.role)
      
      // Generate learning recommendations
      const recommendations = this.generateRecommendations(userProfile, skillGaps, trends)
      
      // Create adaptive learning path
      const path = this.createAdaptivePath(userProfile, recommendations)
      
      // Store and return path
      this.adaptivePaths.set(path.id, path)
      return path
    } catch (error) {
      console.error('Error generating personalized path:', error)
      throw error
    }
  }

  // Analyze user's skill gaps
  private analyzeSkillGaps(userProfile: UserProfile): UserSkill[] {
    const roleRequiredSkills = this.getRoleRequiredSkills(userProfile.role, userProfile.targetLevel)
    const userSkillMap = new Map(userProfile.skills.map(skill => [skill.name, skill]))
    
    const gaps: UserSkill[] = []
    
    roleRequiredSkills.forEach(requiredSkill => {
      const userSkill = userSkillMap.get(requiredSkill.name)
      
      if (!userSkill || userSkill.level < requiredSkill.level) {
        gaps.push({
          name: requiredSkill.name,
          category: requiredSkill.category,
          level: userSkill?.level || 0,
          confidence: userSkill?.confidence || 0,
          lastAssessed: userSkill?.lastAssessed || new Date(),
          trending: userSkill?.trending || 'stable'
        })
      }
    })
    
    return gaps
  }

  // Get relevant industry trends
  private getRelevantTrends(role: string): IndustryTrend[] {
    return this.industryTrends.get(role) || []
  }

  // Generate learning recommendations
  private generateRecommendations(
    userProfile: UserProfile,
    skillGaps: UserSkill[],
    trends: IndustryTrend[]
  ): LearningRecommendation[] {
    const recommendations: LearningRecommendation[] = []

    // Skill gap recommendations
    skillGaps.forEach(gap => {
      recommendations.push({
        type: 'skill_gap',
        title: `Improve ${gap.name}`,
        description: `Bridge the gap in ${gap.name} to meet role requirements`,
        priority: this.calculateGapPriority(gap, userProfile),
        reasoning: [
          `Current level: ${gap.level}/100`,
          `Required for ${userProfile.targetLevel} level`,
          'Essential for role advancement'
        ],
        suggestedActions: this.generateSkillActions(gap),
        resources: this.findLearningResources(gap.name, gap.category),
        timeInvestment: this.estimateTimeInvestment(gap),
        expectedROI: 'High - directly impacts role performance'
      })
    })

    // Trending skill recommendations
    trends.filter(trend => trend.demand === 'increasing').forEach(trend => {
      recommendations.push({
        type: 'trending_skill',
        title: `Learn ${trend.skill}`,
        description: `Emerging skill with high market demand`,
        priority: trend.urgency === 'critical' ? 'high' : 'medium',
        reasoning: [
          `Market demand: ${trend.demand}`,
          `Urgency: ${trend.urgency}`,
          `Market value: ${trend.marketValue}`
        ],
        suggestedActions: [
          'Start with fundamentals',
          'Practice with real projects',
          'Join community discussions'
        ],
        resources: this.findLearningResources(trend.skill, 'trending'),
        timeInvestment: 20,
        expectedROI: 'Very High - future-proofing career'
      })
    })

    return recommendations.sort((a, b) => this.priorityWeight(b.priority) - this.priorityWeight(a.priority))
  }

  // Create adaptive learning path
  private createAdaptivePath(
    userProfile: UserProfile,
    recommendations: LearningRecommendation[]
  ): AdaptiveLearningPath {
    const steps: LearningPathStep[] = []
    let totalDuration = 0

    recommendations.slice(0, 8).forEach((rec, index) => {
      const step: LearningPathStep = {
        id: `step-${index + 1}`,
        title: rec.title,
        description: rec.description,
        type: this.determineStepType(rec),
        prerequisites: index > 0 ? [`step-${index}`] : [],
        estimatedTime: rec.timeInvestment,
        resources: rec.resources,
        milestones: this.generateStepMilestones(rec)
      }
      
      steps.push(step)
      totalDuration += rec.timeInvestment
    })

    return {
      id: `path-${Date.now()}`,
      userId: userProfile.id,
      title: `Personalized Learning Path for ${userProfile.role}`,
      description: `Customized learning journey to advance from ${userProfile.currentLevel} to ${userProfile.targetLevel}`,
      estimatedDuration: totalDuration,
      difficulty: this.determineDifficulty(userProfile.currentLevel, userProfile.targetLevel),
      steps,
      adaptations: [],
      milestones: this.generatePathMilestones(steps),
      prerequisites: [],
      outcomes: this.generateLearningOutcomes(recommendations),
      lastUpdated: new Date()
    }
  }

  // Adapt learning path based on performance
  async adaptPath(
    pathId: string,
    performanceData: PerformanceRecord[],
    userFeedback?: string
  ): Promise<AdaptiveLearningPath> {
    const path = this.adaptivePaths.get(pathId)
    if (!path) {
      throw new Error(`Path not found: ${pathId}`)
    }

    // Analyze performance patterns
    const patterns = this.analyzePerformancePatterns(performanceData)
    
    // Generate adaptations
    const adaptations = this.generateAdaptations(patterns, userFeedback)
    
    // Apply adaptations to path
    const adaptedPath = this.applyAdaptations(path, adaptations)
    
    // Update stored path
    this.adaptivePaths.set(pathId, adaptedPath)
    
    return adaptedPath
  }

  // Helper methods
  private initializeIndustryTrends(): void {
    // Software Engineer trends
    this.industryTrends.set('software-engineer', [
      {
        skill: 'AI/ML Integration',
        demand: 'increasing',
        urgency: 'high',
        timeframe: '2024-2026',
        sources: ['Stack Overflow Survey', 'GitHub Trends'],
        relatedSkills: ['Python', 'TensorFlow', 'API Integration'],
        marketValue: 95
      },
      {
        skill: 'Cloud Architecture',
        demand: 'increasing',
        urgency: 'high',
        timeframe: '2024-2025',
        sources: ['Cloud Native Survey', 'DevOps Report'],
        relatedSkills: ['AWS', 'Kubernetes', 'Microservices'],
        marketValue: 90
      },
      {
        skill: 'Cybersecurity',
        demand: 'increasing',
        urgency: 'medium',
        timeframe: '2024-2027',
        sources: ['Security Industry Report'],
        relatedSkills: ['Security Protocols', 'Encryption', 'Compliance'],
        marketValue: 85
      }
    ])

    // Product Manager trends
    this.industryTrends.set('product-manager', [
      {
        skill: 'AI Product Strategy',
        demand: 'increasing',
        urgency: 'critical',
        timeframe: '2024-2025',
        sources: ['Product Management Report', 'AI Adoption Survey'],
        relatedSkills: ['Data Analysis', 'User Research', 'Ethics'],
        marketValue: 92
      },
      {
        skill: 'Data-Driven Decision Making',
        demand: 'stable',
        urgency: 'high',
        timeframe: '2024-2026',
        sources: ['Product Analytics Report'],
        relatedSkills: ['SQL', 'Analytics Tools', 'A/B Testing'],
        marketValue: 88
      }
    ])
  }

  private getRoleRequiredSkills(role: string, level: string): UserSkill[] {
    // Mock implementation - in production, this would come from a comprehensive skills database
    const skillsMap: Record<string, Record<string, UserSkill[]>> = {
      'software-engineer': {
        'intermediate': [
          { name: 'Data Structures', category: 'Technical', level: 70, confidence: 70, lastAssessed: new Date(), trending: 'stable' },
          { name: 'System Design', category: 'Technical', level: 60, confidence: 60, lastAssessed: new Date(), trending: 'stable' },
          { name: 'API Development', category: 'Technical', level: 65, confidence: 65, lastAssessed: new Date(), trending: 'stable' }
        ],
        'advanced': [
          { name: 'Data Structures', category: 'Technical', level: 85, confidence: 85, lastAssessed: new Date(), trending: 'stable' },
          { name: 'System Design', category: 'Technical', level: 80, confidence: 80, lastAssessed: new Date(), trending: 'stable' },
          { name: 'Leadership', category: 'Behavioral', level: 70, confidence: 70, lastAssessed: new Date(), trending: 'stable' }
        ]
      }
    }

    return skillsMap[role]?.[level] || []
  }

  private calculateGapPriority(gap: UserSkill, userProfile: UserProfile): 'low' | 'medium' | 'high' | 'critical' {
    const gapSize = 100 - gap.level
    const isCoreskill = ['Data Structures', 'System Design', 'Communication'].includes(gap.name)
    
    if (gapSize > 50 && isCoreskill) return 'critical'
    if (gapSize > 30 && isCoreskill) return 'high'
    if (gapSize > 20) return 'medium'
    return 'low'
  }

  private generateSkillActions(gap: UserSkill): string[] {
    return [
      `Complete foundational course in ${gap.name}`,
      `Practice with hands-on projects`,
      `Join study groups or communities`,
      `Seek mentorship or coaching`,
      `Take assessment to track progress`
    ]
  }

  private findLearningResources(skillName: string, category: string): LearningResource[] {
    // Mock implementation
    return [
      {
        type: 'course',
        title: `Master ${skillName}`,
        description: `Comprehensive course covering ${skillName} fundamentals and advanced concepts`,
        difficulty: 'intermediate',
        estimatedTime: 20
      },
      {
        type: 'practice',
        title: `${skillName} Practice Problems`,
        description: `Hands-on exercises to reinforce ${skillName} concepts`,
        difficulty: 'intermediate',
        estimatedTime: 15
      }
    ]
  }

  private estimateTimeInvestment(gap: UserSkill): number {
    const gapSize = 100 - gap.level
    return Math.ceil(gapSize / 5) // Rough estimate: 1 hour per 5 points
  }

  private priorityWeight(priority: string): number {
    const weights = { critical: 4, high: 3, medium: 2, low: 1 }
    return weights[priority as keyof typeof weights] || 0
  }

  private determineStepType(rec: LearningRecommendation): 'skill' | 'knowledge' | 'practice' | 'assessment' {
    if (rec.type === 'skill_gap') return 'skill'
    if (rec.type === 'trending_skill') return 'knowledge'
    return 'practice'
  }

  private generateStepMilestones(rec: LearningRecommendation): Milestone[] {
    return [
      {
        id: `milestone-${Date.now()}`,
        title: `Complete ${rec.title}`,
        description: rec.description,
        criteria: rec.suggestedActions,
        assessmentType: 'practice'
      }
    ]
  }

  private determineDifficulty(current: string, target: string): 'beginner' | 'intermediate' | 'advanced' {
    const levels = ['novice', 'intermediate', 'advanced', 'expert']
    const currentIndex = levels.indexOf(current)
    const targetIndex = levels.indexOf(target)
    const gap = targetIndex - currentIndex
    
    if (gap <= 1) return 'beginner'
    if (gap === 2) return 'intermediate'
    return 'advanced'
  }

  private generatePathMilestones(steps: LearningPathStep[]): Milestone[] {
    return steps.flatMap(step => step.milestones || [])
  }

  private generateLearningOutcomes(recommendations: LearningRecommendation[]): LearningOutcome[] {
    return recommendations.map(rec => ({
      skill: rec.title,
      expectedLevel: 80,
      assessmentMethod: 'practical_assessment',
      criteria: rec.suggestedActions
    }))
  }

  private analyzePerformancePatterns(performanceData: PerformanceRecord[]): any {
    // Analyze patterns in user performance
    return {
      averageScore: performanceData.reduce((sum, record) => sum + record.score, 0) / performanceData.length,
      improvementRate: this.calculateImprovementRate(performanceData),
      strugglingAreas: this.identifyStrugglingAreas(performanceData)
    }
  }

  private calculateImprovementRate(performanceData: PerformanceRecord[]): number {
    if (performanceData.length < 2) return 0
    
    const firstScore = performanceData[0].score
    const lastScore = performanceData[performanceData.length - 1].score
    return (lastScore - firstScore) / performanceData.length
  }

  private identifyStrugglingAreas(performanceData: PerformanceRecord[]): string[] {
    const categoryScores = new Map<string, number[]>()
    
    performanceData.forEach(record => {
      if (!categoryScores.has(record.category)) {
        categoryScores.set(record.category, [])
      }
      categoryScores.get(record.category)!.push(record.score)
    })
    
    const strugglingAreas: string[] = []
    categoryScores.forEach((scores, category) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      if (avgScore < 60) {
        strugglingAreas.push(category)
      }
    })
    
    return strugglingAreas
  }

  private generateAdaptations(patterns: any, userFeedback?: string): PathAdaptation[] {
    const adaptations: PathAdaptation[] = []
    
    // If user is struggling, add supplementary content
    if (patterns.averageScore < 60) {
      adaptations.push({
        trigger: 'low_performance',
        condition: 'average_score < 60',
        action: 'supplement',
        reason: 'User needs additional support and practice',
        timestamp: new Date()
      })
    }
    
    // If user is excelling, accelerate the path
    if (patterns.averageScore > 85 && patterns.improvementRate > 5) {
      adaptations.push({
        trigger: 'high_performance',
        condition: 'average_score > 85 AND improvement_rate > 5',
        action: 'accelerate',
        reason: 'User is ready for more challenging content',
        timestamp: new Date()
      })
    }
    
    return adaptations
  }

  private applyAdaptations(path: AdaptiveLearningPath, adaptations: PathAdaptation[]): AdaptiveLearningPath {
    const adaptedPath = { ...path }
    adaptedPath.adaptations.push(...adaptations)
    adaptedPath.lastUpdated = new Date()
    
    // Apply specific adaptations to the path structure
    adaptations.forEach(adaptation => {
      switch (adaptation.action) {
        case 'supplement':
          // Add additional resources or practice steps
          break
        case 'accelerate':
          // Reduce time estimates or skip basic content
          break
        case 'repeat':
          // Mark certain steps for repetition
          break
      }
    })
    
    return adaptedPath
  }
}

export const learningPathEngine = new LearningPathEngine()
