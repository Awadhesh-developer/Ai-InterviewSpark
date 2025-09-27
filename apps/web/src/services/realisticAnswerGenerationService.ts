/**
 * Realistic Answer Generation Service
 * Generates sample answers using LLMs trained on successful interview responses
 * Implements STAR method and industry-specific templates
 */

import { InterviewQuestion, STARFramework, QuestionGenerationContext, LLMProvider } from './aiInterviewService'

export interface AnswerTemplate {
  type: 'star' | 'problem-solution' | 'feature-benefit' | 'comparison'
  structure: string[]
  keyElements: string[]
  industrySpecific: boolean
}

export interface SampleAnswer {
  id: string
  questionId: string
  answer: string
  structure: AnswerTemplate
  keyPoints: string[]
  estimatedDuration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  industry: string
  role: string
  starFramework?: STARFramework
  tips: string[]
  commonMistakes: string[]
}

export interface AnswerGenerationContext {
  question: InterviewQuestion
  jobTitle: string
  industry: string
  company?: string
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive'
  targetAudience: 'interviewer' | 'candidate'
}

class RealisticAnswerGenerationService {
  private answerTemplates: Map<string, AnswerTemplate[]> = new Map()
  private industryExamples: Map<string, any> = new Map()
  private starTemplates: Map<string, STARFramework[]> = new Map()

  constructor() {
    this.initializeAnswerTemplates()
    this.initializeIndustryExamples()
    this.initializeSTARTemplates()
  }

  private initializeAnswerTemplates() {
    // STAR Method Template
    this.answerTemplates.set('behavioral', [
      {
        type: 'star',
        structure: [
          'Situation: Set the context',
          'Task: Describe your responsibility',
          'Action: Explain what you did',
          'Result: Share the outcome'
        ],
        keyElements: ['specific example', 'quantifiable results', 'personal contribution', 'lessons learned'],
        industrySpecific: false
      }
    ])

    // Technical Problem-Solution Template
    this.answerTemplates.set('technical', [
      {
        type: 'problem-solution',
        structure: [
          'Problem identification',
          'Analysis and research',
          'Solution design',
          'Implementation',
          'Testing and validation',
          'Results and impact'
        ],
        keyElements: ['technical depth', 'systematic approach', 'trade-offs considered', 'measurable outcomes'],
        industrySpecific: true
      }
    ])

    // Situational Response Template
    this.answerTemplates.set('situational', [
      {
        type: 'feature-benefit',
        structure: [
          'Understanding the situation',
          'Key considerations',
          'Approach and methodology',
          'Expected outcomes',
          'Risk mitigation'
        ],
        keyElements: ['analytical thinking', 'stakeholder awareness', 'practical solutions', 'future thinking'],
        industrySpecific: false
      }
    ])
  }

  private initializeIndustryExamples() {
    this.industryExamples.set('technology', {
      commonScenarios: [
        'system outage resolution',
        'feature development',
        'team collaboration',
        'technical debt management',
        'performance optimization'
      ],
      keyMetrics: ['uptime', 'response time', 'user engagement', 'code quality', 'deployment frequency'],
      technologies: ['cloud platforms', 'microservices', 'APIs', 'databases', 'monitoring tools']
    })

    this.industryExamples.set('finance', {
      commonScenarios: [
        'risk assessment',
        'regulatory compliance',
        'process improvement',
        'client relationship management',
        'financial analysis'
      ],
      keyMetrics: ['ROI', 'risk reduction', 'compliance rate', 'client satisfaction', 'cost savings'],
      technologies: ['financial modeling', 'risk management systems', 'regulatory frameworks']
    })

    this.industryExamples.set('healthcare', {
      commonScenarios: [
        'patient care improvement',
        'process optimization',
        'technology implementation',
        'team coordination',
        'quality assurance'
      ],
      keyMetrics: ['patient outcomes', 'efficiency gains', 'error reduction', 'satisfaction scores'],
      technologies: ['EHR systems', 'medical devices', 'healthcare analytics', 'telemedicine']
    })
  }

  private initializeSTARTemplates() {
    this.starTemplates.set('leadership', [
      {
        situation: 'Leading a cross-functional team during a critical project deadline',
        task: 'Coordinate team efforts and ensure project delivery on time',
        action: 'Implemented daily standups, clear communication channels, and resource reallocation',
        result: 'Delivered project 2 days early with 15% under budget',
        keyPoints: ['team coordination', 'communication', 'resource management', 'deadline management']
      }
    ])

    this.starTemplates.set('problem-solving', [
      {
        situation: 'System performance degradation affecting user experience',
        task: 'Identify root cause and implement solution quickly',
        action: 'Conducted systematic analysis, implemented monitoring, and optimized database queries',
        result: 'Reduced response time by 60% and improved user satisfaction by 25%',
        keyPoints: ['analytical thinking', 'systematic approach', 'technical skills', 'impact measurement']
      }
    ])

    this.starTemplates.set('collaboration', [
      {
        situation: 'Working with a difficult stakeholder who had conflicting requirements',
        task: 'Find common ground and deliver a solution that meets business needs',
        action: 'Facilitated workshops, documented requirements clearly, and proposed compromise solutions',
        result: 'Achieved stakeholder buy-in and delivered solution that exceeded expectations',
        keyPoints: ['stakeholder management', 'communication', 'negotiation', 'solution-oriented thinking']
      }
    ])
  }

  // Generate sample answer for a given question
  async generateSampleAnswer(
    question: InterviewQuestion,
    context: QuestionGenerationContext
  ): Promise<string> {
    try {
      const answerContext: AnswerGenerationContext = {
        question,
        jobTitle: context.jobTitle,
        industry: context.industry,
        company: context.company,
        experienceLevel: this.determineExperienceLevel(context.jobTitle),
        targetAudience: 'candidate'
      }

      // Select appropriate template based on question type
      const template = this.selectAnswerTemplate(question.type, answerContext)
      
      // Generate answer using LLM with template guidance
      const answer = await this.generateAnswerWithLLM(answerContext, template)
      
      return answer

    } catch (error) {
      console.error('Error generating sample answer:', error)
      return this.generateFallbackAnswer(question, context)
    }
  }

  // Generate comprehensive answer with STAR framework
  async generateSTARAnswer(
    question: InterviewQuestion,
    context: AnswerGenerationContext
  ): Promise<SampleAnswer> {
    const starTemplate = this.selectSTARTemplate(question.category)
    const industryContext = this.industryExamples.get(context.industry)

    const prompt = this.buildSTARPrompt(question, context, starTemplate, industryContext)
    
    try {
      const response = await this.callLLMForAnswer(prompt, context)
      return this.parseSTARResponse(response, question, context)
    } catch (error) {
      console.error('Error generating STAR answer:', error)
      return this.generateFallbackSTARAnswer(question, context)
    }
  }

  private selectAnswerTemplate(
    questionType: string,
    context: AnswerGenerationContext
  ): AnswerTemplate {
    const templates = this.answerTemplates.get(questionType) || this.answerTemplates.get('behavioral')!
    
    // Select template based on experience level and industry
    if (context.experienceLevel === 'executive' || context.experienceLevel === 'senior') {
      return templates.find(t => t.type === 'star') || templates[0]
    }
    
    return templates[0]
  }

  private selectSTARTemplate(category: string): STARFramework {
    const categoryKey = category.toLowerCase().replace(/\s+/g, '-')
    const templates = this.starTemplates.get(categoryKey) || this.starTemplates.get('problem-solving')!
    return templates[0]
  }

  private buildSTARPrompt(
    question: InterviewQuestion,
    context: AnswerGenerationContext,
    starTemplate: STARFramework,
    industryContext: any
  ): string {
    let prompt = `Generate a realistic, professional interview answer using the STAR method for the following question:\n\n`
    prompt += `Question: "${question.question}"\n\n`
    prompt += `Context:\n`
    prompt += `- Position: ${context.jobTitle}\n`
    prompt += `- Industry: ${context.industry}\n`
    prompt += `- Experience Level: ${context.experienceLevel}\n`
    
    if (context.company) {
      prompt += `- Company: ${context.company}\n`
    }

    prompt += `\nSTAR Framework Template:\n`
    prompt += `Situation: ${starTemplate.situation}\n`
    prompt += `Task: ${starTemplate.task}\n`
    prompt += `Action: ${starTemplate.action}\n`
    prompt += `Result: ${starTemplate.result}\n\n`

    if (industryContext) {
      prompt += `Industry-specific considerations:\n`
      prompt += `- Common scenarios: ${industryContext.commonScenarios.join(', ')}\n`
      prompt += `- Key metrics: ${industryContext.keyMetrics.join(', ')}\n`
      prompt += `- Relevant technologies: ${industryContext.technologies.join(', ')}\n\n`
    }

    prompt += `Requirements:\n`
    prompt += `- Use specific, quantifiable examples\n`
    prompt += `- Keep answer between 90-120 seconds when spoken\n`
    prompt += `- Include relevant industry terminology\n`
    prompt += `- Show progression and growth\n`
    prompt += `- End with lessons learned or future application\n\n`

    prompt += `Return the response in JSON format:\n`
    prompt += `{\n`
    prompt += `  "answer": "Complete STAR-formatted answer",\n`
    prompt += `  "situation": "Situation description",\n`
    prompt += `  "task": "Task description",\n`
    prompt += `  "action": "Action taken",\n`
    prompt += `  "result": "Result achieved",\n`
    prompt += `  "keyPoints": ["point1", "point2", "point3"],\n`
    prompt += `  "tips": ["tip1", "tip2"],\n`
    prompt += `  "commonMistakes": ["mistake1", "mistake2"]\n`
    prompt += `}`

    return prompt
  }

  private async generateAnswerWithLLM(
    context: AnswerGenerationContext,
    template: AnswerTemplate
  ): Promise<string> {
    const prompt = `Generate a professional interview answer for a ${context.jobTitle} position in the ${context.industry} industry.\n\n`
    + `Question: "${context.question.question}"\n\n`
    + `Use the following structure:\n${template.structure.join('\n')}\n\n`
    + `Key elements to include: ${template.keyElements.join(', ')}\n\n`
    + `Keep the answer concise, specific, and professional. Include quantifiable results where possible.`

    // For demo purposes, return a structured answer
    // In production, this would call the actual LLM API
    return this.generateMockAnswer(context, template)
  }

  private async callLLMForAnswer(prompt: string, context: AnswerGenerationContext): Promise<any> {
    // Mock LLM call - in production, this would use OpenAI, Gemini, or Claude
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
    
    return {
      answer: this.generateMockSTARAnswer(context),
      situation: "Working on a critical project with tight deadlines",
      task: "Ensure project delivery while maintaining quality standards",
      action: "Implemented agile methodologies and improved team communication",
      result: "Delivered project on time with 20% improvement in efficiency",
      keyPoints: ["project management", "team leadership", "process improvement"],
      tips: ["Be specific with metrics", "Show leadership qualities"],
      commonMistakes: ["Being too vague", "Not quantifying results"]
    }
  }

  private parseSTARResponse(response: any, question: InterviewQuestion, context: AnswerGenerationContext): SampleAnswer {
    return {
      id: `answer-${Date.now()}`,
      questionId: question.id,
      answer: response.answer,
      structure: this.selectAnswerTemplate(question.type, context),
      keyPoints: response.keyPoints || [],
      estimatedDuration: 120,
      difficulty: question.difficulty as 'beginner' | 'intermediate' | 'advanced',
      industry: context.industry,
      role: context.jobTitle,
      starFramework: {
        situation: response.situation,
        task: response.task,
        action: response.action,
        result: response.result,
        keyPoints: response.keyPoints || []
      },
      tips: response.tips || [],
      commonMistakes: response.commonMistakes || []
    }
  }

  private generateMockAnswer(context: AnswerGenerationContext, template: AnswerTemplate): string {
    const industryContext = this.industryExamples.get(context.industry)
    const scenario = industryContext?.commonScenarios[0] || 'challenging project'
    
    return `In my previous role as a ${context.jobTitle}, I encountered a situation involving ${scenario}. ` +
           `My task was to address this challenge while maintaining our team's productivity. ` +
           `I took action by implementing a systematic approach, collaborating with stakeholders, and ` +
           `leveraging relevant tools and methodologies. As a result, we achieved our objectives ` +
           `with measurable improvements in efficiency and quality. This experience taught me the ` +
           `importance of proactive communication and strategic thinking in complex situations.`
  }

  private generateMockSTARAnswer(context: AnswerGenerationContext): string {
    return `Situation: In my role as ${context.jobTitle}, our team faced a critical deadline for a major project that would impact our quarterly goals. ` +
           `Task: I was responsible for coordinating the team's efforts and ensuring we delivered high-quality results on time. ` +
           `Action: I implemented daily stand-up meetings, created a detailed project timeline, and established clear communication channels between team members. I also identified potential bottlenecks early and reallocated resources accordingly. ` +
           `Result: We successfully delivered the project two days ahead of schedule, which resulted in a 15% increase in client satisfaction and positioned our team as a reliable partner for future initiatives.`
  }

  private generateFallbackAnswer(question: InterviewQuestion, context: QuestionGenerationContext): string {
    return `This is an excellent question about ${question.category.toLowerCase()}. In my experience as a ${context.jobTitle}, ` +
           `I would approach this by first understanding the context and requirements, then developing a systematic plan ` +
           `to address the challenge. I believe in leveraging both technical skills and collaborative approaches to ` +
           `achieve optimal results while maintaining high standards of quality and professionalism.`
  }

  private generateFallbackSTARAnswer(question: InterviewQuestion, context: AnswerGenerationContext): SampleAnswer {
    return {
      id: `fallback-${Date.now()}`,
      questionId: question.id,
      answer: this.generateFallbackAnswer(question, {
        jobTitle: context.jobTitle,
        industry: context.industry,
        company: context.company,
        difficulty: 'medium',
        questionTypes: [question.type] as any,
        count: 1
      }),
      structure: this.answerTemplates.get('behavioral')![0],
      keyPoints: ['systematic approach', 'collaboration', 'quality focus'],
      estimatedDuration: 90,
      difficulty: 'intermediate',
      industry: context.industry,
      role: context.jobTitle,
      tips: ['Use specific examples', 'Quantify results when possible'],
      commonMistakes: ['Being too generic', 'Not showing personal contribution']
    }
  }

  private determineExperienceLevel(jobTitle: string): 'entry' | 'mid' | 'senior' | 'executive' {
    const title = jobTitle.toLowerCase()
    if (title.includes('senior') || title.includes('lead') || title.includes('principal')) {
      return 'senior'
    }
    if (title.includes('director') || title.includes('vp') || title.includes('executive')) {
      return 'executive'
    }
    if (title.includes('junior') || title.includes('entry') || title.includes('associate')) {
      return 'entry'
    }
    return 'mid'
  }
}

export default RealisticAnswerGenerationService
