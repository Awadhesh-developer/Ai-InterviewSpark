/**
 * Adaptive Question Generation Service
 * Dynamically generates interview questions based on real-time analysis and candidate performance
 */

import { type UnifiedMetrics } from './unifiedAnalyticsService'

interface QuestionTemplate {
  id: string
  category: QuestionCategory
  difficulty: DifficultyLevel
  template: string
  variables: string[]
  followUpTriggers: FollowUpTrigger[]
  adaptationRules: AdaptationRule[]
  tags: string[]
}

interface GeneratedQuestion {
  id: string
  text: string
  category: QuestionCategory
  difficulty: DifficultyLevel
  expectedDuration: number
  evaluationCriteria: EvaluationCriteria
  adaptationContext: AdaptationContext
  followUpQuestions?: GeneratedQuestion[]
}

interface AdaptationContext {
  triggeredBy: string
  performanceMetrics: UnifiedMetrics
  candidateProfile: CandidateProfile
  interviewProgress: InterviewProgress
  adaptationReason: string
}

interface CandidateProfile {
  strengths: string[]
  weaknesses: string[]
  communicationStyle: 'concise' | 'detailed' | 'analytical' | 'creative'
  confidenceLevel: number
  technicalLevel: 'junior' | 'mid' | 'senior' | 'expert'
  emotionalState: 'calm' | 'nervous' | 'confident' | 'stressed'
}

interface InterviewProgress {
  currentQuestionIndex: number
  totalQuestions: number
  timeElapsed: number
  averageResponseTime: number
  topicsCovered: string[]
  performanceTrend: 'improving' | 'declining' | 'stable'
}

type QuestionCategory = 
  | 'behavioral' 
  | 'technical' 
  | 'situational' 
  | 'cultural_fit' 
  | 'problem_solving'
  | 'leadership'
  | 'communication'
  | 'stress_test'
  | 'creative_thinking'

type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert'

interface FollowUpTrigger {
  condition: string
  threshold: number
  questionId: string
}

interface AdaptationRule {
  trigger: string
  condition: string
  action: 'increase_difficulty' | 'decrease_difficulty' | 'change_category' | 'add_followup' | 'skip_question'
  parameters: Record<string, any>
}

interface EvaluationCriteria {
  expectedKeywords: string[]
  responseLength: { min: number; max: number }
  emotionalTone: string[]
  technicalAccuracy?: boolean
  creativityRequired?: boolean
  leadershipIndicators?: string[]
}

class AdaptiveQuestionService {
  private questionTemplates: Map<string, QuestionTemplate> = new Map()
  private generatedQuestions: GeneratedQuestion[] = []
  private candidateProfile: CandidateProfile | null = null
  private interviewProgress: InterviewProgress | null = null
  private adaptationHistory: AdaptationContext[] = []

  constructor() {
    this.initializeQuestionTemplates()
  }

  private initializeQuestionTemplates(): void {
    const templates: QuestionTemplate[] = [
      // Behavioral Questions
      {
        id: 'behavioral_teamwork_easy',
        category: 'behavioral',
        difficulty: 'easy',
        template: 'Tell me about a time when you worked effectively as part of a team.',
        variables: [],
        followUpTriggers: [
          { condition: 'low_confidence', threshold: 0.6, questionId: 'behavioral_teamwork_support' }
        ],
        adaptationRules: [
          { 
            trigger: 'high_performance', 
            condition: 'overall_score > 0.8', 
            action: 'increase_difficulty',
            parameters: { nextDifficulty: 'medium' }
          }
        ],
        tags: ['teamwork', 'collaboration', 'interpersonal']
      },
      {
        id: 'behavioral_conflict_medium',
        category: 'behavioral',
        difficulty: 'medium',
        template: 'Describe a situation where you had to resolve a conflict with a colleague. How did you handle it?',
        variables: [],
        followUpTriggers: [
          { condition: 'high_stress_indicators', threshold: 0.7, questionId: 'behavioral_conflict_support' }
        ],
        adaptationRules: [
          {
            trigger: 'poor_communication',
            condition: 'communication_score < 0.5',
            action: 'add_followup',
            parameters: { followUpType: 'clarification' }
          }
        ],
        tags: ['conflict_resolution', 'communication', 'problem_solving']
      },
      
      // Technical Questions
      {
        id: 'technical_problem_solving_medium',
        category: 'technical',
        difficulty: 'medium',
        template: 'Walk me through how you would approach solving {problem_type} in {technology_context}.',
        variables: ['problem_type', 'technology_context'],
        followUpTriggers: [
          { condition: 'incomplete_answer', threshold: 0.5, questionId: 'technical_clarification' }
        ],
        adaptationRules: [
          {
            trigger: 'high_technical_confidence',
            condition: 'technical_score > 0.8',
            action: 'increase_difficulty',
            parameters: { nextDifficulty: 'hard' }
          }
        ],
        tags: ['problem_solving', 'technical_skills', 'methodology']
      },

      // Situational Questions
      {
        id: 'situational_pressure_hard',
        category: 'situational',
        difficulty: 'hard',
        template: 'You have 24 hours to deliver a critical project, but you discover a major flaw in your approach. What do you do?',
        variables: [],
        followUpTriggers: [
          { condition: 'high_stress_response', threshold: 0.8, questionId: 'stress_management_followup' }
        ],
        adaptationRules: [
          {
            trigger: 'stress_indicators',
            condition: 'nervousness > 0.7',
            action: 'decrease_difficulty',
            parameters: { nextDifficulty: 'medium' }
          }
        ],
        tags: ['pressure', 'decision_making', 'time_management']
      },

      // Leadership Questions
      {
        id: 'leadership_motivation_medium',
        category: 'leadership',
        difficulty: 'medium',
        template: 'Tell me about a time when you had to motivate a team member who was underperforming.',
        variables: [],
        followUpTriggers: [
          { condition: 'leadership_potential', threshold: 0.7, questionId: 'leadership_advanced' }
        ],
        adaptationRules: [
          {
            trigger: 'high_empathy_indicators',
            condition: 'emotional_intelligence > 0.8',
            action: 'change_category',
            parameters: { nextCategory: 'cultural_fit' }
          }
        ],
        tags: ['leadership', 'motivation', 'team_management']
      },

      // Creative Thinking Questions
      {
        id: 'creative_innovation_hard',
        category: 'creative_thinking',
        difficulty: 'hard',
        template: 'If you could redesign our industry from scratch, what would you change and why?',
        variables: [],
        followUpTriggers: [
          { condition: 'creative_response', threshold: 0.8, questionId: 'creative_implementation' }
        ],
        adaptationRules: [
          {
            trigger: 'analytical_thinking',
            condition: 'analytical_score > 0.8',
            action: 'add_followup',
            parameters: { followUpType: 'implementation_details' }
          }
        ],
        tags: ['creativity', 'innovation', 'strategic_thinking']
      }
    ]

    templates.forEach(template => {
      this.questionTemplates.set(template.id, template)
    })
  }

  async generateNextQuestion(
    currentMetrics: UnifiedMetrics,
    interviewContext: {
      position: string
      industry: string
      experienceLevel: string
      previousQuestions: string[]
      responseHistory: Array<{ question: string; response: string; metrics: UnifiedMetrics }>
    }
  ): Promise<GeneratedQuestion> {
    // Update candidate profile based on current metrics
    this.updateCandidateProfile(currentMetrics, interviewContext.responseHistory)
    
    // Update interview progress
    this.updateInterviewProgress(interviewContext)
    
    // Determine next question based on adaptation rules
    const selectedTemplate = this.selectOptimalQuestion(currentMetrics, interviewContext)
    
    // Generate the actual question
    const generatedQuestion = this.generateQuestionFromTemplate(
      selectedTemplate, 
      currentMetrics, 
      interviewContext
    )
    
    // Store for future adaptation
    this.generatedQuestions.push(generatedQuestion)
    
    return generatedQuestion
  }

  private updateCandidateProfile(metrics: UnifiedMetrics, responseHistory: any[]): void {
    const strengths: string[] = []
    const weaknesses: string[] = []
    
    // Analyze strengths
    if (metrics.overall.communicationEffectiveness > 0.8) strengths.push('communication')
    if (metrics.overall.confidenceLevel > 0.8) strengths.push('confidence')
    if (metrics.bodyLanguage.professionalDemeanor > 0.8) strengths.push('professional_presence')
    if (metrics.facial.expressiveness > 0.8) strengths.push('expressiveness')
    
    // Analyze weaknesses
    if (metrics.overall.communicationEffectiveness < 0.5) weaknesses.push('communication')
    if (metrics.gaze.attentionFocus < 0.5) weaknesses.push('attention')
    if (metrics.bodyLanguage.postureQuality < 0.5) weaknesses.push('posture')
    if (metrics.facial.eyeContactQuality < 0.5) weaknesses.push('eye_contact')
    
    // Determine communication style
    let communicationStyle: CandidateProfile['communicationStyle'] = 'detailed'
    if (responseHistory.length > 0) {
      const avgResponseLength = responseHistory.reduce((sum, r) => sum + r.response.length, 0) / responseHistory.length
      if (avgResponseLength < 100) communicationStyle = 'concise'
      else if (avgResponseLength > 300) communicationStyle = 'detailed'
      else communicationStyle = 'analytical'
    }
    
    // Determine emotional state
    let emotionalState: CandidateProfile['emotionalState'] = 'calm'
    if (metrics.bodyLanguage.professionalDemeanor > 0.8) emotionalState = 'confident'
    else if (metrics.facial.facialEngagement < 0.5) emotionalState = 'nervous'
    else if (metrics.overall.performanceScore < 0.4) emotionalState = 'stressed'
    
    this.candidateProfile = {
      strengths,
      weaknesses,
      communicationStyle,
      confidenceLevel: metrics.overall.confidenceLevel,
      technicalLevel: this.assessTechnicalLevel(responseHistory),
      emotionalState
    }
  }

  private assessTechnicalLevel(responseHistory: any[]): CandidateProfile['technicalLevel'] {
    // Simple heuristic - in production, this would use NLP analysis
    if (responseHistory.length === 0) return 'mid'
    
    const technicalKeywords = ['algorithm', 'architecture', 'framework', 'optimization', 'scalability']
    const technicalMentions = responseHistory.reduce((count, response) => {
      const mentions = technicalKeywords.filter(keyword => 
        response.response.toLowerCase().includes(keyword)
      ).length
      return count + mentions
    }, 0)
    
    const avgTechnicalMentions = technicalMentions / responseHistory.length
    
    if (avgTechnicalMentions > 3) return 'expert'
    if (avgTechnicalMentions > 2) return 'senior'
    if (avgTechnicalMentions > 1) return 'mid'
    return 'junior'
  }

  private updateInterviewProgress(context: any): void {
    this.interviewProgress = {
      currentQuestionIndex: context.previousQuestions.length,
      totalQuestions: 10, // Default interview length
      timeElapsed: Date.now() - (context.startTime || Date.now()),
      averageResponseTime: this.calculateAverageResponseTime(context.responseHistory),
      topicsCovered: this.extractTopicsCovered(context.previousQuestions),
      performanceTrend: this.calculatePerformanceTrend(context.responseHistory)
    }
  }

  private calculateAverageResponseTime(responseHistory: any[]): number {
    if (responseHistory.length === 0) return 0
    return responseHistory.reduce((sum, r) => sum + (r.responseTime || 30000), 0) / responseHistory.length
  }

  private extractTopicsCovered(previousQuestions: string[]): string[] {
    // Simple keyword extraction - in production, use NLP
    const topics = new Set<string>()
    const topicKeywords = {
      'teamwork': ['team', 'collaborate', 'group'],
      'leadership': ['lead', 'manage', 'motivate'],
      'problem_solving': ['problem', 'solve', 'challenge'],
      'communication': ['communicate', 'explain', 'present'],
      'technical': ['technical', 'code', 'system']
    }
    
    previousQuestions.forEach(question => {
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => question.toLowerCase().includes(keyword))) {
          topics.add(topic)
        }
      })
    })
    
    return Array.from(topics)
  }

  private calculatePerformanceTrend(responseHistory: any[]): InterviewProgress['performanceTrend'] {
    if (responseHistory.length < 2) return 'stable'
    
    const recentScores = responseHistory.slice(-3).map(r => r.metrics.overall.performanceScore)
    const earlierScores = responseHistory.slice(0, -3).map(r => r.metrics.overall.performanceScore)
    
    if (earlierScores.length === 0) return 'stable'
    
    const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length
    const earlierAvg = earlierScores.reduce((sum, score) => sum + score, 0) / earlierScores.length
    
    const improvement = recentAvg - earlierAvg
    
    if (improvement > 0.1) return 'improving'
    if (improvement < -0.1) return 'declining'
    return 'stable'
  }

  private selectOptimalQuestion(metrics: UnifiedMetrics, context: any): QuestionTemplate {
    const availableTemplates = Array.from(this.questionTemplates.values())
      .filter(template => !context.previousQuestions.some((q: string) => q.includes(template.id)))
    
    // Score each template based on adaptation rules
    const scoredTemplates = availableTemplates.map(template => ({
      template,
      score: this.scoreTemplate(template, metrics, context)
    }))
    
    // Sort by score and select the best
    scoredTemplates.sort((a, b) => b.score - a.score)
    
    return scoredTemplates[0]?.template || availableTemplates[0]
  }

  private scoreTemplate(template: QuestionTemplate, metrics: UnifiedMetrics, context: any): number {
    let score = 0.5 // Base score
    
    // Difficulty adaptation
    const targetDifficulty = this.getTargetDifficulty(metrics)
    if (template.difficulty === targetDifficulty) score += 0.3
    
    // Category preference based on performance
    const preferredCategory = this.getPreferredCategory(metrics, context)
    if (template.category === preferredCategory) score += 0.2
    
    // Avoid repetition
    const topicsCovered = this.interviewProgress?.topicsCovered || []
    if (template.tags.some(tag => topicsCovered.includes(tag))) score -= 0.1
    
    // Adaptation rules
    template.adaptationRules.forEach(rule => {
      if (this.evaluateCondition(rule.condition, metrics)) {
        score += 0.1
      }
    })
    
    return Math.max(0, Math.min(1, score))
  }

  private getTargetDifficulty(metrics: UnifiedMetrics): DifficultyLevel {
    const overallScore = metrics.overall.performanceScore
    
    if (overallScore > 0.8) return 'hard'
    if (overallScore > 0.6) return 'medium'
    if (overallScore > 0.4) return 'easy'
    return 'easy'
  }

  private getPreferredCategory(metrics: UnifiedMetrics, context: any): QuestionCategory {
    // Adapt based on weaknesses to provide improvement opportunities
    if (metrics.overall.communicationEffectiveness < 0.5) return 'communication'
    if (metrics.bodyLanguage.professionalDemeanor < 0.5) return 'behavioral'
    if (metrics.overall.confidenceLevel < 0.5) return 'situational'
    
    // Or focus on strengths for confidence building
    if (metrics.overall.performanceScore > 0.8) return 'technical'
    
    return 'behavioral' // Default
  }

  private evaluateCondition(condition: string, metrics: UnifiedMetrics): boolean {
    // Simple condition evaluation - in production, use a proper expression parser
    try {
      const context = {
        overall_score: metrics.overall.performanceScore,
        communication_score: metrics.overall.communicationEffectiveness,
        confidence_score: metrics.overall.confidenceLevel,
        technical_score: 0.7, // Mock technical score
        nervousness: 1 - metrics.overall.confidenceLevel,
        emotional_intelligence: metrics.facial.expressiveness,
        analytical_score: metrics.gaze.attentionFocus
      }
      
      // Replace variables in condition
      let evaluableCondition = condition
      Object.entries(context).forEach(([key, value]) => {
        evaluableCondition = evaluableCondition.replace(new RegExp(key, 'g'), value.toString())
      })
      
      // Simple evaluation (in production, use a safe expression evaluator)
      return eval(evaluableCondition)
    } catch (error) {
      console.warn('Failed to evaluate condition:', condition, error)
      return false
    }
  }

  private generateQuestionFromTemplate(
    template: QuestionTemplate, 
    metrics: UnifiedMetrics, 
    context: any
  ): GeneratedQuestion {
    let questionText = template.template
    
    // Replace variables in template
    template.variables.forEach(variable => {
      const replacement = this.getVariableReplacement(variable, context)
      questionText = questionText.replace(`{${variable}}`, replacement)
    })
    
    // Create adaptation context
    const adaptationContext: AdaptationContext = {
      triggeredBy: 'performance_analysis',
      performanceMetrics: metrics,
      candidateProfile: this.candidateProfile!,
      interviewProgress: this.interviewProgress!,
      adaptationReason: this.generateAdaptationReason(template, metrics)
    }
    
    // Generate evaluation criteria
    const evaluationCriteria: EvaluationCriteria = {
      expectedKeywords: this.generateExpectedKeywords(template),
      responseLength: { min: 50, max: 300 },
      emotionalTone: ['confident', 'thoughtful', 'professional'],
      technicalAccuracy: template.category === 'technical',
      creativityRequired: template.category === 'creative_thinking',
      leadershipIndicators: template.category === 'leadership' ? ['initiative', 'influence', 'decision'] : undefined
    }
    
    return {
      id: `${template.id}_${Date.now()}`,
      text: questionText,
      category: template.category,
      difficulty: template.difficulty,
      expectedDuration: this.calculateExpectedDuration(template.difficulty),
      evaluationCriteria,
      adaptationContext
    }
  }

  private getVariableReplacement(variable: string, context: any): string {
    const replacements: Record<string, string[]> = {
      'problem_type': ['performance optimization', 'system design', 'data processing', 'user experience'],
      'technology_context': ['web application', 'mobile app', 'distributed system', 'database design']
    }
    
    const options = replacements[variable] || ['specific example']
    return options[Math.floor(Math.random() * options.length)]
  }

  private generateAdaptationReason(template: QuestionTemplate, metrics: UnifiedMetrics): string {
    if (metrics.overall.performanceScore > 0.8) {
      return `Selected challenging ${template.category} question due to strong performance`
    }
    if (metrics.overall.communicationEffectiveness < 0.5) {
      return `Selected ${template.category} question to assess communication skills`
    }
    if (metrics.overall.confidenceLevel < 0.5) {
      return `Selected supportive ${template.category} question to build confidence`
    }
    return `Selected ${template.category} question based on interview progression`
  }

  private generateExpectedKeywords(template: QuestionTemplate): string[] {
    const keywordMap: Record<QuestionCategory, string[]> = {
      'behavioral': ['experience', 'situation', 'action', 'result', 'learned'],
      'technical': ['approach', 'solution', 'implementation', 'consider', 'optimize'],
      'situational': ['would', 'prioritize', 'decision', 'stakeholders', 'outcome'],
      'cultural_fit': ['values', 'team', 'culture', 'collaboration', 'environment'],
      'problem_solving': ['analyze', 'identify', 'solution', 'steps', 'evaluate'],
      'leadership': ['lead', 'motivate', 'influence', 'decision', 'team'],
      'communication': ['explain', 'communicate', 'present', 'feedback', 'listen'],
      'stress_test': ['pressure', 'deadline', 'challenge', 'manage', 'cope'],
      'creative_thinking': ['innovative', 'creative', 'idea', 'different', 'unique']
    }
    
    return keywordMap[template.category] || []
  }

  private calculateExpectedDuration(difficulty: DifficultyLevel): number {
    const durations = {
      'easy': 60000,    // 1 minute
      'medium': 120000, // 2 minutes
      'hard': 180000,   // 3 minutes
      'expert': 240000  // 4 minutes
    }
    return durations[difficulty]
  }

  // Public API methods
  getCandidateProfile(): CandidateProfile | null {
    return this.candidateProfile
  }

  getInterviewProgress(): InterviewProgress | null {
    return this.interviewProgress
  }

  getAdaptationHistory(): AdaptationContext[] {
    return [...this.adaptationHistory]
  }

  addCustomTemplate(template: QuestionTemplate): void {
    this.questionTemplates.set(template.id, template)
  }

  getAvailableCategories(): QuestionCategory[] {
    return [
      'behavioral', 'technical', 'situational', 'cultural_fit', 
      'problem_solving', 'leadership', 'communication', 'stress_test', 'creative_thinking'
    ]
  }

  getDifficultyLevels(): DifficultyLevel[] {
    return ['easy', 'medium', 'hard', 'expert']
  }
}

export { 
  AdaptiveQuestionService,
  type QuestionTemplate,
  type GeneratedQuestion,
  type CandidateProfile,
  type InterviewProgress,
  type QuestionCategory,
  type DifficultyLevel,
  type AdaptationContext
}
