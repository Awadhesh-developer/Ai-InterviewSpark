'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MobileCard, MobileButtonGroup, MobileStatsGrid } from './MobileNavigation'
import {
  Play,
  Pause,
  Square,
  SkipForward,
  Mic,
  MicOff,
  Video,
  VideoOff,
  RotateCcw,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  BarChart3
} from 'lucide-react'

interface MobileInterviewPracticeProps {
  questions: Array<{
    id: string
    question: string
    category: string
    difficulty: string
  }>
  onComplete?: () => void
}

export default function MobileInterviewPractice({ 
  questions, 
  onComplete 
}: MobileInterviewPracticeProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [sessionScore, setSessionScore] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  // Auto-hide controls in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const timer = setTimeout(() => setShowControls(false), 3000)
      return () => clearTimeout(timer)
    } else {
      setShowControls(true)
    }
  }, [isFullscreen, showControls])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = () => {
    setIsRecording(true)
    setTimeElapsed(0)
  }

  const stopRecording = () => {
    setIsRecording(false)
    // Simulate score calculation
    setSessionScore(prev => Math.min(100, prev + Math.random() * 20 + 70))
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setTimeElapsed(0)
      setIsRecording(false)
    } else {
      onComplete?.()
    }
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }

  const recordingButtons = [
    {
      label: isRecording ? 'Stop' : 'Start',
      onClick: isRecording ? stopRecording : startRecording,
      variant: isRecording ? 'secondary' as const : 'default' as const,
      icon: isRecording ? Square : Play
    },
    {
      label: 'Next',
      onClick: nextQuestion,
      variant: 'outline' as const,
      icon: SkipForward,
      disabled: isRecording
    }
  ]

  const controlButtons = [
    {
      label: isAudioEnabled ? 'Mute' : 'Unmute',
      onClick: () => setIsAudioEnabled(!isAudioEnabled),
      variant: 'ghost' as const,
      icon: isAudioEnabled ? Mic : MicOff
    },
    {
      label: isVideoEnabled ? 'Camera Off' : 'Camera On',
      onClick: () => setIsVideoEnabled(!isVideoEnabled),
      variant: 'ghost' as const,
      icon: isVideoEnabled ? Video : VideoOff
    },
    {
      label: 'Settings',
      onClick: () => {},
      variant: 'ghost' as const,
      icon: Settings
    }
  ]

  const stats = [
    {
      label: 'Time',
      value: formatTime(timeElapsed),
      icon: Clock,
      color: 'text-blue-500'
    },
    {
      label: 'Progress',
      value: `${currentQuestionIndex + 1}/${questions.length}`,
      icon: Target,
      color: 'text-green-500'
    },
    {
      label: 'Score',
      value: `${Math.round(sessionScore)}%`,
      icon: TrendingUp,
      color: 'text-purple-500'
    },
    {
      label: 'Status',
      value: isRecording ? 'Recording' : 'Ready',
      icon: isRecording ? AlertCircle : CheckCircle,
      color: isRecording ? 'text-red-500' : 'text-green-500'
    }
  ]

  return (
    <div className={`min-h-screen bg-background ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="p-4 space-y-4">
        {/* Header - Hidden in fullscreen */}
        {(!isFullscreen || showControls) && (
          <MobileCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Interview Practice</h2>
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
            
            <Progress value={progress} className="mb-4" />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{currentQuestion?.category}</Badge>
                <Badge variant="secondary">{currentQuestion?.difficulty}</Badge>
              </div>
            </div>
          </MobileCard>
        )}

        {/* Question Card */}
        {(!isFullscreen || showControls) && (
          <MobileCard>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{currentQuestionIndex + 1}</span>
                </div>
                <h3 className="font-medium">Question</h3>
              </div>
              <p className="text-sm leading-relaxed">{currentQuestion?.question}</p>
            </div>
          </MobileCard>
        )}

        {/* Video Preview */}
        <MobileCard className="relative overflow-hidden">
          <div 
            className={`relative bg-black rounded-lg overflow-hidden ${
              isFullscreen ? 'h-screen' : 'aspect-video'
            }`}
            onClick={() => isFullscreen && setShowControls(!showControls)}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            
            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">REC</span>
                <span className="text-white text-sm">{formatTime(timeElapsed)}</span>
              </div>
            )}

            {/* Fullscreen Controls Overlay */}
            {isFullscreen && showControls && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-black/80 rounded-lg p-4 space-y-4">
                  <MobileButtonGroup buttons={recordingButtons} orientation="horizontal" />
                  <MobileButtonGroup buttons={controlButtons} orientation="horizontal" />
                </div>
              </div>
            )}

            {/* Camera/Audio Status */}
            <div className="absolute top-4 right-4 flex space-x-2">
              {!isVideoEnabled && (
                <div className="bg-black/80 rounded-full p-2">
                  <VideoOff className="h-4 w-4 text-white" />
                </div>
              )}
              {!isAudioEnabled && (
                <div className="bg-black/80 rounded-full p-2">
                  <MicOff className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>
        </MobileCard>

        {/* Stats Grid - Hidden in fullscreen */}
        {(!isFullscreen || showControls) && (
          <MobileStatsGrid stats={stats} />
        )}

        {/* Controls - Hidden in fullscreen */}
        {(!isFullscreen || showControls) && (
          <div className="space-y-3">
            <MobileButtonGroup buttons={recordingButtons} orientation="horizontal" />
            <MobileButtonGroup buttons={controlButtons} orientation="horizontal" />
          </div>
        )}

        {/* Real-time Feedback */}
        {isRecording && (!isFullscreen || showControls) && (
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Live Feedback</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Confidence: 78%</div>
                  <div>Clarity: 82%</div>
                  <div>Pace: Good</div>
                  <div>Eye Contact: ✓</div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Tips for Mobile */}
        {!isRecording && (!isFullscreen || showControls) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium text-sm">Mobile Interview Tips</p>
                <ul className="text-xs space-y-1">
                  <li>• Hold your phone steady or use a stand</li>
                  <li>• Ensure good lighting on your face</li>
                  <li>• Find a quiet environment</li>
                  <li>• Tap the video to toggle fullscreen</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Mobile bottom padding */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}

// Mobile-optimized results component
export function MobileInterviewResults({ 
  score, 
  feedback, 
  onRestart, 
  onViewDetails 
}: {
  score: number
  feedback: string[]
  onRestart: () => void
  onViewDetails: () => void
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent performance! 🎉'
    if (score >= 80) return 'Great job! 👏'
    if (score >= 70) return 'Good work! 👍'
    if (score >= 60) return 'Not bad, keep practicing! 💪'
    return 'Keep practicing, you\'ll improve! 🚀'
  }

  return (
    <div className="p-4 space-y-4">
      <MobileCard>
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Interview Complete!</h2>
            <p className="text-muted-foreground">{getScoreMessage(score)}</p>
          </div>
          
          <div className="space-y-2">
            <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {Math.round(score)}%
            </div>
            <p className="text-sm text-muted-foreground">Overall Score</p>
          </div>
          
          <Progress value={score} className="h-3" />
        </div>
      </MobileCard>

      <MobileCard>
        <div className="space-y-3">
          <h3 className="font-medium">Key Feedback</h3>
          <div className="space-y-2">
            {feedback.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </MobileCard>

      <div className="space-y-3">
        <Button onClick={onViewDetails} className="w-full">
          <BarChart3 className="h-4 w-4 mr-2" />
          View Detailed Analysis
        </Button>
        <Button onClick={onRestart} variant="outline" className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          Practice Again
        </Button>
      </div>

      <div className="h-20" />
    </div>
  )
}
