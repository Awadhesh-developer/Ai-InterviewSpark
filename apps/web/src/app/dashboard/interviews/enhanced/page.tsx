'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Briefcase,
  Clock,
  Target,
  Video,
  Mic,
  MessageSquare,
  Zap,
  FileText,
  Settings,
  Users,
  Building,
  Code,
  TrendingUp,
  Heart,
  Palette,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  Square,
  Camera,
  MicIcon,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Send,
  Sparkles,
  Globe,
  Newspaper,
  BarChart3,
  Lightbulb,
  Timer,
  Eye,
  EyeOff
} from 'lucide-react'

interface EnhancedInterviewSetup {
  jobTitle: string
  company: string
  industry: string
  jobDescription: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number
  questionTypes: string[]
  interviewMode: 'text' | 'voice' | 'video' | 'hybrid'
  
  // Enhanced features
  usePerplexityAPI: boolean
  includeRealTimeContext: boolean
  includeCompanyNews: boolean
  includeIndustryTrends: boolean
  adaptiveQuestioning: boolean
  emotionalAnalysis: boolean
  voiceAnalysis: boolean
  customPrompts: string[]
  
  // Real-time features
  enableLiveGeneration: boolean
  questionPoolSize: number
  difficultyProgression: boolean
  personalizedFeedback: boolean
}

interface InterviewModeFeatures {
  supportsVideo: boolean
  supportsAudio: boolean
  supportsText: boolean
  requiresCamera: boolean
  requiresMicrophone: boolean
  realTimeAnalysis: boolean
  emotionalAnalysis: boolean
  voiceAnalysis: boolean
}

interface RealTimeState {
  sessionId: string
  currentQuestionIndex: number
  totalQuestions: number
  mode: string
  isActive: boolean
  isPaused: boolean
  timeRemaining: number
  currentQuestion: any
  adaptiveLevel: 'easy' | 'medium' | 'hard'
}

export default function EnhancedInterviewPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [isInterviewActive, setIsInterviewActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Interview state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [realTimeState, setRealTimeState] = useState<RealTimeState | null>(null)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Media refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const videoChunksRef = useRef<Blob[]>([])
  
  const [setup, setSetup] = useState<EnhancedInterviewSetup>({
    jobTitle: '',
    company: '',
    industry: 'technology',
    jobDescription: '',
    difficulty: 'intermediate',
    duration: 30,
    questionTypes: ['behavioral', 'technical'],
    interviewMode: 'video',
    
    // Enhanced features
    usePerplexityAPI: true,
    includeRealTimeContext: true,
    includeCompanyNews: true,
    includeIndustryTrends: true,
    adaptiveQuestioning: false,
    emotionalAnalysis: false,
    voiceAnalysis: false,
    customPrompts: [],
    
    // Real-time features
    enableLiveGeneration: true,
    questionPoolSize: 10,
    difficultyProgression: false,
    personalizedFeedback: true,
  })

  const [modeFeatures, setModeFeatures] = useState<InterviewModeFeatures>({
    supportsVideo: true,
    supportsAudio: true,
    supportsText: true,
    requiresCamera: true,
    requiresMicrophone: true,
    realTimeAnalysis: true,
    emotionalAnalysis: true,
    voiceAnalysis: true,
  })

  const industries = [
    { id: 'technology', name: 'Technology', icon: Code, color: 'blue' },
    { id: 'finance', name: 'Finance', icon: TrendingUp, color: 'green' },
    { id: 'healthcare', name: 'Healthcare', icon: Heart, color: 'red' },
    { id: 'consulting', name: 'Consulting', icon: Users, color: 'purple' },
    { id: 'design', name: 'Design', icon: Palette, color: 'pink' },
    { id: 'other', name: 'Other', icon: Building, color: 'gray' }
  ]

  const questionTypes = [
    { id: 'behavioral', name: 'Behavioral', description: 'Past experiences and situations', icon: Users },
    { id: 'technical', name: 'Technical', description: 'Role-specific technical knowledge', icon: Code },
    { id: 'situational', name: 'Situational', description: 'Hypothetical scenarios', icon: Lightbulb },
    { id: 'company', name: 'Company-Specific', description: 'Company culture and values', icon: Building },
    { id: 'strengths', name: 'Strengths', description: 'Personal strengths and achievements', icon: Target },
    { id: 'weaknesses', name: 'Weaknesses', description: 'Areas for improvement', icon: TrendingUp }
  ]

  const interviewModes = [
    {
      id: 'text' as const,
      name: 'Text Interview',
      description: 'Written questions and answers',
      icon: MessageSquare,
      color: 'bg-blue-500',
      features: 'Perfect for practicing structured responses'
    },
    {
      id: 'voice' as const,
      name: 'Voice Interview',
      description: 'Audio recording with voice analysis',
      icon: Mic,
      color: 'bg-green-500',
      features: 'Practice verbal communication skills'
    },
    {
      id: 'video' as const,
      name: 'Video Interview',
      description: 'Full video with emotional analysis',
      icon: Video,
      color: 'bg-purple-500',
      features: 'Complete interview simulation'
    },
    {
      id: 'hybrid' as const,
      name: 'Hybrid Mode',
      description: 'Choose input method per question',
      icon: Zap,
      color: 'bg-orange-500',
      features: 'Maximum flexibility and control'
    }
  ]

  // Initialize camera/microphone based on mode
  useEffect(() => {
    if (setup.interviewMode === 'video' || setup.interviewMode === 'voice') {
      initializeMedia()
    }
  }, [setup.interviewMode])

  const initializeMedia = async () => {
    try {
      const constraints = {
        video: setup.interviewMode === 'video',
        audio: setup.interviewMode === 'video' || setup.interviewMode === 'voice',
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current && setup.interviewMode === 'video') {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing media devices:', error)
      toast.error('Unable to access camera/microphone. Please check permissions.')
    }
  }

  const createEnhancedSession = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/enhanced-interviews/sessions/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setup),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create interview session')
      }

      const data = await response.json()
      setSessionId(data.data.session.id)
      setModeFeatures(data.data.features)
      
      toast.success('Enhanced interview session created successfully!')
      setCurrentStep(2)
    } catch (error: any) {
      console.error('Error creating session:', error)
      setError(error.message)
      toast.error(error.message)
    } finally {
      setIsCreating(false)
    }
  }

  const startInterview = async () => {
    if (!sessionId) return

    try {
      const response = await fetch('/api/enhanced-interviews/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          mode: setup.interviewMode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start interview')
      }

      const data = await response.json()
      setRealTimeState(data.data.state)
      setIsInterviewActive(true)
      setCurrentStep(3)
      
      toast.success('Interview started! Good luck!')
    } catch (error: any) {
      console.error('Error starting interview:', error)
      toast.error(error.message)
    }
  }

  const submitAnswer = async () => {
    if (!sessionId || !realTimeState?.currentQuestion || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/enhanced-interviews/sessions/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          questionId: realTimeState.currentQuestion.id,
          textAnswer: currentAnswer,
          duration: 60, // Calculate actual duration
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit answer')
      }

      const data = await response.json()
      
      // Update state with next question
      if (data.data.nextQuestion) {
        setRealTimeState(prev => prev ? {
          ...prev,
          currentQuestion: data.data.nextQuestion,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
        } : null)
        setCurrentAnswer('')
      } else {
        // Interview completed
        setIsInterviewActive(false)
        setCurrentStep(4)
        toast.success('Interview completed! Great job!')
      }
      
      // Show feedback
      if (data.data.feedback) {
        toast.success(`Score: ${Math.round(data.data.feedback.score * 100)}%`)
      }
      
    } catch (error: any) {
      console.error('Error submitting answer:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startRecording = () => {
    // Implementation for recording functionality
    setIsRecording(true)
    toast.info('Recording started...')
  }

  const stopRecording = () => {
    setIsRecording(false)
    toast.info('Recording stopped')
  }

  const togglePause = async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`/api/enhanced-interviews/sessions/${sessionId}/toggle-pause`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to toggle pause')
      }

      const data = await response.json()
      setRealTimeState(data.data.state)
      
      toast.info(data.data.state.isPaused ? 'Interview paused' : 'Interview resumed')
    } catch (error: any) {
      console.error('Error toggling pause:', error)
      toast.error(error.message)
    }
  }

  const renderSetupStep = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Enhanced AI Interview Practice
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Experience next-generation interview preparation with real-time question generation and multi-modal practice
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Setup</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Features</TabsTrigger>
          <TabsTrigger value="realtime">Real-time Options</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Job Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    value={setup.jobTitle}
                    onChange={(e) => setSetup(prev => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={setup.company}
                    onChange={(e) => setSetup(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g., Google, Microsoft"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select value={setup.industry} onValueChange={(value) => setSetup(prev => ({ ...prev, industry: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry.id} value={industry.id}>
                        <div className="flex items-center space-x-2">
                          <industry.icon className="h-4 w-4" />
                          <span>{industry.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  value={setup.jobDescription}
                  onChange={(e) => setSetup(prev => ({ ...prev, jobDescription: e.target.value }))}
                  placeholder="Paste the job description here for more relevant questions..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Interview Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Difficulty Level</Label>
                  <Select value={setup.difficulty} onValueChange={(value: any) => setSetup(prev => ({ ...prev, difficulty: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    max="120"
                    value={setup.duration}
                    onChange={(e) => setSetup(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="questionPoolSize">Question Pool Size</Label>
                  <Input
                    id="questionPoolSize"
                    type="number"
                    min="5"
                    max="50"
                    value={setup.questionPoolSize}
                    onChange={(e) => setSetup(prev => ({ ...prev, questionPoolSize: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label>Question Types</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {questionTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.id}
                        checked={setup.questionTypes.includes(type.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSetup(prev => ({ ...prev, questionTypes: [...prev.questionTypes, type.id] }))
                          } else {
                            setSetup(prev => ({ ...prev, questionTypes: prev.questionTypes.filter(t => t !== type.id) }))
                          }
                        }}
                      />
                      <Label htmlFor={type.id} className="text-sm">
                        <div className="flex items-center space-x-1">
                          <type.icon className="h-3 w-3" />
                          <span>{type.name}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Interview Mode</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {interviewModes.map((mode) => (
                    <Card 
                      key={mode.id} 
                      className={`cursor-pointer transition-all ${setup.interviewMode === mode.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSetup(prev => ({ ...prev, interviewMode: mode.id }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${mode.color}`}>
                            <mode.icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{mode.name}</h3>
                            <p className="text-sm text-muted-foreground">{mode.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{mode.features}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>AI-Powered Features</span>
              </CardTitle>
              <CardDescription>
                Leverage cutting-edge AI for the most realistic interview experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <Label>Use Perplexity API</Label>
                      <Badge variant="secondary">Recommended</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Generate real-time, contextual questions using the latest industry data
                    </p>
                  </div>
                  <Checkbox
                    checked={setup.usePerplexityAPI}
                    onCheckedChange={(checked) => setSetup(prev => ({ ...prev, usePerplexityAPI: !!checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Newspaper className="h-4 w-4" />
                      <Label>Include Company News</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Questions based on recent company developments and news
                    </p>
                  </div>
                  <Checkbox
                    checked={setup.includeCompanyNews}
                    onCheckedChange={(checked) => setSetup(prev => ({ ...prev, includeCompanyNews: !!checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4" />
                      <Label>Include Industry Trends</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Questions incorporating current industry trends and developments
                    </p>
                  </div>
                  <Checkbox
                    checked={setup.includeIndustryTrends}
                    onCheckedChange={(checked) => setSetup(prev => ({ ...prev, includeIndustryTrends: !!checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <Label>Adaptive Questioning</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Difficulty adjusts based on your performance
                    </p>
                  </div>
                  <Checkbox
                    checked={setup.adaptiveQuestioning}
                    onCheckedChange={(checked) => setSetup(prev => ({ ...prev, adaptiveQuestioning: !!checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {(setup.interviewMode === 'video' || setup.interviewMode === 'voice') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Analysis Features</span>
                </CardTitle>
                <CardDescription>
                  Advanced analysis of your performance during the interview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {setup.interviewMode === 'video' && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Heart className="h-4 w-4" />
                        <Label>Emotional Analysis</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Real-time analysis of confidence, stress, and engagement
                      </p>
                    </div>
                    <Checkbox
                      checked={setup.emotionalAnalysis}
                      onCheckedChange={(checked) => setSetup(prev => ({ ...prev, emotionalAnalysis: !!checked }))}
                    />
                  </div>
                )}

                {(setup.interviewMode === 'video' || setup.interviewMode === 'voice') && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Volume2 className="h-4 w-4" />
                        <Label>Voice Analysis</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Analysis of speech clarity, pace, and tone
                      </p>
                    </div>
                    <Checkbox
                      checked={setup.voiceAnalysis}
                      onCheckedChange={(checked) => setSetup(prev => ({ ...prev, voiceAnalysis: !!checked }))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Real-time Features</span>
              </CardTitle>
              <CardDescription>
                Enable dynamic, adaptive interview experiences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <Label>Live Question Generation</Label>
                    <Badge variant="outline">Beta</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generate new questions in real-time based on your responses
                  </p>
                </div>
                <Checkbox
                  checked={setup.enableLiveGeneration}
                  onCheckedChange={(checked) => setSetup(prev => ({ ...prev, enableLiveGeneration: !!checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <Label>Difficulty Progression</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Questions get progressively harder as you perform better
                  </p>
                </div>
                <Checkbox
                  checked={setup.difficultyProgression}
                  onCheckedChange={(checked) => setSetup(prev => ({ ...prev, difficultyProgression: !!checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-4 w-4" />
                    <Label>Personalized Feedback</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get instant, personalized feedback after each answer
                  </p>
                </div>
                <Checkbox
                  checked={setup.personalizedFeedback}
                  onCheckedChange={(checked) => setSetup(prev => ({ ...prev, personalizedFeedback: !!checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={createEnhancedSession}
          disabled={!setup.jobTitle || !setup.industry || setup.questionTypes.length === 0 || isCreating}
        >
          {isCreating ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Creating...
            </>
          ) : (
            <>
              Create Enhanced Interview
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )

  const renderReadyStep = () => (
    <div className="max-w-2xl mx-auto space-y-8 text-center">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Interview Ready!
        </h1>
        <p className="text-lg text-muted-foreground">
          Your enhanced interview session has been created with the latest AI technology
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Session Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Position:</span> {setup.jobTitle}
            </div>
            <div>
              <span className="font-medium">Company:</span> {setup.company || 'Not specified'}
            </div>
            <div>
              <span className="font-medium">Mode:</span> {setup.interviewMode.toUpperCase()}
            </div>
            <div>
              <span className="font-medium">Duration:</span> {setup.duration} minutes
            </div>
            <div>
              <span className="font-medium">Questions:</span> {setup.questionPoolSize}
            </div>
            <div>
              <span className="font-medium">Difficulty:</span> {setup.difficulty}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Enabled Features:</h4>
            <div className="flex flex-wrap gap-2">
              {setup.usePerplexityAPI && <Badge variant="secondary">Real-time Questions</Badge>}
              {setup.adaptiveQuestioning && <Badge variant="secondary">Adaptive Difficulty</Badge>}
              {setup.emotionalAnalysis && <Badge variant="secondary">Emotional Analysis</Badge>}
              {setup.voiceAnalysis && <Badge variant="secondary">Voice Analysis</Badge>}
              {setup.enableLiveGeneration && <Badge variant="secondary">Live Generation</Badge>}
              {setup.personalizedFeedback && <Badge variant="secondary">Personalized Feedback</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {(setup.interviewMode === 'video' || setup.interviewMode === 'voice') && (
        <Card>
          <CardHeader>
            <CardTitle>Media Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {setup.interviewMode === 'video' && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full max-w-md mx-auto rounded-lg bg-black"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary">Preview</Badge>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {modeFeatures.requiresCamera && modeFeatures.requiresMicrophone
                ? 'Camera and microphone access required'
                : modeFeatures.requiresMicrophone
                ? 'Microphone access required'
                : 'Media setup complete'}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Setup
        </Button>
        <Button onClick={startInterview} size="lg">
          <Play className="mr-2 h-4 w-4" />
          Start Interview
        </Button>
      </div>
    </div>
  )

  const renderInterviewStep = () => {
    if (!realTimeState || !realTimeState.currentQuestion) {
      return (
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your first question...</p>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Interview in Progress</h1>
            <p className="text-muted-foreground">
              Question {realTimeState.currentQuestionIndex + 1} of {realTimeState.totalQuestions}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={togglePause}>
              {realTimeState.isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </>
              )}
            </Button>
            <div className="flex items-center space-x-1 text-sm">
              <Timer className="h-4 w-4" />
              <span>{Math.floor(realTimeState.timeRemaining / 60)}:{(realTimeState.timeRemaining % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={(realTimeState.currentQuestionIndex / realTimeState.totalQuestions) * 100} />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round((realTimeState.currentQuestionIndex / realTimeState.totalQuestions) * 100)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interview Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span>Question {realTimeState.currentQuestionIndex + 1}</span>
                    <Badge variant="outline" className="ml-2">
                      {realTimeState.currentQuestion.type}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">
                  {realTimeState.currentQuestion.text}
                </p>
                {realTimeState.currentQuestion.tips && realTimeState.currentQuestion.tips.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Tips</span>
                    </div>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      {realTimeState.currentQuestion.tips.map((tip: string, index: number) => (
                        <li key={index}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Answer Input */}
            <Card>
              <CardHeader>
                <CardTitle>Your Answer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {setup.interviewMode === 'video' && (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      className="w-full max-w-sm rounded-lg bg-black"
                    />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      {isRecording && (
                        <Badge variant="destructive" className="animate-pulse">
                          REC
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {(setup.interviewMode === 'text' || setup.interviewMode === 'hybrid') && (
                  <Textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={6}
                    disabled={realTimeState.isPaused}
                  />
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {(setup.interviewMode === 'voice' || setup.interviewMode === 'video') && (
                      <Button
                        variant={isRecording ? "destructive" : "default"}
                        size="sm"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={realTimeState.isPaused}
                      >
                        {isRecording ? (
                          <>
                            <Square className="h-4 w-4 mr-1" />
                            Stop
                          </>
                        ) : (
                          <>
                            <MicIcon className="h-4 w-4 mr-1" />
                            Record
                          </>
                        )}
                      </Button>
                    )}
                    
                    {setup.interviewMode === 'hybrid' && (
                      <div className="flex items-center space-x-1">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MicIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={submitAnswer}
                    disabled={(!currentAnswer && setup.interviewMode === 'text') || isSubmitting || realTimeState.isPaused}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Answer
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Real-time Analysis */}
            {(setup.emotionalAnalysis || setup.voiceAnalysis) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Real-time Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {setup.emotionalAnalysis && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Confidence</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  )}
                  {setup.voiceAnalysis && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Speech Clarity</span>
                        <span>82%</span>
                      </div>
                      <Progress value={82} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Adaptive Level */}
            {setup.adaptiveQuestioning && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Adaptive Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <Badge 
                      variant={realTimeState.adaptiveLevel === 'easy' ? 'secondary' : 
                              realTimeState.adaptiveLevel === 'hard' ? 'destructive' : 'default'}
                    >
                      {realTimeState.adaptiveLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Questions adapt to your performance
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Session Info</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="font-medium">{setup.interviewMode.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Company:</span>
                  <span className="font-medium">{setup.company || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Position:</span>
                  <span className="font-medium">{setup.jobTitle}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const renderCompletedStep = () => (
    <div className="max-w-2xl mx-auto space-y-8 text-center">
      <div>
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Interview Completed!
        </h1>
        <p className="text-lg text-muted-foreground">
          Congratulations on completing your enhanced AI interview practice session
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">85%</div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{realTimeState?.totalQuestions || 0}</div>
              <div className="text-sm text-muted-foreground">Questions Answered</div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Key Strengths</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Clear and structured responses</li>
              <li>• Good use of specific examples</li>
              <li>• Confident delivery</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Areas for Improvement</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Include more quantifiable results</li>
              <li>• Practice the STAR method more</li>
              <li>• Prepare company-specific examples</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/interviews')}>
          View All Interviews
        </Button>
        <Button onClick={() => {
          setCurrentStep(1)
          setSessionId(null)
          setRealTimeState(null)
          setIsInterviewActive(false)
        }}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Start New Interview
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {currentStep === 1 && renderSetupStep()}
        {currentStep === 2 && renderReadyStep()}
        {currentStep === 3 && renderInterviewStep()}
        {currentStep === 4 && renderCompletedStep()}
      </div>
    </div>
  )
}
