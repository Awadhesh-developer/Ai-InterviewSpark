'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Hand,
  Zap,
  Target,
  Users,
  Shield,
  Heart,
  Brain
} from 'lucide-react'
import { 
  useInterviewBodyLanguage,
  type BodyLanguageResult,
  type PostureMetrics,
  type GestureData,
  type MovementPatterns,
  type ProfessionalPresence
} from '@/hooks/useBodyLanguageAnalysis'

interface BodyLanguageDisplayProps {
  videoElement: HTMLVideoElement | null
  showDetailedMetrics?: boolean
  className?: string
}

interface MetricIndicatorProps {
  label: string
  value: number
  icon: React.ReactNode
  unit?: string
  colorThresholds?: { good: number; warning: number }
  description?: string
}

interface PostureVisualizationProps {
  posture: PostureMetrics
}

interface GestureVisualizationProps {
  gestures: GestureData
}

function MetricIndicator({ 
  label, 
  value, 
  icon, 
  unit = '%',
  colorThresholds = { good: 0.7, warning: 0.4 },
  description
}: MetricIndicatorProps) {
  const getColor = () => {
    if (value >= colorThresholds.good) return 'text-green-500'
    if (value >= colorThresholds.warning) return 'text-yellow-500'
    return 'text-red-500'
  }

  const displayValue = unit === '%' ? Math.round(value * 100) : Math.round(value)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`text-sm font-bold ${getColor()}`}>
          {displayValue}{unit}
        </span>
      </div>
      <Progress 
        value={unit === '%' ? value * 100 : (value / 10) * 100} 
        className="h-2"
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

function PostureVisualization({ posture }: PostureVisualizationProps) {
  const getPostureStatus = () => {
    if (posture.overallPosture >= 0.8) return { status: 'Excellent', color: 'text-green-500' }
    if (posture.overallPosture >= 0.6) return { status: 'Good', color: 'text-yellow-500' }
    return { status: 'Needs Improvement', color: 'text-red-500' }
  }

  const postureStatus = getPostureStatus()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Overall Posture</h4>
        <Badge variant="outline" className={postureStatus.color}>
          {postureStatus.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricIndicator
          label="Shoulder Alignment"
          value={posture.shoulderAlignment}
          icon={<Target className="h-4 w-4" />}
          description="How level your shoulders are"
        />
        
        <MetricIndicator
          label="Spine Alignment"
          value={posture.spineAlignment}
          icon={<Activity className="h-4 w-4" />}
          description="Straightness of your posture"
        />
        
        <MetricIndicator
          label="Head Position"
          value={posture.headPosition}
          icon={<Brain className="h-4 w-4" />}
          description="Head positioning over shoulders"
        />
        
        <MetricIndicator
          label="Tension Level"
          value={1 - posture.shoulderTension}
          icon={<Zap className="h-4 w-4" />}
          description="Relaxation in shoulders"
          colorThresholds={{ good: 0.6, warning: 0.3 }}
        />
      </div>

      {posture.leanDirection !== 'centered' && (
        <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Leaning {posture.leanDirection} ({Math.round(posture.leanAngle)}°)
          </span>
        </div>
      )}
    </div>
  )
}

function GestureVisualization({ gestures }: GestureVisualizationProps) {
  const getGestureTypeIcon = () => {
    switch (gestures.gestureType) {
      case 'pointing': return <Target className="h-4 w-4 text-blue-500" />
      case 'open_palm': return <Hand className="h-4 w-4 text-green-500" />
      case 'descriptive': return <Activity className="h-4 w-4 text-purple-500" />
      case 'neutral': return <User className="h-4 w-4 text-gray-500" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-400" />
    }
  }

  const getGestureDescription = () => {
    switch (gestures.gestureType) {
      case 'pointing': return 'Directional gestures'
      case 'open_palm': return 'Open, welcoming gestures'
      case 'descriptive': return 'Explanatory hand movements'
      case 'neutral': return 'Relaxed hand position'
      default: return 'Gesture not detected'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Gesture Analysis</h4>
        <div className="flex items-center space-x-2">
          {getGestureTypeIcon()}
          <span className="text-sm capitalize">{gestures.gestureType.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="space-y-3">
        <MetricIndicator
          label="Gesture Intensity"
          value={gestures.gestureIntensity}
          icon={<Zap className="h-4 w-4" />}
          description="How animated your gestures are"
        />
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Gesture Frequency</span>
          <span className="text-sm font-bold">
            {Math.round(gestures.gestureFrequency)}/min
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Hand Visibility</span>
          <div className="flex space-x-2">
            <Badge variant={gestures.handVisibility.left ? "default" : "secondary"}>
              Left {gestures.handVisibility.left ? '✓' : '✗'}
            </Badge>
            <Badge variant={gestures.handVisibility.right ? "default" : "secondary"}>
              Right {gestures.handVisibility.right ? '✓' : '✗'}
            </Badge>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{getGestureDescription()}</p>
    </div>
  )
}

export function BodyLanguageDisplay({ 
  videoElement, 
  showDetailedMetrics = false,
  className = '' 
}: BodyLanguageDisplayProps) {
  const bodyLanguage = useInterviewBodyLanguage(videoElement)

  if (!bodyLanguage.isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading body language analysis...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (bodyLanguage.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{bodyLanguage.error}</AlertDescription>
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
              <User className="h-5 w-5" />
              <span>Body Language Analysis</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {bodyLanguage.poseDetected ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Pose Detected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <User className="h-3 w-3 mr-1" />
                  No Pose
                </Badge>
              )}
              {bodyLanguage.isAnalyzing && (
                <Badge variant="outline">
                  <Activity className="h-3 w-3 mr-1 animate-pulse" />
                  Analyzing
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        {bodyLanguage.poseDetected && bodyLanguage.currentResult && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Pose Quality:</span>
                <span className="ml-2">{Math.round(bodyLanguage.poseQuality * 100)}%</span>
              </div>
              <div>
                <span className="font-medium">Overall Posture:</span>
                <span className="ml-2">{Math.round(bodyLanguage.overallPosture * 100)}%</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Professional Presence */}
      {bodyLanguage.poseDetected && bodyLanguage.currentResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Professional Presence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <MetricIndicator
                label="Confidence"
                value={bodyLanguage.professionalConfidence}
                icon={<Shield className="h-4 w-4" />}
                description="Projected confidence level"
              />
              
              <MetricIndicator
                label="Engagement"
                value={bodyLanguage.engagementLevel}
                icon={<TrendingUp className="h-4 w-4" />}
                description="Body language engagement"
              />
              
              <MetricIndicator
                label="Authority"
                value={bodyLanguage.currentResult.professionalPresence.authority}
                icon={<Users className="h-4 w-4" />}
                description="Authoritative presence"
              />
              
              <MetricIndicator
                label="Approachability"
                value={bodyLanguage.currentResult.professionalPresence.approachability}
                icon={<Heart className="h-4 w-4" />}
                description="Approachable demeanor"
              />
            </div>

            {bodyLanguage.nervousBehavior > 0.6 && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  High nervousness detected - try to relax your posture
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Posture Analysis */}
      {bodyLanguage.poseDetected && bodyLanguage.currentResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Posture Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <PostureVisualization posture={bodyLanguage.currentResult.posture} />
          </CardContent>
        </Card>
      )}

      {/* Gesture Analysis */}
      {bodyLanguage.poseDetected && bodyLanguage.currentResult && showDetailedMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gesture Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <GestureVisualization gestures={bodyLanguage.currentResult.gestures} />
          </CardContent>
        </Card>
      )}

      {/* Movement Patterns */}
      {bodyLanguage.poseDetected && bodyLanguage.currentResult && showDetailedMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Movement Patterns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricIndicator
              label="Body Stability"
              value={bodyLanguage.bodyStability}
              icon={<Target className="h-4 w-4" />}
              description="How stable your position is"
            />
            
            <MetricIndicator
              label="Movement Activity"
              value={bodyLanguage.currentResult.movement.overallMovement}
              icon={<Activity className="h-4 w-4" />}
              description="Overall body movement"
              colorThresholds={{ good: 0.3, warning: 0.1 }}
            />
            
            <MetricIndicator
              label="Fidgeting Level"
              value={1 - bodyLanguage.currentResult.movement.fidgeting}
              icon={<Zap className="h-4 w-4" />}
              description="Nervous movement detection"
            />
            
            <MetricIndicator
              label="Movement Rhythm"
              value={bodyLanguage.currentResult.movement.rhythmicMovement}
              icon={<TrendingUp className="h-4 w-4" />}
              description="Natural vs erratic movement"
            />
          </CardContent>
        </Card>
      )}

      {/* Session Summary */}
      {bodyLanguage.summary && showDetailedMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Average Posture:</span>
                <span className="ml-2">{Math.round(bodyLanguage.summary.averagePosture * 100)}%</span>
              </div>
              <div>
                <span className="font-medium">Pose Detection Rate:</span>
                <span className="ml-2">{Math.round(bodyLanguage.summary.poseDetectionRate)}%</span>
              </div>
              <div>
                <span className="font-medium">Gesture Activity:</span>
                <span className="ml-2">{Math.round(bodyLanguage.summary.gestureFrequency)}/min</span>
              </div>
              <div>
                <span className="font-medium">Stability Score:</span>
                <span className="ml-2">{Math.round(bodyLanguage.summary.stabilityScore * 100)}%</span>
              </div>
            </div>

            <div className="pt-3 border-t">
              <h4 className="font-medium text-sm mb-2">Recommendations</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {bodyLanguage.overallPosture < 0.6 && (
                  <p>• Improve your posture by sitting up straight and aligning your shoulders</p>
                )}
                {bodyLanguage.bodyStability < 0.5 && (
                  <p>• Try to maintain a more stable position to appear more confident</p>
                )}
                {bodyLanguage.gestureActivity < 0.2 && (
                  <p>• Use more natural hand gestures to enhance your communication</p>
                )}
                {bodyLanguage.nervousBehavior > 0.6 && (
                  <p>• Take deep breaths and try to relax your body language</p>
                )}
                {bodyLanguage.overallPosture >= 0.8 && bodyLanguage.bodyStability >= 0.7 && (
                  <p>• Excellent body language! You're projecting confidence and professionalism.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Pose Detected Message */}
      {!bodyLanguage.poseDetected && bodyLanguage.isAnalyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No Body Pose Detected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please ensure your upper body is visible in the camera frame for body language analysis.
              </p>
              <div className="text-xs text-muted-foreground">
                <p>Tips for better detection:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Sit back so your shoulders and arms are visible</li>
                  <li>Ensure good lighting on your upper body</li>
                  <li>Avoid wearing clothing that blends with the background</li>
                  <li>Keep your hands visible when gesturing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default BodyLanguageDisplay
