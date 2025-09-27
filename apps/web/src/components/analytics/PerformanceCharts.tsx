'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PerformanceData } from '@/services/analyticsService'
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
  ComposedChart,
  ScatterChart,
  Scatter,
  ReferenceLine
} from 'recharts'
import {
  TrendingUp,
  BarChart3,
  Activity,
  Clock,
  Target,
  Zap,
  Calendar,
  Filter
} from 'lucide-react'

interface PerformanceChartsProps {
  data: PerformanceData
  timeRange: string
}

export function PerformanceCharts({ data, timeRange }: PerformanceChartsProps) {
  const [selectedChart, setSelectedChart] = useState<'trend' | 'category' | 'activity' | 'correlation'>('trend')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Filter data based on selected category
  const filteredScoreHistory = selectedCategory === 'all' 
    ? data.scoreHistory 
    : data.scoreHistory.filter(point => point.category === selectedCategory)

  // Prepare correlation data (score vs time spent)
  const correlationData = data.weeklyActivity.map(activity => ({
    timeSpent: activity.timeSpent,
    score: activity.score,
    sessions: activity.sessions,
    date: activity.date
  }))

  // Prepare monthly comparison data
  const monthlyData = data.monthlyTrends.map(trend => ({
    ...trend,
    difference: trend.value - trend.benchmark
  }))

  const categories = ['all', ...Array.from(new Set(data.scoreHistory.map(point => point.category)))]

  const chartTypes = [
    { id: 'trend', name: 'Score Trend', icon: TrendingUp },
    { id: 'category', name: 'Category Analysis', icon: BarChart3 },
    { id: 'activity', name: 'Activity Pattern', icon: Activity },
    { id: 'correlation', name: 'Performance Correlation', icon: Target }
  ]

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 Days'
      case '30d': return 'Last 30 Days'
      case '90d': return 'Last 3 Months'
      case '1y': return 'Last Year'
      default: return 'Last 30 Days'
    }
  }

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Chart Type:</span>
              <div className="flex space-x-1">
                {chartTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.id}
                      variant={selectedChart === type.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedChart(type.id as any)}
                      className="flex items-center space-x-1"
                    >
                      <Icon className="h-3 w-3" />
                      <span>{type.name}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Chart Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {selectedChart === 'trend' && <TrendingUp className="h-5 w-5 text-blue-600" />}
            {selectedChart === 'category' && <BarChart3 className="h-5 w-5 text-green-600" />}
            {selectedChart === 'activity' && <Activity className="h-5 w-5 text-purple-600" />}
            {selectedChart === 'correlation' && <Target className="h-5 w-5 text-orange-600" />}
            <span>
              {chartTypes.find(type => type.id === selectedChart)?.name} - {getTimeRangeLabel(timeRange)}
            </span>
          </CardTitle>
          <CardDescription>
            {selectedChart === 'trend' && 'Track your interview performance over time'}
            {selectedChart === 'category' && 'Compare performance across different interview categories'}
            {selectedChart === 'activity' && 'Analyze your practice patterns and activity levels'}
            {selectedChart === 'correlation' && 'Understand the relationship between practice time and performance'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              {selectedChart === 'trend' ? (
                <LineChart data={filteredScoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [`${value}%`, 'Score']}
                  />
                  <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 5" label="Target" />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : selectedChart === 'category' ? (
                <BarChart data={data.categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Score']} />
                  <Bar dataKey="current" fill="#3b82f6" name="Current" />
                  <Bar dataKey="previous" fill="#94a3b8" name="Previous" />
                </BarChart>
              ) : selectedChart === 'activity' ? (
                <ComposedChart data={data.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'sessions') return [`${value}`, 'Sessions']
                      if (name === 'score') return [`${value}%`, 'Avg Score']
                      return [`${value}min`, 'Time Spent']
                    }}
                  />
                  <Bar yAxisId="left" dataKey="sessions" fill="#3b82f6" name="Sessions" />
                  <Line yAxisId="right" type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} name="Avg Score" />
                </ComposedChart>
              ) : (
                <ScatterChart data={correlationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeSpent" name="Time Spent" unit="min" />
                  <YAxis dataKey="score" name="Score" unit="%" domain={[0, 100]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'score') return [`${value}%`, 'Score']
                      return [`${value}min`, 'Time Spent']
                    }}
                  />
                  <Scatter dataKey="score" fill="#3b82f6" />
                </ScatterChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Additional Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Types Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <span>Session Type Performance</span>
            </CardTitle>
            <CardDescription>
              Average scores by interview type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sessionTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Avg Score']} />
                  <Bar dataKey="averageScore" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {data.sessionTypes.map((type, index) => (
                <div key={type.type} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{type.type}</span>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <span>{type.count} sessions</span>
                    <span>{type.averageScore}% avg</span>
                    <Badge variant={type.improvement > 0 ? "default" : "secondary"}>
                      {type.improvement > 0 ? '+' : ''}{type.improvement}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends vs Benchmark */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span>Monthly Progress</span>
            </CardTitle>
            <CardDescription>
              Your progress compared to industry benchmarks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis domain={[60, 100]} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'value') return [`${value}%`, 'Your Score']
                      return [`${value}%`, 'Benchmark']
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Your Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Industry Benchmark"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Latest Performance</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {monthlyData[monthlyData.length - 1]?.value}%
                  </span>
                  <Badge variant={monthlyData[monthlyData.length - 1]?.difference > 0 ? "default" : "secondary"}>
                    {monthlyData[monthlyData.length - 1]?.difference > 0 ? '+' : ''}
                    {monthlyData[monthlyData.length - 1]?.difference}% vs benchmark
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            <span>Chart Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Trend Analysis</h4>
              <p className="text-sm text-blue-700">
                {data.scoreHistory.length > 0 && 
                  data.scoreHistory[data.scoreHistory.length - 1].score > data.scoreHistory[0].score
                  ? 'Your performance shows an upward trend over time'
                  : 'Focus on consistency to improve your overall trend'
                }
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Best Performance</h4>
              <p className="text-sm text-green-700">
                Your highest scoring category is {data.categoryBreakdown.reduce((max, cat) => 
                  cat.current > max.current ? cat : max
                ).category.toLowerCase()}
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">Improvement Opportunity</h4>
              <p className="text-sm text-orange-700">
                Focus on {data.categoryBreakdown.reduce((min, cat) => 
                  cat.current < min.current ? cat : min
                ).category.toLowerCase()} for the biggest impact
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
