'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AnalyticsData } from '@/services/analyticsService'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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
  Target,
  Clock,
  Award,
  Users,
  Calendar,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react'

interface PerformanceOverviewProps {
  data: AnalyticsData
}

export function PerformanceOverview({ data }: PerformanceOverviewProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981' // green
    if (score >= 70) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up' || change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (trend === 'down' || change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return <TrendingUp className="h-4 w-4 text-gray-600" />
  }

  // Prepare data for charts
  const recentScores = data.performance.scoreHistory.slice(-7)
  const categoryData = data.performance.categoryBreakdown.map(cat => ({
    category: cat.category,
    score: cat.current,
    previous: cat.previous,
    change: cat.change
  }))

  const sessionTypeData = data.performance.sessionTypes.map(type => ({
    name: type.type,
    sessions: type.count,
    score: type.averageScore,
    time: type.totalTime
  }))

  const skillRadarData = data.performance.skillProgress.map(skill => ({
    skill: skill.skill,
    current: skill.progress,
    target: skill.target
  }))

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-6">
      {/* Performance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Performance Trend</span>
          </CardTitle>
          <CardDescription>
            Your interview scores over the last 7 sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentScores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [`${value}%`, 'Score']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span>Category Performance</span>
            </CardTitle>
            <CardDescription>
              Performance breakdown by interview category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.performance.categoryBreakdown.map((category, index) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{category.category}</span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(category.trend, category.change)}
                    <span className={`font-bold ${
                      category.current >= 80 ? 'text-green-600' : 
                      category.current >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {category.current}%
                    </span>
                  </div>
                </div>
                <Progress value={category.current} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Previous: {category.previous}%</span>
                  <span className={category.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {category.change >= 0 ? '+' : ''}{category.change}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Session Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span>Session Types</span>
            </CardTitle>
            <CardDescription>
              Distribution of your practice sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sessionTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="sessions"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sessionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}`, 'Sessions']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {sessionTypeData.map((type, index) => (
                <div key={type.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{type.name}</span>
                  </div>
                  <div className="flex space-x-4 text-gray-600">
                    <span>{type.sessions} sessions</span>
                    <span>{type.score}% avg</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <span>Skills Assessment</span>
            </CardTitle>
            <CardDescription>
              Current progress vs target for key skills
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Current"
                    dataKey="current"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Target"
                    dataKey="target"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.1}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <span>Weekly Activity</span>
            </CardTitle>
            <CardDescription>
              Your practice activity throughout the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.performance.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'sessions') return [`${value}`, 'Sessions']
                      if (name === 'score') return [`${value}%`, 'Avg Score']
                      return [`${value}min`, 'Time Spent']
                    }}
                  />
                  <Bar dataKey="sessions" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill Progress Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-orange-600" />
            <span>Skill Development</span>
          </CardTitle>
          <CardDescription>
            Detailed progress on individual skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.performance.skillProgress.map((skill, index) => (
              <div key={skill.skill} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{skill.skill}</h4>
                  <Badge variant="outline">Level {skill.level}</Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{skill.progress}% / {skill.target}%</span>
                  </div>
                  <Progress value={(skill.progress / skill.target) * 100} className="h-2" />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{skill.sessions} sessions</span>
                  <span>Last: {skill.lastPracticed.toLocaleDateString()}</span>
                </div>
                
                <div className="text-center">
                  <div className={`text-lg font-bold ${getScoreColor(skill.progress) === '#10b981' ? 'text-green-600' : getScoreColor(skill.progress) === '#f59e0b' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {skill.progress}%
                  </div>
                  <div className="text-xs text-gray-500">Current Level</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Performance Summary</span>
          </CardTitle>
          <CardDescription>
            Key insights from your recent performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.trends.consistencyScore}%
              </div>
              <div className="text-sm text-gray-600">Consistency Score</div>
              <div className="text-xs text-gray-500 mt-1">
                How consistent your performance has been
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.trends.bestCategory}
              </div>
              <div className="text-sm text-gray-600">Strongest Area</div>
              <div className="text-xs text-gray-500 mt-1">
                Your best performing category
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {data.trends.weakestCategory}
              </div>
              <div className="text-sm text-gray-600">Focus Area</div>
              <div className="text-xs text-gray-500 mt-1">
                Area needing improvement
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {data.trends.peakPerformanceTime}
              </div>
              <div className="text-sm text-gray-600">Peak Time</div>
              <div className="text-xs text-gray-500 mt-1">
                When you perform best
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
