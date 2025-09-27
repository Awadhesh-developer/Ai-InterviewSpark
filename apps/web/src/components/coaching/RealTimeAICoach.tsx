'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Brain, 
  Heart, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Lightbulb
} from 'lucide-react'
import { advancedAICoachService } from '@/services/advancedAICoachService'
import { emotionalIntelligenceService } from '@/services/emotionalIntelligenceService'
import {
  RealTimeFeedback,
  EmotionalState,
  CoachingSession,
  EmotionalAnalysis as AdvancedEmotionalAnalysis
} from '@/services/advancedAICoachService'
import { EmotionalAnalysis } from '@/services/emotionalIntelligenceService'

interface RealTimeAICoachProps {
  userId: string
  role: string
  sessionType: 'practice' | 'mock-interview' | 'skill-assessment'
  onSessionComplete?: (session: CoachingSession) => void
}

interface LiveMetrics {
  confidence: number
  stress: number
  engagement: number
  clarity: number
  overallScore: number
}

export default function RealTimeAICoach({ 
  userId, 
  role, 
  sessionType, 
  onSessionComplete 
}: RealTimeAICoachProps) {
  const [isActive, setIsActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentSession, setCurrentSession] = useState<CoachingSession | null>(null)
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    confidence: 75,
    stress: 30,
    engagement: 80,
    clarity: 70,
    overallScore: 74
  })
  const [realtimeFeedback, setRealtimeFeedback] = useState<RealTimeFeedback[]>([])
  const [emotionalStates, setEmotionalStates] = useState<EmotionalState[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const [adaptiveSuggestions, setAdaptiveSuggestions] = useState<string[]>([])

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start coaching session
  const startSession = useCallback(async () => {
    try {
      const session = await advancedAICoachService.startCoachingSession({
        userId,
        sessionType,
        role,
        focusAreas: []
      })
      
      setCurrentSession(session)
      setIsActive(true)
      
      // Start media capture
      await startMediaCapture()
      
      // Begin real-time analysis
      startRealTimeAnalysis()
      
    } catch (error) {
      console.error('Error starting coaching session:', error)
    }
  }, [userId, sessionType, role])

  // Start media capture
  const startMediaCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      mediaStreamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing media devices:', error)
    }
  }

  // Start real-time analysis
  const startRealTimeAnalysis = () => {
    analysisIntervalRef.current = setInterval(async () => {
      if (!currentSession || !mediaStreamRef.current) return

      try {
        // Capture audio/video snippets for analysis
        const audioBlob = await captureAudioSnippet()
        const videoBlob = await captureVideoSnippet()
        
        // Process emotional data
        const analysis = await emotionalIntelligenceService.processRealTimeEmotionalData(
          currentSession.id,
          audioBlob,
          videoBlob
        )
        
        // Update live metrics
        updateLiveMetrics(analysis)
        
        // Process AI coaching feedback
        const feedback = await advancedAICoachService.processEmotionalData(
          currentSession.id,
          {
            confidence: analysis.overallState.confidence,
            stress: analysis.overallState.stress,
            engagement: analysis.overallState.engagement,
            clarity: analysis.overallState.clarity
          }
        )
        
        // Update UI with feedback
        setRealtimeFeedback(prev => [...prev.slice(-4), ...feedback])
        setEmotionalStates(prev => [...prev.slice(-10), analysis.overallState])
        
        // Generate adaptive suggestions
        generateAdaptiveSuggestions(analysis)
        
      } catch (error) {
        console.error('Error in real-time analysis:', error)
      }
    }, 3000) // Analyze every 3 seconds
  }

  // Update live metrics
  const updateLiveMetrics = (analysis: EmotionalAnalysis) => {
    const state = analysis.overallState
    setLiveMetrics({
      confidence: Math.round(state.confidence * 100),
      stress: Math.round(state.stress * 100),
      engagement: Math.round(state.engagement * 100),
      clarity: Math.round(state.clarity * 100),
      overallScore: Math.round((state.confidence + state.engagement + state.clarity + (1 - state.stress)) * 25)
    })
  }

  // Generate adaptive suggestions
  const generateAdaptiveSuggestions = (analysis: EmotionalAnalysis) => {
    const suggestions: string[] = []
    const state = analysis.overallState
    
    if (state.confidence < 0.5) {
      suggestions.push('Speak with more conviction - you know more than you think!')
    }
    
    if (state.stress > 0.6) {
      suggestions.push('Take a deep breath and slow down your pace')
    }
    
    if (state.engagement < 0.4) {
      suggestions.push('Lean forward and make more eye contact with the camera')
    }
    
    if (state.clarity < 0.5) {
      suggestions.push('Organize your thoughts using the STAR method')
    }
    
    setAdaptiveSuggestions(suggestions)
  }

  // Stop session
  const stopSession = async () => {
    try {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current)
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
      
      setIsActive(false)
      setIsRecording(false)
      
      if (currentSession && onSessionComplete) {
        onSessionComplete(currentSession)
      }
    } catch (error) {
      console.error('Error stopping session:', error)
    }
  }

  // Mock functions for media capture (implement with actual media processing)
  const captureAudioSnippet = async (): Promise<Blob> => {
    // Mock implementation - in production, capture actual audio
    return new Blob(['mock audio'], { type: 'audio/wav' })
  }

  const captureVideoSnippet = async (): Promise<Blob> => {
    // Mock implementation - in production, capture actual video frames
    return new Blob(['mock video'], { type: 'video/mp4' })
  }

  // Get metric color based on value
  const getMetricColor = (value: number, isStress = false) => {
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

  // Get feedback priority icon
  const getFeedbackIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'medium': return <Lightbulb className="h-4 w-4 text-yellow-500" />
      default: return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Session Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>AI Coach - {sessionType.replace('-', ' ').toUpperCase()}</span>
            {isActive && (
              <Badge variant="outline" className="ml-auto">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                Live
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {!isActive ? (
              <Button onClick={startSession} className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>Start AI Coaching Session</span>
              </Button>
            ) : (
              <Button onClick={stopSession} variant="destructive" className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>End Session</span>
              </Button>
            )}
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className={isRecording ? 'text-red-600' : 'text-gray-600'}
              >
                {isRecording ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={isRecording ? 'text-blue-600' : 'text-gray-600'}
              >
                {isRecording ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isActive && (
        <>
          {/* Live Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Confidence</p>
                    <p className={`text-2xl font-bold ${getMetricColor(liveMetrics.confidence)}`}>
                      {liveMetrics.confidence}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
                <Progress value={liveMetrics.confidence} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Stress Level</p>
                    <p className={`text-2xl font-bold ${getMetricColor(liveMetrics.stress, true)}`}>
                      {liveMetrics.stress}%
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
                <Progress value={liveMetrics.stress} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Engagement</p>
                    <p className={`text-2xl font-bold ${getMetricColor(liveMetrics.engagement)}`}>
                      {liveMetrics.engagement}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
                <Progress value={liveMetrics.engagement} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overall Score</p>
                    <p className={`text-2xl font-bold ${getMetricColor(liveMetrics.overallScore)}`}>
                      {liveMetrics.overallScore}%
                    </p>
                  </div>
                  <Brain className="h-8 w-8 text-purple-500" />
                </div>
                <Progress value={liveMetrics.overallScore} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Real-time Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span>Live Feedback</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {realtimeFeedback.slice(-5).map((feedback, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      {getFeedbackIcon(feedback.priority)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{feedback.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(feedback.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {realtimeFeedback.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      Feedback will appear here as you practice...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span>Adaptive Suggestions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {adaptiveSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5" />
                      <p className="text-sm">{suggestion}</p>
                    </div>
                  ))}
                  {adaptiveSuggestions.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      Personalized suggestions will appear here...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emotional Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span>Emotional Journey</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-end space-x-2">
                {emotionalStates.slice(-10).map((state, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                    <div 
                      className="w-full bg-blue-200 rounded-t"
                      style={{ height: `${state.confidence * 100}%` }}
                    />
                    <span className="text-xs text-gray-500">{index + 1}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Confidence Trend</span>
                <span>Last 10 measurements</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
