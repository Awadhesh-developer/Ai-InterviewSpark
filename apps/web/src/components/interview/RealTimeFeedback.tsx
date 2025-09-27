'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Volume2,
  Eye,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Zap,
  Heart,
  Brain,
  Mic,
  Video,
  MessageSquare
} from 'lucide-react'

export interface RealTimeFeedbackData {
  confidence: number
  clarity: number
  pace: number
  eyeContact: number
  posture: number
  fillerWords: number
  engagement: number
  timestamp: number
}

export interface FeedbackAlert {
  id: string
  type: 'warning' | 'tip' | 'success' | 'critical'
  category: 'voice' | 'body' | 'content' | 'timing'
  message: string
  action?: string
  priority: 'low' | 'medium' | 'high'
  timestamp: number
}

interface RealTimeFeedbackProps {
  isActive: boolean
  currentData: RealTimeFeedbackData
  alerts: FeedbackAlert[]
  onDismissAlert: (alertId: string) => void
  showDetailedMetrics?: boolean
}

export default function RealTimeFeedback({
  isActive,
  currentData,
  alerts,
  onDismissAlert,
  showDetailedMetrics = true
}: RealTimeFeedbackProps) {
  const [historicalData, setHistoricalData] = useState<RealTimeFeedbackData[]>([])
  const [activeAlerts, setActiveAlerts] = useState<FeedbackAlert[]>([])

  useEffect(() => {
    if (isActive) {
      setHistoricalData(prev => [...prev.slice(-20), currentData])
    }
  }, [currentData, isActive])

  useEffect(() => {
    setActiveAlerts(alerts.filter(alert => 
      Date.now() - alert.timestamp < 10000 // Show alerts for 10 seconds
    ))
  }, [alerts])

  const getMetricTrend = (metric: keyof RealTimeFeedbackData) => {
    if (historicalData.length < 2) return 'stable'
    const recent = historicalData.slice(-3)
    const current = recent[recent.length - 1][metric] as number
    const previous = recent[0][metric] as number
    
    if (current > previous + 5) return 'improving'
    if (current < previous - 5) return 'declining'
    return 'stable'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const criticalAlerts = activeAlerts.filter(alert => alert.priority === 'high')
  const regularAlerts = activeAlerts.filter(alert => alert.priority !== 'high')

  if (!isActive) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Real-time feedback will appear when interview starts</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              {criticalAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between">
                  <span>{alert.message}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismissAlert(alert.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Metrics Dashboard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Live Performance Metrics</span>
            <Badge variant="secondary" className="ml-auto">
              {isActive ? 'LIVE' : 'PAUSED'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Confidence */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Confidence</span>
                </div>
                {getTrendIcon(getMetricTrend('confidence'))}
              </div>
              <div className="space-y-1">
                <div className={`text-2xl font-bold ${getScoreColor(currentData.confidence)}`}>
                  {Math.round(currentData.confidence)}%
                </div>
                <Progress 
                  value={currentData.confidence} 
                  className="h-2"
                />
              </div>
            </div>

            {/* Clarity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Volume2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Clarity</span>
                </div>
                {getTrendIcon(getMetricTrend('clarity'))}
              </div>
              <div className="space-y-1">
                <div className={`text-2xl font-bold ${getScoreColor(currentData.clarity)}`}>
                  {Math.round(currentData.clarity)}%
                </div>
                <Progress 
                  value={currentData.clarity} 
                  className="h-2"
                />
              </div>
            </div>

            {/* Eye Contact */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Eye Contact</span>
                </div>
                {getTrendIcon(getMetricTrend('eyeContact'))}
              </div>
              <div className="space-y-1">
                <div className={`text-2xl font-bold ${getScoreColor(currentData.eyeContact)}`}>
                  {Math.round(currentData.eyeContact)}%
                </div>
                <Progress 
                  value={currentData.eyeContact} 
                  className="h-2"
                />
              </div>
            </div>

            {/* Speaking Pace */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Pace</span>
                </div>
                {getTrendIcon(getMetricTrend('pace'))}
              </div>
              <div className="space-y-1">
                <div className={`text-2xl font-bold ${getScoreColor(currentData.pace)}`}>
                  {Math.round(currentData.pace)}%
                </div>
                <Progress 
                  value={currentData.pace} 
                  className="h-2"
                />
              </div>
            </div>
          </div>

          {showDetailedMetrics && (
            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Posture Score</span>
                  <span className={`font-medium ${getScoreColor(currentData.posture)}`}>
                    {Math.round(currentData.posture)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Engagement</span>
                  <span className={`font-medium ${getScoreColor(currentData.engagement)}`}>
                    {Math.round(currentData.engagement)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Filler Words</span>
                  <span className={`font-medium ${currentData.fillerWords > 5 ? 'text-red-600' : 'text-green-600'}`}>
                    {currentData.fillerWords}/min
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips and Suggestions */}
      {regularAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <span>Live Coaching Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {regularAlerts.map(alert => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {alert.type === 'tip' && <Lightbulb className="h-4 w-4 text-yellow-500" />}
                    {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{alert.message}</p>
                    {alert.action && (
                      <p className="text-xs text-muted-foreground mt-1">{alert.action}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismissAlert(alert.id)}
                    className="flex-shrink-0"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
