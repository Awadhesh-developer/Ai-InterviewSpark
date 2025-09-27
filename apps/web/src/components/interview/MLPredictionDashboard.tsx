'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Zap,
  Users,
  MessageSquare,
  Code,
  Lightbulb,
  Clock,
  BarChart3,
  Activity,
  Shield
} from 'lucide-react'
import { 
  useInterviewPerformancePrediction,
  useBehavioralPatternAnalysis,
  type PerformancePrediction,
  type BehavioralPattern
} from '@/hooks/useMLPerformancePrediction'

interface MLPredictionDashboardProps {
  className?: string
  showDetailedAnalysis?: boolean
  showBehavioralPatterns?: boolean
  showPredictionTrends?: boolean
}

interface PredictionScoreCardProps {
  title: string
  score: number
  icon: React.ReactNode
  description: string
  trend?: number
  confidence?: number
}

interface BehavioralPatternCardProps {
  pattern: BehavioralPattern
}

interface CategoryAnalysisProps {
  prediction: PerformancePrediction
}

function PredictionScoreCard({ title, score, icon, description, trend, confidence }: PredictionScoreCardProps) {
  const getScoreColor = () => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    if (score >= 0.4) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBackground = () => {
    if (score >= 0.8) return 'bg-green-50 border-green-200'
    if (score >= 0.6) return 'bg-yellow-50 border-yellow-200'
    if (score >= 0.4) return 'bg-orange-50 border-orange-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <Card className={`${getScoreBackground()} border-2`}>
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
        
        <p className="text-xs text-muted-foreground">{description}</p>
        
        {confidence !== undefined && (
          <div className="mt-2 flex items-center space-x-1">
            <Shield className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-blue-600">
              Confidence: {Math.round(confidence * 100)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BehavioralPatternCard({ pattern }: BehavioralPatternCardProps) {
  const getPatternIcon = () => {
    switch (pattern.id) {
      case 'high_performer': return <Award className="h-4 w-4 text-gold-500" />
      case 'growth_potential': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'communication_leader': return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'technical_expert': return <Code className="h-4 w-4 text-purple-500" />
      case 'stress_sensitive': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'detail_oriented': return <Target className="h-4 w-4 text-indigo-500" />
      case 'creative_thinker': return <Lightbulb className="h-4 w-4 text-yellow-500" />
      case 'team_player': return <Users className="h-4 w-4 text-green-500" />
      default: return <Brain className="h-4 w-4 text-gray-500" />
    }
  }

  const getImpactColor = () => {
    switch (pattern.impact) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200'
      case 'negative': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card className={`${getImpactColor()} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getPatternIcon()}
            <span className="font-medium text-sm">{pattern.name}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {Math.round(pattern.confidence * 100)}%
          </Badge>
        </div>
        
        <p className="text-xs text-muted-foreground mb-2">{pattern.description}</p>
        
        <div className="flex flex-wrap gap-1">
          {pattern.indicators.slice(0, 3).map((indicator, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {indicator.replace('_', ' ')}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryAnalysis({ prediction }: CategoryAnalysisProps) {
  const categories = [
    { 
      name: 'Technical', 
      score: prediction.categoryPredictions.technical, 
      icon: <Code className="h-4 w-4" />,
      description: 'Technical competency and problem-solving'
    },
    { 
      name: 'Communication', 
      score: prediction.categoryPredictions.communication, 
      icon: <MessageSquare className="h-4 w-4" />,
      description: 'Verbal and interpersonal communication'
    },
    { 
      name: 'Leadership', 
      score: prediction.categoryPredictions.leadership, 
      icon: <Users className="h-4 w-4" />,
      description: 'Leadership potential and influence'
    },
    { 
      name: 'Problem Solving', 
      score: prediction.categoryPredictions.problemSolving, 
      icon: <Lightbulb className="h-4 w-4" />,
      description: 'Analytical and creative problem-solving'
    },
    { 
      name: 'Cultural Fit', 
      score: prediction.categoryPredictions.culturalFit, 
      icon: <Target className="h-4 w-4" />,
      description: 'Alignment with company culture'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center space-x-2">
            {category.icon}
            <span className="font-medium text-sm">{category.name}</span>
          </div>
          <Progress value={category.score * 100} className="h-2" />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{category.description}</span>
            <span className="font-medium">{Math.round(category.score * 100)}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function MLPredictionDashboard({
  className = '',
  showDetailedAnalysis = true,
  showBehavioralPatterns = true,
  showPredictionTrends = false
}: MLPredictionDashboardProps) {
  const prediction = useInterviewPerformancePrediction()
  const behaviorAnalysis = useBehavioralPatternAnalysis()

  if (!prediction.isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Brain className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading ML prediction models...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (prediction.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{prediction.error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const predictionSummary = prediction.getPredictionSummary()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Prediction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>ML Performance Prediction</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {predictionSummary ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {Math.round(predictionSummary.probability * 100)}%
                </div>
                <p className="text-lg text-muted-foreground mb-4">{predictionSummary.summary}</p>
                
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span>Confidence: {Math.round((1 - predictionSummary.confidence) * 100)}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span>Improvement Potential: {Math.round(prediction.improvementPotential * 100)}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>Time to Improvement: {prediction.timeToImprovement} weeks</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2 flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Top Strength</span>
                  </h4>
                  <p className="text-sm text-green-700">{predictionSummary.topStrength}</p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2 flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Key Risk</span>
                  </h4>
                  <p className="text-sm text-orange-700">{predictionSummary.topRisk}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No prediction data available yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Continue the interview to generate ML-based predictions
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Analysis */}
      {showDetailedAnalysis && prediction.currentPrediction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Category Performance Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryAnalysis prediction={prediction.currentPrediction} />
          </CardContent>
        </Card>
      )}

      {/* Prediction Score Cards */}
      {prediction.currentPrediction && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PredictionScoreCard
            title="Technical"
            score={prediction.technicalScore}
            icon={<Code className="h-4 w-4" />}
            description="Technical competency assessment"
            trend={prediction.predictionTrend}
            confidence={1 - prediction.predictionConfidence}
          />
          
          <PredictionScoreCard
            title="Communication"
            score={prediction.communicationScore}
            icon={<MessageSquare className="h-4 w-4" />}
            description="Communication effectiveness"
            confidence={1 - prediction.predictionConfidence}
          />
          
          <PredictionScoreCard
            title="Leadership"
            score={prediction.leadershipScore}
            icon={<Users className="h-4 w-4" />}
            description="Leadership potential"
            confidence={1 - prediction.predictionConfidence}
          />
          
          <PredictionScoreCard
            title="Problem Solving"
            score={prediction.problemSolvingScore}
            icon={<Lightbulb className="h-4 w-4" />}
            description="Analytical thinking ability"
            confidence={1 - prediction.predictionConfidence}
          />
        </div>
      )}

      {/* Behavioral Patterns */}
      {showBehavioralPatterns && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Behavioral Pattern Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {behaviorAnalysis.patterns.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {behaviorAnalysis.patterns
                    .filter(p => p.confidence > 0.6)
                    .slice(0, 6)
                    .map((pattern, index) => (
                      <BehavioralPatternCard key={index} pattern={pattern} />
                    ))}
                </div>
                
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-lg">{behaviorAnalysis.patternCount}</div>
                      <div className="text-muted-foreground">Patterns Detected</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">
                        {Math.round(behaviorAnalysis.averageConfidence * 100)}%
                      </div>
                      <div className="text-muted-foreground">Average Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">
                        {behaviorAnalysis.patterns.filter(p => p.impact === 'positive').length}
                      </div>
                      <div className="text-muted-foreground">Positive Patterns</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">
                        {behaviorAnalysis.patterns.filter(p => p.impact === 'negative').length}
                      </div>
                      <div className="text-muted-foreground">Risk Patterns</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No behavioral patterns detected yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Patterns will emerge as the interview progresses
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Strengths and Risk Factors */}
      {prediction.currentPrediction && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Identified Strengths</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prediction.strengthIndicators.length > 0 ? (
                <ul className="space-y-2">
                  {prediction.strengthIndicators.map((strength, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Continue the interview to identify candidate strengths
                </p>
              )}
            </CardContent>
          </Card>

          {/* Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                <span>Risk Factors</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prediction.riskFactors.length > 0 ? (
                <ul className="space-y-2">
                  {prediction.riskFactors.map((risk, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{risk}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No significant risk factors identified
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Model Performance */}
      {showPredictionTrends && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Model Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-lg">{prediction.trainingDataSize}</div>
                <div className="text-muted-foreground">Training Samples</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-lg">
                  {prediction.isPredictionReliable ? 'High' : 'Medium'}
                </div>
                <div className="text-muted-foreground">Reliability</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-lg">{prediction.predictionHistory.length}</div>
                <div className="text-muted-foreground">Predictions Made</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-lg">
                  {Math.round((1 - prediction.predictionConfidence) * 100)}%
                </div>
                <div className="text-muted-foreground">Confidence</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default MLPredictionDashboard
