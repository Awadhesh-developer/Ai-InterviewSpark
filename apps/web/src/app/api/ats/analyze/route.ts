import { NextRequest, NextResponse } from 'next/server'

interface ATSAnalysisRequest {
  resumeText: string
  jobDescription?: string
  analysisType: 'basic' | 'comprehensive' | 'job-match'
}

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

interface KeywordAnalysis {
  found: string[]
  missing: string[]
  density: Record<string, number>
  suggestions: string[]
}

interface ATSAnalysisResponse {
  id: string
  atsScore: ATSScore
  suggestions: OptimizationSuggestion[]
  keywords: KeywordAnalysis
  jobMatch: number
  processingTime: number
  recommendations: {
    priority: OptimizationSuggestion[]
    quick_wins: OptimizationSuggestion[]
    long_term: OptimizationSuggestion[]
  }
}

// Mock ATS analysis engine
class ATSAnalyzer {
  private commonATSKeywords = [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AWS', 'Docker',
    'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration',
    'Agile', 'Scrum', 'DevOps', 'Git', 'SQL', 'MongoDB', 'REST API'
  ]

  private formatIssues = [
    'Non-standard section headers',
    'Inconsistent bullet points',
    'Complex formatting',
    'Tables or graphics',
    'Unusual fonts'
  ]

  analyzeResume(resumeText: string, jobDescription?: string): ATSAnalysisResponse {
    const startTime = Date.now()
    
    // Simulate text processing
    const words = resumeText.toLowerCase().split(/\s+/)
    const wordCount = words.length
    
    // Keyword analysis
    const foundKeywords = this.commonATSKeywords.filter(keyword => 
      resumeText.toLowerCase().includes(keyword.toLowerCase())
    )
    
    const missingKeywords = this.commonATSKeywords.filter(keyword => 
      !resumeText.toLowerCase().includes(keyword.toLowerCase())
    )
    
    // Calculate keyword density
    const keywordDensity: Record<string, number> = {}
    foundKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi')
      const matches = resumeText.match(regex) || []
      keywordDensity[keyword] = (matches.length / wordCount) * 100
    })
    
    // Generate ATS scores
    const keywordScore = Math.min(100, (foundKeywords.length / this.commonATSKeywords.length) * 100)
    const formattingScore = this.analyzeFormatting(resumeText)
    const structureScore = this.analyzeStructure(resumeText)
    const readabilityScore = this.analyzeReadability(resumeText)
    const overallScore = Math.round((keywordScore + formattingScore + structureScore + readabilityScore) / 4)
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(resumeText, foundKeywords, missingKeywords)
    
    // Job match analysis
    const jobMatch = jobDescription ? this.calculateJobMatch(resumeText, jobDescription) : 0
    
    const processingTime = Date.now() - startTime
    
    return {
      id: `analysis_${Date.now()}`,
      atsScore: {
        overall: overallScore,
        formatting: formattingScore,
        keywords: Math.round(keywordScore),
        structure: structureScore,
        readability: readabilityScore
      },
      suggestions,
      keywords: {
        found: foundKeywords,
        missing: missingKeywords.slice(0, 10), // Limit to top 10 missing
        density: keywordDensity,
        suggestions: this.generateKeywordSuggestions(missingKeywords)
      },
      jobMatch,
      processingTime,
      recommendations: this.categorizeRecommendations(suggestions)
    }
  }

  private analyzeFormatting(text: string): number {
    let score = 100
    
    // Check for common formatting issues
    if (text.includes('\t')) score -= 10 // Tabs
    if (text.match(/[^\x00-\x7F]/g)) score -= 5 // Non-ASCII characters
    if (text.includes('•') || text.includes('◦')) score -= 5 // Special bullets
    
    // Check for consistent formatting
    const lines = text.split('\n')
    const bulletLines = lines.filter(line => line.trim().match(/^[-•*]/))
    if (bulletLines.length > 0) {
      const bulletTypes = new Set(bulletLines.map(line => line.trim()[0]))
      if (bulletTypes.size > 1) score -= 15 // Inconsistent bullets
    }
    
    return Math.max(60, score)
  }

  private analyzeStructure(text: string): number {
    let score = 100
    const sections = ['experience', 'education', 'skills', 'summary']
    const foundSections = sections.filter(section => 
      text.toLowerCase().includes(section)
    )
    
    if (foundSections.length < 3) score -= 20
    if (!text.toLowerCase().includes('experience')) score -= 15
    if (!text.toLowerCase().includes('education')) score -= 10
    
    return Math.max(50, score)
  }

  private analyzeReadability(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.split(/\s+/)
    const avgWordsPerSentence = words.length / sentences.length
    
    let score = 100
    if (avgWordsPerSentence > 20) score -= 15 // Too complex
    if (avgWordsPerSentence < 8) score -= 10 // Too simple
    
    return Math.max(60, score)
  }

  private generateSuggestions(
    text: string, 
    foundKeywords: string[], 
    missingKeywords: string[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []
    
    // Critical suggestions
    if (missingKeywords.length > 5) {
      suggestions.push({
        id: 'missing-keywords',
        type: 'critical',
        category: 'keywords',
        title: 'Add Missing Key Skills',
        description: `Your resume is missing ${missingKeywords.length} important keywords that commonly appear in job descriptions`,
        impact: 'high',
        effort: 'easy',
        before: 'Limited keyword coverage',
        after: 'Comprehensive skill representation'
      })
    }
    
    // Formatting suggestions
    if (!text.includes('EXPERIENCE') && !text.includes('Experience')) {
      suggestions.push({
        id: 'standard-headers',
        type: 'important',
        category: 'formatting',
        title: 'Use Standard Section Headers',
        description: 'ATS systems recognize standard headers like "Experience", "Education", "Skills"',
        impact: 'medium',
        effort: 'easy',
        before: 'Creative section names',
        after: 'Standard ATS-friendly headers'
      })
    }
    
    // Structure suggestions
    if (foundKeywords.length < 5) {
      suggestions.push({
        id: 'skills-section',
        type: 'important',
        category: 'structure',
        title: 'Add Dedicated Skills Section',
        description: 'Create a clear skills section to improve keyword recognition',
        impact: 'medium',
        effort: 'moderate'
      })
    }
    
    return suggestions
  }

  private generateKeywordSuggestions(missingKeywords: string[]): string[] {
    return missingKeywords.slice(0, 5).map(keyword => 
      `Consider adding "${keyword}" to your skills or experience sections`
    )
  }

  private calculateJobMatch(resumeText: string, jobDescription: string): number {
    const resumeWords = new Set(resumeText.toLowerCase().split(/\s+/))
    const jobWords = new Set(jobDescription.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...resumeWords].filter(word => jobWords.has(word)))
    const union = new Set([...resumeWords, ...jobWords])
    
    return Math.round((intersection.size / union.size) * 100)
  }

  private categorizeRecommendations(suggestions: OptimizationSuggestion[]) {
    return {
      priority: suggestions.filter(s => s.type === 'critical'),
      quick_wins: suggestions.filter(s => s.effort === 'easy'),
      long_term: suggestions.filter(s => s.effort === 'complex')
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ATSAnalysisRequest = await request.json()
    
    // Validate request
    if (!body.resumeText) {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      )
    }
    
    if (body.resumeText.length < 100) {
      return NextResponse.json(
        { error: 'Resume text is too short for meaningful analysis' },
        { status: 400 }
      )
    }
    
    // Initialize analyzer
    const analyzer = new ATSAnalyzer()
    
    // Perform analysis
    const analysis = analyzer.analyzeResume(body.resumeText, body.jobDescription)
    
    // Log analysis for monitoring
    console.log(`ATS Analysis completed: Score ${analysis.atsScore.overall}%, Processing time: ${analysis.processingTime}ms`)
    
    return NextResponse.json({
      success: true,
      analysis,
      message: 'ATS analysis completed successfully'
    })
    
  } catch (error) {
    console.error('Error in ATS analysis:', error)
    return NextResponse.json(
      { error: 'Failed to analyze resume' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('id')
    
    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }
    
    // In a real implementation, retrieve analysis from database
    // For now, return mock data
    return NextResponse.json({
      success: true,
      analysis: {
        id: analysisId,
        status: 'completed',
        createdAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Error retrieving ATS analysis:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve analysis' },
      { status: 500 }
    )
  }
}
