import { NextRequest, NextResponse } from 'next/server'

interface GenerateQuestionsRequest {
  jobTitle: string
  industry: string
  company?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  count?: number
  types?: string[]
  jobDescription?: string
  includeWebScraping?: boolean
  includeSampleAnswers?: boolean
}

interface InterviewQuestion {
  id: string
  question: string
  type: 'behavioral' | 'technical' | 'situational' | 'company-specific'
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  expectedDuration: number
  followUpQuestions?: string[]
  tips?: string[]
  sampleAnswer?: string
  source?: 'ai-generated' | 'scraped' | 'curated'
  freshnessScore?: number
  relevanceScore?: number
  companySpecific?: boolean
  industryTrends?: string[]
}

class ServerSideAIService {
  private async generateWithOpenAI(prompt: string): Promise<any> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach. Generate realistic interview questions in JSON format. Return only a JSON array of question objects with the following structure: [{"question": "string", "type": "behavioral|technical|situational|company-specific", "difficulty": "easy|medium|hard", "category": "string", "expectedDuration": number, "followUpQuestions": ["string"], "tips": ["string"]}]'
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

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    return this.parseQuestionsFromResponse(content, 'ai-generated')
  }

  private async generateWithGemini(prompt: string): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Gemini API key not configured')
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt + "\n\nPlease return only a valid JSON array of question objects."
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 3000
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      throw new Error('No content received from Gemini')
    }

    return this.parseQuestionsFromResponse(content, 'ai-generated')
  }

  private async generateWithClaude(prompt: string): Promise<any> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      throw new Error('Anthropic API key not configured')
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 3000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt + "\n\nPlease return only a valid JSON array of question objects with the specified structure."
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) {
      throw new Error('No content received from Claude')
    }

    return this.parseQuestionsFromResponse(content, 'ai-generated')
  }

  private parseQuestionsFromResponse(content: string, source: 'ai-generated' | 'scraped' | 'curated'): InterviewQuestion[] {
    try {
      // Try to extract JSON from the response
      let jsonText = content.trim()

      // Remove markdown code blocks if present
      if (jsonText.includes('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      if (jsonText.includes('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      // Look for JSON array in the response
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
      }

      const questions = JSON.parse(jsonText.trim())

      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array')
      }

      return questions.map((q: any, index: number): InterviewQuestion => ({
        id: `llm-${Date.now()}-${index}`,
        question: q.question || 'Sample question',
        type: (q.type === 'behavioral' || q.type === 'technical' || q.type === 'situational' || q.type === 'company-specific') ? q.type : 'behavioral',
        difficulty: (q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard') ? q.difficulty : 'medium',
        category: q.category || 'General',
        expectedDuration: typeof q.expectedDuration === 'number' ? q.expectedDuration : 120,
        followUpQuestions: q.followUpQuestions || [],
        tips: q.tips || [],
        source,
        freshnessScore: 0.9,
        relevanceScore: 0.8
      }))
    } catch (error) {
      console.error('Error parsing questions from LLM response:', error)
      // Return fallback questions
      return this.getFallbackQuestions()
    }
  }

  private getFallbackQuestions(): InterviewQuestion[] {
    return [
      {
        id: 'fallback-1',
        question: "Tell me about a challenging technical problem you solved recently.",
        type: 'technical',
        difficulty: 'medium',
        category: 'Problem Solving',
        expectedDuration: 120,
        followUpQuestions: ["How did you approach debugging?", "What would you do differently?"],
        tips: ['Use the STAR method', 'Focus on your specific contribution', 'Explain your thought process'],
        source: 'curated',
        freshnessScore: 0.7,
        relevanceScore: 0.8
      },
      {
        id: 'fallback-2',
        question: "How do you handle working under pressure and tight deadlines?",
        type: 'behavioral',
        difficulty: 'medium',
        category: 'Work Ethic',
        expectedDuration: 120,
        followUpQuestions: ["Can you give a specific example?", "How do you prioritize tasks?"],
        tips: ['Give concrete examples', 'Show your problem-solving process', 'Demonstrate time management skills'],
        source: 'curated',
        freshnessScore: 0.7,
        relevanceScore: 0.8
      },
      {
        id: 'fallback-3',
        question: "Describe a situation where you had to work with a difficult team member.",
        type: 'behavioral',
        difficulty: 'medium',
        category: 'Teamwork',
        expectedDuration: 120,
        followUpQuestions: ["How did you resolve the conflict?", "What did you learn from this experience?"],
        tips: ['Focus on resolution', 'Show empathy and understanding', 'Highlight communication skills'],
        source: 'curated',
        freshnessScore: 0.7,
        relevanceScore: 0.8
      }
    ]
  }

  private buildPrompt(params: GenerateQuestionsRequest): string {
    const { jobTitle, company, industry, jobDescription, difficulty, count } = params

    let prompt = `Generate ${count || 5} high-quality interview questions for a ${jobTitle} position`

    if (company) {
      prompt += ` at ${company}`
    }

    prompt += ` in the ${industry} industry.\n\n`

    if (jobDescription) {
      prompt += `Job Description:\n${jobDescription}\n\n`
    }

    prompt += `Requirements:\n`
    prompt += `- Difficulty: ${difficulty || 'medium'}\n`
    prompt += `- Types: ${(params.types || ['behavioral', 'technical']).join(', ')}\n`
    prompt += `- Each question should be realistic and commonly asked\n`
    prompt += `- Include follow-up questions where appropriate\n`
    prompt += `- Provide tips for answering each question\n\n`

    return prompt
  }

  async generateQuestions(params: GenerateQuestionsRequest): Promise<InterviewQuestion[]> {
    const prompt = this.buildPrompt(params)

    // Try providers in order of preference
    const providers = [
      { name: 'openai', method: this.generateWithOpenAI.bind(this) },
      { name: 'gemini', method: this.generateWithGemini.bind(this) },
      { name: 'claude', method: this.generateWithClaude.bind(this) }
    ]

    let lastError: Error | null = null

    for (const provider of providers) {
      try {
        console.log(`Trying provider: ${provider.name}`)
        const questions = await provider.method(prompt)
        if (questions && questions.length > 0) {
          console.log(`Successfully generated questions with ${provider.name}`)
          return questions
        }
      } catch (error) {
        console.error(`Error with ${provider.name}:`, error)
        lastError = error as Error
        continue
      }
    }

    console.warn('All providers failed, using fallback questions')
    return this.getFallbackQuestions()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateQuestionsRequest = await request.json()

    // Validate required fields
    if (!body.jobTitle || !body.industry) {
      return NextResponse.json(
        { error: 'Job title and industry are required' },
        { status: 400 }
      )
    }

    const aiService = new ServerSideAIService()
    const questions = await aiService.generateQuestions(body)

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error generating questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    )
  }
}