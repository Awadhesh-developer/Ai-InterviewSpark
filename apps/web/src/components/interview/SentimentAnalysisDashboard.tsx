'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Heart, 
  Brain, 
  Mic, 
  Eye, 
  User,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Zap,
  Volume2,
  MessageSquare,
  Target,
  Shield,
  Lightbulb,
  BarChart3
} from 'lucide-react'
import { 
  useRealTimeSentimentMonitoring,
  useSentimentCoaching
} from '@/hooks/useMultiModalSentiment'

interface SentimentAnalysisDashboardProps {
  className?: string
  showCoaching?: boolean
  showModalityBreakdown?: boolean
  showRealTimeInsights?: boolean
  showEmotionalTrend?: boolean
}

interface SentimentGaugeProps {
  value: number
  label: string
  icon: React.ReactNode
  color?: string
}

interface ModalityCardProps {
  title: string
  sentiment: number
  confidence: number
  icon: React.ReactNode
  details?: string[]
}

interface EmotionalTrendProps {
  trend: string
  history: number[]
}

function SentimentGauge({ value, label, icon, color = 'blue' }: SentimentGaugeProps) {
  const percentage = Math.round((value + 1) * 50) // Convert -1 to 1 range to 0-100%
  
  const getColorClass = () => {
    if (value > 0.4) return 'text-green-600 bg-green-50 border-green-200'
    if (value > -0.2) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (value > -0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getSentimentLabel = () => {
    if (value > 0.6) return 'Very Positive'
    if (value > 0.2) return 'Positive'
    if (value > -0.2) return 'Neutral'
    if (value > -0.6) return 'Negative'
    return 'Very Negative'
  }

  return (
    <Card className={`${getColorClass()} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="font-medium text-sm">{label}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {getSentimentLabel()}
          </Badge>
        </div>
        
        <div className="text-2xl font-bold mb-2">
          {percentage}%
        </div>
        
        <Progress value={percentage} className="mb-2" />
        
        <div className="text-xs text-muted-foreground">
          Raw Score: {value.toFixed(2)}
        </div>
      </CardContent>
    </Card>
  )
}

function ModalityCard({ title, sentiment, confidence, icon, details }: ModalityCardProps) {
  const getModalityColor = () => {
    if (sentiment > 0.3) return 'border-green-200 bg-green-50'
    if (sentiment > -0.3) return 'border-blue-200 bg-blue-50'
    return 'border-orange-200 bg-orange-50'
  }

  return (
    <Card className={`${getModalityColor()} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {Math.round(confidence * 100)}% conf.
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Sentiment:</span>
            <span className="font-medium">{sentiment.toFixed(2)}</span>
          </div>
          
          <Progress value={(sentiment + 1) * 50} className="h-2" />
          
          {details && details.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">Details:</div>
              {details.slice(0, 2).map((detail, index) => (
                <div key={index} className="text-xs bg-white/50 rounded px-2 py-1 mb-1">
                  {detail}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EmotionalTrend({ trend, history }: EmotionalTrendProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'fluctuating': return <Activity className="h-4 w-4 text-yellow-500" />
      default: return <BarChart3 className="h-4 w-4 text-blue-500" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-50'
      case 'declining': return 'text-red-600 bg-red-50'
      case 'fluctuating': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  return (
    <div className={`p-3 rounded-lg ${getTrendColor()}`}>
      <div className="flex items-center space-x-2 mb-2">
        {getTrendIcon()}
        <span className="font-medium capitalize">{trend}</span>
      </div>
      
      <div className="text-sm">
        Recent sentiment pattern shows {trend} emotional state
      </div>
      
      {history.length > 0 && (
        <div className="mt-2 flex space-x-1">
          {history.slice(-10).map((value, index) => (
            <div
              key={index}
              className="w-2 bg-current opacity-60 rounded-sm"
              style={{ height: `${Math.max(4, Math.abs(value) * 20)}px` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function SentimentAnalysisDashboard({
  className = '',
  showCoaching = true,
  showModalityBreakdown = true,
  showRealTimeInsights = true,
  showEmotionalTrend = true
}: SentimentAnalysisDashboardProps) {
  const sentiment = useRealTimeSentimentMonitoring()
  const coaching = useSentimentCoaching()

  if (!sentiment.isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Heart className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading sentiment analysis...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sentiment.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{sentiment.error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const overallAssessment = sentiment.getOverallAssessment()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Sentiment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>Multi-Modal Sentiment Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overallAssessment ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {sentiment.getSentimentLabel()}
                </div>
                <p className="text-lg text-muted-foreground mb-4">
                  Overall Assessment: {overallAssessment.assessment}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(overallAssessment.sentiment * 50 + 50)}%
                    </div>
                    <div className="text-blue-800">Sentiment</div>
                  </div>
                  
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(overallAssessment.reliability * 100)}%
                    </div>
                    <div className="text-green-800">Reliability</div>
                  </div>
                  
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(overallAssessment.coherence * 100)}%
                    </div>
                    <div className="text-purple-800">Coherence</div>
                  </div>
                  
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(overallAssessment.confidence * 100)}%
                    </div>
                    <div className="text-orange-800">Confidence</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2 flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Current Emotional State</span>
                  </h4>
                  <p className="text-sm text-green-700">{sentiment.getEmotionalState()}</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center space-x-2">
                    <Brain className="h-4 w-4" />
                    <span>Primary Emotion</span>
                  </h4>
                  <p className="text-sm text-blue-700 capitalize">{sentiment.primaryEmotion}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No sentiment data available yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Continue the interview to generate sentiment analysis
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SentimentGauge
          value={sentiment.currentSentiment}
          label="Overall Sentiment"
          icon={<Heart className="h-4 w-4" />}
        />
        
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Stress Level</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {Math.round(sentiment.stressLevel * 100)}%
            </div>
            <Progress value={sentiment.stressLevel * 100} className="mb-2" />
            <div className="text-xs text-blue-700">
              {sentiment.stressLevel > 0.7 ? 'High stress detected' : 
               sentiment.stressLevel > 0.4 ? 'Moderate stress' : 'Low stress'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">Engagement</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {Math.round(sentiment.engagementLevel * 100)}%
            </div>
            <Progress value={sentiment.engagementLevel * 100} className="mb-2" />
            <div className="text-xs text-green-700">
              {sentiment.engagementLevel > 0.7 ? 'Highly engaged' : 
               sentiment.engagementLevel > 0.4 ? 'Moderately engaged' : 'Low engagement'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-sm">Confidence</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {Math.round(sentiment.confidenceLevel * 100)}%
            </div>
            <Progress value={sentiment.confidenceLevel * 100} className="mb-2" />
            <div className="text-xs text-purple-700">
              {sentiment.confidenceLevel > 0.7 ? 'Very confident' : 
               sentiment.confidenceLevel > 0.4 ? 'Moderately confident' : 'Low confidence'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modality Breakdown */}
      {showModalityBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Sentiment by Modality</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ModalityCard
                title="Text Analysis"
                sentiment={sentiment.textSentiment}
                confidence={0.8}
                icon={<MessageSquare className="h-4 w-4" />}
                details={['Word choice analysis', 'Emotional tone']}
              />
              
              <ModalityCard
                title="Voice Analysis"
                sentiment={sentiment.voiceSentiment}
                confidence={0.7}
                icon={<Volume2 className="h-4 w-4" />}
                details={['Tone analysis', 'Stress indicators']}
              />
              
              <ModalityCard
                title="Facial Expression"
                sentiment={sentiment.facialSentiment}
                confidence={0.75}
                icon={<Eye className="h-4 w-4" />}
                details={['Emotion detection', 'Micro-expressions']}
              />
              
              <ModalityCard
                title="Body Language"
                sentiment={sentiment.behavioralSentiment}
                confidence={0.7}
                icon={<User className="h-4 w-4" />}
                details={['Posture analysis', 'Gesture patterns']}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emotional Trend */}
      {showEmotionalTrend && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Emotional Trend Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EmotionalTrend 
                trend={sentiment.emotionalTrend} 
                history={sentiment.sentimentHistory.map(h => h.fusedSentiment.overallSentiment)} 
              />
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Trend Indicators</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${sentiment.isImproving ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-xs">Improving</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${sentiment.isDeclining ? 'bg-red-500' : 'bg-gray-300'}`} />
                    <span className="text-xs">Declining</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${sentiment.isFluctuating ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                    <span className="text-xs">Fluctuating</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${sentiment.isStable ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <span className="text-xs">Stable</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Quality Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Coherence:</span>
                    <span>{Math.round(sentiment.emotionalCoherence * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Reliability:</span>
                    <span>{Math.round(sentiment.sentimentReliability * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Professional Presence:</span>
                    <span>{Math.round(sentiment.professionalPresence * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Coaching */}
      {showCoaching && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Immediate Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-600">
                <Lightbulb className="h-5 w-5" />
                <span>Immediate Feedback</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coaching.getImmediateFeedback().length > 0 ? (
                <ul className="space-y-2">
                  {coaching.getImmediateFeedback().map((feedback, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feedback}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No immediate feedback needed - you're doing well!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Positive Reinforcement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Positive Reinforcement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coaching.getPositiveReinforcement().length > 0 ? (
                <ul className="space-y-2">
                  {coaching.getPositiveReinforcement().map((reinforcement, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{reinforcement}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Keep up the good work! Positive feedback will appear here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Adaptation Recommendations */}
      {showRealTimeInsights && sentiment.adaptationRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>AI Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sentiment.adaptationRecommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded-lg">
                  <Brain className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-800">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SentimentAnalysisDashboard
