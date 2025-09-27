/**
 * Optimized Query Service
 * Provides pre-optimized database queries for common operations
 */

import { db } from '../database/connection'
import { questions, sampleAnswers, questionTrends, companyInsights, interviewSessions } from '../database/schema'
import { eq, and, or, desc, asc, sql, inArray, gte, lte, like, ilike } from 'drizzle-orm'
import { databaseOptimizationService } from './databaseOptimizationService'

export interface QuestionFilters {
  sessionId?: string
  type?: string[]
  difficulty?: string[]
  source?: string[]
  companySpecific?: boolean
  minFreshnessScore?: number
  minRelevanceScore?: number
  llmProvider?: string[]
  limit?: number
  offset?: number
  orderBy?: 'created_at' | 'updated_at' | 'freshness_score' | 'relevance_score' | 'order'
  orderDirection?: 'asc' | 'desc'
}

export interface SampleAnswerFilters {
  questionId?: string
  industry?: string[]
  role?: string[]
  difficulty?: string[]
  structure?: string[]
  limit?: number
  offset?: number
}

export interface TrendFilters {
  industry?: string[]
  timeframe?: string[]
  minFrequency?: number
  limit?: number
  orderBy?: 'frequency' | 'growth' | 'last_updated'
  orderDirection?: 'asc' | 'desc'
}

class OptimizedQueryService {
  /**
   * Get questions with optimized query and caching
   */
  async getQuestions(filters: QuestionFilters = {}) {
    const query = db.select().from(questions)
    
    // Build WHERE conditions
    const conditions = []
    
    if (filters.sessionId) {
      conditions.push(eq(questions.sessionId, filters.sessionId))
    }
    
    if (filters.type && filters.type.length > 0) {
      conditions.push(inArray(questions.type, filters.type as any))
    }
    
    if (filters.difficulty && filters.difficulty.length > 0) {
      conditions.push(inArray(questions.difficulty, filters.difficulty as any))
    }
    
    if (filters.source && filters.source.length > 0) {
      conditions.push(inArray(questions.source, filters.source as any))
    }
    
    if (filters.companySpecific !== undefined) {
      conditions.push(eq(questions.companySpecific, filters.companySpecific))
    }
    
    if (filters.minFreshnessScore !== undefined) {
      conditions.push(gte(questions.freshnessScore, filters.minFreshnessScore.toString()))
    }
    
    if (filters.minRelevanceScore !== undefined) {
      conditions.push(gte(questions.relevanceScore, filters.minRelevanceScore.toString()))
    }
    
    if (filters.llmProvider && filters.llmProvider.length > 0) {
      conditions.push(inArray(questions.llmProvider, filters.llmProvider as any))
    }
    
    // Build complete query with all conditions
    let finalQuery = query;
    
    // Apply WHERE conditions
    if (conditions.length > 0) {
      finalQuery = (finalQuery as any).where(and(...conditions));
    }
    
    // Apply ordering
    const orderBy = filters.orderBy || 'createdAt';
    const direction = filters.orderDirection || 'desc';
    const orderColumn = questions[orderBy as keyof typeof questions];
    
    if (orderColumn) {
      finalQuery = (finalQuery as any).orderBy(direction === 'asc' ? asc(orderColumn as any) : desc(orderColumn as any));
    }
    
    // Apply pagination
    if (filters.limit) {
      finalQuery = (finalQuery as any).limit(filters.limit);
    }
    
    if (filters.offset) {
      finalQuery = (finalQuery as any).offset(filters.offset);
    }
    
    // Execute with metrics
    return await databaseOptimizationService.executeOptimizedQuery(
      finalQuery.toSQL().sql,
      finalQuery.toSQL().params
    )
  }

  /**
   * Get questions by session with optimized join
   */
  async getQuestionsBySession(sessionId: string, includeAnswers: boolean = false) {
    if (includeAnswers) {
      // Use LEFT JOIN to include answers
      const query = db
        .select({
          question: questions,
          sampleAnswer: sampleAnswers
        })
        .from(questions)
        .leftJoin(sampleAnswers, eq(questions.id, sampleAnswers.questionId))
        .where(eq(questions.sessionId, sessionId))
        .orderBy(asc(questions.order))
      
      return await databaseOptimizationService.executeOptimizedQuery(
        query.toSQL().sql,
        query.toSQL().params
      )
    } else {
      // Simple query without joins
      const query = db
        .select()
        .from(questions)
        .where(eq(questions.sessionId, sessionId))
        .orderBy(asc(questions.order))
      
      return await databaseOptimizationService.executeOptimizedQuery(
        query.toSQL().sql,
        query.toSQL().params
      )
    }
  }

  /**
   * Get sample answers with optimized filtering
   */
  async getSampleAnswers(filters: SampleAnswerFilters = {}) {
    const query = db.select().from(sampleAnswers)
    
    const conditions = []
    
    if (filters.questionId) {
      conditions.push(eq(sampleAnswers.questionId, filters.questionId))
    }
    
    if (filters.industry && filters.industry.length > 0) {
      conditions.push(inArray(sampleAnswers.industry, filters.industry))
    }
    
    if (filters.role && filters.role.length > 0) {
      conditions.push(inArray(sampleAnswers.role, filters.role))
    }
    
    if (filters.difficulty && filters.difficulty.length > 0) {
      conditions.push(inArray(sampleAnswers.difficulty, filters.difficulty as any))
    }
    
    if (filters.structure && filters.structure.length > 0) {
      conditions.push(inArray(sampleAnswers.structure, filters.structure as any))
    }
    
    let finalQuery = query;
    
    // Apply WHERE conditions
    if (conditions.length > 0) {
      finalQuery = (finalQuery as any).where(and(...conditions));
    }
    
    // Apply pagination
    if (filters.limit) {
      finalQuery = (finalQuery as any).limit(filters.limit);
    }
    
    if (filters.offset) {
      finalQuery = (finalQuery as any).offset(filters.offset);
    }
    
    return await databaseOptimizationService.executeOptimizedQuery(
      finalQuery.toSQL().sql,
      finalQuery.toSQL().params
    )
  }

  /**
   * Get trending questions with optimized aggregation
   */
  async getTrendingQuestions(filters: TrendFilters = {}) {
    const query = db.select().from(questionTrends)
    
    const conditions = []
    
    if (filters.industry && filters.industry.length > 0) {
      conditions.push(inArray(questionTrends.industry, filters.industry))
    }
    
    if (filters.timeframe && filters.timeframe.length > 0) {
      conditions.push(inArray(questionTrends.timeframe, filters.timeframe as any))
    }
    
    if (filters.minFrequency !== undefined) {
      conditions.push(gte(questionTrends.frequency, filters.minFrequency))
    }
    
    let finalQuery = query;
    
    // Apply WHERE conditions
    if (conditions.length > 0) {
      finalQuery = (finalQuery as any).where(and(...conditions));
    }
    
    // Apply ordering
    const orderBy = filters.orderBy || 'frequency';
    const direction = filters.orderDirection || 'desc';
    const orderColumn = questionTrends[orderBy as keyof typeof questionTrends];
    
    if (orderColumn) {
      finalQuery = (finalQuery as any).orderBy(direction === 'asc' ? asc(orderColumn as any) : desc(orderColumn as any));
    }
    
    // Apply pagination
    if (filters.limit) {
      finalQuery = (finalQuery as any).limit(filters.limit);
    }
    
    const queryData = (finalQuery as any).toSQL();
    return await databaseOptimizationService.executeOptimizedQuery(
      queryData.sql,
      queryData.params
    )
  }

  /**
   * Get company insights with caching
   */
  async getCompanyInsights(companyName: string) {
    const query = db
      .select()
      .from(companyInsights)
      .where(ilike(companyInsights.companyName, `%${companyName}%`))
      .limit(1)
    
    return await databaseOptimizationService.executeOptimizedQuery(
      query.toSQL().sql,
      query.toSQL().params
    )
  }

  /**
   * Search questions with full-text search
   */
  async searchQuestions(searchTerm: string, filters: QuestionFilters = {}) {
    // Use PostgreSQL full-text search
    const searchQuery = sql`to_tsvector('english', ${questions.text}) @@ plainto_tsquery('english', ${searchTerm})`
    
    // Build base query without conditions yet
    const baseQuery = db
      .select({
        id: questions.id,
        text: questions.text,
        type: questions.type,
        difficulty: questions.difficulty,
        rank: sql`ts_rank(to_tsvector('english', ${questions.text}), plainto_tsquery('english', ${searchTerm}))`.as('rank')
      })
      .from(questions);
    
    // Apply additional filters
    const conditions = [searchQuery]
    
    if (filters.type && filters.type.length > 0) {
      conditions.push(inArray(questions.type, filters.type as any))
    }
    
    if (filters.difficulty && filters.difficulty.length > 0) {
      conditions.push(inArray(questions.difficulty, filters.difficulty as any))
    }
    
    let finalQuery = baseQuery;
    
    // Apply WHERE conditions
    if (conditions.length > 0) {
      finalQuery = (finalQuery as any).where(and(...conditions));
    }
    
    // Apply ordering
    finalQuery = (finalQuery as any).orderBy(desc(sql`rank`));
    
    // Apply pagination
    finalQuery = (finalQuery as any).limit(filters.limit || 20);
    
    const queryData = finalQuery.toSQL()
    return await databaseOptimizationService.executeOptimizedQuery(
      queryData.sql,
      queryData.params
    )
  }

  /**
   * Get question statistics with optimized aggregation
   */
  async getQuestionStatistics(sessionId?: string) {
    const baseQuery = sessionId 
      ? db.select().from(questions).where(eq(questions.sessionId, sessionId))
      : db.select().from(questions)
    
    // Use raw SQL for better performance on aggregations
    const statsQuery = sessionId
      ? sql`
        SELECT 
          COUNT(*) as total_questions,
          COUNT(CASE WHEN type = 'behavioral' THEN 1 END) as behavioral_count,
          COUNT(CASE WHEN type = 'technical' THEN 1 END) as technical_count,
          COUNT(CASE WHEN type = 'situational' THEN 1 END) as situational_count,
          COUNT(CASE WHEN difficulty = 'easy' THEN 1 END) as easy_count,
          COUNT(CASE WHEN difficulty = 'medium' THEN 1 END) as medium_count,
          COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as hard_count,
          AVG(CAST(freshness_score AS FLOAT)) as avg_freshness,
          AVG(CAST(relevance_score AS FLOAT)) as avg_relevance,
          COUNT(CASE WHEN company_specific = true THEN 1 END) as company_specific_count
        FROM questions 
        WHERE session_id = ${sessionId}
      `
      : sql`
        SELECT 
          COUNT(*) as total_questions,
          COUNT(CASE WHEN type = 'behavioral' THEN 1 END) as behavioral_count,
          COUNT(CASE WHEN type = 'technical' THEN 1 END) as technical_count,
          COUNT(CASE WHEN type = 'situational' THEN 1 END) as situational_count,
          COUNT(CASE WHEN difficulty = 'easy' THEN 1 END) as easy_count,
          COUNT(CASE WHEN difficulty = 'medium' THEN 1 END) as medium_count,
          COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as hard_count,
          AVG(CAST(freshness_score AS FLOAT)) as avg_freshness,
          AVG(CAST(relevance_score AS FLOAT)) as avg_relevance,
          COUNT(CASE WHEN company_specific = true THEN 1 END) as company_specific_count
        FROM questions
      `
    
    return await databaseOptimizationService.executeOptimizedQuery(
      statsQuery.queryChunks.join(''),
      []
    )
  }

  /**
   * Bulk insert questions with optimized batch processing
   */
  async bulkInsertQuestions(questionsData: any[]) {
    // Use batch insert for better performance
    const batchSize = 100
    const results = []
    
    for (let i = 0; i < questionsData.length; i += batchSize) {
      const batch = questionsData.slice(i, i + batchSize)
      
      const query = db.insert(questions).values(batch).returning()
      
      const result = await databaseOptimizationService.executeOptimizedQuery(
        query.toSQL().sql,
        query.toSQL().params
      )
      
      results.push(...(result as any).rows || result)
    }
    
    return results
  }

  /**
   * Update question metrics in batch
   */
  async updateQuestionMetrics(updates: Array<{
    id: string
    freshnessScore?: number
    relevanceScore?: number
    updatedAt?: Date
  }>) {
    const queries = updates.map(update => ({
      query: `
        UPDATE questions 
        SET 
          freshness_score = COALESCE($2, freshness_score),
          relevance_score = COALESCE($3, relevance_score),
          updated_at = COALESCE($4, updated_at)
        WHERE id = $1
      `,
      params: [
        update.id,
        update.freshnessScore?.toString(),
        update.relevanceScore?.toString(),
        update.updatedAt || new Date()
      ]
    }))
    
    // Execute queries sequentially since executeBatch is not available
    const results = [];
    for (const query of queries) {
      const result = await databaseOptimizationService.executeOptimizedQuery(query.query, query.params || []);
      results.push(result);
    }
    return results;
  }

  /**
   * Clean up old data with optimized deletion
   */
  async cleanupOldData(daysOld: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    // Delete old questions that are not company-specific
    const deleteQuery = db
      .delete(questions)
      .where(
        and(
          lte(questions.createdAt, cutoffDate),
          eq(questions.companySpecific, false),
          lte(questions.freshnessScore, '0.3')
        )
      )
    
    return await databaseOptimizationService.executeOptimizedQuery(
      deleteQuery.toSQL().sql,
      deleteQuery.toSQL().params
    )
  }
}

// Export singleton instance
export const optimizedQueryService = new OptimizedQueryService()
export default optimizedQueryService
