/**
 * Natural Language Processing Analysis Service
 * Provides advanced text analysis for interview responses and question generation
 */

interface TextAnalysisResult {
  sentiment: SentimentAnalysis
  keywords: KeywordAnalysis
  complexity: ComplexityMetrics
  communication: CommunicationMetrics
  content: ContentAnalysis
  confidence: number
}

interface SentimentAnalysis {
  overall: number // -1 to 1 (negative to positive)
  confidence: number
  emotions: {
    joy: number
    sadness: number
    anger: number
    fear: number
    surprise: number
    disgust: number
  }
  tone: 'professional' | 'casual' | 'confident' | 'uncertain' | 'enthusiastic' | 'neutral'
}

interface KeywordAnalysis {
  technical: string[]
  behavioral: string[]
  leadership: string[]
  problemSolving: string[]
  communication: string[]
  relevanceScore: number
}

interface ComplexityMetrics {
  readabilityScore: number // 0-100 (higher = more readable)
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced' | 'expert'
  sentenceComplexity: number // 0-1
  conceptualDepth: number // 0-1
}

interface CommunicationMetrics {
  clarity: number // 0-1
  coherence: number // 0-1
  completeness: number // 0-1
  conciseness: number // 0-1
  structure: number // 0-1
  engagement: number // 0-1
}

interface ContentAnalysis {
  topicRelevance: number // 0-1
  exampleQuality: number // 0-1
  technicalAccuracy: number // 0-1
  creativityLevel: number // 0-1
  leadershipIndicators: number // 0-1
  problemSolvingApproach: number // 0-1
}

class NLPAnalysisService {
  private technicalKeywords: Set<string>
  private behavioralKeywords: Set<string>
  private leadershipKeywords: Set<string>
  private problemSolvingKeywords: Set<string>
  private communicationKeywords: Set<string>
  private positiveWords: Set<string>
  private negativeWords: Set<string>

  constructor() {
    this.initializeKeywordDictionaries()
  }

  private initializeKeywordDictionaries(): void {
    this.technicalKeywords = new Set([
      'algorithm', 'architecture', 'framework', 'database', 'api', 'system',
      'performance', 'scalability', 'optimization', 'debugging', 'testing',
      'deployment', 'security', 'integration', 'microservices', 'cloud',
      'devops', 'automation', 'monitoring', 'analytics', 'machine learning',
      'artificial intelligence', 'data structure', 'design pattern', 'refactoring'
    ])

    this.behavioralKeywords = new Set([
      'teamwork', 'collaboration', 'communication', 'conflict', 'resolution',
      'feedback', 'mentoring', 'learning', 'adaptation', 'flexibility',
      'initiative', 'responsibility', 'accountability', 'integrity', 'ethics',
      'diversity', 'inclusion', 'empathy', 'patience', 'perseverance'
    ])

    this.leadershipKeywords = new Set([
      'leadership', 'management', 'delegation', 'motivation', 'inspiration',
      'vision', 'strategy', 'decision', 'influence', 'guidance', 'coaching',
      'development', 'empowerment', 'accountability', 'direction', 'goals',
      'objectives', 'planning', 'execution', 'results', 'performance'
    ])

    this.problemSolvingKeywords = new Set([
      'problem', 'solution', 'analysis', 'approach', 'methodology', 'process',
      'investigation', 'research', 'evaluation', 'assessment', 'diagnosis',
      'troubleshooting', 'debugging', 'optimization', 'improvement', 'innovation',
      'creativity', 'brainstorming', 'alternatives', 'options', 'trade-offs'
    ])

    this.communicationKeywords = new Set([
      'explain', 'communicate', 'present', 'discuss', 'clarify', 'articulate',
      'express', 'convey', 'share', 'inform', 'update', 'report', 'document',
      'listen', 'understand', 'feedback', 'questions', 'answers', 'dialogue'
    ])

    this.positiveWords = new Set([
      'excellent', 'great', 'good', 'successful', 'effective', 'efficient',
      'innovative', 'creative', 'outstanding', 'impressive', 'strong', 'solid',
      'confident', 'enthusiastic', 'passionate', 'motivated', 'dedicated',
      'committed', 'reliable', 'trustworthy', 'professional', 'skilled'
    ])

    this.negativeWords = new Set([
      'difficult', 'challenging', 'problem', 'issue', 'concern', 'worry',
      'struggle', 'failure', 'mistake', 'error', 'confusion', 'uncertainty',
      'doubt', 'hesitation', 'weakness', 'limitation', 'obstacle', 'barrier'
    ])
  }

  async analyzeText(text: string, context?: {
    questionCategory?: string
    expectedKeywords?: string[]
    targetAudience?: string
  }): Promise<TextAnalysisResult> {
    const cleanText = this.preprocessText(text)
    
    const sentiment = this.analyzeSentiment(cleanText)
    const keywords = this.analyzeKeywords(cleanText, context?.expectedKeywords)
    const complexity = this.analyzeComplexity(cleanText)
    const communication = this.analyzeCommunication(cleanText)
    const content = this.analyzeContent(cleanText, context)
    
    // Calculate overall confidence based on text length and coherence
    const confidence = this.calculateAnalysisConfidence(cleanText, communication.coherence)

    return {
      sentiment,
      keywords,
      complexity,
      communication,
      content,
      confidence
    }
  }

  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  private analyzeSentiment(text: string): SentimentAnalysis {
    const words = text.split(' ')
    let positiveScore = 0
    let negativeScore = 0
    let totalWords = words.length

    // Simple sentiment analysis based on keyword matching
    words.forEach(word => {
      if (this.positiveWords.has(word)) positiveScore++
      if (this.negativeWords.has(word)) negativeScore++
    })

    const overall = totalWords > 0 
      ? (positiveScore - negativeScore) / totalWords 
      : 0

    // Normalize to -1 to 1 range
    const normalizedSentiment = Math.max(-1, Math.min(1, overall * 2))
    
    // Calculate confidence based on sentiment word density
    const sentimentWordDensity = (positiveScore + negativeScore) / totalWords
    const confidence = Math.min(1, sentimentWordDensity * 5)

    // Simple emotion detection based on keywords
    const emotions = {
      joy: this.countEmotionWords(text, ['happy', 'excited', 'pleased', 'satisfied', 'delighted']) / totalWords,
      sadness: this.countEmotionWords(text, ['sad', 'disappointed', 'frustrated', 'upset']) / totalWords,
      anger: this.countEmotionWords(text, ['angry', 'annoyed', 'irritated', 'furious']) / totalWords,
      fear: this.countEmotionWords(text, ['worried', 'concerned', 'anxious', 'nervous']) / totalWords,
      surprise: this.countEmotionWords(text, ['surprised', 'amazed', 'shocked', 'unexpected']) / totalWords,
      disgust: this.countEmotionWords(text, ['disgusted', 'appalled', 'revolted']) / totalWords
    }

    // Determine tone
    let tone: SentimentAnalysis['tone'] = 'neutral'
    if (normalizedSentiment > 0.3) tone = 'confident'
    else if (normalizedSentiment > 0.1) tone = 'professional'
    else if (normalizedSentiment < -0.3) tone = 'uncertain'
    else if (emotions.joy > 0.02) tone = 'enthusiastic'

    return {
      overall: normalizedSentiment,
      confidence,
      emotions,
      tone
    }
  }

  private countEmotionWords(text: string, emotionWords: string[]): number {
    return emotionWords.reduce((count, word) => {
      return count + (text.split(word).length - 1)
    }, 0)
  }

  private analyzeKeywords(text: string, expectedKeywords?: string[]): KeywordAnalysis {
    const words = text.split(' ')
    
    const technical = this.extractKeywords(words, this.technicalKeywords)
    const behavioral = this.extractKeywords(words, this.behavioralKeywords)
    const leadership = this.extractKeywords(words, this.leadershipKeywords)
    const problemSolving = this.extractKeywords(words, this.problemSolvingKeywords)
    const communication = this.extractKeywords(words, this.communicationKeywords)

    // Calculate relevance score based on expected keywords
    let relevanceScore = 0.5 // Default neutral score
    if (expectedKeywords && expectedKeywords.length > 0) {
      const foundExpectedKeywords = expectedKeywords.filter(keyword =>
        text.includes(keyword.toLowerCase())
      )
      relevanceScore = foundExpectedKeywords.length / expectedKeywords.length
    }

    return {
      technical,
      behavioral,
      leadership,
      problemSolving,
      communication,
      relevanceScore
    }
  }

  private extractKeywords(words: string[], keywordSet: Set<string>): string[] {
    return words.filter(word => keywordSet.has(word))
  }

  private analyzeComplexity(text: string): ComplexityMetrics {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.split(' ').filter(w => w.length > 0)
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1)
    
    // Simple readability score (inverse of complexity)
    const readabilityScore = Math.max(0, Math.min(100, 
      100 - (avgWordsPerSentence - 10) * 2 // Penalize very long sentences
    ))

    // Vocabulary level based on average word length
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
    let vocabularyLevel: ComplexityMetrics['vocabularyLevel'] = 'basic'
    if (avgWordLength > 6) vocabularyLevel = 'expert'
    else if (avgWordLength > 5) vocabularyLevel = 'advanced'
    else if (avgWordLength > 4) vocabularyLevel = 'intermediate'

    // Sentence complexity based on average sentence length
    const sentenceComplexity = Math.min(1, avgWordsPerSentence / 20)

    // Conceptual depth based on technical and abstract word usage
    const abstractWords = words.filter(word => 
      word.length > 6 && (
        this.technicalKeywords.has(word) ||
        word.includes('tion') || 
        word.includes('ment') ||
        word.includes('ness')
      )
    )
    const conceptualDepth = Math.min(1, abstractWords.length / words.length * 5)

    return {
      readabilityScore,
      vocabularyLevel,
      sentenceComplexity,
      conceptualDepth
    }
  }

  private analyzeCommunication(text: string): CommunicationMetrics {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.split(' ').filter(w => w.length > 0)

    // Clarity: based on sentence length and word complexity
    const avgSentenceLength = words.length / Math.max(sentences.length, 1)
    const clarity = Math.max(0, Math.min(1, 1 - (avgSentenceLength - 15) / 20))

    // Coherence: simple measure based on transition words and logical flow
    const transitionWords = ['however', 'therefore', 'furthermore', 'additionally', 'consequently', 'meanwhile', 'first', 'second', 'finally']
    const transitionCount = transitionWords.reduce((count, word) => 
      count + (text.split(word).length - 1), 0
    )
    const coherence = Math.min(1, transitionCount / Math.max(sentences.length, 1) + 0.5)

    // Completeness: based on presence of examples and explanations
    const completenessIndicators = ['example', 'instance', 'specifically', 'detail', 'because', 'since', 'due to']
    const completenessCount = completenessIndicators.reduce((count, word) =>
      count + (text.split(word).length - 1), 0
    )
    const completeness = Math.min(1, completenessCount / 3 + 0.3)

    // Conciseness: inverse of redundancy
    const uniqueWords = new Set(words)
    const conciseness = uniqueWords.size / words.length

    // Structure: based on logical organization indicators
    const structureIndicators = ['first', 'second', 'third', 'finally', 'in conclusion', 'to summarize']
    const structureCount = structureIndicators.reduce((count, phrase) =>
      count + (text.split(phrase).length - 1), 0
    )
    const structure = Math.min(1, structureCount / 2 + 0.4)

    // Engagement: based on active voice and engaging language
    const engagementWords = ['achieve', 'create', 'develop', 'implement', 'improve', 'solve', 'build']
    const engagementCount = engagementWords.reduce((count, word) =>
      count + (text.split(word).length - 1), 0
    )
    const engagement = Math.min(1, engagementCount / words.length * 10 + 0.3)

    return {
      clarity,
      coherence,
      completeness,
      conciseness,
      structure,
      engagement
    }
  }

  private analyzeContent(text: string, context?: any): ContentAnalysis {
    const words = text.split(' ')

    // Topic relevance based on context keywords
    let topicRelevance = 0.5
    if (context?.expectedKeywords) {
      const relevantWords = context.expectedKeywords.filter((keyword: string) =>
        text.includes(keyword.toLowerCase())
      )
      topicRelevance = relevantWords.length / context.expectedKeywords.length
    }

    // Example quality based on specific example indicators
    const exampleIndicators = ['example', 'instance', 'case', 'situation', 'time when', 'experience']
    const exampleCount = exampleIndicators.reduce((count, indicator) =>
      count + (text.split(indicator).length - 1), 0
    )
    const exampleQuality = Math.min(1, exampleCount / 2 + 0.2)

    // Technical accuracy (simplified heuristic)
    const technicalTerms = this.extractKeywords(words, this.technicalKeywords)
    const technicalAccuracy = Math.min(1, technicalTerms.length / Math.max(words.length / 20, 1))

    // Creativity level based on innovative language
    const creativityWords = ['innovative', 'creative', 'unique', 'novel', 'original', 'different', 'alternative']
    const creativityCount = creativityWords.reduce((count, word) =>
      count + (text.split(word).length - 1), 0
    )
    const creativityLevel = Math.min(1, creativityCount / words.length * 20 + 0.1)

    // Leadership indicators
    const leadershipTerms = this.extractKeywords(words, this.leadershipKeywords)
    const leadershipIndicators = Math.min(1, leadershipTerms.length / Math.max(words.length / 15, 1))

    // Problem-solving approach
    const problemSolvingTerms = this.extractKeywords(words, this.problemSolvingKeywords)
    const problemSolvingApproach = Math.min(1, problemSolvingTerms.length / Math.max(words.length / 15, 1))

    return {
      topicRelevance,
      exampleQuality,
      technicalAccuracy,
      creativityLevel,
      leadershipIndicators,
      problemSolvingApproach
    }
  }

  private calculateAnalysisConfidence(text: string, coherence: number): number {
    const words = text.split(' ').filter(w => w.length > 0)
    
    // Base confidence on text length (more text = more confident analysis)
    let lengthConfidence = Math.min(1, words.length / 50)
    
    // Factor in coherence
    let coherenceConfidence = coherence
    
    // Penalize very short responses
    if (words.length < 10) lengthConfidence *= 0.5
    
    return (lengthConfidence + coherenceConfidence) / 2
  }

  // Public utility methods
  extractMainTopics(text: string, maxTopics: number = 5): string[] {
    const words = text.split(' ')
    const wordFreq = new Map<string, number>()
    
    // Count word frequencies (excluding common words)
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'])
    
    words.forEach(word => {
      if (word.length > 3 && !commonWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
      }
    })
    
    // Sort by frequency and return top topics
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTopics)
      .map(([word]) => word)
  }

  calculateResponseQuality(analysis: TextAnalysisResult): number {
    const weights = {
      communication: 0.3,
      content: 0.3,
      sentiment: 0.2,
      complexity: 0.2
    }

    const communicationScore = (
      analysis.communication.clarity +
      analysis.communication.coherence +
      analysis.communication.completeness +
      analysis.communication.structure
    ) / 4

    const contentScore = (
      analysis.content.topicRelevance +
      analysis.content.exampleQuality +
      analysis.content.technicalAccuracy
    ) / 3

    const sentimentScore = Math.max(0, (analysis.sentiment.overall + 1) / 2) // Normalize to 0-1

    const complexityScore = analysis.complexity.conceptualDepth

    return (
      communicationScore * weights.communication +
      contentScore * weights.content +
      sentimentScore * weights.sentiment +
      complexityScore * weights.complexity
    )
  }

  generateFeedback(analysis: TextAnalysisResult): string[] {
    const feedback: string[] = []

    // Communication feedback
    if (analysis.communication.clarity < 0.6) {
      feedback.push('Consider using shorter, clearer sentences to improve clarity')
    }
    if (analysis.communication.structure < 0.5) {
      feedback.push('Try organizing your response with clear structure (e.g., first, second, finally)')
    }
    if (analysis.communication.completeness < 0.6) {
      feedback.push('Provide more specific examples to support your points')
    }

    // Content feedback
    if (analysis.content.topicRelevance < 0.7) {
      feedback.push('Focus more directly on the question asked')
    }
    if (analysis.content.exampleQuality < 0.5) {
      feedback.push('Include concrete examples from your experience')
    }

    // Positive feedback
    if (analysis.communication.clarity > 0.8) {
      feedback.push('Excellent clarity in your communication')
    }
    if (analysis.content.topicRelevance > 0.8) {
      feedback.push('Great job staying focused on the topic')
    }
    if (analysis.sentiment.overall > 0.5) {
      feedback.push('Positive and confident tone throughout your response')
    }

    return feedback
  }
}

export { 
  NLPAnalysisService,
  type TextAnalysisResult,
  type SentimentAnalysis,
  type KeywordAnalysis,
  type ComplexityMetrics,
  type CommunicationMetrics,
  type ContentAnalysis
}
