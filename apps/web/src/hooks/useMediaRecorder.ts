import { useState, useRef, useCallback, useEffect } from 'react'

export interface MediaRecorderState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  mediaBlob: Blob | null
  mediaUrl: string | null
  error: string | null
}

export interface MediaRecorderOptions {
  audio?: boolean
  video?: boolean
  mimeType?: string
  audioBitsPerSecond?: number
  videoBitsPerSecond?: number
  onDataAvailable?: (data: Blob) => void
  onStart?: () => void
  onStop?: (blob: Blob) => void
  onPause?: () => void
  onResume?: () => void
  onError?: (error: Error) => void
}

export function useMediaRecorder(options: MediaRecorderOptions = {}) {
  const {
    audio = true,
    video = false,
    mimeType,
    audioBitsPerSecond,
    videoBitsPerSecond,
    onDataAvailable,
    onStart,
    onStop,
    onPause,
    onResume,
    onError
  } = options

  const [state, setState] = useState<MediaRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    mediaBlob: null,
    mediaUrl: null,
    error: null
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize media stream
  const initializeStream = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }))

      const constraints: MediaStreamConstraints = {
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } : false,
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || (video ? 'video/webm;codecs=vp9' : 'audio/webm;codecs=opus'),
        audioBitsPerSecond,
        videoBitsPerSecond
      })

      mediaRecorderRef.current = mediaRecorder

      // Event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          onDataAvailable?.(event.data)
        }
      }

      mediaRecorder.onstart = () => {
        setState(prev => ({ ...prev, isRecording: true, isPaused: false }))
        startTimeRef.current = Date.now()
        startDurationTimer()
        onStart?.()
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: mimeType || (video ? 'video/webm' : 'audio/webm') 
        })
        const url = URL.createObjectURL(blob)

        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          mediaBlob: blob,
          mediaUrl: url
        }))

        stopDurationTimer()
        onStop?.(blob)
        chunksRef.current = []
      }

      mediaRecorder.onpause = () => {
        setState(prev => ({ ...prev, isPaused: true }))
        pausedTimeRef.current = Date.now()
        stopDurationTimer()
        onPause?.()
      }

      mediaRecorder.onresume = () => {
        setState(prev => ({ ...prev, isPaused: false }))
        startTimeRef.current += Date.now() - pausedTimeRef.current
        startDurationTimer()
        onResume?.()
      }

      mediaRecorder.onerror = (event) => {
        const error = new Error(`MediaRecorder error: ${event.error}`)
        setState(prev => ({ ...prev, error: error.message }))
        onError?.(error)
      }

      return stream
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize media stream'
      setState(prev => ({ ...prev, error: errorMessage }))
      onError?.(error instanceof Error ? error : new Error(errorMessage))
      throw error
    }
  }, [audio, video, mimeType, audioBitsPerSecond, videoBitsPerSecond, onDataAvailable, onStart, onStop, onPause, onResume, onError])

  // Start duration timer
  const startDurationTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
      }))
    }, 1000)
  }, [])

  // Stop duration timer
  const stopDurationTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      if (!streamRef.current) {
        await initializeStream()
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
        setState(prev => ({ ...prev, duration: 0, mediaBlob: null, mediaUrl: null }))
        mediaRecorderRef.current.start(1000) // Collect data every second
      }
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }, [initializeStream])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
    }
  }, [])

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
    }
  }, [])

  // Clear recording
  const clearRecording = useCallback(() => {
    setState(prev => ({
      ...prev,
      duration: 0,
      mediaBlob: null,
      mediaUrl: null
    }))
    chunksRef.current = []
  }, [])

  // Cleanup
  const cleanup = useCallback(() => {
    stopDurationTimer()
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (state.mediaUrl) {
      URL.revokeObjectURL(state.mediaUrl)
    }

    mediaRecorderRef.current = null
    chunksRef.current = []
  }, [stopDurationTimer, state.mediaUrl])

  // Check browser support
  const isSupported = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)
  }, [])

  // Get available devices
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return {
        audioInputs: devices.filter(device => device.kind === 'audioinput'),
        videoInputs: devices.filter(device => device.kind === 'videoinput'),
        audioOutputs: devices.filter(device => device.kind === 'audiooutput')
      }
    } catch (error) {
      console.error('Error getting devices:', error)
      return { audioInputs: [], videoInputs: [], audioOutputs: [] }
    }
  }, [])

  // Format duration
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    cleanup,
    isSupported,
    getDevices,
    formatDuration,
    stream: streamRef.current
  }
}
