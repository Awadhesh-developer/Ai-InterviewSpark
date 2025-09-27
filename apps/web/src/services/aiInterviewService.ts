import { apiClient } from '@/lib/api'
import WebScrapingIntelligenceService from './webScrapingIntelligenceService'
import RealisticAnswerGenerationService from './realisticAnswerGenerationService'

export interface InterviewQuestion {
  id: string
  question: string
  type: 'behavioral' | 'technical' | 'situational' | 'company-specific'
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  expectedDuration: number // in seconds
  followUpQuestions?: string[]
  tips?: string[]
  sampleAnswer?: string
  // Enhanced metadata
  source?: 'ai-generated' | 'scraped' | 'curated'
  freshnessScore?: number
  relevanceScore?: number
  companySpecific?: boolean
  industryTrends?: string[]
  starFramework?: STARFramework
}

export interface STARFramework {
  situation: string
  task: string
  action: string
  result: string
  keyPoints: string[]
}

export interface LLMProvider {
  name: 'openai' | 'gemini' | 'claude'
  model: string
  apiKey: string
  enabled: boolean
  strengths: QuestionType[]
  costPerToken: number
}

export interface QuestionGenerationContext {
  jobTitle: string
  company?: string
  industry: string
  jobDescription?: string
  recentTrends?: string[]
  companyInsights?: CompanyInsight[]
  difficulty: 'easy' | 'medium' | 'hard'
  questionTypes: QuestionType[]
  count: number
}

export interface InterviewSession {
  id: string
  title: string
  jobTitle: string
  company?: string
  industry: string
  duration: number
  questions: InterviewQuestion[]
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  createdAt: Date
  completedAt?: Date
  overallScore?: number
  feedback?: string
}

export interface InterviewResponse {
  questionId: string
  response: string
  duration: number
  audioUrl?: string
  videoUrl?: string
  transcript?: string
  analysis?: ResponseAnalysis
}

export interface ResponseAnalysis {
  score: number
  strengths: string[]
  improvements: string[]
  keywordMatch: number
  clarity: number
  confidence: number
  structure: number
  relevance: number
  suggestions: string[]
}

export interface InterviewFeedback {
  overallScore: number
  categoryScores: {
    communication: number
    technical: number
    behavioral: number
    cultural: number
  }
  strengths: string[]
  improvements: string[]
  recommendations: Array<{
    title: string
    description: string
    actionItems: string[]
    priority: 'high' | 'medium' | 'low'
  }> | string[]
  nextSteps: string[]
}

export interface AICoachSuggestion {
  type: 'preparation' | 'practice' | 'improvement' | 'strategy'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  actionItems: string[]
  estimatedTime: number
}

export interface RoleSpecificCoach {
  role: string
  expertise: string[]
  questionTemplates: QuestionTemplate[]
  evaluationCriteria: EvaluationCriteria
  learningPath: LearningPathStep[]
  industryInsights: IndustryInsight[]
}

export interface QuestionTemplate {
  category: string
  questions: string[]
  followUps: string[]
  evaluationPoints: string[]
  idealResponseStructure: string
}

export interface EvaluationCriteria {
  technical: CriteriaWeight
  behavioral: CriteriaWeight
  communication: CriteriaWeight
  leadership: CriteriaWeight
  problemSolving: CriteriaWeight
}

export interface CriteriaWeight {
  weight: number
  keyIndicators: string[]
  scoringRubric: ScoringLevel[]
}

export interface ScoringLevel {
  level: 'novice' | 'intermediate' | 'advanced' | 'expert'
  score: number
  description: string
  examples: string[]
}

export interface LearningPathStep {
  id: string
  title: string
  description: string
  type: 'skill' | 'knowledge' | 'practice' | 'assessment'
  prerequisites: string[]
  estimatedTime: number
  resources: LearningResource[]
  milestones: Milestone[]
}

export interface LearningResource {
  type: 'article' | 'video' | 'course' | 'practice' | 'book'
  title: string
  url?: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
}

export interface Milestone {
  id: string
  title: string
  description: string
  criteria: string[]
  assessmentType: 'quiz' | 'practice' | 'project' | 'interview'
}

export interface IndustryInsight {
  topic: string
  trend: string
  impact: 'high' | 'medium' | 'low'
  timeframe: string
  recommendations: string[]
  sources: string[]
}

export interface PersonalizedCoachingPlan {
  userId: string
  role: string
  currentLevel: 'novice' | 'intermediate' | 'advanced' | 'expert'
  targetLevel: 'novice' | 'intermediate' | 'advanced' | 'expert'
  strengths: string[]
  weaknesses: string[]
  learningPath: LearningPathStep[]
  milestones: Milestone[]
  estimatedCompletion: Date
  adaptiveAdjustments: AdaptiveAdjustment[]
}

export interface AdaptiveAdjustment {
  trigger: string
  condition: string
  action: 'skip' | 'repeat' | 'supplement' | 'accelerate'
  reason: string
  timestamp: Date
}

// Add missing interfaces
export interface CompanyInsight {
  companyName?: string
  culture: string[]
  values: string[]
  recentNews: string[]
  interviewStyle?: string
  commonQuestions?: string[]
}

export type QuestionType = 'behavioral' | 'technical' | 'situational' | 'company-specific'

interface QuestionTemplateInternal {
  category: string
  template: string
  variables: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  type: QuestionType
}

// Enhanced LLM Integration Service
class EnhancedLLMService {
  private providers: Map<string, LLMProvider> = new Map()
  private promptTemplates: Map<string, QuestionTemplateInternal[]> = new Map()

  constructor() {
    this.initializeProviders()
    this.initializePromptTemplates()
  }

  private initializeProviders() {
    // Note: Providers are now handled server-side for security
    // This initialization is kept for compatibility but not used
    this.providers.set('openai', {
      name: 'openai',
      model: 'gpt-4-turbo-preview',
      apiKey: '', // Server-side only
      enabled: true,
      strengths: ['behavioral', 'situational'],
      costPerToken: 0.00003
    })

    this.providers.set('gemini', {
      name: 'gemini',
      model: 'gemini-1.5-flash',
      apiKey: '', // Server-side only
      enabled: true,
      strengths: ['technical'],
      costPerToken: 0.000125
    })

    this.providers.set('claude', {
      name: 'claude',
      model: 'claude-3-sonnet-20240229',
      apiKey: '', // Server-side only
      enabled: true,
      strengths: ['company-specific'],
      costPerToken: 0.000015
    })
  }

  private initializePromptTemplates() {
    // Behavioral question templates
    this.promptTemplates.set('behavioral', [
      {
        category: 'Leadership',
        template: 'Tell me about a time when you had to {action} in a {context} situation. How did you {approach} and what was the {outcome}?',
        variables: ['action', 'context', 'approach', 'outcome'],
        difficulty: 'medium',
        type: 'behavioral'
      },
      {
        category: 'Problem Solving',
        template: 'Describe a challenging {problem_type} problem you encountered at {context}. Walk me through your {process} and the {result}.',
        variables: ['problem_type', 'context', 'process', 'result'],
        difficulty: 'hard',
        type: 'behavioral'
      }
    ])

    // Technical question templates
    this.promptTemplates.set('technical', [
      {
        category: 'System Design',
        template: 'How would you design a {system_type} system that can handle {scale} {metric}? Consider {constraints} and explain your {architecture}.',
        variables: ['system_type', 'scale', 'metric', 'constraints', 'architecture'],
        difficulty: 'hard',
        type: 'technical'
      },
      {
        category: 'Coding',
        template: 'Implement a {algorithm} that {requirement}. What would be the time and space complexity? How would you {optimization}?',
        variables: ['algorithm', 'requirement', 'optimization'],
        difficulty: 'medium',
        type: 'technical'
      }
    ])

    // Situational question templates
    this.promptTemplates.set('situational', [
      {
        category: 'Conflict Resolution',
        template: 'Imagine you are working on a {project_type} project and {conflict_scenario}. How would you {resolution_approach}?',
        variables: ['project_type', 'conflict_scenario', 'resolution_approach'],
        difficulty: 'medium',
        type: 'situational'
      }
    ])
  }

  // Dynamic model selection based on question type and complexity
  selectOptimalProvider(questionType: QuestionType, complexity: 'easy' | 'medium' | 'hard'): LLMProvider | null {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.enabled && p.strengths.includes(questionType))

    if (availableProviders.length === 0) {
      // Fallback to any available provider
      return Array.from(this.providers.values()).find(p => p.enabled) || null
    }

    // For high complexity, prefer more capable models
    if (complexity === 'hard') {
      return availableProviders.find(p => p.name === 'openai') || availableProviders[0]
    }

    // For medium complexity, balance cost and capability
    if (complexity === 'medium') {
      return availableProviders.find(p => p.name === 'gemini') || availableProviders[0]
    }

    // For easy complexity, prefer cost-effective options
    return availableProviders.sort((a, b) => a.costPerToken - b.costPerToken)[0]
  }

  // Generate questions using selected LLM provider
  async generateQuestionsWithLLM(
    provider: LLMProvider,
    context: QuestionGenerationContext
  ): Promise<InterviewQuestion[]> {
    const prompt = this.buildEnhancedPrompt(context)

    try {
      switch (provider.name) {
        case 'openai':
          return await this.generateWithOpenAI(provider, prompt, context)
        case 'gemini':
          return await this.generateWithGemini(provider, prompt, context)
        case 'claude':
          return await this.generateWithClaude(provider, prompt, context)
        default:
          throw new Error(`Unsupported provider: ${provider.name}`)
      }
    } catch (error) {
      console.error(`Error generating questions with ${provider.name}:`, error)
      return []
    }
  }

  private buildEnhancedPrompt(context: QuestionGenerationContext): string {
    const { jobTitle, company, industry, jobDescription, recentTrends, companyInsights } = context

    let prompt = `Generate ${context.count} high-quality interview questions for a ${jobTitle} position`

    if (company) {
      prompt += ` at ${company}`
    }

    prompt += ` in the ${industry} industry.\n\n`

    if (jobDescription) {
      prompt += `Job Description:\n${jobDescription}\n\n`
    }

    if (recentTrends && recentTrends.length > 0) {
      prompt += `Current Industry Trends:\n${recentTrends.join('\n')}\n\n`
    }

    if (companyInsights && companyInsights.length > 0) {
      const insight = companyInsights[0]
      prompt += `Company Context:\n`
      prompt += `Culture: ${insight.culture.join(', ')}\n`
      prompt += `Values: ${insight.values.join(', ')}\n`
      if (insight.recentNews.length > 0) {
        prompt += `Recent News: ${insight.recentNews.join(', ')}\n`
      }
      prompt += `\n`
    }

    prompt += `Question Requirements:\n`
    prompt += `- Types: ${context.questionTypes.join(', ')}\n`
    prompt += `- Difficulty: ${context.difficulty}\n`
    prompt += `- Each question should be realistic and commonly asked\n`
    prompt += `- Include follow-up questions where appropriate\n`
    prompt += `- Provide STAR method guidance for behavioral questions\n`
    prompt += `- Include expected keywords and evaluation criteria\n\n`

    return prompt
  }

  private async generateWithOpenAI(
    provider: LLMProvider,
    prompt: string,
    context: QuestionGenerationContext
  ): Promise<InterviewQuestion[]> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach with deep knowledge of industry trends and hiring practices. Generate realistic, high-quality interview questions that reflect current market demands.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    return this.parseQuestionsFromResponse(content, 'ai-generated')
  }

  private async generateWithGemini(
    provider: LLMProvider,
    prompt: string,
    context: QuestionGenerationContext
  ): Promise<InterviewQuestion[]> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 3000
        }
      })
    })

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      throw new Error('No content received from Gemini')
    }

    return this.parseQuestionsFromResponse(content, 'ai-generated')
  }

  private async generateWithClaude(
    provider: LLMProvider,
    prompt: string,
    context: QuestionGenerationContext
  ): Promise<InterviewQuestion[]> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 3000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) {
      throw new Error('No content received from Claude')
    }

    return this.parseQuestionsFromResponse(content, 'ai-generated')
  }

  private parseQuestionsFromResponse(content: string, source: string): InterviewQuestion[] {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in response')
      }

      const questions = JSON.parse(jsonMatch[0])

      return questions.map((q: any, index: number) => ({
        id: `llm-${Date.now()}-${index}`,
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        category: q.category,
        expectedDuration: q.expectedDuration || 120,
        followUpQuestions: q.followUpQuestions || [],
        tips: q.tips || [],
        source,
        freshnessScore: 0.9, // High for AI-generated
        relevanceScore: 0.8,
        starFramework: q.starFramework
      }))
    } catch (error) {
      console.error('Error parsing questions from LLM response:', error)
      return []
    }
  }
}

// Quality Assurance Service for question processing
class QuestionQualityAssuranceService {
  async processQuestions(
    questions: InterviewQuestion[],
    context: QuestionGenerationContext
  ): Promise<InterviewQuestion[]> {
    // Step 1: Remove duplicates
    const uniqueQuestions = this.removeDuplicates(questions)

    // Step 2: Score relevance
    const scoredQuestions = await this.scoreRelevance(uniqueQuestions, context)

    // Step 3: Filter by quality threshold
    const qualityQuestions = scoredQuestions.filter(q => (q.relevanceScore || 0) >= 0.7)

    // Step 4: Sort by combined score
    return qualityQuestions.sort((a, b) => {
      const scoreA = (a.relevanceScore || 0) + (a.freshnessScore || 0)
      const scoreB = (b.relevanceScore || 0) + (b.freshnessScore || 0)
      return scoreB - scoreA
    })
  }

  private removeDuplicates(questions: InterviewQuestion[]): InterviewQuestion[] {
    const seen = new Set<string>()
    return questions.filter(question => {
      const normalized = question.question.toLowerCase().replace(/[^\w\s]/g, '').trim()
      if (seen.has(normalized)) {
        return false
      }
      seen.add(normalized)
      return true
    })
  }

  private async scoreRelevance(
    questions: InterviewQuestion[],
    context: QuestionGenerationContext
  ): Promise<InterviewQuestion[]> {
    return questions.map(question => ({
      ...question,
      relevanceScore: this.calculateRelevanceScore(question, context)
    }))
  }

  private calculateRelevanceScore(
    question: InterviewQuestion,
    context: QuestionGenerationContext
  ): number {
    let score = 0.5 // Base score

    // Job title relevance
    if (question.question.toLowerCase().includes(context.jobTitle.toLowerCase())) {
      score += 0.2
    }

    // Industry relevance
    if (question.question.toLowerCase().includes(context.industry.toLowerCase())) {
      score += 0.15
    }

    // Question type alignment
    if (context.questionTypes.includes(question.type)) {
      score += 0.15
    }

    // Company-specific bonus
    if (question.companySpecific && context.company) {
      score += 0.1
    }

    return Math.min(score, 1.0)
  }
}

export class AIInterviewService {
  private llmService: EnhancedLLMService
  private webScrapingService: WebScrapingIntelligenceService
  private answerGenerationService: RealisticAnswerGenerationService
  private qualityAssuranceService: QuestionQualityAssuranceService
  private currentSessionId: string | null = null

  constructor() {
    this.llmService = new EnhancedLLMService()
    this.webScrapingService = new WebScrapingIntelligenceService()
    this.answerGenerationService = new RealisticAnswerGenerationService()
    this.qualityAssuranceService = new QuestionQualityAssuranceService()
  }

  // Enhanced question generation with intelligent LLM integration
  async generateQuestions(params: {
    jobTitle: string
    industry: string
    company?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    count?: number
    types?: string[]
    jobDescription?: string
    llmProvider?: 'openai' | 'gemini' | 'claude' | 'perplexity' | 'auto'
    includeIdealAnswers?: boolean
    sessionId?: string
  }): Promise<InterviewQuestion[]> {
    try {
      console.log(`🧠 Generating ${params.count || 5} intelligent questions using ${params.llmProvider || 'auto'}`);

      // Map difficulty to backend format
      const mappedDifficulty = params.difficulty === 'easy' ? 'beginner' : 
                              params.difficulty === 'hard' ? 'advanced' : 'intermediate';

      // Prefer backend API via direct fetch to avoid interceptor redirects
      try {
        const apiBase = (typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') : 'http://localhost:3001')
        const resp = await fetch(`${apiBase}/api/interviews/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`,
          },
          body: JSON.stringify({
            jobTitle: params.jobTitle,
            industry: params.industry || 'Technology',
            company: params.company,
            difficulty: mappedDifficulty,
            count: params.count || 5,
            types: params.types || ['behavioral', 'technical', 'situational'],
            jobDescription: params.jobDescription,
            llmProvider: params.llmProvider || 'auto',
            includeIdealAnswers: params.includeIdealAnswers !== false,
            sessionId: params.sessionId
          })
        })

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({} as any))
          throw new Error(errData?.error || `HTTP ${resp.status}`)
        }
        const data = await resp.json()

        const list: any[] = Array.isArray(data?.data?.questions)
          ? data.data.questions
          : Array.isArray(data?.questions)
            ? data.questions
            : []

        const normalized: InterviewQuestion[] = list.map((q, index) => ({
          id: q.id || `generated_${Date.now()}_${index}`,
          question: q.question || q.text,
          type: q.type || 'behavioral',
          difficulty: q.difficulty || 'medium',
          category: q.category || 'General',
          expectedDuration: q.expectedDuration || q.timeLimit || 180,
          followUpQuestions: q.followUpQuestions || [],
          tips: q.tips || [],
          source: q.source || 'ai-generated',
          freshnessScore: q.freshnessScore || 0.8,
          relevanceScore: q.relevanceScore || 0.8,
          companySpecific: q.companySpecific || false,
          industryTrends: q.industryTrends || [],
          starFramework: q.starFramework || null
        }))

        // Store session id if provided
        if (data?.data?.sessionId) this.currentSessionId = data.data.sessionId

        if (!normalized.length) throw new Error('No questions returned from backend')

        return normalized
      } catch (backendError) {
        console.warn('Backend generation failed, trying Next route fallback:', backendError)
        // Fallback to local Next route (no auth required)
        const resp = await fetch('/api/interview/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTitle: params.jobTitle,
            industry: params.industry,
            company: params.company,
            difficulty: params.difficulty || 'medium',
            count: params.count || 5,
            types: params.types || ['behavioral', 'technical', 'situational'],
            jobDescription: params.jobDescription,
            includeSampleAnswers: params.includeIdealAnswers !== false
          })
        })

        if (!resp.ok) {
          const err = await resp.text()
          throw new Error(`Next route fallback failed: ${resp.status} ${err}`)
        }
        const fallbackData = await resp.json()
        // The Next route returns a plain array of InterviewQuestion
        return fallbackData as InterviewQuestion[]
      }

    } catch (error) {
      console.error('Error in intelligent question generation:', error)
      // Fallback to basic question templates
      return this.getFallbackQuestions(params)
    }
  }

  private getFallbackQuestions(params: any): InterviewQuestion[] {
    try {
      // Fallback to basic question templates
      const questionTemplates = {
        'software-engineer': [
          {
            question: "Tell me about a challenging technical problem you solved recently.",
            type: 'technical' as const,
            category: 'Problem Solving',
            tips: ['Use the STAR method', 'Focus on your specific contribution', 'Explain your thought process']
          },
          {
            question: "How do you handle code reviews and feedback from senior developers?",
            type: 'behavioral' as const,
            category: 'Collaboration',
            tips: ['Show openness to feedback', 'Demonstrate learning mindset', 'Give specific examples']
          },
          {
            question: "Describe your experience with agile development methodologies.",
            type: 'technical' as const,
            category: 'Process',
            tips: ['Mention specific frameworks', 'Discuss team collaboration', 'Share measurable outcomes']
          }
        ],
        'product-manager': [
          {
            question: "How would you prioritize features for a product with limited resources?",
            type: 'situational' as const,
            category: 'Strategy',
            tips: ['Mention frameworks like RICE', 'Consider user impact', 'Discuss stakeholder alignment']
          },
          {
            question: "Tell me about a time you had to make a difficult product decision.",
            type: 'behavioral' as const,
            category: 'Decision Making',
            tips: ['Use data to support decisions', 'Show stakeholder management', 'Explain the outcome']
          }
        ],
        'data-scientist': [
          {
            question: "Walk me through your approach to a machine learning project from start to finish.",
            type: 'technical' as const,
            category: 'Methodology',
            tips: ['Cover data collection to deployment', 'Mention validation techniques', 'Discuss business impact']
          },
          {
            question: "How do you communicate complex data insights to non-technical stakeholders?",
            type: 'behavioral' as const,
            category: 'Communication',
            tips: ['Use visualization examples', 'Simplify technical concepts', 'Focus on business value']
          }
        ]
      }

      const key = params.jobTitle.toLowerCase().replace(/\s+/g, '-')
      const templates = questionTemplates[key as keyof typeof questionTemplates] || questionTemplates['software-engineer']
      
      return templates.map((template, index) => ({
        id: `q-${index + 1}`,
        question: template.question,
        type: template.type,
        difficulty: params.difficulty || 'medium',
        category: template.category,
        expectedDuration: 120, // 2 minutes
        tips: template.tips,
        followUpQuestions: [
          "Can you elaborate on that?",
          "What would you do differently next time?",
          "How did this experience change your approach?"
        ]
      }))
    } catch (error) {
      console.error('Error generating questions:', error)
      return []
    }
  }

  // Analyze interview response using AI
  async analyzeResponse(
    question: InterviewQuestion,
    response: string,
    audioUrl?: string,
    duration: number = 0
  ): Promise<ResponseAnalysis> {
    try {
      // Mock AI analysis - replace with actual AI API call
      const responseText = response.toLowerCase()
      
      // Simple scoring algorithm - replace with sophisticated AI
      let score = 60 // Base score
      
      // Check for STAR method structure
      if (responseText.includes('situation') || responseText.includes('task') ||
          responseText.includes('action') || responseText.includes('result')) {
        score += 15
      }

      // Check for specific examples
      if (responseText.includes('example') || responseText.includes('specifically') ||
          responseText.includes('for instance')) {
        score += 10
      }
      
      // Check for quantifiable results
      if (/\d+%|\$\d+|\d+\s*(users|customers|projects)/.test(responseText)) {
        score += 15
      }

      // Check response length (optimal 60-180 seconds)
      if (duration >= 60 && duration <= 180) {
        score += 10
      } else if (duration < 30) {
        score -= 10
      }

      const analysis: ResponseAnalysis = {
        score: Math.min(score, 100),
        strengths: this.generateStrengths(responseText, score),
        improvements: this.generateImprovements(responseText, score),
        keywordMatch: this.calculateKeywordMatch(question, responseText),
        clarity: this.assessClarity(responseText),
        confidence: this.assessConfidence(responseText),
        structure: this.assessStructure(responseText),
        relevance: this.assessRelevance(question, responseText),
        suggestions: this.generateSuggestions(question, responseText, score)
      }

      return analysis
    } catch (error) {
      console.error('Error analyzing response:', error)
      return {
        score: 50,
        strengths: [],
        improvements: ['Unable to analyze response'],
        keywordMatch: 0,
        clarity: 50,
        confidence: 50,
        structure: 50,
        relevance: 50,
        suggestions: []
      }
    }
  }

  // Generate personalized coaching suggestions
  async generateCoachingSuggestions(params: {
    jobTitle: string
    industry: string
    recentPerformance: number[]
    weakAreas: string[]
  }): Promise<AICoachSuggestion[]> {
    try {
      const suggestions: AICoachSuggestion[] = []

      // Performance-based suggestions
      const avgScore = params.recentPerformance.reduce((a, b) => a + b, 0) / params.recentPerformance.length

      if (avgScore < 70) {
        suggestions.push({
          type: 'preparation',
          title: 'Intensive Interview Preparation',
          description: 'Focus on fundamental interview skills and common question patterns',
          priority: 'high',
          actionItems: [
            'Practice STAR method responses',
            'Record yourself answering questions',
            'Research common interview questions for your role',
            'Prepare 5-7 strong examples from your experience'
          ],
          estimatedTime: 120 // 2 hours
        })
      }

      // Weak area specific suggestions
      if (params.weakAreas.includes('technical')) {
        suggestions.push({
          type: 'practice',
          title: 'Technical Skills Enhancement',
          description: 'Strengthen your technical interview performance',
          priority: 'high',
          actionItems: [
            'Practice coding problems on LeetCode/HackerRank',
            'Review system design concepts',
            'Prepare technical project explanations',
            'Practice whiteboarding exercises'
          ],
          estimatedTime: 180 // 3 hours
        })
      }

      if (params.weakAreas.includes('behavioral')) {
        suggestions.push({
          type: 'improvement',
          title: 'Behavioral Interview Mastery',
          description: 'Improve your storytelling and behavioral responses',
          priority: 'medium',
          actionItems: [
            'Develop compelling personal stories',
            'Practice emotional intelligence scenarios',
            'Work on active listening skills',
            'Prepare leadership and teamwork examples'
          ],
          estimatedTime: 90 // 1.5 hours
        })
      }

      return suggestions
    } catch (error) {
      console.error('Error generating coaching suggestions:', error)
      return []
    }
  }

  // Generate comprehensive interview feedback
  async generateFeedback(responses: InterviewResponse[]): Promise<InterviewFeedback> {
    try {
      const analyses = responses.map(r => r.analysis).filter(Boolean) as ResponseAnalysis[]
      
      if (analyses.length === 0) {
        throw new Error('No response analyses available')
      }

      const overallScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length

      const categoryScores = {
        communication: analyses.reduce((sum, a) => sum + a.clarity, 0) / analyses.length,
        technical: analyses.reduce((sum, a) => sum + a.relevance, 0) / analyses.length,
        behavioral: analyses.reduce((sum, a) => sum + a.structure, 0) / analyses.length,
        cultural: analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length
      }

      const allStrengths = analyses.flatMap(a => a.strengths)
      const allImprovements = analyses.flatMap(a => a.improvements)

      return {
        overallScore,
        categoryScores,
        strengths: [...new Set(allStrengths)].slice(0, 5),
        improvements: [...new Set(allImprovements)].slice(0, 5),
        recommendations: this.generateRecommendations(overallScore, categoryScores),
        nextSteps: this.generateNextSteps(overallScore, categoryScores)
      }
    } catch (error) {
      console.error('Error generating feedback:', error)
      return {
        overallScore: 50,
        categoryScores: { communication: 50, technical: 50, behavioral: 50, cultural: 50 },
        strengths: [],
        improvements: [],
        recommendations: [],
        nextSteps: []
      }
    }
  }

  // Helper methods
  private generateStrengths(response: string, score: number): string[] {
    const strengths = []
    if (response.length > 100) strengths.push('Provided detailed response')
    if (response.includes('team') || response.includes('collaborate')) strengths.push('Demonstrated teamwork')
    if (/\d+%|\$\d+/.test(response)) strengths.push('Included quantifiable results')
    if (score > 80) strengths.push('Well-structured answer')
    return strengths
  }

  private generateImprovements(response: string, score: number): string[] {
    const improvements = []
    if (response.length < 50) improvements.push('Provide more detailed examples')
    if (score < 70) improvements.push('Use the STAR method for better structure')
    if (!response.includes('result') && !response.includes('outcome')) {
      improvements.push('Include specific outcomes and results')
    }
    return improvements
  }

  private calculateKeywordMatch(question: InterviewQuestion, response: string): number {
    const questionWords = question.question.toLowerCase().split(' ')
    const responseWords = response.toLowerCase().split(' ')
    const matches = questionWords.filter(word => responseWords.includes(word))
    return (matches.length / questionWords.length) * 100
  }

  private assessClarity(response: string): number {
    // Simple clarity assessment - replace with NLP
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = response.length / sentences.length
    return avgSentenceLength > 20 && avgSentenceLength < 100 ? 80 : 60
  }

  private assessConfidence(response: string): number {
    // Simple confidence assessment
    const uncertainWords = ['maybe', 'perhaps', 'i think', 'probably', 'might']
    const uncertainCount = uncertainWords.filter(word => response.toLowerCase().includes(word)).length
    return Math.max(40, 90 - (uncertainCount * 10))
  }

  private assessStructure(response: string): number {
    // Check for logical structure
    const structureWords = ['first', 'then', 'next', 'finally', 'because', 'therefore']
    const structureCount = structureWords.filter(word => response.toLowerCase().includes(word)).length
    return Math.min(90, 50 + (structureCount * 10))
  }

  private assessRelevance(question: InterviewQuestion, response: string): number {
    // Simple relevance check
    const questionKeywords = question.category.toLowerCase().split(' ')
    const responseText = response.toLowerCase()
    const relevantCount = questionKeywords.filter(keyword => responseText.includes(keyword)).length
    return Math.min(90, 40 + (relevantCount * 20))
  }

  private generateSuggestions(question: InterviewQuestion, response: string, score: number): string[] {
    const suggestions = []
    
    if (score < 70) {
      suggestions.push('Practice the STAR method for more structured responses')
    }
    
    if (response.length < 100) {
      suggestions.push('Provide more specific examples and details')
    }
    
    if (!response.includes('result')) {
      suggestions.push('Always conclude with the results or outcomes of your actions')
    }
    
    return suggestions
  }

  private generateRecommendations(overallScore: number, categoryScores: any): string[] {
    const recommendations = []
    
    if (overallScore < 70) {
      recommendations.push('Focus on fundamental interview preparation')
      recommendations.push('Practice with mock interviews regularly')
    }
    
    if (categoryScores.communication < 70) {
      recommendations.push('Work on clear and concise communication')
    }
    
    if (categoryScores.technical < 70) {
      recommendations.push('Strengthen technical knowledge and examples')
    }
    
    return recommendations
  }

  private generateNextSteps(overallScore: number, categoryScores: any): string[] {
    const nextSteps = []
    
    if (overallScore >= 80) {
      nextSteps.push('You\'re ready for real interviews!')
      nextSteps.push('Focus on company-specific preparation')
    } else {
      nextSteps.push('Continue practicing with mock interviews')
      nextSteps.push('Work on identified improvement areas')
    }
    
    return nextSteps
  }

  /**
   * Get questions for interview session (without ideal answers)
   */
  async getQuestionsForSession(sessionId: string): Promise<InterviewQuestion[]> {
    try {
      const apiBase = (typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') : 'http://localhost:3001')
      const response = await fetch(`${apiBase}/api/interviews/sessions/${sessionId}/questions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get questions');
      }

      return data.data.questions;

    } catch (error) {
      console.error('Error getting questions for session:', error);
      throw error;
    }
  }

  /**
   * Submit answer and get feedback with ideal answer comparison
   */
  async submitAnswerAndGetFeedback(questionId: string, userAnswer: string): Promise<{
    feedback: any;
    idealAnswer: string;
    keyPoints: string[];
    scoringCriteria: any;
    userComparison: any;
    improvementSuggestions: string[];
  }> {
    try {
      const apiBase = (typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') : 'http://localhost:3001')
      const response = await fetch(`${apiBase}/api/interviews/questions/${questionId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          userAnswer
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get feedback');
      }

      return data.data.feedback;

    } catch (error) {
      console.error('Error getting feedback:', error);
      throw error;
    }
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Set current session ID
   */
  setCurrentSessionId(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  /**
   * Get authentication token from localStorage or cookie
   */
  private getAuthToken(): string {
    // Try localStorage first
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) return token;

      // Fallback to cookie
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'auth_token') {
          return value;
        }
      }
    }
    return '';
  }
}

export const aiInterviewService = new AIInterviewService()