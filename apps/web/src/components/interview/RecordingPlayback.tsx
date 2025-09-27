'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RecordingSegment, TimestampedFeedback } from '@/services/recordingService'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Clock,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Target,
  BarChart3,
  Download,
  Share2
} from 'lucide-react'

interface RecordingPlaybackProps {
  segment: RecordingSegment
  timestampedFeedback: TimestampedFeedback[]
  onSegmentComplete?: () => void
  showTranscript?: boolean
  showAnalysis?: boolean
}

export default function RecordingPlayback({
  segment,
  timestampedFeedback,
  onSegmentComplete,
  showTranscript = true,
  showAnalysis = true
}: RecordingPlaybackProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [activeFeedback, setActiveFeedback] = useState<TimestampedFeedback[]>([])
  const [showControls, setShowControls] = useState(true)

  // Initialize video when segment changes
  useEffect(() => {
    if (videoRef.current && segment.videoBlob) {
      const videoUrl = URL.createObjectURL(segment.videoBlob)
      videoRef.current.src = videoUrl
      
      return () => {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [segment])

  // Update active feedback based on current time
  useEffect(() => {
    const currentFeedback = timestampedFeedback.filter(feedback => {
      const feedbackTime = feedback.timestamp
      return feedbackTime <= currentTime && feedbackTime > currentTime - 3000 // Show for 3 seconds
    })
    setActiveFeedback(currentFeedback)
  }, [currentTime, timestampedFeedback])

  // Handle video events
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration * 1000) // Convert to milliseconds
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime * 1000) // Convert to milliseconds
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      onSegmentComplete?.()
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [onSegmentComplete])

  const togglePlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  const seekTo = (timeMs: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = timeMs / 1000
  }

  const skipBackward = () => {
    seekTo(Math.max(0, currentTime - 10000)) // Skip back 10 seconds
  }

  const skipForward = () => {
    seekTo(Math.min(duration, currentTime + 10000)) // Skip forward 10 seconds
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate)
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
    }
  }

  const toggleFullscreen = () => {
    if (!videoRef.current) return

    if (!isFullscreen) {
      videoRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }

  const formatTime = (timeMs: number) => {
    const seconds = Math.floor(timeMs / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFeedbackIcon = (type: TimestampedFeedback['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'tip': return <Lightbulb className="h-4 w-4 text-blue-500" />
      case 'improvement': return <TrendingUp className="h-4 w-4 text-purple-500" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5" />
              <span>Interview Recording</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{segment.questionId}</Badge>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Question */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Question:</h4>
              <p className="text-sm text-muted-foreground">{segment.questionText}</p>
            </div>

            {/* Video Container */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full aspect-video"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              />

              {/* Active Feedback Overlay */}
              {activeFeedback.length > 0 && (
                <div className="absolute top-4 right-4 space-y-2 max-w-sm">
                  {activeFeedback.map((feedback, index) => (
                    <Alert key={index} className="bg-black/80 border-white/20 text-white">
                      <div className="flex items-start space-x-2">
                        {getFeedbackIcon(feedback.type)}
                        <AlertDescription className="text-white text-sm">
                          {feedback.message}
                        </AlertDescription>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Video Controls */}
              {showControls && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <Slider
                      value={[currentTime]}
                      max={duration}
                      step={100}
                      onValueChange={(value) => seekTo(value[0])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={skipBackward}>
                        <SkipBack className="h-4 w-4 text-white" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={togglePlayPause}>
                        {isPlaying ? (
                          <Pause className="h-5 w-5 text-white" />
                        ) : (
                          <Play className="h-5 w-5 text-white" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={skipForward}>
                        <SkipForward className="h-4 w-4 text-white" />
                      </Button>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Volume Control */}
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={toggleMute}>
                          {isMuted ? (
                            <VolumeX className="h-4 w-4 text-white" />
                          ) : (
                            <Volume2 className="h-4 w-4 text-white" />
                          )}
                        </Button>
                        <Slider
                          value={[volume]}
                          max={1}
                          step={0.1}
                          onValueChange={handleVolumeChange}
                          className="w-20"
                        />
                      </div>

                      {/* Playback Speed */}
                      <select
                        value={playbackRate}
                        onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
                        className="bg-black/50 text-white text-sm rounded px-2 py-1"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>

                      <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                        {isFullscreen ? (
                          <Minimize className="h-4 w-4 text-white" />
                        ) : (
                          <Maximize className="h-4 w-4 text-white" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis and Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Analysis */}
        {showAnalysis && segment.analysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Performance Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(segment.analysis.confidence)}`}>
                    {Math.round(segment.analysis.confidence)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confidence</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(segment.analysis.clarity)}`}>
                    {Math.round(segment.analysis.clarity)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Clarity</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Speaking Pace</span>
                  <span>{Math.round(segment.analysis.pace)}%</span>
                </div>
                <Progress value={segment.analysis.pace} className="h-2" />
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm text-green-600">Strengths:</h4>
                <ul className="text-sm space-y-1">
                  {segment.analysis.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm text-blue-600">Improvements:</h4>
                <ul className="text-sm space-y-1">
                  {segment.analysis.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Target className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transcript */}
        {showTranscript && segment.transcript && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Transcript</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm leading-relaxed">
                {segment.transcript}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Timestamped Feedback Timeline */}
      {timestampedFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Feedback Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timestampedFeedback.map((feedback, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => seekTo(feedback.timestamp)}
                >
                  <div className="flex-shrink-0">
                    {getFeedbackIcon(feedback.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{formatTime(feedback.timestamp)}</span>
                      <Badge variant="outline" className="text-xs">
                        {feedback.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{feedback.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
