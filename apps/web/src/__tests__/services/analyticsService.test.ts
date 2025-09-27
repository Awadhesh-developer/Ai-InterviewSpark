import { analyticsService } from '@/services/analyticsService'

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAnalyticsData', () => {
    it('returns analytics data for different time ranges', async () => {
      const data7d = await analyticsService.getAnalyticsData('user-123', '7d')
      expect(data7d).toBeDefined()
      expect(data7d.overview).toBeDefined()
      expect(data7d.performance).toBeDefined()
      expect(data7d.trends).toBeDefined()
      expect(data7d.comparisons).toBeDefined()

      const data30d = await analyticsService.getAnalyticsData('user-123', '30d')
      expect(data30d).toBeDefined()
      
      const data90d = await analyticsService.getAnalyticsData('user-123', '90d')
      expect(data90d).toBeDefined()
      
      const data1y = await analyticsService.getAnalyticsData('user-123', '1y')
      expect(data1y).toBeDefined()
    })

    it('includes all required overview metrics', async () => {
      const data = await analyticsService.getAnalyticsData('user-123')
      
      expect(data.overview).toEqual(
        expect.objectContaining({
          totalSessions: expect.any(Number),
          averageScore: expect.any(Number),
          improvementRate: expect.any(Number),
          timeSpent: expect.any(Number),
          completionRate: expect.any(Number),
          streakDays: expect.any(Number),
          lastActivity: expect.any(Date),
          nextGoal: expect.any(String)
        })
      )
    })

    it('includes performance data with correct structure', async () => {
      const data = await analyticsService.getAnalyticsData('user-123')
      
      expect(data.performance).toEqual(
        expect.objectContaining({
          scoreHistory: expect.any(Array),
          categoryBreakdown: expect.any(Array),
          skillProgress: expect.any(Array),
          sessionTypes: expect.any(Array),
          weeklyActivity: expect.any(Array),
          monthlyTrends: expect.any(Array)
        })
      )

      // Check category breakdown structure
      data.performance.categoryBreakdown.forEach(category => {
        expect(category).toEqual(
          expect.objectContaining({
            category: expect.any(String),
            current: expect.any(Number),
            previous: expect.any(Number),
            change: expect.any(Number),
            trend: expect.stringMatching(/^(up|down|stable)$/)
          })
        )
      })
    })

    it('includes trend analysis', async () => {
      const data = await analyticsService.getAnalyticsData('user-123')
      
      expect(data.trends).toEqual(
        expect.objectContaining({
          performanceTrend: expect.stringMatching(/^(improving|declining|stable)$/),
          trendPercentage: expect.any(Number),
          bestCategory: expect.any(String),
          weakestCategory: expect.any(String),
          consistencyScore: expect.any(Number),
          peakPerformanceTime: expect.any(String),
          recommendations: expect.any(Array)
        })
      )
    })

    it('includes comparison data', async () => {
      const data = await analyticsService.getAnalyticsData('user-123')
      
      expect(data.comparisons).toEqual(
        expect.objectContaining({
          industryBenchmark: expect.any(Number),
          peerComparison: expect.any(Number),
          topPercentile: expect.any(Number),
          ranking: expect.objectContaining({
            overall: expect.any(Number),
            category: expect.any(Object)
          }),
          competitiveAnalysis: expect.objectContaining({
            strengths: expect.any(Array),
            gaps: expect.any(Array),
            opportunities: expect.any(Array)
          })
        })
      )
    })
  })

  describe('generateInsights', () => {
    const mockPerformanceData = {
      scoreHistory: [
        { date: '2024-01-01', score: 70, sessionType: 'video', category: 'technical' },
        { date: '2024-01-02', score: 75, sessionType: 'audio', category: 'behavioral' },
        { date: '2024-01-03', score: 80, sessionType: 'video', category: 'technical' },
        { date: '2024-01-04', score: 85, sessionType: 'text', category: 'communication' }
      ],
      categoryBreakdown: [
        { category: 'Communication', current: 85, previous: 78, change: 7, trend: 'up' as const },
        { category: 'Technical', current: 65, previous: 70, change: -5, trend: 'down' as const }
      ],
      skillProgress: [],
      sessionTypes: [],
      weeklyActivity: [
        { date: 'Mon', sessions: 3, score: 80, timeSpent: 90 },
        { date: 'Tue', sessions: 5, score: 85, timeSpent: 120 }
      ],
      monthlyTrends: []
    }

    it('generates performance improvement insights', async () => {
      const insights = await analyticsService.generateInsights(mockPerformanceData)
      
      expect(insights).toBeInstanceOf(Array)
      expect(insights.length).toBeGreaterThan(0)
      
      insights.forEach(insight => {
        expect(insight).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            type: expect.stringMatching(/^(performance|trend|recommendation|achievement|warning)$/),
            title: expect.any(String),
            description: expect.any(String),
            impact: expect.stringMatching(/^(high|medium|low)$/),
            actionable: expect.any(Boolean),
            confidence: expect.any(Number),
            createdAt: expect.any(Date)
          })
        )
      })
    })

    it('identifies performance improvements', async () => {
      const insights = await analyticsService.generateInsights(mockPerformanceData)
      
      const improvementInsight = insights.find(insight => 
        insight.type === 'achievement' && 
        insight.title.includes('Performance Improvement')
      )
      
      expect(improvementInsight).toBeDefined()
      expect(improvementInsight?.impact).toBe('high')
    })

    it('provides category-specific recommendations', async () => {
      const insights = await analyticsService.generateInsights(mockPerformanceData)
      
      const categoryInsight = insights.find(insight => 
        insight.type === 'recommendation' && 
        insight.title.includes('Technical')
      )
      
      expect(categoryInsight).toBeDefined()
      expect(categoryInsight?.actionable).toBe(true)
      expect(categoryInsight?.actions).toBeDefined()
      expect(categoryInsight?.actions?.length).toBeGreaterThan(0)
    })

    it('analyzes activity patterns', async () => {
      const insights = await analyticsService.generateInsights(mockPerformanceData)
      
      const activityInsight = insights.find(insight => 
        insight.type === 'trend' && 
        insight.title.includes('Peak Performance Pattern')
      )
      
      expect(activityInsight).toBeDefined()
    })
  })

  describe('predictPerformance', () => {
    const mockHistoricalData = [
      { date: '2024-01-01', score: 70, sessionType: 'video', category: 'technical' },
      { date: '2024-01-02', score: 72, sessionType: 'audio', category: 'behavioral' },
      { date: '2024-01-03', score: 74, sessionType: 'video', category: 'technical' },
      { date: '2024-01-04', score: 76, sessionType: 'text', category: 'communication' },
      { date: '2024-01-05', score: 78, sessionType: 'video', category: 'technical' }
    ]

    it('predicts future performance based on historical data', async () => {
      const predictions = await analyticsService.predictPerformance(mockHistoricalData, 7)
      
      expect(predictions).toBeInstanceOf(Array)
      expect(predictions).toHaveLength(7)
      
      predictions.forEach(prediction => {
        expect(prediction).toEqual(
          expect.objectContaining({
            date: expect.any(String),
            score: expect.any(Number),
            sessionType: 'predicted',
            category: 'overall'
          })
        )
        
        expect(prediction.score).toBeGreaterThanOrEqual(0)
        expect(prediction.score).toBeLessThanOrEqual(100)
      })
    })

    it('shows upward trend for improving performance', async () => {
      const predictions = await analyticsService.predictPerformance(mockHistoricalData, 5)
      
      // Since mock data shows improvement, predictions should generally trend upward
      const firstPrediction = predictions[0]
      const lastPrediction = predictions[predictions.length - 1]
      
      expect(lastPrediction.score).toBeGreaterThanOrEqual(firstPrediction.score)
    })

    it('handles edge cases', async () => {
      // Empty data
      const emptyPredictions = await analyticsService.predictPerformance([], 5)
      expect(emptyPredictions).toHaveLength(5)
      
      // Single data point
      const singleDataPoint = [mockHistoricalData[0]]
      const singlePredictions = await analyticsService.predictPerformance(singleDataPoint, 3)
      expect(singlePredictions).toHaveLength(3)
    })
  })

  describe('getBenchmarkData', () => {
    it('returns benchmark data for different industries', async () => {
      const techBenchmark = await analyticsService.getBenchmarkData(85, 'technical', 'technology')
      expect(techBenchmark).toBeDefined()
      expect(techBenchmark.industryBenchmark).toBe(78)
      
      const financeBenchmark = await analyticsService.getBenchmarkData(85, 'technical', 'finance')
      expect(financeBenchmark.industryBenchmark).toBe(75)
      
      const healthcareBenchmark = await analyticsService.getBenchmarkData(85, 'technical', 'healthcare')
      expect(healthcareBenchmark.industryBenchmark).toBe(73)
    })

    it('calculates peer comparison correctly', async () => {
      const benchmark = await analyticsService.getBenchmarkData(85, 'technical', 'technology')
      
      expect(benchmark.peerComparison).toBe(7) // 85 - 78
      expect(benchmark.topPercentile).toBe(92)
    })

    it('provides competitive analysis', async () => {
      const benchmark = await analyticsService.getBenchmarkData(85, 'technical', 'technology')
      
      expect(benchmark.competitiveAnalysis).toEqual(
        expect.objectContaining({
          strengths: expect.any(Array),
          gaps: expect.any(Array),
          opportunities: expect.any(Array)
        })
      )
      
      expect(benchmark.competitiveAnalysis.strengths.length).toBeGreaterThan(0)
      expect(benchmark.competitiveAnalysis.opportunities.length).toBeGreaterThan(0)
    })

    it('calculates percentile rankings', async () => {
      const benchmark = await analyticsService.getBenchmarkData(85, 'technical', 'technology')
      
      expect(benchmark.ranking.overall).toBeGreaterThan(0)
      expect(benchmark.ranking.overall).toBeLessThanOrEqual(100)
      
      Object.values(benchmark.ranking.category).forEach(ranking => {
        expect(ranking).toBeGreaterThan(0)
        expect(ranking).toBeLessThanOrEqual(100)
      })
    })

    it('handles unknown industries with fallback', async () => {
      const benchmark = await analyticsService.getBenchmarkData(85, 'technical', 'unknown-industry')
      
      // Should fallback to technology industry
      expect(benchmark.industryBenchmark).toBe(78)
    })
  })
})
