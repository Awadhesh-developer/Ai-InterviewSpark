'use client'

import React, { useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Video, 
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Circle,
  Square,
  Users,
  MessageSquare,
  Code,
  PenTool,
  Share2,
  Phone,
  PhoneOff,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Signal,
  Wifi,
  WifiOff
} from 'lucide-react'
import { useInterviewCollaboration } from '@/hooks/useWebRTCCollaboration'

interface WebRTCCollaborationDashboardProps {
  className?: string
  sessionId?: string
  participantInfo?: { name: string; role: 'interviewer' | 'candidate' | 'observer' }
  showVideoControls?: boolean
  showCollaborationTools?: boolean
  showParticipants?: boolean
  showConnectionStatus?: boolean
}

interface VideoDisplayProps {
  stream: MediaStream | null
  label: string
  isMuted?: boolean
  isVideoEnabled?: boolean
}

interface ParticipantCardProps {
  participant: any
  isCurrentUser?: boolean
}

interface ConnectionStatusProps {
  connectionState: any
  streamQuality: any
}

function VideoDisplay({ stream, label, isMuted = false, isVideoEnabled = true }: VideoDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
      {stream && isVideoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <VideoOff className="h-12 w-12 text-gray-400" />
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
        {label}
      </div>
      
      <div className="absolute bottom-2 right-2 flex space-x-1">
        {!isMuted ? (
          <div className="bg-green-500 p-1 rounded">
            <Mic className="h-3 w-3 text-white" />
          </div>
        ) : (
          <div className="bg-red-500 p-1 rounded">
            <MicOff className="h-3 w-3 text-white" />
          </div>
        )}
        
        {!isVideoEnabled && (
          <div className="bg-red-500 p-1 rounded">
            <VideoOff className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
    </div>
  )
}

function ParticipantCard({ participant, isCurrentUser = false }: ParticipantCardProps) {
  const getConnectionColor = () => {
    switch (participant.connectionQuality) {
      case 'excellent': return 'text-green-600 bg-green-50'
      case 'good': return 'text-blue-600 bg-blue-50'
      case 'fair': return 'text-yellow-600 bg-yellow-50'
      case 'poor': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getRoleColor = () => {
    switch (participant.role) {
      case 'interviewer': return 'bg-blue-100 text-blue-800'
      case 'candidate': return 'bg-green-100 text-green-800'
      case 'observer': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`p-3 rounded-lg border ${isCurrentUser ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${participant.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-medium text-sm">{participant.name}</span>
          {isCurrentUser && <Badge variant="outline" className="text-xs">You</Badge>}
        </div>
        <Badge className={`text-xs ${getRoleColor()}`}>
          {participant.role}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <div className={`px-2 py-1 rounded ${getConnectionColor()}`}>
          {participant.connectionQuality}
        </div>
        <div className="text-gray-500">
          {new Date(participant.lastActivity).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

function ConnectionStatus({ connectionState, streamQuality }: ConnectionStatusProps) {
  if (!connectionState) return null

  const getConnectionIcon = () => {
    if (connectionState.isConnected) {
      return <Wifi className="h-4 w-4 text-green-500" />
    } else {
      return <WifiOff className="h-4 w-4 text-red-500" />
    }
  }

  const getQualityColor = () => {
    switch (connectionState.connectionQuality) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'fair': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-2">
        {getConnectionIcon()}
        <span className={getQualityColor()}>
          {connectionState.connectionQuality}
        </span>
      </div>
      
      {streamQuality && (
        <>
          <div className="flex items-center space-x-1">
            <Signal className="h-3 w-3" />
            <span>{Math.round(streamQuality.network.rtt)}ms</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Video className="h-3 w-3" />
            <span>{streamQuality.video.resolution}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span>📊</span>
            <span>{Math.round(streamQuality.network.bandwidth / 1000)}kbps</span>
          </div>
        </>
      )}
    </div>
  )
}

export function WebRTCCollaborationDashboard({
  className = '',
  sessionId = 'interview-session',
  participantInfo = { name: 'User', role: 'candidate' },
  showVideoControls = true,
  showCollaborationTools = true,
  showParticipants = true,
  showConnectionStatus = true
}: WebRTCCollaborationDashboardProps) {
  const collaboration = useInterviewCollaboration()

  useEffect(() => {
    if (collaboration.isInitialized && !collaboration.isConnected) {
      collaboration.createSession(sessionId, participantInfo).catch(console.error)
    }
  }, [collaboration.isInitialized, collaboration.isConnected, sessionId, participantInfo])

  if (!collaboration.isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Video className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Initializing WebRTC collaboration...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (collaboration.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{collaboration.error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Video Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Local Video */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>Your Video</span>
              {showConnectionStatus && (
                <ConnectionStatus 
                  connectionState={collaboration.connectionState}
                  streamQuality={collaboration.streamQuality}
                />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VideoDisplay
              stream={collaboration.localStream}
              label="You"
              isMuted={true} // Always mute local audio to prevent feedback
              isVideoEnabled={collaboration.isVideoEnabled}
            />
          </CardContent>
        </Card>

        {/* Remote Video */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Remote Participant</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoDisplay
              stream={collaboration.remoteStream}
              label="Remote"
              isMuted={collaboration.isMuted}
              isVideoEnabled={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Video Controls */}
      {showVideoControls && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <span>Video Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={collaboration.isMuted ? "destructive" : "outline"}
                size="sm"
                onClick={collaboration.toggleMute}
              >
                {collaboration.isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                {collaboration.isMuted ? 'Unmute' : 'Mute'}
              </Button>

              <Button
                variant={collaboration.isVideoEnabled ? "outline" : "destructive"}
                size="sm"
                onClick={collaboration.toggleVideo}
              >
                {collaboration.isVideoEnabled ? <Video className="h-4 w-4 mr-2" /> : <VideoOff className="h-4 w-4 mr-2" />}
                {collaboration.isVideoEnabled ? 'Stop Video' : 'Start Video'}
              </Button>

              <Button
                variant={collaboration.isScreenSharing ? "default" : "outline"}
                size="sm"
                onClick={collaboration.isScreenSharing ? collaboration.stopScreenShare : collaboration.startScreenShare}
              >
                {collaboration.isScreenSharing ? <MonitorOff className="h-4 w-4 mr-2" /> : <Monitor className="h-4 w-4 mr-2" />}
                {collaboration.isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
              </Button>

              <Button
                variant={collaboration.isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={collaboration.isRecording ? collaboration.stopRecording : collaboration.startRecording}
              >
                {collaboration.isRecording ? <Square className="h-4 w-4 mr-2" /> : <Circle className="h-4 w-4 mr-2" />}
                {collaboration.isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collaboration Tools */}
      {showCollaborationTools && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Share2 className="h-5 w-5" />
              <span>Collaboration Tools</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant={collaboration.hasActiveWhiteboard ? "default" : "outline"}
                className="h-20 flex-col"
                onClick={() => {
                  if (collaboration.hasActiveWhiteboard) {
                    const whiteboardTool = collaboration.activeTools.find(t => t.type === 'whiteboard')
                    if (whiteboardTool) {
                      collaboration.deactivateTool(whiteboardTool.id)
                    }
                  } else {
                    collaboration.activateTool('whiteboard')
                  }
                }}
                disabled={!collaboration.canUseWhiteboard()}
              >
                <PenTool className="h-6 w-6 mb-2" />
                <span className="text-xs">Whiteboard</span>
                {collaboration.hasActiveWhiteboard && (
                  <Badge variant="secondary" className="mt-1 text-xs">Active</Badge>
                )}
              </Button>

              <Button
                variant={collaboration.hasActiveCodeEditor ? "default" : "outline"}
                className="h-20 flex-col"
                onClick={() => {
                  if (collaboration.hasActiveCodeEditor) {
                    const codeTool = collaboration.activeTools.find(t => t.type === 'code_editor')
                    if (codeTool) {
                      collaboration.deactivateTool(codeTool.id)
                    }
                  } else {
                    collaboration.activateTool('code_editor', { language: 'javascript' })
                  }
                }}
                disabled={!collaboration.canEditCode()}
              >
                <Code className="h-6 w-6 mb-2" />
                <span className="text-xs">Code Editor</span>
                {collaboration.hasActiveCodeEditor && (
                  <Badge variant="secondary" className="mt-1 text-xs">Active</Badge>
                )}
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col"
                onClick={() => {
                  collaboration.sendLiveFeedback({
                    type: 'positive',
                    content: 'Great answer!',
                    author: participantInfo.name,
                    isAnonymous: false
                  })
                }}
                disabled={!collaboration.canGiveFeedback()}
              >
                <MessageSquare className="h-6 w-6 mb-2" />
                <span className="text-xs">Live Feedback</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col"
                onClick={() => {
                  // Open settings modal
                }}
              >
                <Settings className="h-6 w-6 mb-2" />
                <span className="text-xs">Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participants */}
      {showParticipants && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Participants ({collaboration.participantCount})</span>
              </div>
              <div className="flex space-x-2 text-sm">
                <Badge variant="outline">
                  {collaboration.interviewerCount} Interviewer{collaboration.interviewerCount !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline">
                  {collaboration.candidateCount} Candidate{collaboration.candidateCount !== 1 ? 's' : ''}
                </Badge>
                {collaboration.observerCount > 0 && (
                  <Badge variant="outline">
                    {collaboration.observerCount} Observer{collaboration.observerCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {collaboration.participants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  isCurrentUser={participant.name === participantInfo.name}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Session Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {collaboration.isSessionActive() ? 'Active' : 'Waiting'}
              </div>
              <div className="text-blue-800">Status</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {Math.floor(collaboration.getSessionDuration() / 60000)}m
              </div>
              <div className="text-green-800">Duration</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {collaboration.activeTools.length}
              </div>
              <div className="text-purple-800">Active Tools</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {collaboration.isRecording ? 'Recording' : 'Not Recording'}
              </div>
              <div className="text-orange-800">Recording</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Quality */}
      {showConnectionStatus && collaboration.streamQuality && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Signal className="h-5 w-5" />
              <span>Connection Quality</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(collaboration.streamQuality.network.rtt)}ms
                </div>
                <div className="text-blue-800">Latency</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {Math.round(collaboration.streamQuality.network.bandwidth / 1000)}kbps
                </div>
                <div className="text-green-800">Bandwidth</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {Math.round(collaboration.streamQuality.network.packetLoss * 100)}%
                </div>
                <div className="text-purple-800">Packet Loss</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">
                  {collaboration.streamQuality.video.frameRate}fps
                </div>
                <div className="text-orange-800">Frame Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default WebRTCCollaborationDashboard
