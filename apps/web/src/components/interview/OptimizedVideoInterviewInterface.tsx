'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Eye,
  User,
  Brain,
  Activity,
  Award,
  BarChart3
} from 'lucide-react'
import { useInterviewVoice } from '@/hooks/useVoiceInteraction'
import { useInterviewFacialAnalysis } from '@/hooks/useFacialAnalysis'
import { useInterviewGazeTracking } from '@/hooks/useGazeTracking'
import { useInterviewBodyLanguage } from '@/hooks/useBodyLanguageAnalysis'
import { useInterviewAnalytics } from '@/hooks/useUnifiedAnalytics'
import AnalyticsDashboard from './AnalyticsDashboard'
import FacialAnalysisDisplay from './FacialAnalysisDisplay'
import GazeTrackingDisplay from './GazeTrackingDisplay'
import BodyLanguageDisplay from './BodyLanguageDisplay'
import GazeCalibrationInterface from './GazeCalibrationInterface'
import { type InterviewContext } from '@/services/realtimeSpeechService'

interface OptimizedVideoInterviewInterfaceProps {
  interviewContext: InterviewContext
  questions: string[]
  onTranscriptionReceived?: (transcription: string) => void
  onQuestionCompleted?: (questionIndex: number, transcription: string, analysisData?: any) => void
  onInterviewCompleted?: (results: OptimizedInterviewResults) => void
  className?: string
}

interface OptimizedInterviewResults {
  transcriptions: string[]
  unifiedMetrics: any
  performanceInsights: any
  systemPerformance: any
  overallScore: number
  componentScores: {
    voice: number
    facial: number
    gaze: number
    bodyLanguage: number
  }
}

interface VideoState {
  isVideoEnabled: boolean
  isRecording: boolean
  hasPermissions: boolean
  error: string | null
}

export function OptimizedVideoInterviewInterface({
  interviewContext,
  questions,
  onTranscriptionReceived,
  onQuestionCompleted,
  onInterviewCompleted,
  className = ''
}: OptimizedVideoInterviewInterfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analysisIntervalRef = useRef<number | null>(null)
  
  // Analysis hooks
  const voiceState = useInterviewVoice(interviewContext)
  const facialAnalysis = useInterviewFacialAnalysis(videoRef.current)
  const gazeTracking = useInterviewGazeTracking()
  const bodyLanguage = useInterviewBodyLanguage(videoRef.current)
  const analytics = useInterviewAnalytics()
  
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
  const [needsCalibration, setNeedsCalibration] = useState(true)
  const [activeTab, setActiveTab] = useState('analytics')

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

  // Optimized analysis processing
  const processAnalysisData = useCallback(async () => {
    try {
      // Collect data from all analysis systems
      const analysisData = {
        facial: facialAnalysis.currentResult,
        gaze: gazeTracking.currentGaze ? {
          ...gazeTracking.currentGaze,
          metrics: gazeTracking.attentionMetrics
        } : undefined,
        bodyLanguage: bodyLanguage.currentResult,
        voice: {
          clarity: 0.8, // Mock voice data - would come from voice analysis
          pace: 0.7,
          volume: 0.8,
          confidence: 0.75,
          engagement: 0.8
        }
      }

      // Process through unified analytics
      if (analytics.isInitialized) {
        await analytics.processAnalysisData(analysisData)
      }
    } catch (error) {
      console.error('Error processing analysis data:', error)
    }
  }, [facialAnalysis.currentResult, gazeTracking.currentGaze, gazeTracking.attentionMetrics, bodyLanguage.currentResult, analytics])

  // Start optimized analysis loop
  const startAnalysisLoop = useCallback(() => {
    if (analysisIntervalRef.current) return

    analysisIntervalRef.current = window.setInterval(() => {
      processAnalysisData()
    }, 500) // Process every 500ms for optimal performance
  }, [processAnalysisData])

  // Stop analysis loop
  const stopAnalysisLoop = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }
  }, [])

  // Process gaze data from facial analysis
  useEffect(() => {
    if (facialAnalysis.currentResult?.eyeTrackingData && gazeTracking.isTracking) {
      const eyeData = facialAnalysis.currentResult.eyeTrackingData
      gazeTracking.processGazeData(eyeData.left, eyeData.right)
    }
  }, [facialAnalysis.currentResult, gazeTracking])

  // Handle transcription updates
  useEffect(() => {
    if (voiceState.transcription?.isFinal) {
      const transcription = voiceState.transcription.text
      onTranscriptionReceived?.(transcription)
      
      // Save transcription and move to next question
      const newTranscriptions = [...transcriptions]
      newTranscriptions[currentQuestionIndex] = transcription
      setTranscriptions(newTranscriptions)
      
      // Get current unified analysis data
      const analysisData = {
        unifiedMetrics: analytics.currentMetrics,
        performanceInsights: analytics.performanceInsights,
        systemHealth: analytics.systemHealth
      }
      
      onQuestionCompleted?.(currentQuestionIndex, transcription, analysisData)
      
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
  }, [voiceState.transcription, currentQuestionIndex, questions, transcriptions, analytics, onQuestionCompleted])

  const completeInterview = useCallback((finalTranscriptions: string[]) => {
    const results: OptimizedInterviewResults = {
      transcriptions: finalTranscriptions,
      unifiedMetrics: analytics.currentMetrics,
      performanceInsights: analytics.performanceInsights,
      systemPerformance: analytics.systemHealth,
      overallScore: analytics.overallScore,
      componentScores: {
        voice: analytics.voiceScore,
        facial: analytics.facialScore,
        gaze: analytics.gazeScore,
        bodyLanguage: analytics.bodyLanguageScore
      }
    }
    
    setIsInterviewActive(false)
    stopRecording()
    onInterviewCompleted?.(results)
  }, [analytics])

  const startInterview = useCallback(async () => {
    try {
      if (!videoState.isVideoEnabled) {
        await initializeVideo()
      }
      
      setIsInterviewActive(true)
      setVideoState(prev => ({ ...prev, isRecording: true }))
      
      // Start all analysis systems
      await voiceState.startListening()
      
      if (gazeTracking.canStartTracking) {
        gazeTracking.startTracking()
      }

      // Start optimized analysis loop
      startAnalysisLoop()
      
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
  }, [videoState.isVideoEnabled, voiceState, gazeTracking, questions, initializeVideo, startAnalysisLoop])

  const stopRecording = useCallback(() => {
    setVideoState(prev => ({ ...prev, isRecording: false }))
    voiceState.stopListening()
    gazeTracking.stopTracking()
    bodyLanguage.stopAnalysis()
    stopAnalysisLoop()
  }, [voiceState, gazeTracking, bodyLanguage, stopAnalysisLoop])

  const stopInterview = useCallback(() => {
    setIsInterviewActive(false)
    stopRecording()
    stopVideo()
  }, [stopRecording, stopVideo])

  const handleCalibrationComplete = useCallback((accuracy: number) => {
    setNeedsCalibration(false)
    console.log('Gaze calibration completed with accuracy:', accuracy)
  }, [])

  const handleCalibrationSkipped = useCallback(() => {
    setNeedsCalibration(false)
    console.log('Gaze calibration skipped')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVideo()
      stopAnalysisLoop()
      gazeTracking.destroy()
      bodyLanguage.stopAnalysis()
      analytics.destroy()
    }
  }, [stopVideo, stopAnalysisLoop, gazeTracking, bodyLanguage, analytics])

  // Show calibration interface if needed
  if (needsCalibration && videoState.isVideoEnabled) {
    return (
      <div className={`space-y-6 ${className}`}>
        <GazeCalibrationInterface
          onCalibrationComplete={handleCalibrationComplete}
          onCalibrationSkipped={handleCalibrationSkipped}
          allowSkip={true}
        />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Video Preview and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <span>Optimized Video Interview</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {videoState.isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full mr-1" />
                  Recording
                </Badge>
              )}
              <Badge variant="outline">
                Score: {Math.round(analytics.overallScore * 100)}%
              </Badge>
              <Badge variant="outline" className={analytics.systemHealthScore > 0.8 ? 'bg-green-50' : 'bg-yellow-50'}>
                System: {Math.round(analytics.systemHealthScore * 100)}%
              </Badge>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      <Video className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                    {facialAnalysis.faceDetected && (
                      <Badge variant="default" className="bg-green-500">
                        <Brain className="h-3 w-3 mr-1" />
                        Face
                      </Badge>
                    )}
                    {gazeTracking.isCalibrated && (
                      <Badge variant="default" className="bg-blue-500">
                        <Eye className="h-3 w-3 mr-1" />
                        Gaze
                      </Badge>
                    )}
                    {bodyLanguage.poseDetected && (
                      <Badge variant="default" className="bg-purple-500">
                        <User className="h-3 w-3 mr-1" />
                        Pose
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
            
            {/* Real-time Performance Indicators */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Real-time Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(analytics.engagementLevel * 100)}%
                      </div>
                      <div className="text-sm text-blue-800">Engagement</div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(analytics.professionalPresence * 100)}%
                      </div>
                      <div className="text-sm text-green-800">Professional Presence</div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(analytics.communicationEffectiveness * 100)}%
                      </div>
                      <div className="text-sm text-purple-800">Communication</div>
                    </div>
                    
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round(analytics.confidenceLevel * 100)}%
                      </div>
                      <div className="text-sm text-orange-800">Confidence</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="facial">Facial</TabsTrigger>
          <TabsTrigger value="gaze">Gaze</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics" className="mt-4">
          <AnalyticsDashboard 
            showDetailedBreakdown={true}
            showPerformanceMetrics={false}
          />
        </TabsContent>
        
        <TabsContent value="facial" className="mt-4">
          <FacialAnalysisDisplay
            videoElement={videoRef.current}
            showDetailedMetrics={showSettings}
          />
        </TabsContent>
        
        <TabsContent value="gaze" className="mt-4">
          <GazeTrackingDisplay
            showHeatmap={true}
            showDetailedMetrics={showSettings}
          />
        </TabsContent>
        
        <TabsContent value="body" className="mt-4">
          <BodyLanguageDisplay
            videoElement={videoRef.current}
            showDetailedMetrics={showSettings}
          />
        </TabsContent>
        
        <TabsContent value="performance" className="mt-4">
          <AnalyticsDashboard 
            showDetailedBreakdown={false}
            showPerformanceMetrics={true}
          />
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {(videoState.error || voiceState.lastError || gazeTracking.error || bodyLanguage.error || analytics.error) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {videoState.error || voiceState.lastError || gazeTracking.error || bodyLanguage.error || analytics.error}
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
            <CardTitle>System Status & Settings</CardTitle>
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
                <span className="font-medium">Analytics:</span>
                <Badge variant={analytics.isInitialized ? "default" : "secondary"} className="ml-2">
                  {analytics.isInitialized ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Processing Time:</span>
                <span className="ml-2">{analytics.processingTime.toFixed(1)}ms</span>
              </div>
              <div>
                <span className="font-medium">Memory Usage:</span>
                <span className="ml-2">{analytics.memoryUsage.toFixed(1)}MB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default OptimizedVideoInterviewInterface
