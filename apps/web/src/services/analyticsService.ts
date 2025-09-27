import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

export interface AnalyticsData {
  overview: OverviewMetrics
  performance: PerformanceData
  trends: TrendData
  comparisons: ComparisonData
  insights: AIInsight[]
  goals: GoalData
}

export interface OverviewMetrics {
  totalSessions: number
  averageScore: number
  improvementRate: number
  timeSpent: number
  completionRate: number
  streakDays: number
  lastActivity: Date
  nextGoal: string
}

export interface PerformanceData {
  scoreHistory: ScorePoint[]
  categoryBreakdown: CategoryScore[]
  skillProgress: SkillProgress[]
  sessionTypes: SessionTypeData[]
  weeklyActivity: ActivityPoint[]
  monthlyTrends: TrendPoint[]
}

export interface ScorePoint {
  date: string
  score: number
  sessionType: string
  category: string
}

export interface CategoryScore {
  category: string
  current: number
  previous: number
  change: number
  trend: 'up' | 'down' | 'stable'
}

export interface SkillProgress {
  skill: string
  level: number
  progress: number
  target: number
  sessions: number
  lastPracticed: Date
}

export interface SessionTypeData {
  type: string
  count: number
  averageScore: number
  totalTime: number
  improvement: number
}

export interface ActivityPoint {
  date: string
  sessions: number
  score: number
  timeSpent: number
}

export interface TrendPoint {
  period: string
  value: number
  change: number
  benchmark: number
}

export interface TrendData {
  performanceTrend: 'improving' | 'declining' | 'stable'
  trendPercentage: number
  bestCategory: string
  weakestCategory: string
  consistencyScore: number
  peakPerformanceTime: string
  recommendations: string[]
}

export interface ComparisonData {
  industryBenchmark: number
  peerComparison: number
  topPercentile: number
  ranking: {
    overall: number
    category: { [key: string]: number }
  }
  competitiveAnalysis: {
    strengths: string[]
    gaps: string[]
    opportunities: string[]
  }
}

export interface AIInsight {
  id: string
  type: 'performance' | 'trend' | 'recommendation' | 'achievement' | 'warning'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actionable: boolean
  actions?: string[]
  data?: any
  confidence: number
  createdAt: Date
}

export interface GoalData {
  current: Goal[]
  completed: Goal[]
  suggested: Goal[]
  progress: GoalProgress
}

export interface Goal {
  id: string
  title: string
  description: string
  target: number
  current: number
  deadline: Date
  category: string
  priority: 'high' | 'medium' | 'low'
  status: 'active' | 'completed' | 'paused'
}

export interface GoalProgress {
  overallCompletion: number
  onTrackGoals: number
  behindGoals: number
  completedThisMonth: number
}

class AnalyticsService {
  // Generate comprehensive analytics data
  async getAnalyticsData(userId: string, timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AnalyticsData> {
    try {
      // In production, this would fetch from your analytics database
      const mockData = this.generateMockData(timeRange)
      return mockData
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      throw error
    }
  }

  // Generate AI-powered insights
  async generateInsights(performanceData: PerformanceData): Promise<AIInsight[]> {
    const insights: AIInsight[] = []

    // Performance trend analysis
    const recentScores = performanceData.scoreHistory.slice(-10)
    const averageRecent = recentScores.reduce((sum, point) => sum + point.score, 0) / recentScores.length
    const previousScores = performanceData.scoreHistory.slice(-20, -10)
    const averagePrevious = previousScores.reduce((sum, point) => sum + point.score, 0) / previousScores.length

    if (averageRecent > averagePrevious + 5) {
      insights.push({
        id: 'performance-improvement',
        type: 'achievement',
        title: 'Significant Performance Improvement',
        description: `Your average score has improved by ${(averageRecent - averagePrevious).toFixed(1)} points over the last 10 sessions.`,
        impact: 'high',
        actionable: false,
        confidence: 0.9,
        createdAt: new Date()
      })
    }

    // Consistency analysis
    const scoreVariance = this.calculateVariance(recentScores.map(s => s.score))
    if (scoreVariance < 50) {
      insights.push({
        id: 'consistency-achievement',
        type: 'achievement',
        title: 'Excellent Consistency',
        description: 'Your performance has been very consistent across recent sessions, showing mastery of core skills.',
        impact: 'medium',
        actionable: false,
        confidence: 0.85,
        createdAt: new Date()
      })
    }

    // Category-specific insights
    const weakestCategory = performanceData.categoryBreakdown
      .sort((a, b) => a.current - b.current)[0]

    if (weakestCategory && weakestCategory.current < 70) {
      insights.push({
        id: 'category-improvement',
        type: 'recommendation',
        title: `Focus on ${weakestCategory.category}`,
        description: `Your ${weakestCategory.category} score is below average. Targeted practice could yield significant improvements.`,
        impact: 'high',
        actionable: true,
        actions: [
          `Practice ${weakestCategory.category.toLowerCase()} questions daily`,
          'Review feedback from previous sessions',
          'Study best practices and examples'
        ],
        confidence: 0.8,
        createdAt: new Date()
      })
    }

    // Activity pattern insights
    const weeklyActivity = performanceData.weeklyActivity
    const mostActiveDay = weeklyActivity.reduce((max, day) => 
      day.sessions > max.sessions ? day : max
    )

    insights.push({
      id: 'activity-pattern',
      type: 'trend',
      title: 'Peak Performance Pattern',
      description: `You perform best on ${mostActiveDay.date} with an average score of ${mostActiveDay.score.toFixed(1)}.`,
      impact: 'medium',
      actionable: true,
      actions: [
        'Schedule important practice sessions on your peak days',
        'Maintain consistent practice schedule'
      ],
      confidence: 0.75,
      createdAt: new Date()
    })

    return insights
  }

  // Calculate performance predictions
  async predictPerformance(historicalData: ScorePoint[], days: number = 30): Promise<ScorePoint[]> {
    // Simple linear regression for prediction
    const predictions: ScorePoint[] = []
    const recentTrend = this.calculateTrend(historicalData.slice(-10))
    
    for (let i = 1; i <= days; i++) {
      const futureDate = format(new Date(Date.now() + i * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
      const predictedScore = Math.max(0, Math.min(100, 
        historicalData[historicalData.length - 1].score + (recentTrend * i)
      ))
      
      predictions.push({
        date: futureDate,
        score: Math.round(predictedScore),
        sessionType: 'predicted',
        category: 'overall'
      })
    }
    
    return predictions
  }

  // Generate benchmark comparisons
  async getBenchmarkData(userScore: number, category: string, industry: string): Promise<ComparisonData> {
    // Mock benchmark data - in production, this would come from aggregated user data
    const industryBenchmarks = {
      'technology': { average: 78, top10: 92, top25: 85 },
      'finance': { average: 75, top10: 89, top25: 82 },
      'healthcare': { average: 73, top10: 87, top25: 80 },
      'consulting': { average: 80, top10: 94, top25: 87 }
    }

    const benchmark = industryBenchmarks[industry as keyof typeof industryBenchmarks] || industryBenchmarks.technology

    return {
      industryBenchmark: benchmark.average,
      peerComparison: userScore - benchmark.average,
      topPercentile: benchmark.top10,
      ranking: {
        overall: this.calculatePercentileRank(userScore, benchmark.average),
        category: {
          'communication': this.calculatePercentileRank(userScore + 2, benchmark.average),
          'technical': this.calculatePercentileRank(userScore - 3, benchmark.average),
          'behavioral': this.calculatePercentileRank(userScore + 1, benchmark.average),
          'cultural': this.calculatePercentileRank(userScore, benchmark.average)
        }
      },
      competitiveAnalysis: {
        strengths: userScore > benchmark.average ? 
          ['Above industry average', 'Strong overall performance'] : 
          ['Room for improvement', 'Focused practice needed'],
        gaps: userScore < benchmark.top25 ? 
          ['Below top quartile', 'Consistency needed'] : 
          ['Approaching excellence'],
        opportunities: [
          'Targeted skill development',
          'Industry-specific preparation',
          'Peer learning and networking'
        ]
      }
    }
  }

  // Helper methods
  private generateMockData(timeRange: string): AnalyticsData {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    const now = new Date()
    
    // Generate score history
    const scoreHistory: ScorePoint[] = []
    for (let i = days; i >= 0; i--) {
      const date = format(subDays(now, i), 'yyyy-MM-dd')
      const baseScore = 70 + Math.random() * 20 + (days - i) * 0.1 // Slight improvement trend
      scoreHistory.push({
        date,
        score: Math.round(baseScore + (Math.random() - 0.5) * 10),
        sessionType: ['video', 'audio', 'text'][Math.floor(Math.random() * 3)],
        category: ['technical', 'behavioral', 'communication'][Math.floor(Math.random() * 3)]
      })
    }

    // Generate weekly activity
    const weeklyActivity: ActivityPoint[] = []
    const startDate = subWeeks(now, 4)
    const endDate = now
    const weekDays = eachDayOfInterval({ start: startDate, end: endDate })
    
    weekDays.forEach(day => {
      weeklyActivity.push({
        date: format(day, 'EEE'),
        sessions: Math.floor(Math.random() * 5) + 1,
        score: 70 + Math.random() * 25,
        timeSpent: Math.floor(Math.random() * 120) + 30
      })
    })

    return {
      overview: {
        totalSessions: 45,
        averageScore: 82,
        improvementRate: 15,
        timeSpent: 2340, // minutes
        completionRate: 89,
        streakDays: 7,
        lastActivity: subDays(now, 1),
        nextGoal: 'Reach 85% average score'
      },
      performance: {
        scoreHistory,
        categoryBreakdown: [
          { category: 'Communication', current: 85, previous: 78, change: 7, trend: 'up' },
          { category: 'Technical', current: 79, previous: 82, change: -3, trend: 'down' },
          { category: 'Behavioral', current: 84, previous: 81, change: 3, trend: 'up' },
          { category: 'Cultural Fit', current: 80, previous: 79, change: 1, trend: 'stable' }
        ],
        skillProgress: [
          { skill: 'Problem Solving', level: 4, progress: 75, target: 90, sessions: 12, lastPracticed: subDays(now, 2) },
          { skill: 'Leadership', level: 3, progress: 60, target: 80, sessions: 8, lastPracticed: subDays(now, 1) },
          { skill: 'System Design', level: 3, progress: 55, target: 85, sessions: 6, lastPracticed: subDays(now, 3) }
        ],
        sessionTypes: [
          { type: 'Video Interview', count: 20, averageScore: 83, totalTime: 900, improvement: 8 },
          { type: 'Audio Interview', count: 15, averageScore: 81, totalTime: 600, improvement: 5 },
          { type: 'Text Interview', count: 10, averageScore: 84, totalTime: 400, improvement: 12 }
        ],
        weeklyActivity,
        monthlyTrends: [
          { period: 'Jan', value: 75, change: 0, benchmark: 73 },
          { period: 'Feb', value: 78, change: 3, benchmark: 74 },
          { period: 'Mar', value: 82, change: 4, benchmark: 75 },
          { period: 'Apr', value: 85, change: 3, benchmark: 76 }
        ]
      },
      trends: {
        performanceTrend: 'improving',
        trendPercentage: 15,
        bestCategory: 'Communication',
        weakestCategory: 'Technical',
        consistencyScore: 78,
        peakPerformanceTime: 'Tuesday 10:00 AM',
        recommendations: [
          'Focus on technical interview preparation',
          'Maintain consistent practice schedule',
          'Practice system design questions'
        ]
      },
      comparisons: {
        industryBenchmark: 76,
        peerComparison: 6,
        topPercentile: 92,
        ranking: {
          overall: 75,
          category: {
            'communication': 80,
            'technical': 65,
            'behavioral': 78,
            'cultural': 72
          }
        },
        competitiveAnalysis: {
          strengths: ['Above industry average', 'Strong communication skills', 'Consistent improvement'],
          gaps: ['Technical depth', 'System design knowledge'],
          opportunities: ['Advanced technical courses', 'Mock technical interviews', 'Open source contributions']
        }
      },
      insights: [], // Will be populated by generateInsights
      goals: {
        current: [
          {
            id: '1',
            title: 'Reach 85% Average Score',
            description: 'Improve overall interview performance to 85%',
            target: 85,
            current: 82,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            category: 'Performance',
            priority: 'high',
            status: 'active'
          }
        ],
        completed: [],
        suggested: [],
        progress: {
          overallCompletion: 65,
          onTrackGoals: 2,
          behindGoals: 1,
          completedThisMonth: 1
        }
      }
    }
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length
  }

  private calculateTrend(data: ScorePoint[]): number {
    if (data.length < 2) return 0
    
    const firstScore = data[0].score
    const lastScore = data[data.length - 1].score
    return (lastScore - firstScore) / data.length
  }

  private calculatePercentileRank(score: number, average: number): number {
    // Simplified percentile calculation
    const standardDeviation = 15 // Assumed
    const zScore = (score - average) / standardDeviation
    return Math.round(50 + (zScore * 15))
  }
}

export const analyticsService = new AnalyticsService()
