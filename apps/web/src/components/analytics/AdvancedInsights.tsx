'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Zap,
  BarChart3,
  Users,
  Award,
  ArrowRight,
  BookOpen,
  Play,
  Calendar
} from 'lucide-react'

interface PersonalizedInsight {
  id: string
  type: 'strength' | 'improvement' | 'trend' | 'recommendation'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: number // 1-10
  confidence: number // 1-100
  actionable: boolean
  category: string
  timeframe: string
  metrics?: {
    current: number
    target: number
    improvement: number
  }
}

interface SkillGap {
  skill: string
  currentLevel: number
  targetLevel: number
  gap: number
  priority: 'critical' | 'important' | 'nice-to-have'
  resources: string[]
  estimatedTime: string
}

interface PredictiveAnalysis {
  nextSessionScore: number
  confidence: number
  factors: string[]
  recommendations: string[]
  optimalPracticeTime: string
  suggestedFocus: string[]
}

interface AdvancedInsightsProps {
  userId: string
  timeRange: string
  performanceData: any
}

export default function AdvancedInsights({ userId, timeRange, performanceData }: AdvancedInsightsProps) {
  const [activeTab, setActiveTab] = useState('insights')
  const [selectedInsight, setSelectedInsight] = useState<PersonalizedInsight | null>(null)

  // Mock data - in real implementation, this would come from AI analysis
  const personalizedInsights: PersonalizedInsight[] = [
    {
      id: '1',
      type: 'trend',
      priority: 'high',
      title: 'Confidence Trending Upward',
      description: 'Your confidence scores have improved by 23% over the last 2 weeks, particularly in technical interviews.',
      impact: 8,
      confidence: 92,
      actionable: true,
      category: 'confidence',
      timeframe: '2 weeks',
      metrics: {
        current: 78,
        target: 85,
        improvement: 23
      }
    },
    {
      id: '2',
      type: 'improvement',
      priority: 'high',
      title: 'Reduce Filler Words',
      description: 'You average 4.2 filler words per minute. Reducing this to under 2 could improve your clarity score by 15%.',
      impact: 7,
      confidence: 88,
      actionable: true,
      category: 'communication',
      timeframe: '1-2 weeks',
      metrics: {
        current: 4.2,
        target: 2.0,
        improvement: -52
      }
    },
    {
      id: '3',
      type: 'strength',
      priority: 'medium',
      title: 'Excellent Technical Explanations',
      description: 'Your technical explanations are consistently rated 85%+ for clarity and depth. This is a key strength.',
      impact: 9,
      confidence: 95,
      actionable: false,
      category: 'technical',
      timeframe: 'ongoing',
      metrics: {
        current: 87,
        target: 90,
        improvement: 12
      }
    },
    {
      id: '4',
      type: 'recommendation',
      priority: 'medium',
      title: 'Practice Behavioral Questions',
      description: 'Your behavioral interview scores are 15% lower than technical. Focus on STAR method practice.',
      impact: 6,
      confidence: 82,
      actionable: true,
      category: 'behavioral',
      timeframe: '2-3 weeks'
    }
  ]

  const skillGaps: SkillGap[] = [
    {
      skill: 'System Design',
      currentLevel: 6,
      targetLevel: 8,
      gap: 2,
      priority: 'critical',
      resources: ['System Design Interview Book', 'Practice with LeetCode', 'Mock interviews'],
      estimatedTime: '4-6 weeks'
    },
    {
      skill: 'Behavioral Storytelling',
      currentLevel: 5,
      targetLevel: 8,
      gap: 3,
      priority: 'important',
      resources: ['STAR method practice', 'Record and review stories', 'Peer feedback'],
      estimatedTime: '2-3 weeks'
    },
    {
      skill: 'Salary Negotiation',
      currentLevel: 3,
      targetLevel: 7,
      gap: 4,
      priority: 'nice-to-have',
      resources: ['Negotiation courses', 'Market research', 'Practice scenarios'],
      estimatedTime: '3-4 weeks'
    }
  ]

  const predictiveAnalysis: PredictiveAnalysis = {
    nextSessionScore: 82,
    confidence: 78,
    factors: [
      'Recent improvement trend (+15%)',
      'Consistent practice schedule',
      'Strong technical foundation',
      'Need to work on behavioral questions'
    ],
    recommendations: [
      'Schedule practice session for Tuesday afternoon (your peak performance time)',
      'Focus 60% on behavioral questions, 40% on technical',
      'Take a 5-minute break every 20 minutes',
      'Review your last session recording before starting'
    ],
    optimalPracticeTime: 'Tuesday 2-4 PM',
    suggestedFocus: ['Behavioral Questions', 'Communication Skills', 'Confidence Building']
  }

  const getInsightIcon = (type: PersonalizedInsight['type']) => {
    switch (type) {
      case 'strength': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'improvement': return <TrendingUp className="h-5 w-5 text-blue-500" />
      case 'trend': return <BarChart3 className="h-5 w-5 text-purple-500" />
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-yellow-500" />
      default: return <Brain className="h-5 w-5" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSkillGapColor = (priority: SkillGap['priority']) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50'
      case 'important': return 'border-yellow-500 bg-yellow-50'
      case 'nice-to-have': return 'border-green-500 bg-green-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Insights</h2>
          <p className="text-muted-foreground">AI-powered analysis and personalized recommendations</p>
        </div>
        <Badge variant="secondary" className="flex items-center space-x-1">
          <Brain className="h-3 w-3" />
          <span>AI Powered</span>
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Personalized Insights</TabsTrigger>
          <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="recommendations">Action Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {personalizedInsights.map((insight) => (
              <Card 
                key={insight.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedInsight?.id === insight.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedInsight(insight)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getInsightIcon(insight.type)}
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                    </div>
                    <Badge className={getPriorityColor(insight.priority)}>
                      {insight.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  
                  {insight.metrics && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current: {insight.metrics.current}</span>
                        <span>Target: {insight.metrics.target}</span>
                      </div>
                      <Progress 
                        value={(insight.metrics.current / insight.metrics.target) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <span>Impact: {insight.impact}/10</span>
                      <span>Confidence: {insight.confidence}%</span>
                    </div>
                    <span>{insight.timeframe}</span>
                  </div>
                  
                  {insight.actionable && (
                    <Button size="sm" className="w-full">
                      <Play className="h-3 w-3 mr-2" />
                      Take Action
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <div className="space-y-4">
            {skillGaps.map((gap, index) => (
              <Card key={index} className={`border-l-4 ${getSkillGapColor(gap.priority)}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{gap.skill}</CardTitle>
                    <Badge variant="outline" className="capitalize">
                      {gap.priority}
                    </Badge>
                  </div>
                  <CardDescription>
                    Current Level: {gap.currentLevel}/10 → Target: {gap.targetLevel}/10
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{gap.currentLevel}/{gap.targetLevel}</span>
                    </div>
                    <Progress value={(gap.currentLevel / gap.targetLevel) * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recommended Resources:</h4>
                    <ul className="text-sm space-y-1">
                      {gap.resources.map((resource, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <BookOpen className="h-3 w-3 text-muted-foreground" />
                          <span>{resource}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{gap.estimatedTime}</span>
                    </div>
                    <Button size="sm">
                      Start Learning
                      <ArrowRight className="h-3 w-3 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <span>Next Session Prediction</span>
              </CardTitle>
              <CardDescription>
                AI prediction based on your recent performance and patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {predictiveAnalysis.nextSessionScore}%
                </div>
                <p className="text-muted-foreground">Predicted Score</p>
                <Badge variant="outline" className="mt-2">
                  {predictiveAnalysis.confidence}% confidence
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Key Factors:</h4>
                  <ul className="space-y-1">
                    {predictiveAnalysis.factors.map((factor, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {predictiveAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <Lightbulb className="h-3 w-3 text-yellow-500" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Optimal Practice Time:</strong> {predictiveAnalysis.optimalPracticeTime}
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-500" />
                <span>Personalized Action Plan</span>
              </CardTitle>
              <CardDescription>
                Step-by-step plan to improve your interview performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Focus on Behavioral Questions</h4>
                    <p className="text-sm text-muted-foreground">Practice STAR method for 30 minutes daily</p>
                  </div>
                  <Button size="sm" variant="outline">Start</Button>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Reduce Filler Words</h4>
                    <p className="text-sm text-muted-foreground">Practice speaking with deliberate pauses</p>
                  </div>
                  <Button size="sm" variant="outline">Start</Button>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">System Design Practice</h4>
                    <p className="text-sm text-muted-foreground">Complete 2 system design problems weekly</p>
                  </div>
                  <Button size="sm" variant="outline">Start</Button>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Start Complete Action Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
