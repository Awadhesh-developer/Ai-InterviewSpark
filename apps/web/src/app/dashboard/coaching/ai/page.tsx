'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  Brain,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Send,
  Pause,
  Play,
  Square,
  Clock,
  Target,
  TrendingUp,
  Heart,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  MessageCircle,
  Zap
} from 'lucide-react'
import { aiCoachingClient, CreateSessionRequest } from '@/services/aiCoachingClient'
import { AICoachingSession, SessionProgress } from '@/services/aiCoachingSessionService'
import { emotionalIntelligenceService } from '@/services/emotionalIntelligenceService'

export default function AICoachingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'software-engineer'
  
  const [session, setSession] = useState<Partial<AICoachingSession> | null>(null)
  const [progress, setProgress] = useState<SessionProgress | null>(null)
  const [currentResponse, setCurrentResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const [questionCount, setQuestionCount] = useState(0)
  const [emotionalState, setEmotionalState] = useState({
    confidence: 75,
    stress: 30,
    engagement: 80,
    clarity: 70
  })
  
  const [sessionConfig, setSessionConfig] = useState({
    sessionType: 'practice' as const,
    difficulty: 5,
    focusAreas: ['System Design', 'Algorithms'],
    timeLimit: 3600, // 1 hour
    questionCount: 10,
    adaptiveDifficulty: true,
    emotionalAnalysis: true
  })

  const responseTextareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Expert Coaching disabled: redirect to dashboard
    router.replace('/dashboard')
  }, [router])

  // Do not render content when disabled
  return null

  useEffect(() => {
    if (session?.id) {
      // Update progress once when session is created
      updateProgress()

      // Set up periodic updates only if session is active
      if (session.status === 'active') {
        const interval = setInterval(() => {
          updateProgress()
        }, 5000) // Update every 5 seconds instead of 1 second
        return () => clearInterval(interval)
      }
    }
  }, [session?.id, session?.status])

  const initializeSession = async () => {
    try {
      setIsLoading(true)

      // Create a simple demo session without API calls for now
      const demoSession = {
        id: `demo-session-${Date.now()}`,
        role,
        status: 'active' as const,
        startTime: new Date(),
        config: sessionConfig,
        userProfile: {
          level: 'intermediate' as const,
          experience: ['JavaScript', 'React', 'Node.js'],
          weaknesses: ['System Design', 'Algorithms'],
          goals: ['Pass technical interviews', 'Improve problem-solving skills'],
          previousSessions: []
        }
      }

      setSession(demoSession)

      // Generate first demo question
      const demoQuestions = {
        'software-engineer': 'Can you walk me through how you would design a URL shortening service like bit.ly? Consider the system architecture, database design, and scalability requirements.',
        'product-manager': 'How would you prioritize features for a new mobile app with limited engineering resources? Walk me through your decision-making process.',
        'data-scientist': 'Describe how you would approach building a recommendation system for an e-commerce platform. What data would you need and what algorithms would you consider?'
      }

      setCurrentQuestion(demoQuestions[role as keyof typeof demoQuestions] || demoQuestions['software-engineer'])
      setQuestionCount(1)

      // Set initial progress
      setProgress({
        currentQuestionIndex: 1,
        totalQuestions: 10,
        timeElapsed: 0,
        completionPercentage: 10,
        currentDifficulty: sessionConfig.difficulty,
        averageScore: 0,
        recentPerformance: []
      })

      // Start media capture for emotional analysis
      if (sessionConfig.emotionalAnalysis) {
        await startMediaCapture()
      }
    } catch (error) {
      console.error('Error initializing session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProgress = () => {
    if (session && progress) {
      // Update time elapsed
      const timeElapsed = Math.floor((Date.now() - session.startTime!.getTime()) / 1000)
      setProgress(prev => prev ? {
        ...prev,
        timeElapsed,
        completionPercentage: Math.round((questionCount / 10) * 100)
      } : null)
    }
  }

  const startMediaCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      mediaStreamRef.current = stream
      setIsRecording(true)
      
      // Start periodic emotional analysis
      startEmotionalAnalysis()
    } catch (error) {
      console.error('Error accessing media devices:', error)
    }
  }

  const startEmotionalAnalysis = () => {
    setInterval(async () => {
      if (!session || !mediaStreamRef.current) return

      try {
        // Capture audio/video snippets for analysis
        const audioBlob = await captureAudioSnippet()
        const videoBlob = await captureVideoSnippet()
        
        // Process emotional data
        const analysis = await emotionalIntelligenceService.processRealTimeEmotionalData(
          session.id,
          audioBlob,
          videoBlob
        )
        
        // Update emotional state
        const newEmotionalState = {
          confidence: Math.round(analysis.overallState.confidence * 100),
          stress: Math.round(analysis.overallState.stress * 100),
          engagement: Math.round(analysis.overallState.engagement * 100),
          clarity: Math.round(analysis.overallState.clarity * 100)
        }
        
        setEmotionalState(newEmotionalState)
        
        // Update session with emotional data
        await aiCoachingClient.updateEmotionalState(session.id, {
          confidence: analysis.overallState.confidence,
          stress: analysis.overallState.stress,
          engagement: analysis.overallState.engagement,
          clarity: analysis.overallState.clarity
        })
      } catch (error) {
        console.error('Error in emotional analysis:', error)
      }
    }, 5000) // Analyze every 5 seconds
  }

  const submitResponse = async () => {
    if (!session || !currentResponse.trim()) return

    try {
      setIsLoading(true)

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Generate next demo question
      const nextQuestions = [
        'Great! Now let\'s dive deeper. How would you handle caching in your URL shortening service?',
        'Excellent analysis. What about security considerations? How would you prevent abuse?',
        'Good thinking. Now, how would you monitor and scale this system as it grows?',
        'Perfect! Let\'s discuss the database schema. What tables would you create?',
        'Wonderful! How would you handle analytics and click tracking?',
        'Great job! What about rate limiting and API design?',
        'Excellent! How would you implement custom short URLs?',
        'Perfect! What about geographic distribution and CDNs?',
        'Outstanding! How would you handle link expiration?',
        'Fantastic work! You\'ve completed the session successfully!'
      ]

      const nextQuestionIndex = questionCount
      if (nextQuestionIndex < nextQuestions.length) {
        setCurrentQuestion(nextQuestions[nextQuestionIndex])
        setQuestionCount(prev => prev + 1)

        // Update progress
        setProgress(prev => prev ? {
          ...prev,
          currentQuestionIndex: questionCount + 1,
          completionPercentage: Math.round(((questionCount + 1) / 10) * 100),
          averageScore: Math.round(75 + Math.random() * 20), // Simulate score
          recentPerformance: [...prev.recentPerformance, Math.round(70 + Math.random() * 25)]
        } : null)

        // Simulate emotional state changes
        setEmotionalState(prev => ({
          confidence: Math.max(20, Math.min(95, prev.confidence + (Math.random() - 0.3) * 10)),
          stress: Math.max(10, Math.min(80, prev.stress + (Math.random() - 0.6) * 8)),
          engagement: Math.max(30, Math.min(95, prev.engagement + (Math.random() - 0.2) * 5)),
          clarity: Math.max(40, Math.min(95, prev.clarity + (Math.random() - 0.1) * 8))
        }))
      } else {
        // Session complete
        handleSessionComplete()
      }

      // Clear response
      setCurrentResponse('')
    } catch (error) {
      console.error('Error submitting response:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSessionComplete = () => {
    // Navigate to results page
    router.push(`/dashboard/coaching/results?sessionId=${session?.id}`)
  }

  const pauseSession = async () => {
    if (session?.id) {
      const result = await aiCoachingClient.pauseSession(session.id)
      if (result.success) {
        setSession(prev => prev ? { ...prev, status: 'paused' } : null)
      }
    }
  }

  const resumeSession = async () => {
    if (session?.id) {
      const result = await aiCoachingClient.resumeSession(session.id)
      if (result.success) {
        setSession(prev => prev ? { ...prev, status: 'active' } : null)
      }
    }
  }

  const endSession = async () => {
    if (session?.id) {
      await aiCoachingClient.cancelSession(session.id)
      router.push('/dashboard/experts')
    }
  }

  // Mock functions for media capture
  const captureAudioSnippet = async (): Promise<Blob> => {
    return new Blob(['mock audio'], { type: 'audio/wav' })
  }

  const captureVideoSnippet = async (): Promise<Blob> => {
    return new Blob(['mock video'], { type: 'video/mp4' })
  }

  const getEmotionalColor = (value: number, isStress = false) => {
    if (isStress) {
      if (value > 70) return 'text-red-600'
      if (value > 40) return 'text-yellow-600'
      return 'text-green-600'
    } else {
      if (value > 80) return 'text-green-600'
      if (value > 60) return 'text-yellow-600'
      return 'text-red-600'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading && !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Brain className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg font-medium">Initializing AI Coach...</p>
          <p className="text-gray-600">Setting up your personalized coaching session</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/experts')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Experts
            </Button>
            
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-600">
                AI Coach - {role.replace('-', ' ').toUpperCase()}
              </h1>
              {session?.status === 'active' && (
                <Badge variant="outline" className="ml-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Live
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {session?.status === 'active' ? (
              <Button onClick={pauseSession} variant="outline" size="sm">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button onClick={resumeSession} variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
            
            <Button onClick={endSession} variant="destructive" size="sm">
              <Square className="h-4 w-4 mr-2" />
              End Session
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Coaching Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Progress Bar */}
            {progress && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Session Progress</span>
                    <span className="text-sm text-gray-600">
                      {progress.currentQuestionIndex} / {progress.totalQuestions} questions
                    </span>
                  </div>
                  <Progress value={progress.completionPercentage} className="mb-2" />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Time: {formatTime(progress.timeElapsed)}</span>
                    <span>Avg Score: {progress.averageScore}%</span>
                    <span>Difficulty: {progress.currentDifficulty}/10</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Question */}
            {currentQuestion && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                      <span>Current Question</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        Technical
                      </Badge>
                      <Badge variant="outline">
                        Difficulty: {sessionConfig.difficulty}/10
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-lg leading-relaxed">
                      {currentQuestion}
                    </p>

                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Category: {sessionConfig.focusAreas[0] || 'System Design'}
                      </span>
                    </div>

                    {showHints && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">Hints</span>
                        </div>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Think about the core components and their interactions</li>
                          <li>• Consider scalability and performance requirements</li>
                          <li>• Don't forget about data consistency and reliability</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Response Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="h-5 w-5 text-green-600" />
                  <span>Your Response</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    ref={responseTextareaRef}
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    placeholder="Type your response here... Be specific and explain your thinking process."
                    rows={6}
                    className="resize-none"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHints(!showHints)}
                      >
                        <Lightbulb className="h-4 w-4 mr-2" />
                        {showHints ? 'Hide Hints' : 'Show Hints'}
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <Mic className="h-4 w-4 mr-2" />
                        Voice Input
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={submitResponse}
                      disabled={!currentResponse.trim() || isLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Response
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Emotional Intelligence Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Live Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Confidence</span>
                    <span className={`text-sm font-bold ${getEmotionalColor(emotionalState.confidence)}`}>
                      {emotionalState.confidence}%
                    </span>
                  </div>
                  <Progress value={emotionalState.confidence} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Stress Level</span>
                    <span className={`text-sm font-bold ${getEmotionalColor(emotionalState.stress, true)}`}>
                      {emotionalState.stress}%
                    </span>
                  </div>
                  <Progress value={emotionalState.stress} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Engagement</span>
                    <span className={`text-sm font-bold ${getEmotionalColor(emotionalState.engagement)}`}>
                      {emotionalState.engagement}%
                    </span>
                  </div>
                  <Progress value={emotionalState.engagement} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Clarity</span>
                    <span className={`text-sm font-bold ${getEmotionalColor(emotionalState.clarity)}`}>
                      {emotionalState.clarity}%
                    </span>
                  </div>
                  <Progress value={emotionalState.clarity} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <span>Session Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {progress && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Questions Answered</span>
                      <span className="font-medium">{progress.currentQuestionIndex}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Score</span>
                      <span className="font-medium">{progress.averageScore}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Time Elapsed</span>
                      <span className="font-medium">{formatTime(progress.timeElapsed)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Current Difficulty</span>
                      <span className="font-medium">{progress.currentDifficulty}/10</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Media Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Video className="h-5 w-5 text-purple-500" />
                  <span>Media</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Camera</span>
                  <Button variant="outline" size="sm">
                    {isRecording ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Microphone</span>
                  <Button variant="outline" size="sm">
                    {isRecording ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  {isRecording ? 'Recording for emotional analysis' : 'Media access disabled'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
