'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AIInsight, TrendData } from '@/services/analyticsService'
import {
  Brain,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  Clock,
  Star,
  ArrowRight,
  Filter,
  RefreshCw
} from 'lucide-react'

interface InsightsPanelProps {
  insights: AIInsight[]
  trends: TrendData
}

export function InsightsPanel({ insights, trends }: InsightsPanelProps) {
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedImpact, setSelectedImpact] = useState<string>('all')

  const insightTypes = [
    { id: 'all', name: 'All Insights', count: insights.length },
    { id: 'performance', name: 'Performance', count: insights.filter(i => i.type === 'performance').length },
    { id: 'trend', name: 'Trends', count: insights.filter(i => i.type === 'trend').length },
    { id: 'recommendation', name: 'Recommendations', count: insights.filter(i => i.type === 'recommendation').length },
    { id: 'achievement', name: 'Achievements', count: insights.filter(i => i.type === 'achievement').length },
    { id: 'warning', name: 'Warnings', count: insights.filter(i => i.type === 'warning').length }
  ]

  const filteredInsights = insights.filter(insight => {
    const typeMatch = selectedType === 'all' || insight.type === selectedType
    const impactMatch = selectedImpact === 'all' || insight.impact === selectedImpact
    return typeMatch && impactMatch
  })

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <TrendingUp className="h-5 w-5 text-blue-600" />
      case 'trend':
        return <TrendingUp className="h-5 w-5 text-purple-600" />
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-yellow-600" />
      case 'achievement':
        return <Award className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Brain className="h-5 w-5 text-gray-600" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'border-red-500 bg-red-50 text-red-700'
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 text-yellow-700'
      case 'low':
        return 'border-green-500 bg-green-50 text-green-700'
      default:
        return 'border-gray-500 bg-gray-50 text-gray-700'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-6 w-6 text-green-600" />
      case 'declining':
        return <TrendingDown className="h-6 w-6 text-red-600" />
      default:
        return <TrendingUp className="h-6 w-6 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Trend Overview */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <span>AI Performance Analysis</span>
          </CardTitle>
          <CardDescription>
            Intelligent insights based on your interview performance patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {getTrendIcon(trends.performanceTrend)}
              </div>
              <div className="text-lg font-bold text-blue-900">
                {trends.performanceTrend.charAt(0).toUpperCase() + trends.performanceTrend.slice(1)}
              </div>
              <div className="text-sm text-blue-700">
                {trends.trendPercentage > 0 ? '+' : ''}{trends.trendPercentage}% trend
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-lg font-bold text-blue-900">
                {trends.bestCategory}
              </div>
              <div className="text-sm text-blue-700">Strongest Category</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-lg font-bold text-blue-900">
                {trends.weakestCategory}
              </div>
              <div className="text-sm text-blue-700">Focus Area</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-lg font-bold text-blue-900">
                {trends.peakPerformanceTime}
              </div>
              <div className="text-sm text-blue-700">Peak Performance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Type:</span>
                <div className="flex space-x-1">
                  {insightTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant={selectedType === type.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType(type.id)}
                      className="flex items-center space-x-1"
                    >
                      <span>{type.name}</span>
                      {type.count > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {type.count}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Impact:</span>
              <select
                value={selectedImpact}
                onChange={(e) => setSelectedImpact(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Impact Levels</option>
                <option value="high">High Impact</option>
                <option value="medium">Medium Impact</option>
                <option value="low">Low Impact</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Found</h3>
              <p className="text-gray-500 mb-4">
                No insights match your current filters. Try adjusting the filters or check back later.
              </p>
              <Button variant="outline" onClick={() => {
                setSelectedType('all')
                setSelectedImpact('all')
              }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredInsights.map((insight) => (
            <Card key={insight.id} className={`border-l-4 ${getImpactColor(insight.impact).split(' ')[0]}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getInsightIcon(insight.type)}
                    <div>
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="capitalize">
                          {insight.type}
                        </Badge>
                        <Badge className={getImpactColor(insight.impact)}>
                          {insight.impact} impact
                        </Badge>
                        <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {insight.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{insight.description}</p>
                
                {insight.actionable && insight.actions && insight.actions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      <span>Recommended Actions:</span>
                    </h4>
                    <div className="space-y-2">
                      {insight.actions.map((action, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span className="text-sm text-gray-700">{action}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm">
                        Take Action
                      </Button>
                      <Button size="sm" variant="outline">
                        Learn More
                      </Button>
                    </div>
                  </div>
                )}
                
                {!insight.actionable && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      This insight is informational and doesn't require immediate action.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Trend Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <span>AI Recommendations</span>
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your performance trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trends.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">{recommendation}</p>
                </div>
                <Button size="sm" variant="outline">
                  Apply
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Consistency Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Consistency Analysis</span>
          </CardTitle>
          <CardDescription>
            How consistent your performance has been over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Consistency Score</span>
              <div className="flex items-center space-x-2">
                <span className={`text-lg font-bold ${
                  trends.consistencyScore >= 80 ? 'text-green-600' : 
                  trends.consistencyScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {trends.consistencyScore}%
                </span>
                <Badge variant={trends.consistencyScore >= 80 ? 'default' : 'secondary'}>
                  {trends.consistencyScore >= 80 ? 'Excellent' : 
                   trends.consistencyScore >= 60 ? 'Good' : 'Needs Work'}
                </Badge>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${
                  trends.consistencyScore >= 80 ? 'bg-green-600' : 
                  trends.consistencyScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${trends.consistencyScore}%` }}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {trends.performanceTrend === 'improving' ? '↗️' : trends.performanceTrend === 'declining' ? '↘️' : '→'}
                </div>
                <div className="text-sm text-blue-700">Trend Direction</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{trends.bestCategory}</div>
                <div className="text-sm text-green-700">Best Category</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{trends.peakPerformanceTime}</div>
                <div className="text-sm text-orange-700">Peak Time</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
