'use client'

import React, { useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Eye, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Activity,
  Focus,
  Timer,
  BarChart3
} from 'lucide-react'
import { useAttentionTracking, useGazeHeatmap } from '@/hooks/useGazeTracking'
import { type GazePoint, type AttentionMetrics } from '@/services/gazeTrackingService'

interface GazeTrackingDisplayProps {
  showHeatmap?: boolean
  showDetailedMetrics?: boolean
  className?: string
}

interface AttentionIndicatorProps {
  label: string
  value: number
  icon: React.ReactNode
  unit?: string
  colorThresholds?: { good: number; warning: number }
}

interface HeatmapCanvasProps {
  heatmapData: any
  width: number
  height: number
}

function AttentionIndicator({ 
  label, 
  value, 
  icon, 
  unit = '%',
  colorThresholds = { good: 0.7, warning: 0.4 }
}: AttentionIndicatorProps) {
  const getColor = () => {
    if (value >= colorThresholds.good) return 'text-green-500'
    if (value >= colorThresholds.warning) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getProgressColor = () => {
    if (value >= colorThresholds.good) return 'bg-green-500'
    if (value >= colorThresholds.warning) return 'bg-yellow-500'
    return 'bg-red-500'
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
    </div>
  )
}

function HeatmapCanvas({ heatmapData, width, height }: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !heatmapData || !heatmapData.points.length) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw heatmap points
    heatmapData.points.forEach((point: any) => {
      const x = point.x * width
      const y = point.y * height
      const intensity = point.intensity / heatmapData.maxIntensity
      
      // Create radial gradient for each point
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20)
      gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity * 0.8})`)
      gradient.addColorStop(0.5, `rgba(255, 255, 0, ${intensity * 0.4})`)
      gradient.addColorStop(1, `rgba(255, 255, 0, 0)`)
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, 20, 0, 2 * Math.PI)
      ctx.fill()
    })
  }, [heatmapData, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: 'multiply' }}
    />
  )
}

export function GazeTrackingDisplay({
  showHeatmap = false,
  showDetailedMetrics = false,
  className = ''
}: GazeTrackingDisplayProps) {
  const attention = useAttentionTracking()
  const heatmap = useGazeHeatmap()

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  if (attention.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{attention.error}</AlertDescription>
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
              <Eye className="h-5 w-5" />
              <span>Gaze Tracking</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {attention.isTracking ? (
                <Badge variant="default" className="bg-green-500">
                  <Activity className="h-3 w-3 mr-1 animate-pulse" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Eye className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Attention Metrics */}
      {attention.isTracking && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attention Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AttentionIndicator
              label="Focus Score"
              value={attention.focusScore}
              icon={<Focus className="h-4 w-4" />}
              colorThresholds={{ good: 0.8, warning: 0.6 }}
            />
            
            <AttentionIndicator
              label="Gaze Stability"
              value={attention.gazeStability}
              icon={<Target className="h-4 w-4" />}
              colorThresholds={{ good: 0.7, warning: 0.5 }}
            />
            
            <AttentionIndicator
              label="Screen Coverage"
              value={attention.screenCoverage}
              icon={<BarChart3 className="h-4 w-4" />}
              colorThresholds={{ good: 0.3, warning: 0.1 }}
            />

            {showDetailedMetrics && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Distractions</span>
                  </div>
                  <span className="text-sm font-bold">
                    {attention.distractionEvents}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Timer className="h-4 w-4" />
                    <span className="text-sm font-medium">Attention Span</span>
                  </div>
                  <span className="text-sm font-bold">
                    {formatDuration(attention.attentionMetrics.attentionSpan)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gaze Heatmap */}
      {showHeatmap && heatmap.heatmapData && heatmap.heatmapData.points.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gaze Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Screen Representation</p>
                </div>
              </div>
              <HeatmapCanvas
                heatmapData={heatmap.heatmapData}
                width={400}
                height={225}
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Areas of focus</span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <span>Low</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>High</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analytics */}
      {showDetailedMetrics && attention.isTracking && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detailed Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Focus Quality</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Sustained Attention</span>
                    <span>{Math.round(attention.focusScore * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gaze Consistency</span>
                    <span>{Math.round(attention.gazeStability * 100)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Engagement Patterns</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Screen Exploration</span>
                    <span>{Math.round(attention.screenCoverage * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Distraction Rate</span>
                    <span>{attention.distractionEvents}/min</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm mb-2">Recommendations</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {attention.focusScore < 0.6 && (
                  <p>• Try to maintain focus on the screen for longer periods</p>
                )}
                {attention.gazeStability < 0.5 && (
                  <p>• Reduce rapid eye movements for better stability</p>
                )}
                {attention.screenCoverage < 0.2 && (
                  <p>• Look at different areas of the screen more naturally</p>
                )}
                {attention.distractionEvents > 5 && (
                  <p>• Minimize looking away from the screen during the interview</p>
                )}
                {attention.focusScore >= 0.8 && attention.gazeStability >= 0.7 && (
                  <p>• Excellent focus and attention! Keep it up.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Tracking Message */}
      {!attention.isTracking && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">Gaze Tracking Inactive</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start the interview to begin tracking your attention and focus patterns.
              </p>
              <div className="text-xs text-muted-foreground">
                <p>Gaze tracking will provide insights on:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Focus and attention levels</li>
                  <li>Screen exploration patterns</li>
                  <li>Distraction detection</li>
                  <li>Engagement consistency</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default GazeTrackingDisplay
