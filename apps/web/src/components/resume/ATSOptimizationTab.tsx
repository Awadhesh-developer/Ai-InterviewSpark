'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText,
  Upload,
  Scan,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Brain,
  Search,
  BarChart3,
  Lightbulb,
  Plus
} from 'lucide-react'

interface ATSScore {
  overall: number
  formatting: number
  keywords: number
  structure: number
  readability: number
}

interface OptimizationSuggestion {
  id: string
  type: 'critical' | 'important' | 'minor'
  category: 'keywords' | 'formatting' | 'structure' | 'content'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'easy' | 'moderate' | 'complex'
  before?: string
  after?: string
}

interface ResumeAnalysis {
  id: string
  fileName: string
  uploadDate: string
  atsScore: ATSScore
  suggestions: OptimizationSuggestion[]
  keywords: {
    found: string[]
    missing: string[]
    density: Record<string, number>
  }
  jobMatch: number
  status: 'analyzing' | 'completed' | 'error'
}

// Mock data for demonstration
const mockAnalysis: ResumeAnalysis = {
  id: '1',
  fileName: 'john_doe_resume.pdf',
  uploadDate: '2024-01-20T10:30:00Z',
  atsScore: {
    overall: 78,
    formatting: 85,
    keywords: 72,
    structure: 80,
    readability: 76
  },
  suggestions: [
    {
      id: '1',
      type: 'critical',
      category: 'keywords',
      title: 'Missing Key Technical Skills',
      description: 'Your resume lacks important keywords that appear in the job description',
      impact: 'high',
      effort: 'easy',
      before: 'Developed web applications',
      after: 'Developed React.js web applications using TypeScript and Node.js'
    },
    {
      id: '2',
      type: 'important',
      category: 'formatting',
      title: 'Use Standard Section Headers',
      description: 'ATS systems prefer standard section headers like "Work Experience" over creative alternatives',
      impact: 'medium',
      effort: 'easy',
      before: 'Professional Journey',
      after: 'Work Experience'
    },
    {
      id: '3',
      type: 'minor',
      category: 'structure',
      title: 'Add Skills Section',
      description: 'Include a dedicated skills section for better keyword recognition',
      impact: 'medium',
      effort: 'moderate'
    }
  ],
  keywords: {
    found: ['JavaScript', 'React', 'Project Management', 'Team Leadership'],
    missing: ['TypeScript', 'Node.js', 'AWS', 'Agile', 'Scrum'],
    density: {
      'JavaScript': 3.2,
      'React': 2.8,
      'Project Management': 1.5,
      'Team Leadership': 1.2
    }
  },
  jobMatch: 72,
  status: 'completed'
}

export default function ATSOptimizationTab() {
  const [activeTab, setActiveTab] = useState('scanner')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<ResumeAnalysis | null>(null)
  const [selectedJobDescription, setSelectedJobDescription] = useState('')

  useEffect(() => {
    // Simulate loading analysis
    setCurrentAnalysis(mockAnalysis)
  }, [])

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true)
    
    // Simulate analysis process
    setTimeout(() => {
      setCurrentAnalysis(mockAnalysis)
      setIsAnalyzing(false)
    }, 3000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-950/20'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-950/20'
    return 'bg-red-100 dark:bg-red-950/20'
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />
      case 'important': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'minor': return <Lightbulb className="h-4 w-4 text-blue-500" />
      default: return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getSuggestionBadgeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'important': return 'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      case 'minor': return 'bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      default: return 'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {currentAnalysis?.atsScore.overall || 0}%
                </p>
                <p className="text-sm text-muted-foreground">ATS Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {currentAnalysis?.keywords.found.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Keywords Found</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {currentAnalysis?.jobMatch || 0}%
                </p>
                <p className="text-sm text-muted-foreground">Job Match</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {currentAnalysis?.suggestions.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Suggestions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scanner" className="flex items-center space-x-2">
            <Scan className="h-4 w-4" />
            <span>Scanner</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Keywords</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" />
            <span>Suggestions</span>
          </TabsTrigger>
        </TabsList>

        {/* Scanner Tab */}
        <TabsContent value="scanner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Scan className="h-5 w-5 text-primary" />
                <span>Resume Scanner</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Analyzing Your Resume</h3>
                  <p className="text-muted-foreground">
                    Our AI is scanning your resume for ATS compatibility...
                  </p>
                  <div className="mt-4 max-w-md mx-auto">
                    <Progress value={65} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">Analyzing keywords and formatting...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Upload Your Resume</h3>
                    <p className="text-muted-foreground mb-4">
                      Drag and drop your resume or click to browse
                    </p>
                    <div className="flex items-center justify-center space-x-4">
                      <Button 
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = '.pdf,.doc,.docx'
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file) handleFileUpload(file)
                          }
                          input.click()
                        }}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Supports PDF, DOC, DOCX
                      </span>
                    </div>
                  </div>

                  {/* Job Description Input */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Job Description (Optional)</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Paste the job description to get targeted optimization suggestions
                      </p>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        value={selectedJobDescription}
                        onChange={(e) => setSelectedJobDescription(e.target.value)}
                        placeholder="Paste the job description here for more accurate analysis..."
                        className="w-full h-32 p-3 border border-input bg-background text-foreground rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-muted-foreground">
                          {selectedJobDescription.length} characters
                        </span>
                        <Button variant="outline" size="sm">
                          <Brain className="mr-2 h-4 w-4" />
                          Analyze with AI
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {currentAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>ATS Compatibility Score</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Overall Score */}
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(currentAnalysis.atsScore.overall)} mb-2`}>
                      {currentAnalysis.atsScore.overall}%
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                    <Progress value={currentAnalysis.atsScore.overall} className="mt-2" />
                  </div>

                  {/* Individual Scores */}
                  {Object.entries(currentAnalysis.atsScore).filter(([key]) => key !== 'overall').map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(value)} mb-2`}>
                        {value}%
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <Progress value={value} className="mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-6">
          {currentAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Found Keywords</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentAnalysis.keywords.found.map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                        <span className="text-sm font-medium text-foreground">{keyword}</span>
                        <Badge className="bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400">
                          {currentAnalysis.keywords.density[keyword]?.toFixed(1) || '0.0'}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span>Missing Keywords</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentAnalysis.keywords.missing.map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                        <span className="text-sm font-medium text-foreground">{keyword}</span>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          {currentAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <span>Optimization Suggestions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentAnalysis.suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="border border-border rounded-lg p-4 bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          {getSuggestionIcon(suggestion.type)}
                          <div>
                            <h4 className="font-medium text-foreground">{suggestion.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getSuggestionBadgeColor(suggestion.type)}>
                            {suggestion.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.impact} impact
                          </Badge>
                        </div>
                      </div>
                      
                      {suggestion.before && suggestion.after && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                            <h5 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">Before</h5>
                            <p className="text-sm text-foreground">{suggestion.before}</p>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                            <h5 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">After</h5>
                            <p className="text-sm text-foreground">{suggestion.after}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-end mt-4">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Apply Fix
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
