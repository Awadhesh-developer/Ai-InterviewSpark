'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  BarChart3,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Layers,
  MemoryStick,
  Network,
  Rocket,
  Server,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Wifi,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Gauge,
  LineChart,
  PieChart,
  BarChart,
  Monitor,
  Cloud,
  Cog,
  RefreshCw,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { useEnterprisePerformanceOptimization } from '@/hooks/usePerformanceOptimization'

interface PerformanceOptimizationDashboardProps {
  className?: string
  showPerformanceMetrics?: boolean
  showScalabilityAnalysis?: boolean
  showRealTimeAnalytics?: boolean
  showEnterpriseIntegration?: boolean
  showOptimizationRecommendations?: boolean
}

interface MetricCardProps {
  title: string
  value: number | string
  unit?: string
  icon: React.ReactNode
  color?: string
  trend?: number
  grade?: string
}

interface StatusCardProps {
  title: string
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  value: number
  description: string
  icon: React.ReactNode
}

function MetricCard({ title, value, unit = '', icon, color = 'blue', trend, grade }: MetricCardProps) {
  const getColorClass = () => {
    if (grade) {
      switch (grade) {
        case 'A': return 'text-green-600 bg-green-50 border-green-200'
        case 'B': return 'text-blue-600 bg-blue-50 border-blue-200'
        case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        case 'D': return 'text-orange-600 bg-orange-50 border-orange-200'
        case 'F': return 'text-red-600 bg-red-50 border-red-200'
      }
    }
    
    if (typeof value === 'number') {
      if (value > 0.9) return 'text-green-600 bg-green-50 border-green-200'
      if (value > 0.7) return 'text-blue-600 bg-blue-50 border-blue-200'
      if (value > 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      return 'text-red-600 bg-red-50 border-red-200'
    }
    
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getTrendIcon = () => {
    if (trend === undefined) return null
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-green-500" />
    if (trend < 0) return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
    return <div className="h-3 w-3" />
  }

  return (
    <Card className={`${getColorClass()} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
          </div>
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            {grade && (
              <Badge variant="outline" className="text-xs">
                Grade {grade}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="text-2xl font-bold mb-1">
          {typeof value === 'number' ? 
            (value < 1 ? `${Math.round(value * 100)}%` : value.toLocaleString()) : 
            value
          }
          {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
        </div>
        
        {typeof value === 'number' && value <= 1 && (
          <Progress value={value * 100} className="mt-2" />
        )}
      </CardContent>
    </Card>
  )
}

function StatusCard({ title, status, value, description, icon }: StatusCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card className={`${getStatusColor()} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
          </div>
          {getStatusIcon()}
        </div>
        
        <div className="text-2xl font-bold mb-1">
          {Math.round(value * 100)}%
        </div>
        
        <div className="text-xs text-muted-foreground">
          {description}
        </div>
        
        <Progress value={value * 100} className="mt-2" />
      </CardContent>
    </Card>
  )
}

export function PerformanceOptimizationDashboard({
  className = '',
  showPerformanceMetrics = true,
  showScalabilityAnalysis = true,
  showRealTimeAnalytics = true,
  showEnterpriseIntegration = true,
  showOptimizationRecommendations = true
}: PerformanceOptimizationDashboardProps) {
  const performance = useEnterprisePerformanceOptimization()

  if (!performance.isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Rocket className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading Performance Optimization...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (performance.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{performance.error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Gauge className="h-5 w-5" />
              <span>Performance Overview</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                Overall Grade: {performance.getOverallGrade()}
              </Badge>
              <Badge variant="outline">
                Confidence: {Math.round(performance.overallConfidence * 100)}%
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => performance.runComprehensiveAnalysis()}
                disabled={performance.isAnalyzing}
              >
                {performance.isAnalyzing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {performance.isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusCard
              title="Performance Health"
              status={performance.isPerformanceHealthy() ? 'healthy' : 'warning'}
              value={performance.performanceScore}
              description="Overall system performance"
              icon={<Activity className="h-4 w-4" />}
            />
            
            <StatusCard
              title="Scalability Score"
              status={performance.isScalabilityOptimal() ? 'healthy' : 'warning'}
              value={performance.scalabilityScore}
              description="Architecture scalability"
              icon={<Layers className="h-4 w-4" />}
            />
            
            <StatusCard
              title="System Health"
              status={performance.systemHealthScore > 0.9 ? 'healthy' : 'warning'}
              value={performance.systemHealthScore}
              description="Overall system health"
              icon={<Shield className="h-4 w-4" />}
            />
            
            <StatusCard
              title="Integration Health"
              status={performance.getIntegrationHealth() > 0.9 ? 'healthy' : 'warning'}
              value={performance.getIntegrationHealth()}
              description="Enterprise integrations"
              icon={<Globe className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {showPerformanceMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>System Resources</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  title="CPU Usage"
                  value={performance.getCurrentCPUUsage()}
                  icon={<Cpu className="h-4 w-4" />}
                  grade={performance.getCurrentCPUUsage() < 0.8 ? 'A' : 'C'}
                />
                
                <MetricCard
                  title="Memory Usage"
                  value={performance.getCurrentMemoryUsage()}
                  icon={<MemoryStick className="h-4 w-4" />}
                  grade={performance.getCurrentMemoryUsage() < 0.85 ? 'A' : 'C'}
                />
                
                <MetricCard
                  title="Disk Usage"
                  value={performance.getCurrentDiskUsage()}
                  icon={<HardDrive className="h-4 w-4" />}
                  grade={performance.getCurrentDiskUsage() < 0.9 ? 'A' : 'C'}
                />
                
                <MetricCard
                  title="Network Usage"
                  value={performance.getCurrentNetworkUsage()}
                  icon={<Network className="h-4 w-4" />}
                  grade={performance.getCurrentNetworkUsage() < 0.8 ? 'A' : 'C'}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Performance Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  title="Response Time"
                  value={performance.getAverageResponseTime()}
                  unit="ms"
                  icon={<Clock className="h-4 w-4" />}
                  grade={performance.getAverageResponseTime() < 200 ? 'A' : 'C'}
                />
                
                <MetricCard
                  title="Throughput"
                  value={performance.getThroughput()}
                  unit="req/s"
                  icon={<Zap className="h-4 w-4" />}
                  grade={performance.getThroughput() > 100 ? 'A' : 'C'}
                />
                
                <MetricCard
                  title="Error Rate"
                  value={performance.getErrorRate()}
                  icon={<AlertTriangle className="h-4 w-4" />}
                  grade={performance.getErrorRate() < 0.01 ? 'A' : 'F'}
                />
                
                <MetricCard
                  title="Availability"
                  value={performance.getAvailability()}
                  icon={<CheckCircle className="h-4 w-4" />}
                  grade={performance.getAvailability() > 0.99 ? 'A' : 'C'}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-Time Analytics */}
      {showRealTimeAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LineChart className="h-5 w-5" />
              <span>Real-Time Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {performance.getActiveUsers()}
                </div>
                <div className="text-sm text-blue-800">Active Users</div>
                <Users className="h-6 w-6 mx-auto mt-2 text-blue-500" />
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {performance.getConcurrentInterviews()}
                </div>
                <div className="text-sm text-green-800">Live Interviews</div>
                <Activity className="h-6 w-6 mx-auto mt-2 text-green-500" />
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(performance.getUserSatisfaction() * 100)}%
                </div>
                <div className="text-sm text-purple-800">User Satisfaction</div>
                <Target className="h-6 w-6 mx-auto mt-2 text-purple-500" />
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {performance.getActiveIntegrations()}
                </div>
                <div className="text-sm text-orange-800">Active Integrations</div>
                <Wifi className="h-6 w-6 mx-auto mt-2 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scalability Analysis */}
      {showScalabilityAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cloud className="h-5 w-5" />
                <span>Scalability Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Scalability Score:</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={performance.getScalabilityScore() * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">
                      {Math.round(performance.getScalabilityScore() * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Max Throughput:</span>
                  <span className="text-sm font-medium">
                    {performance.getMaxThroughput().toLocaleString()} req/s
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Max Concurrent Users:</span>
                  <span className="text-sm font-medium">
                    {performance.getMaxConcurrentUsers().toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Architecture Grade:</span>
                  <Badge variant="outline">
                    {performance.getScalabilityGrade()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Enterprise Integration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Integration Health:</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={performance.getIntegrationHealth() * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">
                      {Math.round(performance.getIntegrationHealth() * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Integrations:</span>
                  <span className="text-sm font-medium">
                    {performance.getActiveIntegrations()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sync Operations:</span>
                  <span className="text-sm font-medium">
                    {performance.getSyncOperations()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">System Health Grade:</span>
                  <Badge variant="outline">
                    {performance.getSystemHealthGrade()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Optimization Recommendations */}
      {showOptimizationRecommendations && performance.needsOptimization() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-600">
              <Settings className="h-5 w-5" />
              <span>Optimization Recommendations</span>
              <Badge variant="destructive">
                {performance.getOptimizationPriority()} Priority
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performance.getImmediateOptimizations().length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span>Immediate Actions:</span>
                  </h4>
                  <ul className="space-y-1">
                    {performance.getImmediateOptimizations().map((opt, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                        <span className="text-sm">{opt.optimization}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {performance.getShortTermOptimizations().length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Short-term Improvements:</span>
                  </h4>
                  <ul className="space-y-1">
                    {performance.getShortTermOptimizations().map((opt, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        <span className="text-sm">{opt.optimization}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {performance.getLongTermOptimizations().length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>Strategic Initiatives:</span>
                  </h4>
                  <ul className="space-y-1">
                    {performance.getLongTermOptimizations().map((opt, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                        <span className="text-sm">{opt.optimization}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Issues Alert */}
      {performance.hasPerformanceIssues() && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Performance issues detected! Response time: {performance.getAverageResponseTime()}ms, 
            Error rate: {Math.round(performance.getErrorRate() * 100)}%. 
            Immediate optimization recommended.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cog className="h-5 w-5" />
            <span>Performance Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => performance.optimizePerformance()}
              disabled={performance.isOptimizing}
              variant="default"
            >
              {performance.isOptimizing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Rocket className="h-4 w-4 mr-2" />
              )}
              Optimize Performance
            </Button>
            
            <Button
              onClick={() => performance.analyzeScalability()}
              disabled={performance.isAnalyzing}
              variant="outline"
            >
              <Layers className="h-4 w-4 mr-2" />
              Analyze Scalability
            </Button>
            
            <Button
              onClick={() => performance.analyzeRealTime()}
              disabled={performance.isAnalyzing}
              variant="outline"
            >
              <LineChart className="h-4 w-4 mr-2" />
              Real-time Analytics
            </Button>
            
            <Button
              onClick={() => performance.integrateEnterprise()}
              disabled={performance.isAnalyzing}
              variant="outline"
            >
              <Globe className="h-4 w-4 mr-2" />
              Check Integrations
            </Button>
            
            <Button
              onClick={() => performance.clearAllHistory()}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart className="h-5 w-5" />
            <span>Analysis Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {performance.performanceHistory.length}
              </div>
              <div className="text-blue-800">Performance Analyses</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {performance.scalabilityHistory.length}
              </div>
              <div className="text-green-800">Scalability Analyses</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {performance.analyticsHistory.length}
              </div>
              <div className="text-purple-800">Analytics Reports</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {performance.integrationHistory.length}
              </div>
              <div className="text-orange-800">Integration Checks</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceOptimizationDashboard
