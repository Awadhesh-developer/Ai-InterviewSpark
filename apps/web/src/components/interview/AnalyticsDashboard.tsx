'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  Brain,
  Eye,
  User,
  Mic,
  Activity,
  BarChart3,
  Zap,
  Clock
} from 'lucide-react'
import { useInterviewAnalytics, type UnifiedMetrics } from '@/hooks/useUnifiedAnalytics'

interface AnalyticsDashboardProps {
  className?: string
  showDetailedBreakdown?: boolean
  showPerformanceMetrics?: boolean
}

interface ScoreCardProps {
  title: string
  score: number
  icon: React.ReactNode
  description: string
  trend?: number
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

interface MetricBreakdownProps {
  metrics: UnifiedMetrics
}

function ScoreCard({ title, score, icon, description, trend, color = 'blue' }: ScoreCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'green': return 'bg-green-50 border-green-200 text-green-800'
      case 'yellow': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'red': return 'bg-red-50 border-red-200 text-red-800'
      case 'purple': return 'bg-purple-50 border-purple-200 text-purple-800'
      default: return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getScoreColor = () => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className={`${getColorClasses()} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
          </div>
          {trend !== undefined && (
            <div className="flex items-center space-x-1">
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : trend < 0 ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              {trend !== 0 && (
                <span className={`text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(trend * 100).toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className={`text-2xl font-bold ${getScoreColor()}`}>
          {Math.round(score * 100)}%
        </div>
        
        <Progress value={score * 100} className="mt-2 mb-2" />
        
        <p className="text-xs opacity-80">{description}</p>
      </CardContent>
    </Card>
  )
}

function MetricBreakdown({ metrics }: MetricBreakdownProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Voice Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Mic className="h-4 w-4" />
            <span>Voice Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Clarity</span>
            <span>{Math.round(metrics.voice.clarity * 100)}%</span>
          </div>
          <Progress value={metrics.voice.clarity * 100} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>Confidence</span>
            <span>{Math.round(metrics.voice.confidence * 100)}%</span>
          </div>
          <Progress value={metrics.voice.confidence * 100} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>Engagement</span>
            <span>{Math.round(metrics.voice.engagement * 100)}%</span>
          </div>
          <Progress value={metrics.voice.engagement * 100} className="h-1" />
        </CardContent>
      </Card>

      {/* Facial Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Facial Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Eye Contact</span>
            <span>{Math.round(metrics.facial.eyeContactQuality * 100)}%</span>
          </div>
          <Progress value={metrics.facial.eyeContactQuality * 100} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>Expressiveness</span>
            <span>{Math.round(metrics.facial.expressiveness * 100)}%</span>
          </div>
          <Progress value={metrics.facial.expressiveness * 100} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>Engagement</span>
            <span>{Math.round(metrics.facial.facialEngagement * 100)}%</span>
          </div>
          <Progress value={metrics.facial.facialEngagement * 100} className="h-1" />
        </CardContent>
      </Card>

      {/* Gaze Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Gaze Tracking</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Attention Focus</span>
            <span>{Math.round(metrics.gaze.attentionFocus * 100)}%</span>
          </div>
          <Progress value={metrics.gaze.attentionFocus * 100} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>Gaze Stability</span>
            <span>{Math.round(metrics.gaze.gazeStability * 100)}%</span>
          </div>
          <Progress value={metrics.gaze.gazeStability * 100} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>Screen Engagement</span>
            <span>{Math.round(metrics.gaze.screenEngagement * 100)}%</span>
          </div>
          <Progress value={metrics.gaze.screenEngagement * 100} className="h-1" />
        </CardContent>
      </Card>

      {/* Body Language Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Body Language</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Posture Quality</span>
            <span>{Math.round(metrics.bodyLanguage.postureQuality * 100)}%</span>
          </div>
          <Progress value={metrics.bodyLanguage.postureQuality * 100} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>Gesture Effectiveness</span>
            <span>{Math.round(metrics.bodyLanguage.gestureEffectiveness * 100)}%</span>
          </div>
          <Progress value={metrics.bodyLanguage.gestureEffectiveness * 100} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>Professional Demeanor</span>
            <span>{Math.round(metrics.bodyLanguage.professionalDemeanor * 100)}%</span>
          </div>
          <Progress value={metrics.bodyLanguage.professionalDemeanor * 100} className="h-1" />
        </CardContent>
      </Card>
    </div>
  )
}

export function AnalyticsDashboard({ 
  className = '',
  showDetailedBreakdown = true,
  showPerformanceMetrics = false
}: AnalyticsDashboardProps) {
  const analytics = useInterviewAnalytics()

  if (!analytics.isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading analytics dashboard...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (analytics.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{analytics.error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Overall Interview Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-primary mb-2">
              {Math.round(analytics.overallScore * 100)}%
            </div>
            <p className="text-muted-foreground">{analytics.assessment}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ScoreCard
              title="Engagement"
              score={analytics.engagementLevel}
              icon={<TrendingUp className="h-4 w-4" />}
              description="Overall engagement level"
              color="green"
            />
            
            <ScoreCard
              title="Professional Presence"
              score={analytics.professionalPresence}
              icon={<Target className="h-4 w-4" />}
              description="Professional demeanor"
              color="blue"
            />
            
            <ScoreCard
              title="Communication"
              score={analytics.communicationEffectiveness}
              icon={<Mic className="h-4 w-4" />}
              description="Communication effectiveness"
              color="purple"
            />
            
            <ScoreCard
              title="Confidence"
              score={analytics.confidenceLevel}
              icon={<Zap className="h-4 w-4" />}
              description="Confidence level"
              color="yellow"
            />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      {showDetailedBreakdown && analytics.currentMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Detailed Analysis Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MetricBreakdown metrics={analytics.currentMetrics} />
          </CardContent>
        </Card>
      )}

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Strengths</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.strengths.length > 0 ? (
              <ul className="space-y-2">
                {analytics.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Continue the interview to identify your strengths.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              <span>Areas for Improvement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.improvements.length > 0 ? (
              <ul className="space-y-2">
                {analytics.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{improvement}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Great job! No major areas for improvement identified.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recommendations.length > 0 ? (
            <ul className="space-y-3">
              {analytics.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-sm text-blue-800">{recommendation}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Recommendations will appear as the interview progresses.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {showPerformanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-lg">
                  {analytics.processingTime.toFixed(1)}ms
                </div>
                <div className="text-muted-foreground">Processing Time</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-lg">
                  {analytics.memoryUsage.toFixed(1)}MB
                </div>
                <div className="text-muted-foreground">Memory Usage</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-lg">
                  {Math.round(analytics.systemHealthScore * 100)}%
                </div>
                <div className="text-muted-foreground">System Health</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-lg">
                  {analytics.systemHealth.analysisHistory}
                </div>
                <div className="text-muted-foreground">Analysis Count</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AnalyticsDashboard
