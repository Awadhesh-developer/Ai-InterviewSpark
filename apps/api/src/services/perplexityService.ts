// Perplexity API Service for Real-time Interview Question Generation
// Integrates with Perplexity API to generate contextual, up-to-date interview questions

import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { createError, QuestionType } from '../types';

export interface PerplexityQuestion {
  id: string;
  question: string;
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  context: string;
  followUpQuestions: string[];
  tips: string[];
  relevanceScore: number;
  freshnessScore: number;
  industryTrends: string[];
  companySpecific: boolean;
  realTimeContext?: {
    marketTrends: string[];
    recentNews: string[];
    industryUpdates: string[];
  };
}

export interface PerplexityGenerationParams {
  jobTitle: string;
  company?: string;
  industry: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionTypes: QuestionType[];
  count: number;
  includeRealTimeContext?: boolean;
  includeCompanyNews?: boolean;
  includeIndustryTrends?: boolean;
  customContext?: string;
}

export class PerplexityService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL = 'https://api.perplexity.ai';

  constructor() {
    this.apiKey = config.ai.perplexity?.apiKey || process.env.PERPLEXITY_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ Perplexity API key not configured. Real-time question generation will be limited.');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Generate real-time interview questions using Perplexity API
   */
  async generateRealTimeQuestions(params: PerplexityGenerationParams): Promise<PerplexityQuestion[]> {
    try {
      if (!this.apiKey) {
        console.warn('Perplexity API not available, falling back to static questions');
        return this.getFallbackQuestions(params);
      }

      // Step 1: Get real-time context if requested
      const realTimeContext = params.includeRealTimeContext ? 
        await this.getRealTimeContext(params) : null;

      // Step 2: Build enhanced prompt with real-time data
      const prompt = this.buildEnhancedPrompt(params, realTimeContext);

      // Step 3: Generate questions using Perplexity
      const response = await this.client.post('/chat/completions', {
        model: 'llama-3.1-sonar-small-128k-online', // Use online model for real-time data
        messages: [
          {
            role: 'system',
            content: `You are an expert interview coach and recruiter. Generate highly relevant, up-to-date interview questions based on current industry trends and real-time information. Always provide questions in valid JSON format.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        top_p: 0.9,
      });

      // Step 4: Parse and enhance the response
      const questions = this.parsePerplexityResponse(response.data, params);
      if (!questions || questions.length === 0) {
        // If Perplexity returns nothing/invalid, fall back to template set sized to count
        return this.getFallbackQuestions(params).slice(0, params.count);
      }
      
      // Step 5: Add metadata and scoring
      return this.enhanceQuestionsWithMetadata(questions, params, realTimeContext);

    } catch (error) {
      console.error('Error generating questions with Perplexity:', error);
      
      // Fallback to static questions if Perplexity fails
      return this.getFallbackQuestions(params);
    }
  }

  /**
   * Get real-time context about the company, industry, and market trends
   */
  private async getRealTimeContext(params: PerplexityGenerationParams): Promise<any> {
    try {
      const contextPrompt = `
        Provide current, up-to-date information about:
        1. Recent news and developments at ${params.company || 'companies in ' + params.industry}
        2. Current trends in ${params.industry} industry
        3. Recent market developments affecting ${params.jobTitle} roles
        4. Latest technologies and skills in demand for ${params.jobTitle}
        
        Format the response as JSON with keys: companyNews, industryTrends, marketDevelopments, skillsTrends
      `;

      const response = await this.client.post('/chat/completions', {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant providing current, factual information. Always respond in valid JSON format.'
          },
          {
            role: 'user',
            content: contextPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      return this.parseContextResponse(response.data);

    } catch (error) {
      console.error('Error fetching real-time context:', error);
      return null;
    }
  }

  /**
   * Build enhanced prompt for question generation
   */
  private buildEnhancedPrompt(params: PerplexityGenerationParams, realTimeContext?: any): string {
    const contextSection = realTimeContext ? `
      REAL-TIME CONTEXT:
      - Company News: ${realTimeContext.companyNews || 'N/A'}
      - Industry Trends: ${realTimeContext.industryTrends || 'N/A'}
      - Market Developments: ${realTimeContext.marketDevelopments || 'N/A'}
      - Skills in Demand: ${realTimeContext.skillsTrends || 'N/A'}
    ` : '';

    return `
      Generate ${params.count} highly relevant interview questions for the following role:
      
      JOB DETAILS:
      - Position: ${params.jobTitle}
      - Company: ${params.company || 'Not specified'}
      - Industry: ${params.industry}
      - Difficulty Level: ${params.difficulty}
      - Question Types: ${params.questionTypes.join(', ')}
      
      ${contextSection}
      
      ${params.customContext ? `ADDITIONAL CONTEXT: ${params.customContext}` : ''}
      
      REQUIREMENTS:
      1. Questions should be current and reflect latest industry practices
      2. Include follow-up questions for deeper assessment
      3. Provide practical tips for answering each question
      4. Consider real-time market conditions and trends
      5. Make questions specific to the role and industry
      
      RESPONSE FORMAT (JSON):
      {
        "questions": [
          {
            "id": "unique_id",
            "question": "Main interview question",
            "type": "behavioral|technical|situational|company_specific",
            "difficulty": "easy|medium|hard",
            "category": "specific category",
            "context": "Why this question is relevant",
            "followUpQuestions": ["follow-up 1", "follow-up 2"],
            "tips": ["tip 1", "tip 2", "tip 3"],
            "relevanceScore": 0.95,
            "freshnessScore": 0.90,
            "industryTrends": ["trend1", "trend2"],
            "companySpecific": true|false
          }
        ]
      }
      
      Ensure all questions are:
      - Relevant to current market conditions
      - Appropriate for the specified difficulty level
      - Aligned with modern hiring practices
      - Include real-world scenarios when possible
    `;
  }

  /**
   * Parse Perplexity API response and extract questions
   */
  private parsePerplexityResponse(response: any, params: PerplexityGenerationParams): any[] {
    try {
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in Perplexity response');
      }

      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.questions || [];

    } catch (error) {
      console.error('Error parsing Perplexity response:', error);
      return [];
    }
  }

  /**
   * Parse context response from Perplexity
   */
  private parseContextResponse(response: any): any {
    try {
      const content = response.choices?.[0]?.message?.content;
      if (!content) return null;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error('Error parsing context response:', error);
      return null;
    }
  }

  /**
   * Enhance questions with additional metadata
   */
  private enhanceQuestionsWithMetadata(
    questions: any[], 
    params: PerplexityGenerationParams, 
    realTimeContext?: any
  ): PerplexityQuestion[] {
    return questions.map((q, index) => ({
      id: q.id || `perplexity_${Date.now()}_${index}`,
      question: q.question,
      type: this.mapQuestionType(q.type),
      difficulty: q.difficulty || params.difficulty,
      category: q.category || 'General',
      context: q.context || '',
      followUpQuestions: q.followUpQuestions || [],
      tips: q.tips || [],
      relevanceScore: q.relevanceScore || 0.8,
      freshnessScore: q.freshnessScore || 0.9, // High since from real-time API
      industryTrends: q.industryTrends || [],
      companySpecific: q.companySpecific || false,
      realTimeContext: realTimeContext ? {
        marketTrends: realTimeContext.marketDevelopments?.split('\n') || [],
        recentNews: realTimeContext.companyNews?.split('\n') || [],
        industryUpdates: realTimeContext.industryTrends?.split('\n') || [],
      } : undefined,
    }));
  }

  /**
   * Map string question type to QuestionType enum
   */
  private mapQuestionType(type: string): QuestionType {
    const typeMap: Record<string, QuestionType> = {
      'behavioral': QuestionType.BEHAVIORAL,
      'technical': QuestionType.TECHNICAL,
      'situational': QuestionType.SITUATIONAL,
      'company_specific': QuestionType.COMPANY,
      'company': QuestionType.COMPANY,
      'strengths': QuestionType.STRENGTHS,
      'weaknesses': QuestionType.WEAKNESSES,
    };

    return typeMap[type] || QuestionType.BEHAVIORAL;
  }

  /**
   * Fallback questions when Perplexity API is not available
   */
  private getFallbackQuestions(params: PerplexityGenerationParams): PerplexityQuestion[] {
    const baseSet = [
      {
        id: `fallback_${Date.now()}_1`,
        question: `Tell me about your experience with ${params.jobTitle} responsibilities.`,
        type: 'behavioral' as QuestionType,
        difficulty: params.difficulty,
        category: 'Experience',
        context: 'Understanding candidate background',
        followUpQuestions: [
          'What was your biggest achievement in this role?',
          'How did you handle challenges?'
        ],
        tips: [
          'Use the STAR method',
          'Be specific with examples',
          'Quantify your achievements'
        ],
        relevanceScore: 0.7,
        freshnessScore: 0.5,
        industryTrends: [],
        companySpecific: false,
      },
      {
        id: `fallback_${Date.now()}_2`,
        question: `How do you stay updated with the latest trends in ${params.industry}?`,
        type: 'technical' as QuestionType,
        difficulty: params.difficulty,
        category: 'Industry Knowledge',
        context: 'Assessing continuous learning',
        followUpQuestions: [
          'Can you give an example of a recent trend you implemented?',
          'How do you evaluate new technologies?'
        ],
        tips: [
          'Mention specific resources you use',
          'Show genuine interest in learning',
          'Connect trends to business value'
        ],
        relevanceScore: 0.8,
        freshnessScore: 0.6,
        industryTrends: [],
        companySpecific: false,
      }
    ];

    // Expand to requested count with varied templates
    const templates = [
      {
        question: `Describe a challenging project you worked on in ${params.industry}. What was your approach?`,
        type: 'situational' as QuestionType,
        category: 'Problem Solving'
      },
      {
        question: `How do you prioritize tasks when facing tight deadlines in a ${params.jobTitle} role?`,
        type: 'behavioral' as QuestionType,
        category: 'Time Management'
      },
      {
        question: `What are the most important system design considerations for ${params.jobTitle}?`,
        type: 'technical' as QuestionType,
        category: 'System Design'
      },
      {
        question: `${params.company ? `What appeals to you about ${params.company}'s culture?` : 'What type of company culture do you thrive in and why?'}`,
        type: 'company' as QuestionType,
        category: 'Culture Fit'
      }
    ];

    const pool = [...baseSet, ...templates.map((t, i) => ({
      id: `fallback_${Date.now()}_${i + 3}`,
      question: t.question,
      type: t.type,
      difficulty: params.difficulty,
      category: t.category,
      context: '',
      followUpQuestions: ['Can you provide a concrete example?', 'What was the impact?'],
      tips: ['Use STAR', 'Quantify results', 'Tie to role requirements'],
      relevanceScore: 0.7,
      freshnessScore: 0.6,
      industryTrends: [],
      companySpecific: t.type === QuestionType.COMPANY
    }))];

    return pool.slice(0, Math.max(1, params.count));
  }

  /**
   * Test Perplexity API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Perplexity API key not configured'
        };
      }

      const response = await this.client.post('/chat/completions', {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a connection test.'
          }
        ],
        max_tokens: 50,
      });

      if (response.data && response.data.choices) {
        return {
          success: true,
          message: 'Perplexity API connection successful'
        };
      }

      return {
        success: false,
        message: 'Unexpected response format from Perplexity API'
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Perplexity API connection failed: ${error.message}`
      };
    }
  }
}

export default PerplexityService;
