/**
 * Web Speech API Fallback Service
 * Provides browser-native speech recognition and synthesis as fallback for OpenAI Realtime API
 */

// Type definitions for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

interface SpeechRecognitionConfig {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
}

interface SpeechSynthesisOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
  voiceName?: string
}

interface TranscriptionResult {
  text: string
  confidence: number
  isFinal: boolean
  timestamp: number
}

interface SpeechSynthesisResult {
  success: boolean
  duration?: number
  error?: string
}

// Extend Window interface for browser compatibility


class SpeechRecognitionFallback {
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis
  private isListening: boolean = false
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private eventHandlers: Map<string, Function[]> = new Map()
  private voices: SpeechSynthesisVoice[] = []
  private isInitialized: boolean = false

  constructor(private config: SpeechRecognitionConfig) {
    this.synthesis = window.speechSynthesis
    this.initializeVoices()
    this.initializeRecognition()
  }

  private async initializeVoices(): Promise<void> {
    // Wait for voices to be loaded
    if (this.synthesis.getVoices().length === 0) {
      await new Promise<void>((resolve) => {
        this.synthesis.onvoiceschanged = () => {
          this.voices = this.synthesis.getVoices()
          resolve()
        }
      })
    } else {
      this.voices = this.synthesis.getVoices()
    }
  }

  private initializeRecognition(): void {
    if (!this.isSupported()) {
      throw new Error('Speech recognition not supported in this browser')
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SpeechRecognition()

    // Configure recognition settings
    this.recognition.continuous = this.config.continuous
    this.recognition.interimResults = this.config.interimResults
    this.recognition.lang = this.config.language
    this.recognition.maxAlternatives = this.config.maxAlternatives

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isListening = true
      this.emit('listening.start', { timestamp: Date.now() })
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleSpeechResult(event)
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      this.emit('error', { 
        timestamp: Date.now(), 
        error: event.error,
        message: this.getErrorMessage(event.error)
      })
    }

    this.recognition.onend = () => {
      this.isListening = false
      this.emit('listening.end', { timestamp: Date.now() })
      
      // Auto-restart if continuous mode is enabled
      if (this.config.continuous && this.isListening) {
        setTimeout(() => {
          this.startListening()
        }, 100)
      }
    }

    this.isInitialized = true
  }

  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    let finalTranscript = ''
    let interimTranscript = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const transcript = result[0].transcript

      if (result.isFinal) {
        finalTranscript += transcript
      } else {
        interimTranscript += transcript
      }
    }

    if (finalTranscript) {
      const transcriptionResult: TranscriptionResult = {
        text: finalTranscript.trim(),
        confidence: event.results[event.results.length - 1][0].confidence || 0.9,
        isFinal: true,
        timestamp: Date.now()
      }
      
      this.emit('transcription.final', transcriptionResult)
    }

    if (interimTranscript) {
      const transcriptionResult: TranscriptionResult = {
        text: interimTranscript.trim(),
        confidence: 0.5,
        isFinal: false,
        timestamp: Date.now()
      }
      
      this.emit('transcription.interim', transcriptionResult)
    }
  }

  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech was detected. Please try speaking again.',
      'aborted': 'Speech recognition was aborted.',
      'audio-capture': 'Audio capture failed. Please check your microphone.',
      'network': 'Network error occurred. Please check your connection.',
      'not-allowed': 'Microphone access was denied. Please allow microphone access.',
      'service-not-allowed': 'Speech recognition service is not allowed.',
      'bad-grammar': 'Grammar error in speech recognition.',
      'language-not-supported': 'Language not supported for speech recognition.'
    }

    return errorMessages[error] || `Speech recognition error: ${error}`
  }

  async startListening(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not initialized')
    }

    if (this.isListening) {
      console.warn('Speech recognition already active')
      return
    }

    try {
      this.recognition.start()
    } catch (error) {
      console.error('Error starting speech recognition:', error)
      throw new Error('Failed to start speech recognition')
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  async speak(text: string, options: SpeechSynthesisOptions = {}): Promise<SpeechSynthesisResult> {
    return new Promise((resolve) => {
      if (this.currentUtterance) {
        this.synthesis.cancel()
      }

      this.currentUtterance = new SpeechSynthesisUtterance(text)
      
      // Configure voice options
      this.currentUtterance.lang = options.lang || this.config.language
      this.currentUtterance.rate = options.rate || 1.0
      this.currentUtterance.pitch = options.pitch || 1.0
      this.currentUtterance.volume = options.volume || 1.0

      // Select voice
      const selectedVoice = this.selectVoice(options.voiceName, this.currentUtterance.lang)
      if (selectedVoice) {
        this.currentUtterance.voice = selectedVoice
      }

      const startTime = Date.now()

      this.currentUtterance.onstart = () => {
        this.emit('speech.start', { timestamp: Date.now(), text })
      }

      this.currentUtterance.onend = () => {
        const duration = Date.now() - startTime
        this.currentUtterance = null
        this.emit('speech.end', { timestamp: Date.now(), text, duration })
        resolve({ success: true, duration })
      }

      this.currentUtterance.onerror = (event) => {
        const errorMessage = `Speech synthesis error: ${event.error}`
        console.error(errorMessage)
        this.currentUtterance = null
        this.emit('speech.error', { timestamp: Date.now(), error: event.error })
        resolve({ success: false, error: errorMessage })
      }

      this.synthesis.speak(this.currentUtterance)
    })
  }

  private selectVoice(voiceName?: string, language?: string): SpeechSynthesisVoice | null {
    if (!this.voices.length) return null

    // Try to find exact voice name match
    if (voiceName) {
      const exactMatch = this.voices.find(voice => 
        voice.name.toLowerCase().includes(voiceName.toLowerCase())
      )
      if (exactMatch) return exactMatch
    }

    // Try to find language match
    if (language) {
      const languageCode = language.split('-')[0]
      const languageMatch = this.voices.find(voice => 
        voice.lang.startsWith(languageCode)
      )
      if (languageMatch) return languageMatch
    }

    // Return default voice
    return this.voices[0] || null
  }

  stopSpeaking(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel()
      this.currentUtterance = null
    }
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  getVoicesByLanguage(language: string): SpeechSynthesisVoice[] {
    const languageCode = language.split('-')[0]
    return this.voices.filter(voice => voice.lang.startsWith(languageCode))
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window && 
           ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }

  isSpeaking(): boolean {
    return this.synthesis.speaking
  }

  isCurrentlyListening(): boolean {
    return this.isListening
  }

  // Configuration methods
  updateConfig(newConfig: Partial<SpeechRecognitionConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    if (this.recognition) {
      this.recognition.continuous = this.config.continuous
      this.recognition.interimResults = this.config.interimResults
      this.recognition.lang = this.config.language
      this.recognition.maxAlternatives = this.config.maxAlternatives
    }
  }

  getConfig(): SpeechRecognitionConfig {
    return { ...this.config }
  }

  // Language support methods
  getSupportedLanguages(): string[] {
    const languages = new Set<string>()
    this.voices.forEach(voice => {
      languages.add(voice.lang)
    })
    return Array.from(languages).sort()
  }

  setLanguage(language: string): void {
    this.config.language = language
    if (this.recognition) {
      this.recognition.lang = language
    }
  }

  // Event handling methods
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
        console.error(`Error in event handler for ${event}:`, error)
      }
    })
  }

  // Cleanup methods
  destroy(): void {
    this.stopListening()
    this.stopSpeaking()
    
    if (this.recognition) {
      this.recognition.onstart = null
      this.recognition.onresult = null
      this.recognition.onerror = null
      this.recognition.onend = null
      this.recognition = null
    }

    this.eventHandlers.clear()
    this.isInitialized = false
  }

  // Utility methods for interview context
  async askQuestion(question: string, options?: SpeechSynthesisOptions): Promise<SpeechSynthesisResult> {
    // Stop any current listening
    this.stopListening()
    
    // Speak the question
    const result = await this.speak(question, options)
    
    // Start listening for response after a brief pause
    if (result.success) {
      setTimeout(() => {
        this.startListening()
      }, 500)
    }
    
    return result
  }

  async waitForResponse(timeoutMs: number = 30000): Promise<TranscriptionResult | null> {
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout
      
      const handleFinalTranscription = (result: TranscriptionResult) => {
        clearTimeout(timeoutId)
        this.off('transcription.final', handleFinalTranscription)
        resolve(result)
      }

      this.on('transcription.final', handleFinalTranscription)
      
      timeoutId = setTimeout(() => {
        this.off('transcription.final', handleFinalTranscription)
        resolve(null)
      }, timeoutMs)
    })
  }
}

export { 
  SpeechRecognitionFallback, 
  type SpeechRecognitionConfig, 
  type SpeechSynthesisOptions,
  type TranscriptionResult,
  type SpeechSynthesisResult
}
