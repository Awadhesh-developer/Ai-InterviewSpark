'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Eye,
  Download,
  Calendar,
  Users,
  Award,
  Clock,
  FileText,
  Search,
  Filter,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  Star,
  Globe,
  Briefcase
} from 'lucide-react'

interface ResumeMetrics {
  totalViews: number
  atsScore: number
  keywordMatch: number
  responseRate: number
  lastUpdated: string
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
}

interface PerformanceData {
  date: string
  views: number
  atsScore: number
  applications: number
  responses: number
}

interface KeywordPerformance {
  keyword: string
  frequency: number
  effectiveness: number
  trend: 'up' | 'down' | 'stable'
  category: string
}

interface IndustryBenchmark {
  metric: string
  yourScore: number
  industryAverage: number
  topPercentile: number
  category: string
}

interface ResumeVersion {
  id: string
  name: string
  createdDate: string
  atsScore: number
  views: number
  applications: number
  responses: number
  isActive: boolean
}

// Mock data for demonstration
const mockMetrics: ResumeMetrics = {
  totalViews: 1247,
  atsScore: 78,
  keywordMatch: 85,
  responseRate: 12.5,
  lastUpdated: '2024-01-20T10:30:00Z',
  trend: 'up',
  trendPercentage: 15.2
}

const mockPerformanceData: PerformanceData[] = [
  { date: '2024-01-01', views: 45, atsScore: 72, applications: 8, responses: 1 },
  { date: '2024-01-08', views: 62, atsScore: 75, applications: 12, responses: 2 },
  { date: '2024-01-15', views: 78, atsScore: 78, applications: 15, responses: 3 },
  { date: '2024-01-22', views: 89, atsScore: 78, applications: 18, responses: 4 },
  { date: '2024-01-29', views: 95, atsScore: 80, applications: 22, responses: 5 }
]

const mockKeywordPerformance: KeywordPerformance[] = [
  { keyword: 'JavaScript', frequency: 8, effectiveness: 92, trend: 'up', category: 'Technical' },
  { keyword: 'React', frequency: 6, effectiveness: 88, trend: 'up', category: 'Technical' },
  { keyword: 'Leadership', frequency: 4, effectiveness: 75, trend: 'stable', category: 'Soft Skills' },
  { keyword: 'Project Management', frequency: 5, effectiveness: 82, trend: 'up', category: 'Management' },
  { keyword: 'Python', frequency: 3, effectiveness: 65, trend: 'down', category: 'Technical' }
]

const mockIndustryBenchmarks: IndustryBenchmark[] = [
  { metric: 'ATS Compatibility', yourScore: 78, industryAverage: 65, topPercentile: 85, category: 'Technical' },
  { metric: 'Keyword Density', yourScore: 85, industryAverage: 72, topPercentile: 90, category: 'Content' },
  { metric: 'Response Rate', yourScore: 12.5, industryAverage: 8.2, topPercentile: 18.5, category: 'Performance' },
  { metric: 'Profile Views', yourScore: 1247, industryAverage: 890, topPercentile: 2100, category: 'Visibility' }
]

const mockResumeVersions: ResumeVersion[] = [
  { id: '1', name: 'Software Engineer Resume v3.2', createdDate: '2024-01-20', atsScore: 78, views: 245, applications: 12, responses: 3, isActive: true },
  { id: '2', name: 'Software Engineer Resume v3.1', createdDate: '2024-01-15', atsScore: 75, views: 189, applications: 8, responses: 2, isActive: false },
  { id: '3', name: 'Software Engineer Resume v3.0', createdDate: '2024-01-10', atsScore: 72, views: 156, applications: 6, responses: 1, isActive: false },
  { id: '4', name: 'Software Engineer Resume v2.9', createdDate: '2024-01-05', atsScore: 68, views: 134, applications: 4, responses: 0, isActive: false }
]

export default function ResumeAnalyticsTab() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [isLoading, setIsLoading] = useState(false)

  const getTrendIcon = (trend: string, size: string = 'h-4 w-4') => {
    switch (trend) {
      case 'up': return <ArrowUp className={`${size} text-green-500`} />
      case 'down': return <ArrowDown className={`${size} text-red-500`} />
      case 'stable': return <Minus className={`${size} text-gray-500`} />
      default: return <Minus className={`${size} text-gray-500`} />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400'
      case 'down': return 'text-red-600 dark:text-red-400'
      case 'stable': return 'text-gray-600 dark:text-gray-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-950/20'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-950/20'
    return 'bg-red-100 dark:bg-red-950/20'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const refreshData = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Resume Analytics</h2>
          <p className="text-muted-foreground">Track performance, optimize effectiveness, and measure success</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold text-foreground">{mockMetrics.totalViews.toLocaleString()}</p>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(mockMetrics.trend)}
                <span className={`text-sm font-medium ${getTrendColor(mockMetrics.trend)}`}>
                  {mockMetrics.trendPercentage}%
                </span>
              </div>
            </div>
            <div className="flex items-center mt-2">
              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ATS Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(mockMetrics.atsScore)}`}>
                  {mockMetrics.atsScore}%
                </p>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon('up')}
                <span className="text-sm font-medium text-green-600 dark:text-green-400">+3%</span>
              </div>
            </div>
            <div className="flex items-center mt-2">
              <Target className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-xs text-muted-foreground">ATS compatibility</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Keyword Match</p>
                <p className="text-2xl font-bold text-foreground">{mockMetrics.keywordMatch}%</p>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon('up')}
                <span className="text-sm font-medium text-green-600 dark:text-green-400">+8%</span>
              </div>
            </div>
            <div className="flex items-center mt-2">
              <Search className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2" />
              <span className="text-xs text-muted-foreground">vs job requirements</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold text-foreground">{mockMetrics.responseRate}%</p>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon('up')}
                <span className="text-sm font-medium text-green-600 dark:text-green-400">+2.1%</span>
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400 mr-2" />
              <span className="text-xs text-muted-foreground">application success</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Keywords</span>
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Benchmarks</span>
          </TabsTrigger>
          <TabsTrigger value="versions" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Versions</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Performance Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPerformanceData.slice(-5).map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-foreground">
                          {formatDate(data.date)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium text-foreground">{data.views}</p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                        <div className="text-center">
                          <p className={`font-medium ${getScoreColor(data.atsScore)}`}>{data.atsScore}%</p>
                          <p className="text-xs text-muted-foreground">ATS</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-foreground">{data.applications}</p>
                          <p className="text-xs text-muted-foreground">Apps</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-foreground">{data.responses}</p>
                          <p className="text-xs text-muted-foreground">Resp</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span>Quick Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">Strong ATS Performance</h4>
                      <p className="text-sm text-muted-foreground">Your resume scores above industry average</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">Keyword Optimization Needed</h4>
                      <p className="text-sm text-muted-foreground">Add 3 more industry-specific keywords</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">Growing Visibility</h4>
                      <p className="text-sm text-muted-foreground">Views increased 15% this month</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span>View Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Views</span>
                    <span className="font-medium text-foreground">1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Unique Viewers</span>
                    <span className="font-medium text-foreground">892</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg. View Duration</span>
                    <span className="font-medium text-foreground">2m 34s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bounce Rate</span>
                    <span className="font-medium text-foreground">23%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-green-600" />
                  <span>Application Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Applications Sent</span>
                    <span className="font-medium text-foreground">67</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Responses Received</span>
                    <span className="font-medium text-foreground">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Interview Requests</span>
                    <span className="font-medium text-foreground">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="font-medium text-green-600">17.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <span>Time Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg. Response Time</span>
                    <span className="font-medium text-foreground">5.2 days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Peak Activity</span>
                    <span className="font-medium text-foreground">Tue 2-4 PM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="font-medium text-foreground">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Since</span>
                    <span className="font-medium text-foreground">Jan 2024</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Performance Over Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Chart Placeholder */}
                <div className="h-64 bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Interactive chart visualization</p>
                    <p className="text-sm text-muted-foreground">Views, Applications, and Response trends</p>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">+24%</p>
                    <p className="text-sm text-muted-foreground">Views Growth</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">+18%</p>
                    <p className="text-sm text-muted-foreground">Response Rate</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">+12%</p>
                    <p className="text-sm text-muted-foreground">ATS Score</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">-8%</p>
                    <p className="text-sm text-muted-foreground">Bounce Rate</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-6">
          {/* Keyword Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">24</p>
                    <p className="text-sm text-muted-foreground">Active Keywords</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">87%</p>
                    <p className="text-sm text-muted-foreground">Avg Effectiveness</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Star className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">8</p>
                    <p className="text-sm text-muted-foreground">Top Performers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Keyword Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-primary" />
                <span>Keyword Performance Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockKeywordPerformance.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium text-foreground">{keyword.keyword}</h4>
                        <p className="text-sm text-muted-foreground">{keyword.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="font-medium text-foreground">{keyword.frequency}</p>
                        <p className="text-xs text-muted-foreground">Frequency</p>
                      </div>

                      <div className="text-center">
                        <p className={`font-medium ${getScoreColor(keyword.effectiveness)}`}>
                          {keyword.effectiveness}%
                        </p>
                        <p className="text-xs text-muted-foreground">Effectiveness</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {getTrendIcon(keyword.trend)}
                        <span className={`text-sm ${getTrendColor(keyword.trend)}`}>
                          {keyword.trend}
                        </span>
                      </div>

                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Keyword Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockKeywordPerformance
                    .filter(k => k.effectiveness >= 85)
                    .map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                      <div>
                        <span className="font-medium text-foreground">{keyword.keyword}</span>
                        <p className="text-xs text-muted-foreground">{keyword.category}</p>
                      </div>
                      <Badge className="bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400">
                        {keyword.effectiveness}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Keywords Needing Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockKeywordPerformance
                    .filter(k => k.effectiveness < 75 || k.trend === 'down')
                    .map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
                      <div>
                        <span className="font-medium text-foreground">{keyword.keyword}</span>
                        <p className="text-xs text-muted-foreground">{keyword.category}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400">
                          {keyword.effectiveness}%
                        </Badge>
                        {getTrendIcon(keyword.trend, 'h-3 w-3')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-6">
          {/* Benchmark Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-8 w-8 text-gold-600 dark:text-gold-400" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">Top 25%</p>
                    <p className="text-sm text-muted-foreground">Industry Ranking</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">+15%</p>
                    <p className="text-sm text-muted-foreground">Above Average</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">2,847</p>
                    <p className="text-sm text-muted-foreground">Peer Resumes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Globe className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">Tech</p>
                    <p className="text-sm text-muted-foreground">Industry</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Industry Benchmarks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Industry Comparison</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockIndustryBenchmarks.map((benchmark, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{benchmark.metric}</h4>
                      <Badge variant="outline" className="text-xs">
                        {benchmark.category}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {/* Your Score */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Your Score</span>
                        <span className="font-medium text-foreground">
                          {typeof benchmark.yourScore === 'number' && benchmark.yourScore > 100
                            ? benchmark.yourScore.toLocaleString()
                            : `${benchmark.yourScore}${benchmark.metric.includes('Rate') || benchmark.metric.includes('Compatibility') || benchmark.metric.includes('Density') ? '%' : ''}`
                          }
                        </span>
                      </div>
                      <Progress
                        value={Math.min(100, (benchmark.yourScore / benchmark.topPercentile) * 100)}
                        className="h-2"
                      />

                      {/* Industry Average */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Industry Average</span>
                        <span className="text-muted-foreground">
                          {typeof benchmark.industryAverage === 'number' && benchmark.industryAverage > 100
                            ? benchmark.industryAverage.toLocaleString()
                            : `${benchmark.industryAverage}${benchmark.metric.includes('Rate') || benchmark.metric.includes('Compatibility') || benchmark.metric.includes('Density') ? '%' : ''}`
                          }
                        </span>
                      </div>

                      {/* Top Percentile */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Top 10%</span>
                        <span className="text-muted-foreground">
                          {typeof benchmark.topPercentile === 'number' && benchmark.topPercentile > 100
                            ? benchmark.topPercentile.toLocaleString()
                            : `${benchmark.topPercentile}${benchmark.metric.includes('Rate') || benchmark.metric.includes('Compatibility') || benchmark.metric.includes('Density') ? '%' : ''}`
                          }
                        </span>
                      </div>
                    </div>

                    {/* Performance Indicator */}
                    <div className="flex items-center space-x-2">
                      {benchmark.yourScore >= benchmark.topPercentile * 0.9 ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600 dark:text-green-400">Excellent Performance</span>
                        </>
                      ) : benchmark.yourScore >= benchmark.industryAverage ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-blue-600 dark:text-blue-400">Above Average</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-yellow-600 dark:text-yellow-400">Room for Improvement</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Improvement Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-primary" />
                <span>Improvement Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Boost ATS Compatibility</h4>
                    <p className="text-sm text-muted-foreground">Add 3 more technical keywords to reach top 10% (85%+)</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <Award className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Maintain Strong Performance</h4>
                    <p className="text-sm text-muted-foreground">Your response rate is excellent - keep current strategy</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Increase Visibility</h4>
                    <p className="text-sm text-muted-foreground">Target 2,100+ profile views to reach top percentile</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value="versions" className="space-y-6">
          {/* Version Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{mockResumeVersions.length}</p>
                    <p className="text-sm text-muted-foreground">Total Versions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">1</p>
                    <p className="text-sm text-muted-foreground">Active Version</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">+10</p>
                    <p className="text-sm text-muted-foreground">ATS Improvement</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">5d</p>
                    <p className="text-sm text-muted-foreground">Last Update</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Version Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Resume Version History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockResumeVersions.map((version, index) => (
                  <div key={version.id} className={`p-4 border rounded-lg ${version.isActive ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium text-foreground">{version.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Created {formatDate(version.createdDate)}
                            </p>
                          </div>
                        </div>
                        {version.isActive && (
                          <Badge className="bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400">
                            Active
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className={`font-medium ${getScoreColor(version.atsScore)}`}>
                            {version.atsScore}%
                          </p>
                          <p className="text-xs text-muted-foreground">ATS Score</p>
                        </div>

                        <div className="text-center">
                          <p className="font-medium text-foreground">{version.views}</p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>

                        <div className="text-center">
                          <p className="font-medium text-foreground">{version.applications}</p>
                          <p className="text-xs text-muted-foreground">Applications</p>
                        </div>

                        <div className="text-center">
                          <p className="font-medium text-foreground">{version.responses}</p>
                          <p className="text-xs text-muted-foreground">Responses</p>
                        </div>

                        <div className="text-center">
                          <p className="font-medium text-foreground">
                            {version.applications > 0 ? ((version.responses / version.applications) * 100).toFixed(1) : '0'}%
                          </p>
                          <p className="text-xs text-muted-foreground">Success Rate</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          {!version.isActive && (
                            <Button size="sm">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Performance Comparison */}
                    {index > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground">vs Previous:</span>
                            <div className="flex items-center space-x-1">
                              {version.atsScore > mockResumeVersions[index - 1]?.atsScore ? (
                                <ArrowUp className="h-3 w-3 text-green-500" />
                              ) : version.atsScore < mockResumeVersions[index - 1]?.atsScore ? (
                                <ArrowDown className="h-3 w-3 text-red-500" />
                              ) : (
                                <Minus className="h-3 w-3 text-gray-500" />
                              )}
                              <span className={`font-medium ${
                                version.atsScore > mockResumeVersions[index - 1]?.atsScore ? 'text-green-600 dark:text-green-400' :
                                version.atsScore < mockResumeVersions[index - 1]?.atsScore ? 'text-red-600 dark:text-red-400' :
                                'text-gray-600 dark:text-gray-400'
                              }`}>
                                ATS {Math.abs(version.atsScore - (mockResumeVersions[index - 1]?.atsScore || 0))}%
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            {version.views > mockResumeVersions[index - 1]?.views ? (
                              <ArrowUp className="h-3 w-3 text-green-500" />
                            ) : version.views < mockResumeVersions[index - 1]?.views ? (
                              <ArrowDown className="h-3 w-3 text-red-500" />
                            ) : (
                              <Minus className="h-3 w-3 text-gray-500" />
                            )}
                            <span className={`font-medium ${
                              version.views > mockResumeVersions[index - 1]?.views ? 'text-green-600 dark:text-green-400' :
                              version.views < mockResumeVersions[index - 1]?.views ? 'text-red-600 dark:text-red-400' :
                              'text-gray-600 dark:text-gray-400'
                            }`}>
                              Views {Math.abs(version.views - (mockResumeVersions[index - 1]?.views || 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Version Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Version Performance Comparison</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Version comparison chart</p>
                  <p className="text-sm text-muted-foreground">ATS scores, views, and success rates over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
