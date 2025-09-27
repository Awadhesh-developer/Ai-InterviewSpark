'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square,
  Settings,
  AlertCircle,
  CheckCircle,
  Camera,
  Monitor
} from 'lucide-react'
import { useInterviewVoice } from '@/hooks/useVoiceInteraction'
import { useFacialAnalysis } from '@/hooks/useFacialAnalysis'
import FacialAnalysisDisplay from './FacialAnalysisDisplay'
import { type InterviewContext } from '@/services/realtimeSpeechService'

interface VideoInterviewInterfaceProps {
  interviewContext: InterviewContext
  questions: string[]
  onTranscriptionReceived?: (transcription: string) => void
  onQuestionCompleted?: (questionIndex: number, transcription: string, facialData?: any) => void
  onInterviewCompleted?: (results: InterviewResults) => void
  className?: string
}

interface InterviewResults {
  transcriptions: string[]
  facialAnalysisSummary: any
  overallEngagement: number
  eyeContactPercentage: number
  emotionalRange: any
}

interface VideoState {
  isVideoEnabled: boolean
  isRecording: boolean
  hasPermissions: boolean
  error: string | null
}

export function VideoInterviewInterface({
  interviewContext,
  questions,
  onTranscriptionReceived,
  onQuestionCompleted,
  onInterviewCompleted,
  className = ''
}: VideoInterviewInterfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const voiceState = useInterviewVoice(interviewContext)
  const [facialState, facialActions] = useFacialAnalysis({ autoInitialize: true })
  
  const [videoState, setVideoState] = useState<VideoState>({
    isVideoEnabled: false,
    isRecording: false,
    hasPermissions: false,
    error: null
  })
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [transcriptions, setTranscriptions] = useState<string[]>([])
  const [isInterviewActive, setIsInterviewActive] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Initialize video stream
  const initializeVideo = useCallback(async () => {
    try {
      setVideoState(prev => ({ ...prev, error: null }))
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false // Audio is handled by voice service
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve()
          }
        })
        
        setVideoState(prev => ({ 
          ...prev, 
          isVideoEnabled: true, 
          hasPermissions: true 
        }))
      }
    } catch (error) {
      console.error('Failed to initialize video:', error)
      setVideoState(prev => ({ 
        ...prev, 
        error: 'Failed to access camera. Please check permissions.',
        hasPermissions: false
      }))
    }
  }, [])

  // Stop video stream
  const stopVideo = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setVideoState(prev => ({ 
      ...prev, 
      isVideoEnabled: false, 
      isRecording: false 
    }))
  }, [])

  // Handle transcription updates
  useEffect(() => {
    if (voiceState.transcription?.isFinal) {
      const transcription = voiceState.transcription.text
      onTranscriptionReceived?.(transcription)
      
      // Save transcription and move to next question
      const newTranscriptions = [...transcriptions]
      newTranscriptions[currentQuestionIndex] = transcription
      setTranscriptions(newTranscriptions)
      
      // Get current facial analysis data
      const facialData = facialActions.getSummary()
      
      onQuestionCompleted?.(currentQuestionIndex, transcription, facialData)
      
      // Move to next question or complete interview
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1)
          voiceState.askQuestion(questions[currentQuestionIndex + 1])
        }, 2000)
      } else {
        completeInterview(newTranscriptions)
      }
    }
  }, [voiceState.transcription, currentQuestionIndex, questions, transcriptions, facialActions, onQuestionCompleted])

  const completeInterview = useCallback((finalTranscriptions: string[]) => {
    const facialSummary = facialActions.getSummary()
    
    const results: InterviewResults = {
      transcriptions: finalTranscriptions,
      facialAnalysisSummary: facialSummary,
      overallEngagement: facialSummary?.averageEngagement || 0,
      eyeContactPercentage: facialSummary?.eyeContactPercentage || 0,
      emotionalRange: facialSummary?.emotionalRange || {}
    }
    
    setIsInterviewActive(false)
    stopRecording()
    onInterviewCompleted?.(results)
  }, [facialActions, onInterviewCompleted])

  const startInterview = useCallback(async () => {
    try {
      if (!videoState.isVideoEnabled) {
        await initializeVideo()
      }
      
      setIsInterviewActive(true)
      setVideoState(prev => ({ ...prev, isRecording: true }))
      
      // Start voice and facial analysis
      await voiceState.startListening()
      
      if (videoRef.current && facialState.isInitialized) {
        await facialActions.startAnalysis(videoRef.current)
      }
      
      // Ask first question
      if (questions.length > 0) {
        await voiceState.askQuestion(questions[0])
      }
    } catch (error) {
      console.error('Failed to start interview:', error)
      setVideoState(prev => ({ 
        ...prev, 
        error: 'Failed to start interview. Please check your camera and microphone permissions.' 
      }))
    }
  }, [videoState.isVideoEnabled, voiceState, facialState.isInitialized, facialActions, questions, initializeVideo])

  const stopRecording = useCallback(() => {
    setVideoState(prev => ({ ...prev, isRecording: false }))
    voiceState.stopListening()
    facialActions.stopAnalysis()
  }, [voiceState, facialActions])

  const stopInterview = useCallback(() => {
    setIsInterviewActive(false)
    stopRecording()
    stopVideo()
  }, [stopRecording, stopVideo])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVideo()
      facialActions.destroy()
    }
  }, [stopVideo, facialActions])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Video Preview and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <span>Video Interview</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {videoState.isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full mr-1" />
                  Recording
                </Badge>
              )}
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
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video Preview */}
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!videoState.isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Camera not active</p>
                    </div>
                  </div>
                )}
                
                {/* Video overlay indicators */}
                {videoState.isVideoEnabled && (
                  <div className="absolute top-4 left-4 flex space-x-2">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      <Monitor className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                    {facialState.currentResult?.faceDetected && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Face
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              {/* Video Controls */}
              <div className="flex items-center justify-center space-x-4">
                {!isInterviewActive ? (
                  <Button
                    onClick={videoState.isVideoEnabled ? startInterview : initializeVideo}
                    size="lg"
                    className="px-8"
                  >
                    {videoState.isVideoEnabled ? (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Start Interview
                      </>
                    ) : (
                      <>
                        <Camera className="h-5 w-5 mr-2" />
                        Enable Camera
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={videoState.isRecording ? stopRecording : startInterview}
                      variant={videoState.isRecording ? "destructive" : "default"}
                      size="lg"
                    >
                      {videoState.isRecording ? (
                        <>
                          <Pause className="h-5 w-5 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={stopInterview}
                      variant="outline"
                      size="lg"
                    >
                      <Square className="h-5 w-5 mr-2" />
                      Stop Interview
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* Facial Analysis Display */}
            <div>
              <FacialAnalysisDisplay
                videoElement={videoRef.current}
                showDetailedMetrics={showSettings}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {(videoState.error || voiceState.lastError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {videoState.error || voiceState.lastError}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Question */}
      {isInterviewActive && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
              <Badge variant="outline">
                {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4">{questions[currentQuestionIndex]}</p>
            
            {/* Voice Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {voiceState.isListening ? (
                  <Mic className="h-4 w-4 text-green-500" />
                ) : (
                  <MicOff className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">
                  {voiceState.isListening ? 'Listening...' : 'Not listening'}
                </span>
              </div>
              
              {voiceState.isSpeaking && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-sm">AI Speaking</span>
                </div>
              )}
            </div>
            
            {/* Current Transcription */}
            {voiceState.transcription && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Your Response:</p>
                <p className="text-base">{voiceState.transcription.text}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Video Status:</span>
                <Badge variant={videoState.isVideoEnabled ? "default" : "secondary"} className="ml-2">
                  {videoState.isVideoEnabled ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Voice Service:</span>
                <Badge variant="outline" className="ml-2">
                  {voiceState.activeService}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Face Detection:</span>
                <Badge variant={facialState.currentResult?.faceDetected ? "default" : "secondary"} className="ml-2">
                  {facialState.currentResult?.faceDetected ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Analysis Rate:</span>
                <span className="ml-2">2 Hz</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default VideoInterviewInterface
