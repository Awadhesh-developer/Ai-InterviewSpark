/**
 * OpenAI Realtime Speech Service
 * Provides real-time speech-to-speech conversation capabilities using OpenAI's Realtime API
 */

interface RealtimeConfig {
  model: 'gpt-4o-realtime-preview' | 'gpt-4o-mini-realtime-preview'
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  language: string
  temperature: number
  maxTokens: number
  instructions?: string
}

interface SpeechEvent {
  type: 'speech.start' | 'speech.end' | 'transcription' | 'response' | 'response.text' | 'response.complete' | 'error' | 'connected' | 'disconnected'
  timestamp: number
  data: any
  confidence?: number
}

interface InterviewContext {
  sessionId: string
  questionNumber: number
  questionType: 'behavioral' | 'technical' | 'situational'
  candidateName?: string
  role?: string
  company?: string
}

class RealtimeSpeechService {
  private ws: WebSocket | null = null
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private processor: ScriptProcessorNode | null = null
  private isConnected: boolean = false
  private isRecording: boolean = false
  private eventHandlers: Map<string, Function[]> = new Map()
  private audioQueue: AudioBuffer[] = []
  private isPlaying: boolean = false

  constructor(private config: RealtimeConfig) {
    this.initializeAudioContext()
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
      throw new Error('Audio context initialization failed')
    }
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      console.warn('Already connected to Realtime API')
      return
    }

    try {
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${this.config.model}`
      
      this.ws = new WebSocket(wsUrl)
      
      // Set up WebSocket event handlers
      this.ws.onopen = () => {
        console.log('Connected to OpenAI Realtime API')
        this.isConnected = true
        this.sendSessionConfig()
        this.emit('connected', {
          type: 'connected',
          timestamp: Date.now(),
          data: {}
        })
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleRealtimeEvent(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('Disconnected from OpenAI Realtime API:', event.code, event.reason)
        this.isConnected = false
        this.emit('disconnected', {
          type: 'disconnected',
          timestamp: Date.now(),
          data: { code: event.code, reason: event.reason }
        })
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', {
          type: 'error',
          timestamp: Date.now(),
          data: { error: 'WebSocket connection error' }
        })
      }

      // Wait for connection to be established
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 10000)

        this.on('connected', () => {
          clearTimeout(timeout)
          resolve(void 0)
        })

        this.on('error', (data) => {
          clearTimeout(timeout)
          reject(new Error(data.error))
        })
      })

    } catch (error) {
      console.error('Failed to connect to Realtime API:', error)
      throw error
    }
  }

  private sendSessionConfig(): void {
    if (!this.ws || !this.isConnected) return

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.config.instructions || this.buildDefaultInstructions(),
        voice: this.config.voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        tools: [],
        tool_choice: 'auto',
        temperature: this.config.temperature,
        max_response_output_tokens: this.config.maxTokens
      }
    }

    this.ws.send(JSON.stringify(sessionConfig))
  }

  private buildDefaultInstructions(): string {
    return `You are an experienced interview coach conducting a professional job interview. 

Your role:
- Ask questions naturally and conversationally
- Listen actively to responses
- Ask relevant follow-up questions based on answers
- Maintain a professional but friendly tone
- Provide brief acknowledgments between questions
- Adapt your questioning style based on the candidate's responses

Guidelines:
- Keep questions clear and concise
- Allow natural pauses for thinking
- Show engagement through verbal cues
- Ask for clarification when needed
- Build on previous answers naturally

Remember: You're evaluating the candidate's skills, experience, and cultural fit while creating a positive interview experience.`
  }

  async startAudioCapture(): Promise<void> {
    if (this.isRecording) {
      console.warn('Audio capture already started')
      return
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      if (!this.audioContext) {
        await this.initializeAudioContext()
      }

      const source = this.audioContext!.createMediaStreamSource(this.mediaStream)
      this.processor = this.audioContext!.createScriptProcessor(4096, 1, 1)

      this.processor.onaudioprocess = (event) => {
        if (this.isConnected && this.ws && this.isRecording) {
          const inputBuffer = event.inputBuffer.getChannelData(0)
          const pcm16Buffer = this.convertToPCM16(inputBuffer)
          
          const audioEvent = {
            type: 'input_audio_buffer.append',
            audio: this.arrayBufferToBase64(pcm16Buffer)
          }
          
          this.ws.send(JSON.stringify(audioEvent))
        }
      }

      source.connect(this.processor)
      this.processor.connect(this.audioContext!.destination)

      this.isRecording = true
      console.log('Audio capture started')

    } catch (error) {
      console.error('Error starting audio capture:', error)
      throw new Error('Failed to start audio capture')
    }
  }

  stopAudioCapture(): void {
    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    this.isRecording = false
    console.log('Audio capture stopped')
  }

  private convertToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2)
    const view = new DataView(buffer)
    
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]))
      view.setInt16(i * 2, sample * 0x7FFF, true)
    }
    
    return buffer
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  private handleRealtimeEvent(event: any): void {
    const timestamp = Date.now()

    switch (event.type) {
      case 'input_audio_buffer.speech_started':
        this.emit('speech.start', { type: 'speech.start', timestamp, data: event })
        break
      
      case 'input_audio_buffer.speech_stopped':
        this.emit('speech.end', { type: 'speech.end', timestamp, data: event })
        break
      
      case 'conversation.item.input_audio_transcription.completed':
        this.emit('transcription', {
          type: 'transcription',
          timestamp,
          data: {
            text: event.transcript,
            confidence: event.confidence || 1.0
          }
        })
        break
      
      case 'response.audio.delta':
        this.playAudioDelta(event.delta)
        break
      
      case 'response.text.delta':
        this.emit('response.text', { type: 'response.text', timestamp, data: event.delta })
        break
      
      case 'response.done':
        this.emit('response.complete', { type: 'response.complete', timestamp, data: event.response })
        break

      case 'error':
        console.error('Realtime API error:', event.error)
        this.emit('error', { type: 'error', timestamp, data: event.error })
        break
    }
  }

  private async playAudioDelta(base64Audio: string): Promise<void> {
    if (!this.audioContext) return

    try {
      const audioData = this.base64ToArrayBuffer(base64Audio)
      const audioBuffer = await this.audioContext.decodeAudioData(audioData)
      
      // Add to queue for sequential playback
      this.audioQueue.push(audioBuffer)
      
      if (!this.isPlaying) {
        this.playNextAudio()
      }
      
    } catch (error) {
      console.error('Error playing audio delta:', error)
    }
  }

  private playNextAudio(): void {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false
      return
    }

    this.isPlaying = true
    const audioBuffer = this.audioQueue.shift()!
    
    const source = this.audioContext!.createBufferSource()
    source.buffer = audioBuffer
    source.connect(this.audioContext!.destination)
    
    source.onended = () => {
      this.playNextAudio()
    }
    
    source.start()
  }

  sendInterviewQuestion(question: string, context: InterviewContext): void {
    if (!this.ws || !this.isConnected) {
      console.error('Cannot send question: not connected to Realtime API')
      return
    }

    const questionEvent = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'input_text',
            text: this.formatInterviewQuestion(question, context)
          }
        ]
      }
    }

    this.ws.send(JSON.stringify(questionEvent))
    
    // Trigger response generation
    const responseEvent = {
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
        instructions: 'Ask the interview question naturally and wait for the candidate\'s response.'
      }
    }

    this.ws.send(JSON.stringify(responseEvent))
  }

  private formatInterviewQuestion(question: string, context: InterviewContext): string {
    const contextualIntro = this.generateContextualIntro(context)
    return `${contextualIntro} ${question}`
  }

  private generateContextualIntro(context: InterviewContext): string {
    const intros = [
      "Great, let's move on to the next question.",
      "Thank you for that response. Now I'd like to ask you about",
      "That's interesting. Building on that,",
      "Perfect. Let's explore another area.",
      "Excellent. Now let's discuss"
    ]
    
    return intros[Math.floor(Math.random() * intros.length)]
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

  private emit(event: string, data: SpeechEvent): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error)
      }
    })
  }

  async disconnect(): Promise<void> {
    this.stopAudioCapture()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.isConnected = false
    this.audioQueue = []
    this.isPlaying = false
    
    console.log('Disconnected from Realtime Speech Service')
  }

  // Utility methods
  isServiceConnected(): boolean {
    return this.isConnected
  }

  isServiceRecording(): boolean {
    return this.isRecording
  }

  getConfig(): RealtimeConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    if (this.isConnected) {
      this.sendSessionConfig()
    }
  }
}

export { RealtimeSpeechService, type RealtimeConfig, type SpeechEvent, type InterviewContext }
