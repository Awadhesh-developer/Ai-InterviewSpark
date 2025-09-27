'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Brain,
  Clock,
  Target,
  Users,
  CheckCircle,
  Settings,
  Sparkles
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useInterviewStore } from '@/stores/interview'
import { InterviewConfig, Difficulty, QuestionType } from '@/types'

const interviewSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  company: z.string().optional(),
  jobDescription: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty),
  duration: z.number().min(5).max(120),
  questionTypes: z.array(z.nativeEnum(QuestionType)).min(1, 'Select at least one question type'),
  topics: z.array(z.string()).optional(),
  includeEmotionalAnalysis: z.boolean().default(true),
  includeResumeAnalysis: z.boolean().default(false),
})

type InterviewForm = z.infer<typeof interviewSchema>

const questionTypeOptions = [
  { value: QuestionType.BEHAVIORAL, label: 'Behavioral', description: 'Tell me about a time when...' },
  { value: QuestionType.TECHNICAL, label: 'Technical', description: 'Skills and knowledge assessment' },
  { value: QuestionType.SITUATIONAL, label: 'Situational', description: 'How would you handle...' },
  { value: QuestionType.STRENGTHS, label: 'Strengths', description: 'What are your key strengths?' },
  { value: QuestionType.WEAKNESSES, label: 'Weaknesses', description: 'Areas for improvement' },
]

const difficultyOptions = [
  { value: Difficulty.BEGINNER, label: 'Beginner', description: 'Entry-level questions' },
  { value: Difficulty.INTERMEDIATE, label: 'Intermediate', description: 'Mid-level complexity' },
  { value: Difficulty.ADVANCED, label: 'Advanced', description: 'Senior-level challenges' },
]

export default function CreateInterviewPage() {
  const router = useRouter()
  const { createSession, isLoading } = useInterviewStore()
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>([QuestionType.BEHAVIORAL])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InterviewForm>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      difficulty: Difficulty.INTERMEDIATE,
      duration: 30,
      questionTypes: [QuestionType.BEHAVIORAL],
      includeEmotionalAnalysis: true,
      includeResumeAnalysis: false,
    },
  })

  const watchedDuration = watch('duration')
  const watchedDifficulty = watch('difficulty')

  const onSubmit = async (data: InterviewForm) => {
    try {
      const session = await createSession(data as InterviewConfig)
      router.push(`/dashboard/interviews/${session.id}`)
    } catch (error) {
      // Error is handled by the store
    }
  }

  const toggleQuestionType = (type: QuestionType) => {
    const newTypes = selectedQuestionTypes.includes(type)
      ? selectedQuestionTypes.filter(t => t !== type)
      : [...selectedQuestionTypes, type]

    setSelectedQuestionTypes(newTypes)
    setValue('questionTypes', newTypes)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
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
          <h1 className="text-3xl font-bold text-gray-600">Create New Interview</h1>
          <p className="text-gray-600 mt-1">
            Configure your AI-powered mock interview session
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Job Information</span>
            </CardTitle>
            <CardDescription>
              Tell us about the position you're preparing for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Software Engineer"
                  {...register('jobTitle')}
                  className={errors.jobTitle ? 'border-red-500' : ''}
                />
                {errors.jobTitle && (
                  <p className="text-sm text-red-500">{errors.jobTitle.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company (Optional)</Label>
                <Input
                  id="company"
                  placeholder="e.g., Google, Microsoft"
                  {...register('company')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description (Optional)</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description here to get more targeted questions..."
                rows={4}
                {...register('jobDescription')}
              />
              <p className="text-sm text-gray-500">
                Adding a job description helps our AI generate more relevant questions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Interview Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-purple-600" />
              <span>Interview Settings</span>
            </CardTitle>
            <CardDescription>
              Customize your interview experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Difficulty Selection */}
            <div className="space-y-3">
              <Label>Difficulty Level</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {difficultyOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      watchedDifficulty === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue('difficulty', option.value)}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <Label htmlFor="duration">Interview Duration</Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  max="120"
                  className="w-24"
                  {...register('duration', { valueAsNumber: true })}
                />
                <span className="text-sm text-gray-500">minutes</span>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Estimated {Math.ceil(watchedDuration / 5)} questions</span>
                </div>
              </div>
              {errors.duration && (
                <p className="text-sm text-red-500">{errors.duration.message}</p>
              )}
            </div>

            {/* Question Types */}
            <div className="space-y-3">
              <Label>Question Types</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {questionTypeOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedQuestionTypes.includes(option.value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleQuestionType(option.value)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                      {selectedQuestionTypes.includes(option.value) && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {errors.questionTypes && (
                <p className="text-sm text-red-500">{errors.questionTypes.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-600" />
              <span>AI Features</span>
            </CardTitle>
            <CardDescription>
              Enable advanced AI analysis for better feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">Emotional Analysis</div>
                <div className="text-sm text-gray-500">
                  Analyze your facial expressions and tone during the interview
                </div>
              </div>
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...register('includeEmotionalAnalysis')}
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">Resume Analysis</div>
                <div className="text-sm text-gray-500">
                  Generate questions based on your uploaded resume
                </div>
              </div>
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...register('includeResumeAnalysis')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <Brain className="h-4 w-4" />
            <span>Create Interview</span>
          </Button>
        </div>
      </form>
    </div>
  )
}