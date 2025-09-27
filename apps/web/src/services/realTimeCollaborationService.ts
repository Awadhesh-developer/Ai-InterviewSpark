/**
 * Real-Time Collaboration Service
 * Provides advanced real-time collaboration features for interviews including whiteboarding, code sharing, and live feedback
 */

import { WebRTCService, type WebRTCCallbacks } from './webRTCService'

interface CollaborationSession {
  sessionId: string
  participants: Participant[]
  activeTools: CollaborationTool[]
  sharedContent: SharedContent[]
  sessionState: SessionState
  permissions: SessionPermissions
}

interface Participant {
  id: string
  name: string
  role: 'interviewer' | 'candidate' | 'observer'
  isConnected: boolean
  permissions: ParticipantPermissions
  lastActivity: number
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor'
}

interface CollaborationTool {
  id: string
  type: 'whiteboard' | 'code_editor' | 'screen_share' | 'file_share' | 'live_feedback'
  isActive: boolean
  activeParticipants: string[]
  settings: ToolSettings
}

interface SharedContent {
  id: string
  type: 'drawing' | 'code' | 'file' | 'note' | 'feedback'
  content: any
  author: string
  timestamp: number
  version: number
  isLocked: boolean
}

interface SessionState {
  status: 'waiting' | 'active' | 'paused' | 'ended'
  startTime: number
  duration: number
  currentTool: string | null
  isRecording: boolean
  hasActiveScreenShare: boolean
}

interface SessionPermissions {
  allowWhiteboard: boolean
  allowCodeSharing: boolean
  allowScreenShare: boolean
  allowFileSharing: boolean
  allowRecording: boolean
  requireApproval: boolean
}

interface ParticipantPermissions {
  canDraw: boolean
  canEditCode: boolean
  canShareScreen: boolean
  canShareFiles: boolean
  canGiveFeedback: boolean
  canControlSession: boolean
}

interface ToolSettings {
  whiteboard?: {
    canvasSize: { width: number; height: number }
    allowedTools: string[]
    maxParticipants: number
  }
  codeEditor?: {
    language: string
    theme: string
    allowExecution: boolean
    maxFileSize: number
  }
  screenShare?: {
    quality: 'low' | 'medium' | 'high'
    includeAudio: boolean
    allowAnnotations: boolean
  }
  fileShare?: {
    maxFileSize: number
    allowedTypes: string[]
    requireApproval: boolean
  }
}

interface WhiteboardAction {
  type: 'draw' | 'erase' | 'clear' | 'undo' | 'redo'
  data: any
  participantId: string
  timestamp: number
}

interface CodeChange {
  type: 'insert' | 'delete' | 'replace'
  position: { line: number; column: number }
  content: string
  participantId: string
  timestamp: number
}

interface LiveFeedback {
  id: string
  type: 'positive' | 'negative' | 'neutral' | 'question'
  content: string
  author: string
  timestamp: number
  isAnonymous: boolean
  targetParticipant?: string
}

interface CollaborationCallbacks {
  onParticipantJoined: (participant: Participant) => void
  onParticipantLeft: (participantId: string) => void
  onToolActivated: (tool: CollaborationTool) => void
  onContentUpdated: (content: SharedContent) => void
  onWhiteboardAction: (action: WhiteboardAction) => void
  onCodeChange: (change: CodeChange) => void
  onFeedbackReceived: (feedback: LiveFeedback) => void
  onSessionStateChanged: (state: SessionState) => void
  onError: (error: Error) => void
}

class RealTimeCollaborationService {
  private webRTCService: WebRTCService
  private session: CollaborationSession | null = null
  private callbacks: Partial<CollaborationCallbacks> = {}
  private isInitialized: boolean = false
  private syncInterval: number | null = null

  constructor() {
    this.webRTCService = new WebRTCService({
      enableDataChannel: true,
      enableScreenShare: true,
      enableRecording: true
    })
  }

  async initialize(callbacks: Partial<CollaborationCallbacks> = {}): Promise<void> {
    if (this.isInitialized) return

    try {
      this.callbacks = callbacks

      // Initialize WebRTC with collaboration-specific callbacks
      const webRTCCallbacks: Partial<WebRTCCallbacks> = {
        onDataChannelMessage: (data) => this.handleDataChannelMessage(data),
        onStreamReceived: (stream, type) => this.handleStreamReceived(stream, type),
        onConnectionStateChange: (state) => this.handleConnectionStateChange(state),
        onError: (error) => this.callbacks.onError?.(error)
      }

      await this.webRTCService.initialize(webRTCCallbacks)
      this.isInitialized = true
      console.log('Real-Time Collaboration Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Real-Time Collaboration Service:', error)
      throw error
    }
  }

  async createSession(
    sessionId: string,
    permissions: SessionPermissions,
    participantInfo: { name: string; role: Participant['role'] }
  ): Promise<CollaborationSession> {
    if (!this.isInitialized) {
      throw new Error('Service not initialized')
    }

    const participant: Participant = {
      id: this.generateParticipantId(),
      name: participantInfo.name,
      role: participantInfo.role,
      isConnected: true,
      permissions: this.getDefaultPermissions(participantInfo.role),
      lastActivity: Date.now(),
      connectionQuality: 'good'
    }

    this.session = {
      sessionId,
      participants: [participant],
      activeTools: [],
      sharedContent: [],
      sessionState: {
        status: 'waiting',
        startTime: Date.now(),
        duration: 0,
        currentTool: null,
        isRecording: false,
        hasActiveScreenShare: false
      },
      permissions
    }

    // Start local stream
    await this.webRTCService.startLocalStream()

    // Start sync interval
    this.startSyncInterval()

    this.callbacks.onSessionStateChanged?.(this.session.sessionState)
    return this.session
  }

  async joinSession(sessionId: string, participantInfo: { name: string; role: Participant['role'] }): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Service not initialized')
    }

    // In a real implementation, this would connect to an existing session
    // For now, we'll simulate joining
    const participant: Participant = {
      id: this.generateParticipantId(),
      name: participantInfo.name,
      role: participantInfo.role,
      isConnected: true,
      permissions: this.getDefaultPermissions(participantInfo.role),
      lastActivity: Date.now(),
      connectionQuality: 'good'
    }

    if (this.session) {
      this.session.participants.push(participant)
      this.callbacks.onParticipantJoined?.(participant)
    }

    // Start local stream
    await this.webRTCService.startLocalStream()
  }

  async activateTool(toolType: CollaborationTool['type'], settings: ToolSettings = {}): Promise<void> {
    if (!this.session) {
      throw new Error('No active session')
    }

    const tool: CollaborationTool = {
      id: this.generateToolId(),
      type: toolType,
      isActive: true,
      activeParticipants: [this.getCurrentParticipantId()],
      settings
    }

    // Check permissions
    if (!this.hasPermissionForTool(toolType)) {
      throw new Error(`No permission to activate ${toolType}`)
    }

    // Deactivate current tool if any
    if (this.session.sessionState.currentTool) {
      await this.deactivateTool(this.session.sessionState.currentTool)
    }

    this.session.activeTools.push(tool)
    this.session.sessionState.currentTool = tool.id

    // Handle tool-specific activation
    switch (toolType) {
      case 'screen_share':
        await this.startScreenShare()
        break
      case 'whiteboard':
        await this.initializeWhiteboard(settings.whiteboard)
        break
      case 'code_editor':
        await this.initializeCodeEditor(settings.codeEditor)
        break
    }

    this.broadcastMessage({
      type: 'tool_activated',
      tool
    })

    this.callbacks.onToolActivated?.(tool)
  }

  async deactivateTool(toolId: string): Promise<void> {
    if (!this.session) return

    const toolIndex = this.session.activeTools.findIndex(t => t.id === toolId)
    if (toolIndex === -1) return

    const tool = this.session.activeTools[toolIndex]
    tool.isActive = false

    // Handle tool-specific deactivation
    switch (tool.type) {
      case 'screen_share':
        await this.webRTCService.stopScreenShare()
        this.session.sessionState.hasActiveScreenShare = false
        break
    }

    this.session.activeTools.splice(toolIndex, 1)
    
    if (this.session.sessionState.currentTool === toolId) {
      this.session.sessionState.currentTool = null
    }

    this.broadcastMessage({
      type: 'tool_deactivated',
      toolId
    })
  }

  async performWhiteboardAction(action: Omit<WhiteboardAction, 'participantId' | 'timestamp'>): Promise<void> {
    if (!this.session || !this.hasActiveTool('whiteboard')) {
      throw new Error('Whiteboard not active')
    }

    const whiteboardAction: WhiteboardAction = {
      ...action,
      participantId: this.getCurrentParticipantId(),
      timestamp: Date.now()
    }

    // Apply action locally
    this.applyWhiteboardAction(whiteboardAction)

    // Broadcast to other participants
    this.broadcastMessage({
      type: 'whiteboard_action',
      action: whiteboardAction
    })

    this.callbacks.onWhiteboardAction?.(whiteboardAction)
  }

  async updateCode(change: Omit<CodeChange, 'participantId' | 'timestamp'>): Promise<void> {
    if (!this.session || !this.hasActiveTool('code_editor')) {
      throw new Error('Code editor not active')
    }

    const codeChange: CodeChange = {
      ...change,
      participantId: this.getCurrentParticipantId(),
      timestamp: Date.now()
    }

    // Apply change locally
    this.applyCodeChange(codeChange)

    // Broadcast to other participants
    this.broadcastMessage({
      type: 'code_change',
      change: codeChange
    })

    this.callbacks.onCodeChange?.(codeChange)
  }

  async sendLiveFeedback(feedback: Omit<LiveFeedback, 'id' | 'timestamp'>): Promise<void> {
    if (!this.session) {
      throw new Error('No active session')
    }

    const liveFeedback: LiveFeedback = {
      id: this.generateFeedbackId(),
      timestamp: Date.now(),
      ...feedback
    }

    // Store feedback
    const sharedContent: SharedContent = {
      id: liveFeedback.id,
      type: 'feedback',
      content: liveFeedback,
      author: feedback.author,
      timestamp: liveFeedback.timestamp,
      version: 1,
      isLocked: false
    }

    this.session.sharedContent.push(sharedContent)

    // Broadcast feedback
    this.broadcastMessage({
      type: 'live_feedback',
      feedback: liveFeedback
    })

    this.callbacks.onFeedbackReceived?.(liveFeedback)
  }

  async startRecording(): Promise<void> {
    if (!this.session) {
      throw new Error('No active session')
    }

    if (!this.session.permissions.allowRecording) {
      throw new Error('Recording not allowed in this session')
    }

    await this.webRTCService.startRecording()
    this.session.sessionState.isRecording = true

    this.broadcastMessage({
      type: 'recording_started'
    })
  }

  async stopRecording(): Promise<void> {
    if (!this.session) return

    this.webRTCService.stopRecording()
    this.session.sessionState.isRecording = false

    this.broadcastMessage({
      type: 'recording_stopped'
    })
  }

  private async startScreenShare(): Promise<void> {
    if (!this.session) return

    await this.webRTCService.startScreenShare()
    this.session.sessionState.hasActiveScreenShare = true
  }

  private async initializeWhiteboard(settings?: ToolSettings['whiteboard']): Promise<void> {
    const defaultSettings = {
      canvasSize: { width: 1920, height: 1080 },
      allowedTools: ['pen', 'eraser', 'shapes', 'text'],
      maxParticipants: 10
    }

    const whiteboardSettings = { ...defaultSettings, ...settings }

    // Initialize whiteboard content
    const whiteboardContent: SharedContent = {
      id: 'whiteboard-canvas',
      type: 'drawing',
      content: {
        canvas: null,
        settings: whiteboardSettings,
        actions: []
      },
      author: 'system',
      timestamp: Date.now(),
      version: 1,
      isLocked: false
    }

    this.session?.sharedContent.push(whiteboardContent)
  }

  private async initializeCodeEditor(settings?: ToolSettings['codeEditor']): Promise<void> {
    const defaultSettings = {
      language: 'javascript',
      theme: 'vs-dark',
      allowExecution: false,
      maxFileSize: 1024 * 1024 // 1MB
    }

    const editorSettings = { ...defaultSettings, ...settings }

    // Initialize code content
    const codeContent: SharedContent = {
      id: 'code-editor',
      type: 'code',
      content: {
        code: '',
        language: editorSettings.language,
        settings: editorSettings,
        changes: []
      },
      author: 'system',
      timestamp: Date.now(),
      version: 1,
      isLocked: false
    }

    this.session?.sharedContent.push(codeContent)
  }

  private applyWhiteboardAction(action: WhiteboardAction): void {
    if (!this.session) return

    const whiteboardContent = this.session.sharedContent.find(c => c.id === 'whiteboard-canvas')
    if (whiteboardContent) {
      whiteboardContent.content.actions.push(action)
      whiteboardContent.version++
      whiteboardContent.timestamp = Date.now()
    }
  }

  private applyCodeChange(change: CodeChange): void {
    if (!this.session) return

    const codeContent = this.session.sharedContent.find(c => c.id === 'code-editor')
    if (codeContent) {
      codeContent.content.changes.push(change)
      codeContent.version++
      codeContent.timestamp = Date.now()

      // Apply change to code content
      // This would involve more complex text manipulation in a real implementation
    }
  }

  private handleDataChannelMessage(data: any): void {
    switch (data.type) {
      case 'tool_activated':
        this.callbacks.onToolActivated?.(data.tool)
        break
      case 'whiteboard_action':
        this.applyWhiteboardAction(data.action)
        this.callbacks.onWhiteboardAction?.(data.action)
        break
      case 'code_change':
        this.applyCodeChange(data.change)
        this.callbacks.onCodeChange?.(data.change)
        break
      case 'live_feedback':
        this.callbacks.onFeedbackReceived?.(data.feedback)
        break
    }
  }

  private handleStreamReceived(stream: MediaStream, type: string): void {
    if (type === 'screen' && this.session) {
      this.session.sessionState.hasActiveScreenShare = true
    }
  }

  private handleConnectionStateChange(state: any): void {
    // Update participant connection quality based on WebRTC state
    if (this.session) {
      const currentParticipant = this.session.participants.find(p => p.id === this.getCurrentParticipantId())
      if (currentParticipant) {
        currentParticipant.connectionQuality = state.connectionQuality
        currentParticipant.isConnected = state.isConnected
      }
    }
  }

  private broadcastMessage(message: any): void {
    this.webRTCService.sendDataChannelMessage(message)
  }

  private startSyncInterval(): void {
    this.syncInterval = window.setInterval(() => {
      if (this.session) {
        this.session.sessionState.duration = Date.now() - this.session.sessionState.startTime
        this.callbacks.onSessionStateChanged?.(this.session.sessionState)
      }
    }, 1000)
  }

  private hasPermissionForTool(toolType: CollaborationTool['type']): boolean {
    if (!this.session) return false

    const currentParticipant = this.session.participants.find(p => p.id === this.getCurrentParticipantId())
    if (!currentParticipant) return false

    switch (toolType) {
      case 'whiteboard':
        return this.session.permissions.allowWhiteboard && currentParticipant.permissions.canDraw
      case 'code_editor':
        return this.session.permissions.allowCodeSharing && currentParticipant.permissions.canEditCode
      case 'screen_share':
        return this.session.permissions.allowScreenShare && currentParticipant.permissions.canShareScreen
      case 'file_share':
        return this.session.permissions.allowFileSharing && currentParticipant.permissions.canShareFiles
      default:
        return true
    }
  }

  private hasActiveTool(toolType: CollaborationTool['type']): boolean {
    return this.session?.activeTools.some(t => t.type === toolType && t.isActive) || false
  }

  private getDefaultPermissions(role: Participant['role']): ParticipantPermissions {
    switch (role) {
      case 'interviewer':
        return {
          canDraw: true,
          canEditCode: true,
          canShareScreen: true,
          canShareFiles: true,
          canGiveFeedback: true,
          canControlSession: true
        }
      case 'candidate':
        return {
          canDraw: true,
          canEditCode: true,
          canShareScreen: true,
          canShareFiles: false,
          canGiveFeedback: false,
          canControlSession: false
        }
      case 'observer':
        return {
          canDraw: false,
          canEditCode: false,
          canShareScreen: false,
          canShareFiles: false,
          canGiveFeedback: true,
          canControlSession: false
        }
    }
  }

  private generateParticipantId(): string {
    return `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateToolId(): string {
    return `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getCurrentParticipantId(): string {
    // In a real implementation, this would return the current user's participant ID
    return this.session?.participants[0]?.id || 'unknown'
  }

  // Public API methods
  getSession(): CollaborationSession | null {
    return this.session
  }

  getActiveTools(): CollaborationTool[] {
    return this.session?.activeTools || []
  }

  getSharedContent(): SharedContent[] {
    return this.session?.sharedContent || []
  }

  getParticipants(): Participant[] {
    return this.session?.participants || []
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    this.webRTCService.destroy()
    this.session = null
    this.isInitialized = false
    console.log('Real-Time Collaboration Service destroyed')
  }
}

export { 
  RealTimeCollaborationService,
  type CollaborationSession,
  type Participant,
  type CollaborationTool,
  type SharedContent,
  type WhiteboardAction,
  type CodeChange,
  type LiveFeedback,
  type CollaborationCallbacks
}
