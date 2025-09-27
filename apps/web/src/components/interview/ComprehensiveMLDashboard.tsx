'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  Target, 
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Zap,
  Clock,
  Users,
  MessageSquare,
  Code,
  Heart,
  Shield,
  Lightbulb,
  BarChart3,
  Settings,
  Award,
  Eye,
  Mic
} from 'lucide-react'
import { useRealTimeInterviewMonitoring, useInterviewCoaching } from '@/hooks/useMLIntegration'

interface ComprehensiveMLDashboardProps {
  className?: string
  showPerformancePrediction?: boolean
  showSentimentAnalysis?: boolean
  showDifficultyAdjustment?: boolean
  showInterviewIntelligence?: boolean
  showRealTimeCoaching?: boolean
}

interface MetricCardProps {
  title: string
  value: number
  label: string
  icon: React.ReactNode
  trend?: 'improving' | 'declining' | 'stable'
  color?: string
}

interface ProgressionChartProps {
  title: string
  data: number[]
  color: string
  icon: React.ReactNode
}

function MetricCard({ title, value, label, icon, trend, color = 'blue' }: MetricCardProps) {
  const percentage = Math.round(value * 100)
  
  const getColorClass = () => {
    if (value > 0.8) return 'text-green-600 bg-green-50 border-green-200'
    if (value > 0.6) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (value > 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'declining': return <TrendingDown className="h-3 w-3 text-red-500" />
      default: return <Activity className="h-3 w-3 text-gray-500" />
    }
  }

  return (
    <Card className={`${getColorClass()} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
          </div>
          {trend && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
            </div>
          )}
        </div>
        
        <div className="text-2xl font-bold mb-2">
          {percentage}%
        </div>
        
        <Progress value={percentage} className="mb-2" />
        
        <div className="text-xs text-muted-foreground">
          {label}
        </div>
      </CardContent>
    </Card>
  )
}

function ProgressionChart({ title, data, color, icon }: ProgressionChartProps) {
  const maxValue = Math.max(...data, 1)
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2 text-sm">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end space-x-1 h-20">
          {data.slice(-10).map((value, index) => (
            <div
              key={index}
              className={`flex-1 ${color} rounded-sm opacity-70 hover:opacity-100 transition-opacity`}
              style={{ height: `${(value / maxValue) * 100}%` }}
              title={`${Math.round(value * 100)}%`}
            />
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Latest: {Math.round((data[data.length - 1] || 0) * 100)}%
        </div>
      </CardContent>
    </Card>
  )
}

export function ComprehensiveMLDashboard({
  className = '',
  showPerformancePrediction = true,
  showSentimentAnalysis = true,
  showDifficultyAdjustment = true,
  showInterviewIntelligence = true,
  showRealTimeCoaching = true
}: ComprehensiveMLDashboardProps) {
  const monitoring = useRealTimeInterviewMonitoring()
  const coaching = useInterviewCoaching()

  // Helper function to normalize trend values
  const normalizeTrend = (trend: any): 'improving' | 'declining' | 'stable' => {
    if (trend === 'improving' || trend === 'declining' || trend === 'stable') {
      return trend
    }
    return 'stable' // Default for any other values like 'fluctuating'
  }

  if (!monitoring.isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Brain className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading AI Interview Intelligence...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (monitoring.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{monitoring.error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Intelligence Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Interview Intelligence</span>
            <Badge variant="outline" className="ml-auto">
              Confidence: {Math.round(monitoring.overallConfidence * 100)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {monitoring.getOverallAssessment()}
              </div>
              <p className="text-lg text-muted-foreground mb-4">
                {monitoring.getPredictedOutcome()}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(monitoring.overallPerformance * 100)}%
                  </div>
                  <div className="text-blue-800">Performance</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(monitoring.engagementLevel * 100)}%
                  </div>
                  <div className="text-green-800">Engagement</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(monitoring.confidenceLevel * 100)}%
                  </div>
                  <div className="text-purple-800">Confidence</div>
                </div>
                
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((1 - monitoring.stressLevel) * 100)}%
                  </div>
                  <div className="text-orange-800">Composure</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Performance"
          value={monitoring.overallPerformance}
          label="Success Probability"
          icon={<Target className="h-4 w-4" />}
          trend={normalizeTrend(monitoring.performanceTrend)}
        />

        <MetricCard
          title="Technical"
          value={monitoring.technicalStrength}
          label="Technical Competency"
          icon={<Code className="h-4 w-4" />}
          trend={normalizeTrend(monitoring.technicalTrend)}
        />

        <MetricCard
          title="Communication"
          value={monitoring.interpersonalSkills}
          label="Interpersonal Skills"
          icon={<MessageSquare className="h-4 w-4" />}
          trend={normalizeTrend(monitoring.communicationTrend)}
        />
        
        <MetricCard
          title="Sentiment"
          value={(monitoring.currentSentiment + 1) / 2}
          label="Emotional State"
          icon={<Heart className="h-4 w-4" />}
        />
      </div>

      {/* Performance Progression */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Performance Progression</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ProgressionChart
              title="Overall Performance"
              data={monitoring.getPerformanceProgression()}
              color="bg-blue-500"
              icon={<Target className="h-4 w-4" />}
            />
            
            <ProgressionChart
              title="Difficulty Level"
              data={monitoring.getDifficultyProgression()}
              color="bg-purple-500"
              icon={<Settings className="h-4 w-4" />}
            />
            
            <ProgressionChart
              title="Engagement Level"
              data={monitoring.analysisHistory.map(a => a.sentimentAnalysis.realTimeInsights.engagementLevel)}
              color="bg-green-500"
              icon={<Activity className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Interview Intelligence */}
      {showInterviewIntelligence && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Candidate Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Candidate Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Experience Level</div>
                    <div className="font-medium capitalize">{monitoring.experienceLevel}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Communication Style</div>
                    <div className="font-medium capitalize">{monitoring.communicationStyle}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Technical Strength:</span>
                    <span>{Math.round(monitoring.technicalStrength * 100)}%</span>
                  </div>
                  <Progress value={monitoring.technicalStrength * 100} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Interpersonal Skills:</span>
                    <span>{Math.round(monitoring.interpersonalSkills * 100)}%</span>
                  </div>
                  <Progress value={monitoring.interpersonalSkills * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Interview Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="font-medium">
                      {Math.round(monitoring.interviewDuration / 60000)} min
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Questions Asked</div>
                    <div className="font-medium">{monitoring.questionsAsked}</div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Completion:</span>
                    <span>{Math.round(monitoring.completionPercentage)}%</span>
                  </div>
                  <Progress value={monitoring.completionPercentage} className="h-2" />
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Estimated Remaining</div>
                  <div className="font-medium">
                    {Math.round(monitoring.estimatedRemainingTime / 60000)} min
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Difficulty Adjustment */}
      {showDifficultyAdjustment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Dynamic Difficulty Adjustment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600 capitalize">
                    {monitoring.currentDifficulty}
                  </div>
                  <div className="text-sm text-blue-800">Current Difficulty</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {monitoring.difficultyAdjustments}
                  </div>
                  <div className="text-sm text-green-800">Adjustments Made</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round(monitoring.adaptationEffectiveness * 100)}%
                  </div>
                  <div className="text-sm text-purple-800">Adaptation Success</div>
                </div>
              </div>
              
              {monitoring.shouldAdjustDifficulty() && (
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    {monitoring.getAdaptationReason()}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-Time Coaching */}
      {showRealTimeCoaching && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Coaching */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-600">
                <Lightbulb className="h-5 w-5" />
                <span>Live Coaching</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coaching.getLiveCoaching().length > 0 ? (
                <ul className="space-y-2">
                  {coaching.getLiveCoaching().map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Lightbulb className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No immediate coaching needed - you're doing well!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Positive Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <Award className="h-5 w-5" />
                <span>Positive Feedback</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coaching.getPositiveFeedback().length > 0 ? (
                <ul className="space-y-2">
                  {coaching.getPositiveFeedback().map((feedback, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feedback}</span>
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

      {/* Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Key Strengths</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monitoring.getKeyStrengths().length > 0 ? (
              <ul className="space-y-2">
                {monitoring.getKeyStrengths().map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Strengths will be identified as the interview progresses
              </p>
            )}
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-600">
              <Target className="h-5 w-5" />
              <span>Areas for Improvement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monitoring.getAreasForImprovement().length > 0 ? (
              <ul className="space-y-2">
                {monitoring.getAreasForImprovement().map((area, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Target className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{area}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No significant areas for improvement identified
              </p>
            )}
          </CardContent>
        </Card>

        {/* Immediate Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-600">
              <Zap className="h-5 w-5" />
              <span>Immediate Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monitoring.getImmediateActions().length > 0 ? (
              <ul className="space-y-2">
                {monitoring.getImmediateActions().map((action, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{action}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No immediate actions required
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Recommendations */}
      {monitoring.systemRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>System Recommendations</span>
              <Badge variant={monitoring.recommendationPriority === 'high' ? 'destructive' : 'secondary'}>
                {monitoring.recommendationPriority} priority
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {monitoring.systemRecommendations.map((recommendation, index) => (
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

export default ComprehensiveMLDashboard
