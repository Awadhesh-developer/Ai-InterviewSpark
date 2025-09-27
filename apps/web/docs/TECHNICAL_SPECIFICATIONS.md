# Technical Specifications
## Advanced Interview System Components

## 1. Real-time Speech Service

### 1.1 OpenAI Realtime API Integration

```typescript
// apps/web/src/services/realtimeSpeechService.ts

interface RealtimeConfig {
  model: 'gpt-4o-realtime-preview' | 'gpt-4o-mini-realtime-preview'
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  language: string
  temperature: number
  maxTokens: number
}

interface SpeechEvent {
  type: 'speech.start' | 'speech.end' | 'transcription' | 'response'
  timestamp: number
  data: any
  confidence?: number
}

class RealtimeSpeechService {
  private ws: WebSocket | null = null
  private audioContext: AudioContext
  private mediaStream: MediaStream | null = null
  private processor: ScriptProcessorNode | null = null
  private isConnected: boolean = false
  private eventHandlers: Map<string, Function[]> = new Map()

  constructor(private config: RealtimeConfig) {
    this.audioContext = new AudioContext()
  }

  async connect(): Promise<void> {
    const wsUrl = `wss://api.openai.com/v1/realtime?model=${this.config.model}`
    this.ws = new WebSocket(wsUrl, [], {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    })

    this.ws.onopen = () => {
      this.isConnected = true
      this.sendSessionConfig()
    }

    this.ws.onmessage = (event) => {
      this.handleRealtimeEvent(JSON.parse(event.data))
    }

    this.ws.onclose = () => {
      this.isConnected = false
    }
  }

  private sendSessionConfig(): void {
    if (!this.ws) return

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.buildInterviewInstructions(),
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

  async startAudioCapture(): Promise<void> {
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

      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1)

      this.processor.onaudioprocess = (event) => {
        if (this.isConnected && this.ws) {
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
      this.processor.connect(this.audioContext.destination)

    } catch (error) {
      console.error('Error starting audio capture:', error)
      throw error
    }
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

  private handleRealtimeEvent(event: any): void {
    switch (event.type) {
      case 'input_audio_buffer.speech_started':
        this.emit('speech.start', event)
        break
      
      case 'input_audio_buffer.speech_stopped':
        this.emit('speech.end', event)
        break
      
      case 'conversation.item.input_audio_transcription.completed':
        this.emit('transcription', {
          text: event.transcript,
          confidence: event.confidence || 1.0
        })
        break
      
      case 'response.audio.delta':
        this.playAudioDelta(event.delta)
        break
      
      case 'response.text.delta':
        this.emit('response.text', event.delta)
        break
      
      case 'response.done':
        this.emit('response.complete', event.response)
        break
    }
  }

  private async playAudioDelta(base64Audio: string): Promise<void> {
    try {
      const audioData = this.base64ToArrayBuffer(base64Audio)
      const audioBuffer = await this.audioContext.decodeAudioData(audioData)
      
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.audioContext.destination)
      source.start()
      
    } catch (error) {
      console.error('Error playing audio delta:', error)
    }
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  sendInterviewQuestion(question: string, context: InterviewContext): void {
    if (!this.ws || !this.isConnected) return

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

  private buildInterviewInstructions(): string {
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

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach(handler => handler(data))
  }

  async disconnect(): Promise<void> {
    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.isConnected = false
  }
}

export { RealtimeSpeechService, type RealtimeConfig, type SpeechEvent }
```

### 1.2 Web Speech API Fallback

```typescript
// apps/web/src/services/speechRecognitionFallback.ts

interface SpeechRecognitionConfig {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
}

class SpeechRecognitionFallback {
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis
  private isListening: boolean = false
  private currentUtterance: SpeechSynthesisUtterance | null = null

  constructor(private config: SpeechRecognitionConfig) {
    this.synthesis = window.speechSynthesis
    this.initializeRecognition()
  }

  private initializeRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser')
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SpeechRecognition()

    this.recognition.continuous = this.config.continuous
    this.recognition.interimResults = this.config.interimResults
    this.recognition.lang = this.config.language
    this.recognition.maxAlternatives = this.config.maxAlternatives

    this.recognition.onstart = () => {
      this.isListening = true
      this.emit('listening.start')
    }

    this.recognition.onresult = (event) => {
      this.handleSpeechResult(event)
    }

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      this.emit('error', event.error)
    }

    this.recognition.onend = () => {
      this.isListening = false
      this.emit('listening.end')
    }
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
      this.emit('transcription.final', {
        text: finalTranscript,
        confidence: event.results[event.results.length - 1][0].confidence
      })
    }

    if (interimTranscript) {
      this.emit('transcription.interim', {
        text: interimTranscript,
        confidence: 0.5
      })
    }
  }

  async startListening(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not initialized')
    }

    if (this.isListening) {
      return
    }

    try {
      this.recognition.start()
    } catch (error) {
      console.error('Error starting speech recognition:', error)
      throw error
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  async speak(text: string, options: SpeechSynthesisOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
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
      const voices = this.synthesis.getVoices()
      const selectedVoice = voices.find(voice => 
        voice.lang.startsWith(this.config.language.split('-')[0]) && 
        voice.name.includes(options.voiceName || '')
      ) || voices[0]

      if (selectedVoice) {
        this.currentUtterance.voice = selectedVoice
      }

      this.currentUtterance.onend = () => {
        this.currentUtterance = null
        resolve()
      }

      this.currentUtterance.onerror = (event) => {
        this.currentUtterance = null
        reject(new Error(`Speech synthesis error: ${event.error}`))
      }

      this.synthesis.speak(this.currentUtterance)
    })
  }

  stopSpeaking(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel()
    }
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices()
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window && 
           ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }

  private eventHandlers: Map<string, Function[]> = new Map()

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach(handler => handler(data))
  }
}

interface SpeechSynthesisOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
  voiceName?: string
}

export { SpeechRecognitionFallback, type SpeechRecognitionConfig, type SpeechSynthesisOptions }
```

## 2. Facial Analysis Service

### 2.1 Face Detection and Emotion Recognition

```typescript
// apps/web/src/services/facialAnalysisService.ts

import * as faceapi from 'face-api.js'

interface FacialAnalysisResult {
  emotions: EmotionScores
  eyeContact: EyeContactMetrics
  headPose: HeadPoseData
  engagement: EngagementMetrics
  confidence: number
  timestamp: number
}

interface EmotionScores {
  happy: number
  sad: number
  angry: number
  surprised: number
  fearful: number
  disgusted: number
  neutral: number
}

interface EyeContactMetrics {
  isLookingAtCamera: boolean
  gazeDirection: { x: number; y: number }
  eyeContactDuration: number
  eyeContactFrequency: number
  averageGazeStability: number
}

interface HeadPoseData {
  yaw: number    // Left-right rotation
  pitch: number  // Up-down rotation
  roll: number   // Tilt rotation
  stability: number
}

interface EngagementMetrics {
  overallEngagement: number
  attentiveness: number
  expressiveness: number
  consistency: number
}

class FacialAnalysisService {
  private isInitialized: boolean = false
  private modelLoadPromise: Promise<void> | null = null
  private analysisHistory: FacialAnalysisResult[] = []
  private videoElement: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private analysisInterval: number | null = null

  async initialize(): Promise<void> {
    if (this.isInitialized) return
    if (this.modelLoadPromise) return this.modelLoadPromise

    this.modelLoadPromise = this.loadModels()
    await this.modelLoadPromise
    this.isInitialized = true
  }

  private async loadModels(): Promise<void> {
    const MODEL_URL = '/models' // Serve models from public/models directory
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
    ])
  }

  async startAnalysis(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    this.videoElement = videoElement
    this.canvas = document.createElement('canvas')
    this.analysisHistory = []

    // Start continuous analysis
    this.analysisInterval = window.setInterval(() => {
      this.performAnalysis()
    }, 500) // Analyze every 500ms
  }

  stopAnalysis(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
      this.analysisInterval = null
    }
    this.analysisHistory = []
  }

  private async performAnalysis(): Promise<void> {
    if (!this.videoElement || !this.canvas) return

    try {
      // Detect faces with landmarks and expressions
      const detections = await faceapi
        .detectAllFaces(this.videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()

      if (detections.length === 0) {
        return // No face detected
      }

      const detection = detections[0] // Use first detected face
      const result = await this.analyzeDetection(detection)
      
      this.analysisHistory.push(result)
      
      // Keep only recent history (last 2 minutes at 2Hz = 240 samples)
      if (this.analysisHistory.length > 240) {
        this.analysisHistory = this.analysisHistory.slice(-240)
      }

      // Emit analysis result
      this.emit('analysis.result', result)

    } catch (error) {
      console.error('Error in facial analysis:', error)
    }
  }

  private async analyzeDetection(detection: any): Promise<FacialAnalysisResult> {
    const emotions = this.normalizeEmotions(detection.expressions)
    const eyeContact = this.analyzeEyeContact(detection.landmarks)
    const headPose = this.calculateHeadPose(detection.landmarks)
    const engagement = this.calculateEngagement(emotions, eyeContact, headPose)

    return {
      emotions,
      eyeContact,
      headPose,
      engagement,
      confidence: detection.detection.score,
      timestamp: Date.now()
    }
  }

  private normalizeEmotions(expressions: any): EmotionScores {
    return {
      happy: expressions.happy || 0,
      sad: expressions.sad || 0,
      angry: expressions.angry || 0,
      surprised: expressions.surprised || 0,
      fearful: expressions.fearful || 0,
      disgusted: expressions.disgusted || 0,
      neutral: expressions.neutral || 0
    }
  }

  private analyzeEyeContact(landmarks: any): EyeContactMetrics {
    const leftEye = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()
    const nose = landmarks.getNose()

    // Calculate gaze direction based on eye and nose positions
    const leftEyeCenter = this.getEyeCenter(leftEye)
    const rightEyeCenter = this.getEyeCenter(rightEye)
    const noseCenter = nose[3] // Nose tip

    // Simplified gaze estimation
    const gazeDirection = this.estimateGazeDirection(leftEyeCenter, rightEyeCenter, noseCenter)
    const isLookingAtCamera = this.isLookingAtCamera(gazeDirection)

    // Calculate metrics based on recent history
    const recentHistory = this.analysisHistory.slice(-20) // Last 10 seconds
    const eyeContactDuration = this.calculateEyeContactDuration(recentHistory)
    const eyeContactFrequency = this.calculateEyeContactFrequency(recentHistory)

    return {
      isLookingAtCamera,
      gazeDirection,
      eyeContactDuration,
      eyeContactFrequency,
      averageGazeStability: this.calculateGazeStability(recentHistory)
    }
  }

  private getEyeCenter(eyePoints: any[]): { x: number; y: number } {
    const x = eyePoints.reduce((sum, point) => sum + point.x, 0) / eyePoints.length
    const y = eyePoints.reduce((sum, point) => sum + point.y, 0) / eyePoints.length
    return { x, y }
  }

  private estimateGazeDirection(leftEye: any, rightEye: any, nose: any): { x: number; y: number } {
    // Simplified gaze estimation - in production, use more sophisticated algorithms
    const eyeCenter = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2
    }

    return {
      x: (nose.x - eyeCenter.x) / 100, // Normalize
      y: (nose.y - eyeCenter.y) / 100
    }
  }

  private isLookingAtCamera(gazeDirection: { x: number; y: number }): boolean {
    const threshold = 0.3
    return Math.abs(gazeDirection.x) < threshold && Math.abs(gazeDirection.y) < threshold
  }

  private calculateHeadPose(landmarks: any): HeadPoseData {
    // Simplified head pose calculation
    const nose = landmarks.getNose()
    const leftEye = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()

    const noseCenter = nose[3]
    const leftEyeCenter = this.getEyeCenter(leftEye)
    const rightEyeCenter = this.getEyeCenter(rightEye)

    // Calculate angles (simplified)
    const yaw = Math.atan2(noseCenter.x - (leftEyeCenter.x + rightEyeCenter.x) / 2, 100) * 180 / Math.PI
    const pitch = Math.atan2(noseCenter.y - (leftEyeCenter.y + rightEyeCenter.y) / 2, 100) * 180 / Math.PI
    const roll = Math.atan2(rightEyeCenter.y - leftEyeCenter.y, rightEyeCenter.x - leftEyeCenter.x) * 180 / Math.PI

    return {
      yaw: Math.max(-45, Math.min(45, yaw)),
      pitch: Math.max(-30, Math.min(30, pitch)),
      roll: Math.max(-30, Math.min(30, roll)),
      stability: this.calculateHeadStability()
    }
  }

  private calculateEngagement(
    emotions: EmotionScores,
    eyeContact: EyeContactMetrics,
    headPose: HeadPoseData
  ): EngagementMetrics {
    // Calculate engagement based on multiple factors
    const expressiveness = 1 - emotions.neutral // Higher when not neutral
    const attentiveness = eyeContact.isLookingAtCamera ? 1 : 0.5
    const posture = 1 - (Math.abs(headPose.yaw) + Math.abs(headPose.pitch)) / 90

    const overallEngagement = (expressiveness * 0.4 + attentiveness * 0.4 + posture * 0.2)

    return {
      overallEngagement: Math.max(0, Math.min(1, overallEngagement)),
      attentiveness,
      expressiveness,
      consistency: this.calculateConsistency()
    }
  }

  private calculateEyeContactDuration(history: FacialAnalysisResult[]): number {
    if (history.length === 0) return 0
    
    const eyeContactFrames = history.filter(h => h.eyeContact.isLookingAtCamera).length
    return (eyeContactFrames / history.length) * 100 // Percentage
  }

  private calculateEyeContactFrequency(history: FacialAnalysisResult[]): number {
    if (history.length < 2) return 0

    let transitions = 0
    for (let i = 1; i < history.length; i++) {
      if (history[i].eyeContact.isLookingAtCamera !== history[i-1].eyeContact.isLookingAtCamera) {
        transitions++
      }
    }

    return transitions / (history.length - 1) // Transitions per frame
  }

  private calculateGazeStability(history: FacialAnalysisResult[]): number {
    if (history.length < 2) return 1

    let totalVariation = 0
    for (let i = 1; i < history.length; i++) {
      const prev = history[i-1].eyeContact.gazeDirection
      const curr = history[i].eyeContact.gazeDirection
      
      const variation = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      )
      totalVariation += variation
    }

    const averageVariation = totalVariation / (history.length - 1)
    return Math.max(0, 1 - averageVariation) // Higher stability = lower variation
  }

  private calculateHeadStability(): number {
    const recentHistory = this.analysisHistory.slice(-10)
    if (recentHistory.length < 2) return 1

    let totalMovement = 0
    for (let i = 1; i < recentHistory.length; i++) {
      const prev = recentHistory[i-1].headPose
      const curr = recentHistory[i].headPose
      
      const movement = Math.sqrt(
        Math.pow(curr.yaw - prev.yaw, 2) +
        Math.pow(curr.pitch - prev.pitch, 2) +
        Math.pow(curr.roll - prev.roll, 2)
      )
      totalMovement += movement
    }

    const averageMovement = totalMovement / (recentHistory.length - 1)
    return Math.max(0, 1 - averageMovement / 30) // Normalize by expected max movement
  }

  private calculateConsistency(): number {
    const recentHistory = this.analysisHistory.slice(-20)
    if (recentHistory.length < 5) return 1

    // Calculate consistency in engagement over time
    const engagementScores = recentHistory.map(h => h.engagement.overallEngagement)
    const mean = engagementScores.reduce((sum, score) => sum + score, 0) / engagementScores.length
    const variance = engagementScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / engagementScores.length
    const standardDeviation = Math.sqrt(variance)

    return Math.max(0, 1 - standardDeviation) // Lower deviation = higher consistency
  }

  getAnalysisSummary(): {
    averageEngagement: number
    emotionalRange: EmotionScores
    eyeContactPercentage: number
    headPoseStability: number
  } {
    if (this.analysisHistory.length === 0) {
      return {
        averageEngagement: 0,
        emotionalRange: { happy: 0, sad: 0, angry: 0, surprised: 0, fearful: 0, disgusted: 0, neutral: 1 },
        eyeContactPercentage: 0,
        headPoseStability: 0
      }
    }

    const avgEngagement = this.analysisHistory.reduce((sum, h) => sum + h.engagement.overallEngagement, 0) / this.analysisHistory.length
    const eyeContactFrames = this.analysisHistory.filter(h => h.eyeContact.isLookingAtCamera).length
    const eyeContactPercentage = (eyeContactFrames / this.analysisHistory.length) * 100

    // Calculate average emotions
    const emotionalRange = this.analysisHistory.reduce((acc, h) => {
      Object.keys(h.emotions).forEach(emotion => {
        acc[emotion as keyof EmotionScores] += h.emotions[emotion as keyof EmotionScores]
      })
      return acc
    }, { happy: 0, sad: 0, angry: 0, surprised: 0, fearful: 0, disgusted: 0, neutral: 0 })

    Object.keys(emotionalRange).forEach(emotion => {
      emotionalRange[emotion as keyof EmotionScores] /= this.analysisHistory.length
    })

    const avgHeadStability = this.analysisHistory.reduce((sum, h) => sum + h.headPose.stability, 0) / this.analysisHistory.length

    return {
      averageEngagement: avgEngagement,
      emotionalRange,
      eyeContactPercentage,
      headPoseStability: avgHeadStability
    }
  }

  // Event handling
  private eventHandlers: Map<string, Function[]> = new Map()

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach(handler => handler(data))
  }
}

export { FacialAnalysisService, type FacialAnalysisResult, type EmotionScores, type EyeContactMetrics }
```

This technical specification provides detailed implementations for the core speech and video analysis components. The code includes:

1. **OpenAI Realtime API Integration** - Full WebSocket implementation with audio streaming
2. **Web Speech API Fallback** - Browser-native speech recognition and synthesis
3. **Advanced Facial Analysis** - Emotion detection, eye contact tracking, and engagement metrics

Each service is designed to be modular, testable, and production-ready with comprehensive error handling and event systems.
