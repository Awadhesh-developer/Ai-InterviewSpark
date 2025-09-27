'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { aiInterviewService, InterviewQuestion, InterviewResponse, ResponseAnalysis } from '@/services/aiInterviewService'
import RealTimeFeedback, { RealTimeFeedbackData, FeedbackAlert } from '@/components/interview/RealTimeFeedback'
import { realTimeFeedbackService } from '@/services/realTimeFeedbackService'
import { recordingService, RecordingSegment } from '@/services/recordingService'
import {
  Play,
  Pause,
  Square,
  SkipForward,
  ArrowLeft,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Clock,
  Brain,
  Target,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Award,
  RefreshCw,
  Settings,
  Eye,
  BarChart3
} from 'lucide-react'

interface InterviewState {
  isActive: boolean
  currentQuestionIndex: number
  isRecording: boolean
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  startTime?: Date
  responses: InterviewResponse[]
  showRealTimeFeedback: boolean
  recordingSessionId?: string
  recordedSegments: RecordingSegment[]
}

export default function InterviewPracticePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const mode = searchParams.get('mode') // 'audio' | 'text' | undefined
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  
  const [interviewState, setInterviewState] = useState<InterviewState>({
    isActive: false,
    currentQuestionIndex: 0,
    isRecording: false,
    isVideoEnabled: mode === 'audio' || mode === 'text' ? false : true,
    isAudioEnabled: mode === 'text' ? false : true,
    responses: [],
    showRealTimeFeedback: true,
    recordedSegments: []
  })

  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [bankSize, setBankSize] = useState<number>(20)
  const [currentAnalysis, setCurrentAnalysis] = useState<ResponseAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [questionError, setQuestionError] = useState<string | null>(null)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [showResults, setShowResults] = useState(false)

  // Real-time feedback state
  const [realTimeFeedback, setRealTimeFeedback] = useState<RealTimeFeedbackData>({
    confidence: 75,
    clarity: 75,
    pace: 75,
    eyeContact: 75,
    posture: 75,
    fillerWords: 0,
    engagement: 75,
    timestamp: Date.now()
  })
  const [feedbackAlerts, setFeedbackAlerts] = useState<FeedbackAlert[]>([])
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(true)

  useEffect(() => {
    let shouldLoadQuestions = true
        // Load session info from sessionStorage if available
    const storedInterview = sessionStorage.getItem('interviewSetup')
    if (storedInterview) {
      try {
        const interviewData = JSON.parse(storedInterview)
        setSessionInfo(interviewData)
        console.log('📋 Loaded interview setup from session storage:', interviewData)
                // If questions are already generated, use them
        if (interviewData.questions && interviewData.questions.length > 0) {
          console.log('✅ Using pre-generated questions from session storage')
          setQuestions(interviewData.questions)
          setIsLoadingQuestions(false)
          shouldLoadQuestions = false
        }
      } catch (error) {
        console.error('Error parsing stored interview data:', error)
      }
    }

    // Only load questions if we didn't get them from storage
    if (shouldLoadQuestions) {
      // Small delay to ensure sessionInfo is set
      setTimeout(() => {
        loadQuestions()
      }, 100)
    }

    // Subscribe to real-time feedback
    const unsubscribe = realTimeFeedbackService.subscribe((data, alerts) => {
      setRealTimeFeedback(data)
      setFeedbackAlerts(prev => [...prev, ...alerts])
    })

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      realTimeFeedbackService.stopAnalysis()
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (interviewState.isActive && interviewState.startTime) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - interviewState.startTime!.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [interviewState.isActive, interviewState.startTime])

  const loadQuestions = async () => {
    try {
      setIsLoadingQuestions(true)
      setQuestionError(null)
      console.log('🔍 loadQuestions called with:', {
        sessionId,
        sessionInfo: sessionInfo ? {
          jobTitle: sessionInfo.jobTitle,
          industry: sessionInfo.industry,
          company: sessionInfo.company
        } : null
      })
      if (sessionId) {
        console.log(`🔍 Loading questions for session: ${sessionId}`)
        // Try to get questions from existing session first
        try {
          const sessionQuestions = await aiInterviewService.getQuestionsForSession(sessionId)
          if (sessionQuestions && sessionQuestions.length > 0) {
            console.log(`✅ Loaded ${sessionQuestions.length} questions from session`)
            setQuestions(sessionQuestions)
            setIsLoadingQuestions(false)
            return
          }
        } catch (sessionError) {
          console.log('📝 No existing questions found, generating new ones...')
          console.error('Session error:', sessionError)
        }
      }
      // If no sessionId or no existing questions, generate new ones with intelligent system
      console.log('🧠 Generating new intelligent questions with params:', {
        jobTitle: sessionInfo?.jobTitle || 'Software Engineer',
        industry: sessionInfo?.industry || 'Technology',
        company: sessionInfo?.company,
        difficulty: sessionInfo?.difficulty || 'medium',
        count: sessionInfo?.count || 5,
        types: sessionInfo?.questionTypes || ['behavioral', 'technical', 'situational'],
        llmProvider: sessionInfo?.llmProvider || 'auto'
      })
      const generatedQuestions = await aiInterviewService.generateQuestions({
        jobTitle: sessionInfo?.jobTitle || 'Software Engineer',
        industry: sessionInfo?.industry || 'Technology',
        company: sessionInfo?.company,
        difficulty: sessionInfo?.difficulty || 'medium',
        count: sessionInfo?.count || 5,
        types: sessionInfo?.questionTypes || ['behavioral', 'technical', 'situational'],
        jobDescription: sessionInfo?.jobDescription,
        llmProvider: sessionInfo?.llmProvider || 'auto', // Use user's selected LLM
        includeIdealAnswers: true,
        sessionId: sessionId || undefined
      })
      console.log(`✅ Generated ${generatedQuestions.length} intelligent questions:`, generatedQuestions)
      setQuestions(generatedQuestions)
      // Update session ID if we got one from generation
      const newSessionId = aiInterviewService.getCurrentSessionId()
      if (newSessionId && !sessionId) {
        // Update URL with new session ID
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('sessionId', newSessionId)
        window.history.replaceState({}, '', newUrl.toString())
      }
        } catch (error) {
          console.error('❌ Error loading questions:', error)
          setQuestionError(error instanceof Error ? error.message : 'Failed to load questions')
          console.log('🔄 Using fallback questions due to error')
          // Fallback to basic questions if everything fails
          setQuestions([
            {
              id: 'fallback-1',
              question: 'Tell me about yourself and your background.',
              type: 'behavioral',
              difficulty: 'easy',
                category: 'Introduction',
                expectedDuration: 120,
          tips: ['Keep it concise', 'Focus on relevant experience', 'End with why you\'re interested in this role'],
          source: 'curated' as const
        },
        {
          id: 'fallback-2',
          question: 'Describe a challenging technical problem you solved recently.',
          type: 'technical',
          difficulty: 'medium',
          category: 'Problem Solving',
          expectedDuration: 180,
          tips: ['Use the STAR method', 'Explain your thought process', 'Include the outcome'],
          source: 'curated' as const
        },
        {
          id: 'fallback-3',
          question: 'Where do you see yourself in 5 years?',
          type: 'behavioral',
          difficulty: 'medium', 
          category: 'Career Goals',
          expectedDuration: 120,
          tips: ['Be realistic', 'Show ambition', 'Connect to the role'],
          source: 'curated' as const
        }
      ])
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  const initializeMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: interviewState.isVideoEnabled,
        audio: interviewState.isAudioEnabled
      })
      
      setStream(mediaStream)
      
      if (videoRef.current && interviewState.isVideoEnabled) {
        videoRef.current.srcObject = mediaStream
      }
      
      return mediaStream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      throw error
    }
  }

  const startInterview = async () => {
    try {
      const mediaStream = await initializeMedia()

      // Start recording session
      const sessionId = await recordingService.startSession({
        userId: 'current-user-id', // In real app, get from auth context
        sessionName: `Interview Practice - ${new Date().toLocaleDateString()}`,
        interviewType: 'technical', // Could be dynamic based on user selection
        jobRole: 'Software Engineer', // Could be dynamic
        difficulty: 'intermediate' // Could be dynamic
      })

      // Start real-time feedback analysis
      if (interviewState.showRealTimeFeedback) {
        realTimeFeedbackService.startAnalysis(mediaStream, {
          enableAudio: interviewState.isAudioEnabled,
          enableVideo: interviewState.isVideoEnabled,
          analysisInterval: 2000 // Analyze every 2 seconds
        })
      }

      setInterviewState(prev => ({
        ...prev,
        isActive: true,
        startTime: new Date(),
        recordingSessionId: sessionId
      }))
    } catch (error) {
      console.error('Error starting interview:', error)
    }
  }

  const startRecording = async () => {
    if (!stream || !currentQuestion) return

    try {
      await recordingService.startRecording(
        stream,
        currentQuestion.id,
        currentQuestion.question,
        {
          mimeType: 'video/webm;codecs=vp9,opus',
          videoBitsPerSecond: 2500000,
          audioBitsPerSecond: 128000
        }
      )

      setInterviewState(prev => ({ ...prev, isRecording: true }))
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  // Shuffle current question order and reset progress
  const shuffleQuestions = () => {
    setQuestions((prev) => {
      const arr = [...prev]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    })
    setInterviewState((prev) => ({
      ...prev,
      currentQuestionIndex: 0,
      responses: [],
    }))
    setCurrentAnalysis(null)
    setCurrentAnswer('')
    setTimeElapsed(0)
  }

  // Restart with a fresh, larger question bank emphasizing real-life scenarios
  const restartWithFreshSet = async () => {
    try {
      // Stop recording and analysis if active
      if (interviewState.isRecording) {
        await stopRecording()
      }
      realTimeFeedbackService.stopAnalysis()
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }

      // Reset state
      setInterviewState((prev) => ({
        ...prev,
        isActive: false,
        isRecording: false,
        startTime: undefined,
        currentQuestionIndex: 0,
        responses: [],
        recordedSegments: [],
      }))
      setCurrentAnalysis(null)
      setCurrentAnswer('')
      setTimeElapsed(0)

      // Regenerate with larger bank and more situational/company-specific focus
      setIsLoadingQuestions(true)
      const fresh = await aiInterviewService.generateQuestions({
        jobTitle: sessionInfo?.jobTitle || 'Software Engineer',
        industry: sessionInfo?.industry || 'Technology',
        company: sessionInfo?.company,
        difficulty: sessionInfo?.difficulty || 'medium',
        count: bankSize,
        types: Array.from(
          new Set([...(sessionInfo?.questionTypes || ['behavioral', 'technical', 'situational']), 'situational', 'company-specific'])
        ),
        jobDescription: sessionInfo?.jobDescription,
        llmProvider: sessionInfo?.llmProvider || 'auto',
        includeIdealAnswers: true,
        sessionId: sessionId || undefined,
      })

      // Deduplicate by question text
      const seen = new Set<string>()
      const unique = fresh.filter((q) => {
        const key = q.question.toLowerCase().replace(/[^\w\s]/g, '').trim()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      // Shuffle the fresh bank
      for (let i = unique.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[unique[i], unique[j]] = [unique[j], unique[i]]
      }

      setQuestions(unique)
    } catch (e) {
      console.error('Error restarting with fresh question bank:', e)
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  const stopRecording = async () => {
    try {
      const recordedSegment = await recordingService.stopRecording()

      setInterviewState(prev => ({
        ...prev,
        isRecording: false,
        recordedSegments: recordedSegment ? [...prev.recordedSegments, recordedSegment] : prev.recordedSegments
      }))

      if (currentQuestion && recordedSegment) {
        setIsAnalyzing(true)

        // Analyze the recorded segment
        const analyzedSegment = await recordingService.analyzeSegment(recordedSegment)

        // Create mock response for compatibility with existing code
        const mockResponse: InterviewResponse = {
          questionId: currentQuestion.id,
          response: analyzedSegment.transcript || 'Recorded response',
          duration: (analyzedSegment.endTime - analyzedSegment.startTime) / 1000,
          transcript: analyzedSegment.transcript
        }

        // Use the analysis from the recording service
        const analysis: ResponseAnalysis = {
          score: analyzedSegment.analysis?.confidence || 75,
          keywordMatch: 80, // Default value
          confidence: analyzedSegment.analysis?.confidence || 75,
          clarity: analyzedSegment.analysis?.clarity || 75,
          structure: 80, // Default value
          relevance: 85, // Default value
          strengths: analyzedSegment.analysis?.keyPoints || [],
          improvements: analyzedSegment.analysis?.improvements || [],
          suggestions: ['Continue practicing with similar questions']
        }

        setCurrentAnalysis(analysis)

        setInterviewState(prev => ({
          ...prev,
          responses: [...prev.responses, mockResponse]
        }))

        // Update session score
        const newScore = (sessionScore * interviewState.responses.length + analysis.score) / (interviewState.responses.length + 1)
        setSessionScore(newScore)

        setIsAnalyzing(false)
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
      setIsAnalyzing(false)
    }
  }

  const analyzeResponse = async (audioUrl: string) => {
    if (questions.length === 0) return

    setIsAnalyzing(true)
    try {
      const currentQuestion = questions[interviewState.currentQuestionIndex]
      const mockResponse = "I believe this is a great opportunity to demonstrate my problem-solving skills. In my previous role, I encountered a similar situation where I had to work with a team to deliver a critical project. I took the initiative to organize daily standups and implemented a new tracking system that improved our efficiency by 25%. The result was that we delivered the project two weeks ahead of schedule and received positive feedback from stakeholders."

      const analysis = await aiInterviewService.analyzeResponse(
        currentQuestion,
        mockResponse,
        audioUrl,
        120
      )

      const newResponse: InterviewResponse = {
        questionId: currentQuestion.id,
        response: mockResponse,
        duration: 120,
        audioUrl,
        analysis
      }

      setInterviewState(prev => ({
        ...prev,
        responses: [...prev.responses, newResponse]
      }))

      setCurrentAnalysis(analysis)
      
      // Update session score
      const allResponses = [...interviewState.responses, newResponse]
      const avgScore = allResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / allResponses.length
      setSessionScore(avgScore)

    } catch (error) {
      console.error('Error analyzing response:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const nextQuestion = () => {
    if (interviewState.currentQuestionIndex < questions.length - 1) {
      setInterviewState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }))
      setCurrentAnalysis(null)
    } else {
      finishInterview()
    }
  }

  const finishInterview = async () => {
    try {
      // Stop any active recording
      if (interviewState.isRecording) {
        await stopRecording()
      }

      // Stop real-time feedback
      realTimeFeedbackService.stopAnalysis()

      // End the recording session
      const recordingSession = await recordingService.endSession()

      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      if (recordingSession) {
        // Save the recording session
        const recordingId = await recordingService.saveRecording(recordingSession)
        console.log('Recording saved with ID:', recordingId)

        // Navigate to the recording detail page
        router.push(`/dashboard/recordings/${recordingSession.id}`)
      } else {
        // Generate final feedback for non-recorded sessions
        const feedback = await aiInterviewService.generateFeedback(interviewState.responses)
        // Store results in sessionStorage for the results page
        sessionStorage.setItem('interviewResults', JSON.stringify({
          score: sessionScore,
          feedback,
          responses: interviewState.responses,
          duration: timeElapsed
        }))
        router.push('/dashboard/interviews/results')
      }
    } catch (error) {
      console.error('Error finishing interview:', error)
      router.push('/dashboard/interviews')
    }
  }

  const toggleVideo = () => {
    setInterviewState(prev => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }))
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !interviewState.isVideoEnabled
      }
    }
  }

  const toggleAudio = () => {
    setInterviewState(prev => ({ ...prev, isAudioEnabled: !prev.isAudioEnabled }))
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !interviewState.isAudioEnabled
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 70) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const dismissAlert = (alertId: string) => {
    setFeedbackAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  const toggleFeedbackPanel = () => {
    setShowFeedbackPanel(prev => !prev)
  }

  const toggleRealTimeFeedback = () => {
    setInterviewState(prev => ({
      ...prev,
      showRealTimeFeedback: !prev.showRealTimeFeedback
    }))

    if (!interviewState.showRealTimeFeedback && stream) {
      realTimeFeedbackService.startAnalysis(stream, {
        enableAudio: interviewState.isAudioEnabled,
        enableVideo: interviewState.isVideoEnabled,
        analysisInterval: 2000
      })
    } else {
      realTimeFeedbackService.stopAnalysis()
    }
  }

  const currentQuestion = questions[interviewState.currentQuestionIndex]

  // Phase 6.1: Targeted practice CTA based on weak live metric
  const weakArea = (() => {
    if (!realTimeFeedback) return null
    if (realTimeFeedback.clarity < 60) return { key: 'clarity', label: 'Clarity', tip: 'Project your voice and articulate clearly.' }
    if (realTimeFeedback.pace < 55) return { key: 'pace', label: 'Pace', tip: 'Aim for ~150–160 wpm; shorten sentences.' }
    if (realTimeFeedback.eyeContact < 60 && interviewState.isVideoEnabled) return { key: 'eye', label: 'Eye Contact', tip: 'Look at the camera lens periodically.' }
    if (realTimeFeedback.fillerWords > 3) return { key: 'filler', label: 'Filler Words', tip: 'Pause 1s instead of “um/uh”.' }
    return null
  })()

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span>AI Interview Practice</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Practice with real-time AI feedback and analysis
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-lg text-foreground">{formatTime(timeElapsed)}</span>
          </div>
          {sessionScore > 0 && (
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-primary" />
              <span className={`font-bold ${getScoreColor(sessionScore)}`}>
                {sessionScore.toFixed(0)}%
              </span>
            </div>
          )}
          {weakArea && (
            <div className="hidden md:flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">Weak:</span>
              <span className="text-sm font-medium text-foreground">{weakArea.label}</span>
              <Button size="sm" variant="outline" onClick={() => alert(`${weakArea.label}: ${weakArea.tip}`)}>
                Practice Tip
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Question {interviewState.currentQuestionIndex + 1} of {questions.length}
            </span>
            <Badge variant="outline">
              {Math.round(((interviewState.currentQuestionIndex + 1) / questions.length) * 100)}% Complete
            </Badge>
          </div>
          <Progress value={((interviewState.currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Interview Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video/Audio Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Video className="h-5 w-5 text-blue-600" />
                <span>Interview Session</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Video Display */}
              <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
                {interviewState.isVideoEnabled ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <VideoOff className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                
                {/* Recording Indicator */}
                {interviewState.isRecording && (
                  <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Recording</span>
                  </div>
                )}

                {/* Controls Overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                  <Button
                    size="sm"
                    variant={interviewState.isVideoEnabled ? "default" : "secondary"}
                    onClick={toggleVideo}
                  >
                    {interviewState.isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant={interviewState.isAudioEnabled ? "default" : "secondary"}
                    onClick={toggleAudio}
                  >
                    {interviewState.isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant={interviewState.showRealTimeFeedback ? "default" : "secondary"}
                    onClick={toggleRealTimeFeedback}
                    title="Toggle Real-time Feedback"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Interview Controls */}
              <div className="flex items-center justify-center space-x-4">
                {!interviewState.isActive ? (
                  <Button onClick={startInterview} size="lg" className="flex items-center space-x-2">
                    <Play className="h-5 w-5" />
                    <span>Start Interview</span>
                  </Button>
                ) : (
                  <>
                    {!interviewState.isRecording ? (
                      <Button onClick={startRecording} size="lg" className="flex items-center space-x-2">
                        <Play className="h-5 w-5" />
                        <span>Start Recording</span>
                      </Button>
                    ) : (
                      <Button onClick={stopRecording} size="lg" variant="destructive" className="flex items-center space-x-2">
                        <Square className="h-5 w-5" />
                        <span>Stop Recording</span>
                      </Button>
                    )}
                    <Button onClick={nextQuestion} variant="outline" size="lg" className="flex items-center space-x-2">
                      <SkipForward className="h-5 w-5" />
                      <span>Next Question</span>
                    </Button>
                    <Button onClick={shuffleQuestions} variant="secondary" size="lg" className="flex items-center space-x-2">
                      <RefreshCw className="h-5 w-5" />
                      <span>Shuffle</span>
                    </Button>
                    <Button onClick={restartWithFreshSet} variant="outline" size="lg" className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Restart</span>
                    </Button>
                  </>
                )}
              </div>
              {/* Bank size selector */}
              <div className="flex items-center justify-center space-x-2 pt-2">
                <span className="text-xs text-muted-foreground">Bank Size:</span>
                <select
                  value={bankSize}
                  onChange={(e) => setBankSize(Number(e.target.value))}
                  className="text-xs border rounded px-2 py-1 bg-background"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Current Question */}
          {currentQuestion && !isLoadingQuestions && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <span>Interview Question</span>
                    <Badge variant="secondary" className="text-xs">
                      {(currentQuestion as any).llmProvider === 'perplexity' ? '🧠 Perplexity' : 
                       (currentQuestion as any).llmProvider === 'openai' ? '🤖 GPT-4' :
                       (currentQuestion as any).llmProvider === 'gemini' ? '🔮 Gemini' :
                       (currentQuestion.source === 'curated' ? '📝 Template' : '✨ AI-Generated')}
                    </Badge>
                  </CardTitle>
                  <Badge variant="outline">{currentQuestion.type}</Badge>
                </div>
                <CardDescription>
                  Category: {currentQuestion.category} • Expected time: {currentQuestion.expectedDuration}s
                  {currentQuestion.companySpecific && (
                    <Badge variant="outline" className="ml-2 text-xs">Company-Specific</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-lg font-medium text-foreground p-4 bg-muted/50 rounded-lg">
                  {currentQuestion.question}
                </div>
                
                {/* Answer Input */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Your Answer:</h4>
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your answer here... (or use voice/video recording)"
                    className="w-full min-h-[120px] p-3 border rounded-lg resize-vertical"
                  />
                </div>
                
                {currentQuestion.tips && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center space-x-2">
                      <Lightbulb className="h-4 w-4 text-yellow-600" />
                      <span>Tips for answering:</span>
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {currentQuestion.tips.map((tip, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-600">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* STAR Framework Guidance */}
                {currentQuestion.starFramework && currentQuestion.type === 'behavioral' && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm text-blue-800">STAR Framework Guidance:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                      <div><strong>Situation:</strong> {currentQuestion.starFramework.situation}</div>
                      <div><strong>Task:</strong> {currentQuestion.starFramework.task}</div>
                      <div><strong>Action:</strong> {currentQuestion.starFramework.action}</div>
                      <div><strong>Result:</strong> {currentQuestion.starFramework.result}</div>
                    </div>
                  </div>
                )}

                {/* Question Actions */}
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setInterviewState(prev => ({ ...prev, currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1) }))}
                    disabled={interviewState.currentQuestionIndex === 0}
                  >
                    Previous Question
                  </Button>
                  <Button 
                    onClick={nextQuestion}
                    disabled={!currentAnswer.trim()}
                  >
                    {interviewState.currentQuestionIndex === questions.length - 1 ? 'Complete Interview' : 'Next Question'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Interview Results */}
        {showResults && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-green-600" />
                <span>Interview Complete - Results & Feedback</span>
              </CardTitle>
              <CardDescription>
                Review your answers and get detailed feedback with ideal responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {interviewState.responses.map((response: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    <Badge variant="outline" className="text-xs">
                      {response.feedback?.scoringCriteria?.technical || 'N/A'}% Technical
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <strong>Q:</strong> {response.question}
                  </div>
                  
                  <div className="text-sm">
                    <strong>Your Answer:</strong>
                    <div className="mt-1 p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                      {response.answer}
                    </div>
                  </div>
                  
                  {response.feedback?.idealAnswer && (
                    <div className="text-sm">
                      <strong>Ideal Answer:</strong>
                      <div className="mt-1 p-3 bg-green-50 rounded border-l-4 border-green-500">
                        {response.feedback.idealAnswer}
                      </div>
                    </div>
                  )}
                  
                  {response.feedback?.keyPoints && (
                    <div className="text-sm">
                      <strong>Key Points to Include:</strong>
                      <ul className="mt-1 list-disc list-inside text-gray-600">
                        {response.feedback.keyPoints.map((point: string, i: number) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {response.feedback?.improvementSuggestions && (
                    <div className="text-sm">
                      <strong>Improvement Suggestions:</strong>
                      <ul className="mt-1 list-disc list-inside text-orange-600">
                        {response.feedback.improvementSuggestions.map((suggestion: string, i: number) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="flex justify-center space-x-4 pt-6">
                <Button onClick={() => router.push('/dashboard/interviews')}>
                  Back to Interviews
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Start New Practice
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis Sidebar */}
        {!showResults && (
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
            {/* Real-time Feedback Panel */}
            {showFeedbackPanel && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span>Live Feedback</span>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFeedbackPanel(false)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <RealTimeFeedback
                  isActive={interviewState.isActive && interviewState.showRealTimeFeedback}
                  currentData={realTimeFeedback}
                  alerts={feedbackAlerts}
                  onDismissAlert={dismissAlert}
                  showDetailedMetrics={true}
                />
              </div>
            )}

            {/* Traditional AI Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <span>AI Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2">Analyzing response...</span>
                  </div>
                ) : currentAnalysis ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Response Score</span>
                      <span className={`text-lg font-bold ${getScoreColor(currentAnalysis.score)}`}>
                        {currentAnalysis.score}%
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Clarity</span>
                        <span>{currentAnalysis.clarity}%</span>
                      </div>
                      <Progress value={currentAnalysis.clarity} className="h-1" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Structure</span>
                        <span>{currentAnalysis.structure}%</span>
                      </div>
                      <Progress value={currentAnalysis.structure} className="h-1" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Relevance</span>
                        <span>{currentAnalysis.relevance}%</span>
                      </div>
                      <Progress value={currentAnalysis.relevance} className="h-1" />
                    </div>

                    {currentAnalysis.strengths.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-green-600 mb-2">Strengths:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {currentAnalysis.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {currentAnalysis.improvements.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-orange-600 mb-2">Improvements:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {currentAnalysis.improvements.map((improvement, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <AlertCircle className="h-3 w-3 text-orange-600 mt-0.5" />
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Start recording to get AI feedback</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Session Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(sessionScore)}`}>
                    {sessionScore.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Questions Completed</span>
                    <span>{interviewState.responses.length}/{questions.length}</span>
                  </div>
                  <Progress value={(interviewState.responses.length / questions.length) * 100} className="h-2" />
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{formatTime(timeElapsed)}</div>
                  <div className="text-sm text-gray-600">Time Elapsed</div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  <span>Quick Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Maintain eye contact with the camera</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Use the STAR method for behavioral questions</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Speak clearly and at a moderate pace</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Include specific examples and results</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        )}
      </div>
    </div>
  )
}
