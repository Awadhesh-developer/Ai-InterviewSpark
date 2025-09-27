'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Eye, 
  EyeOff, 
  Smile, 
  Frown, 
  Meh, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  User,
  Camera,
  Activity
} from 'lucide-react'
import { 
  useInterviewFacialAnalysis,
  type FacialAnalysisResult,
  type EmotionScores 
} from '@/hooks/useFacialAnalysis'

interface FacialAnalysisDisplayProps {
  videoElement: HTMLVideoElement | null
  showDetailedMetrics?: boolean
  className?: string
}

interface EmotionDisplayProps {
  emotions: EmotionScores
  showPercentages?: boolean
}

interface EngagementIndicatorProps {
  engagement: number
  label: string
  icon?: React.ReactNode
}

function EmotionDisplay({ emotions, showPercentages = false }: EmotionDisplayProps) {
  const emotionIcons = {
    happy: <Smile className="h-4 w-4 text-green-500" />,
    sad: <Frown className="h-4 w-4 text-blue-500" />,
    angry: <AlertCircle className="h-4 w-4 text-red-500" />,
    surprised: <Eye className="h-4 w-4 text-yellow-500" />,
    fearful: <AlertCircle className="h-4 w-4 text-purple-500" />,
    disgusted: <Frown className="h-4 w-4 text-orange-500" />,
    neutral: <Meh className="h-4 w-4 text-gray-500" />
  }

  const sortedEmotions = Object.entries(emotions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3) // Show top 3 emotions

  return (
    <div className="space-y-2">
      {sortedEmotions.map(([emotion, value]) => (
        <div key={emotion} className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {emotionIcons[emotion as keyof typeof emotionIcons]}
            <span className="text-sm capitalize">{emotion}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Progress value={value * 100} className="w-16 h-2" />
            {showPercentages && (
              <span className="text-xs text-muted-foreground w-8">
                {Math.round(value * 100)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function EngagementIndicator({ engagement, label, icon }: EngagementIndicatorProps) {
  const getEngagementColor = (value: number) => {
    if (value >= 0.8) return 'text-green-500'
    if (value >= 0.6) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getEngagementBg = (value: number) => {
    if (value >= 0.8) return 'bg-green-500'
    if (value >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Progress 
          value={engagement * 100} 
          className="w-20 h-2"
        />
        <span className={`text-sm font-medium ${getEngagementColor(engagement)}`}>
          {Math.round(engagement * 100)}%
        </span>
      </div>
    </div>
  )
}

export function FacialAnalysisDisplay({ 
  videoElement, 
  showDetailedMetrics = false,
  className = '' 
}: FacialAnalysisDisplayProps) {
  const analysis = useInterviewFacialAnalysis(videoElement)

  if (!analysis.isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading facial analysis...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (analysis.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{analysis.error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Facial Analysis</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {analysis.faceDetected ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Face Detected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <User className="h-3 w-3 mr-1" />
                  No Face
                </Badge>
              )}
              {analysis.isAnalyzing && (
                <Badge variant="outline">
                  <Activity className="h-3 w-3 mr-1 animate-pulse" />
                  Analyzing
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        {analysis.faceDetected && analysis.currentResult && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Confidence:</span>
                <span className="ml-2">{Math.round(analysis.confidence * 100)}%</span>
              </div>
              <div>
                <span className="font-medium">Dominant Emotion:</span>
                <span className="ml-2 capitalize">{analysis.dominantEmotion}</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Eye Contact & Engagement */}
      {analysis.faceDetected && analysis.currentResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Eye Contact & Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {analysis.isLookingAtCamera ? (
                  <Eye className="h-5 w-5 text-green-500" />
                ) : (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                )}
                <span className="font-medium">
                  {analysis.isLookingAtCamera ? 'Looking at Camera' : 'Looking Away'}
                </span>
              </div>
              <Badge variant={analysis.isLookingAtCamera ? "default" : "secondary"}>
                {analysis.isLookingAtCamera ? 'Good' : 'Improve'}
              </Badge>
            </div>

            <EngagementIndicator
              engagement={analysis.overallEngagement}
              label="Overall Engagement"
              icon={<TrendingUp className="h-4 w-4" />}
            />

            {analysis.currentResult.engagement && (
              <>
                <EngagementIndicator
                  engagement={analysis.currentResult.engagement.attentiveness}
                  label="Attentiveness"
                  icon={<Eye className="h-4 w-4" />}
                />
                <EngagementIndicator
                  engagement={analysis.currentResult.engagement.professionalPresence}
                  label="Professional Presence"
                  icon={<User className="h-4 w-4" />}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Emotions */}
      {analysis.faceDetected && analysis.currentResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Emotional Expression</CardTitle>
          </CardHeader>
          <CardContent>
            <EmotionDisplay 
              emotions={analysis.currentResult.emotions} 
              showPercentages={showDetailedMetrics}
            />
          </CardContent>
        </Card>
      )}

      {/* Head Pose */}
      {analysis.faceDetected && analysis.currentResult && showDetailedMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Head Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Well Positioned:</span>
              <Badge variant={analysis.currentResult.headPose.isWellPositioned ? "default" : "secondary"}>
                {analysis.currentResult.headPose.isWellPositioned ? 'Yes' : 'No'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Yaw:</span>
                <div className="font-mono">
                  {Math.round(analysis.currentResult.headPose.yaw)}°
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Pitch:</span>
                <div className="font-mono">
                  {Math.round(analysis.currentResult.headPose.pitch)}°
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Roll:</span>
                <div className="font-mono">
                  {Math.round(analysis.currentResult.headPose.roll)}°
                </div>
              </div>
            </div>

            <EngagementIndicator
              engagement={analysis.currentResult.headPose.stability}
              label="Head Stability"
              icon={<Activity className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      {analysis.summary && showDetailedMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <EngagementIndicator
              engagement={analysis.summary.averageEngagement}
              label="Average Engagement"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Eye Contact Time:</span>
              <span className="text-sm font-medium">
                {Math.round(analysis.summary.eyeContactPercentage)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Face Detection Rate:</span>
              <span className="text-sm font-medium">
                {Math.round(analysis.summary.faceDetectionRate)}%
              </span>
            </div>

            <EngagementIndicator
              engagement={analysis.summary.professionalPresence}
              label="Professional Presence"
              icon={<User className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
      )}

      {/* No Face Detected Message */}
      {!analysis.faceDetected && analysis.isAnalyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No Face Detected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please ensure you're visible in the camera frame for facial analysis.
              </p>
              <div className="text-xs text-muted-foreground">
                <p>Tips for better detection:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Face the camera directly</li>
                  <li>Ensure good lighting</li>
                  <li>Remove any obstructions</li>
                  <li>Stay within the camera frame</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FacialAnalysisDisplay
