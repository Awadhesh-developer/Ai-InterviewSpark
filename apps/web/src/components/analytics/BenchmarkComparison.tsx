'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ComparisonData, CategoryScore } from '@/services/analyticsService'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts'
import {
  Users,
  Trophy,
  TrendingUp,
  Target,
  Award,
  Star,
  CheckCircle,
  AlertCircle,
  Zap,
  BarChart3
} from 'lucide-react'

interface BenchmarkComparisonProps {
  userScore: number
  comparisons: ComparisonData
  categoryBreakdown: CategoryScore[]
}

export function BenchmarkComparison({ userScore, comparisons, categoryBreakdown }: BenchmarkComparisonProps) {
  // Prepare data for charts
  const benchmarkData = [
    { name: 'Your Score', value: userScore, color: '#3b82f6' },
    { name: 'Industry Average', value: comparisons.industryBenchmark, color: '#94a3b8' },
    { name: 'Top 10%', value: comparisons.topPercentile, color: '#10b981' }
  ]

  const categoryComparisonData = categoryBreakdown.map(category => ({
    category: category.category,
    yourScore: category.current,
    industryAvg: comparisons.industryBenchmark,
    ranking: comparisons.ranking.category[category.category.toLowerCase()] || 50
  }))

  const percentileData = [
    { percentile: '10th', score: 45 },
    { percentile: '25th', score: 60 },
    { percentile: '50th', score: comparisons.industryBenchmark },
    { percentile: '75th', score: 85 },
    { percentile: '90th', score: comparisons.topPercentile },
    { percentile: 'You', score: userScore }
  ]

  const getPerformanceLevel = (score: number, benchmark: number) => {
    const difference = score - benchmark
    if (difference >= 15) return { level: 'Exceptional', color: 'text-green-600', bg: 'bg-green-50' }
    if (difference >= 5) return { level: 'Above Average', color: 'text-blue-600', bg: 'bg-blue-50' }
    if (difference >= -5) return { level: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { level: 'Below Average', color: 'text-red-600', bg: 'bg-red-50' }
  }

  const performanceLevel = getPerformanceLevel(userScore, comparisons.industryBenchmark)

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return 'text-green-600'
    if (percentile >= 75) return 'text-blue-600'
    if (percentile >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Overall Comparison */}
      <Card className={`border-2 ${performanceLevel.bg} ${performanceLevel.color.replace('text-', 'border-')}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <span>Industry Benchmark Comparison</span>
          </CardTitle>
          <CardDescription>
            How you compare against industry standards and top performers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${performanceLevel.color}`}>
                {userScore}%
              </div>
              <div className="text-sm text-gray-600">Your Score</div>
              <Badge className={`mt-2 ${performanceLevel.bg} ${performanceLevel.color}`}>
                {performanceLevel.level}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {comparisons.industryBenchmark}%
              </div>
              <div className="text-sm text-gray-600">Industry Average</div>
              <div className={`text-sm mt-2 ${comparisons.peerComparison >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {comparisons.peerComparison >= 0 ? '+' : ''}{comparisons.peerComparison} points
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {comparisons.topPercentile}%
              </div>
              <div className="text-sm text-gray-600">Top 10%</div>
              <div className="text-sm text-gray-500 mt-2">
                {comparisons.topPercentile - userScore} points to reach
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold ${getPercentileColor(comparisons.ranking.overall)}`}>
                {comparisons.ranking.overall}%
              </div>
              <div className="text-sm text-gray-600">Your Percentile</div>
              <div className="text-sm text-gray-500 mt-2">
                Top {100 - comparisons.ranking.overall}% of candidates
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Benchmark Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Performance Comparison</span>
            </CardTitle>
            <CardDescription>
              Your score vs industry benchmarks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarkData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Score']} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Rankings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span>Category Rankings</span>
            </CardTitle>
            <CardDescription>
              Your percentile ranking in each category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(comparisons.ranking.category).map(([category, ranking]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{category}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold ${getPercentileColor(ranking)}`}>
                      {ranking}%
                    </span>
                    <Badge variant={ranking >= 75 ? 'default' : 'secondary'}>
                      {ranking >= 90 ? 'Top 10%' : ranking >= 75 ? 'Top 25%' : ranking >= 50 ? 'Above Avg' : 'Below Avg'}
                    </Badge>
                  </div>
                </div>
                <Progress value={ranking} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Percentile Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span>Percentile Distribution</span>
          </CardTitle>
          <CardDescription>
            Where you stand among all candidates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={percentileData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="percentile" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Score']} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
                <ReferenceLine y={userScore} stroke="#3b82f6" strokeDasharray="5 5" label="Your Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-orange-600" />
            <span>Competitive Analysis</span>
          </CardTitle>
          <CardDescription>
            Detailed analysis of your competitive position
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strengths */}
            <div className="space-y-3">
              <h4 className="font-medium text-green-600 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Strengths</span>
              </h4>
              <div className="space-y-2">
                {comparisons.competitiveAnalysis.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                    <Star className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm text-green-800">{strength}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gaps */}
            <div className="space-y-3">
              <h4 className="font-medium text-red-600 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span>Areas for Improvement</span>
              </h4>
              <div className="space-y-2">
                {comparisons.competitiveAnalysis.gaps.map((gap, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span className="text-sm text-red-800">{gap}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities */}
            <div className="space-y-3">
              <h4 className="font-medium text-blue-600 flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Opportunities</span>
              </h4>
              <div className="space-y-2">
                {comparisons.competitiveAnalysis.opportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                    <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span className="text-sm text-blue-800">{opportunity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Improvement Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Improvement Roadmap</span>
          </CardTitle>
          <CardDescription>
            Strategic steps to reach the next performance level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current to Next Level */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Reach Top 25% (85+ score)</h4>
                <Badge variant={userScore >= 85 ? 'default' : 'secondary'}>
                  {userScore >= 85 ? 'Achieved' : `${85 - userScore} points needed`}
                </Badge>
              </div>
              <Progress value={Math.min((userScore / 85) * 100, 100)} className="h-2" />
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Reach Top 10% (90+ score)</h4>
                <Badge variant={userScore >= 90 ? 'default' : 'secondary'}>
                  {userScore >= 90 ? 'Achieved' : `${90 - userScore} points needed`}
                </Badge>
              </div>
              <Progress value={Math.min((userScore / 90) * 100, 100)} className="h-2" />
            </div>

            {/* Action Items */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">Recommended Actions:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900">Short Term (1-2 weeks)</h5>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Focus on weakest category practice</li>
                    <li>• Complete 5 mock interviews</li>
                    <li>• Review top performer strategies</li>
                  </ul>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h5 className="font-medium text-green-900">Long Term (1-2 months)</h5>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• Develop industry expertise</li>
                    <li>• Build portfolio of examples</li>
                    <li>• Network with industry professionals</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
