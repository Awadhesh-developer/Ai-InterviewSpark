'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Video,
  Camera,
  Mic,
  Eye
} from 'lucide-react'
import VideoInterviewInterface from '@/components/interview/VideoInterviewInterface'
import { type InterviewContext } from '@/services/realtimeSpeechService'

// Mock interview data - in production, this would come from your API
const mockInterviewData = {
  id: '1',
  title: 'Senior Software Engineer Video Interview',
  jobTitle: 'Senior Software Engineer',
  company: 'TechCorp',
  questions: [
    "Tell me about yourself and your background in software engineering.",
    "Describe a challenging technical problem you've solved recently.",
    "How do you approach code reviews and ensuring code quality?",
    "Tell me about a time when you had to learn a new technology quickly.",
    "How do you handle disagreements with team members about technical decisions?",
    "What's your experience with system design and scalability?",
    "How do you stay updated with the latest technology trends?",
    "Describe your ideal work environment and team structure."
  ],
  duration: 45,
  difficulty: 'medium' as const
}

interface InterviewSession {
  id: string
  startTime: Date
  responses: Array<{
    questionIndex: number
    question: string
    transcription: string
    facialData: any
    timestamp: Date
  }>
  isComplete: boolean
}

interface InterviewResults {
  transcriptions: string[]
  facialAnalysisSummary: any
  overallEngagement: number
  eyeContactPercentage: number
  emotionalRange: any
}

export default function VideoInterviewPage() {
  const params = useParams()
  const router = useRouter()
  const interviewId = params.id as string
  
  const [interview] = useState(mockInterviewData)
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize interview session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true)
        
        // In production, fetch interview data from API
        // const interviewData = await fetchInterview(interviewId)
        
        // Create new session
        const newSession: InterviewSession = {
          id: `video_session_${Date.now()}`,
          startTime: new Date(),
          responses: [],
          isComplete: false
        }
        
        setSession(newSession)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize interview')
      } finally {
        setIsLoading(false)
      }
    }

    initializeSession()
  }, [interviewId])

  const interviewContext: InterviewContext = {
    sessionId: session?.id || '',
    questionNumber: 1,
    questionType: 'behavioral',
    candidateName: 'Candidate', // In production, get from user profile
    role: interview.jobTitle,
    company: interview.company
  }

  const handleTranscriptionReceived = (transcription: string) => {
    console.log('Transcription received:', transcription)
    // Handle real-time transcription updates if needed
  }

  const handleQuestionCompleted = (questionIndex: number, transcription: string, facialData?: any) => {
    if (!session) return

    const newResponse = {
      questionIndex,
      question: interview.questions[questionIndex],
      transcription,
      facialData: facialData || null,
      timestamp: new Date()
    }

    setSession(prev => prev ? {
      ...prev,
      responses: [...prev.responses, newResponse]
    } : null)

    console.log('Question completed:', newResponse)
  }

  const handleInterviewCompleted = async (results: InterviewResults) => {
    if (!session) return

    try {
      // Mark session as complete
      setSession(prev => prev ? {
        ...prev,
        isComplete: true
      } : null)

      console.log('Video interview completed with results:', results)
      
      // In production, save results to API
      // await saveVideoInterviewResults(session.id, results)
      
      // Navigate to results page
      setTimeout(() => {
        router.push(`/dashboard/interviews/results/${session.id}`)
      }, 2000)
      
    } catch (err) {
      setError('Failed to save interview results')
    }
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard/interviews')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Initializing video interview...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button onClick={handleBackToDashboard} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleBackToDashboard}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{interview.title}</h1>
              <div className="flex items-center space-x-4 mt-1">
                <Badge variant="outline">{interview.jobTitle}</Badge>
                {interview.company && (
                  <Badge variant="outline">{interview.company}</Badge>
                )}
                <Badge variant="secondary">
                  {interview.questions.length} Questions
                </Badge>
                <Badge variant="secondary">
                  {interview.duration} Minutes
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="bg-blue-500">
              <Video className="h-3 w-3 mr-1" />
              Video Interview
            </Badge>
          </div>
        </div>

        {/* Interview Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Video Interview Instructions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                <strong>Welcome to your video interview!</strong> This advanced interview combines 
                AI-powered conversation with real-time facial analysis for comprehensive feedback.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <Mic className="h-4 w-4 mr-2" />
                    Voice Features
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Real-time AI conversation</li>
                    <li>Natural speech recognition</li>
                    <li>Automatic question progression</li>
                    <li>Voice tone analysis</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Video Analysis
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Facial expression recognition</li>
                    <li>Eye contact tracking</li>
                    <li>Professional presence assessment</li>
                    <li>Engagement metrics</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 p-4 bg-blue-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Before you begin:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Ensure good lighting on your face</li>
                    <li>Position yourself centered in the camera frame</li>
                    <li>Test your microphone and camera</li>
                    <li>Find a quiet environment</li>
                    <li>Maintain eye contact with the camera</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Interview Interface */}
        <VideoInterviewInterface
          interviewContext={interviewContext}
          questions={interview.questions}
          onTranscriptionReceived={handleTranscriptionReceived}
          onQuestionCompleted={handleQuestionCompleted}
          onInterviewCompleted={handleInterviewCompleted}
        />

        {/* Session Info */}
        {session && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  Session ID: {session.id}
                </div>
                <div>
                  Started: {session.startTime.toLocaleTimeString()}
                </div>
                <div>
                  Responses: {session.responses.length} / {interview.questions.length}
                </div>
                {session.isComplete && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Complete</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
