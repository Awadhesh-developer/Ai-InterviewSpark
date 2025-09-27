'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Globe, 
  Users, 
  MessageSquare,
  Brain,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Heart,
  Shield,
  Compass,
  Map,
  Languages,
  Clock,
  Eye,
  Zap,
  Star,
  Award,
  BookOpen,
  Settings,
  Info
} from 'lucide-react'
import { useInterviewCulturalIntelligence } from '@/hooks/useCulturalIntelligence'

interface CulturalIntelligenceDashboardProps {
  className?: string
  showCulturalProfile?: boolean
  showAdaptedAssessment?: boolean
  showCulturalInsights?: boolean
  showCrossculturalCompetence?: boolean
  showRecommendations?: boolean
}

interface MetricCardProps {
  title: string
  value: number
  label: string
  icon: React.ReactNode
  color?: string
  level?: string
}

interface InsightCardProps {
  title: string
  insights: string[]
  icon: React.ReactNode
  color: string
  type?: 'strength' | 'challenge' | 'opportunity' | 'risk'
}

function MetricCard({ title, value, label, icon, color = 'blue', level }: MetricCardProps) {
  const percentage = Math.round(value * 100)
  
  const getColorClass = () => {
    if (level) {
      switch (level) {
        case 'expert': return 'text-green-600 bg-green-50 border-green-200'
        case 'proficient': return 'text-blue-600 bg-blue-50 border-blue-200'
        case 'developing': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        case 'novice': return 'text-orange-600 bg-orange-50 border-orange-200'
        case 'beginner': return 'text-red-600 bg-red-50 border-red-200'
      }
    }
    
    if (value > 0.8) return 'text-green-600 bg-green-50 border-green-200'
    if (value > 0.6) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (value > 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <Card className={`${getColorClass()} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
          </div>
          {level && (
            <Badge variant="outline" className="text-xs capitalize">
              {level}
            </Badge>
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

function InsightCard({ title, insights, icon, color, type }: InsightCardProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'strength': return <Star className="h-3 w-3 text-green-500" />
      case 'challenge': return <AlertTriangle className="h-3 w-3 text-orange-500" />
      case 'opportunity': return <TrendingUp className="h-3 w-3 text-blue-500" />
      case 'risk': return <Shield className="h-3 w-3 text-red-500" />
      default: return <Info className="h-3 w-3 text-gray-500" />
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2 text-sm">
          {icon}
          <span>{title}</span>
          {type && getTypeIcon()}
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

export function CulturalIntelligenceDashboard({
  className = '',
  showCulturalProfile = true,
  showAdaptedAssessment = true,
  showCulturalInsights = true,
  showCrossculturalCompetence = true,
  showRecommendations = true
}: CulturalIntelligenceDashboardProps) {
  const cultural = useInterviewCulturalIntelligence()

  if (!cultural.isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Globe className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading Cultural Intelligence...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (cultural.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{cultural.error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const getCultureIcon = () => {
    const culture = cultural.getPrimaryCulture()
    if (culture.includes('western')) return <Globe className="h-5 w-5 text-blue-500" />
    if (culture.includes('asian')) return <Compass className="h-5 w-5 text-red-500" />
    if (culture.includes('latin')) return <Heart className="h-5 w-5 text-orange-500" />
    if (culture.includes('middle')) return <Map className="h-5 w-5 text-purple-500" />
    if (culture.includes('african')) return <Users className="h-5 w-5 text-green-500" />
    return <Globe className="h-5 w-5 text-gray-500" />
  }

  const getCommunicationStyleColor = () => {
    const style = cultural.getCommunicationStyle()
    switch (style) {
      case 'direct_formal': return 'bg-blue-100 text-blue-800'
      case 'direct_informal': return 'bg-green-100 text-green-800'
      case 'indirect_formal': return 'bg-purple-100 text-purple-800'
      case 'indirect_informal': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cultural Intelligence Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Cultural Intelligence Overview</span>
            <Badge variant="outline" className="ml-auto">
              Confidence: {Math.round(cultural.overallConfidence * 100)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getCultureIcon()}
              </div>
              <div className="text-lg font-bold text-blue-600 capitalize">
                {cultural.getPrimaryCulture().replace('-', ' ')}
              </div>
              <div className="text-blue-800">Primary Culture</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {cultural.getCulturalCompetenceLevel().toUpperCase()}
              </div>
              <div className="text-green-800">Competence Level</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className={`text-lg font-bold px-2 py-1 rounded ${getCommunicationStyleColor()}`}>
                {cultural.getCommunicationStyle().replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-purple-800 mt-1">Communication Style</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(cultural.overallCompetence * 100)}%
              </div>
              <div className="text-orange-800">Overall Competence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cultural Profile */}
      {showCulturalProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Cultural Dimensions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cultural.culturalDimensions && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Power Distance:</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={cultural.culturalDimensions.hofstedeProfile.powerDistance.score * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">
                          {cultural.isHighPowerDistance() ? 'High' : 'Low'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Individualism:</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={cultural.culturalDimensions.hofstedeProfile.individualismCollectivism.score * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">
                          {cultural.isCollectivistic() ? 'Collectivistic' : 'Individualistic'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Uncertainty Avoidance:</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={cultural.culturalDimensions.hofstedeProfile.uncertaintyAvoidance.score * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">
                          {cultural.isUncertaintyAvoiding() ? 'High' : 'Low'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Time Orientation:</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={cultural.culturalDimensions.hofstedeProfile.longTermOrientation.score * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">
                          {cultural.isLongTermOriented() ? 'Long-term' : 'Short-term'}
                        </span>
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
                <span>Communication Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Directness:</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={cultural.getDirectnessLevel() * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">{Math.round(cultural.getDirectnessLevel() * 100)}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Formality:</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={cultural.getFormalityLevel() * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">{Math.round(cultural.getFormalityLevel() * 100)}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Context Level:</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant={cultural.isHighContext() ? 'default' : 'secondary'}>
                      {cultural.getContextLevel()}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Emotional Expression:</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={cultural.getEmotionalExpressiveness() * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">{Math.round(cultural.getEmotionalExpressiveness() * 100)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cross-Cultural Competence */}
      {showCrossculturalCompetence && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Cross-Cultural Competence</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <MetricCard
                title="Cultural Awareness"
                value={cultural.culturalAwareness}
                label="Self and cultural awareness"
                icon={<Eye className="h-4 w-4" />}
                level={cultural.competenceBreakdown?.selfAwareness.level}
              />
              
              <MetricCard
                title="Cultural Knowledge"
                value={cultural.culturalKnowledge}
                label="Understanding of cultures"
                icon={<BookOpen className="h-4 w-4" />}
                level={cultural.competenceBreakdown?.culturalKnowledge.level}
              />
              
              <MetricCard
                title="Cultural Skills"
                value={cultural.culturalSkills}
                label="Cross-cultural abilities"
                icon={<Settings className="h-4 w-4" />}
                level={cultural.competenceBreakdown?.crossCulturalSkills.level}
              />
              
              <MetricCard
                title="Cultural Adaptation"
                value={cultural.culturalAdaptation}
                label="Flexibility and adaptation"
                icon={<Zap className="h-4 w-4" />}
                level={cultural.competenceBreakdown?.culturalAdaptation.level}
              />
              
              <MetricCard
                title="Global Mindset"
                value={cultural.crossCulturalCompetence?.competenceBreakdown.globalMindset.score || 0}
                label="Global perspective"
                icon={<Globe className="h-4 w-4" />}
                level={cultural.competenceBreakdown?.globalMindset.level}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cultural Insights */}
      {showCulturalInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <InsightCard
              title="Cultural Strengths"
              insights={cultural.getCulturalStrengthsText()}
              icon={<Star className="h-4 w-4" />}
              color="bg-green-500"
              type="strength"
            />
            
            <InsightCard
              title="Adaptation Opportunities"
              insights={cultural.getAdaptationOpportunitiesText()}
              icon={<TrendingUp className="h-4 w-4" />}
              color="bg-blue-500"
              type="opportunity"
            />
          </div>
          
          <div className="space-y-4">
            <InsightCard
              title="Cultural Challenges"
              insights={cultural.getCulturalChallengesText()}
              icon={<AlertTriangle className="h-4 w-4" />}
              color="bg-orange-500"
              type="challenge"
            />
            
            <InsightCard
              title="Cultural Risks"
              insights={cultural.getCulturalRisksText()}
              icon={<Shield className="h-4 w-4" />}
              color="bg-red-500"
              type="risk"
            />
          </div>
        </div>
      )}

      {/* Behavioral Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Behavioral Patterns</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600 capitalize">
                {cultural.getLeadershipStyle().replace('_', ' ')}
              </div>
              <div className="text-sm text-blue-800">Leadership Style</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600 capitalize">
                {cultural.getConflictResolutionStyle().replace('_', ' ')}
              </div>
              <div className="text-sm text-green-800">Conflict Resolution</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {Math.round(cultural.getTimeOrientation() * 100)}%
              </div>
              <div className="text-sm text-purple-800">Time Orientation</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adaptability Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Compass className="h-5 w-5" />
            <span>Adaptability Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(cultural.getCulturalFlexibility() * 100)}%
              </div>
              <div className="text-sm text-blue-800">Cultural Flexibility</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(cultural.getBiasAwareness() * 100)}%
              </div>
              <div className="text-sm text-green-800">Bias Awareness</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(cultural.getInclusivityMindset() * 100)}%
              </div>
              <div className="text-sm text-purple-800">Inclusivity Mindset</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(cultural.getCrossCulturalExperience() * 100)}%
              </div>
              <div className="text-sm text-orange-800">Cross-Cultural Experience</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {showRecommendations && cultural.needsCulturalAdaptation() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-600">
              <Lightbulb className="h-5 w-5" />
              <span>Cultural Adaptation Recommendations</span>
              <Badge variant="destructive">
                {cultural.recommendationPriority} Priority
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cultural.immediateRecommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Immediate Actions:</h4>
                  <ul className="space-y-1">
                    {cultural.immediateRecommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Zap className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec.recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {cultural.shortTermRecommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Short-term Development:</h4>
                  <ul className="space-y-1">
                    {cultural.shortTermRecommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec.recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {cultural.culturalDevelopmentRecommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Cultural Development:</h4>
                  <ul className="space-y-1">
                    {cultural.culturalDevelopmentRecommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Award className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec.developmentArea}</span>
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
            <span>Cultural Analysis Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {cultural.analysisHistory.length}
              </div>
              <div className="text-blue-800">Analyses Completed</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {Math.round(cultural.overallConfidence * 100)}%
              </div>
              <div className="text-green-800">Confidence Level</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {cultural.isAnalyzing ? 'Active' : 'Ready'}
              </div>
              <div className="text-purple-800">Analysis Status</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {cultural.latestResult ? 'Available' : 'None'}
              </div>
              <div className="text-orange-800">Latest Result</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CulturalIntelligenceDashboard
