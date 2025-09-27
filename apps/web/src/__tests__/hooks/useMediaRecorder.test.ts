import { renderHook, act } from '@testing-library/react'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  state: 'inactive',
  ondataavailable: null,
  onstart: null,
  onstop: null,
  onpause: null,
  onresume: null,
  onerror: null
}

const mockStream = {
  getTracks: jest.fn(() => [
    { stop: jest.fn() },
    { stop: jest.fn() }
  ])
}

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(() => Promise.resolve(mockStream))
  },
  writable: true
})

// Mock MediaRecorder constructor
global.MediaRecorder = jest.fn(() => mockMediaRecorder) as any
global.URL.createObjectURL = jest.fn(() => 'mock-url')
global.URL.revokeObjectURL = jest.fn()

describe('useMediaRecorder Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMediaRecorder.state = 'inactive'
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useMediaRecorder())
    
    expect(result.current.isRecording).toBe(false)
    expect(result.current.isPaused).toBe(false)
    expect(result.current.duration).toBe(0)
    expect(result.current.mediaBlob).toBeNull()
    expect(result.current.mediaUrl).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('starts recording successfully', async () => {
    const { result } = renderHook(() => useMediaRecorder())
    
    await act(async () => {
      await result.current.startRecording()
    })
    
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      },
      video: false
    })
    
    expect(MediaRecorder).toHaveBeenCalledWith(
      mockStream,
      expect.objectContaining({
        mimeType: 'audio/webm;codecs=opus'
      })
    )
  })

  it('starts video recording when video option is enabled', async () => {
    const { result } = renderHook(() => useMediaRecorder({ video: true }))
    
    await act(async () => {
      await result.current.startRecording()
    })
    
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      },
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    })
  })

  it('handles recording state changes', async () => {
    const onStart = jest.fn()
    const onStop = jest.fn()
    
    const { result } = renderHook(() => useMediaRecorder({
      onStart,
      onStop
    }))
    
    await act(async () => {
      await result.current.startRecording()
    })
    
    // Simulate MediaRecorder events
    act(() => {
      if (mockMediaRecorder.onstart) {
        mockMediaRecorder.onstart(new Event('start'))
      }
    })
    
    expect(result.current.isRecording).toBe(true)
    expect(onStart).toHaveBeenCalled()
    
    act(() => {
      result.current.stopRecording()
    })
    
    expect(mockMediaRecorder.stop).toHaveBeenCalled()
  })

  it('handles pause and resume', async () => {
    const onPause = jest.fn()
    const onResume = jest.fn()
    
    const { result } = renderHook(() => useMediaRecorder({
      onPause,
      onResume
    }))
    
    await act(async () => {
      await result.current.startRecording()
    })
    
    mockMediaRecorder.state = 'recording'
    
    act(() => {
      result.current.pauseRecording()
    })
    
    expect(mockMediaRecorder.pause).toHaveBeenCalled()
    
    mockMediaRecorder.state = 'paused'
    
    act(() => {
      result.current.resumeRecording()
    })
    
    expect(mockMediaRecorder.resume).toHaveBeenCalled()
  })

  it('handles errors gracefully', async () => {
    const onError = jest.fn()
    const error = new Error('Media access denied')
    
    ;(navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(error)
    
    const { result } = renderHook(() => useMediaRecorder({ onError }))
    
    await act(async () => {
      try {
        await result.current.startRecording()
      } catch (e) {
        // Expected to throw
      }
    })
    
    expect(result.current.error).toBeTruthy()
    expect(onError).toHaveBeenCalledWith(error)
  })

  it('clears recording data', async () => {
    const { result } = renderHook(() => useMediaRecorder())
    
    // Set some mock data
    act(() => {
      result.current.clearRecording()
    })
    
    expect(result.current.duration).toBe(0)
    expect(result.current.mediaBlob).toBeNull()
    expect(result.current.mediaUrl).toBeNull()
  })

  it('formats duration correctly', () => {
    const { result } = renderHook(() => useMediaRecorder())
    
    expect(result.current.formatDuration(0)).toBe('00:00')
    expect(result.current.formatDuration(65)).toBe('01:05')
    expect(result.current.formatDuration(3661)).toBe('61:01')
  })

  it('checks browser support', () => {
    const { result } = renderHook(() => useMediaRecorder())
    
    expect(result.current.isSupported()).toBe(true)
    
    // Mock unsupported browser
    delete (global.navigator as any).mediaDevices
    delete (global as any).MediaRecorder
    
    expect(result.current.isSupported()).toBe(false)
  })

  it('cleans up resources on unmount', async () => {
    const { result, unmount } = renderHook(() => useMediaRecorder())
    
    await act(async () => {
      await result.current.startRecording()
    })
    
    unmount()
    
    expect(mockStream.getTracks()[0].stop).toHaveBeenCalled()
    expect(mockStream.getTracks()[1].stop).toHaveBeenCalled()
  })

  it('handles data available events', async () => {
    const onDataAvailable = jest.fn()
    const { result } = renderHook(() => useMediaRecorder({ onDataAvailable }))
    
    await act(async () => {
      await result.current.startRecording()
    })
    
    const mockBlob = new Blob(['test'], { type: 'audio/webm' })
    const mockEvent = { data: mockBlob }
    
    act(() => {
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable(mockEvent as any)
      }
    })
    
    expect(onDataAvailable).toHaveBeenCalledWith(mockBlob)
  })

  it('handles custom MIME types', async () => {
    const customMimeType = 'audio/mp4'
    const { result } = renderHook(() => useMediaRecorder({ 
      mimeType: customMimeType 
    }))
    
    await act(async () => {
      await result.current.startRecording()
    })
    
    expect(MediaRecorder).toHaveBeenCalledWith(
      mockStream,
      expect.objectContaining({
        mimeType: customMimeType
      })
    )
  })
})
