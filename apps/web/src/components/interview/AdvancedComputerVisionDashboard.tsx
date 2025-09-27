'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  Eye, 
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Target,
  Users,
  MessageSquare,
  Lightbulb,
  BarChart3,
  Gauge,
  Focus,
  Smile,
  Frown,
  Meh,
  AlertCircle,
  Info
} from 'lucide-react'
import { useInterviewComputerVision } from '@/hooks/useAdvancedComputerVision'

interface AdvancedComputerVisionDashboardProps {
  className?: string
  showMicroExpressions?: boolean
  showAttentionTracking?: boolean
  showBiometricAnalysis?: boolean
  showBehavioralProfile?: boolean
  showRiskAssessment?: boolean
}

interface MetricCardProps {
  title: string
  value: number
  label: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  color?: string
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
}

interface InsightCardProps {
  title: string
  insights: string[]
  icon: React.ReactNode
  color: string
}

function MetricCard({ title, value, label, icon, trend, color = 'blue', riskLevel }: MetricCardProps) {
  const percentage = Math.round(value * 100)
  
  const getColorClass = () => {
    if (riskLevel) {
      switch (riskLevel) {
        case 'low': return 'text-green-600 bg-green-50 border-green-200'
        case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
        case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      }
    }
    
    if (value > 0.8) return 'text-green-600 bg-green-50 border-green-200'
    if (value > 0.6) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (value > 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />
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

function InsightCard({ title, insights, icon, color }: InsightCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2 text-sm">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length > 0 ? (
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className={`w-2 h-2 rounded-full ${color} mt-2 flex-shrink-0`} />
                <span className="text-sm">{insight}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No insights available</p>
        )}
      </CardContent>
    </Card>
  )
}

export function AdvancedComputerVisionDashboard({
  className = '',
  showMicroExpressions = true,
  showAttentionTracking = true,
  showBiometricAnalysis = true,
  showBehavioralProfile = true,
  showRiskAssessment = true
}: AdvancedComputerVisionDashboardProps) {
  const vision = useInterviewComputerVision()

  if (!vision.isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Brain className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading Advanced Computer Vision...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (vision.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{vision.error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const getEmotionIcon = () => {
    const emotion = vision.getPrimaryEmotion()
    switch (emotion) {
      case 'happy': case 'joy': return <Smile className="h-5 w-5 text-green-500" />
      case 'sad': case 'sadness': return <Frown className="h-5 w-5 text-blue-500" />
      case 'angry': case 'anger': return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'fear': case 'surprise': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default: return <Meh className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Intelligence Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Advanced Computer Vision Intelligence</span>
            <Badge variant="outline" className="ml-auto">
              Confidence: {Math.round(vision.overallConfidence * 100)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getEmotionIcon()}
              </div>
              <div className="text-lg font-bold text-blue-600 capitalize">
                {vision.getPrimaryEmotion()}
              </div>
              <div className="text-blue-800">Primary Emotion</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(vision.getAttentionLevel() * 100)}%
              </div>
              <div className="text-green-800">Attention Level</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(vision.getEngagementLevel() * 100)}%
              </div>
              <div className="text-purple-800">Engagement</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(vision.getOverallAuthenticity() * 100)}%
              </div>
              <div className="text-orange-800">Authenticity</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Emotional Intensity"
          value={vision.getEmotionalIntensity()}
          label="Current emotional state intensity"
          icon={<Heart className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Stress Level"
          value={vision.getStressLevel()}
          label="Physiological stress indicators"
          icon={<Activity className="h-4 w-4" />}
          riskLevel={vision.getStressLevel() > 0.7 ? 'high' : vision.getStressLevel() > 0.5 ? 'medium' : 'low'}
        />
        
        <MetricCard
          title="Confidence Level"
          value={vision.getConfidenceLevel()}
          label="Behavioral confidence indicators"
          icon={<Target className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Focus Quality"
          value={vision.isFocused() ? 0.8 : 0.4}
          label="Attention and focus metrics"
          icon={<Focus className="h-4 w-4" />}
        />
      </div>

      {/* Biometric Analysis */}
      {showBiometricAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Biometric Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {vision.getHeartRate() || 'N/A'}
                </div>
                <div className="text-sm text-red-800">Heart Rate (BPM)</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {vision.getHeartRateVariability() || 'N/A'}
                </div>
                <div className="text-sm text-blue-800">HRV Score</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {vision.isStressed() ? 'High' : 'Normal'}
                </div>
                <div className="text-sm text-green-800">Stress State</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Behavioral Profile */}
      {showBehavioralProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Personality Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vision.personalityTraits && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Openness:</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={vision.personalityTraits.openness * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{Math.round(vision.personalityTraits.openness * 100)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Conscientiousness:</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={vision.personalityTraits.conscientiousness * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{Math.round(vision.personalityTraits.conscientiousness * 100)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Extraversion:</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={vision.personalityTraits.extraversion * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{Math.round(vision.personalityTraits.extraversion * 100)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Agreeableness:</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={vision.personalityTraits.agreeableness * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{Math.round(vision.personalityTraits.agreeableness * 100)}%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Communication Style</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vision.communicationStyle && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Directness:</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={vision.communicationStyle.directness * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{Math.round(vision.communicationStyle.directness * 100)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Expressiveness:</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={vision.communicationStyle.expressiveness * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{Math.round(vision.communicationStyle.expressiveness * 100)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Empathy:</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={vision.communicationStyle.empathy * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{Math.round(vision.communicationStyle.empathy * 100)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Engagement:</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={vision.communicationStyle.engagement * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{Math.round(vision.communicationStyle.engagement * 100)}%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Assessment */}
      {showRiskAssessment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Risk Assessment</span>
              <Badge variant={vision.isHighRisk() ? 'destructive' : 'secondary'}>
                {vision.isHighRisk() ? 'High Risk' : 'Low Risk'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600 capitalize">
                  {vision.deceptionRisk?.riskLevel || 'Low'}
                </div>
                <div className="text-sm text-blue-800">Deception Risk</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600 capitalize">
                  {vision.stressRisk?.riskLevel || 'Low'}
                </div>
                <div className="text-sm text-orange-800">Stress Risk</div>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600 capitalize">
                  {vision.healthRisk?.riskLevel || 'Low'}
                </div>
                <div className="text-sm text-red-800">Health Risk</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600 capitalize">
                  {vision.performanceRisk?.riskLevel || 'Low'}
                </div>
                <div className="text-sm text-purple-800">Performance Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InsightCard
          title="Personality Insights"
          insights={vision.getPersonalityInsights()}
          icon={<Users className="h-4 w-4" />}
          color="bg-blue-500"
        />
        
        <InsightCard
          title="Communication Insights"
          insights={vision.getCommunicationInsights()}
          icon={<MessageSquare className="h-4 w-4" />}
          color="bg-green-500"
        />
        
        <InsightCard
          title="Health Insights"
          insights={vision.getHealthInsights()}
          icon={<Heart className="h-4 w-4" />}
          color="bg-red-500"
        />
      </div>

      {/* Recommendations */}
      {vision.needsIntervention() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-600">
              <Lightbulb className="h-5 w-5" />
              <span>Immediate Recommendations</span>
              <Badge variant="destructive">
                {vision.recommendationPriority} Priority
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vision.immediateRecommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Immediate Actions:</h4>
                  <ul className="space-y-1">
                    {vision.immediateRecommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Zap className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {vision.interventions.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Interventions:</h4>
                  <ul className="space-y-1">
                    {vision.interventions.map((intervention, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Shield className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{intervention}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {vision.monitoring.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Monitoring:</h4>
                  <ul className="space-y-1">
                    {vision.monitoring.map((monitor, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Eye className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{monitor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Analysis Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {vision.analysisHistory.length}
              </div>
              <div className="text-blue-800">Frames Analyzed</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {Math.round(vision.overallConfidence * 100)}%
              </div>
              <div className="text-green-800">Confidence</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {vision.isAnalyzing ? 'Active' : 'Idle'}
              </div>
              <div className="text-purple-800">Status</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {vision.latestAnalysis ? 'Available' : 'None'}
              </div>
              <div className="text-orange-800">Latest Analysis</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvancedComputerVisionDashboard
