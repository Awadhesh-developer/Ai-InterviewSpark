'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { 
  Search,
  TrendingUp,
  Brain,
  Target,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Filter,
  Download,
  Copy,
  Zap
} from 'lucide-react'

interface Keyword {
  term: string
  frequency: number
  density: number
  importance: 'high' | 'medium' | 'low'
  category: string
  inResume: boolean
  suggestions?: string[]
}

interface KeywordAnalysis {
  totalKeywords: number
  foundKeywords: number
  missingKeywords: number
  overallDensity: number
  categories: {
    technical: Keyword[]
    soft: Keyword[]
    industry: Keyword[]
    tools: Keyword[]
  }
  recommendations: {
    add: string[]
    optimize: string[]
    reduce: string[]
  }
}

interface KeywordOptimizerProps {
  jobDescription?: string
  resumeText?: string
  onOptimizationUpdate?: (keywords: string[]) => void
}

export default function KeywordOptimizer({ 
  jobDescription = '', 
  resumeText = '',
  onOptimizationUpdate 
}: KeywordOptimizerProps) {
  const [analysis, setAnalysis] = useState<KeywordAnalysis | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [customKeyword, setCustomKeyword] = useState('')

  // Mock keyword analysis data
  const mockAnalysis: KeywordAnalysis = {
    totalKeywords: 45,
    foundKeywords: 28,
    missingKeywords: 17,
    overallDensity: 3.2,
    categories: {
      technical: [
        { term: 'JavaScript', frequency: 8, density: 2.1, importance: 'high', category: 'technical', inResume: true },
        { term: 'React', frequency: 6, density: 1.6, importance: 'high', category: 'technical', inResume: true },
        { term: 'TypeScript', frequency: 0, density: 0, importance: 'high', category: 'technical', inResume: false, suggestions: ['Add to skills section', 'Mention in project descriptions'] },
        { term: 'Node.js', frequency: 0, density: 0, importance: 'high', category: 'technical', inResume: false },
        { term: 'Python', frequency: 3, density: 0.8, importance: 'medium', category: 'technical', inResume: true },
        { term: 'AWS', frequency: 0, density: 0, importance: 'medium', category: 'technical', inResume: false }
      ],
      soft: [
        { term: 'Leadership', frequency: 4, density: 1.1, importance: 'high', category: 'soft', inResume: true },
        { term: 'Communication', frequency: 2, density: 0.5, importance: 'high', category: 'soft', inResume: true },
        { term: 'Problem Solving', frequency: 0, density: 0, importance: 'medium', category: 'soft', inResume: false },
        { term: 'Team Collaboration', frequency: 3, density: 0.8, importance: 'medium', category: 'soft', inResume: true }
      ],
      industry: [
        { term: 'Software Development', frequency: 5, density: 1.3, importance: 'high', category: 'industry', inResume: true },
        { term: 'Agile', frequency: 0, density: 0, importance: 'high', category: 'industry', inResume: false },
        { term: 'Scrum', frequency: 0, density: 0, importance: 'medium', category: 'industry', inResume: false },
        { term: 'DevOps', frequency: 1, density: 0.3, importance: 'medium', category: 'industry', inResume: true }
      ],
      tools: [
        { term: 'Git', frequency: 2, density: 0.5, importance: 'high', category: 'tools', inResume: true },
        { term: 'Docker', frequency: 0, density: 0, importance: 'medium', category: 'tools', inResume: false },
        { term: 'Jenkins', frequency: 0, density: 0, importance: 'low', category: 'tools', inResume: false },
        { term: 'Jira', frequency: 1, density: 0.3, importance: 'low', category: 'tools', inResume: true }
      ]
    },
    recommendations: {
      add: ['TypeScript', 'Node.js', 'Agile', 'Problem Solving'],
      optimize: ['JavaScript', 'React', 'Leadership'],
      reduce: ['Python']
    }
  }

  useEffect(() => {
    if (jobDescription || resumeText) {
      analyzeKeywords()
    }
  }, [jobDescription, resumeText])

  const analyzeKeywords = async () => {
    setIsAnalyzing(true)
    
    // Simulate analysis
    setTimeout(() => {
      setAnalysis(mockAnalysis)
      setIsAnalyzing(false)
    }, 2000)
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      case 'low': return 'bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      default: return 'bg-gray-100 dark:bg-gray-950/20 text-gray-800 dark:text-gray-400'
    }
  }

  const getStatusIcon = (inResume: boolean) => {
    return inResume ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getAllKeywords = () => {
    if (!analysis) return []
    
    return Object.values(analysis.categories).flat()
  }

  const getFilteredKeywords = () => {
    let keywords = getAllKeywords()
    
    if (selectedCategory !== 'all') {
      keywords = keywords.filter(k => k.category === selectedCategory)
    }
    
    if (searchTerm) {
      keywords = keywords.filter(k => 
        k.term.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return keywords
  }

  const addCustomKeyword = () => {
    if (!customKeyword.trim()) return
    
    // In a real implementation, this would add the keyword to the analysis
    console.log('Adding custom keyword:', customKeyword)
    setCustomKeyword('')
  }

  if (isAnalyzing) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h3 className="text-lg font-medium text-foreground">Analyzing Keywords</h3>
            <p className="text-muted-foreground">
              Our AI is extracting and analyzing keywords from your resume and job description...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-primary" />
            <span>Keyword Optimization</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Analysis Available</h3>
            <p className="text-muted-foreground">
              Upload a resume and job description to start keyword analysis
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Keyword Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">{analysis.totalKeywords}</p>
                <p className="text-sm text-muted-foreground">Total Keywords</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">{analysis.foundKeywords}</p>
                <p className="text-sm text-muted-foreground">Found</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">{analysis.missingKeywords}</p>
                <p className="text-sm text-muted-foreground">Missing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">{analysis.overallDensity}%</p>
                <p className="text-sm text-muted-foreground">Density</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical Skills</option>
              <option value="soft">Soft Skills</option>
              <option value="industry">Industry Terms</option>
              <option value="tools">Tools & Technologies</option>
            </select>
            
            <Button onClick={analyzeKeywords}>
              <Brain className="mr-2 h-4 w-4" />
              Re-analyze
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keywords List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Keyword Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getFilteredKeywords().map((keyword, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(keyword.inResume)}
                  <div>
                    <h4 className="font-medium text-foreground">{keyword.term}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getImportanceColor(keyword.importance)}>
                        {keyword.importance} priority
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {keyword.category}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {keyword.frequency} times
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {keyword.density}% density
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {keyword.inResume ? (
                      <Button size="sm" variant="outline">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Optimize
                      </Button>
                    ) : (
                      <Button size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <span>AI Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center space-x-2">
                <Plus className="h-4 w-4 text-green-600" />
                <span>Add These Keywords</span>
              </h4>
              {analysis.recommendations.add.map((keyword, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                  <span className="text-sm font-medium text-foreground">{keyword}</span>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span>Optimize These</span>
              </h4>
              {analysis.recommendations.optimize.map((keyword, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                  <span className="text-sm font-medium text-foreground">{keyword}</span>
                  <Button size="sm" variant="outline">
                    <Zap className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center space-x-2">
                <Minus className="h-4 w-4 text-yellow-600" />
                <span>Consider Reducing</span>
              </h4>
              {analysis.recommendations.reduce.map((keyword, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
                  <span className="text-sm font-medium text-foreground">{keyword}</span>
                  <Button size="sm" variant="outline">
                    <AlertTriangle className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Keywords */}
      <Card>
        <CardHeader>
          <CardTitle>Add Custom Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <Input
              placeholder="Enter a keyword to add..."
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomKeyword()}
              className="flex-1"
            />
            <Button onClick={addCustomKeyword}>
              <Plus className="mr-2 h-4 w-4" />
              Add Keyword
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
