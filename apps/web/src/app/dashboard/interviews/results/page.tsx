'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InterviewFeedback, InterviewResponse } from '@/services/aiInterviewService'
import {
  ArrowLeft,
  Download,
  Share2,
  RefreshCw,
  Award,
  TrendingUp,
  Target,
  Brain,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Lightbulb,
  Star,
  Users,
  Zap,
  BookOpen,
  Play
} from 'lucide-react'

interface InterviewResults {
  score: number
  feedback: InterviewFeedback
  responses: InterviewResponse[]
  duration: number
}

export default function InterviewResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [results, setResults] = useState<InterviewResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      // Phase 7: Prefer server metrics if sessionId is provided
      const sessionId = searchParams.get('sessionId')
      if (sessionId) {
        try {
          // dynamic import to avoid SSR mismatch
          const client = (await import('@/lib/api')).apiClient
          const session: any = await client.getInterviewSession(sessionId)
          const metrics = Array.isArray((session as any).performanceMetrics) && (session as any).performanceMetrics[0]
            ? (session as any).performanceMetrics[0]
            : null
          if (metrics) {
            const scorePct = Math.round((parseFloat(metrics.overallScore || '0') * 10))
            const cat = metrics.categoryScores || {}
            const toPct = (v: any) => Math.round(((Number(v) || 0) * 10))
            const transformed: InterviewResults = {
              score: scorePct,
              feedback: {
                overallScore: scorePct,
                categoryScores: {
                  communication: toPct(cat.communication),
                  technical: toPct(cat.technical),
                  behavioral: toPct(cat.behavioral),
                  cultural: toPct(cat.cultural)
                },
                strengths: metrics.strengths || [],
                improvements: metrics.improvementAreas || [],
                recommendations: metrics.recommendations || [],
                nextSteps: ['Practice targeted set', 'Review STAR templates']
              },
              responses: [],
              duration: metrics.sessionDuration || 0
            }
            setResults(transformed)
            return
          }
        } catch (e) {
          console.error('Failed to load server metrics, falling back to local:', e)
        }
      }

      const storedResults = typeof window !== 'undefined' ? sessionStorage.getItem('interviewResults') : null
      if (storedResults) {
        const parsedResults = JSON.parse(storedResults)
        setResults(parsedResults)
      } else {
        // Fallback mock data if no stored results
        setResults({
          score: 82,
          feedback: {
            overallScore: 82,
            categoryScores: {
              communication: 85,
              technical: 78,
              behavioral: 84,
              cultural: 80
            },
            strengths: [
              'Clear and confident communication',
              'Well-structured responses using STAR method',
              'Strong technical knowledge demonstration',
              'Good use of specific examples',
              'Professional demeanor throughout'
            ],
            improvements: [
              'Include more quantifiable results',
              'Elaborate on leadership experiences',
              'Prepare more diverse examples'
            ],
            recommendations: [
              { title: 'Improve structure with STAR', description: 'Use STAR to organize behavioral answers.', actionItems: ['Draft 3 STAR stories', 'Time each to 90s'], priority: 'high' },
              { title: 'Add quantifiable evidence', description: 'Include metrics to show impact.', actionItems: ['Add 1–2 metrics to each story'], priority: 'medium' }
            ],
            nextSteps: [
              'You\'re ready for real interviews!',
              'Focus on company-specific preparation',
              'Practice with industry-specific questions'
            ]
          },
          responses: [],
          duration: 1800 // 30 minutes
        })
      }
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, label: 'Excellent' }
    if (score >= 80) return { variant: 'default' as const, label: 'Very Good' }
    if (score >= 70) return { variant: 'secondary' as const, label: 'Good' }
    if (score >= 60) return { variant: 'secondary' as const, label: 'Fair' }
    return { variant: 'destructive' as const, label: 'Needs Improvement' }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const downloadReport = () => {
    // Generate and download PDF report
    console.log('Downloading interview report...')
  }

  const shareResults = () => {
    // Share results functionality
    console.log('Sharing results...')
  }

  const retakeInterview = () => {
    router.push('/dashboard/interviews/practice')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading results...</span>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Results Found</h3>
        <p className="text-gray-500 mb-4">Unable to load interview results.</p>
        <Button onClick={() => router.push('/dashboard/interviews')}>
          Back to Interviews
        </Button>
      </div>
    )
  }

  const scoreBadge = getScoreBadge(results.score)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/interviews')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Interviews</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-600 flex items-center space-x-2">
              <Award className="h-8 w-8 text-yellow-600" />
              <span>Interview Results</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive AI analysis of your interview performance
            </p>
          </div>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={shareResults}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" onClick={downloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button onClick={retakeInterview}>
            <Play className="mr-2 h-4 w-4" />
            Practice Again
          </Button>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <div className={`text-6xl font-bold ${getScoreColor(results.score)}`}>
                {results.score}%
              </div>
              <div className="text-left">
                <Badge variant={scoreBadge.variant} className="text-lg px-4 py-2">
                  {scoreBadge.label}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">Overall Performance</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {results.feedback.categoryScores.communication}%
                </div>
                <div className="text-sm text-gray-600">Communication</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.feedback.categoryScores.technical}%
                </div>
                <div className="text-sm text-gray-600">Technical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {results.feedback.categoryScores.behavioral}%
                </div>
                <div className="text-sm text-gray-600">Behavioral</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {results.feedback.categoryScores.cultural}%
                </div>
                <div className="text-sm text-gray-600">Cultural Fit</div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Duration: {formatDuration(results.duration)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Questions: {results.responses.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>AI Analysis Complete</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>Performance Breakdown</span>
              </CardTitle>
              <CardDescription>
                Detailed analysis of your performance across different categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(results.feedback.categoryScores).map(([category, score]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{category}</span>
                    <span className={`font-bold ${getScoreColor(score)}`}>{score}%</span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Strengths and Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Key Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.feedback.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>Areas for Improvement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.feedback.improvements.map((improvement, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <span className="text-sm">{improvement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {/* Question-by-Question Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span>Question-by-Question Analysis</span>
              </CardTitle>
              <CardDescription>
                Detailed AI feedback for each interview question
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.responses.length > 0 ? (
                <div className="space-y-6">
                  {results.responses.map((response, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Question {index + 1}</h4>
                        {response.analysis && (
                          <Badge variant={response.analysis.score >= 80 ? 'default' : 'secondary'}>
                            {response.analysis.score}%
                          </Badge>
                        )}
                      </div>
                      
                      {response.analysis && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Clarity:</span>
                              <span className="ml-2 font-medium">{response.analysis.clarity}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Structure:</span>
                              <span className="ml-2 font-medium">{response.analysis.structure}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Relevance:</span>
                              <span className="ml-2 font-medium">{response.analysis.relevance}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Confidence:</span>
                              <span className="ml-2 font-medium">{response.analysis.confidence}%</span>
                            </div>
                          </div>

                          {response.analysis.suggestions.length > 0 && (
                            <div>
                              <h5 className="font-medium text-sm mb-2">AI Suggestions:</h5>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {response.analysis.suggestions.map((suggestion, suggestionIndex) => (
                                  <li key={suggestionIndex} className="flex items-start space-x-2">
                                    <Lightbulb className="h-3 w-3 text-yellow-600 mt-0.5" />
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No detailed response analysis available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <span>AI Recommendations</span>
              </CardTitle>
              <CardDescription>
                Personalized suggestions to improve your interview performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray((results as any).feedback?.recommendations) && (results as any).feedback.recommendations.map((rec: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        <h4 className="font-medium text-gray-700">{rec.title || 'Recommendation'}</h4>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{rec.priority || 'medium'}</span>
                    </div>
                    {rec.description && <p className="text-sm text-gray-600 mb-2">{rec.description}</p>}
                    {Array.isArray(rec.actionItems) && rec.actionItems.length > 0 && (
                      <ul className="list-disc ml-5 text-sm text-gray-600">
                        {rec.actionItems.map((a: string, i: number) => <li key={i}>{a}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Practice Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span>Recommended Practice Areas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Technical Questions</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Practice more technical deep-dive questions and system design scenarios
                  </p>
                  <Button size="sm" variant="outline">Practice Now</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Behavioral Stories</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Develop more compelling stories using the STAR method
                  </p>
                  <Button size="sm" variant="outline">Practice Now</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Company Research</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Research company-specific scenarios and culture
                  </p>
                  <Button size="sm" variant="outline">Learn More</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Communication Skills</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Work on clarity, pace, and professional presentation
                  </p>
                  <Button size="sm" variant="outline">Practice Now</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="next-steps" className="space-y-6">
          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Your Next Steps</span>
              </CardTitle>
              <CardDescription>
                Recommended actions based on your performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.feedback.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                    <Star className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-600">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span>Immediate Action Items</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Schedule More Practice Sessions</h4>
                    <p className="text-sm text-gray-600">Continue practicing to maintain momentum</p>
                  </div>
                  <Button onClick={retakeInterview}>
                    <Play className="mr-2 h-4 w-4" />
                    Practice Now
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Download Your Report</h4>
                    <p className="text-sm text-gray-600">Save this analysis for future reference</p>
                  </div>
                  <Button variant="outline" onClick={downloadReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Share Your Progress</h4>
                    <p className="text-sm text-gray-600">Share your improvement with mentors or peers</p>
                  </div>
                  <Button variant="outline" onClick={shareResults}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
