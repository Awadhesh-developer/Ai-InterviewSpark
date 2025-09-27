'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { aiResumeService, AIContentSuggestion } from '@/services/aiResumeService'
import {
  Sparkles,
  Lightbulb,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Wand2,
  Brain,
  TrendingUp
} from 'lucide-react'

interface AIResumeBuilderProps {
  onContentChange: (section: string, content: string) => void
  currentContent: {
    summary: string
    experience: string
    skills: string[]
  }
  jobTitle?: string
  industry?: string
}

export function AIResumeBuilder({ 
  onContentChange, 
  currentContent, 
  jobTitle, 
  industry 
}: AIResumeBuilderProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<AIContentSuggestion[]>([])
  const [atsScore, setAtsScore] = useState(75)
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([])
  const [showAIAssistant, setShowAIAssistant] = useState(true)

  useEffect(() => {
    loadSkillSuggestions()
    analyzeCurrentContent()
  }, [jobTitle, industry])

  const loadSkillSuggestions = async () => {
    try {
      const suggestions = await aiResumeService.generateSkillSuggestions({
        jobTitle,
        industry,
        experienceLevel: 'mid'
      })
      setSkillSuggestions(suggestions)
    } catch (error) {
      console.error('Error loading skill suggestions:', error)
    }
  }

  const analyzeCurrentContent = async () => {
    try {
      const summaryAnalysis = await aiResumeService.analyzeContent(
        currentContent.summary, 
        'summary'
      )
      const experienceAnalysis = await aiResumeService.analyzeContent(
        currentContent.experience, 
        'experience'
      )
      
      setSuggestions([...summaryAnalysis, ...experienceAnalysis])
      
      // Update ATS score
      const atsAnalysis = await aiResumeService.getATSOptimization(
        `${currentContent.summary} ${currentContent.experience}`
      )
      setAtsScore(atsAnalysis.score)
    } catch (error) {
      console.error('Error analyzing content:', error)
    }
  }

  const generateAISummary = async () => {
    setIsGenerating(true)
    try {
      const summary = await aiResumeService.generateSummary({
        jobTitle,
        industry,
        experienceLevel: 'mid',
        skills: currentContent.skills
      })
      onContentChange('summary', summary)
    } catch (error) {
      console.error('Error generating summary:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateExperienceBullets = async () => {
    setIsGenerating(true)
    try {
      const bullets = await aiResumeService.generateExperienceBullets({
        jobTitle,
        industry,
        company: 'Current Company',
        position: jobTitle || 'Professional'
      })
      const bulletText = bullets.map(bullet => `• ${bullet}`).join('\n')
      onContentChange('experience', bulletText)
    } catch (error) {
      console.error('Error generating experience bullets:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const addSkillSuggestion = (skill: string) => {
    if (!currentContent.skills.includes(skill)) {
      const updatedSkills = [...currentContent.skills, skill]
      onContentChange('skills', updatedSkills.join(', '))
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Improvement'
  }

  return (
    <div className="space-y-6">
      {/* AI Assistant Header */}
      {showAIAssistant && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900">AI Resume Assistant</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIAssistant(false)}
              >
                ×
              </Button>
            </div>
            <CardDescription className="text-blue-700">
              Get AI-powered suggestions to optimize your resume for {jobTitle || 'your target role'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ATS Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium">ATS Compatibility Score</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`font-bold ${getScoreColor(atsScore)}`}>
                  {atsScore}%
                </span>
                <Badge variant={atsScore >= 80 ? 'default' : 'secondary'}>
                  {getScoreLabel(atsScore)}
                </Badge>
              </div>
            </div>
            <Progress value={atsScore} className="h-2" />

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={generateAISummary}
                disabled={isGenerating}
                className="flex items-center space-x-1"
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                <span>Generate Summary</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={generateExperienceBullets}
                disabled={isGenerating}
                className="flex items-center space-x-1"
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Wand2 className="h-3 w-3" />
                )}
                <span>Generate Experience</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <span>AI Suggestions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <Alert key={index}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p>{suggestion.content}</p>
                    <p className="text-xs text-gray-500">{suggestion.reasoning}</p>
                    {suggestion.atsOptimized && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        ATS Optimized
                      </Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skill Suggestions */}
      {skillSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Recommended Skills</span>
            </CardTitle>
            <CardDescription>
              Skills commonly required for {jobTitle || 'your role'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skillSuggestions.map((skill, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => addSkillSuggestion(skill)}
                  className="flex items-center space-x-1"
                  disabled={currentContent.skills.includes(skill)}
                >
                  {currentContent.skills.includes(skill) ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <span>+</span>
                  )}
                  <span>{skill}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Content Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>AI Content Generator</span>
          </CardTitle>
          <CardDescription>
            Generate professional content tailored to your role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Job Title</Label>
              <Input
                placeholder="e.g., Senior Software Engineer"
                defaultValue={jobTitle}
              />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input
                placeholder="e.g., Technology"
                defaultValue={industry}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Job Description (Optional)</Label>
            <Textarea
              placeholder="Paste the job description here for more targeted suggestions..."
              rows={3}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={generateAISummary}
              disabled={isGenerating}
              className="flex items-center space-x-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>Generate Professional Summary</span>
            </Button>
            <Button
              variant="outline"
              onClick={generateExperienceBullets}
              disabled={isGenerating}
              className="flex items-center space-x-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              <span>Generate Experience Points</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span>Optimization Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Use Action Verbs</p>
                <p className="text-sm text-gray-600">
                  Start bullet points with strong action verbs like "developed," "implemented," "led"
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Include Numbers</p>
                <p className="text-sm text-gray-600">
                  Quantify achievements with percentages, dollar amounts, or other metrics
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Match Keywords</p>
                <p className="text-sm text-gray-600">
                  Include relevant keywords from the job description
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
