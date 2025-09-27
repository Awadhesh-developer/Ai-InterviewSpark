import OpenAI from 'openai'

export interface LLMProvider {
  name: 'openai' | 'gemini' | 'claude' | 'local'
  model: string
  apiKey?: string
  endpoint?: string
}

export interface CoachingContext {
  role: string
  userLevel: 'novice' | 'intermediate' | 'advanced' | 'expert'
  sessionType: 'practice' | 'mock-interview' | 'skill-assessment' | 'behavioral'
  focusAreas: string[]
  previousResponses: ConversationMessage[]
  userProfile: {
    experience: string[]
    weaknesses: string[]
    goals: string[]
  }
  emotionalState?: {
    confidence: number
    stress: number
    engagement: number
  }
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp: number
  metadata?: {
    questionType?: string
    difficulty?: number
    category?: string
    followUp?: boolean
  }
}

export interface AICoachResponse {
  message: string
  questionType: 'technical' | 'behavioral' | 'situational' | 'follow-up'
  difficulty: number
  category: string
  hints?: string[]
  followUpQuestions?: string[]
  evaluation?: {
    expectedPoints: string[]
    scoringCriteria: string[]
  }
  adaptiveAdjustments?: {
    increaseComplexity: boolean
    provideSupportiveGuidance: boolean
    focusOnWeakAreas: boolean
  }
}

export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  finishReason: string
}

class LLMIntegrationService {
  private openaiClient: OpenAI | null = null
  private geminiClient: any = null
  private defaultProvider: LLMProvider
  private rolePrompts: Map<string, string> = new Map()

  constructor() {
    this.initializeClients()
    this.setupRolePrompts()
    this.defaultProvider = {
      name: 'openai',
      model: 'gpt-4-turbo-preview',
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
    }
  }

  private initializeClients(): void {
    // Initialize OpenAI
    if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      })
    }

    // Initialize Gemini (Google AI)
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      // Gemini client initialization would go here
      console.log('Gemini API key found, client ready for initialization')
    }
  }

  private setupRolePrompts(): void {
    this.rolePrompts.set('software-engineer', `
You are an expert Software Engineering interview coach with 15+ years of experience at top tech companies (Google, Meta, Amazon, Microsoft). Your expertise includes:

- System Design and Architecture
- Data Structures and Algorithms
- Code Quality and Best Practices
- Technical Leadership and Communication
- Performance Optimization and Scalability

Your coaching style:
- Ask progressively challenging questions based on the candidate's responses
- Provide constructive feedback with specific improvement suggestions
- Adapt difficulty based on the candidate's performance and emotional state
- Focus on both technical depth and communication clarity
- Encourage best practices and industry standards

Always structure your responses as a professional coach would, being supportive yet challenging.
`)

    this.rolePrompts.set('product-manager', `
You are a seasoned Product Management interview coach with extensive experience at leading product companies. Your expertise includes:

- Product Strategy and Vision
- Stakeholder Management and Communication
- Data-Driven Decision Making
- Go-to-Market Strategy
- User Experience and Design Thinking

Your coaching approach:
- Present realistic product scenarios and case studies
- Evaluate strategic thinking and prioritization skills
- Assess communication and leadership capabilities
- Provide frameworks for structured problem-solving
- Focus on business impact and user value

Guide candidates through complex product decisions while teaching them to think like senior product leaders.
`)

    this.rolePrompts.set('data-scientist', `
You are an expert Data Science interview coach with deep experience in machine learning and analytics. Your expertise includes:

- Machine Learning Algorithms and Implementation
- Statistical Analysis and Hypothesis Testing
- Data Engineering and Pipeline Design
- Business Intelligence and Insights
- Model Deployment and MLOps

Your coaching methodology:
- Present real-world data problems and case studies
- Evaluate technical depth and practical application
- Assess ability to communicate complex concepts simply
- Focus on end-to-end ML lifecycle understanding
- Emphasize business impact and ethical considerations

Help candidates demonstrate both technical expertise and business acumen.
`)
  }

  async generateCoachingResponse(
    context: CoachingContext,
    userMessage?: string
  ): Promise<AICoachResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(context)
      const conversationHistory = this.buildConversationHistory(context, userMessage)
      
      const llmResponse = await this.callLLM(systemPrompt, conversationHistory, context)
      
      return this.parseCoachingResponse(llmResponse, context)
    } catch (error) {
      console.error('Error generating coaching response:', error)
      return this.getFallbackResponse(context)
    }
  }

  private buildSystemPrompt(context: CoachingContext): string {
    const basePrompt = this.rolePrompts.get(context.role) || this.rolePrompts.get('software-engineer')!
    
    const contextualPrompt = `
${basePrompt}

CURRENT SESSION CONTEXT:
- Role: ${context.role}
- User Level: ${context.userLevel}
- Session Type: ${context.sessionType}
- Focus Areas: ${context.focusAreas.join(', ')}
- User Experience: ${context.userProfile.experience.join(', ')}
- Areas for Improvement: ${context.userProfile.weaknesses.join(', ')}
- Goals: ${context.userProfile.goals.join(', ')}

${context.emotionalState ? `
EMOTIONAL STATE AWARENESS:
- Confidence: ${Math.round(context.emotionalState.confidence * 100)}%
- Stress Level: ${Math.round(context.emotionalState.stress * 100)}%
- Engagement: ${Math.round(context.emotionalState.engagement * 100)}%

Adjust your coaching style based on these emotional indicators. If stress is high, be more supportive. If confidence is low, provide encouragement. If engagement is low, make questions more interactive.
` : ''}

RESPONSE FORMAT:
Respond with a JSON object containing:
{
  "message": "Your coaching message or question",
  "questionType": "technical|behavioral|situational|follow-up",
  "difficulty": 1-10,
  "category": "specific category",
  "hints": ["optional hints if user struggles"],
  "followUpQuestions": ["potential follow-up questions"],
  "evaluation": {
    "expectedPoints": ["key points to look for in response"],
    "scoringCriteria": ["how to evaluate the response"]
  },
  "adaptiveAdjustments": {
    "increaseComplexity": boolean,
    "provideSupportiveGuidance": boolean,
    "focusOnWeakAreas": boolean
  }
}
`

    return contextualPrompt
  }

  private buildConversationHistory(context: CoachingContext, userMessage?: string): ConversationMessage[] {
    const messages: ConversationMessage[] = [...context.previousResponses]
    
    if (userMessage) {
      messages.push({
        role: 'user',
        content: userMessage,
        timestamp: Date.now()
      })
    }
    
    return messages
  }

  private async callLLM(
    systemPrompt: string,
    conversationHistory: ConversationMessage[],
    context: CoachingContext
  ): Promise<LLMResponse> {
    if (!this.openaiClient) {
      throw new Error('No LLM client available')
    }

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ]

    const response = await this.openaiClient.chat.completions.create({
      model: this.defaultProvider.model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })

    return {
      content: response.choices[0]?.message?.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      },
      model: response.model,
      finishReason: response.choices[0]?.finish_reason || 'stop'
    }
  }

  private parseCoachingResponse(llmResponse: LLMResponse, context: CoachingContext): AICoachResponse {
    try {
      const parsed = JSON.parse(llmResponse.content)
      
      // Validate and ensure all required fields are present
      return {
        message: parsed.message || 'Let\'s continue with your interview preparation.',
        questionType: parsed.questionType || 'technical',
        difficulty: Math.max(1, Math.min(10, parsed.difficulty || 5)),
        category: parsed.category || context.focusAreas[0] || 'General',
        hints: Array.isArray(parsed.hints) ? parsed.hints : [],
        followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions : [],
        evaluation: parsed.evaluation || {
          expectedPoints: [],
          scoringCriteria: []
        },
        adaptiveAdjustments: parsed.adaptiveAdjustments || {
          increaseComplexity: false,
          provideSupportiveGuidance: false,
          focusOnWeakAreas: false
        }
      }
    } catch (error) {
      console.error('Error parsing LLM response:', error)
      return this.getFallbackResponse(context)
    }
  }

  private getFallbackResponse(context: CoachingContext): AICoachResponse {
    const fallbackQuestions = {
      'software-engineer': 'Can you walk me through how you would design a URL shortening service like bit.ly?',
      'product-manager': 'How would you prioritize features for a new mobile app with limited engineering resources?',
      'data-scientist': 'Describe how you would approach building a recommendation system for an e-commerce platform.'
    }

    return {
      message: fallbackQuestions[context.role as keyof typeof fallbackQuestions] || 
               'Tell me about a challenging project you worked on and how you approached it.',
      questionType: 'technical',
      difficulty: 5,
      category: 'General Problem Solving',
      hints: ['Think about the problem systematically', 'Consider scalability and trade-offs'],
      followUpQuestions: ['What challenges did you face?', 'How would you improve your solution?'],
      evaluation: {
        expectedPoints: ['Problem understanding', 'Systematic approach', 'Technical depth'],
        scoringCriteria: ['Clarity of explanation', 'Technical accuracy', 'Consideration of trade-offs']
      },
      adaptiveAdjustments: {
        increaseComplexity: false,
        provideSupportiveGuidance: true,
        focusOnWeakAreas: false
      }
    }
  }

  // Method to evaluate user responses
  async evaluateResponse(
    userResponse: string,
    expectedPoints: string[],
    context: CoachingContext
  ): Promise<{
    score: number
    feedback: string[]
    strengths: string[]
    improvements: string[]
    nextSteps: string[]
  }> {
    try {
      const evaluationPrompt = `
Evaluate this interview response based on the expected points and provide detailed feedback.

RESPONSE TO EVALUATE: "${userResponse}"

EXPECTED POINTS: ${expectedPoints.join(', ')}

CONTEXT: ${context.role} interview, ${context.userLevel} level

Provide evaluation as JSON:
{
  "score": 1-100,
  "feedback": ["specific feedback points"],
  "strengths": ["what they did well"],
  "improvements": ["areas to improve"],
  "nextSteps": ["actionable next steps"]
}
`

      const response = await this.callLLM(evaluationPrompt, [], context)
      const evaluation = JSON.parse(response.content)
      
      return {
        score: Math.max(0, Math.min(100, evaluation.score || 50)),
        feedback: evaluation.feedback || [],
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        nextSteps: evaluation.nextSteps || []
      }
    } catch (error) {
      console.error('Error evaluating response:', error)
      return {
        score: 50,
        feedback: ['Unable to evaluate response at this time'],
        strengths: [],
        improvements: [],
        nextSteps: ['Continue practicing and refining your approach']
      }
    }
  }

  // Method to adapt difficulty based on performance
  adaptDifficulty(
    currentDifficulty: number,
    userPerformance: number,
    emotionalState?: { confidence: number; stress: number }
  ): number {
    let newDifficulty = currentDifficulty

    // Adjust based on performance
    if (userPerformance > 80) {
      newDifficulty += 1
    } else if (userPerformance < 40) {
      newDifficulty -= 1
    }

    // Adjust based on emotional state
    if (emotionalState) {
      if (emotionalState.stress > 0.7) {
        newDifficulty -= 1 // Reduce difficulty if stressed
      }
      if (emotionalState.confidence < 0.3) {
        newDifficulty -= 0.5 // Slightly reduce difficulty if low confidence
      }
    }

    return Math.max(1, Math.min(10, newDifficulty))
  }

  // Method to switch LLM providers
  switchProvider(provider: LLMProvider): void {
    this.defaultProvider = provider
    // Re-initialize clients if needed
    this.initializeClients()
  }

  // Method to get available providers
  getAvailableProviders(): LLMProvider[] {
    const providers: LLMProvider[] = []
    
    if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      providers.push({
        name: 'openai',
        model: 'gpt-4-turbo-preview',
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
      })
      providers.push({
        name: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
      })
    }
    
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      providers.push({
        name: 'gemini',
        model: 'gemini-pro',
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY
      })
    }
    
    return providers
  }
}

export const llmIntegrationService = new LLMIntegrationService()
