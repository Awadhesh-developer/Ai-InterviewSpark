'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import RecordingPlayback from '@/components/interview/RecordingPlayback'
import { RecordingSession, RecordingSegment, TimestampedFeedback, recordingService } from '@/services/recordingService'
import {
  ArrowLeft,
  Download,
  Share2,
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Video,
  Mic,
  FileText,
  Star,
  Award,
  AlertCircle,
  CheckCircle,
  Lightbulb
} from 'lucide-react'

export default function RecordingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const recordingId = params.id as string

  const [recording, setRecording] = useState<RecordingSession | null>(null)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const [timestampedFeedback, setTimestampedFeedback] = useState<TimestampedFeedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecording()
  }, [recordingId])

  useEffect(() => {
    if (recording && recording.segments[currentSegmentIndex]) {
      generateTimestampedFeedback()
    }
  }, [recording, currentSegmentIndex])

  const loadRecording = async () => {
    try {
      setIsLoading(true)
      
      // In a real implementation, this would fetch from API
      // For now, we'll create mock data based on the ID
      const mockRecording: RecordingSession = {
        id: recordingId,
        userId: 'user_123',
        sessionName: 'Software Engineer Technical Interview',
        startTime: new Date('2024-01-15T10:00:00'),
        endTime: new Date('2024-01-15T10:45:00'),
        totalDuration: 2700000, // 45 minutes
        segments: [
          {
            id: 'seg_001',
            startTime: Date.now() - 2700000,
            endTime: Date.now() - 2400000,
            questionId: 'q1',
            questionText: 'Tell me about yourself and your background in software development.',
            transcript: 'Hi, I\'m a software engineer with 5 years of experience in full-stack development. I started my career working with JavaScript and React, and have since expanded into backend technologies like Node.js and Python. I\'m passionate about creating user-friendly applications and have led several projects from conception to deployment.',
            analysis: {
              confidence: 85,
              clarity: 78,
              pace: 82,
              fillerWords: 2,
              keyPoints: [
                'Clear introduction with years of experience',
                'Mentioned specific technologies',
                'Showed passion for the field',
                'Demonstrated leadership experience'
              ],
              improvements: [
                'Reduce filler words ("um", "uh")',
                'Add more specific project examples',
                'Maintain better eye contact',
                'Speak with more confidence in the beginning'
              ]
            }
          },
          {
            id: 'seg_002',
            startTime: Date.now() - 2400000,
            endTime: Date.now() - 2100000,
            questionId: 'q2',
            questionText: 'Describe a challenging technical problem you solved and your approach.',
            transcript: 'One of the most challenging problems I faced was optimizing a React application that was experiencing severe performance issues. The app was rendering thousands of components and causing browser freezes. I approached this systematically by first profiling the application using React DevTools, identifying the bottlenecks, and then implementing solutions like React.memo, useMemo, and virtual scrolling.',
            analysis: {
              confidence: 92,
              clarity: 88,
              pace: 75,
              fillerWords: 1,
              keyPoints: [
                'Specific technical example provided',
                'Systematic problem-solving approach',
                'Mentioned specific tools and techniques',
                'Clear explanation of the solution'
              ],
              improvements: [
                'Speak slightly faster to maintain engagement',
                'Quantify the performance improvements achieved',
                'Add more details about the impact'
              ]
            }
          },
          {
            id: 'seg_003',
            startTime: Date.now() - 2100000,
            endTime: Date.now() - 1800000,
            questionId: 'q3',
            questionText: 'How do you handle code reviews and collaboration in a team environment?',
            transcript: 'I believe code reviews are essential for maintaining code quality and knowledge sharing. I always approach reviews constructively, focusing on the code rather than the person. When reviewing others\' code, I look for logic errors, performance issues, and adherence to coding standards. When receiving feedback, I\'m open to suggestions and see it as a learning opportunity.',
            analysis: {
              confidence: 88,
              clarity: 85,
              pace: 80,
              fillerWords: 0,
              keyPoints: [
                'Emphasized importance of code reviews',
                'Showed collaborative mindset',
                'Mentioned specific review criteria',
                'Demonstrated growth mindset'
              ],
              improvements: [
                'Provide a specific example of a code review',
                'Mention tools used for collaboration',
                'Discuss handling disagreements in reviews'
              ]
            }
          }
        ],
        overallScore: 88,
        metadata: {
          interviewType: 'technical',
          jobRole: 'Software Engineer',
          difficulty: 'intermediate',
          questions: 3
        }
      }

      setRecording(mockRecording)
    } catch (error) {
      console.error('Error loading recording:', error)
      setError('Failed to load recording')
    } finally {
      setIsLoading(false)
    }
  }

  const generateTimestampedFeedback = () => {
    if (!recording || !recording.segments[currentSegmentIndex]) return

    const segment = recording.segments[currentSegmentIndex]
    const feedback = recordingService.generateTimestampedFeedback(segment)
    setTimestampedFeedback(feedback)
  }

  const handleSegmentComplete = () => {
    if (recording && currentSegmentIndex < recording.segments.length - 1) {
      setCurrentSegmentIndex(prev => prev + 1)
    }
  }

  const formatDuration = (durationMs: number) => {
    const minutes = Math.floor(durationMs / 60000)
    const seconds = Math.floor((durationMs % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'technical': return <BarChart3 className="h-5 w-5" />
      case 'behavioral': return <Users className="h-5 w-5" />
      case 'case-study': return <FileText className="h-5 w-5" />
      default: return <Video className="h-5 w-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading recording...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !recording) {
    return (
      <div className="container mx-auto py-8">
        <Alert className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Recording not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const currentSegment = recording.segments[currentSegmentIndex]

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{recording.sessionName}</h1>
            <p className="text-muted-foreground mt-1">
              {formatDate(recording.startTime)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Session Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              {getInterviewTypeIcon(recording.metadata.interviewType)}
              <div>
                <p className="text-sm text-muted-foreground">Interview Type</p>
                <p className="font-semibold capitalize">{recording.metadata.interviewType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(recording.overallScore)}`}>
                  {recording.overallScore}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">{formatDuration(recording.totalDuration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Mic className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="font-semibold">{recording.segments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Video Player and Analysis */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="playback" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="playback">Playback</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
            </TabsList>

            <TabsContent value="playback" className="space-y-6">
              {currentSegment && (
                <RecordingPlayback
                  segment={currentSegment}
                  timestampedFeedback={timestampedFeedback}
                  onSegmentComplete={handleSegmentComplete}
                  showTranscript={false}
                  showAnalysis={false}
                />
              )}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              {currentSegment?.analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Analysis</CardTitle>
                    <CardDescription>
                      Detailed breakdown of your performance for this question
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Score Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(currentSegment.analysis.confidence)}`}>
                          {Math.round(currentSegment.analysis.confidence)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(currentSegment.analysis.clarity)}`}>
                          {Math.round(currentSegment.analysis.clarity)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Clarity</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(currentSegment.analysis.pace)}`}>
                          {Math.round(currentSegment.analysis.pace)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Pace</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${currentSegment.analysis.fillerWords > 3 ? 'text-red-600' : 'text-green-600'}`}>
                          {currentSegment.analysis.fillerWords}
                        </div>
                        <div className="text-sm text-muted-foreground">Filler Words</div>
                      </div>
                    </div>

                    {/* Strengths */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-green-600 flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Strengths</span>
                      </h4>
                      <ul className="space-y-2">
                        {currentSegment.analysis.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Improvements */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-600 flex items-center space-x-2">
                        <Lightbulb className="h-4 w-4" />
                        <span>Areas for Improvement</span>
                      </h4>
                      <ul className="space-y-2">
                        {currentSegment.analysis.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="transcript" className="space-y-6">
              {currentSegment?.transcript && (
                <Card>
                  <CardHeader>
                    <CardTitle>Transcript</CardTitle>
                    <CardDescription>
                      Your response to: "{currentSegment.questionText}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="leading-relaxed">{currentSegment.transcript}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Question Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="text-lg">Questions</CardTitle>
              <CardDescription>
                {currentSegmentIndex + 1} of {recording.segments.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recording.segments.map((segment, index) => (
                <div
                  key={segment.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    index === currentSegmentIndex
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setCurrentSegmentIndex(index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Question {index + 1}</span>
                    {segment.analysis && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round((segment.analysis.confidence + segment.analysis.clarity + segment.analysis.pace) / 3)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {segment.questionText}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
