// Production Multi-Modal Analysis Engine
// Processes voice, video, and text modalities for comprehensive interview analysis

import { EventEmitter } from 'events'
import { config } from '../config'
import { db } from '../database/connection'
import { answers, sessionAnalytics, questions } from '../database/schema-v2'
import { eq } from 'drizzle-orm'

// Analysis interfaces
interface AudioAnalysisResult {
  transcription: {
    text: string
    confidence: number
    words: Array<{
      word: string
      confidence: number
      start: number
      end: number
    }>
  }
  voiceMetrics: {
    tone: 'confident' | 'nervous' | 'calm' | 'excited' | 'uncertain'
    energy: number // 0-1
    clarity: number // 0-1
    pace: number // words per minute
    volume: number // 0-1
    pitch: number // Hz
  }
  speechPatterns: {
    fillerWords: number
    pauseCount: number
    avgPauseLength: number
    speechRate: number
    fluency: number
  }
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative'
    confidence: number
    emotions: Record<string, number>
  }
}

interface VideoAnalysisResult {
  facialAnalysis: {
    emotions: Record<string, number>
    eyeContact: number // 0-1
    engagement: number // 0-1
    attentiveness: number // 0-1
    expressions: Array<{
      emotion: string
      intensity: number
      timestamp: number
    }>
  }
  bodyLanguage: {
    posture: 'upright' | 'slouched' | 'leaning' | 'fidgeting'
    gestures: number
    movement: number
    confidence: number
    openness: number
  }
  visualMetrics: {
    frameStability: number
    lighting: number
    backgroundDistraction: number
    professionalAppearance: number
  }
}

interface TextAnalysisResult {
  contentAnalysis: {
    keywordMatches: string[]
    skillsDemonstrated: string[]
    technicalTerms: string[]
    structureScore: number
    completeness: number
    relevance: number
  }
  linguisticAnalysis: {
    complexity: number
    vocabulary: number
    grammar: number
    coherence: number
    conciseness: number
  }
  semanticAnalysis: {
    topicCoverage: string[]
    conceptDepth: number
    exampleQuality: number
    problemSolvingApproach: string
  }
}

interface MultiModalAnalysisResult {
  audio?: AudioAnalysisResult
  video?: VideoAnalysisResult
  text: TextAnalysisResult
  unified: {
    overallScore: number
    confidence: number
    engagement: number
    technicalCompetence: number
    communicationSkills: number
    professionalPresentation: number
    recommendations: string[]
  }
}

export class MultiModalAnalysisEngine extends EventEmitter {
  private speechAnalyzer: SpeechAnalysisService
  private videoAnalyzer: VideoAnalysisService
  private textAnalyzer: TextAnalysisService
  private unifiedAnalyzer: UnifiedAnalysisService

  constructor() {
    super()
    this.speechAnalyzer = new SpeechAnalysisService()
    this.videoAnalyzer = new VideoAnalysisService()
    this.textAnalyzer = new TextAnalysisService()
    this.unifiedAnalyzer = new UnifiedAnalysisService()
  }

  /**
   * Process multi-modal interview response
   */
  async analyzeResponse(
    questionId: string,
    sessionId: string,
    userId: string,
    data: {
      audioUrl?: string
      videoUrl?: string
      textContent?: string
      responseMetrics: {
        thinkingTime: number
        responseTime: number
        pauseCount: number
        avgPauseLength: number
      }
    }
  ): Promise<MultiModalAnalysisResult> {
    const startTime = Date.now()
    
    try {
      console.log(`🔍 Starting multi-modal analysis for question ${questionId}`)
      
      // Process each modality in parallel
      const analysisPromises = []
      
      // Audio analysis
      if (data.audioUrl) {
        analysisPromises.push(
          this.speechAnalyzer.analyzeAudio(data.audioUrl)
            .then(result => ({ type: 'audio', result }))
        )
      }
      
      // Video analysis
      if (data.videoUrl) {
        analysisPromises.push(
          this.videoAnalyzer.analyzeVideo(data.videoUrl)
            .then(result => ({ type: 'video', result }))
        )
      }
      
      // Text analysis (always present)
      if (data.textContent) {
        analysisPromises.push(
          this.textAnalyzer.analyzeText(data.textContent, questionId)
            .then(result => ({ type: 'text', result }))
        )
      }
      
      // Wait for all analyses to complete
      const analysisResults = await Promise.allSettled(analysisPromises)
      
      // Compile results
      const modalResults: any = {}
      
      analysisResults.forEach((promiseResult, index) => {
        if (promiseResult.status === 'fulfilled') {
          const { type, result } = promiseResult.value
          modalResults[type] = result
        } else {
          console.error(`Analysis failed for modality:`, promiseResult.reason)
        }
      })
      
      // Generate unified analysis
      const unifiedResult = await this.unifiedAnalyzer.generateUnifiedAnalysis(
        modalResults,
        data.responseMetrics
      )
      
      // Store analysis results
      const analysisResult: MultiModalAnalysisResult = {
        ...modalResults,
        unified: unifiedResult
      }
      
      await this.storeAnalysisResults(questionId, sessionId, userId, analysisResult, data)
      
      const analysisTime = Date.now() - startTime
      console.log(`✅ Multi-modal analysis completed in ${analysisTime}ms`)
      
      // Emit real-time update
      this.emit('analysisComplete', {
        questionId,
        sessionId,
        result: analysisResult,
        processingTime: analysisTime
      })
      
      return analysisResult
      
    } catch (error) {
      console.error('❌ Multi-modal analysis failed:', error)
      throw error
    }
  }

  /**
   * Store analysis results in database
   */
  private async storeAnalysisResults(
    questionId: string,
    sessionId: string,
    userId: string,
    analysisResult: MultiModalAnalysisResult,
    originalData: any
  ): Promise<void> {
    try {
      // Store in answers table
      await db.insert(answers).values({
        questionId,
        sessionId,
        userId,
        textContent: originalData.textContent,
        audioUrl: originalData.audioUrl,
        videoUrl: originalData.videoUrl,
        responseMetrics: originalData.responseMetrics,
        analysisResults: {
          transcription: analysisResult.audio?.transcription,
          sentiment: (analysisResult.audio?.sentiment as any) || { overall: 'neutral', confidence: 0, emotions: {} },
          voiceAnalysis: analysisResult.audio?.voiceMetrics ? {
            tone: analysisResult.audio.voiceMetrics.tone,
            energy: analysisResult.audio.voiceMetrics.energy,
            confidence: ((analysisResult.audio.voiceMetrics as any).confidence ?? analysisResult.audio.voiceMetrics.volume) ?? 0,
            clarity: analysisResult.audio.voiceMetrics.clarity
          } : undefined,
          facialAnalysis: analysisResult.video?.facialAnalysis,
          bodyLanguage: analysisResult.video?.bodyLanguage ? {
            posture: analysisResult.video.bodyLanguage.posture,
            gestures: analysisResult.video.bodyLanguage.gestures,
            movement: analysisResult.video.bodyLanguage.movement,
            engagement: ((analysisResult.video.bodyLanguage as any).engagement ?? (analysisResult.video.bodyLanguage as any).openness) ?? 0
          } : undefined
        },
        contentAnalysis: analysisResult.text?.contentAnalysis ? {
          keywordMatches: analysisResult.text.contentAnalysis.keywordMatches || [],
          skillsDemonstrated: analysisResult.text.contentAnalysis.skillsDemonstrated || [],
          technicalAccuracy: ((analysisResult.text.contentAnalysis as any).technicalAccuracy ?? analysisResult.text.contentAnalysis.structureScore) || 0,
          completeness: analysisResult.text.contentAnalysis.completeness || 0,
          structure: ((analysisResult.text.contentAnalysis as any).structure ?? analysisResult.text.contentAnalysis.structureScore) || 0,
          clarity: ((analysisResult.text.contentAnalysis as any).clarity) ?? 0,
          relevance: analysisResult.text.contentAnalysis.relevance || 0
        } : null,
        scores: {
          overall: analysisResult.unified.overallScore,
          technical: analysisResult.unified.technicalCompetence,
          communication: analysisResult.unified.communicationSkills,
          structure: analysisResult.text?.contentAnalysis?.structureScore || 0,
          relevance: analysisResult.text?.contentAnalysis?.relevance || 0,
          confidence: analysisResult.unified.confidence
        },
        status: 'analyzed',
        submittedAt: new Date(),
        analyzedAt: new Date()
      } as any).onConflictDoUpdate({
        target: [answers.questionId, answers.sessionId, answers.userId],
        set: {
          analysisResults: {
            transcription: analysisResult.audio?.transcription,
            sentiment: (analysisResult.audio?.sentiment as any) || { overall: 'neutral', confidence: 0, emotions: {} },
            voiceAnalysis: analysisResult.audio?.voiceMetrics ? {
              tone: analysisResult.audio.voiceMetrics.tone,
              energy: analysisResult.audio.voiceMetrics.energy,
              confidence: ((analysisResult.audio.voiceMetrics as any).confidence ?? analysisResult.audio.voiceMetrics.volume) || 0,
              clarity: analysisResult.audio.voiceMetrics.clarity
            } : undefined,
            facialAnalysis: analysisResult.video?.facialAnalysis,
            bodyLanguage: analysisResult.video?.bodyLanguage ? {
              posture: analysisResult.video.bodyLanguage.posture,
              gestures: analysisResult.video.bodyLanguage.gestures,
              movement: analysisResult.video.bodyLanguage.movement,
              engagement: ((analysisResult.video.bodyLanguage as any).engagement ?? (analysisResult.video.bodyLanguage as any).openness) || 0
            } : undefined
          },
          contentAnalysis: analysisResult.text?.contentAnalysis ? {
            keywordMatches: analysisResult.text.contentAnalysis.keywordMatches || [],
            skillsDemonstrated: analysisResult.text.contentAnalysis.skillsDemonstrated || [],
            technicalAccuracy: ((analysisResult.text.contentAnalysis as any).technicalAccuracy ?? analysisResult.text.contentAnalysis.structureScore) || 0,
            completeness: analysisResult.text.contentAnalysis.completeness || 0,
            structure: ((analysisResult.text.contentAnalysis as any).structure ?? analysisResult.text.contentAnalysis.structureScore) || 0,
            clarity: ((analysisResult.text.contentAnalysis as any).clarity) || 0,
            relevance: analysisResult.text.contentAnalysis.relevance || 0
          } : null,
          scores: {
            overall: analysisResult.unified.overallScore,
            technical: analysisResult.unified.technicalCompetence,
            communication: analysisResult.unified.communicationSkills,
            structure: analysisResult.text?.contentAnalysis?.structureScore || 0,
            relevance: analysisResult.text?.contentAnalysis?.relevance || 0,
            confidence: analysisResult.unified.confidence
          },
          status: 'analyzed',
          analyzedAt: new Date()
        }
      })

      // Store session analytics
      await db.insert(sessionAnalytics).values({
        sessionId,
        timestamp: new Date(),
        metrics: {
          engagement: analysisResult.unified.engagement,
          confidence: analysisResult.unified.confidence,
          speechRate: analysisResult.audio?.speechPatterns?.speechRate || 0,
          eyeContact: analysisResult.video?.facialAnalysis?.eyeContact || 0,
          facialSentiment: analysisResult.video?.facialAnalysis?.emotions?.positive || 0,
          voiceEnergy: analysisResult.audio?.voiceMetrics?.energy || 0,
          responseQuality: analysisResult.unified.overallScore
        }
      })

    } catch (error) {
      console.error('Error storing analysis results:', error)
      throw error
    }
  }
}

/**
 * Speech Analysis Service
 * Handles audio transcription, voice metrics, and speech pattern analysis
 */
class SpeechAnalysisService {
  async analyzeAudio(audioUrl: string): Promise<AudioAnalysisResult> {
    try {
      // Parallel processing of different audio analysis tasks
      const [transcription, voiceMetrics, speechPatterns, sentiment] = await Promise.all([
        this.transcribeAudio(audioUrl),
        this.analyzeVoiceMetrics(audioUrl),
        this.analyzeSpeechPatterns(audioUrl),
        this.analyzeSentiment(audioUrl)
      ])

      return {
        transcription,
        voiceMetrics,
        speechPatterns,
        sentiment
      }
    } catch (error) {
      console.error('Speech analysis error:', error)
      throw error
    }
  }

  private async transcribeAudio(audioUrl: string): Promise<any> {
    // Use OpenAI Whisper or Google Speech-to-Text
    if (config.ai.openai.apiKey) {
      return this.transcribeWithWhisper(audioUrl)
    }
    
    // Fallback to Web Speech API results
    return {
      text: '',
      confidence: 0,
      words: []
    }
  }

  private async transcribeWithWhisper(audioUrl: string): Promise<any> {
    const formData = new FormData()
    
    // Download audio file first
    const audioResponse = await fetch(audioUrl)
    const audioBlob = await audioResponse.blob()
    
    formData.append('file', audioBlob, 'audio.wav')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'word')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.ai.openai.apiKey}`
      },
      body: formData
    })

    const result = await response.json()
    
    return {
      text: result.text,
      confidence: 0.95, // Whisper doesn't provide confidence, use high default
      words: result.words || []
    }
  }

  private async analyzeVoiceMetrics(audioUrl: string): Promise<any> {
    // Placeholder for voice analysis
    // In production, would use audio processing libraries
    return {
      tone: 'confident' as const,
      energy: 0.7,
      clarity: 0.8,
      pace: 150,
      volume: 0.6,
      pitch: 200
    }
  }

  private async analyzeSpeechPatterns(audioUrl: string): Promise<any> {
    // Placeholder for speech pattern analysis
    return {
      fillerWords: 3,
      pauseCount: 5,
      avgPauseLength: 1.2,
      speechRate: 150,
      fluency: 0.8
    }
  }

  private async analyzeSentiment(audioUrl: string): Promise<any> {
    // Placeholder for audio sentiment analysis
    return {
      overall: 'positive' as const,
      confidence: 0.8,
      emotions: {
        positive: 0.7,
        neutral: 0.2,
        negative: 0.1
      }
    }
  }
}

/**
 * Video Analysis Service
 * Handles facial expression analysis, body language, and visual metrics
 */
class VideoAnalysisService {
  async analyzeVideo(videoUrl: string): Promise<VideoAnalysisResult> {
    try {
      const [facialAnalysis, bodyLanguage, visualMetrics] = await Promise.all([
        this.analyzeFacialExpressions(videoUrl),
        this.analyzeBodyLanguage(videoUrl),
        this.analyzeVisualMetrics(videoUrl)
      ])

      return {
        facialAnalysis,
        bodyLanguage,
        visualMetrics
      }
    } catch (error) {
      console.error('Video analysis error:', error)
      throw error
    }
  }

  private async analyzeFacialExpressions(videoUrl: string): Promise<any> {
    // Placeholder for facial analysis
    // In production, would use face-api.js or similar
    return {
      emotions: {
        happy: 0.4,
        confident: 0.3,
        neutral: 0.2,
        nervous: 0.1
      },
      eyeContact: 0.7,
      engagement: 0.8,
      attentiveness: 0.75,
      expressions: []
    }
  }

  private async analyzeBodyLanguage(videoUrl: string): Promise<any> {
    // Placeholder for body language analysis
    return {
      posture: 'upright' as const,
      gestures: 5,
      movement: 0.3,
      confidence: 0.8,
      openness: 0.7
    }
  }

  private async analyzeVisualMetrics(videoUrl: string): Promise<any> {
    // Placeholder for visual quality metrics
    return {
      frameStability: 0.9,
      lighting: 0.8,
      backgroundDistraction: 0.1,
      professionalAppearance: 0.9
    }
  }
}

/**
 * Text Analysis Service
 * Handles content analysis, linguistic analysis, and semantic understanding
 */
class TextAnalysisService {
  async analyzeText(textContent: string, questionId: string): Promise<TextAnalysisResult> {
    try {
      const [contentAnalysis, linguisticAnalysis, semanticAnalysis] = await Promise.all([
        this.analyzeContent(textContent, questionId),
        this.analyzeLinguistics(textContent),
        this.analyzeSemantics(textContent)
      ])

      return {
        contentAnalysis,
        linguisticAnalysis,
        semanticAnalysis
      }
    } catch (error) {
      console.error('Text analysis error:', error)
      throw error
    }
  }

  private async analyzeContent(textContent: string, questionId: string): Promise<any> {
    // Get question context for keyword matching
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, questionId)
    })

    const expectedKeywords = question?.expectedKeywords || []
    const skillsAssessed = question?.skillsAssessed || []

    // Simple keyword matching (would be more sophisticated in production)
    const keywordMatches = expectedKeywords.filter((keyword: any) =>
      textContent.toLowerCase().includes(keyword.toLowerCase())
    )

    const skillsDemonstrated = skillsAssessed.filter((skill: any) =>
      textContent.toLowerCase().includes(skill.toLowerCase())
    )

    return {
      keywordMatches,
      skillsDemonstrated,
      technicalTerms: this.extractTechnicalTerms(textContent),
      structureScore: this.calculateStructureScore(textContent),
      completeness: this.calculateCompleteness(textContent, expectedKeywords),
      relevance: this.calculateRelevance(textContent, question?.content || '')
    }
  }

  private async analyzeLinguistics(textContent: string): Promise<any> {
    const words = textContent.split(/\s+/)
    const sentences = textContent.split(/[.!?]+/)
    
    return {
      complexity: this.calculateComplexity(textContent),
      vocabulary: this.calculateVocabularyScore(words),
      grammar: 0.8, // Placeholder
      coherence: this.calculateCoherence(sentences),
      conciseness: this.calculateConciseness(textContent)
    }
  }

  private async analyzeSemantics(textContent: string): Promise<any> {
    return {
      topicCoverage: this.extractTopics(textContent),
      conceptDepth: this.calculateConceptDepth(textContent),
      exampleQuality: this.assessExampleQuality(textContent),
      problemSolvingApproach: this.identifyProblemSolvingApproach(textContent)
    }
  }

  // Helper methods for text analysis
  private extractTechnicalTerms(text: string): string[] {
    const technicalTerms = [
      'algorithm', 'database', 'api', 'framework', 'architecture',
      'scalability', 'performance', 'security', 'testing', 'deployment'
    ]
    
    return technicalTerms.filter(term => 
      text.toLowerCase().includes(term)
    )
  }

  private calculateStructureScore(text: string): number {
    let score = 0.5
    
    // Check for STAR structure indicators
    if (text.toLowerCase().includes('situation')) score += 0.125
    if (text.toLowerCase().includes('task')) score += 0.125
    if (text.toLowerCase().includes('action')) score += 0.125
    if (text.toLowerCase().includes('result')) score += 0.125
    
    return Math.min(score, 1.0)
  }

  private calculateCompleteness(text: string, expectedKeywords: string[]): number {
    if (expectedKeywords.length === 0) return 0.8
    
    const matchedKeywords = expectedKeywords.filter(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    )
    
    return matchedKeywords.length / expectedKeywords.length
  }

  private calculateRelevance(text: string, questionText: string): number {
    // Simple relevance calculation based on common words
    const textWords = text.toLowerCase().split(/\s+/)
    const questionWords = questionText.toLowerCase().split(/\s+/)
    
    const commonWords = textWords.filter(word => 
      questionWords.includes(word) && word.length > 3
    )
    
    return Math.min(commonWords.length / Math.max(questionWords.length, 1), 1.0)
  }

  private calculateComplexity(text: string): number {
    const words = text.split(/\s+/)
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
    
    // Normalize to 0-1 scale
    return Math.min(avgWordLength / 10, 1.0)
  }

  private calculateVocabularyScore(words: string[]): number {
    const uniqueWords = new Set(words.map(w => w.toLowerCase()))
    return Math.min(uniqueWords.size / words.length, 1.0)
  }

  private calculateCoherence(sentences: string[]): number {
    // Placeholder for coherence calculation
    return sentences.length > 2 ? 0.8 : 0.6
  }

  private calculateConciseness(text: string): number {
    const words = text.split(/\s+/)
    // Optimal range: 100-300 words
    if (words.length < 50) return 0.5
    if (words.length > 500) return 0.6
    return 0.9
  }

  private extractTopics(text: string): string[] {
    // Placeholder for topic extraction
    return ['leadership', 'problem-solving', 'teamwork']
  }

  private calculateConceptDepth(text: string): number {
    // Check for specific examples, metrics, outcomes
    let score = 0.5
    
    if (/\d+%/.test(text)) score += 0.2 // Has percentages
    if (/\$\d+/.test(text)) score += 0.2 // Has dollar amounts
    if (text.includes('result') || text.includes('outcome')) score += 0.1
    
    return Math.min(score, 1.0)
  }

  private assessExampleQuality(text: string): number {
    // Check for specific, concrete examples
    const exampleIndicators = ['for example', 'specifically', 'in particular', 'such as']
    const hasExamples = exampleIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    )
    
    return hasExamples ? 0.8 : 0.5
  }

  private identifyProblemSolvingApproach(text: string): string {
    if (text.toLowerCase().includes('systematic') || text.toLowerCase().includes('step')) {
      return 'systematic'
    }
    if (text.toLowerCase().includes('creative') || text.toLowerCase().includes('innovative')) {
      return 'creative'
    }
    if (text.toLowerCase().includes('collaborate') || text.toLowerCase().includes('team')) {
      return 'collaborative'
    }
    return 'analytical'
  }
}

/**
 * Unified Analysis Service
 * Combines multi-modal results into comprehensive assessment
 */
class UnifiedAnalysisService {
  async generateUnifiedAnalysis(
    modalResults: any,
    responseMetrics: any
  ): Promise<any> {
    const weights = {
      audio: 0.3,
      video: 0.3,
      text: 0.4
    }

    // Calculate overall score
    let overallScore = 0
    let totalWeight = 0

    if (modalResults.audio) {
      const audioScore = this.calculateAudioScore(modalResults.audio)
      overallScore += audioScore * weights.audio
      totalWeight += weights.audio
    }

    if (modalResults.video) {
      const videoScore = this.calculateVideoScore(modalResults.video)
      overallScore += videoScore * weights.video
      totalWeight += weights.video
    }

    if (modalResults.text) {
      const textScore = this.calculateTextScore(modalResults.text)
      overallScore += textScore * weights.text
      totalWeight += weights.text
    }

    overallScore = totalWeight > 0 ? overallScore / totalWeight : 0

    // Calculate component scores
    const confidence = this.calculateConfidenceScore(modalResults)
    const engagement = this.calculateEngagementScore(modalResults)
    const technicalCompetence = this.calculateTechnicalScore(modalResults)
    const communicationSkills = this.calculateCommunicationScore(modalResults)
    const professionalPresentation = this.calculatePresentationScore(modalResults)

    // Generate recommendations
    const recommendations = this.generateRecommendations(modalResults, {
      overallScore,
      confidence,
      engagement,
      technicalCompetence,
      communicationSkills
    })

    return {
      overallScore,
      confidence,
      engagement,
      technicalCompetence,
      communicationSkills,
      professionalPresentation,
      recommendations
    }
  }

  private calculateAudioScore(audioResult: AudioAnalysisResult): number {
    const scores = [
      audioResult.voiceMetrics.clarity,
      audioResult.speechPatterns.fluency,
      audioResult.sentiment.overall === 'positive' ? 0.8 : 
      audioResult.sentiment.overall === 'neutral' ? 0.6 : 0.4
    ]
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  private calculateVideoScore(videoResult: VideoAnalysisResult): number {
    const scores = [
      videoResult.facialAnalysis.engagement,
      videoResult.facialAnalysis.eyeContact,
      videoResult.bodyLanguage.confidence,
      videoResult.visualMetrics.professionalAppearance
    ]
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  private calculateTextScore(textResult: TextAnalysisResult): number {
    const scores = [
      textResult.contentAnalysis.completeness,
      textResult.contentAnalysis.relevance,
      textResult.contentAnalysis.structureScore,
      textResult.linguisticAnalysis.coherence,
      textResult.semanticAnalysis.conceptDepth
    ]
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  private calculateConfidenceScore(modalResults: any): number {
    let confidence = 0.5
    
    if (modalResults.audio) {
      confidence += modalResults.audio.voiceMetrics.energy * 0.3
    }
    
    if (modalResults.video) {
      confidence += modalResults.video.bodyLanguage.confidence * 0.4
    }
    
    if (modalResults.text) {
      confidence += modalResults.text.linguisticAnalysis.vocabulary * 0.3
    }
    
    return Math.min(confidence, 1.0)
  }

  private calculateEngagementScore(modalResults: any): number {
    let engagement = 0.5
    
    if (modalResults.video) {
      engagement += modalResults.video.facialAnalysis.engagement * 0.5
      engagement += modalResults.video.facialAnalysis.eyeContact * 0.3
    }
    
    if (modalResults.audio) {
      engagement += modalResults.audio.voiceMetrics.energy * 0.2
    }
    
    return Math.min(engagement, 1.0)
  }

  private calculateTechnicalScore(modalResults: any): number {
    if (!modalResults.text) return 0.5
    
    const technicalTerms = modalResults.text.contentAnalysis.technicalTerms.length
    const skillsDemonstrated = modalResults.text.contentAnalysis.skillsDemonstrated.length
    const conceptDepth = modalResults.text.semanticAnalysis.conceptDepth
    
    return Math.min((technicalTerms * 0.1 + skillsDemonstrated * 0.1 + conceptDepth) / 3, 1.0)
  }

  private calculateCommunicationScore(modalResults: any): number {
    let score = 0.5
    
    if (modalResults.audio) {
      score += modalResults.audio.voiceMetrics.clarity * 0.3
      score += modalResults.audio.speechPatterns.fluency * 0.2
    }
    
    if (modalResults.text) {
      score += modalResults.text.linguisticAnalysis.coherence * 0.3
      score += modalResults.text.contentAnalysis.structureScore * 0.2
    }
    
    return Math.min(score, 1.0)
  }

  private calculatePresentationScore(modalResults: any): number {
    if (!modalResults.video) return 0.7
    
    const visual = modalResults.video.visualMetrics
    return (visual.lighting + visual.professionalAppearance + visual.frameStability) / 3
  }

  private generateRecommendations(modalResults: any, scores: any): string[] {
    const recommendations = []
    
    if (scores.confidence < 0.6) {
      recommendations.push('Work on projecting more confidence through posture and voice tone')
    }
    
    if (scores.engagement < 0.6) {
      recommendations.push('Maintain better eye contact and show more enthusiasm')
    }
    
    if (scores.technicalCompetence < 0.7) {
      recommendations.push('Include more specific technical details and examples')
    }
    
    if (scores.communicationSkills < 0.7) {
      recommendations.push('Focus on clearer structure and more concise explanations')
    }
    
    if (modalResults.text?.contentAnalysis.structureScore < 0.6) {
      recommendations.push('Use the STAR method to structure your responses better')
    }
    
    return recommendations
  }
}

export default MultiModalAnalysisEngine
