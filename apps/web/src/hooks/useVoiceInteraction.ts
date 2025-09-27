/**
 * React Hook for Voice Interaction
 * Provides easy integration of voice services with React components
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { VoiceInteractionService, type VoiceServiceConfig, type VoiceInteractionState, type VoiceCapabilities } from '@/services/voiceInteractionService'
import { type TranscriptionResult } from '@/services/speechRecognitionFallback'
import { type InterviewContext } from '@/services/realtimeSpeechService'
import { type VADResult } from '@/services/voiceActivityDetection'

interface UseVoiceInteractionOptions {
  autoInitialize?: boolean
  autoCalibrate?: boolean
  language?: string
  preferredService?: 'realtime' | 'fallback' | 'auto'
}

interface VoiceInteractionHookState {
  isInitialized: boolean
  isInitializing: boolean
  isListening: boolean
  isSpeaking: boolean
  isCalibrated: boolean
  activeService: 'realtime' | 'fallback' | 'none'
  capabilities: VoiceCapabilities | null
  lastTranscription: TranscriptionResult | null
  lastError: string | null
  vadResult: VADResult | null
}

interface VoiceInteractionActions {
  initialize: () => Promise<void>
  startListening: () => Promise<void>
  stopListening: () => void
  askQuestion: (question: string, context: InterviewContext) => Promise<void>
  speak: (text: string) => Promise<void>
  stopSpeaking: () => void
  switchService: (service: 'realtime' | 'fallback') => Promise<void>
  updateLanguage: (language: string) => void
  calibrate: () => Promise<void>
  destroy: () => Promise<void>
}

const DEFAULT_CONFIG: VoiceServiceConfig = {
  preferredService: 'auto',
  realtimeConfig: {
    model: 'gpt-4o-realtime-preview',
    voice: 'alloy',
    language: 'en-US',
    temperature: 0.7,
    maxTokens: 1000
  },
  fallbackConfig: {
    language: 'en-US',
    continuous: true,
    interimResults: true,
    maxAlternatives: 1
  },
  vadConfig: {
    sampleRate: 44100,
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    energyThreshold: 0.01,
    frequencyThreshold: 0.1,
    silenceDuration: 500,
    speechDuration: 100
  },
  autoFallback: true,
  calibrationRequired: false
}

export function useVoiceInteraction(options: UseVoiceInteractionOptions = {}): [VoiceInteractionHookState, VoiceInteractionActions] {
  const {
    autoInitialize = false,
    autoCalibrate = false,
    language = 'en-US',
    preferredService = 'auto'
  } = options

  const serviceRef = useRef<VoiceInteractionService | null>(null)
  const [state, setState] = useState<VoiceInteractionHookState>({
    isInitialized: false,
    isInitializing: false,
    isListening: false,
    isSpeaking: false,
    isCalibrated: false,
    activeService: 'none',
    capabilities: null,
    lastTranscription: null,
    lastError: null,
    vadResult: null
  })

  // Initialize service configuration
  const getConfig = useCallback((): VoiceServiceConfig => {
    return {
      ...DEFAULT_CONFIG,
      preferredService,
      calibrationRequired: autoCalibrate,
      realtimeConfig: {
        ...DEFAULT_CONFIG.realtimeConfig,
        language
      },
      fallbackConfig: {
        ...DEFAULT_CONFIG.fallbackConfig,
        language
      }
    }
  }, [preferredService, language, autoCalibrate])

  // Initialize voice service
  const initialize = useCallback(async () => {
    if (serviceRef.current || state.isInitializing) {
      return
    }

    setState(prev => ({ ...prev, isInitializing: true, lastError: null }))

    try {
      const config = getConfig()
      serviceRef.current = new VoiceInteractionService(config)
      
      // Set up event handlers
      setupEventHandlers(serviceRef.current)
      
      // Initialize the service
      const capabilities = await serviceRef.current.initialize()
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isInitializing: false,
        capabilities,
        activeService: capabilities.realtimeAvailable ? 'realtime' : 'fallback',
        isCalibrated: !autoCalibrate
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Initialization failed'
      setState(prev => ({
        ...prev,
        isInitializing: false,
        lastError: errorMessage
      }))
      throw error
    }
  }, [getConfig, autoCalibrate, state.isInitializing])

  // Set up event handlers
  const setupEventHandlers = useCallback((service: VoiceInteractionService) => {
    service.on('speech.start', () => {
      setState(prev => ({ ...prev, isListening: true }))
    })

    service.on('speech.end', () => {
      setState(prev => ({ ...prev, isListening: false }))
    })

    service.on('transcription', (result: TranscriptionResult) => {
      setState(prev => ({ ...prev, lastTranscription: result }))
    })

    service.on('ai.speech.start', () => {
      setState(prev => ({ ...prev, isSpeaking: true }))
    })

    service.on('ai.speech.end', () => {
      setState(prev => ({ ...prev, isSpeaking: false }))
    })

    service.on('vad.update', (result: VADResult) => {
      setState(prev => ({ ...prev, vadResult: result }))
    })

    service.on('error', (data: any) => {
      setState(prev => ({ ...prev, lastError: data.error || 'Unknown error' }))
    })

    service.on('service.switched', (data: any) => {
      setState(prev => ({ ...prev, activeService: data.to }))
    })

    service.on('calibration.complete', () => {
      setState(prev => ({ ...prev, isCalibrated: true }))
    })
  }, [])

  // Voice interaction actions
  const startListening = useCallback(async () => {
    if (!serviceRef.current) {
      throw new Error('Voice service not initialized')
    }
    await serviceRef.current.startListening()
  }, [])

  const stopListening = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stopListening()
    }
  }, [])

  const askQuestion = useCallback(async (question: string, context: InterviewContext) => {
    if (!serviceRef.current) {
      throw new Error('Voice service not initialized')
    }
    await serviceRef.current.askQuestion(question, context)
  }, [])

  const speak = useCallback(async (text: string) => {
    if (!serviceRef.current) {
      throw new Error('Voice service not initialized')
    }
    await serviceRef.current.speak(text)
  }, [])

  const stopSpeaking = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stopSpeaking()
    }
  }, [])

  const switchService = useCallback(async (service: 'realtime' | 'fallback') => {
    if (!serviceRef.current) {
      throw new Error('Voice service not initialized')
    }
    await serviceRef.current.switchService(service)
  }, [])

  const updateLanguage = useCallback((newLanguage: string) => {
    if (serviceRef.current) {
      serviceRef.current.updateLanguage(newLanguage)
    }
  }, [])

  const calibrate = useCallback(async () => {
    if (!serviceRef.current) {
      throw new Error('Voice service not initialized')
    }
    
    setState(prev => ({ ...prev, isCalibrated: false }))
    
    // Trigger calibration through the service
    // This would need to be implemented in the service
    // For now, we'll simulate it
    setTimeout(() => {
      setState(prev => ({ ...prev, isCalibrated: true }))
    }, 3000)
  }, [])

  const destroy = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.destroy()
      serviceRef.current = null
    }
    
    setState({
      isInitialized: false,
      isInitializing: false,
      isListening: false,
      isSpeaking: false,
      isCalibrated: false,
      activeService: 'none',
      capabilities: null,
      lastTranscription: null,
      lastError: null,
      vadResult: null
    })
  }, [])

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize && !state.isInitialized && !state.isInitializing) {
      initialize().catch(console.error)
    }
  }, [autoInitialize, initialize, state.isInitialized, state.isInitializing])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.destroy().catch(console.error)
      }
    }
  }, [])

  const actions: VoiceInteractionActions = {
    initialize,
    startListening,
    stopListening,
    askQuestion,
    speak,
    stopSpeaking,
    switchService,
    updateLanguage,
    calibrate,
    destroy
  }

  return [state, actions]
}

// Additional utility hooks

export function useVoiceTranscription() {
  const [state, actions] = useVoiceInteraction({ autoInitialize: true })
  
  return {
    transcription: state.lastTranscription,
    isListening: state.isListening,
    startListening: actions.startListening,
    stopListening: actions.stopListening,
    error: state.lastError
  }
}

export function useVoiceSynthesis() {
  const [state, actions] = useVoiceInteraction({ autoInitialize: true })
  
  return {
    speak: actions.speak,
    stopSpeaking: actions.stopSpeaking,
    isSpeaking: state.isSpeaking,
    error: state.lastError
  }
}

export function useVoiceActivityDetection() {
  const [state] = useVoiceInteraction({ autoInitialize: true })
  
  return {
    vadResult: state.vadResult,
    isSpeaking: state.vadResult?.isSpeaking || false,
    energy: state.vadResult?.energy || 0,
    confidence: state.vadResult?.confidence || 0
  }
}

export function useInterviewVoice(context: InterviewContext) {
  const [state, actions] = useVoiceInteraction({ 
    autoInitialize: true,
    autoCalibrate: true 
  })
  
  const askInterviewQuestion = useCallback(async (question: string) => {
    await actions.askQuestion(question, context)
  }, [actions, context])
  
  return {
    ...state,
    askQuestion: askInterviewQuestion,
    startListening: actions.startListening,
    stopListening: actions.stopListening,
    speak: actions.speak,
    stopSpeaking: actions.stopSpeaking,
    transcription: state.lastTranscription
  }
}
