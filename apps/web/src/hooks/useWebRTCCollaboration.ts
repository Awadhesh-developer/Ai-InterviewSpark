/**
 * React Hook for WebRTC Real-Time Collaboration
 * Provides comprehensive real-time communication and collaboration capabilities
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  RealTimeCollaborationService,
  type CollaborationSession,
  type Participant,
  type CollaborationTool,
  type SharedContent,
  type WhiteboardAction,
  type CodeChange,
  type LiveFeedback,
  type CollaborationCallbacks
} from '@/services/realTimeCollaborationService'
import { type ConnectionState, type StreamQuality } from '@/services/webRTCService'

interface UseWebRTCCollaborationOptions {
  autoInitialize?: boolean
  enableRecording?: boolean
  enableScreenShare?: boolean
  enableWhiteboard?: boolean
  enableCodeEditor?: boolean
}

interface WebRTCCollaborationHookState {
  isInitialized: boolean
  isInitializing: boolean
  isConnected: boolean
  session: CollaborationSession | null
  participants: Participant[]
  activeTools: CollaborationTool[]
  sharedContent: SharedContent[]
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  connectionState: ConnectionState | null
  streamQuality: StreamQuality | null
  isRecording: boolean
  isMuted: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  error: string | null
}

interface WebRTCCollaborationActions {
  initialize: () => Promise<void>
  createSession: (sessionId: string, participantInfo: { name: string; role: Participant['role'] }) => Promise<void>
  joinSession: (sessionId: string, participantInfo: { name: string; role: Participant['role'] }) => Promise<void>
  activateTool: (toolType: CollaborationTool['type'], settings?: any) => Promise<void>
  deactivateTool: (toolId: string) => Promise<void>
  performWhiteboardAction: (action: Omit<WhiteboardAction, 'participantId' | 'timestamp'>) => Promise<void>
  updateCode: (change: Omit<CodeChange, 'participantId' | 'timestamp'>) => Promise<void>
  sendLiveFeedback: (feedback: Omit<LiveFeedback, 'id' | 'timestamp'>) => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  startScreenShare: () => Promise<void>
  stopScreenShare: () => Promise<void>
  toggleMute: () => Promise<void>
  toggleVideo: () => Promise<void>
  destroy: () => void
}

export function useWebRTCCollaboration(options: UseWebRTCCollaborationOptions = {}): [WebRTCCollaborationHookState, WebRTCCollaborationActions] {
  const {
    autoInitialize = false,
    enableRecording = true,
    enableScreenShare = true,
    enableWhiteboard = true,
    enableCodeEditor = true
  } = options

  const collaborationServiceRef = useRef<RealTimeCollaborationService | null>(null)
  
  const [state, setState] = useState<WebRTCCollaborationHookState>({
    isInitialized: false,
    isInitializing: false,
    isConnected: false,
    session: null,
    participants: [],
    activeTools: [],
    sharedContent: [],
    localStream: null,
    remoteStream: null,
    connectionState: null,
    streamQuality: null,
    isRecording: false,
    isMuted: false,
    isVideoEnabled: true,
    isScreenSharing: false,
    error: null
  })

  // Initialize collaboration service
  const initialize = useCallback(async () => {
    if (state.isInitializing || state.isInitialized) return

    setState(prev => ({ ...prev, isInitializing: true, error: null }))

    try {
      collaborationServiceRef.current = new RealTimeCollaborationService()

      const callbacks: Partial<CollaborationCallbacks> = {
        onParticipantJoined: (participant) => {
          setState(prev => ({
            ...prev,
            participants: [...prev.participants, participant]
          }))
        },
        onParticipantLeft: (participantId) => {
          setState(prev => ({
            ...prev,
            participants: prev.participants.filter(p => p.id !== participantId)
          }))
        },
        onToolActivated: (tool) => {
          setState(prev => ({
            ...prev,
            activeTools: [...prev.activeTools, tool],
            isScreenSharing: tool.type === 'screen_share'
          }))
        },
        onContentUpdated: (content) => {
          setState(prev => ({
            ...prev,
            sharedContent: prev.sharedContent.map(c => 
              c.id === content.id ? content : c
            )
          }))
        },
        onWhiteboardAction: (action) => {
          // Handle whiteboard action updates
          console.log('Whiteboard action received:', action)
        },
        onCodeChange: (change) => {
          // Handle code change updates
          console.log('Code change received:', change)
        },
        onFeedbackReceived: (feedback) => {
          // Handle live feedback
          console.log('Live feedback received:', feedback)
        },
        onSessionStateChanged: (sessionState) => {
          setState(prev => ({
            ...prev,
            isRecording: sessionState.isRecording,
            isScreenSharing: sessionState.hasActiveScreenShare
          }))
        },
        onError: (error) => {
          setState(prev => ({ ...prev, error: error.message }))
        }
      }

      await collaborationServiceRef.current.initialize(callbacks)

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isInitializing: false
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Initialization failed'
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: errorMessage
      }))
      throw error
    }
  }, [state.isInitializing, state.isInitialized])

  // Create collaboration session
  const createSession = useCallback(async (
    sessionId: string, 
    participantInfo: { name: string; role: Participant['role'] }
  ) => {
    if (!collaborationServiceRef.current) {
      throw new Error('Collaboration service not initialized')
    }

    try {
      const session = await collaborationServiceRef.current.createSession(
        sessionId,
        {
          allowWhiteboard: enableWhiteboard,
          allowCodeSharing: enableCodeEditor,
          allowScreenShare: enableScreenShare,
          allowFileSharing: true,
          allowRecording: enableRecording,
          requireApproval: false
        },
        participantInfo
      )

      setState(prev => ({
        ...prev,
        session,
        participants: session.participants,
        activeTools: session.activeTools,
        sharedContent: session.sharedContent,
        isConnected: true
      }))

      // Get local stream
      const localStream = collaborationServiceRef.current['webRTCService'].getLocalStream()
      if (localStream) {
        setState(prev => ({ ...prev, localStream }))
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [enableWhiteboard, enableCodeEditor, enableScreenShare, enableRecording])

  // Join collaboration session
  const joinSession = useCallback(async (
    sessionId: string, 
    participantInfo: { name: string; role: Participant['role'] }
  ) => {
    if (!collaborationServiceRef.current) {
      throw new Error('Collaboration service not initialized')
    }

    try {
      await collaborationServiceRef.current.joinSession(sessionId, participantInfo)

      const session = collaborationServiceRef.current.getSession()
      if (session) {
        setState(prev => ({
          ...prev,
          session,
          participants: session.participants,
          activeTools: session.activeTools,
          sharedContent: session.sharedContent,
          isConnected: true
        }))
      }

      // Get local stream
      const localStream = collaborationServiceRef.current['webRTCService'].getLocalStream()
      if (localStream) {
        setState(prev => ({ ...prev, localStream }))
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join session'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Activate collaboration tool
  const activateTool = useCallback(async (toolType: CollaborationTool['type'], settings: any = {}) => {
    if (!collaborationServiceRef.current) {
      throw new Error('Collaboration service not initialized')
    }

    try {
      await collaborationServiceRef.current.activateTool(toolType, settings)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate tool'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Deactivate collaboration tool
  const deactivateTool = useCallback(async (toolId: string) => {
    if (!collaborationServiceRef.current) {
      throw new Error('Collaboration service not initialized')
    }

    try {
      await collaborationServiceRef.current.deactivateTool(toolId)
      setState(prev => ({
        ...prev,
        activeTools: prev.activeTools.filter(t => t.id !== toolId)
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate tool'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Perform whiteboard action
  const performWhiteboardAction = useCallback(async (action: Omit<WhiteboardAction, 'participantId' | 'timestamp'>) => {
    if (!collaborationServiceRef.current) {
      throw new Error('Collaboration service not initialized')
    }

    try {
      await collaborationServiceRef.current.performWhiteboardAction(action)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform whiteboard action'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Update code
  const updateCode = useCallback(async (change: Omit<CodeChange, 'participantId' | 'timestamp'>) => {
    if (!collaborationServiceRef.current) {
      throw new Error('Collaboration service not initialized')
    }

    try {
      await collaborationServiceRef.current.updateCode(change)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update code'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Send live feedback
  const sendLiveFeedback = useCallback(async (feedback: Omit<LiveFeedback, 'id' | 'timestamp'>) => {
    if (!collaborationServiceRef.current) {
      throw new Error('Collaboration service not initialized')
    }

    try {
      await collaborationServiceRef.current.sendLiveFeedback(feedback)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send feedback'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    if (!collaborationServiceRef.current) {
      throw new Error('Collaboration service not initialized')
    }

    try {
      await collaborationServiceRef.current.startRecording()
      setState(prev => ({ ...prev, isRecording: true }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!collaborationServiceRef.current) {
      throw new Error('Collaboration service not initialized')
    }

    try {
      await collaborationServiceRef.current.stopRecording()
      setState(prev => ({ ...prev, isRecording: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Start screen share
  const startScreenShare = useCallback(async () => {
    if (!collaborationServiceRef.current) {
      throw new Error('Collaboration service not initialized')
    }

    try {
      await collaborationServiceRef.current.activateTool('screen_share')
      setState(prev => ({ ...prev, isScreenSharing: true }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start screen share'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Stop screen share
  const stopScreenShare = useCallback(async () => {
    if (!collaborationServiceRef.current) return

    try {
      const screenShareTool = state.activeTools.find(t => t.type === 'screen_share')
      if (screenShareTool) {
        await collaborationServiceRef.current.deactivateTool(screenShareTool.id)
        setState(prev => ({ ...prev, isScreenSharing: false }))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop screen share'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [state.activeTools])

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (!collaborationServiceRef.current) return

    try {
      await collaborationServiceRef.current['webRTCService'].toggleMute()
      setState(prev => ({ ...prev, isMuted: !prev.isMuted }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle mute'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (!collaborationServiceRef.current) return

    try {
      await collaborationServiceRef.current['webRTCService'].toggleVideo()
      setState(prev => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle video'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Destroy service
  const destroy = useCallback(() => {
    if (collaborationServiceRef.current) {
      collaborationServiceRef.current.destroy()
      collaborationServiceRef.current = null
    }

    setState({
      isInitialized: false,
      isInitializing: false,
      isConnected: false,
      session: null,
      participants: [],
      activeTools: [],
      sharedContent: [],
      localStream: null,
      remoteStream: null,
      connectionState: null,
      streamQuality: null,
      isRecording: false,
      isMuted: false,
      isVideoEnabled: true,
      isScreenSharing: false,
      error: null
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
      destroy()
    }
  }, [destroy])

  const actions: WebRTCCollaborationActions = {
    initialize,
    createSession,
    joinSession,
    activateTool,
    deactivateTool,
    performWhiteboardAction,
    updateCode,
    sendLiveFeedback,
    startRecording,
    stopRecording,
    startScreenShare,
    stopScreenShare,
    toggleMute,
    toggleVideo,
    destroy
  }

  return [state, actions]
}

// Specialized hook for interview collaboration
export function useInterviewCollaboration() {
  const [state, actions] = useWebRTCCollaboration({
    autoInitialize: true,
    enableRecording: true,
    enableScreenShare: true,
    enableWhiteboard: true,
    enableCodeEditor: true
  })

  return {
    ...state,
    ...actions,
    
    // Convenience getters
    hasActiveWhiteboard: state.activeTools.some(t => t.type === 'whiteboard'),
    hasActiveCodeEditor: state.activeTools.some(t => t.type === 'code_editor'),
    hasActiveScreenShare: state.activeTools.some(t => t.type === 'screen_share'),
    
    participantCount: state.participants.length,
    interviewerCount: state.participants.filter(p => p.role === 'interviewer').length,
    candidateCount: state.participants.filter(p => p.role === 'candidate').length,
    observerCount: state.participants.filter(p => p.role === 'observer').length,
    
    // Helper methods
    getWhiteboardContent: () => {
      return state.sharedContent.find(c => c.type === 'drawing')
    },
    
    getCodeContent: () => {
      return state.sharedContent.find(c => c.type === 'code')
    },
    
    getFeedbackHistory: () => {
      return state.sharedContent.filter(c => c.type === 'feedback')
    },
    
    getCurrentParticipant: () => {
      return state.participants.find(p => p.isConnected) || null
    },
    
    canUseWhiteboard: () => {
      const currentParticipant = state.participants.find(p => p.isConnected)
      return currentParticipant?.permissions.canDraw || false
    },
    
    canEditCode: () => {
      const currentParticipant = state.participants.find(p => p.isConnected)
      return currentParticipant?.permissions.canEditCode || false
    },
    
    canShareScreen: () => {
      const currentParticipant = state.participants.find(p => p.isConnected)
      return currentParticipant?.permissions.canShareScreen || false
    },
    
    canGiveFeedback: () => {
      const currentParticipant = state.participants.find(p => p.isConnected)
      return currentParticipant?.permissions.canGiveFeedback || false
    },
    
    isSessionActive: () => {
      return state.session?.sessionState.status === 'active'
    },
    
    getSessionDuration: () => {
      return state.session?.sessionState.duration || 0
    }
  }
}

// Export types for convenience
export type {
  CollaborationSession,
  Participant,
  CollaborationTool,
  SharedContent,
  WhiteboardAction,
  CodeChange,
  LiveFeedback
}
