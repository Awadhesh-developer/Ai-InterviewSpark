'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Clock,
  Award,
  Users,
  Zap,
  Heart,
  Eye,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'

interface AnalyticsData {
  overallProgress: {
    currentLevel: string
    targetLevel: string
    progressPercentage: number
    estimatedCompletion: string
  }
  performanceMetrics: {
    averageScore: number
    improvementRate: number
    sessionsCompleted: number
    totalTimeSpent: number
    streakDays: number
  }
  skillBreakdown: {
    skill: string
    current: number
    target: number
    improvement: number
    trend: 'up' | 'down' | 'stable'
  }[]
  emotionalIntelligence: {
    confidence: number
    stressManagement: number
    engagement: number
    clarity: number
    overallEQ: number
  }
  sessionHistory: {
    date: string
    score: number
    type: string
    duration: number
    improvements: string[]
  }[]
  coachingEffectiveness: {
    aiCoachRating: number
    humanCoachRating: number
    preferredCoachType: 'ai' | 'human' | 'mixed'
    feedbackQuality: number
  }
  industryBenchmarks: {
    skill: string
    userScore: number
    industryAverage: number
    topPercentile: number
  }[]
}

export default function AdvancedAnalyticsDashboard({ userId }: { userId: string }) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('overall')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
  }, [userId, timeRange])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // Mock analytics data - in production, fetch from API
      const mockData: AnalyticsData = {
        overallProgress: {
          currentLevel: 'Intermediate',
          targetLevel: 'Advanced',
          progressPercentage: 68,
          estimatedCompletion: '6 weeks'
        },
        performanceMetrics: {
          averageScore: 78,
          improvementRate: 12,
          sessionsCompleted: 24,
          totalTimeSpent: 48,
          streakDays: 7
        },
        skillBreakdown: [
          { skill: 'System Design', current: 75, target: 90, improvement: 15, trend: 'up' },
          { skill: 'Algorithms', current: 82, target: 95, improvement: 8, trend: 'up' },
          { skill: 'Communication', current: 70, target: 85, improvement: 5, trend: 'stable' },
          { skill: 'Leadership', current: 65, target: 80, improvement: 10, trend: 'up' },
          { skill: 'Problem Solving', current: 88, target: 95, improvement: 3, trend: 'stable' }
        ],
        emotionalIntelligence: {
          confidence: 78,
          stressManagement: 72,
          engagement: 85,
          clarity: 80,
          overallEQ: 79
        },
        sessionHistory: [
          { date: '2024-01-15', score: 85, type: 'AI Coaching', duration: 45, improvements: ['Better structure', 'Clear examples'] },
          { date: '2024-01-14', score: 78, type: 'Mock Interview', duration: 60, improvements: ['Confidence boost', 'Technical depth'] },
          { date: '2024-01-13', score: 82, type: 'Skill Practice', duration: 30, improvements: ['Algorithm optimization'] },
          { date: '2024-01-12', score: 75, type: 'AI Coaching', duration: 40, improvements: ['Communication clarity'] },
          { date: '2024-01-11', score: 80, type: 'Human Expert', duration: 90, improvements: ['Strategic thinking', 'Leadership'] }
        ],
        coachingEffectiveness: {
          aiCoachRating: 4.7,
          humanCoachRating: 4.9,
          preferredCoachType: 'mixed',
          feedbackQuality: 4.8
        },
        industryBenchmarks: [
          { skill: 'System Design', userScore: 75, industryAverage: 65, topPercentile: 90 },
          { skill: 'Algorithms', userScore: 82, industryAverage: 70, topPercentile: 95 },
          { skill: 'Communication', userScore: 70, industryAverage: 75, topPercentile: 88 },
          { skill: 'Leadership', userScore: 65, industryAverage: 60, topPercentile: 85 }
        ]
      }
      
      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <div className="h-4 w-4" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  if (isLoading || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <BarChart className="h-8 w-8 text-blue-600" />
            <span>Advanced Analytics</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into your learning journey and coaching effectiveness
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(analyticsData.performanceMetrics.averageScore)}`}>
                  {analyticsData.performanceMetrics.averageScore}%
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+{analyticsData.performanceMetrics.improvementRate}%</span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.performanceMetrics.sessionsCompleted}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {analyticsData.performanceMetrics.totalTimeSpent}h total time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Streak</p>
                <p className="text-2xl font-bold text-orange-600">
                  {analyticsData.performanceMetrics.streakDays}
                </p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-sm text-gray-500 mt-2">days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">EQ Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(analyticsData.emotionalIntelligence.overallEQ)}`}>
                  {analyticsData.emotionalIntelligence.overallEQ}%
                </p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Emotional Intelligence</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analyticsData.overallProgress.progressPercentage}%
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {analyticsData.overallProgress.estimatedCompletion} to target
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="skills" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="skills">Skills Progress</TabsTrigger>
          <TabsTrigger value="emotional">Emotional Intelligence</TabsTrigger>
          <TabsTrigger value="sessions">Session History</TabsTrigger>
          <TabsTrigger value="benchmarks">Industry Benchmarks</TabsTrigger>
        </TabsList>

        {/* Skills Progress Tab */}
        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Skill Development</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.skillBreakdown.map((skill) => (
                    <div key={skill.skill} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{skill.skill}</span>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(skill.trend)}
                          <span className="text-sm text-gray-600">
                            {skill.current}% / {skill.target}%
                          </span>
                        </div>
                      </div>
                      <Progress value={(skill.current / skill.target) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.sessionHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emotional Intelligence Tab */}
        <TabsContent value="emotional" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Emotional Intelligence Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { subject: 'Confidence', value: analyticsData.emotionalIntelligence.confidence },
                    { subject: 'Stress Mgmt', value: analyticsData.emotionalIntelligence.stressManagement },
                    { subject: 'Engagement', value: analyticsData.emotionalIntelligence.engagement },
                    { subject: 'Clarity', value: analyticsData.emotionalIntelligence.clarity }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="EQ Score" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coaching Effectiveness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">AI Coach Rating</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold">{analyticsData.coachingEffectiveness.aiCoachRating}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className={`h-4 w-4 ${
                              star <= analyticsData.coachingEffectiveness.aiCoachRating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          >
                            ⭐
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Human Coach Rating</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold">{analyticsData.coachingEffectiveness.humanCoachRating}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className={`h-4 w-4 ${
                              star <= analyticsData.coachingEffectiveness.humanCoachRating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          >
                            ⭐
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Preferred Coach Type</span>
                    <Badge variant="outline" className="capitalize">
                      {analyticsData.coachingEffectiveness.preferredCoachType}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Session History Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.sessionHistory.map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{session.type}</span>
                        <span className="text-xs text-gray-500">{session.date}</span>
                      </div>
                      <Badge variant="outline">{session.duration}min</Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`text-lg font-bold ${getScoreColor(session.score)}`}>
                        {session.score}%
                      </span>
                      <div className="text-xs text-gray-500">
                        {session.improvements.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Industry Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Industry Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.industryBenchmarks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skill" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="userScore" fill="#3B82F6" name="Your Score" />
                  <Bar dataKey="industryAverage" fill="#10B981" name="Industry Average" />
                  <Bar dataKey="topPercentile" fill="#F59E0B" name="Top 10%" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
