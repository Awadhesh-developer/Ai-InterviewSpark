/**
 * Voice Interaction Service
 * Unified service that orchestrates all voice components for interview interactions
 */

import { RealtimeSpeechService, type RealtimeConfig, type SpeechEvent, type InterviewContext } from './realtimeSpeechService'
import { SpeechRecognitionFallback, type SpeechRecognitionConfig, type TranscriptionResult } from './speechRecognitionFallback'
import { VoiceActivityDetection, type VADConfig, type VADResult } from './voiceActivityDetection'

interface VoiceServiceConfig {
  preferredService: 'realtime' | 'fallback' | 'auto'
  realtimeConfig: RealtimeConfig
  fallbackConfig: SpeechRecognitionConfig
  vadConfig: VADConfig
  autoFallback: boolean
  calibrationRequired: boolean
}

interface VoiceInteractionState {
  isInitialized: boolean
  activeService: 'realtime' | 'fallback' | 'none'
  isListening: boolean
  isSpeaking: boolean
  isCalibrated: boolean
  lastTranscription?: TranscriptionResult
  lastError?: string
}

interface VoiceCapabilities {
  realtimeAvailable: boolean
  fallbackAvailable: boolean
  vadAvailable: boolean
  supportedLanguages: string[]
  recommendedService: 'realtime' | 'fallback'
}

class VoiceInteractionService {
  private realtimeService: RealtimeSpeechService | null = null
  private fallbackService: SpeechRecognitionFallback | null = null
  private vadService: VoiceActivityDetection | null = null
  
  private state: VoiceInteractionState = {
    isInitialized: false,
    activeService: 'none',
    isListening: false,
    isSpeaking: false,
    isCalibrated: false
  }

  private eventHandlers: Map<string, Function[]> = new Map()
  private initializationPromise: Promise<void> | null = null

  constructor(private config: VoiceServiceConfig) {}

  async initialize(): Promise<VoiceCapabilities> {
    if (this.initializationPromise) {
      await this.initializationPromise
      return this.getCapabilities()
    }

    this.initializationPromise = this.performInitialization()
    await this.initializationPromise
    return this.getCapabilities()
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('Initializing Voice Interaction Service...')

      // Initialize VAD service first
      if (this.config.vadConfig) {
        this.vadService = new VoiceActivityDetection(this.config.vadConfig)
        await this.vadService.initialize()
        this.setupVADEventHandlers()
      }

      // Initialize services based on preference
      if (this.config.preferredService === 'realtime' || this.config.preferredService === 'auto') {
        await this.initializeRealtimeService()
      }

      if (this.config.preferredService === 'fallback' || this.config.preferredService === 'auto' || this.config.autoFallback) {
        await this.initializeFallbackService()
      }

      // Determine active service
      this.determineActiveService()

      // Perform calibration if required
      if (this.config.calibrationRequired && this.vadService) {
        await this.performCalibration()
      }

      this.state.isInitialized = true
      console.log('Voice Interaction Service initialized successfully')
      this.emit('initialized', this.getCapabilities())

    } catch (error) {
      console.error('Failed to initialize Voice Interaction Service:', error)
      this.state.lastError = error instanceof Error ? error.message : 'Initialization failed'
      throw error
    }
  }

  private async initializeRealtimeService(): Promise<void> {
    try {
      this.realtimeService = new RealtimeSpeechService(this.config.realtimeConfig)
      await this.realtimeService.connect()
      this.setupRealtimeEventHandlers()
      console.log('OpenAI Realtime service initialized')
    } catch (error) {
      console.warn('Failed to initialize Realtime service:', error)
      this.realtimeService = null
    }
  }

  private async initializeFallbackService(): Promise<void> {
    try {
      this.fallbackService = new SpeechRecognitionFallback(this.config.fallbackConfig)
      this.setupFallbackEventHandlers()
      console.log('Web Speech API fallback service initialized')
    } catch (error) {
      console.warn('Failed to initialize fallback service:', error)
      this.fallbackService = null
    }
  }

  private determineActiveService(): void {
    if (this.config.preferredService === 'realtime' && this.realtimeService) {
      this.state.activeService = 'realtime'
    } else if (this.config.preferredService === 'fallback' && this.fallbackService) {
      this.state.activeService = 'fallback'
    } else if (this.realtimeService) {
      this.state.activeService = 'realtime'
    } else if (this.fallbackService) {
      this.state.activeService = 'fallback'
    } else {
      this.state.activeService = 'none'
      throw new Error('No voice services available')
    }

    console.log(`Active voice service: ${this.state.activeService}`)
  }

  private setupRealtimeEventHandlers(): void {
    if (!this.realtimeService) return

    this.realtimeService.on('speech.start', (event: SpeechEvent) => {
      this.state.isListening = true
      this.emit('speech.start', event)
    })

    this.realtimeService.on('speech.end', (event: SpeechEvent) => {
      this.state.isListening = false
      this.emit('speech.end', event)
    })

    this.realtimeService.on('transcription', (event: SpeechEvent) => {
      this.state.lastTranscription = {
        text: event.data.text,
        confidence: event.data.confidence,
        isFinal: true,
        timestamp: event.timestamp
      }
      this.emit('transcription', this.state.lastTranscription)
    })

    this.realtimeService.on('response.complete', (event: SpeechEvent) => {
      this.emit('response.complete', event)
    })

    this.realtimeService.on('error', (event: SpeechEvent) => {
      this.state.lastError = event.data
      this.emit('error', event)
      
      if (this.config.autoFallback && this.fallbackService) {
        this.switchToFallback()
      }
    })
  }

  private setupFallbackEventHandlers(): void {
    if (!this.fallbackService) return

    this.fallbackService.on('listening.start', (data: any) => {
      this.state.isListening = true
      this.emit('speech.start', { timestamp: data.timestamp, data })
    })

    this.fallbackService.on('listening.end', (data: any) => {
      this.state.isListening = false
      this.emit('speech.end', { timestamp: data.timestamp, data })
    })

    this.fallbackService.on('transcription.final', (result: TranscriptionResult) => {
      this.state.lastTranscription = result
      this.emit('transcription', result)
    })

    this.fallbackService.on('transcription.interim', (result: TranscriptionResult) => {
      this.emit('transcription.interim', result)
    })

    this.fallbackService.on('speech.start', (data: any) => {
      this.state.isSpeaking = true
      this.emit('ai.speech.start', data)
    })

    this.fallbackService.on('speech.end', (data: any) => {
      this.state.isSpeaking = false
      this.emit('ai.speech.end', data)
    })

    this.fallbackService.on('error', (data: any) => {
      this.state.lastError = data.error
      this.emit('error', data)
    })
  }

  private setupVADEventHandlers(): void {
    if (!this.vadService) return

    this.vadService.on('speech.start', (data: any) => {
      this.emit('vad.speech.start', data)
    })

    this.vadService.on('speech.end', (data: any) => {
      this.emit('vad.speech.end', data)
    })

    this.vadService.on('vad.update', (result: VADResult) => {
      this.emit('vad.update', result)
    })
  }

  private async performCalibration(): Promise<void> {
    if (!this.vadService) return

    try {
      console.log('Starting voice calibration...')
      this.emit('calibration.start', { timestamp: Date.now() })
      
      await this.vadService.autoCalibrate()
      this.state.isCalibrated = true
      
      console.log('Voice calibration completed')
      this.emit('calibration.complete', this.vadService.getCalibration())
    } catch (error) {
      console.error('Calibration failed:', error)
      this.emit('calibration.error', { error })
    }
  }

  private async switchToFallback(): Promise<void> {
    if (!this.fallbackService || this.state.activeService === 'fallback') return

    console.log('Switching to fallback service')
    this.state.activeService = 'fallback'
    this.emit('service.switched', { from: 'realtime', to: 'fallback' })
  }

  // Public API methods
  async startListening(): Promise<void> {
    if (!this.state.isInitialized) {
      throw new Error('Service not initialized')
    }

    if (this.state.activeService === 'realtime' && this.realtimeService) {
      await this.realtimeService.startAudioCapture()
    } else if (this.state.activeService === 'fallback' && this.fallbackService) {
      await this.fallbackService.startListening()
    }

    if (this.vadService) {
      this.vadService.start()
    }
  }

  stopListening(): void {
    if (this.state.activeService === 'realtime' && this.realtimeService) {
      this.realtimeService.stopAudioCapture()
    } else if (this.state.activeService === 'fallback' && this.fallbackService) {
      this.fallbackService.stopListening()
    }

    if (this.vadService) {
      this.vadService.stop()
    }
  }

  async askQuestion(question: string, context: InterviewContext): Promise<void> {
    if (!this.state.isInitialized) {
      throw new Error('Service not initialized')
    }

    if (this.state.activeService === 'realtime' && this.realtimeService) {
      this.realtimeService.sendInterviewQuestion(question, context)
    } else if (this.state.activeService === 'fallback' && this.fallbackService) {
      await this.fallbackService.askQuestion(question)
    }
  }

  async speak(text: string): Promise<void> {
    if (this.state.activeService === 'fallback' && this.fallbackService) {
      await this.fallbackService.speak(text)
    }
  }

  stopSpeaking(): void {
    if (this.state.activeService === 'fallback' && this.fallbackService) {
      this.fallbackService.stopSpeaking()
    }
  }

  // Configuration methods
  async switchService(service: 'realtime' | 'fallback'): Promise<void> {
    if (service === 'realtime' && this.realtimeService) {
      this.state.activeService = 'realtime'
    } else if (service === 'fallback' && this.fallbackService) {
      this.state.activeService = 'fallback'
    } else {
      throw new Error(`Service ${service} not available`)
    }

    this.emit('service.switched', { to: service })
  }

  updateLanguage(language: string): void {
    this.config.realtimeConfig.language = language
    this.config.fallbackConfig.language = language

    if (this.fallbackService) {
      this.fallbackService.setLanguage(language)
    }
  }

  // State and capability methods
  getState(): VoiceInteractionState {
    return { ...this.state }
  }

  getCapabilities(): VoiceCapabilities {
    const fallbackLanguages = this.fallbackService?.getSupportedLanguages() || []
    
    return {
      realtimeAvailable: !!this.realtimeService,
      fallbackAvailable: !!this.fallbackService,
      vadAvailable: !!this.vadService,
      supportedLanguages: fallbackLanguages,
      recommendedService: this.realtimeService ? 'realtime' : 'fallback'
    }
  }

  isReady(): boolean {
    return this.state.isInitialized && this.state.activeService !== 'none'
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
        console.error(`Error in voice interaction event handler for ${event}:`, error)
      }
    })
  }

  // Cleanup
  async destroy(): Promise<void> {
    this.stopListening()

    if (this.realtimeService) {
      await this.realtimeService.disconnect()
      this.realtimeService = null
    }

    if (this.fallbackService) {
      this.fallbackService.destroy()
      this.fallbackService = null
    }

    if (this.vadService) {
      this.vadService.destroy()
      this.vadService = null
    }

    this.eventHandlers.clear()
    this.state.isInitialized = false
    this.state.activeService = 'none'
  }
}

export { 
  VoiceInteractionService, 
  type VoiceServiceConfig, 
  type VoiceInteractionState, 
  type VoiceCapabilities 
}
