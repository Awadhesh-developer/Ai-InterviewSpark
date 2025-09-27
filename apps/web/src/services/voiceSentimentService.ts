/**
 * Voice Sentiment Analysis Service
 * Extracts emotional cues from voice audio including tone, pitch, pace, and stress indicators
 */

interface VoiceSentimentResult {
  overallSentiment: number
  emotionalTone: VoiceEmotionalTone
  prosodyAnalysis: ProsodyAnalysis
  stressIndicators: StressIndicators
  confidenceMarkers: ConfidenceMarkers
  communicationQuality: CommunicationQuality
  voiceCharacteristics: VoiceCharacteristics
  confidence: number
}

interface VoiceEmotionalTone {
  primary: VoiceEmotion
  secondary: VoiceEmotion
  intensity: number
  stability: number
  authenticity: number
}

interface ProsodyAnalysis {
  pitch: {
    average: number
    range: number
    variance: number
    trend: 'rising' | 'falling' | 'stable'
  }
  pace: {
    wordsPerMinute: number
    pauseFrequency: number
    pauseDuration: number
    rhythm: 'steady' | 'irregular' | 'rushed' | 'hesitant'
  }
  volume: {
    average: number
    range: number
    consistency: number
    projection: number
  }
  intonation: {
    expressiveness: number
    monotony: number
    emphasis: number
    questioningTone: number
  }
}

interface StressIndicators {
  overallStressLevel: number
  voiceTremor: number
  breathingPattern: 'normal' | 'shallow' | 'irregular' | 'rapid'
  speechDisfluencies: {
    fillerWords: number
    repetitions: number
    falseStarts: number
    longPauses: number
  }
  tensionMarkers: {
    voiceStrain: number
    articulation: number
    resonance: number
  }
}

interface ConfidenceMarkers {
  overallConfidence: number
  vocalStrength: number
  assertiveness: number
  clarity: number
  conviction: number
  hesitationLevel: number
}

interface CommunicationQuality {
  articulation: number
  pronunciation: number
  fluency: number
  coherence: number
  engagement: number
  professionalism: number
}

interface VoiceCharacteristics {
  fundamentalFrequency: number
  formantStructure: number[]
  spectralCentroid: number
  harmonicToNoiseRatio: number
  jitter: number
  shimmer: number
}

type VoiceEmotion = 
  | 'confident' | 'nervous' | 'excited' | 'calm' | 'frustrated' | 'enthusiastic'
  | 'uncertain' | 'determined' | 'relaxed' | 'tense' | 'engaged' | 'bored'

class VoiceSentimentService {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private isInitialized: boolean = false
  private voiceHistory: VoiceSentimentResult[] = []
  private baselineVoiceProfile: VoiceCharacteristics | null = null

  constructor() {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize Web Audio API
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      
      // Configure analyser
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.8

      this.isInitialized = true
      console.log('Voice Sentiment Service initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize Voice Sentiment Service:', error)
      throw error
    }
  }

  async analyzeVoiceSentiment(
    audioData: Float32Array | ArrayBuffer,
    context?: {
      duration: number
      sampleRate: number
      transcription?: string
    }
  ): Promise<VoiceSentimentResult> {
    if (!this.isInitialized) {
      throw new Error('Voice Sentiment Service not initialized')
    }

    // Convert audio data to analyzable format
    const audioBuffer = await this.processAudioData(audioData, context?.sampleRate || 44100)
    
    // Extract voice characteristics
    const voiceCharacteristics = this.extractVoiceCharacteristics(audioBuffer)
    
    // Set baseline if not established
    if (!this.baselineVoiceProfile) {
      this.baselineVoiceProfile = voiceCharacteristics
    }

    // Analyze prosody (pitch, pace, volume, intonation)
    const prosodyAnalysis = this.analyzeProsody(audioBuffer, context)

    // Detect stress indicators
    const stressIndicators = this.detectStressIndicators(audioBuffer, prosodyAnalysis, context)

    // Analyze confidence markers
    const confidenceMarkers = this.analyzeConfidenceMarkers(prosodyAnalysis, stressIndicators)

    // Assess communication quality
    const communicationQuality = this.assessCommunicationQuality(prosodyAnalysis, stressIndicators, context)

    // Determine emotional tone
    const emotionalTone = this.determineEmotionalTone(prosodyAnalysis, stressIndicators, confidenceMarkers)

    // Calculate overall sentiment
    const overallSentiment = this.calculateOverallSentiment(emotionalTone, confidenceMarkers, stressIndicators)

    // Calculate confidence in analysis
    const confidence = this.calculateAnalysisConfidence(audioBuffer, context)

    const result: VoiceSentimentResult = {
      overallSentiment,
      emotionalTone,
      prosodyAnalysis,
      stressIndicators,
      confidenceMarkers,
      communicationQuality,
      voiceCharacteristics,
      confidence
    }

    // Store in history
    this.voiceHistory.push(result)
    if (this.voiceHistory.length > 50) {
      this.voiceHistory = this.voiceHistory.slice(-50)
    }

    return result
  }

  private async processAudioData(audioData: Float32Array | ArrayBuffer, sampleRate: number): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized')
    }

    let audioBuffer: AudioBuffer

    if (audioData instanceof ArrayBuffer) {
      audioBuffer = await this.audioContext.decodeAudioData(audioData)
    } else {
      // Create AudioBuffer from Float32Array
      audioBuffer = this.audioContext.createBuffer(1, audioData.length, sampleRate)
      audioBuffer.copyToChannel(audioData, 0)
    }

    return audioBuffer
  }

  private extractVoiceCharacteristics(audioBuffer: AudioBuffer): VoiceCharacteristics {
    const channelData = audioBuffer.getChannelData(0)
    
    // Calculate fundamental frequency (F0)
    const fundamentalFrequency = this.calculateFundamentalFrequency(channelData, audioBuffer.sampleRate)
    
    // Extract formant structure (simplified)
    const formantStructure = this.extractFormants(channelData, audioBuffer.sampleRate)
    
    // Calculate spectral centroid
    const spectralCentroid = this.calculateSpectralCentroid(channelData, audioBuffer.sampleRate)
    
    // Calculate harmonic-to-noise ratio
    const harmonicToNoiseRatio = this.calculateHarmonicToNoiseRatio(channelData)
    
    // Calculate jitter and shimmer (voice quality measures)
    const jitter = this.calculateJitter(channelData, fundamentalFrequency, audioBuffer.sampleRate)
    const shimmer = this.calculateShimmer(channelData)

    return {
      fundamentalFrequency,
      formantStructure,
      spectralCentroid,
      harmonicToNoiseRatio,
      jitter,
      shimmer
    }
  }

  private calculateFundamentalFrequency(audioData: Float32Array, sampleRate: number): number {
    // Simplified autocorrelation-based F0 estimation
    const minPeriod = Math.floor(sampleRate / 500) // 500 Hz max
    const maxPeriod = Math.floor(sampleRate / 50)  // 50 Hz min
    
    let bestPeriod = minPeriod
    let bestCorrelation = 0

    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0
      let count = 0

      for (let i = 0; i < audioData.length - period; i++) {
        correlation += audioData[i] * audioData[i + period]
        count++
      }

      correlation /= count
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestPeriod = period
      }
    }

    return sampleRate / bestPeriod
  }

  private extractFormants(audioData: Float32Array, sampleRate: number): number[] {
    // Simplified formant extraction using FFT peaks
    const fftSize = 1024
    const fft = this.performFFT(audioData.slice(0, fftSize))
    const magnitude = fft.map(complex => Math.sqrt(complex.real * complex.real + complex.imag * complex.imag))
    
    // Find peaks in the spectrum (simplified formant detection)
    const formants: number[] = []
    const freqBin = sampleRate / fftSize

    for (let i = 1; i < magnitude.length - 1; i++) {
      if (magnitude[i] > magnitude[i - 1] && magnitude[i] > magnitude[i + 1] && magnitude[i] > 0.1) {
        const frequency = i * freqBin
        if (frequency > 200 && frequency < 4000) { // Typical formant range
          formants.push(frequency)
        }
      }
    }

    return formants.slice(0, 4) // Return first 4 formants
  }

  private performFFT(audioData: Float32Array): Array<{real: number, imag: number}> {
    // Simplified FFT implementation (in production, use a proper FFT library)
    const N = audioData.length
    const result: Array<{real: number, imag: number}> = []

    for (let k = 0; k < N; k++) {
      let real = 0
      let imag = 0

      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N
        real += audioData[n] * Math.cos(angle)
        imag += audioData[n] * Math.sin(angle)
      }

      result.push({ real, imag })
    }

    return result
  }

  private calculateSpectralCentroid(audioData: Float32Array, sampleRate: number): number {
    const fft = this.performFFT(audioData)
    const magnitude = fft.map(complex => Math.sqrt(complex.real * complex.real + complex.imag * complex.imag))
    
    let weightedSum = 0
    let magnitudeSum = 0

    for (let i = 0; i < magnitude.length / 2; i++) {
      const frequency = i * sampleRate / audioData.length
      weightedSum += frequency * magnitude[i]
      magnitudeSum += magnitude[i]
    }

    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0
  }

  private calculateHarmonicToNoiseRatio(audioData: Float32Array): number {
    // Simplified HNR calculation
    const autocorr = this.calculateAutocorrelation(audioData)
    const maxCorr = Math.max(...autocorr.slice(1)) // Exclude zero lag
    
    return Math.max(0, Math.min(1, maxCorr))
  }

  private calculateAutocorrelation(audioData: Float32Array): Float32Array {
    const result = new Float32Array(audioData.length)
    
    for (let lag = 0; lag < audioData.length; lag++) {
      let sum = 0
      let count = 0

      for (let i = 0; i < audioData.length - lag; i++) {
        sum += audioData[i] * audioData[i + lag]
        count++
      }

      result[lag] = count > 0 ? sum / count : 0
    }

    return result
  }

  private calculateJitter(audioData: Float32Array, f0: number, sampleRate: number): number {
    // Simplified jitter calculation (period-to-period variation)
    const periodLength = sampleRate / f0
    const periods: number[] = []

    for (let i = 0; i < audioData.length - periodLength * 2; i += periodLength) {
      const period = this.findActualPeriod(audioData, i, periodLength)
      periods.push(period)
    }

    if (periods.length < 2) return 0

    const avgPeriod = periods.reduce((sum, p) => sum + p, 0) / periods.length
    const jitterSum = periods.reduce((sum, p) => sum + Math.abs(p - avgPeriod), 0)
    
    return jitterSum / (periods.length * avgPeriod)
  }

  private findActualPeriod(audioData: Float32Array, start: number, estimatedPeriod: number): number {
    // Find the actual period around the estimated period
    const searchRange = Math.floor(estimatedPeriod * 0.2)
    let bestPeriod = estimatedPeriod
    let bestCorrelation = 0

    for (let period = estimatedPeriod - searchRange; period <= estimatedPeriod + searchRange; period++) {
      if (start + period >= audioData.length) break

      let correlation = 0
      for (let i = 0; i < Math.min(period, audioData.length - start - period); i++) {
        correlation += audioData[start + i] * audioData[start + i + period]
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestPeriod = period
      }
    }

    return bestPeriod
  }

  private calculateShimmer(audioData: Float32Array): number {
    // Simplified shimmer calculation (amplitude variation)
    const windowSize = 1024
    const amplitudes: number[] = []

    for (let i = 0; i < audioData.length - windowSize; i += windowSize / 2) {
      let sum = 0
      for (let j = 0; j < windowSize; j++) {
        sum += Math.abs(audioData[i + j])
      }
      amplitudes.push(sum / windowSize)
    }

    if (amplitudes.length < 2) return 0

    const avgAmplitude = amplitudes.reduce((sum, a) => sum + a, 0) / amplitudes.length
    const shimmerSum = amplitudes.reduce((sum, a) => sum + Math.abs(a - avgAmplitude), 0)
    
    return avgAmplitude > 0 ? shimmerSum / (amplitudes.length * avgAmplitude) : 0
  }

  private analyzeProsody(audioBuffer: AudioBuffer, context?: any): ProsodyAnalysis {
    const channelData = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate
    const duration = audioBuffer.duration

    // Analyze pitch
    const pitch = this.analyzePitch(channelData, sampleRate)
    
    // Analyze pace
    const pace = this.analyzePace(channelData, duration, context?.transcription)
    
    // Analyze volume
    const volume = this.analyzeVolume(channelData)
    
    // Analyze intonation
    const intonation = this.analyzeIntonation(channelData, sampleRate)

    return { pitch, pace, volume, intonation }
  }

  private analyzePitch(audioData: Float32Array, sampleRate: number): ProsodyAnalysis['pitch'] {
    const windowSize = 1024
    const pitchValues: number[] = []

    for (let i = 0; i < audioData.length - windowSize; i += windowSize / 2) {
      const window = audioData.slice(i, i + windowSize)
      const f0 = this.calculateFundamentalFrequency(window, sampleRate)
      if (f0 > 50 && f0 < 500) { // Valid pitch range
        pitchValues.push(f0)
      }
    }

    if (pitchValues.length === 0) {
      return { average: 0, range: 0, variance: 0, trend: 'stable' }
    }

    const average = pitchValues.reduce((sum, p) => sum + p, 0) / pitchValues.length
    const range = Math.max(...pitchValues) - Math.min(...pitchValues)
    const variance = pitchValues.reduce((sum, p) => sum + Math.pow(p - average, 2), 0) / pitchValues.length

    // Determine trend
    const firstHalf = pitchValues.slice(0, Math.floor(pitchValues.length / 2))
    const secondHalf = pitchValues.slice(Math.floor(pitchValues.length / 2))
    const firstAvg = firstHalf.reduce((sum, p) => sum + p, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, p) => sum + p, 0) / secondHalf.length
    
    let trend: 'rising' | 'falling' | 'stable' = 'stable'
    if (secondAvg > firstAvg + 10) trend = 'rising'
    else if (secondAvg < firstAvg - 10) trend = 'falling'

    return { average, range, variance, trend }
  }

  private analyzePace(audioData: Float32Array, duration: number, transcription?: string): ProsodyAnalysis['pace'] {
    // Estimate words per minute
    const estimatedWords = transcription ? transcription.split(' ').length : Math.floor(duration * 2.5) // Rough estimate
    const wordsPerMinute = (estimatedWords / duration) * 60

    // Detect pauses (simplified)
    const pauseThreshold = 0.01
    const pauseMinDuration = 0.1 // 100ms
    const sampleRate = 44100 // Assumed
    const pauseMinSamples = pauseMinDuration * sampleRate

    let pauseCount = 0
    let totalPauseDuration = 0
    let currentPauseLength = 0
    let inPause = false

    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) < pauseThreshold) {
        if (!inPause) {
          inPause = true
          currentPauseLength = 1
        } else {
          currentPauseLength++
        }
      } else {
        if (inPause && currentPauseLength >= pauseMinSamples) {
          pauseCount++
          totalPauseDuration += currentPauseLength / sampleRate
        }
        inPause = false
        currentPauseLength = 0
      }
    }

    const pauseFrequency = pauseCount / duration
    const pauseDuration = pauseCount > 0 ? totalPauseDuration / pauseCount : 0

    // Determine rhythm
    let rhythm: 'steady' | 'irregular' | 'rushed' | 'hesitant' = 'steady'
    if (wordsPerMinute > 180) rhythm = 'rushed'
    else if (wordsPerMinute < 120) rhythm = 'hesitant'
    else if (pauseFrequency > 2) rhythm = 'irregular'

    return { wordsPerMinute, pauseFrequency, pauseDuration, rhythm }
  }

  private analyzeVolume(audioData: Float32Array): ProsodyAnalysis['volume'] {
    const windowSize = 1024
    const volumes: number[] = []

    for (let i = 0; i < audioData.length - windowSize; i += windowSize / 2) {
      let rms = 0
      for (let j = 0; j < windowSize; j++) {
        rms += audioData[i + j] * audioData[i + j]
      }
      volumes.push(Math.sqrt(rms / windowSize))
    }

    const average = volumes.reduce((sum, v) => sum + v, 0) / volumes.length
    const range = Math.max(...volumes) - Math.min(...volumes)
    const variance = volumes.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / volumes.length
    const consistency = 1 - (Math.sqrt(variance) / average)
    const projection = average // Simplified projection measure

    return { average, range, consistency, projection }
  }

  private analyzeIntonation(audioData: Float32Array, sampleRate: number): ProsodyAnalysis['intonation'] {
    // Simplified intonation analysis
    const pitchContour = this.extractPitchContour(audioData, sampleRate)
    
    const expressiveness = this.calculateVariance(pitchContour) / 100 // Normalized
    const monotony = 1 - expressiveness
    const emphasis = this.detectEmphasis(pitchContour)
    const questioningTone = this.detectQuestioningTone(pitchContour)

    return { expressiveness, monotony, emphasis, questioningTone }
  }

  private extractPitchContour(audioData: Float32Array, sampleRate: number): number[] {
    const windowSize = 512
    const pitchContour: number[] = []

    for (let i = 0; i < audioData.length - windowSize; i += windowSize / 4) {
      const window = audioData.slice(i, i + windowSize)
      const f0 = this.calculateFundamentalFrequency(window, sampleRate)
      pitchContour.push(f0)
    }

    return pitchContour
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  }

  private detectEmphasis(pitchContour: number[]): number {
    // Detect pitch peaks that indicate emphasis
    let emphasisCount = 0
    const threshold = this.calculateVariance(pitchContour) * 0.5

    for (let i = 1; i < pitchContour.length - 1; i++) {
      if (pitchContour[i] > pitchContour[i - 1] + threshold &&
          pitchContour[i] > pitchContour[i + 1] + threshold) {
        emphasisCount++
      }
    }

    return Math.min(1, emphasisCount / (pitchContour.length / 10))
  }

  private detectQuestioningTone(pitchContour: number[]): number {
    // Detect rising intonation at the end (questioning tone)
    if (pitchContour.length < 5) return 0

    const endSegment = pitchContour.slice(-5)
    const trend = endSegment[endSegment.length - 1] - endSegment[0]
    
    return Math.max(0, Math.min(1, trend / 50)) // Normalized
  }

  private detectStressIndicators(
    audioBuffer: AudioBuffer,
    prosodyAnalysis: ProsodyAnalysis,
    context?: any
  ): StressIndicators {
    const channelData = audioBuffer.getChannelData(0)

    // Overall stress level based on multiple indicators
    const voiceTremor = this.detectVoiceTremor(channelData, audioBuffer.sampleRate)
    const breathingPattern = this.analyzeBreathingPattern(channelData, prosodyAnalysis.pace)
    const speechDisfluencies = this.analyzeSpeechDisfluencies(context?.transcription, prosodyAnalysis.pace)
    const tensionMarkers = this.analyzeTensionMarkers(channelData, prosodyAnalysis)

    const overallStressLevel = (
      voiceTremor +
      (breathingPattern === 'normal' ? 0 : 0.5) +
      (speechDisfluencies.fillerWords + speechDisfluencies.repetitions + speechDisfluencies.falseStarts) / 3 +
      (tensionMarkers.voiceStrain + tensionMarkers.articulation) / 2
    ) / 4

    return {
      overallStressLevel,
      voiceTremor,
      breathingPattern,
      speechDisfluencies,
      tensionMarkers
    }
  }

  private detectVoiceTremor(audioData: Float32Array, sampleRate: number): number {
    // Detect tremor in the 4-12 Hz range
    const windowSize = sampleRate // 1 second windows
    let tremorSum = 0
    let windowCount = 0

    for (let i = 0; i < audioData.length - windowSize; i += windowSize / 2) {
      const window = audioData.slice(i, i + windowSize)
      const fft = this.performFFT(window)
      const magnitude = fft.map(c => Math.sqrt(c.real * c.real + c.imag * c.imag))
      
      // Check for peaks in tremor frequency range
      const tremorStart = Math.floor(4 * windowSize / sampleRate)
      const tremorEnd = Math.floor(12 * windowSize / sampleRate)
      
      let tremorEnergy = 0
      for (let j = tremorStart; j < tremorEnd && j < magnitude.length; j++) {
        tremorEnergy += magnitude[j]
      }
      
      tremorSum += tremorEnergy
      windowCount++
    }

    return windowCount > 0 ? Math.min(1, tremorSum / windowCount / 100) : 0
  }

  private analyzeBreathingPattern(audioData: Float32Array, pace: ProsodyAnalysis['pace']): StressIndicators['breathingPattern'] {
    // Simplified breathing pattern analysis based on pause patterns
    if (pace.pauseFrequency > 3 && pace.pauseDuration < 0.3) {
      return 'rapid'
    } else if (pace.pauseFrequency > 2 && pace.pauseDuration < 0.5) {
      return 'shallow'
    } else if (pace.rhythm === 'irregular') {
      return 'irregular'
    } else {
      return 'normal'
    }
  }

  private analyzeSpeechDisfluencies(transcription?: string, pace?: ProsodyAnalysis['pace']): StressIndicators['speechDisfluencies'] {
    if (!transcription) {
      return { fillerWords: 0, repetitions: 0, falseStarts: 0, longPauses: 0 }
    }

    const words = transcription.toLowerCase().split(' ')
    const fillerWords = ['um', 'uh', 'er', 'ah', 'like', 'you know'].filter(filler => 
      words.includes(filler)
    ).length / words.length

    // Simplified detection (in production, use more sophisticated NLP)
    const repetitions = this.detectRepetitions(words) / words.length
    const falseStarts = this.detectFalseStarts(transcription) / words.length
    const longPauses = pace?.pauseFrequency || 0

    return { fillerWords, repetitions, falseStarts, longPauses }
  }

  private detectRepetitions(words: string[]): number {
    let repetitionCount = 0
    for (let i = 1; i < words.length; i++) {
      if (words[i] === words[i - 1]) {
        repetitionCount++
      }
    }
    return repetitionCount
  }

  private detectFalseStarts(transcription: string): number {
    // Simple heuristic for false starts
    const falseStartPatterns = /\b\w+\s+\w+\s+I mean|\bwell\s+actually|\bsorry\s+let me/gi
    const matches = transcription.match(falseStartPatterns)
    return matches ? matches.length : 0
  }

  private analyzeTensionMarkers(audioData: Float32Array, prosodyAnalysis: ProsodyAnalysis): StressIndicators['tensionMarkers'] {
    // Voice strain based on spectral characteristics
    const voiceStrain = Math.min(1, prosodyAnalysis.pitch.variance / 1000)
    
    // Articulation based on volume consistency
    const articulation = 1 - prosodyAnalysis.volume.consistency
    
    // Resonance based on harmonic content (simplified)
    const resonance = Math.min(1, prosodyAnalysis.intonation.monotony)

    return { voiceStrain, articulation, resonance }
  }

  private analyzeConfidenceMarkers(
    prosodyAnalysis: ProsodyAnalysis,
    stressIndicators: StressIndicators
  ): ConfidenceMarkers {
    const vocalStrength = prosodyAnalysis.volume.projection
    const assertiveness = prosodyAnalysis.intonation.emphasis
    const clarity = 1 - stressIndicators.tensionMarkers.articulation
    const conviction = 1 - prosodyAnalysis.intonation.questioningTone
    const hesitationLevel = stressIndicators.speechDisfluencies.longPauses

    const overallConfidence = (vocalStrength + assertiveness + clarity + conviction + (1 - hesitationLevel)) / 5

    return {
      overallConfidence,
      vocalStrength,
      assertiveness,
      clarity,
      conviction,
      hesitationLevel
    }
  }

  private assessCommunicationQuality(
    prosodyAnalysis: ProsodyAnalysis,
    stressIndicators: StressIndicators,
    context?: any
  ): CommunicationQuality {
    const articulation = 1 - stressIndicators.tensionMarkers.articulation
    const pronunciation = 1 - stressIndicators.tensionMarkers.voiceStrain
    const fluency = 1 - stressIndicators.speechDisfluencies.fillerWords
    const coherence = prosodyAnalysis.pace.rhythm === 'steady' ? 0.8 : 0.5
    const engagement = prosodyAnalysis.intonation.expressiveness
    const professionalism = (articulation + pronunciation + fluency) / 3

    return {
      articulation,
      pronunciation,
      fluency,
      coherence,
      engagement,
      professionalism
    }
  }

  private determineEmotionalTone(
    prosodyAnalysis: ProsodyAnalysis,
    stressIndicators: StressIndicators,
    confidenceMarkers: ConfidenceMarkers
  ): VoiceEmotionalTone {
    // Determine primary emotion based on voice characteristics
    let primary: VoiceEmotion = 'calm'
    
    if (confidenceMarkers.overallConfidence > 0.7) {
      primary = 'confident'
    } else if (stressIndicators.overallStressLevel > 0.6) {
      primary = 'nervous'
    } else if (prosodyAnalysis.intonation.expressiveness > 0.7) {
      primary = 'enthusiastic'
    } else if (prosodyAnalysis.pace.wordsPerMinute > 180) {
      primary = 'excited'
    } else if (stressIndicators.overallStressLevel > 0.4) {
      primary = 'tense'
    }

    // Determine secondary emotion
    let secondary: VoiceEmotion = 'calm'
    if ((primary as VoiceEmotion) !== 'engaged' && prosodyAnalysis.intonation.expressiveness > 0.5) {
      secondary = 'engaged'
    } else if ((primary as VoiceEmotion) !== 'determined' && confidenceMarkers.conviction > 0.6) {
      secondary = 'determined'
    }

    const intensity = Math.max(
      prosodyAnalysis.intonation.expressiveness,
      stressIndicators.overallStressLevel,
      confidenceMarkers.overallConfidence
    )

    const stability = 1 - stressIndicators.overallStressLevel
    const authenticity = confidenceMarkers.clarity

    return { primary, secondary, intensity, stability, authenticity }
  }

  private calculateOverallSentiment(
    emotionalTone: VoiceEmotionalTone,
    confidenceMarkers: ConfidenceMarkers,
    stressIndicators: StressIndicators
  ): number {
    // Map emotions to sentiment values
    const emotionSentimentMap: Record<VoiceEmotion, number> = {
      confident: 0.8, excited: 0.7, enthusiastic: 0.8, engaged: 0.6, determined: 0.7, calm: 0.5,
      nervous: -0.4, frustrated: -0.6, uncertain: -0.3, tense: -0.5, bored: -0.4, relaxed: 0.3
    }

    const primarySentiment = emotionSentimentMap[emotionalTone.primary] || 0
    const confidenceBoost = (confidenceMarkers.overallConfidence - 0.5) * 0.4
    const stressPenalty = stressIndicators.overallStressLevel * -0.3

    const overallSentiment = primarySentiment + confidenceBoost + stressPenalty
    return Math.max(-1, Math.min(1, overallSentiment))
  }

  private calculateAnalysisConfidence(audioBuffer: AudioBuffer, context?: any): number {
    const duration = audioBuffer.duration
    const sampleRate = audioBuffer.sampleRate
    
    // Base confidence on audio quality factors
    let confidence = 0.7 // Base confidence
    
    // Duration factor
    if (duration > 2) confidence += 0.1
    if (duration > 5) confidence += 0.1
    
    // Sample rate factor
    if (sampleRate >= 44100) confidence += 0.1
    
    // Context factor
    if (context?.transcription && context.transcription.length > 50) {
      confidence += 0.1
    }

    return Math.min(1, confidence)
  }

  // Public API methods
  getVoiceHistory(): VoiceSentimentResult[] {
    return [...this.voiceHistory]
  }

  getBaselineProfile(): VoiceCharacteristics | null {
    return this.baselineVoiceProfile
  }

  clearHistory(): void {
    this.voiceHistory = []
  }

  resetBaseline(): void {
    this.baselineVoiceProfile = null
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.analyser = null
    this.voiceHistory = []
    this.isInitialized = false
  }
}

export { 
  VoiceSentimentService,
  type VoiceSentimentResult,
  type VoiceEmotionalTone,
  type ProsodyAnalysis,
  type StressIndicators,
  type ConfidenceMarkers,
  type CommunicationQuality,
  type VoiceCharacteristics,
  type VoiceEmotion
}
