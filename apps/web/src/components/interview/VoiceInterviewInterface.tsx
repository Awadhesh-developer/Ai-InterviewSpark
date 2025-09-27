'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Radio
} from 'lucide-react'
import { useInterviewVoice } from '@/hooks/useVoiceInteraction'
import { type InterviewContext } from '@/services/realtimeSpeechService'

interface VoiceInterviewInterfaceProps {
  interviewContext: InterviewContext
  questions: string[]
  onTranscriptionReceived?: (transcription: string) => void
  onQuestionCompleted?: (questionIndex: number, transcription: string) => void
  onInterviewCompleted?: (transcriptions: string[]) => void
  className?: string
}

interface InterviewProgress {
  currentQuestionIndex: number
  transcriptions: string[]
  isComplete: boolean
}

export function VoiceInterviewInterface({
  interviewContext,
  questions,
  onTranscriptionReceived,
  onQuestionCompleted,
  onInterviewCompleted,
  className = ''
}: VoiceInterviewInterfaceProps) {
  const voiceState = useInterviewVoice(interviewContext)
  
  const [progress, setProgress] = useState<InterviewProgress>({
    currentQuestionIndex: 0,
    transcriptions: [],
    isComplete: false
  })
  
  const [isInterviewActive, setIsInterviewActive] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentTranscription, setCurrentTranscription] = useState('')

  // Handle transcription updates
  useEffect(() => {
    if (voiceState.transcription) {
      const transcriptionText = voiceState.transcription.text
      setCurrentTranscription(transcriptionText)
      onTranscriptionReceived?.(transcriptionText)
      
      // If this is a final transcription, save it
      if (voiceState.transcription.isFinal) {
        handleTranscriptionComplete(transcriptionText)
      }
    }
  }, [voiceState.transcription])

  const handleTranscriptionComplete = useCallback((transcription: string) => {
    const newTranscriptions = [...progress.transcriptions]
    newTranscriptions[progress.currentQuestionIndex] = transcription
    
    setProgress(prev => ({
      ...prev,
      transcriptions: newTranscriptions
    }))
    
    onQuestionCompleted?.(progress.currentQuestionIndex, transcription)
    
    // Move to next question or complete interview
    if (progress.currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        moveToNextQuestion()
      }, 2000) // Brief pause before next question
    } else {
      completeInterview(newTranscriptions)
    }
  }, [progress, questions.length, onQuestionCompleted])

  const moveToNextQuestion = useCallback(async () => {
    const nextIndex = progress.currentQuestionIndex + 1
    
    setProgress(prev => ({
      ...prev,
      currentQuestionIndex: nextIndex
    }))
    
    setCurrentTranscription('')
    
    // Ask the next question
    if (nextIndex < questions.length) {
      await voiceState.askQuestion(questions[nextIndex])
    }
  }, [progress.currentQuestionIndex, questions, voiceState])

  const completeInterview = useCallback((transcriptions: string[]) => {
    setProgress(prev => ({
      ...prev,
      isComplete: true
    }))
    
    setIsInterviewActive(false)
    voiceState.stopListening()
    onInterviewCompleted?.(transcriptions)
  }, [voiceState, onInterviewCompleted])

  const startInterview = useCallback(async () => {
    try {
      setIsInterviewActive(true)
      await voiceState.startListening()
      
      // Ask the first question
      if (questions.length > 0) {
        await voiceState.askQuestion(questions[0])
      }
    } catch (error) {
      console.error('Failed to start interview:', error)
      setIsInterviewActive(false)
    }
  }, [voiceState, questions])

  const stopInterview = useCallback(() => {
    setIsInterviewActive(false)
    voiceState.stopListening()
    voiceState.stopSpeaking()
  }, [voiceState])

  const toggleListening = useCallback(async () => {
    if (voiceState.isListening) {
      voiceState.stopListening()
    } else {
      await voiceState.startListening()
    }
  }, [voiceState])

  const getCurrentQuestion = () => {
    return questions[progress.currentQuestionIndex] || ''
  }

  const getProgressPercentage = () => {
    return (progress.currentQuestionIndex / questions.length) * 100
  }

  const getServiceStatusColor = () => {
    if (!voiceState.isInitialized) return 'bg-gray-500'
    if (voiceState.activeService === 'realtime') return 'bg-green-500'
    if (voiceState.activeService === 'fallback') return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getServiceStatusText = () => {
    if (!voiceState.isInitialized) return 'Initializing...'
    if (voiceState.activeService === 'realtime') return 'OpenAI Realtime'
    if (voiceState.activeService === 'fallback') return 'Web Speech API'
    return 'No Service'
  }

  if (!voiceState.isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Initializing voice services...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Service Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Voice Interview System</CardTitle>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getServiceStatusColor()}`} />
              <span className="text-sm text-muted-foreground">{getServiceStatusText()}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showSettings && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Active Service:</span>
                <Badge variant="outline" className="ml-2">
                  {voiceState.activeService}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Calibrated:</span>
                <Badge variant={voiceState.isCalibrated ? "default" : "secondary"} className="ml-2">
                  {voiceState.isCalibrated ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Error Display */}
      {voiceState.lastError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{voiceState.lastError}</AlertDescription>
        </Alert>
      )}

      {/* Interview Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Interview Progress</CardTitle>
            <Badge variant="outline">
              {progress.currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
          <Progress value={getProgressPercentage()} className="w-full" />
        </CardHeader>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <CardTitle>Current Question</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-4">{getCurrentQuestion()}</p>
          
          {/* Voice Activity Indicator */}
          {voiceState.vadResult && (
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <Radio className={`h-4 w-4 ${voiceState.vadResult.isSpeaking ? 'text-green-500' : 'text-gray-400'}`} />
                <span className="text-sm">Voice Activity</span>
              </div>
              <div className="flex-1">
                <Progress value={voiceState.vadResult.energy * 100} className="h-2" />
              </div>
              <span className="text-sm text-muted-foreground">
                {Math.round(voiceState.vadResult.confidence * 100)}%
              </span>
            </div>
          )}
          
          {/* Current Transcription */}
          {currentTranscription && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Your Response:</p>
              <p className="text-base">{currentTranscription}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4">
            {!isInterviewActive ? (
              <Button
                onClick={startInterview}
                size="lg"
                className="px-8"
                disabled={progress.isComplete}
              >
                {progress.isComplete ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Interview Complete
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5 mr-2" />
                    Start Interview
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={toggleListening}
                  variant={voiceState.isListening ? "default" : "outline"}
                  size="lg"
                >
                  {voiceState.isListening ? (
                    <>
                      <Mic className="h-5 w-5 mr-2" />
                      Listening
                    </>
                  ) : (
                    <>
                      <MicOff className="h-5 w-5 mr-2" />
                      Start Listening
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={voiceState.isSpeaking ? voiceState.stopSpeaking : undefined}
                  variant={voiceState.isSpeaking ? "default" : "outline"}
                  size="lg"
                  disabled={!voiceState.isSpeaking}
                >
                  {voiceState.isSpeaking ? (
                    <>
                      <VolumeX className="h-5 w-5 mr-2" />
                      Stop Speaking
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-5 w-5 mr-2" />
                      AI Speaking
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={stopInterview}
                  variant="destructive"
                  size="lg"
                >
                  Stop Interview
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Previous Responses */}
      {progress.transcriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progress.transcriptions.map((transcription, index) => (
                transcription && (
                  <div key={index} className="border-l-4 border-primary pl-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      Question {index + 1}: {questions[index]}
                    </p>
                    <p className="text-base">{transcription}</p>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default VoiceInterviewInterface
