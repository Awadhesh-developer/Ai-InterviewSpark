export interface AudioAnalysis {
  volume: number[]
  pitch: number[]
  pace: number
  clarity: number
  confidence: number
  fillerWords: {
    count: number
    words: string[]
    timestamps: number[]
  }
  silences: {
    count: number
    totalDuration: number
    averageDuration: number
  }
  emotions: {
    confident: number
    nervous: number
    excited: number
    calm: number
  }
  recommendations: string[]
}

export interface VideoAnalysis {
  eyeContact: {
    percentage: number
    consistency: number
    recommendations: string[]
  }
  facialExpressions: {
    smile: number
    engagement: number
    confidence: number
    emotions: {
      happy: number
      neutral: number
      focused: number
      nervous: number
    }
  }
  bodyLanguage: {
    posture: number
    gestures: number
    stability: number
    professionalism: number
  }
  lighting: {
    quality: number
    consistency: number
    recommendations: string[]
  }
  background: {
    professionalism: number
    distractions: string[]
    recommendations: string[]
  }
  overall: {
    score: number
    strengths: string[]
    improvements: string[]
  }
}

export interface TranscriptionResult {
  text: string
  confidence: number
  words: {
    word: string
    startTime: number
    endTime: number
    confidence: number
  }[]
  sentences: {
    text: string
    startTime: number
    endTime: number
  }[]
}

export interface MediaAnalysisResult {
  audio?: AudioAnalysis
  video?: VideoAnalysis
  transcription?: TranscriptionResult
  overallScore: number
  recommendations: string[]
  processingTime: number
}

class MediaAnalysisService {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null

  // Initialize audio context for real-time analysis
  initializeAudioContext(): AudioContext | null {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      return this.audioContext
    } catch (error) {
      console.error('Error initializing audio context:', error)
      return null
    }
  }

  // Analyze audio blob
  async analyzeAudio(audioBlob: Blob): Promise<AudioAnalysis> {
    const startTime = Date.now()
    
    try {
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer()
      
      // Mock analysis - in production, this would use Web Audio API or send to backend
      const mockAnalysis: AudioAnalysis = {
        volume: this.generateMockVolumeData(),
        pitch: this.generateMockPitchData(),
        pace: this.calculateMockPace(),
        clarity: Math.random() * 30 + 70, // 70-100
        confidence: Math.random() * 25 + 75, // 75-100
        fillerWords: {
          count: Math.floor(Math.random() * 5),
          words: ['um', 'uh', 'like', 'you know'],
          timestamps: [5.2, 12.8, 23.1]
        },
        silences: {
          count: Math.floor(Math.random() * 8) + 2,
          totalDuration: Math.random() * 10 + 5,
          averageDuration: Math.random() * 2 + 1
        },
        emotions: {
          confident: Math.random() * 0.4 + 0.6,
          nervous: Math.random() * 0.3,
          excited: Math.random() * 0.2,
          calm: Math.random() * 0.3 + 0.4
        },
        recommendations: this.generateAudioRecommendations()
      }

      return mockAnalysis
    } catch (error) {
      console.error('Error analyzing audio:', error)
      throw error
    }
  }

  // Analyze video blob
  async analyzeVideo(videoBlob: Blob): Promise<VideoAnalysis> {
    try {
      // Mock video analysis - in production, this would use computer vision APIs
      const mockAnalysis: VideoAnalysis = {
        eyeContact: {
          percentage: Math.random() * 30 + 70, // 70-100%
          consistency: Math.random() * 25 + 75,
          recommendations: [
            'Look directly at the camera more often',
            'Maintain steady eye contact during responses'
          ]
        },
        facialExpressions: {
          smile: Math.random() * 40 + 60,
          engagement: Math.random() * 30 + 70,
          confidence: Math.random() * 25 + 75,
          emotions: {
            happy: Math.random() * 0.3 + 0.2,
            neutral: Math.random() * 0.4 + 0.4,
            focused: Math.random() * 0.3 + 0.3,
            nervous: Math.random() * 0.2
          }
        },
        bodyLanguage: {
          posture: Math.random() * 30 + 70,
          gestures: Math.random() * 35 + 65,
          stability: Math.random() * 25 + 75,
          professionalism: Math.random() * 20 + 80
        },
        lighting: {
          quality: Math.random() * 30 + 70,
          consistency: Math.random() * 25 + 75,
          recommendations: [
            'Ensure even lighting on your face',
            'Avoid backlighting from windows'
          ]
        },
        background: {
          professionalism: Math.random() * 20 + 80,
          distractions: ['Moving objects', 'Cluttered space'],
          recommendations: [
            'Use a clean, professional background',
            'Remove distracting elements'
          ]
        },
        overall: {
          score: Math.random() * 25 + 75,
          strengths: [
            'Professional appearance',
            'Good camera positioning',
            'Appropriate lighting'
          ],
          improvements: [
            'Maintain more consistent eye contact',
            'Reduce fidgeting movements',
            'Improve background setup'
          ]
        }
      }

      return mockAnalysis
    } catch (error) {
      console.error('Error analyzing video:', error)
      throw error
    }
  }

  // Transcribe audio to text
  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      // Mock transcription - in production, this would use speech-to-text APIs
      const mockTranscription: TranscriptionResult = {
        text: "Thank you for this opportunity. I'm excited to discuss my experience in software engineering. In my previous role at TechCorp, I led a team of five developers to build a scalable microservices architecture that improved system performance by 40%. I believe my experience in cloud technologies and team leadership makes me a strong candidate for this position.",
        confidence: 0.92,
        words: [
          { word: "Thank", startTime: 0.5, endTime: 0.8, confidence: 0.95 },
          { word: "you", startTime: 0.8, endTime: 1.0, confidence: 0.98 },
          { word: "for", startTime: 1.0, endTime: 1.2, confidence: 0.97 },
          // ... more words would be here
        ],
        sentences: [
          {
            text: "Thank you for this opportunity.",
            startTime: 0.5,
            endTime: 3.2
          },
          {
            text: "I'm excited to discuss my experience in software engineering.",
            startTime: 3.5,
            endTime: 7.8
          }
          // ... more sentences
        ]
      }

      return mockTranscription
    } catch (error) {
      console.error('Error transcribing audio:', error)
      throw error
    }
  }

  // Comprehensive media analysis
  async analyzeMedia(
    audioBlob?: Blob,
    videoBlob?: Blob
  ): Promise<MediaAnalysisResult> {
    const startTime = Date.now()

    try {
      const results: Partial<MediaAnalysisResult> = {}

      // Analyze audio if provided
      if (audioBlob) {
        const [audioAnalysis, transcription] = await Promise.all([
          this.analyzeAudio(audioBlob),
          this.transcribeAudio(audioBlob)
        ])
        results.audio = audioAnalysis
        results.transcription = transcription
      }

      // Analyze video if provided
      if (videoBlob) {
        results.video = await this.analyzeVideo(videoBlob)
      }

      // Calculate overall score
      const overallScore = this.calculateOverallScore(results.audio, results.video)
      
      // Generate comprehensive recommendations
      const recommendations = this.generateComprehensiveRecommendations(
        results.audio,
        results.video
      )

      const processingTime = Date.now() - startTime

      return {
        ...results,
        overallScore,
        recommendations,
        processingTime
      } as MediaAnalysisResult
    } catch (error) {
      console.error('Error in comprehensive media analysis:', error)
      throw error
    }
  }

  // Real-time audio analysis for live feedback
  analyzeRealTimeAudio(stream: MediaStream, callback: (data: any) => void): () => void {
    if (!this.audioContext || !this.analyser) {
      this.initializeAudioContext()
    }

    if (!this.audioContext || !this.analyser) {
      throw new Error('Failed to initialize audio context')
    }

    const source = this.audioContext.createMediaStreamSource(stream)
    source.connect(this.analyser)

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const analyze = () => {
      this.analyser!.getByteFrequencyData(dataArray)
      
      // Calculate volume
      const volume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
      
      // Calculate dominant frequency (simplified pitch detection)
      let maxIndex = 0
      let maxValue = 0
      for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > maxValue) {
          maxValue = dataArray[i]
          maxIndex = i
        }
      }
      
      const pitch = (maxIndex * this.audioContext!.sampleRate) / (2 * bufferLength)

      callback({
        volume: volume / 255,
        pitch,
        timestamp: Date.now()
      })

      requestAnimationFrame(analyze)
    }

    analyze()

    // Return cleanup function
    return () => {
      source.disconnect()
    }
  }

  // Helper methods
  private generateMockVolumeData(): number[] {
    return Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2)
  }

  private generateMockPitchData(): number[] {
    return Array.from({ length: 100 }, () => Math.random() * 200 + 100)
  }

  private calculateMockPace(): number {
    return Math.random() * 50 + 150 // 150-200 words per minute
  }

  private generateAudioRecommendations(): string[] {
    const recommendations = [
      'Speak more slowly for better clarity',
      'Reduce filler words like "um" and "uh"',
      'Maintain consistent volume throughout',
      'Take strategic pauses for emphasis',
      'Project confidence through your voice tone'
    ]
    
    return recommendations.slice(0, Math.floor(Math.random() * 3) + 2)
  }

  private calculateOverallScore(audio?: AudioAnalysis, video?: VideoAnalysis): number {
    let totalScore = 0
    let components = 0

    if (audio) {
      totalScore += (audio.clarity + audio.confidence + audio.pace / 2) / 3
      components++
    }

    if (video) {
      totalScore += video.overall.score
      components++
    }

    return components > 0 ? totalScore / components : 0
  }

  private generateComprehensiveRecommendations(
    audio?: AudioAnalysis,
    video?: VideoAnalysis
  ): string[] {
    const recommendations: string[] = []

    if (audio) {
      recommendations.push(...audio.recommendations)
    }

    if (video) {
      recommendations.push(...video.overall.improvements)
    }

    // Add general recommendations
    recommendations.push(
      'Practice regularly to build confidence',
      'Record yourself to identify areas for improvement',
      'Focus on clear, structured responses'
    )

    return [...new Set(recommendations)].slice(0, 5) // Remove duplicates and limit to 5
  }

  // Cleanup resources
  cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.analyser = null
  }
}

export const mediaAnalysisService = new MediaAnalysisService()
export default mediaAnalysisService
