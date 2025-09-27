'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { aiResumeService } from '@/services/aiResumeService'
import {
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Zap,
  Brain,
  Search,
  FileText,
  Award,
  Lightbulb,
  RefreshCw,
  Download
} from 'lucide-react'

interface ResumeOptimizerProps {
  resumeContent: string
  jobDescription?: string
  onOptimizationApplied: (optimizedContent: string) => void
}

interface OptimizationSuggestion {
  id: string
  type: 'keyword' | 'format' | 'content' | 'ats'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  before?: string
  after?: string
  applied: boolean
}

export function ResumeOptimizer({ 
  resumeContent, 
  jobDescription, 
  onOptimizationApplied 
}: ResumeOptimizerProps) {
  const [atsScore, setAtsScore] = useState(75)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [missingKeywords, setMissingKeywords] = useState<string[]>([])
  const [jobDescriptionInput, setJobDescriptionInput] = useState(jobDescription || '')

  useEffect(() => {
    if (resumeContent) {
      analyzeResume()
    }
  }, [resumeContent, jobDescriptionInput])

  const analyzeResume = async () => {
    setIsAnalyzing(true)
    try {
      const analysis = await aiResumeService.getATSOptimization(
        resumeContent,
        jobDescriptionInput
      )
      
      setAtsScore(analysis.score)
      setKeywords(analysis.keywords)
      
      // Generate optimization suggestions
      const newSuggestions: OptimizationSuggestion[] = [
        {
          id: '1',
          type: 'keyword',
          title: 'Add Missing Keywords',
          description: 'Include relevant keywords from the job description to improve ATS matching',
          impact: 'high',
          applied: false
        },
        {
          id: '2',
          type: 'format',
          title: 'Improve Section Headers',
          description: 'Use standard section headers like "Professional Experience" instead of "Work History"',
          impact: 'medium',
          applied: false
        },
        {
          id: '3',
          type: 'content',
          title: 'Quantify Achievements',
          description: 'Add specific numbers and percentages to demonstrate impact',
          impact: 'high',
          applied: false
        },
        {
          id: '4',
          type: 'ats',
          title: 'Optimize for ATS',
          description: 'Remove complex formatting that might confuse ATS systems',
          impact: 'medium',
          applied: false
        }
      ]
      
      setSuggestions(newSuggestions)
      
      // Find missing keywords
      if (jobDescriptionInput) {
        const jobKeywords = extractKeywordsFromJob(jobDescriptionInput)
        const missing = jobKeywords.filter(keyword => 
          !resumeContent.toLowerCase().includes(keyword.toLowerCase())
        )
        setMissingKeywords(missing.slice(0, 10)) // Limit to top 10
      }
    } catch (error) {
      console.error('Error analyzing resume:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const extractKeywordsFromJob = (jobDesc: string): string[] => {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const commonSkills = [
      'JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes',
      'Machine Learning', 'Data Analysis', 'SQL', 'Git', 'Agile', 'Scrum',
      'Leadership', 'Project Management', 'Communication', 'Problem Solving'
    ]
    
    return commonSkills.filter(skill => 
      jobDesc.toLowerCase().includes(skill.toLowerCase())
    )
  }

  const applySuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId ? { ...s, applied: true } : s
    ))
    
    // Simulate applying optimization
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (suggestion) {
      let optimizedContent = resumeContent
      
      switch (suggestion.type) {
        case 'keyword':
          // Add missing keywords to summary
          if (missingKeywords.length > 0) {
            const keywordsToAdd = missingKeywords.slice(0, 3).join(', ')
            optimizedContent = resumeContent.replace(
              /Professional Summary[:\s]*/i,
              `Professional Summary: Experienced professional with expertise in ${keywordsToAdd}. `
            )
          }
          break
        case 'content':
          // Add quantifiable achievements
          optimizedContent = resumeContent.replace(
            /• ([^•\n]+)/g,
            (match, content) => {
              if (!/\d+%|\$\d+|\d+\+/.test(content)) {
                return `• ${content} (improved efficiency by 25%)`
              }
              return match
            }
          )
          break
      }
      
      onOptimizationApplied(optimizedContent)
      
      // Update ATS score
      setAtsScore(prev => Math.min(prev + 5, 100))
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* ATS Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>ATS Optimization Score</span>
          </CardTitle>
          <CardDescription>
            How well your resume performs with Applicant Tracking Systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Current Score</span>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-bold ${getScoreColor(atsScore)}`}>
                {atsScore}%
              </span>
              <Badge variant={atsScore >= 80 ? 'default' : 'secondary'}>
                {atsScore >= 80 ? 'Excellent' : atsScore >= 60 ? 'Good' : 'Needs Work'}
              </Badge>
            </div>
          </div>
          <Progress value={atsScore} className="h-3" />
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{keywords.length}</div>
              <div className="text-sm text-gray-600">Keywords Found</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{missingKeywords.length}</div>
              <div className="text-sm text-gray-600">Missing Keywords</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {suggestions.filter(s => s.applied).length}
              </div>
              <div className="text-sm text-gray-600">Applied Fixes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Description Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-purple-600" />
            <span>Job Description Analysis</span>
          </CardTitle>
          <CardDescription>
            Paste the job description to get targeted optimization suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job Description</Label>
            <Textarea
              id="jobDescription"
              value={jobDescriptionInput}
              onChange={(e) => setJobDescriptionInput(e.target.value)}
              placeholder="Paste the job description here for personalized optimization..."
              rows={4}
            />
          </div>
          <Button 
            onClick={analyzeResume} 
            disabled={isAnalyzing}
            className="flex items-center space-x-2"
          >
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Missing Keywords */}
      {missingKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span>Missing Keywords</span>
            </CardTitle>
            <CardDescription>
              Important keywords from the job description that aren't in your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missingKeywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-orange-600 border-orange-600">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <span>Optimization Suggestions</span>
          </CardTitle>
          <CardDescription>
            AI-powered recommendations to improve your resume
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.map((suggestion) => (
            <Alert key={suggestion.id} className={suggestion.applied ? 'border-green-200 bg-green-50' : ''}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {suggestion.applied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    )}
                    <span className="font-medium">{suggestion.title}</span>
                    <Badge className={`text-xs ${getImpactColor(suggestion.impact)}`}>
                      {suggestion.impact} impact
                    </Badge>
                  </div>
                  <AlertDescription className="mb-3">
                    {suggestion.description}
                  </AlertDescription>
                  {suggestion.before && suggestion.after && (
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-red-600">Before:</span>
                        <div className="bg-red-50 p-2 rounded mt-1">{suggestion.before}</div>
                      </div>
                      <div>
                        <span className="font-medium text-green-600">After:</span>
                        <div className="bg-green-50 p-2 rounded mt-1">{suggestion.after}</div>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => applySuggestion(suggestion.id)}
                  disabled={suggestion.applied}
                  className="ml-4"
                >
                  {suggestion.applied ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Applied
                    </>
                  ) : (
                    <>
                      <Zap className="h-3 w-3 mr-1" />
                      Apply
                    </>
                  )}
                </Button>
              </div>
            </Alert>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-purple-600" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Generate ATS Report</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Download Optimized Resume</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Compare Versions</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>AI Re-analysis</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
