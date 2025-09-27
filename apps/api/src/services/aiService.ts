// --- START api/services/aiService.ts --- //
// AI service for AI-InterviewSpark API
// Integrates with OpenAI, Gemini AI, Motivel, and Moodme for question generation and emotional analysis

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { QuestionType, EmotionType, EmotionData, createError } from '../types';

// AI service class
export class AIService {
  private static openai: OpenAI | null = null;
  private static gemini: GoogleGenerativeAI | null = null;

  // Initialize AI clients
  private static initializeClients() {
    if (config.ai.openai.enabled && !this.openai) {
      this.openai = new OpenAI({
        apiKey: config.ai.openai.apiKey,
      });
    }

    if (config.ai.gemini.enabled && !this.gemini) {
      this.gemini = new GoogleGenerativeAI(config.ai.gemini.apiKey!);
    }
  }

  // Enhanced question generation with multiple LLM providers and web scraping
  static async generateEnhancedQuestions(params: {
    jobTitle: string;
    industry: string;
    company?: string;
    jobDescription?: string;
    resumeSkills?: string[];
    questionTypes: QuestionType[];
    difficulty: 'easy' | 'medium' | 'hard';
    count: number;
    includeWebScraping?: boolean;
    includeSampleAnswers?: boolean;
    llmProvider?: 'openai' | 'gemini' | 'claude' | 'auto';
  }) {
    try {
      this.initializeClients();

      // Step 1: Determine optimal LLM provider
      const selectedProvider = this.selectOptimalProvider(params.llmProvider, params.questionTypes);

      // Step 2: Build enhanced prompt with industry trends and company insights
      const enhancedPrompt = await this.buildEnhancedPrompt(params);

      // Step 3: Generate questions using selected provider
      let questions: any[] = [];

      switch (selectedProvider) {
        case 'openai':
          questions = await this.generateWithOpenAI(enhancedPrompt, params);
          break;
        case 'gemini':
          questions = await this.generateWithGemini(enhancedPrompt, params);
          break;
        case 'claude':
          questions = await this.generateWithClaude(enhancedPrompt, params);
          break;
        default:
          // Fallback to original method
          questions = await this.generateWithFallback(params);
      }

      // Step 4: Add web scraped questions if enabled
      if (params.includeWebScraping && params.company) {
        const scrapedQuestions = await this.getScrapedQuestions(params.company, params.jobTitle);
        questions.push(...scrapedQuestions);
      }

      // Step 5: Process and enhance questions
      const enhancedQuestions = await this.enhanceQuestions(questions, params);

      // Step 6: Generate sample answers if requested
      if (params.includeSampleAnswers) {
        for (const question of enhancedQuestions) {
          question.sampleAnswer = await this.generateSampleAnswer(question, params);
        }
      }

      return enhancedQuestions.slice(0, params.count);

    } catch (error) {
      console.error('Error in enhanced question generation:', error);
      // Fallback to original method
      return this.getFallbackQuestions(params);
    }
  }

  // Generate sample answers for questions
  static async generateSampleAnswers(params: {
    questionIds: string[];
    jobTitle: string;
    industry: string;
    company?: string;
    experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  }): Promise<Array<{
    questionId: string;
    answer: string;
    structure: string;
    keyPoints: string[];
    tips: string[];
    commonMistakes: string[];
  }>> {
    try {
      // Implementation for generating sample answers
      const answers = [];

      for (const questionId of params.questionIds) {
        const answerText = await this.generateSampleAnswer({ id: questionId, type: 'general', text: 'Sample question' }, params);
        answers.push({
          questionId,
          answer: answerText,
          structure: 'problem-solution',
          keyPoints: ['key point 1', 'key point 2'],
          tips: ['tip 1', 'tip 2'],
          commonMistakes: ['mistake 1', 'mistake 2']
        });
      }

      return answers;
    } catch (error) {
      console.error('Error generating sample answers:', error);
      return [];
    }
  }

  // Get industry trends
  static async getIndustryTrends(industry: string, timeframe: string): Promise<Array<{
    topic: string;
    frequency: number;
    growth: number;
    relatedSkills: string[];
  }>> {
    try {
      // Mock implementation - would integrate with web scraping service
      const mockTrends = {
        'technology': [
          { topic: 'AI/Machine Learning', frequency: 85, growth: 25.5, relatedSkills: ['Python', 'TensorFlow', 'Data Analysis'] },
          { topic: 'Cloud Computing', frequency: 78, growth: 18.2, relatedSkills: ['AWS', 'Azure', 'DevOps'] },
          { topic: 'Cybersecurity', frequency: 65, growth: 22.1, relatedSkills: ['Security Protocols', 'Risk Assessment'] }
        ],
        'finance': [
          { topic: 'Digital Banking', frequency: 72, growth: 15.8, relatedSkills: ['Fintech', 'Compliance', 'Risk Management'] },
          { topic: 'ESG Reporting', frequency: 58, growth: 35.2, relatedSkills: ['Sustainability', 'Data Analysis'] }
        ]
      };

      return mockTrends[industry as keyof typeof mockTrends] || mockTrends.technology;
    } catch (error) {
      console.error('Error getting industry trends:', error);
      return [];
    }
  }

  // Get company insights
  static async getCompanyInsights(company: string): Promise<{
    companyName: string;
    culture: string[];
    values: string[];
    recentNews: string[];
    interviewStyle: string;
    commonQuestions: string[];
  } | null> {
    try {
      // Mock implementation - would integrate with web scraping service
      return {
        companyName: company,
        culture: ['Innovation', 'Collaboration', 'Customer Focus'],
        values: ['Integrity', 'Excellence', 'Diversity'],
        recentNews: ['Product launch', 'Market expansion', 'Sustainability initiative'],
        interviewStyle: 'behavioral-focused',
        commonQuestions: [
          'Why do you want to work here?',
          'Tell me about a challenging project',
          'How do you handle pressure?'
        ]
      };
    } catch (error) {
      console.error('Error getting company insights:', error);
      return null;
    }
  }

  // Private helper methods
  private static selectOptimalProvider(
    preference?: 'openai' | 'gemini' | 'claude' | 'auto',
    questionTypes?: QuestionType[]
  ): 'openai' | 'gemini' | 'claude' {
    if (preference && preference !== 'auto') {
      return preference as 'openai' | 'gemini' | 'claude';
    }

    // Auto-select based on question types
    if (questionTypes?.includes('technical' as any)) {
      return 'gemini'; // Best for technical questions
    }
    if (questionTypes?.includes('behavioral' as any)) {
      return 'openai'; // Best for behavioral questions
    }

    return this.openai ? 'openai' : 'gemini'; // Default based on availability
  }

  private static async buildEnhancedPrompt(params: any): Promise<string> {
    let prompt = `Generate ${params.count} high-quality, realistic interview questions for a ${params.jobTitle} position in the ${params.industry} industry.\n\n`;

    if (params.company) {
      prompt += `Company: ${params.company}\n`;
    }

    if (params.jobDescription) {
      prompt += `Job Description: ${params.jobDescription}\n\n`;
    }

    // Add industry trends context
    const trends = await this.getIndustryTrends(params.industry, 'month');
    if (trends.length > 0) {
      prompt += `Current Industry Trends:\n`;
      trends.slice(0, 3).forEach(trend => {
        prompt += `- ${trend.topic} (${trend.growth}% growth)\n`;
      });
      prompt += `\n`;
    }

    // Add company insights if available
    if (params.company) {
      const insights = await this.getCompanyInsights(params.company);
      if (insights) {
        prompt += `Company Culture: ${insights.culture.join(', ')}\n`;
        prompt += `Company Values: ${insights.values.join(', ')}\n\n`;
      }
    }

    prompt += `Requirements:\n`;
    prompt += `- Question types: ${params.questionTypes.join(', ')}\n`;
    prompt += `- Difficulty: ${params.difficulty}\n`;
    prompt += `- Include STAR framework guidance for behavioral questions\n`;
    prompt += `- Provide realistic, commonly asked questions\n`;
    prompt += `- Include follow-up questions and tips\n\n`;

    return prompt;
  }

  private static async generateWithOpenAI(prompt: string, params: any): Promise<any[]> {
    if (!this.openai) return [];

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach. Generate realistic, high-quality interview questions with detailed metadata.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return this.parseQuestionsFromAIResponse(content);
      }
    } catch (error) {
      console.error('OpenAI generation failed:', error);
    }

    return [];
  }

  private static async generateWithGemini(prompt: string, params: any): Promise<any[]> {
    if (!this.gemini) return [];

    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

      if (content) {
        return this.parseQuestionsFromAIResponse(content);
      }
    } catch (error) {
      console.error('Gemini generation failed:', error);
    }

    return [];
  }

  private static async generateWithClaude(prompt: string, params: any): Promise<any[]> {
    // Mock implementation for Claude - would use Anthropic API
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      return this.getFallbackQuestions(params);
    } catch (error) {
      console.error('Claude generation failed:', error);
      return [];
    }
  }

  private static async generateWithFallback(params: any): Promise<any[]> {
    // Original generation logic as fallback
    let questions: any[] = [];
    const prompt = this.buildQuestionGenerationPrompt(params);

    if (this.openai) {
        try {
          const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are an expert interview coach. Generate relevant, challenging, and insightful interview questions.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 2000,
          });

          const content = response.choices[0]?.message?.content;
          if (content) {
            questions = this.parseQuestionsFromAIResponse(content);
          }
        } catch (error) {
          console.warn('OpenAI question generation failed, trying Gemini:', error);
        }
      }

      // Fallback to Gemini if OpenAI failed or not available
      if (questions.length === 0 && this.gemini) {
        try {
          const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const content = response.text();
          
          if (content) {
            questions = this.parseQuestionsFromAIResponse(content);
          }
        } catch (error) {
          console.error('Gemini question generation failed:', error);
        }
      }

      if (questions.length === 0) {
        // Return fallback questions if AI services fail
        return this.getFallbackQuestions(params);
      }

      return questions.slice(0, params.count);
  }

  // Analyze answer content and provide feedback
  static async analyzeAnswer(params: {
    question: string;
    answer: string;
    questionType: QuestionType;
    expectedKeywords?: string[];
  }): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
    strengths: string[];
    areasForImprovement: string[];
  }> {
    try {
      this.initializeClients();

      const prompt = this.buildAnswerAnalysisPrompt(params);
      let analysis: any = null;

      // Try OpenAI first
      if (this.openai) {
        try {
          const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are an expert interview coach providing constructive feedback on interview answers.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.3,
            max_tokens: 1000,
          });

          const content = response.choices[0]?.message?.content;
          if (content) {
            analysis = this.parseAnalysisFromAIResponse(content);
          }
        } catch (error) {
          console.warn('OpenAI answer analysis failed, trying Gemini:', error);
        }
      }

      // Fallback to Gemini
      if (!analysis && this.gemini) {
        try {
          const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const content = response.text();
          
          if (content) {
            analysis = this.parseAnalysisFromAIResponse(content);
          }
        } catch (error) {
          console.error('Gemini answer analysis failed:', error);
        }
      }

      if (!analysis) {
        // Return default analysis if AI services fail
        return {
          score: 7.0,
          feedback: 'Good answer with room for improvement.',
          suggestions: ['Provide more specific examples', 'Be more concise'],
          strengths: ['Clear communication'],
          areasForImprovement: ['Add more details'],
        };
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing answer:', error);
      throw createError('Failed to analyze answer', 500);
    }
  }

  // Analyze emotional state from voice using Motivel API
  static async analyzeVoiceEmotion(audioData: Buffer): Promise<EmotionData[]> {
    try {
      if (!config.ai.motivel.enabled) {
        throw createError('Motivel API not configured', 500);
      }

      // This is a placeholder implementation
      // In a real implementation, you would:
      // 1. Send audio data to Motivel API
      // 2. Process the response
      // 3. Return structured emotion data

      const mockResponse = await this.mockMotivelAnalysis(audioData);
      return mockResponse;
    } catch (error) {
      console.error('Error analyzing voice emotion:', error);
      throw createError('Failed to analyze voice emotion', 500);
    }
  }

  // Analyze facial expressions using Moodme API
  static async analyzeFacialEmotion(videoData: Buffer): Promise<EmotionData[]> {
    try {
      if (!config.ai.moodme.enabled) {
        throw createError('Moodme API not configured', 500);
      }

      // This is a placeholder implementation
      // In a real implementation, you would:
      // 1. Send video data to Moodme API
      // 2. Process the response
      // 3. Return structured emotion data

      const mockResponse = await this.mockMoodmeAnalysis(videoData);
      return mockResponse;
    } catch (error) {
      console.error('Error analyzing facial emotion:', error);
      throw createError('Failed to analyze facial emotion', 500);
    }
  }

  // Generate resume feedback and ATS optimization suggestions
  static async analyzeResume(params: {
    resumeText: string;
    jobDescription?: string;
    targetRole?: string;
  }): Promise<{
    atsScore: number;
    keywords: string[];
    suggestions: string[];
    strengths: string[];
    areasForImprovement: string[];
  }> {
    try {
      this.initializeClients();

      const prompt = this.buildResumeAnalysisPrompt(params);
      let analysis: any = null;

      if (this.openai) {
        try {
          const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are an expert resume reviewer and ATS optimization specialist.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.3,
            max_tokens: 1500,
          });

          const content = response.choices[0]?.message?.content;
          if (content) {
            analysis = this.parseResumeAnalysisFromAIResponse(content);
          }
        } catch (error) {
          console.warn('OpenAI resume analysis failed, trying Gemini:', error);
        }
      }

      if (!analysis && this.gemini) {
        try {
          const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const content = response.text();
          
          if (content) {
            analysis = this.parseResumeAnalysisFromAIResponse(content);
          }
        } catch (error) {
          console.error('Gemini resume analysis failed:', error);
        }
      }

      if (!analysis) {
        return {
          atsScore: 75,
          keywords: ['leadership', 'project management', 'communication'],
          suggestions: ['Add more quantifiable achievements', 'Include relevant keywords'],
          strengths: ['Clear structure', 'Good formatting'],
          areasForImprovement: ['Add metrics', 'Include more keywords'],
        };
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing resume:', error);
      throw createError('Failed to analyze resume', 500);
    }
  }

  // Helper methods
  private static buildQuestionGenerationPrompt(params: any): string {
    return `
Generate ${params.count} interview questions for a ${params.difficulty} level ${params.jobTitle} position${params.company ? ` at ${params.company}` : ''}.

Job Description: ${params.jobDescription || 'Not provided'}
Resume Skills: ${params.resumeSkills?.join(', ') || 'Not provided'}
Question Types: ${params.questionTypes.join(', ')}

Requirements:
- Questions should be relevant to the role and difficulty level
- Include a mix of question types
- Questions should be clear and specific
- For technical questions, focus on practical scenarios
- For behavioral questions, ask for specific examples

Format each question as JSON:
{
  "text": "Question text",
  "type": "question_type",
  "category": "category_name",
  "difficulty": "difficulty_level",
  "expectedKeywords": ["keyword1", "keyword2"],
  "timeLimit": 120
}
    `.trim();
  }

  private static buildAnswerAnalysisPrompt(params: any): string {
    return `
Analyze this interview answer and provide feedback:

Question: ${params.question}
Question Type: ${params.questionType}
Answer: ${params.answer}
Expected Keywords: ${params.expectedKeywords?.join(', ') || 'None specified'}

Provide analysis in JSON format:
{
  "score": 8.5,
  "feedback": "Overall good answer with specific examples",
  "suggestions": ["Add more metrics", "Be more concise"],
  "strengths": ["Clear communication", "Good examples"],
  "areasForImprovement": ["Add quantifiable results", "Structure better"]
}

Score on a scale of 0-10 where 10 is excellent.
    `.trim();
  }

  private static buildResumeAnalysisPrompt(params: any): string {
    return `
Analyze this resume for ATS optimization and provide feedback:

Resume: ${params.resumeText}
Target Role: ${params.targetRole || 'Not specified'}
Job Description: ${params.jobDescription || 'Not provided'}

Provide analysis in JSON format:
{
  "atsScore": 85,
  "keywords": ["leadership", "project management"],
  "suggestions": ["Add more keywords", "Quantify achievements"],
  "strengths": ["Clear structure", "Good formatting"],
  "areasForImprovement": ["Add metrics", "Include more keywords"]
}

ATS Score should be 0-100 where 100 is perfect for ATS systems.
    `.trim();
  }

  private static parseQuestionsFromAIResponse(content: string): any[] {
    try {
      let cleanContent = content.trim();
      
      // Remove markdown code blocks if present
      if (cleanContent.includes('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      if (cleanContent.includes('```')) {
        cleanContent = cleanContent.replace(/```\n?/g, '');
      }
      
      // Extract JSON from the response
      const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Try to parse individual question objects
      const questionMatches = cleanContent.match(/\{[^}]+\}/g);
      if (questionMatches) {
        return questionMatches.map(match => JSON.parse(match));
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing questions from AI response:', error);
      return [];
    }
  }

  private static parseAnalysisFromAIResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('Error parsing analysis from AI response:', error);
      return null;
    }
  }

  private static parseResumeAnalysisFromAIResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('Error parsing resume analysis from AI response:', error);
      return null;
    }
  }

  private static getFallbackQuestions(params: any): any[] {
    const fallbackQuestions = {
      behavioral: [
        {
          text: "Tell me about a time when you had to work with a difficult team member. How did you handle the situation?",
          type: "behavioral" as QuestionType,
          category: "teamwork",
          difficulty: params.difficulty,
          expectedKeywords: ["collaboration", "conflict resolution", "communication"],
          timeLimit: 120,
        },
      ],
      technical: [
        {
          text: "Describe a technical challenge you faced in a recent project and how you solved it.",
          type: "technical" as QuestionType,
          category: "problem-solving",
          difficulty: params.difficulty,
          expectedKeywords: ["problem-solving", "technical skills", "project management"],
          timeLimit: 120,
        },
      ],
      situational: [
        {
          text: "If you were given a project with an impossible deadline, how would you approach it?",
          type: "situational" as QuestionType,
          category: "time-management",
          difficulty: params.difficulty,
          expectedKeywords: ["time management", "prioritization", "communication"],
          timeLimit: 90,
        },
      ],
    };

    return params.questionTypes
      .flatMap((type: any) => fallbackQuestions[type as keyof typeof fallbackQuestions] || [])
      .slice(0, params.count);
  }

  private static async mockMotivelAnalysis(audioData: Buffer): Promise<EmotionData[]> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        emotion: 'confidence' as EmotionType,
        confidence: 0.8,
        timestamp: Date.now(),
        source: 'voice',
      },
      {
        emotion: 'enthusiasm' as EmotionType,
        confidence: 0.6,
        timestamp: Date.now() + 1000,
        source: 'voice',
      },
    ];
  }

  private static async mockMoodmeAnalysis(videoData: Buffer): Promise<EmotionData[]> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return [
      {
        emotion: 'engagement' as EmotionType,
        confidence: 0.7,
        timestamp: Date.now(),
        source: 'facial',
      },
      {
        emotion: 'confidence' as EmotionType,
        confidence: 0.9,
        timestamp: Date.now() + 1000,
        source: 'facial',
      },
    ];
  }

  private static async getScrapedQuestions(company: string, jobTitle: string): Promise<any[]> {
    console.warn('Web scraping integration not implemented');
    return [];
  }

  private static async enhanceQuestions(questions: any[], params: any): Promise<any[]> {
    return questions;
  }

  private static async generateSampleAnswer(question: any, params: any): Promise<string> {
    return 'Sample answer would be generated here based on the question and job requirements.';
  }

}

export default AIService; 