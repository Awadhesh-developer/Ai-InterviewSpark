/**
 * Voice Activity Detection Service
 * Provides real-time voice activity detection using Web Audio API
 */

interface VADConfig {
  sampleRate: number
  fftSize: number
  smoothingTimeConstant: number
  energyThreshold: number
  frequencyThreshold: number
  silenceDuration: number
  speechDuration: number
}

interface VADResult {
  isSpeaking: boolean
  energy: number
  frequency: number
  confidence: number
  timestamp: number
}

interface VADCalibration {
  backgroundNoise: number
  speechLevel: number
  optimalThreshold: number
  calibrationComplete: boolean
}

class VoiceActivityDetection {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private mediaStream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private isActive: boolean = false
  private animationFrame: number | null = null
  
  private config: VADConfig = {
    sampleRate: 44100,
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    energyThreshold: 0.01,
    frequencyThreshold: 0.1,
    silenceDuration: 500, // ms
    speechDuration: 100   // ms
  }

  private calibration: VADCalibration = {
    backgroundNoise: 0,
    speechLevel: 0,
    optimalThreshold: 0.01,
    calibrationComplete: false
  }

  private speechState = {
    isSpeaking: false,
    lastSpeechTime: 0,
    lastSilenceTime: 0,
    speechStartTime: 0,
    silenceStartTime: 0
  }

  private eventHandlers: Map<string, Function[]> = new Map()
  private energyHistory: number[] = []
  private frequencyHistory: number[] = []

  constructor(config?: Partial<VADConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  async initialize(): Promise<void> {
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate
      })

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Get user media
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false, // We want to detect all audio
          autoGainControl: false   // We want consistent levels
        }
      })

      // Create audio analysis chain
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream)
      this.analyser = this.audioContext.createAnalyser()
      
      this.analyser.fftSize = this.config.fftSize
      this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant
      
      this.source.connect(this.analyser)

      console.log('Voice Activity Detection initialized')
      this.emit('initialized', { timestamp: Date.now() })

    } catch (error) {
      console.error('Failed to initialize VAD:', error)
      throw new Error('Voice Activity Detection initialization failed')
    }
  }

  start(): void {
    if (!this.analyser || this.isActive) {
      console.warn('VAD not initialized or already active')
      return
    }

    this.isActive = true
    this.speechState = {
      isSpeaking: false,
      lastSpeechTime: 0,
      lastSilenceTime: Date.now(),
      speechStartTime: 0,
      silenceStartTime: Date.now()
    }

    this.processAudio()
    this.emit('started', { timestamp: Date.now() })
  }

  stop(): void {
    this.isActive = false
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    this.emit('stopped', { timestamp: Date.now() })
  }

  private processAudio(): void {
    if (!this.isActive || !this.analyser) return

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const frequencyArray = new Uint8Array(bufferLength)

    this.analyser.getByteTimeDomainData(dataArray)
    this.analyser.getByteFrequencyData(frequencyArray)

    const vadResult = this.analyzeAudio(dataArray, frequencyArray)
    this.updateSpeechState(vadResult)

    // Continue processing
    this.animationFrame = requestAnimationFrame(() => this.processAudio())
  }

  private analyzeAudio(timeData: Uint8Array, frequencyData: Uint8Array): VADResult {
    const timestamp = Date.now()

    // Calculate energy (RMS)
    let sum = 0
    for (let i = 0; i < timeData.length; i++) {
      const sample = (timeData[i] - 128) / 128
      sum += sample * sample
    }
    const energy = Math.sqrt(sum / timeData.length)

    // Calculate frequency characteristics
    const speechFreqStart = Math.floor(300 * frequencyData.length / (this.config.sampleRate / 2))
    const speechFreqEnd = Math.floor(3400 * frequencyData.length / (this.config.sampleRate / 2))
    
    let speechFreqEnergy = 0
    for (let i = speechFreqStart; i < speechFreqEnd; i++) {
      speechFreqEnergy += frequencyData[i]
    }
    const frequency = speechFreqEnergy / (speechFreqEnd - speechFreqStart) / 255

    // Update history for smoothing
    this.energyHistory.push(energy)
    this.frequencyHistory.push(frequency)
    
    if (this.energyHistory.length > 10) {
      this.energyHistory.shift()
      this.frequencyHistory.shift()
    }

    // Calculate smoothed values
    const smoothedEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length
    const smoothedFrequency = this.frequencyHistory.reduce((a, b) => a + b, 0) / this.frequencyHistory.length

    // Determine if speaking
    const energyAboveThreshold = smoothedEnergy > this.getAdaptiveThreshold()
    const frequencyAboveThreshold = smoothedFrequency > this.config.frequencyThreshold
    const isSpeaking = energyAboveThreshold && frequencyAboveThreshold

    // Calculate confidence
    const energyConfidence = Math.min(smoothedEnergy / this.getAdaptiveThreshold(), 1)
    const frequencyConfidence = Math.min(smoothedFrequency / this.config.frequencyThreshold, 1)
    const confidence = (energyConfidence + frequencyConfidence) / 2

    return {
      isSpeaking,
      energy: smoothedEnergy,
      frequency: smoothedFrequency,
      confidence,
      timestamp
    }
  }

  private getAdaptiveThreshold(): number {
    if (this.calibration.calibrationComplete) {
      return this.calibration.optimalThreshold
    }
    return this.config.energyThreshold
  }

  private updateSpeechState(vadResult: VADResult): void {
    const now = vadResult.timestamp
    const wasSpeaking = this.speechState.isSpeaking

    if (vadResult.isSpeaking) {
      if (!wasSpeaking) {
        // Speech started
        const silenceDuration = now - this.speechState.silenceStartTime
        if (silenceDuration >= this.config.silenceDuration) {
          this.speechState.isSpeaking = true
          this.speechState.speechStartTime = now
          this.emit('speech.start', { 
            timestamp: now, 
            silenceDuration,
            vadResult 
          })
        }
      }
      this.speechState.lastSpeechTime = now
    } else {
      if (wasSpeaking) {
        // Potential speech end
        const speechDuration = now - this.speechState.lastSpeechTime
        if (speechDuration >= this.config.speechDuration) {
          this.speechState.isSpeaking = false
          this.speechState.silenceStartTime = now
          const totalSpeechDuration = now - this.speechState.speechStartTime
          this.emit('speech.end', { 
            timestamp: now, 
            speechDuration: totalSpeechDuration,
            vadResult 
          })
        }
      } else {
        this.speechState.silenceStartTime = now
      }
    }

    // Emit continuous updates
    this.emit('vad.update', vadResult)
  }

  async calibrateBackground(durationMs: number = 3000): Promise<VADCalibration> {
    if (!this.analyser) {
      throw new Error('VAD not initialized')
    }

    console.log('Starting background noise calibration...')
    this.emit('calibration.start', { type: 'background', duration: durationMs })

    const samples: number[] = []
    const startTime = Date.now()

    return new Promise((resolve) => {
      const collectSample = () => {
        if (Date.now() - startTime >= durationMs) {
          // Calculate background noise level
          const avgNoise = samples.reduce((a, b) => a + b, 0) / samples.length
          this.calibration.backgroundNoise = avgNoise
          
          console.log('Background calibration complete:', avgNoise)
          this.emit('calibration.background.complete', { 
            backgroundNoise: avgNoise,
            samples: samples.length 
          })
          
          resolve(this.calibration)
          return
        }

        const bufferLength = this.analyser!.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        this.analyser!.getByteTimeDomainData(dataArray)

        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          const sample = (dataArray[i] - 128) / 128
          sum += sample * sample
        }
        const energy = Math.sqrt(sum / dataArray.length)
        samples.push(energy)

        setTimeout(collectSample, 100)
      }

      collectSample()
    })
  }

  async calibrateSpeech(durationMs: number = 5000): Promise<VADCalibration> {
    if (!this.analyser) {
      throw new Error('VAD not initialized')
    }

    console.log('Starting speech level calibration...')
    this.emit('calibration.start', { type: 'speech', duration: durationMs })

    const samples: number[] = []
    const startTime = Date.now()

    return new Promise((resolve) => {
      const collectSample = () => {
        if (Date.now() - startTime >= durationMs) {
          // Calculate speech level and optimal threshold
          const avgSpeech = samples.reduce((a, b) => a + b, 0) / samples.length
          this.calibration.speechLevel = avgSpeech
          
          // Set threshold between background noise and speech level
          const margin = 0.3 // 30% margin
          this.calibration.optimalThreshold = this.calibration.backgroundNoise + 
            (avgSpeech - this.calibration.backgroundNoise) * margin
          
          this.calibration.calibrationComplete = true
          
          console.log('Speech calibration complete:', {
            speechLevel: avgSpeech,
            optimalThreshold: this.calibration.optimalThreshold
          })
          
          this.emit('calibration.speech.complete', this.calibration)
          resolve(this.calibration)
          return
        }

        const bufferLength = this.analyser!.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        this.analyser!.getByteTimeDomainData(dataArray)

        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          const sample = (dataArray[i] - 128) / 128
          sum += sample * sample
        }
        const energy = Math.sqrt(sum / dataArray.length)
        
        // Only collect samples above background noise
        if (energy > this.calibration.backgroundNoise * 1.5) {
          samples.push(energy)
        }

        setTimeout(collectSample, 100)
      }

      collectSample()
    })
  }

  async autoCalibrate(): Promise<VADCalibration> {
    await this.calibrateBackground(2000)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Brief pause
    await this.calibrateSpeech(3000)
    return this.calibration
  }

  // Configuration methods
  updateConfig(newConfig: Partial<VADConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  getConfig(): VADConfig {
    return { ...this.config }
  }

  getCalibration(): VADCalibration {
    return { ...this.calibration }
  }

  setThreshold(threshold: number): void {
    this.calibration.optimalThreshold = threshold
  }

  // State methods
  isSpeaking(): boolean {
    return this.speechState.isSpeaking
  }

  isCalibrated(): boolean {
    return this.calibration.calibrationComplete
  }

  getCurrentEnergy(): number {
    return this.energyHistory[this.energyHistory.length - 1] || 0
  }

  // Event handling
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error(`Error in VAD event handler for ${event}:`, error)
      }
    })
  }

  // Cleanup
  destroy(): void {
    this.stop()

    if (this.source) {
      this.source.disconnect()
      this.source = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.analyser = null
    this.eventHandlers.clear()
    this.energyHistory = []
    this.frequencyHistory = []
  }
}

export { 
  VoiceActivityDetection, 
  type VADConfig, 
  type VADResult, 
  type VADCalibration 
}
