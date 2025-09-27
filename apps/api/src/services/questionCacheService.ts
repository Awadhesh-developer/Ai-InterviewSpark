/**
 * Specialized Caching Service for Enhanced Question Generation
 * Handles caching strategies for questions, LLM responses, and related data
 */

import { cacheService, CacheKey } from './cacheService'
// Import from main types file since specific type modules don't exist
// import { InterviewQuestion, QuestionGenerationContext } from '../types/questions'
// import { CompanyInsights, IndustryTrends } from '../types/intelligence'

// Use generic types for now - these should be properly defined later
interface InterviewQuestion {
  id: string;
  question: string;
  type: string;
  difficulty: string;
}

interface QuestionGenerationContext {
  jobTitle: string;
  industry: string;
  company?: string;
  difficulty?: string;
  questionTypes?: string[];
  count?: number;
}

interface CompanyInsights {
  company: string;
  insights: string[];
}

interface IndustryTrends {
  industry: string;
  trends: string[];
}
import crypto from 'crypto'

export interface CachedQuestionSet {
  questions: InterviewQuestion[]
  metadata: {
    generatedAt: string
    context: QuestionGenerationContext
    llmProvider: string
    version: string
  }
}

export interface CachedLLMResponse {
  response: any
  provider: string
  model: string
  tokens: number
  cost: number
  generatedAt: string
}

export interface CacheMetrics {
  questionHits: number
  questionMisses: number
  llmHits: number
  llmMisses: number
  companyInsightsHits: number
  companyInsightsMisses: number
  totalSavings: number // Estimated cost savings
}

class QuestionCacheService {
  private readonly VERSION = '1.0'
  private metrics: CacheMetrics = {
    questionHits: 0,
    questionMisses: 0,
    llmHits: 0,
    llmMisses: 0,
    companyInsightsHits: 0,
    companyInsightsMisses: 0,
    totalSavings: 0
  }

  /**
   * Generate cache key for question sets
   */
  private generateQuestionSetKey(context: QuestionGenerationContext): CacheKey {
    const contextHash = this.hashContext(context)
    return {
      prefix: cacheService.getPrefixes().QUESTIONS,
      identifier: `set:${contextHash}`,
      version: this.VERSION
    }
  }

  /**
   * Generate cache key for LLM responses
   */
  private generateLLMResponseKey(
    prompt: string, 
    provider: string, 
    model: string
  ): CacheKey {
    const promptHash = crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16)
    return {
      prefix: cacheService.getPrefixes().LLM_RESPONSES,
      identifier: `${provider}:${model}:${promptHash}`,
      version: this.VERSION
    }
  }

  /**
   * Generate cache key for company insights
   */
  private generateCompanyInsightsKey(companyName: string): CacheKey {
    return {
      prefix: cacheService.getPrefixes().COMPANY_INSIGHTS,
      identifier: companyName.toLowerCase().replace(/\s+/g, '-'),
      version: this.VERSION
    }
  }

  /**
   * Generate cache key for industry trends
   */
  private generateIndustryTrendsKey(industry: string): CacheKey {
    return {
      prefix: cacheService.getPrefixes().INDUSTRY_TRENDS,
      identifier: industry.toLowerCase().replace(/\s+/g, '-'),
      version: this.VERSION
    }
  }

  /**
   * Hash context for consistent cache keys
   */
  private hashContext(context: QuestionGenerationContext): string {
    const normalizedContext = {
      jobTitle: context.jobTitle?.toLowerCase().trim(),
      industry: context.industry?.toLowerCase().trim(),
      company: context.company?.toLowerCase().trim(),
      difficulty: context.difficulty,
      questionTypes: context.questionTypes?.sort(),
      count: context.count
    }
    
    const contextString = JSON.stringify(normalizedContext)
    return crypto.createHash('sha256').update(contextString).digest('hex').substring(0, 16)
  }

  /**
   * Cache question set
   */
  async cacheQuestionSet(
    context: QuestionGenerationContext,
    questions: InterviewQuestion[],
    llmProvider: string
  ): Promise<boolean> {
    const cacheKey = this.generateQuestionSetKey(context)
    
    const cachedData: CachedQuestionSet = {
      questions,
      metadata: {
        generatedAt: new Date().toISOString(),
        context,
        llmProvider,
        version: this.VERSION
      }
    }

    const tags = [
      `industry:${context.industry}`,
      `difficulty:${context.difficulty}`,
      `provider:${llmProvider}`
    ]

    if (context.company) {
      tags.push(`company:${context.company.toLowerCase()}`)
    }

    return await cacheService.set(cacheKey, cachedData, {
      ttl: 24 * 60 * 60, // 24 hours
      tags
    })
  }

  /**
   * Get cached question set
   */
  async getCachedQuestionSet(
    context: QuestionGenerationContext
  ): Promise<CachedQuestionSet | null> {
    const cacheKey = this.generateQuestionSetKey(context)
    const cached = await cacheService.get<CachedQuestionSet>(cacheKey)
    
    if (cached) {
      this.metrics.questionHits++
      
      // Check if cache is still fresh (within 12 hours for dynamic content)
      const generatedAt = new Date(cached.metadata.generatedAt)
      const now = new Date()
      const hoursSinceGeneration = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceGeneration > 12 && this.isDynamicContext(context)) {
        // Cache is stale for dynamic content
        this.metrics.questionMisses++
        return null
      }
      
      return cached
    } else {
      this.metrics.questionMisses++
      return null
    }
  }

  /**
   * Cache LLM response
   */
  async cacheLLMResponse(
    prompt: string,
    provider: string,
    model: string,
    response: any,
    tokens: number = 0,
    cost: number = 0
  ): Promise<boolean> {
    const cacheKey = this.generateLLMResponseKey(prompt, provider, model)
    
    const cachedData: CachedLLMResponse = {
      response,
      provider,
      model,
      tokens,
      cost,
      generatedAt: new Date().toISOString()
    }

    return await cacheService.set(cacheKey, cachedData, {
      ttl: 60 * 60, // 1 hour for LLM responses
      tags: [`provider:${provider}`, `model:${model}`]
    })
  }

  /**
   * Get cached LLM response
   */
  async getCachedLLMResponse(
    prompt: string,
    provider: string,
    model: string
  ): Promise<CachedLLMResponse | null> {
    const cacheKey = this.generateLLMResponseKey(prompt, provider, model)
    const cached = await cacheService.get<CachedLLMResponse>(cacheKey)
    
    if (cached) {
      this.metrics.llmHits++
      this.metrics.totalSavings += cached.cost
      return cached
    } else {
      this.metrics.llmMisses++
      return null
    }
  }

  /**
   * Cache company insights
   */
  async cacheCompanyInsights(
    companyName: string,
    insights: CompanyInsights
  ): Promise<boolean> {
    const cacheKey = this.generateCompanyInsightsKey(companyName)
    
    return await cacheService.set(cacheKey, insights, {
      ttl: 7 * 24 * 60 * 60, // 7 days
      tags: [`company:${companyName.toLowerCase()}`, 'insights']
    })
  }

  /**
   * Get cached company insights
   */
  async getCachedCompanyInsights(companyName: string): Promise<CompanyInsights | null> {
    const cacheKey = this.generateCompanyInsightsKey(companyName)
    const cached = await cacheService.get<CompanyInsights>(cacheKey)
    
    if (cached) {
      this.metrics.companyInsightsHits++
      return cached
    } else {
      this.metrics.companyInsightsMisses++
      return null
    }
  }

  /**
   * Cache industry trends
   */
  async cacheIndustryTrends(
    industry: string,
    trends: IndustryTrends
  ): Promise<boolean> {
    const cacheKey = this.generateIndustryTrendsKey(industry)
    
    return await cacheService.set(cacheKey, trends, {
      ttl: 24 * 60 * 60, // 24 hours
      tags: [`industry:${industry.toLowerCase()}`, 'trends']
    })
  }

  /**
   * Get cached industry trends
   */
  async getCachedIndustryTrends(industry: string): Promise<IndustryTrends | null> {
    const cacheKey = this.generateIndustryTrendsKey(industry)
    const cached = await cacheService.get<IndustryTrends>(cacheKey)
    
    if (cached) {
      return cached
    } else {
      return null
    }
  }

  /**
   * Invalidate cache for specific company
   */
  async invalidateCompanyCache(companyName: string): Promise<number> {
    const tags = [`company:${companyName.toLowerCase()}`]
    return await cacheService.invalidateByTags(tags)
  }

  /**
   * Invalidate cache for specific industry
   */
  async invalidateIndustryCache(industry: string): Promise<number> {
    const tags = [`industry:${industry.toLowerCase()}`]
    return await cacheService.invalidateByTags(tags)
  }

  /**
   * Invalidate cache for specific LLM provider
   */
  async invalidateProviderCache(provider: string): Promise<number> {
    const tags = [`provider:${provider}`]
    return await cacheService.invalidateByTags(tags)
  }

  /**
   * Warm up cache with popular question sets
   */
  async warmUpCache(popularContexts: QuestionGenerationContext[]): Promise<void> {
    console.log('🔥 Warming up question cache...')
    
    for (const context of popularContexts) {
      const cached = await this.getCachedQuestionSet(context)
      if (!cached) {
        console.log(`Cache miss for context: ${context.jobTitle} at ${context.company}`)
        // Note: In a real implementation, you would trigger question generation here
      }
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.metrics = {
      questionHits: 0,
      questionMisses: 0,
      llmHits: 0,
      llmMisses: 0,
      companyInsightsHits: 0,
      companyInsightsMisses: 0,
      totalSavings: 0
    }
  }

  /**
   * Check if context requires dynamic/fresh content
   */
  private isDynamicContext(context: QuestionGenerationContext): boolean {
    // Company-specific questions should be more dynamic
    if (context.company) {
      return true
    }
    
    // High difficulty questions should be more dynamic
    if (context.difficulty === 'hard') {
      return true
    }
    
    // Large question sets should be more dynamic
    if (context.count && context.count > 5) {
      return true
    }
    
    return false
  }

  /**
   * Get cache hit rates
   */
  getCacheHitRates(): {
    questions: number
    llm: number
    companyInsights: number
    overall: number
  } {
    const questionTotal = this.metrics.questionHits + this.metrics.questionMisses
    const llmTotal = this.metrics.llmHits + this.metrics.llmMisses
    const companyTotal = this.metrics.companyInsightsHits + this.metrics.companyInsightsMisses
    const overallTotal = questionTotal + llmTotal + companyTotal
    const overallHits = this.metrics.questionHits + this.metrics.llmHits + this.metrics.companyInsightsHits

    return {
      questions: questionTotal > 0 ? (this.metrics.questionHits / questionTotal) * 100 : 0,
      llm: llmTotal > 0 ? (this.metrics.llmHits / llmTotal) * 100 : 0,
      companyInsights: companyTotal > 0 ? (this.metrics.companyInsightsHits / companyTotal) * 100 : 0,
      overall: overallTotal > 0 ? (overallHits / overallTotal) * 100 : 0
    }
  }

  /**
   * Preload frequently accessed data
   */
  async preloadFrequentData(): Promise<void> {
    const popularCompanies = ['Google', 'Microsoft', 'Amazon', 'Apple', 'Meta']
    const popularIndustries = ['technology', 'finance', 'healthcare', 'consulting']
    
    console.log('📦 Preloading frequently accessed cache data...')
    
    // Preload company insights
    for (const company of popularCompanies) {
      const cached = await this.getCachedCompanyInsights(company)
      if (!cached) {
        console.log(`Missing cache for company: ${company}`)
      }
    }
    
    // Preload industry trends
    for (const industry of popularIndustries) {
      const cached = await this.getCachedIndustryTrends(industry)
      if (!cached) {
        console.log(`Missing cache for industry: ${industry}`)
      }
    }
  }
}

// Export singleton instance
export const questionCacheService = new QuestionCacheService()
export default questionCacheService
