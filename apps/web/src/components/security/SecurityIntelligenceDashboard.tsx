'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Brain,
  Target,
  Activity,
  Users,
  Globe,
  Zap,
  Search,
  BarChart3,
  Clock
} from 'lucide-react'
import SecurityIntelligencePlatform, { 
  type SecurityIntelligenceResult, 
  type IntelligenceOverview,
  type ThreatIntelligence,
  type BehavioralAnalytics,
  type ThreatIndicator,
  type ThreatActor,
  type EmergingThreat
} from '@/services/securityIntelligencePlatform'

interface SecurityIntelligenceDashboardProps {
  className?: string
}

const SecurityIntelligenceDashboard: React.FC<SecurityIntelligenceDashboardProps> = ({ className }) => {
  const [intelligencePlatform] = useState(() => new SecurityIntelligencePlatform())
  const [intelligenceResult, setIntelligenceResult] = useState<SecurityIntelligenceResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeIntelligence()
  }, [])

  const initializeIntelligence = async () => {
    try {
      setIsLoading(true)
      await intelligencePlatform.initialize()
      const result = await intelligencePlatform.generateIntelligenceReport()
      setIntelligenceResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize security intelligence platform')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshIntelligence = async () => {
    try {
      setIsLoading(true)
      const result = await intelligencePlatform.generateIntelligenceReport()
      setIntelligenceResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh intelligence data')
    } finally {
      setIsLoading(false)
    }
  }

  const getThreatLevelColor = (level: number) => {
    if (level >= 80) return 'text-red-600 bg-red-100'
    if (level >= 60) return 'text-orange-600 bg-orange-100'
    if (level >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Initializing Security Intelligence Platform...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Security Intelligence Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={initializeIntelligence} className="mt-4">
          Retry Initialization
        </Button>
      </div>
    )
  }

  if (!intelligenceResult) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>No Intelligence Data</AlertTitle>
          <AlertDescription>Security intelligence data is not available.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { intelligenceOverview, threatIntelligence, behavioralAnalytics, confidence } = intelligenceResult

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Intelligence Dashboard</h1>
          <p className="text-gray-600">Advanced threat intelligence and behavioral analytics platform</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            Confidence: {Math.round(confidence * 100)}%
          </Badge>
          <Button onClick={refreshIntelligence} disabled={isLoading}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Intelligence Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {intelligenceOverview.overallThreatLevel}%
            </div>
            <Progress 
              value={intelligenceOverview.overallThreatLevel} 
              className="mt-2"
            />
            <Badge className={`mt-2 ${getThreatLevelColor(intelligenceOverview.overallThreatLevel)}`}>
              {intelligenceOverview.overallThreatLevel >= 80 ? 'CRITICAL' :
               intelligenceOverview.overallThreatLevel >= 60 ? 'HIGH' :
               intelligenceOverview.overallThreatLevel >= 40 ? 'MEDIUM' : 'LOW'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intelligence Quality</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(intelligenceOverview.intelligenceQuality * 100)}%
            </div>
            <Progress 
              value={intelligenceOverview.intelligenceQuality * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Data sources: {intelligenceOverview.dataSourcesActive}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threat Indicators</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {intelligenceOverview.highConfidenceIndicators.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              High confidence / {intelligenceOverview.totalIndicators.toLocaleString()} total
            </p>
            <Progress 
              value={(intelligenceOverview.highConfidenceIndicators / intelligenceOverview.totalIndicators) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Threats</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {intelligenceOverview.recentThreats}
            </div>
            <p className="text-xs text-muted-foreground">
              Predicted: {intelligenceOverview.predictedThreats}
            </p>
            {intelligenceOverview.intelligenceGaps.length > 0 && (
              <div className="flex items-center mt-2 text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {intelligenceOverview.intelligenceGaps.length} intelligence gaps
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Gaps Alert */}
      {intelligenceOverview.intelligenceGaps.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Intelligence Gaps Identified</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              {intelligenceOverview.intelligenceGaps.slice(0, 2).map((gap) => (
                <div key={gap.gapId} className="flex items-center justify-between">
                  <span className="text-sm">{gap.description}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {gap.category}
                    </Badge>
                    <Badge 
                      className={`text-xs ${
                        gap.impact === 'critical' ? 'bg-red-100 text-red-800' :
                        gap.impact === 'high' ? 'bg-orange-100 text-orange-800' :
                        gap.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {gap.impact}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Intelligence Information */}
      <Tabs defaultValue="threats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
          <TabsTrigger value="behavioral">Behavioral Analytics</TabsTrigger>
          <TabsTrigger value="indicators">Threat Indicators</TabsTrigger>
          <TabsTrigger value="actors">Threat Actors</TabsTrigger>
          <TabsTrigger value="emerging">Emerging Threats</TabsTrigger>
        </TabsList>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Intelligence Overview</CardTitle>
              <CardDescription>
                Current threat landscape and intelligence feeds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Threat Feeds</span>
                    <Badge variant="outline">{threatIntelligence.threatFeeds.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {threatIntelligence.threatFeeds.slice(0, 3).map((feed) => (
                      <div key={feed.feedId} className="text-sm">
                        <div className="flex justify-between">
                          <span>{feed.name}</span>
                          <span className="text-green-600">{Math.round(feed.quality * 100)}%</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {feed.indicatorCount.toLocaleString()} indicators
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Threat Landscape</span>
                    <Badge variant="outline">
                      Level {threatIntelligence.threatLandscape.overallThreatLevel}%
                    </Badge>
                  </div>
                  <Progress 
                    value={threatIntelligence.threatLandscape.overallThreatLevel} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-600">
                    Global threat environment assessment
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Campaigns</span>
                    <Badge variant="outline">{threatIntelligence.campaigns.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {threatIntelligence.campaigns.length === 0 ? (
                      <p className="text-xs text-gray-500">No active campaigns detected</p>
                    ) : (
                      threatIntelligence.campaigns.slice(0, 3).map((campaign) => (
                        <div key={campaign.campaignId} className="text-sm">
                          <div className="flex justify-between">
                            <span>{campaign.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {campaign.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavioral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Behavioral Analytics</CardTitle>
              <CardDescription>
                User and system behavior analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">User Behavior</span>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Users:</span>
                      <span>{behavioralAnalytics.userBehaviorAnalysis.totalUsers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Active Users:</span>
                      <span className="text-green-600">
                        {behavioralAnalytics.userBehaviorAnalysis.activeUsers}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Anomalous Users:</span>
                      <span className="text-red-600">
                        {behavioralAnalytics.userBehaviorAnalysis.anomalousUsers}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Risk Score</span>
                        <span>{Math.round(behavioralAnalytics.userBehaviorAnalysis.riskScore * 100)}%</span>
                      </div>
                      <Progress 
                        value={behavioralAnalytics.userBehaviorAnalysis.riskScore * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Behavior</span>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Systems:</span>
                      <span>{behavioralAnalytics.systemBehaviorAnalysis.totalSystems}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Active Systems:</span>
                      <span className="text-green-600">
                        {behavioralAnalytics.systemBehaviorAnalysis.activeSystems}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Anomalous Systems:</span>
                      <span className="text-red-600">
                        {behavioralAnalytics.systemBehaviorAnalysis.anomalousSystems}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Anomaly Detection</span>
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Anomalies:</span>
                      <span>{behavioralAnalytics.anomalyDetection.totalAnomalies}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Critical Anomalies:</span>
                      <span className="text-red-600">
                        {behavioralAnalytics.anomalyDetection.criticalAnomalies}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>False Positive Rate:</span>
                      <span className="text-yellow-600">
                        {Math.round(behavioralAnalytics.anomalyDetection.falsePositiveRate * 100)}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Baseline Accuracy</span>
                        <span>{Math.round(behavioralAnalytics.baselineAnalysis.baselineAccuracy * 100)}%</span>
                      </div>
                      <Progress 
                        value={behavioralAnalytics.baselineAnalysis.baselineAccuracy * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Users */}
              {behavioralAnalytics.userBehaviorAnalysis.riskUsers.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">High-Risk Users</h4>
                  <div className="space-y-2">
                    {behavioralAnalytics.userBehaviorAnalysis.riskUsers.slice(0, 3).map((user) => (
                      <div key={user.userId} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{user.username}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              Risk: {Math.round(user.riskScore * 100)}%
                            </Badge>
                            <Badge className="bg-red-100 text-red-800">High Risk</Badge>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Risk Factors: {user.riskFactors.join(', ')}</p>
                          <p>Last Activity: {new Date(user.lastActivity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indicators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Indicators</CardTitle>
              <CardDescription>
                High-confidence threat indicators and IOCs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {threatIntelligence.indicators.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No threat indicators available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {threatIntelligence.indicators.slice(0, 5).map((indicator) => (
                    <div key={indicator.indicatorId} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{indicator.type.toUpperCase()}</Badge>
                          <span className="font-mono text-sm">{indicator.value}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(indicator.severity)}
                          <Badge variant="outline">
                            {Math.round(indicator.confidence * 100)}% confidence
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Campaign: {indicator.context.campaign}</p>
                        <p>Actor: {indicator.context.actor}</p>
                        <p>First Seen: {new Date(indicator.firstSeen).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {indicator.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Actors</CardTitle>
              <CardDescription>
                Known threat actors and attribution analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {threatIntelligence.actors.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No threat actors identified</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {threatIntelligence.actors.slice(0, 3).map((actor) => (
                    <div key={actor.actorId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{actor.name}</h4>
                          <p className="text-sm text-gray-600">
                            Aliases: {actor.aliases.join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{actor.type.replace('_', ' ')}</Badge>
                          <Badge variant="outline">
                            Sophistication: {actor.sophistication}/10
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium mb-1">Motivation:</p>
                          <p className="text-gray-600">{actor.motivation.join(', ')}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Primary Targets:</p>
                          <p className="text-gray-600">{actor.targets.join(', ')}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Capabilities:</p>
                          <p className="text-gray-600">{actor.capabilities.join(', ')}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Last Activity:</p>
                          <p className="text-gray-600">
                            {new Date(actor.lastActivity).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress 
                          value={actor.confidence * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Attribution Confidence: {Math.round(actor.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emerging" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Emerging Threats</CardTitle>
              <CardDescription>
                Newly identified and predicted threat vectors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {threatIntelligence.emergingThreats.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No emerging threats detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {threatIntelligence.emergingThreats.map((threat) => (
                    <div key={threat.threatId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{threat.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{threat.category}</Badge>
                          <Badge 
                            className={
                              threat.severity >= 8 ? 'bg-red-100 text-red-800' :
                              threat.severity >= 6 ? 'bg-orange-100 text-orange-800' :
                              threat.severity >= 4 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            Severity: {threat.severity}/10
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{threat.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium mb-1">Timeline:</p>
                          <p className="text-gray-600">{threat.timeline}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Likelihood:</p>
                          <div className="flex items-center space-x-2">
                            <Progress value={threat.likelihood * 100} className="h-2 flex-1" />
                            <span className="text-xs">{Math.round(threat.likelihood * 100)}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Primary Targets:</p>
                          <p className="text-gray-600">{threat.targets.join(', ')}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">First Detected:</p>
                          <p className="text-gray-600">
                            {new Date(threat.firstDetected).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="font-medium text-sm mb-1">Mitigation Strategies:</p>
                        <div className="flex flex-wrap gap-1">
                          {threat.mitigation.map((strategy, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {strategy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SecurityIntelligenceDashboard
