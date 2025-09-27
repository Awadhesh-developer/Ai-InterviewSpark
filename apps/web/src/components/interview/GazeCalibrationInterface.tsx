'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  Target, 
  CheckCircle, 
  AlertCircle,
  RotateCcw,
  Play,
  Crosshair
} from 'lucide-react'
import { useGazeCalibration } from '@/hooks/useGazeTracking'
import { type EyeData } from '@/services/gazeTrackingService'

interface GazeCalibrationInterfaceProps {
  onCalibrationComplete?: (accuracy: number) => void
  onCalibrationSkipped?: () => void
  allowSkip?: boolean
  className?: string
}

interface CalibrationPoint {
  x: number
  y: number
  id: number
  completed: boolean
}

const CALIBRATION_POINTS: CalibrationPoint[] = [
  { x: 0.1, y: 0.1, id: 1, completed: false }, // Top-left
  { x: 0.5, y: 0.1, id: 2, completed: false }, // Top-center
  { x: 0.9, y: 0.1, id: 3, completed: false }, // Top-right
  { x: 0.1, y: 0.5, id: 4, completed: false }, // Middle-left
  { x: 0.5, y: 0.5, id: 5, completed: false }, // Center
  { x: 0.9, y: 0.5, id: 6, completed: false }, // Middle-right
  { x: 0.1, y: 0.9, id: 7, completed: false }, // Bottom-left
  { x: 0.5, y: 0.9, id: 8, completed: false }, // Bottom-center
  { x: 0.9, y: 0.9, id: 9, completed: false }, // Bottom-right
]

export function GazeCalibrationInterface({
  onCalibrationComplete,
  onCalibrationSkipped,
  allowSkip = false,
  className = ''
}: GazeCalibrationInterfaceProps) {
  const calibration = useGazeCalibration()
  
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>(CALIBRATION_POINTS)
  const [currentPointIndex, setCurrentPointIndex] = useState(0)
  const [isCollectingPoint, setIsCollectingPoint] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [countdown, setCountdown] = useState(0)

  // Mock eye data for demonstration - in real implementation, this would come from facial analysis
  const getMockEyeData = useCallback((): { left: EyeData; right: EyeData } => {
    return {
      left: {
        center: { x: 100, y: 100 },
        landmarks: [],
        isOpen: true,
        aspectRatio: 0.3,
        pupilPosition: { x: 100, y: 100 }
      },
      right: {
        center: { x: 200, y: 100 },
        landmarks: [],
        isOpen: true,
        aspectRatio: 0.3,
        pupilPosition: { x: 200, y: 100 }
      }
    }
  }, [])

  const startCalibration = useCallback(async () => {
    try {
      setShowInstructions(false)
      setCurrentPointIndex(0)
      setCalibrationPoints(CALIBRATION_POINTS.map(p => ({ ...p, completed: false })))
      await calibration.startCalibration()
    } catch (error) {
      console.error('Failed to start calibration:', error)
    }
  }, [calibration])

  const collectCalibrationPoint = useCallback(async (point: CalibrationPoint) => {
    if (isCollectingPoint) return

    setIsCollectingPoint(true)
    setCountdown(3)

    // Countdown before collecting point
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Wait for countdown to complete
    await new Promise(resolve => setTimeout(resolve, 3000))

    try {
      // In real implementation, get actual eye data from facial analysis
      const eyeData = getMockEyeData()
      await calibration.addCalibrationPoint(point.x, point.y, eyeData)

      // Mark point as completed
      setCalibrationPoints(prev => 
        prev.map(p => p.id === point.id ? { ...p, completed: true } : p)
      )

      // Move to next point
      if (currentPointIndex < calibrationPoints.length - 1) {
        setCurrentPointIndex(prev => prev + 1)
      }

    } catch (error) {
      console.error('Failed to collect calibration point:', error)
    } finally {
      setIsCollectingPoint(false)
    }
  }, [isCollectingPoint, currentPointIndex, calibrationPoints.length, calibration, getMockEyeData])

  const restartCalibration = useCallback(() => {
    setShowInstructions(true)
    setCurrentPointIndex(0)
    setCalibrationPoints(CALIBRATION_POINTS.map(p => ({ ...p, completed: false })))
    setIsCollectingPoint(false)
    setCountdown(0)
  }, [])

  const skipCalibration = useCallback(() => {
    onCalibrationSkipped?.()
  }, [onCalibrationSkipped])

  // Handle calibration completion
  useEffect(() => {
    if (calibration.isCalibrated && calibration.calibrationAccuracy > 0) {
      onCalibrationComplete?.(calibration.calibrationAccuracy)
    }
  }, [calibration.isCalibrated, calibration.calibrationAccuracy, onCalibrationComplete])

  // Auto-collect current point when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && isCollectingPoint && !showInstructions) {
      const currentPoint = calibrationPoints[currentPointIndex]
      if (currentPoint && !currentPoint.completed) {
        // Point collection happens in the countdown effect
      }
    }
  }, [countdown, isCollectingPoint, showInstructions, calibrationPoints, currentPointIndex])

  const getCurrentPoint = () => calibrationPoints[currentPointIndex]
  const getCompletedPoints = () => calibrationPoints.filter(p => p.completed).length

  if (calibration.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{calibration.error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center space-x-4">
            <Button onClick={restartCalibration} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            {allowSkip && (
              <Button onClick={skipCalibration} variant="ghost">
                Skip Calibration
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (calibration.isCalibrated) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Calibration Complete!</h3>
            <p className="text-muted-foreground mb-4">
              Your gaze tracking has been calibrated with {Math.round(calibration.calibrationAccuracy * 100)}% accuracy.
            </p>
            <Badge variant="default" className="bg-green-500">
              <Eye className="h-3 w-3 mr-1" />
              Ready for Eye Tracking
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (showInstructions) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Gaze Tracking Calibration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Eye className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Calibrate Your Gaze Tracking</h3>
            <p className="text-muted-foreground mb-6">
              To provide accurate eye contact feedback, we need to calibrate your gaze tracking. 
              This process takes about 1 minute.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Instructions:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Look directly at each calibration point when it appears</li>
              <li>Keep your head still and only move your eyes</li>
              <li>Wait for the countdown to complete at each point</li>
              <li>Ensure good lighting on your face</li>
              <li>Sit at a comfortable distance from your screen</li>
            </ul>
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={startCalibration} size="lg">
              <Play className="h-4 w-4 mr-2" />
              Start Calibration
            </Button>
            {allowSkip && (
              <Button onClick={skipCalibration} variant="outline" size="lg">
                Skip for Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Calibrating Gaze Tracking</span>
          </CardTitle>
          <Badge variant="outline">
            {getCompletedPoints()} / {calibrationPoints.length}
          </Badge>
        </div>
        <Progress value={calibration.calibrationProgress} className="w-full" />
      </CardHeader>
      
      <CardContent>
        {/* Calibration Area */}
        <div className="relative bg-gray-50 rounded-lg h-96 mb-6 overflow-hidden">
          {/* Calibration Points */}
          {calibrationPoints.map((point, index) => {
            const isCurrentPoint = index === currentPointIndex
            const isCompleted = point.completed
            
            return (
              <div
                key={point.id}
                className={`absolute w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isCurrentPoint
                    ? 'bg-primary border-primary scale-150 animate-pulse'
                    : isCompleted
                    ? 'bg-green-500 border-green-500'
                    : 'bg-gray-300 border-gray-400'
                }`}
                style={{
                  left: `calc(${point.x * 100}% - 16px)`,
                  top: `calc(${point.y * 100}% - 16px)`
                }}
                onClick={() => !isCompleted && collectCalibrationPoint(point)}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4 text-white" />
                ) : isCurrentPoint ? (
                  <Crosshair className="h-4 w-4 text-white" />
                ) : (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            )
          })}

          {/* Countdown Overlay */}
          {countdown > 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-6xl font-bold animate-pulse">
                {countdown}
              </div>
            </div>
          )}

          {/* Instructions Overlay */}
          {!isCollectingPoint && getCurrentPoint() && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-white rounded-lg px-4 py-2 shadow-lg">
                <p className="text-sm text-center">
                  Look at the highlighted point and click it
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {isCollectingPoint 
              ? `Collecting point ${currentPointIndex + 1}...`
              : `Click on point ${currentPointIndex + 1} when ready`
            }
          </p>
          
          {calibration.isCalibrating && (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm">Calibrating...</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4 mt-6">
          <Button onClick={restartCalibration} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart
          </Button>
          {allowSkip && (
            <Button onClick={skipCalibration} variant="ghost" size="sm">
              Skip Calibration
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default GazeCalibrationInterface
