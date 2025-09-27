'use client'

import { useState, useCallback } from 'react'
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
import { aiInterviewService } from '@/services/aiInterviewService'
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Briefcase,
  Clock,
  Target,
  Video,
  Mic,
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
  CheckCircle
} from 'lucide-react'

interface InterviewSetup {
  title: string
  jobTitle: string
  company: string
  industry: string
  difficulty: 'easy' | 'medium' | 'hard'
  duration: number
  questionTypes: string[]
  interviewType: 'voice' | 'video' | 'audio' | 'text'
  jobDescription: string
  customQuestions: string[]
  // Enhanced options
  includeWebScraping: boolean
  includeSampleAnswers: boolean
  llmProvider: 'openai' | 'gemini' | 'claude' | 'auto'
  useIndustryTrends: boolean
  companySpecificQuestions: boolean
}

type LLMProvider = 'openai' | 'gemini' | 'claude' | 'auto'

export default function NewInterviewPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [setup, setSetup] = useState<InterviewSetup>({
    title: '',
    jobTitle: '',
    company: '',
    industry: '',
    difficulty: 'medium',
    duration: 30,
    questionTypes: ['behavioral', 'technical'],
    interviewType: 'video',
    jobDescription: '',
    customQuestions: [],
    // Enhanced options
    includeWebScraping: true,
    includeSampleAnswers: false,
    llmProvider: 'auto',
    useIndustryTrends: true,
    companySpecificQuestions: true
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
    { id: 'behavioral', name: 'Behavioral', description: 'Past experiences and situations' },
    { id: 'technical', name: 'Technical', description: 'Role-specific technical knowledge' },
    { id: 'situational', name: 'Situational', description: 'Hypothetical scenarios' },
    { id: 'company-specific', name: 'Company-Specific', description: 'Company culture and values' }
  ]

  const interviewTypes = [
    {
      id: 'voice' as const,
      name: 'Voice Interview',
      description: 'Real-time AI conversation with speech-to-speech interaction',
      icon: Zap,
      features: ['Real-time conversation', 'AI interviewer voice', 'Natural dialogue flow', 'Instant feedback'],
      isNew: true
    },
    {
      id: 'video' as const,
      name: 'Video Interview',
      description: 'Full video recording with AI analysis of verbal and non-verbal communication',
      icon: Video,
      features: ['Video recording', 'Body language analysis', 'Eye contact tracking', 'Professional presence']
    },
    {
      id: 'audio' as const,
      name: 'Audio Interview',
      description: 'Audio-only recording focusing on verbal communication and content',
      icon: Mic,
      features: ['Audio recording', 'Speech analysis', 'Pace and clarity', 'Content quality']
    },
    {
      id: 'text' as const,
      name: 'Text Interview',
      description: 'Written responses with AI analysis of structure and content',
      icon: FileText,
      features: ['Written responses', 'Structure analysis', 'Grammar check', 'Content depth']
    }
  ]

  const llmProviders = [
    { id: 'auto', name: 'Auto-Select', description: 'Best model for each question type' },
    { id: 'openai', name: 'OpenAI GPT-4', description: 'Best for behavioral questions' },
    { id: 'gemini', name: 'Google Gemini', description: 'Best for technical questions' },
    { id: 'claude', name: 'Anthropic Claude', description: 'Best for company-specific questions' }
  ] as const

  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return !!(setup.jobTitle.trim() && setup.industry)
      case 2:
        return !!(setup.interviewType && setup.duration > 0 && setup.difficulty)
      case 3:
        return setup.questionTypes.length > 0
      case 4:
        return !!(setup.llmProvider)
      case 5:
        return true
      default:
        return false
    }
  }, [setup])

  const handleNext = useCallback(() => {
    if (validateStep(currentStep) && currentStep < 5) {
      setError(null)
      setCurrentStep(currentStep + 1)
    } else {
      setError('Please fill in all required fields before proceeding.')
    }
  }, [currentStep, validateStep])

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setError(null)
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const handleCreateInterview = async () => {
    if (!validateStep(5)) {
      setError('Please complete all required fields.')
      return
    }

    setIsCreating(true)
    setError(null)
    
    try {
      // Validate required fields
      if (!setup.jobTitle.trim()) {
        throw new Error('Job title is required')
      }
      if (!setup.industry) {
        throw new Error('Industry is required')
      }
      if (setup.questionTypes.length === 0) {
        throw new Error('At least one question type must be selected')
      }

      // Generate enhanced questions based on setup using intelligent system
      const questions = await aiInterviewService.generateQuestions({
        jobTitle: setup.jobTitle.trim(),
        industry: setup.industry,
        company: setup.company.trim() || undefined,
        difficulty: setup.difficulty,
        count: Math.max(3, Math.floor(setup.duration / 5)), // At least 3 questions, roughly 5 minutes per question
        types: setup.questionTypes,
        jobDescription: setup.jobDescription.trim() || undefined,
        llmProvider: setup.llmProvider, // Use selected LLM provider
        includeIdealAnswers: true // Always generate ideal answers for feedback
      })

      if (!questions || questions.length === 0) {
        throw new Error('Failed to generate interview questions. Please try again.')
      }

      // Store interview setup in sessionStorage
      const interviewData = {
        ...setup,
        questions,
        createdAt: new Date().toISOString(),
        id: `interview_${Date.now()}`,
        sessionId: aiInterviewService.getCurrentSessionId() // Include session ID if available
      }

      sessionStorage.setItem('interviewSetup', JSON.stringify(interviewData))

      // Navigate to practice page with session ID if available
      const sessionId = aiInterviewService.getCurrentSessionId()
      const practiceUrl = sessionId ? 
        `/dashboard/interviews/practice?sessionId=${sessionId}` : 
        '/dashboard/interviews/practice'
      
      router.push(practiceUrl)
    } catch (error) {
      console.error('Error creating interview:', error)
      setError(error instanceof Error ? error.message : 'Failed to create interview. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const updateSetup = useCallback((updates: Partial<InterviewSetup>) => {
    setSetup(prev => ({ ...prev, ...updates }))
    setError(null) // Clear error when user makes changes
  }, [])

  const toggleQuestionType = useCallback((type: string) => {
    const currentTypes = setup.questionTypes
    if (currentTypes.includes(type)) {
      updateSetup({ questionTypes: currentTypes.filter(t => t !== type) })
    } else {
      updateSetup({ questionTypes: [...currentTypes, type] })
    }
  }, [setup.questionTypes, updateSetup])

  const getStepTitle = (step: number): string => {
    switch (step) {
      case 1: return 'Basic Information'
      case 2: return 'Interview Type & Settings'
      case 3: return 'Question Configuration'
      case 4: return 'AI Enhancement Options'
      case 5: return 'Review & Create'
      default: return 'Setup'
    }
  }

  const isStepComplete = (step: number): boolean => {
    return step < currentStep || (step === currentStep && validateStep(step))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span>Create New Interview</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Set up a personalized AI-powered interview session
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step < currentStep
                ? 'bg-primary text-primary-foreground'
                : step === currentStep
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {step < currentStep ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                step
              )}
            </div>
            {step < 5 && (
              <div className={`w-16 h-1 mx-2 transition-colors ${
                step < currentStep ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Step {currentStep}: {getStepTitle(currentStep)}</span>
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Provide basic information about the position and company"}
            {currentStep === 2 && "Choose your interview format and difficulty settings"}
            {currentStep === 3 && "Select the types of questions you want to practice"}
            {currentStep === 4 && "Configure advanced AI features for better question generation"}
            {currentStep === 5 && "Review your settings and create the interview"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Interview Title</Label>
                <Input
                  id="title"
                  value={setup.title}
                  onChange={(e) => updateSetup({ title: e.target.value })}
                  placeholder="e.g., Software Engineer Interview Practice"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="jobTitle"
                    value={setup.jobTitle}
                    onChange={(e) => updateSetup({ jobTitle: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                    required
                    className={`w-full ${!setup.jobTitle.trim() && currentStep > 1 ? 'border-red-500' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    value={setup.company}
                    onChange={(e) => updateSetup({ company: e.target.value })}
                    placeholder="e.g., Google, Microsoft"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>
                  Industry <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {industries.map((industry) => {
                    const Icon = industry.icon
                    return (
                      <div
                        key={industry.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          setup.industry === industry.id
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'border-border hover:border-border/80'
                        }`}
                        onClick={() => updateSetup({ industry: industry.id })}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`h-5 w-5 text-${industry.color}-600`} />
                          <span className="font-medium">{industry.name}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Interview Type & Settings */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Interview Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {interviewTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <div
                        key={type.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          setup.interviewType === type.id
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'border-border hover:border-border/80'
                        }`}
                        onClick={() => updateSetup({ interviewType: type.id })}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-5 w-5 text-primary" />
                              <span className="font-medium">{type.name}</span>
                            </div>
                            {type.isNew && (
                              <Badge variant="secondary" className="text-xs">NEW</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                          <div className="space-y-1">
                            {type.features.map((feature, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select 
                    value={setup.duration.toString()} 
                    onValueChange={(value) => updateSetup({ duration: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select 
                    value={setup.difficulty} 
                    onValueChange={(value: 'easy' | 'medium' | 'hard') => updateSetup({ difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Question Configuration */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>
                  Question Types <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select at least one question type for your interview practice.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {questionTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        setup.questionTypes.includes(type.id)
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-border hover:border-border/80'
                      }`}
                      onClick={() => toggleQuestionType(type.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{type.name}</h4>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                        {setup.questionTypes.includes(type.id) && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description (Optional)</Label>
                <Textarea
                  id="jobDescription"
                  value={setup.jobDescription}
                  onChange={(e) => updateSetup({ jobDescription: e.target.value })}
                  placeholder="Paste the job description here for more targeted questions..."
                  rows={4}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Adding a job description helps our AI generate more relevant questions
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Enhanced AI Options */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">AI Enhancement Options</h3>
                <p className="text-sm text-muted-foreground">
                  Configure advanced AI features for more realistic and relevant interview questions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LLM Provider Selection */}
                <div className="space-y-3">
                  <Label>AI Model Provider</Label>
                  <div className="space-y-2">
                    {llmProviders.map((provider) => (
                      <div
                        key={provider.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          setup.llmProvider === provider.id
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'border-border hover:border-border/80'
                        }`}
                        onClick={() => updateSetup({ llmProvider: provider.id as LLMProvider })}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{provider.name}</h4>
                            <p className="text-xs text-muted-foreground">{provider.description}</p>
                          </div>
                          {setup.llmProvider === provider.id && (
                            <Badge variant="default" className="text-xs">Selected</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhancement Features */}
                <div className="space-y-3">
                  <Label>Enhancement Features</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">Web Scraping Intelligence</h4>
                        <p className="text-xs text-muted-foreground">Include trending questions from job platforms</p>
                      </div>
                      <Checkbox
                        checked={setup.includeWebScraping}
                        onCheckedChange={(checked) => updateSetup({ includeWebScraping: checked as boolean })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">Industry Trends</h4>
                        <p className="text-xs text-muted-foreground">Include current industry trends in questions</p>
                      </div>
                      <Checkbox
                        checked={setup.useIndustryTrends}
                        onCheckedChange={(checked) => updateSetup({ useIndustryTrends: checked as boolean })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">Company-Specific Questions</h4>
                        <p className="text-xs text-muted-foreground">Include questions specific to the company</p>
                      </div>
                      <Checkbox
                        checked={setup.companySpecificQuestions}
                        onCheckedChange={(checked) => updateSetup({ companySpecificQuestions: checked as boolean })}
                        disabled={!setup.company.trim()}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">Sample Answers</h4>
                        <p className="text-xs text-muted-foreground">Generate STAR method sample answers</p>
                      </div>
                      <Checkbox
                        checked={setup.includeSampleAnswers}
                        onCheckedChange={(checked) => updateSetup({ includeSampleAnswers: checked as boolean })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  <strong>Enhanced AI Features:</strong> Real-time question intelligence, industry-specific trending topics, 
                  company culture insights, STAR method sample answers, and dynamic model selection for optimal question quality.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 5: Review & Create */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-foreground mb-4">Interview Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-foreground">Title:</span>
                    <span className="ml-2 text-muted-foreground">{setup.title || 'Untitled Interview'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Job Title:</span>
                    <span className="ml-2 text-muted-foreground">{setup.jobTitle}</span>
                  </div>
                  {setup.company && (
                    <div>
                      <span className="font-medium text-foreground">Company:</span>
                      <span className="ml-2 text-muted-foreground">{setup.company}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-foreground">Industry:</span>
                    <span className="ml-2 capitalize text-muted-foreground">
                      {industries.find(i => i.id === setup.industry)?.name || setup.industry}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Duration:</span>
                    <span className="ml-2 text-muted-foreground">{setup.duration} minutes</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Type:</span>
                    <span className="ml-2 capitalize text-muted-foreground">
                      {interviewTypes.find(t => t.id === setup.interviewType)?.name || setup.interviewType}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Difficulty:</span>
                    <span className="ml-2 capitalize text-muted-foreground">{setup.difficulty}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">AI Provider:</span>
                    <span className="ml-2 capitalize text-muted-foreground">
                      {llmProviders.find(p => p.id === setup.llmProvider)?.name || setup.llmProvider}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="font-medium text-foreground">Question Types:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {setup.questionTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="capitalize">
                        {type.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Enhanced Features Summary */}
                <div className="mt-4">
                  <span className="font-medium text-foreground">AI Features Enabled:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {setup.includeWebScraping && <Badge variant="outline">Web Intelligence</Badge>}
                    {setup.useIndustryTrends && <Badge variant="outline">Industry Trends</Badge>}
                    {setup.companySpecificQuestions && setup.company && <Badge variant="outline">Company-Specific</Badge>}
                    {setup.includeSampleAnswers && <Badge variant="outline">Sample Answers</Badge>}
                  </div>
                </div>
              </div>

              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  <strong>Ready to Start:</strong> Your interview will include real-time AI analysis, 
                  personalized feedback, and performance scoring based on your selected configuration.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep < 5 ? (
          <Button
            onClick={handleNext}
            disabled={!validateStep(currentStep)}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleCreateInterview}
            disabled={isCreating || !validateStep(5)}
            className="flex items-center space-x-2"
          >
            {isCreating ? (
              <>
                <Settings className="mr-2 h-4 w-4 animate-spin" />
                <span>Creating Interview...</span>
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                <span>Start Interview</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}