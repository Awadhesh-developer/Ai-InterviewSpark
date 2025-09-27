'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Brain,
  Heart,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Download,
  Share,
  RefreshCw,
  Star
} from 'lucide-react'
import { aiCoachingClient } from '@/services/aiCoachingClient'
import { AICoachingSession } from '@/services/aiCoachingSessionService'

export default function CoachingResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  
  const [session, setSession] = useState<Partial<AICoachingSession> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId) {
      loadSessionResults()
    } else {
      setError('No session ID provided')
      setIsLoading(false)
    }
  }, [sessionId])

  const loadSessionResults = async () => {
    if (!sessionId) return

    try {
      setIsLoading(true)
      const result = await aiCoachingClient.getSession(sessionId)
      
      if (result.success && result.session) {
        setSession(result.session)
      } else {
        setError(result.error || 'Failed to load session results')
      }
    } catch (error) {
      console.error('Error loading session results:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const startNewSession = () => {
    router.push(`/dashboard/coaching/ai?role=${session?.role || 'software-engineer'}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading session results...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-red-600">Error Loading Results</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard/experts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Experts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/experts')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Experts
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-600 flex items-center space-x-2">
                <Trophy className="h-8 w-8 text-yellow-600" />
                <span>Session Results</span>
              </h1>
              <p className="text-gray-600 mt-1">
                {session.role?.replace('-', ' ').toUpperCase()} • {session.sessionType?.replace('-', ' ').toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline" size="sm">
              <Share className="mr-2 h-4 w-4" />
              Share Results
            </Button>
            <Button onClick={startNewSession} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="mr-2 h-4 w-4" />
              Start New Session
            </Button>
          </div>
        </div>

        {/* Overall Score */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className={`text-6xl font-bold ${getScoreColor(session.summary?.overallScore || 0)}`}>
                  {session.summary?.overallScore || 0}
                </div>
                <div className="text-2xl text-gray-500 ml-2">/ 100</div>
              </div>
              <Badge className={`text-lg px-4 py-2 ${getScoreBadgeColor(session.summary?.overallScore || 0)}`}>
                {session.summary?.estimatedLevel?.toUpperCase() || 'INTERMEDIATE'}
              </Badge>
              <p className="text-gray-600 mt-2">Overall Performance Score</p>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-600">
                {session.performance?.questionsAnswered || 0}
              </div>
              <p className="text-sm text-gray-600">Questions Answered</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-600">
                {formatDuration(session.duration || 0)}
              </div>
              <p className="text-sm text-gray-600">Session Duration</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Brain className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-600">
                {session.analytics?.llmCalls || 0}
              </div>
              <p className="text-sm text-gray-600">AI Interactions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-600">
                {session.emotionalData?.states?.length || 0}
              </div>
              <p className="text-sm text-gray-600">Emotional Checkpoints</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Strengths & Improvements */}
          <div className="space-y-6">
            {/* Key Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Key Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.summary?.keyStrengths?.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                      <p className="text-sm">{strength}</p>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-sm">No specific strengths identified</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <span>Areas for Improvement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.summary?.areasForImprovement?.map((area, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                      <p className="text-sm">{area}</p>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-sm">No specific improvements identified</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Analytics */}
          <div className="space-y-6">
            {/* Score Progression */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Performance Progression</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Score</span>
                    <span className={`font-bold ${getScoreColor(session.performance?.averageScore || 0)}`}>
                      {session.performance?.averageScore || 0}%
                    </span>
                  </div>
                  <Progress value={session.performance?.averageScore || 0} className="h-2" />
                  
                  {session.performance?.scores && session.performance.scores.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Score History</p>
                      <div className="flex items-end space-x-1 h-16">
                        {session.performance.scores.map((score, index) => (
                          <div
                            key={index}
                            className="bg-blue-200 rounded-t flex-1 min-w-0"
                            style={{ height: `${(score / 100) * 100}%` }}
                            title={`Question ${index + 1}: ${score}%`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emotional Journey */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  <span>Emotional Journey</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {session.emotionalData?.overallTrends ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Confidence Change</span>
                      <div className="flex items-center space-x-1">
                        {session.emotionalData.overallTrends.confidenceChange > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(Math.round(session.emotionalData.overallTrends.confidenceChange * 100))}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Stress Change</span>
                      <div className="flex items-center space-x-1">
                        {session.emotionalData.overallTrends.stressChange < 0 ? (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(Math.round(session.emotionalData.overallTrends.stressChange * 100))}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Engagement Change</span>
                      <div className="flex items-center space-x-1">
                        {session.emotionalData.overallTrends.engagementChange > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(Math.round(session.emotionalData.overallTrends.engagementChange * 100))}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No emotional data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommendations & Next Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <span>Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {session.summary?.recommendations?.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                )) || (
                  <p className="text-gray-500 text-sm">No specific recommendations available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Next Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {session.summary?.nextSteps?.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                )) || (
                  <p className="text-gray-500 text-sm">No specific next steps available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4 mt-8">
          <Button 
            onClick={startNewSession}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Start Another Session
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/analytics')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/experts')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Experts
          </Button>
        </div>
      </div>
    </div>
  )
}
