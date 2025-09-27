'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Clock,
  User,
  Lightbulb,
  BarChart3,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Zap,
  Award
} from 'lucide-react'
import { 
  useInterviewFlow,
  type GeneratedQuestion,
  type CandidateProfile,
  type QuestionCategory,
  type DifficultyLevel
} from '@/hooks/useAdaptiveQuestions'
import { type UnifiedMetrics } from '@/services/unifiedAnalyticsService'

interface AdaptiveQuestionInterfaceProps {
  interviewConfig: {
    position: string
    industry: string
    experienceLevel: string
    targetQuestions: number
  }
  currentMetrics?: UnifiedMetrics
  onQuestionGenerated?: (question: GeneratedQuestion) => void
  onQuestionCompleted?: (question: GeneratedQuestion, response: string, metrics: UnifiedMetrics) => void
  className?: string
}

interface QuestionDisplayProps {
  question: GeneratedQuestion
  isActive: boolean
  onComplete?: () => void
}

interface CandidateInsightsProps {
  profile: CandidateProfile
  progress: any
  adaptationInsights: string[]
}

function getDifficultyColor(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 text-green-800 border-green-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'hard': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'expert': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getCategoryIcon(category: QuestionCategory) {
  switch (category) {
    case 'behavioral': return <User className="h-4 w-4" />
    case 'technical': return <Brain className="h-4 w-4" />
    case 'situational': return <Target className="h-4 w-4" />
    case 'leadership': return <Award className="h-4 w-4" />
    case 'problem_solving': return <Lightbulb className="h-4 w-4" />
    case 'creative_thinking': return <Zap className="h-4 w-4" />
    default: return <BarChart3 className="h-4 w-4" />
  }
}

function QuestionDisplay({ question, isActive, onComplete }: QuestionDisplayProps) {
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isAnswering, setIsAnswering] = useState(false)

  useEffect(() => {
    if (!isActive || !isAnswering) return

    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, isAnswering])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const expectedMinutes = Math.floor(question.expectedDuration / 60000)

  return (
    <Card className={`${isActive ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getCategoryIcon(question.category)}
            <div>
              <CardTitle className="text-lg">{question.category.replace('_', ' ').toUpperCase()}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getDifficultyColor(question.difficulty)}>
                  {question.difficulty}
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  ~{expectedMinutes}m
                </Badge>
              </div>
            </div>
          </div>
          
          {isActive && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {formatTime(timeElapsed)}
              </div>
              <div className="text-sm text-muted-foreground">
                {isAnswering ? 'Answering...' : 'Ready'}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="text-lg font-medium leading-relaxed">
            {question.text}
          </div>
          
          {question.evaluationCriteria.expectedKeywords.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Key Areas to Address:</h4>
              <div className="flex flex-wrap gap-1">
                {question.evaluationCriteria.expectedKeywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {isActive && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Expected response: {question.evaluationCriteria.responseLength.min}-{question.evaluationCriteria.responseLength.max} words
              </div>
              
              <div className="flex space-x-2">
                {!isAnswering ? (
                  <Button onClick={() => setIsAnswering(true)}>
                    Start Answering
                  </Button>
                ) : (
                  <Button onClick={onComplete} variant="outline">
                    Complete Answer
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CandidateInsights({ profile, progress, adaptationInsights }: CandidateInsightsProps) {
  const getTrendIcon = () => {
    switch (progress?.performanceTrend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <BarChart3 className="h-4 w-4 text-blue-500" />
    }
  }

  const getEmotionalStateColor = () => {
    switch (profile.emotionalState) {
      case 'confident': return 'text-green-600'
      case 'calm': return 'text-blue-600'
      case 'nervous': return 'text-yellow-600'
      case 'stressed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-4">
      {/* Candidate Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Candidate Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Communication Style</h4>
              <Badge variant="outline" className="capitalize">
                {profile.communicationStyle.replace('_', ' ')}
              </Badge>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Technical Level</h4>
              <Badge variant="outline" className="capitalize">
                {profile.technicalLevel}
              </Badge>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Confidence Level</h4>
              <div className="flex items-center space-x-2">
                <Progress value={profile.confidenceLevel * 100} className="flex-1" />
                <span className="text-sm font-medium">
                  {Math.round(profile.confidenceLevel * 100)}%
                </span>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Emotional State</h4>
              <span className={`font-medium capitalize ${getEmotionalStateColor()}`}>
                {profile.emotionalState}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2 text-green-600">Strengths</h4>
              <div className="space-y-1">
                {profile.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-sm capitalize">{strength.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2 text-orange-600">Areas to Explore</h4>
              <div className="space-y-1">
                {profile.weaknesses.map((weakness, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                    <span className="text-sm capitalize">{weakness.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interview Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Interview Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Performance Trend</span>
            <div className="flex items-center space-x-2">
              {getTrendIcon()}
              <span className="text-sm capitalize">{progress?.performanceTrend || 'stable'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Average Response Time</span>
            <span className="text-sm">
              {Math.round((progress?.averageResponseTime || 0) / 1000)}s
            </span>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2">Topics Covered</h4>
            <div className="flex flex-wrap gap-1">
              {(progress?.topicsCovered || []).map((topic: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs capitalize">
                  {topic.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adaptation Insights */}
      {adaptationInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5" />
              <span>AI Adaptation Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {adaptationInsights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded-lg">
                  <Brain className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-800">{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function AdaptiveQuestionInterface({
  interviewConfig,
  currentMetrics,
  onQuestionGenerated,
  onQuestionCompleted,
  className = ''
}: AdaptiveQuestionInterfaceProps) {
  const interviewFlow = useInterviewFlow(interviewConfig)
  const [responseHistory, setResponseHistory] = useState<any[]>([])

  // Generate first question on initialization
  useEffect(() => {
    if (interviewFlow.isInitialized && !interviewFlow.currentQuestion && currentMetrics) {
      generateNextQuestion()
    }
  }, [interviewFlow.isInitialized, interviewFlow.currentQuestion, currentMetrics])

  const generateNextQuestion = async () => {
    if (!currentMetrics || !interviewFlow.canGenerateNext) return

    try {
      const question = await interviewFlow.generateNextQuestion(currentMetrics, responseHistory)
      onQuestionGenerated?.(question)
    } catch (error) {
      console.error('Failed to generate question:', error)
    }
  }

  const handleQuestionComplete = (response: string) => {
    if (!interviewFlow.currentQuestion || !currentMetrics) return

    // Add to response history
    const responseEntry = {
      question: interviewFlow.currentQuestion.text,
      response,
      metrics: currentMetrics,
      responseTime: 120000, // Mock response time
      timestamp: Date.now()
    }

    setResponseHistory(prev => [...prev, responseEntry])
    interviewFlow.addResponseToHistory(
      responseEntry.question,
      responseEntry.response,
      responseEntry.metrics,
      responseEntry.responseTime
    )

    onQuestionCompleted?.(interviewFlow.currentQuestion, response, currentMetrics)

    // Generate next question if not complete
    if (!interviewFlow.isInterviewComplete) {
      setTimeout(() => generateNextQuestion(), 1000)
    }
  }

  if (!interviewFlow.isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Brain className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Initializing adaptive question system...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (interviewFlow.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{interviewFlow.error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Interview Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Adaptive Interview</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                Question {interviewFlow.questionHistory.length} of {interviewConfig.targetQuestions}
              </Badge>
              <Badge variant="outline">
                {interviewFlow.progressPercentage}% Complete
              </Badge>
            </div>
          </div>
          <Progress value={interviewFlow.progressPercentage} className="mt-2" />
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Question */}
        <div className="lg:col-span-2 space-y-4">
          {interviewFlow.currentQuestion ? (
            <QuestionDisplay
              question={interviewFlow.currentQuestion}
              isActive={true}
              onComplete={() => handleQuestionComplete('Mock response for demonstration')}
            />
          ) : interviewFlow.isInterviewComplete ? (
            <Card>
              <CardContent className="text-center p-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Interview Complete!</h3>
                <p className="text-muted-foreground">
                  All {interviewConfig.targetQuestions} questions have been completed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center p-8">
                <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Generating Next Question</h3>
                <p className="text-muted-foreground">
                  AI is analyzing your performance to select the optimal next question...
                </p>
                <Button onClick={generateNextQuestion} className="mt-4">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Generate Question
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Question History */}
          {interviewFlow.questionHistory.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Previous Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {interviewFlow.questionHistory.slice(0, -1).map((question, index) => (
                    <div key={question.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <Badge variant="secondary" className="text-xs">
                        Q{index + 1}
                      </Badge>
                      <span className="text-sm flex-1">{question.text}</span>
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Candidate Insights */}
        <div>
          {interviewFlow.candidateProfile && (
            <CandidateInsights
              profile={interviewFlow.candidateProfile}
              progress={interviewFlow.interviewProgress}
              adaptationInsights={interviewFlow.adaptationInsights}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default AdaptiveQuestionInterface
