// Production-Ready Question Generation Engine
// Implements CO-STAR framework with multi-provider LLM integration

import { config } from '../config'
import { db } from '../database/connection'
import { questions, idealAnswers, questionCache } from '../database/schema-v2'
import { eq, and, desc } from 'drizzle-orm'
import { createHash } from 'crypto'
import Redis from 'ioredis'

// CO-STAR Framework Implementation
interface InterviewContext {
  role: string
  position: string
  industry: string
  company?: string
  location?: string
  jobDescription?: string
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead'
  teamSize?: number
  techStack?: string[]
  companyStage?: 'startup' | 'growth' | 'enterprise'
}

interface COSTARPrompt {
  context: string
  objective: string
  style: string
  tone: string
  audience: string
  response: string
}

interface QuestionGenerationRequest {
  interviewContext: InterviewContext
  questionTypes: Array<'behavioral' | 'technical' | 'situational' | 'system-design' | 'coding' | 'company-specific'>
  difficulty: 1 | 2 | 3 | 4 | 5
  count: number
  adaptiveLevel?: 'easy' | 'medium' | 'hard'
  includeFollowUps?: boolean
  generateIdealAnswers?: boolean
  llmProvider?: 'openai' | 'claude' | 'gemini' | 'perplexity' | 'auto'
}

interface GeneratedQuestion {
  id: string
  content: string
  type: string
  category: string
  subcategory?: string
  difficulty: number
  complexity: {
    technical: number
    behavioral: number
    analytical: number
    communication: number
  }
  estimatedDuration: number
  expectedKeywords: string[]
  skillsAssessed: string[]
  tips: string[]
  followUpQuestions: string[]
  starFramework?: {
    situation: string
    task: string
    action: string
    result: string
    keyPoints: string[]
  }
  qualityScore: number
  relevanceScore: number
  freshnessScore: number
  generationMetadata: {
    llmProvider: string
    model: string
    promptVersion: string
    generationTime: number
    tokens: { input: number; output: number }
    cost: number
  }
  idealAnswer?: {
    content: string
    keyPoints: string[]
    scoringCriteria: any
    improvementAreas: string[]
  }
}

export class ProductionQuestionEngine {
  private redis: Redis | null = null
  private llmProviders: Map<string, any> = new Map()

  constructor() {
    this.initializeRedis()
    this.initializeLLMProviders()
  }

  private async initializeRedis() {
    if (!config.redis.enabled || !config.redis.url) {
      console.log('📦 Redis caching disabled - running without cache')
      return
    }

    try {
      this.redis = new Redis(config.redis.url, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 5000,
      })

      this.redis.on('error', () => {
        // Silently handle Redis errors - system works without cache
        this.redis = null
      })

      await this.redis.connect()
      console.log('✅ Question Engine: Redis cache connected')
    } catch (error) {
      console.log('📦 Question Engine: Running without Redis cache')
      this.redis = null
    }
  }

  /**
   * Generate questions using CO-STAR framework with caching and optimization
   */
  async generateQuestions(request: QuestionGenerationRequest): Promise<GeneratedQuestion[]> {
    const startTime = Date.now()
    
    try {
      // Step 1: Check cache first
      const cacheKey = this.generateCacheKey(request)
      const cachedQuestions = await this.getCachedQuestions(cacheKey)
      
      if (cachedQuestions) {
        console.log(`✅ Cache hit for question generation: ${cacheKey}`)
        return cachedQuestions
      }

      // Step 2: Build CO-STAR prompt context
      const costarPrompt = this.buildCOSTARPrompt(request.interviewContext, request)
      
      // Step 3: Select optimal LLM provider
      const selectedProvider = this.selectOptimalLLMProvider(request.llmProvider, request)
      
      // Step 4: Generate questions with selected provider
      const generatedQuestions = await this.generateWithProvider(
        selectedProvider, 
        costarPrompt, 
        request
      )
      
      // Step 5: Enhance questions with metadata and analysis
      const enhancedQuestions = await this.enhanceQuestions(generatedQuestions, request)
      
      // Step 6: Generate ideal answers if requested
      if (request.generateIdealAnswers) {
        await this.generateIdealAnswers(enhancedQuestions, request)
      }
      
      // Step 7: Cache results for future use
      await this.cacheQuestions(cacheKey, enhancedQuestions, {
        generatedAt: new Date().toISOString(),
        llmProvider: selectedProvider.name,
        contextHash: this.hashContext(request.interviewContext),
        qualityScore: this.calculateAverageQuality(enhancedQuestions)
      })
      
      const generationTime = Date.now() - startTime
      console.log(`✅ Generated ${enhancedQuestions.length} questions in ${generationTime}ms using ${selectedProvider.name}`)
      
      return enhancedQuestions

    } catch (error) {
      console.error('❌ Error in question generation:', error)
      
      // Fallback to cached questions from similar contexts
      const fallbackQuestions = await this.getFallbackQuestions(request)
      return fallbackQuestions
    }
  }

  /**
   * Build CO-STAR framework prompt for optimal question generation
   */
  private buildCOSTARPrompt(context: InterviewContext, request: QuestionGenerationRequest): COSTARPrompt {
    const experienceMap = {
      'entry': 'entry-level professional with 0-2 years experience',
      'mid': 'mid-level professional with 3-5 years experience', 
      'senior': 'senior professional with 6-10 years experience',
      'lead': 'lead/principal professional with 10+ years experience'
    }

    return {
      context: `You are an expert technical interviewer for ${context.company || 'a leading company'} in the ${context.industry} industry, conducting interviews for a ${context.position} role. You have extensive experience evaluating candidates across all skill levels and understand the specific requirements for ${context.role} positions.`,
      
      objective: `Generate ${request.count} high-quality, role-specific interview question${request.count > 1 ? 's' : ''} that accurately assess the core competencies required for a ${context.position} role. Each question should evaluate specific skills, knowledge areas, and behavioral traits essential for success in this position at ${context.company || 'the company'}.`,
      
      style: 'Professional, scenario-based questions that reflect real-world challenges and situations the candidate would encounter in this role. Questions should be clear, specific, and designed to elicit detailed responses that demonstrate both technical competency and practical application.',
      
      tone: 'Encouraging yet challenging, designed to help candidates showcase their best abilities while providing meaningful differentiation between skill levels. Questions should feel realistic and relevant to the actual work environment.',
      
      audience: `${experienceMap[context.experienceLevel]} candidate applying for a ${context.position} role${context.techStack ? ` with experience in ${context.techStack.join(', ')}` : ''}. The candidate should feel that questions are fair, relevant, and directly related to the job requirements.`,
      
      response: `Provide exactly ${request.count} interview question${request.count > 1 ? 's' : ''} in valid JSON format. Each question must include: question content, type, difficulty level (1-5), estimated duration, expected keywords, skills assessed, helpful tips, and potential follow-up questions. ${request.includeFollowUps ? 'Include 2-3 relevant follow-up questions for deeper assessment.' : ''}`
    }
  }

  /**
   * Select optimal LLM provider based on question type and requirements
   */
  private selectOptimalLLMProvider(requested?: string, request?: QuestionGenerationRequest): any {
    if (requested && requested !== 'auto' && this.llmProviders.has(requested)) {
      return this.llmProviders.get(requested)
    }

    // Auto-selection based on question types and complexity
    const hasSystemDesign = request?.questionTypes.includes('system-design')
    const hasCoding = request?.questionTypes.includes('coding')
    const hasCompanySpecific = request?.questionTypes.includes('company-specific')
    
    // Perplexity for real-time, company-specific questions
    if (hasCompanySpecific && this.llmProviders.has('perplexity')) {
      return this.llmProviders.get('perplexity')
    }
    
    // Claude for system design and complex technical questions
    if ((hasSystemDesign || hasCoding) && this.llmProviders.has('claude')) {
      return this.llmProviders.get('claude')
    }
    
    // OpenAI for general high-quality questions
    if (this.llmProviders.has('openai')) {
      return this.llmProviders.get('openai')
    }
    
    // Gemini as fallback
    if (this.llmProviders.has('gemini')) {
      return this.llmProviders.get('gemini')
    }
    
    throw new Error('No LLM providers available')
  }

  /**
   * Generate questions with specific LLM provider
   */
  private async generateWithProvider(
    provider: any, 
    costarPrompt: COSTARPrompt, 
    request: QuestionGenerationRequest
  ): Promise<any[]> {
    const fullPrompt = this.buildFullPrompt(costarPrompt, request)
    const startTime = Date.now()

    try {
      let response
      
      switch (provider.name) {
        case 'openai':
          response = await this.generateWithOpenAI(provider, fullPrompt, request)
          break
        case 'claude':
          response = await this.generateWithClaude(provider, fullPrompt, request)
          break
        case 'gemini':
          response = await this.generateWithOpenAI(provider, fullPrompt, request) // Use OpenAI as fallback
          break
        case 'perplexity':
          response = await this.generateWithPerplexity(provider, fullPrompt, request)
          break
        default:
          throw new Error(`Unsupported provider: ${provider.name}`)
      }

      const generationTime = Date.now() - startTime
      
      return response.map((q: any) => ({
        ...q,
        generationMetadata: {
          llmProvider: provider.name,
          model: provider.model,
          promptVersion: '1.0',
          generationTime,
          tokens: response.tokens || { input: 0, output: 0 },
          cost: this.calculateCost(provider, response.tokens)
        }
      }))

    } catch (error) {
      console.error(`Error generating with ${provider.name}:`, error)
      throw error
    }
  }

  /**
   * Generate questions using OpenAI GPT-4
   */
  private async generateWithOpenAI(provider: any, prompt: string, request: QuestionGenerationRequest): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.ai.openai.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview question generator. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`)
    }

    const content = data.choices[0].message.content
    const parsed = JSON.parse(content)
    
    return {
      ...parsed,
      tokens: data.usage
    }
  }

  /**
   * Generate questions using Anthropic Claude
   */
  private async generateWithClaude(provider: any, prompt: string, request: QuestionGenerationRequest): Promise<any> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY || '',
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt + '\n\nPlease respond with valid JSON only.'
          }
        ]
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`Claude API error: ${data.error?.message || 'Unknown error'}`)
    }

    const content = data.content[0].text
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Claude response')
    }

    return {
      ...JSON.parse(jsonMatch[0]),
      tokens: data.usage
    }
  }

  /**
   * Generate questions using Perplexity for real-time context
   */
  private async generateWithPerplexity(provider: any, prompt: string, request: QuestionGenerationRequest): Promise<any> {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.ai.perplexity?.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview question generator with access to current industry information. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: prompt + '\n\nInclude current industry trends and recent developments in your questions.'
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${data.error?.message || 'Unknown error'}`)
    }

    const content = data.choices[0].message.content
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Perplexity response')
    }

    return {
      ...JSON.parse(jsonMatch[0]),
      tokens: data.usage
    }
  }

  /**
   * Build full prompt with context and requirements
   */
  private buildFullPrompt(costarPrompt: COSTARPrompt, request: QuestionGenerationRequest): string {
    const questionTypesDesc = {
      'behavioral': 'Past experiences and situations that demonstrate skills and competencies',
      'technical': 'Role-specific technical knowledge and problem-solving abilities',
      'situational': 'Hypothetical scenarios to assess decision-making and approach',
      'system-design': 'Architecture and design thinking for complex systems',
      'coding': 'Programming and algorithmic problem-solving skills',
      'company-specific': 'Company culture, values, and specific organizational knowledge'
    }

    return `
**CONTEXT**: ${costarPrompt.context}

**OBJECTIVE**: ${costarPrompt.objective}

**STYLE**: ${costarPrompt.style}

**TONE**: ${costarPrompt.tone}

**AUDIENCE**: ${costarPrompt.audience}

**RESPONSE**: ${costarPrompt.response}

**REQUIREMENTS**:
- Question Types: ${request.questionTypes.map(type => `${type} (${questionTypesDesc[type]})`).join(', ')}
- Difficulty Level: ${request.difficulty}/5
- Total Questions: ${request.count}
- Include Follow-ups: ${request.includeFollowUps ? 'Yes' : 'No'}

**OUTPUT FORMAT** (JSON):
{
  "questions": [
    {
      "content": "The actual interview question",
      "type": "behavioral|technical|situational|system-design|coding|company-specific",
      "category": "Main category (e.g., Problem Solving, Leadership, etc.)",
      "subcategory": "Specific subcategory if applicable",
      "difficulty": 1-5,
      "complexity": {
        "technical": 1-5,
        "behavioral": 1-5,
        "analytical": 1-5,
        "communication": 1-5
      },
      "estimatedDuration": 180,
      "expectedKeywords": ["keyword1", "keyword2"],
      "skillsAssessed": ["skill1", "skill2"],
      "tips": ["tip1", "tip2"],
      "followUpQuestions": ["follow-up1", "follow-up2"],
      "starFramework": {
        "situation": "Describe the situation context",
        "task": "Explain the task or challenge",
        "action": "Detail the actions taken",
        "result": "Share the outcomes achieved",
        "keyPoints": ["point1", "point2"]
      }
    }
  ]
}

Generate exactly ${request.count} question${request.count > 1 ? 's' : ''} following this format.
    `.trim()
  }

  /**
   * Enhance questions with additional metadata and quality scoring
   */
  private async enhanceQuestions(
    questions: any[], 
    request: QuestionGenerationRequest
  ): Promise<GeneratedQuestion[]> {
    return questions.map((q, index) => ({
      id: `gen_${Date.now()}_${index}`,
      content: q.content,
      type: q.type,
      category: q.category,
      subcategory: q.subcategory,
      difficulty: q.difficulty || request.difficulty,
      complexity: q.complexity || {
        technical: request.difficulty,
        behavioral: request.difficulty,
        analytical: request.difficulty,
        communication: request.difficulty
      },
      estimatedDuration: q.estimatedDuration || 180,
      expectedKeywords: q.expectedKeywords || [],
      skillsAssessed: q.skillsAssessed || [],
      tips: q.tips || [],
      followUpQuestions: q.followUpQuestions || [],
      starFramework: q.starFramework,
      qualityScore: this.calculateQualityScore(q),
      relevanceScore: this.calculateRelevanceScore(q, request.interviewContext),
      freshnessScore: this.calculateFreshnessScore(q),
      generationMetadata: q.generationMetadata || {
        llmProvider: 'unknown',
        model: 'unknown',
        promptVersion: '1.0',
        generationTime: 0,
        tokens: { input: 0, output: 0 },
        cost: 0
      }
    }))
  }

  /**
   * Generate ideal answers for questions
   */
  private async generateIdealAnswers(
    questions: GeneratedQuestion[], 
    request: QuestionGenerationRequest
  ): Promise<void> {
    for (const question of questions) {
      try {
        const idealAnswer = await this.generateIdealAnswer(question, request.interviewContext)
        question.idealAnswer = idealAnswer
      } catch (error) {
        console.error(`Error generating ideal answer for question ${question.id}:`, error)
        // Continue with other questions
      }
    }
  }

  /**
   * Generate ideal answer for a specific question
   */
  private async generateIdealAnswer(
    question: GeneratedQuestion, 
    context: InterviewContext
  ): Promise<any> {
    const prompt = `
Generate an ideal answer for this ${question.type} interview question:

**Question**: ${question.content}
**Role**: ${context.position}
**Company**: ${context.company || 'the company'}
**Industry**: ${context.industry}
**Experience Level**: ${context.experienceLevel}

**Requirements**:
1. Provide a comprehensive, well-structured answer
2. Use the STAR method if applicable
3. Include specific examples and quantifiable results
4. Demonstrate both technical and soft skills
5. Make it relevant to the ${context.position} role

**Response Format (JSON)**:
{
  "content": "Complete ideal answer text",
  "keyPoints": ["key point 1", "key point 2"],
  "scoringCriteria": {
    "technical": {"weight": 30, "description": "Technical accuracy and depth"},
    "communication": {"weight": 25, "description": "Clarity and structure"},
    "structure": {"weight": 25, "description": "Logical organization"},
    "relevance": {"weight": 20, "description": "Job relevance and examples"}
  },
  "improvementAreas": ["area 1", "area 2"]
}
    `.trim()

    // Use the same provider that generated the question
    const provider = this.llmProviders.get('openai') // Default to OpenAI for ideal answers
    
    if (!provider) {
      throw new Error('No provider available for ideal answer generation')
    }

    const response = await this.generateWithOpenAI(provider, prompt, {
      count: 1,
      questionTypes: [question.type as any],
      difficulty: this.mapDifficultyToNumber(question.difficulty),
      interviewContext: context
    })

    return response.questions?.[0] || response
  }

  /**
   * Helper method to map difficulty strings to numbers
   */
  private mapDifficultyToNumber(difficulty: any): 1 | 2 | 3 | 4 | 5 {
    if (typeof difficulty === 'number') return Math.max(1, Math.min(5, difficulty)) as 1 | 2 | 3 | 4 | 5;
    
    const difficultyMap: Record<string, 1 | 2 | 3 | 4 | 5> = {
      'beginner': 1,
      'easy': 2,
      'intermediate': 3,
      'medium': 3,
      'advanced': 4,
      'hard': 5,
      'expert': 5
    };
    return difficultyMap[difficulty?.toLowerCase()] || 3;
  }

  /**
   * Cache management methods
   */
  private generateCacheKey(request: QuestionGenerationRequest): string {
    const keyData = {
      context: request.interviewContext,
      types: request.questionTypes.sort(),
      difficulty: request.difficulty,
      count: request.count
    }
    
    return `questions:${createHash('sha256').update(JSON.stringify(keyData)).digest('hex')}`
  }

  private async getCachedQuestions(cacheKey: string): Promise<GeneratedQuestion[] | null> {
    if (!this.redis) return null
    
    try {
      const cached = await this.redis.get(cacheKey)
      if (cached) {
        const data = JSON.parse(cached)
        // Update access count
        await this.redis.incr(`${cacheKey}:access`)
        return data.questions
      }
    } catch (error) {
      console.error('Cache retrieval error:', error)
    }
    return null
  }

  private async cacheQuestions(
    cacheKey: string, 
    questions: GeneratedQuestion[], 
    metadata: any
  ): Promise<void> {
    try {
      const cacheData = {
        questions,
        metadata,
        cachedAt: new Date().toISOString()
      }
      
      // Cache for 1 hour
      if (this.redis) {
        await this.redis.setex(cacheKey, 3600, JSON.stringify(cacheData))
      }
      
      // Also store in database for long-term caching
      await db.insert(questionCache).values({
        cacheKey,
        questions: questions as any,
        metadata: metadata as any,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour
      }).onConflictDoUpdate({
        target: questionCache.cacheKey,
        set: {
          questions: questions as any,
          metadata: metadata as any,
          lastAccessed: new Date(),
          accessCount: 1 // Simplified for now
        }
      })
      
    } catch (error) {
      console.error('Cache storage error:', error)
    }
  }

  /**
   * Quality scoring methods
   */
  private calculateQualityScore(question: any): number {
    let score = 0.8 // Base score
    
    // Content length and detail
    if (question.content && question.content.length > 100) score += 0.1
    if (question.content && question.content.length > 200) score += 0.05
    
    // Has follow-up questions
    if (question.followUpQuestions && question.followUpQuestions.length > 0) score += 0.05
    
    // Has tips
    if (question.tips && question.tips.length > 0) score += 0.03
    
    // Has STAR framework (for behavioral questions)
    if (question.type === 'behavioral' && question.starFramework) score += 0.07
    
    return Math.min(score, 1.0)
  }

  private calculateRelevanceScore(question: any, context: InterviewContext): number {
    let score = 0.7 // Base score
    
    // Industry-specific terms
    if (question.content.toLowerCase().includes(context.industry.toLowerCase())) score += 0.1
    
    // Role-specific terms
    if (question.content.toLowerCase().includes(context.position.toLowerCase())) score += 0.1
    
    // Company-specific (if available)
    if (context.company && question.content.toLowerCase().includes(context.company.toLowerCase())) {
      score += 0.1
    }
    
    return Math.min(score, 1.0)
  }

  private calculateFreshnessScore(question: any): number {
    // For now, return high freshness for newly generated questions
    // In production, this could factor in industry trends, recent developments, etc.
    return 0.95
  }

  private calculateAverageQuality(questions: GeneratedQuestion[]): number {
    if (questions.length === 0) return 0
    
    const totalScore = questions.reduce((sum, q) => sum + q.qualityScore, 0)
    return totalScore / questions.length
  }

  private hashContext(context: InterviewContext): string {
    return createHash('sha256').update(JSON.stringify(context)).digest('hex')
  }

  private calculateCost(provider: any, tokens: any): number {
    // Simplified cost calculation - would be more sophisticated in production
    const costPer1k = {
      'openai': 0.03,
      'claude': 0.015,
      'gemini': 0.001,
      'perplexity': 0.001
    }
    
    const rate = costPer1k[provider.name as keyof typeof costPer1k] || 0.01
    const totalTokens = (tokens?.input || 0) + (tokens?.output || 0)
    
    return (totalTokens / 1000) * rate
  }

  /**
   * Fallback questions for when generation fails
   */
  private async getFallbackQuestions(request: QuestionGenerationRequest): Promise<GeneratedQuestion[]> {
    // Try to get similar cached questions first
    // If none available, return high-quality template questions
    
    const templates = [
      {
        content: `Tell me about a challenging ${request.interviewContext.position} project you worked on recently. What made it challenging and how did you approach it?`,
        type: 'behavioral',
        category: 'Problem Solving',
        difficulty: request.difficulty
      },
      {
        content: `How do you stay current with developments in ${request.interviewContext.industry}? Can you share an example of how you applied new knowledge?`,
        type: 'technical',
        category: 'Continuous Learning',
        difficulty: request.difficulty
      },
      {
        content: `Describe a situation where you had to work with a difficult team member or stakeholder. How did you handle it?`,
        type: 'situational',
        category: 'Interpersonal Skills',
        difficulty: request.difficulty
      }
    ]

    return templates.slice(0, request.count).map((template, index) => ({
      id: `fallback_${Date.now()}_${index}`,
      content: template.content,
      type: template.type,
      category: template.category,
      difficulty: template.difficulty,
      complexity: {
        technical: template.difficulty,
        behavioral: template.difficulty,
        analytical: template.difficulty,
        communication: template.difficulty
      },
      estimatedDuration: 180,
      expectedKeywords: [],
      skillsAssessed: [template.category.toLowerCase().replace(' ', '_')],
      tips: ['Use the STAR method', 'Be specific with examples', 'Show your impact'],
      followUpQuestions: ['Can you provide more details?', 'What would you do differently?'],
      qualityScore: 0.7,
      relevanceScore: 0.6,
      freshnessScore: 0.5,
      generationMetadata: {
        llmProvider: 'fallback',
        model: 'template',
        promptVersion: '1.0',
        generationTime: 0,
        tokens: { input: 0, output: 0 },
        cost: 0
      }
    }))
  }

  /**
   * Initialize LLM providers
   */
  private initializeLLMProviders(): void {
    if (config.ai.openai.apiKey) {
      this.llmProviders.set('openai', {
        name: 'openai',
        model: 'gpt-4o-mini',
        apiKey: config.ai.openai.apiKey
      })
    }

    if (process.env.CLAUDE_API_KEY) {
      this.llmProviders.set('claude', {
        name: 'claude',
        model: 'claude-3-sonnet-20240229',
        apiKey: process.env.CLAUDE_API_KEY
      })
    }

    if (config.ai.gemini.apiKey) {
      this.llmProviders.set('gemini', {
        name: 'gemini',
        model: 'gemini-1.5-flash',
        apiKey: config.ai.gemini.apiKey
      })
    }

    if (config.ai.perplexity?.apiKey) {
      this.llmProviders.set('perplexity', {
        name: 'perplexity',
        model: 'llama-3.1-sonar-small-128k-online',
        apiKey: config.ai.perplexity.apiKey
      })
    }

    console.log(`🤖 Initialized ${this.llmProviders.size} LLM providers:`, Array.from(this.llmProviders.keys()))
  }
}

export default ProductionQuestionEngine
