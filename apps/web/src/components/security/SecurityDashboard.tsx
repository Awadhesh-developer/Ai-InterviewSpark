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
  Lock,
  Network,
  FileText,
  Activity,
  Users,
  Database,
  Zap
} from 'lucide-react'
import AdvancedSecurityFramework, { 
  type SecurityFrameworkResult, 
  type SecurityPosture,
  type ThreatDetectionResult,
  type SecurityControl,
  type SecurityVulnerability
} from '@/services/advancedSecurityFramework'

interface SecurityDashboardProps {
  className?: string
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ className }) => {
  const [securityFramework] = useState(() => new AdvancedSecurityFramework())
  const [securityResult, setSecurityResult] = useState<SecurityFrameworkResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeSecurity()
  }, [])

  const initializeSecurity = async () => {
    try {
      setIsLoading(true)
      await securityFramework.initialize()
      const result = await securityFramework.performSecurityAssessment()
      setSecurityResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize security framework')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSecurity = async () => {
    try {
      setIsLoading(true)
      const result = await securityFramework.performSecurityAssessment()
      setSecurityResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh security data')
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
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
          <span className="ml-2">Initializing Security Framework...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Security Framework Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={initializeSecurity} className="mt-4">
          Retry Initialization
        </Button>
      </div>
    )
  }

  if (!securityResult) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>No Security Data</AlertTitle>
          <AlertDescription>Security assessment data is not available.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { securityPosture, threatDetection, confidence } = securityResult

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600">Advanced security monitoring and threat intelligence</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            Confidence: {Math.round(confidence * 100)}%
          </Badge>
          <Button onClick={refreshSecurity} disabled={isLoading}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(securityPosture.overallSecurityScore * 100)}%
            </div>
            <Progress 
              value={securityPosture.overallSecurityScore * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getRiskLevelColor(securityPosture.riskLevel)}>
              {securityPosture.riskLevel.toUpperCase()}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Current security risk assessment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {threatDetection.activeThreats.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Threats requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {securityPosture.vulnerabilities.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Open security vulnerabilities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Security Information */}
      <Tabs defaultValue="posture" className="space-y-4">
        <TabsList>
          <TabsTrigger value="posture">Security Posture</TabsTrigger>
          <TabsTrigger value="threats">Threat Detection</TabsTrigger>
          <TabsTrigger value="controls">Security Controls</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="posture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Maturity</CardTitle>
              <CardDescription>
                Current security maturity level and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Maturity Level</span>
                    <Badge variant="outline">Level {securityPosture.securityMaturity.level}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {securityPosture.securityMaturity.description}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Current Capabilities</h4>
                  <div className="space-y-1">
                    {securityPosture.securityMaturity.capabilities.map((capability, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        {capability}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Identified Gaps</h4>
                  <div className="space-y-1">
                    {securityPosture.securityMaturity.gaps.map((gap, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <XCircle className="h-3 w-3 text-red-500 mr-2" />
                        {gap}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Landscape</CardTitle>
              <CardDescription>
                Current threat environment and active threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Threat Level</span>
                    <Badge variant="outline">
                      {threatDetection.threatLandscape.overallThreatLevel}%
                    </Badge>
                  </div>
                  <Progress 
                    value={threatDetection.threatLandscape.overallThreatLevel} 
                    className="h-2"
                  />
                </div>

                {threatDetection.activeThreats.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Active Threats</h4>
                    <div className="space-y-2">
                      {threatDetection.activeThreats.map((threat) => (
                        <div key={threat.threatId} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{threat.name}</span>
                            <div className="flex items-center space-x-2">
                              {getSeverityIcon(threat.severity)}
                              <Badge variant="outline">{threat.status}</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            Detected: {new Date(threat.firstDetected).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Affected Systems: {threat.affectedSystems.join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Controls</CardTitle>
              <CardDescription>
                Implementation status of security controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityPosture.securityControls.map((control) => (
                  <div key={control.controlId} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{control.name}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{control.category}</Badge>
                        <Badge 
                          className={
                            control.implementation === 'implemented' 
                              ? 'bg-green-100 text-green-800'
                              : control.implementation === 'partial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {control.implementation}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{control.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Effectiveness: {Math.round(control.effectiveness * 100)}%</span>
                      <span>Owner: {control.owner}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vulnerabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Vulnerabilities</CardTitle>
              <CardDescription>
                Open vulnerabilities requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityPosture.vulnerabilities.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No open vulnerabilities found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {securityPosture.vulnerabilities.map((vuln) => (
                    <div key={vuln.vulnerabilityId} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{vuln.title}</span>
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(vuln.severity)}
                          <Badge variant="outline">CVSS: {vuln.cvssScore}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{vuln.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Affected: {vuln.affectedComponents.join(', ')}</span>
                        <span>Due: {new Date(vuln.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Recommendations</CardTitle>
              <CardDescription>
                Recommended actions to improve security posture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityPosture.recommendations.map((rec) => (
                  <div key={rec.recommendationId} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{rec.title}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{rec.category}</Badge>
                        <Badge 
                          className={
                            rec.priority === 'critical' 
                              ? 'bg-red-100 text-red-800'
                              : rec.priority === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : rec.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Effort: {rec.effort}/10</span>
                      <span>Impact: {rec.impact}/10</span>
                      <span>Timeline: {rec.timeline}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SecurityDashboard
