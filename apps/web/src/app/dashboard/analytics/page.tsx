'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { analyticsService, AnalyticsData } from '@/services/analyticsService'
import { PerformanceOverview } from '@/components/analytics/PerformanceOverview'
import { PerformanceCharts } from '@/components/analytics/PerformanceCharts'
import { InsightsPanel } from '@/components/analytics/InsightsPanel'
import { BenchmarkComparison } from '@/components/analytics/BenchmarkComparison'
import { GoalsTracker } from '@/components/analytics/GoalsTracker'
import AdvancedInsights from '@/components/analytics/AdvancedInsights'
import PerformanceComparison from '@/components/analytics/PerformanceComparison'
import SmartGoals from '@/components/analytics/SmartGoals'
import {
  BarChart3,
  TrendingUp,
  Target,
  Brain,
  Download,
  Share2,
  Calendar,
  Filter,
  RefreshCw,
  Award,
  Users,
  Zap,
  Clock,
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true)
      const data = await analyticsService.getAnalyticsData('user-123', timeRange)
      
      // Generate AI insights
      const insights = await analyticsService.generateInsights(data.performance)
      data.insights = insights
      
      setAnalyticsData(data)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = () => {
    console.log('Exporting analytics report...')
    // Implement PDF export functionality
  }

  const shareReport = () => {
    console.log('Sharing analytics report...')
    // Implement sharing functionality
  }

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 Days'
      case '30d': return 'Last 30 Days'
      case '90d': return 'Last 3 Months'
      case '1y': return 'Last Year'
      default: return 'Last 30 Days'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining':
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Analytics Data</h3>
        <p className="text-gray-500 mb-4">Unable to load analytics data.</p>
        <Button onClick={loadAnalyticsData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-600 flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <span>Performance Analytics</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into your interview performance and progress
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 3 Months</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
          
          <Button variant="outline" onClick={shareReport}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={loadAnalyticsData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(analyticsData.overview.averageScore)}`}>
              {analyticsData.overview.averageScore}%
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(analyticsData.trends.performanceTrend)}
              <span>+{analyticsData.overview.improvementRate}% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Practiced</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(analyticsData.overview.timeSpent / 60)}h {analyticsData.overview.timeSpent % 60}m
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.streakDays} day streak
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Industry Rank</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analyticsData.comparisons.ranking.overall}%
            </div>
            <p className="text-xs text-muted-foreground">
              Top {100 - analyticsData.comparisons.ranking.overall}% of candidates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Banner */}
      {analyticsData.insights.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Brain className="h-8 w-8 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  AI-Powered Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analyticsData.insights.slice(0, 2).map((insight) => (
                    <div key={insight.id} className="flex items-start space-x-3">
                      {insight.type === 'achievement' ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
                      )}
                      <div>
                        <h4 className="font-medium text-blue-900">{insight.title}</h4>
                        <p className="text-sm text-blue-700">{insight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PerformanceOverview data={analyticsData} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceCharts data={analyticsData.performance} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsPanel insights={analyticsData.insights} trends={analyticsData.trends} />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <AdvancedInsights
            userId="user-123"
            timeRange={timeRange}
            performanceData={analyticsData.performance}
          />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <PerformanceComparison
            userId="user-123"
            userRole="Software Engineer"
            experienceLevel="Mid-level"
            location="San Francisco, CA"
          />
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6">
          <BenchmarkComparison 
            userScore={analyticsData.overview.averageScore}
            comparisons={analyticsData.comparisons}
            categoryBreakdown={analyticsData.performance.categoryBreakdown}
          />
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div>
              <GoalsTracker goals={analyticsData.goals} />
            </div>
            <div>
              <SmartGoals userId="user-123" />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            <span>Recommended Actions</span>
          </CardTitle>
          <CardDescription>
            Based on your performance analysis, here are some recommended next steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Practice {analyticsData.trends.weakestCategory}</h4>
              <p className="text-sm text-gray-600 mb-3">
                Focus on your weakest area to see the biggest improvement
              </p>
              <Button size="sm" variant="outline">Start Practice</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Schedule Regular Sessions</h4>
              <p className="text-sm text-gray-600 mb-3">
                Maintain your {analyticsData.overview.streakDays}-day streak with consistent practice
              </p>
              <Button size="sm" variant="outline">Set Schedule</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Join Study Group</h4>
              <p className="text-sm text-gray-600 mb-3">
                Connect with peers in your industry for collaborative learning
              </p>
              <Button size="sm" variant="outline">Find Groups</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
