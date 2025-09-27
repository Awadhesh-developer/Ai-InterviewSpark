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
  Mic,
  Volume2,
  Settings
} from 'lucide-react'
import VoiceInterviewInterface from '@/components/interview/VoiceInterviewInterface'
import { type InterviewContext } from '@/services/realtimeSpeechService'

// Mock interview data - in production, this would come from your API
const mockInterviewData = {
  id: '1',
  title: 'Senior Software Engineer Interview',
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
  duration: 30,
  difficulty: 'medium' as const
}

interface InterviewSession {
  id: string
  startTime: Date
  responses: Array<{
    questionIndex: number
    question: string
    transcription: string
    timestamp: Date
  }>
  isComplete: boolean
}

export default function VoiceInterviewPage() {
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
          id: `session_${Date.now()}`,
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

  const handleQuestionCompleted = (questionIndex: number, transcription: string) => {
    if (!session) return

    const newResponse = {
      questionIndex,
      question: interview.questions[questionIndex],
      transcription,
      timestamp: new Date()
    }

    setSession(prev => prev ? {
      ...prev,
      responses: [...prev.responses, newResponse]
    } : null)

    console.log('Question completed:', newResponse)
  }

  const handleInterviewCompleted = async (transcriptions: string[]) => {
    if (!session) return

    try {
      // Mark session as complete
      setSession(prev => prev ? {
        ...prev,
        isComplete: true
      } : null)

      console.log('Interview completed with transcriptions:', transcriptions)
      
      // In production, save results to API
      // await saveInterviewResults(session.id, transcriptions)
      
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
            <p className="text-muted-foreground">Initializing voice interview...</p>
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
      <div className="max-w-4xl mx-auto">
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
            <Badge variant="default" className="bg-green-500">
              <Mic className="h-3 w-3 mr-1" />
              Voice Interview
            </Badge>
          </div>
        </div>

        {/* Interview Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5" />
              <span>Voice Interview Instructions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p>
                <strong>Welcome to your voice interview!</strong> This is an AI-powered conversation 
                that simulates a real interview experience.
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>The AI interviewer will ask you questions and listen to your responses</li>
                <li>Speak naturally - the system will automatically detect when you start and stop talking</li>
                <li>Take your time to think before answering</li>
                <li>You can pause or stop the interview at any time</li>
                <li>Your responses will be transcribed and analyzed for feedback</li>
              </ul>
              <div className="flex items-center space-x-2 mt-4 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Make sure your microphone is working and you're in a quiet environment
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice Interview Interface */}
        <VoiceInterviewInterface
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
