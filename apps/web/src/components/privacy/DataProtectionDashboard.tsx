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
  Lock,
  Eye,
  FileText,
  Users,
  Database,
  Key,
  Activity,
  Settings,
  BarChart3
} from 'lucide-react'
import DataProtectionPrivacy, { 
  type DataProtectionResult, 
  type ProtectionOverview,
  type EncryptionStatus,
  type PrivacyControls,
  type DataIncident,
  type PrivacyMetrics
} from '@/services/dataProtectionPrivacy'

interface DataProtectionDashboardProps {
  className?: string
}

const DataProtectionDashboard: React.FC<DataProtectionDashboardProps> = ({ className }) => {
  const [dataProtection] = useState(() => new DataProtectionPrivacy())
  const [protectionResult, setProtectionResult] = useState<DataProtectionResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeDataProtection()
  }, [])

  const initializeDataProtection = async () => {
    try {
      setIsLoading(true)
      await dataProtection.initialize()
      const result = await dataProtection.performProtectionAssessment()
      setProtectionResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize data protection system')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshDataProtection = async () => {
    try {
      setIsLoading(true)
      const result = await dataProtection.performProtectionAssessment()
      setProtectionResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data protection data')
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600 bg-green-100'
    if (score >= 0.7) return 'text-blue-600 bg-blue-100'
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Initializing Data Protection System...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Data Protection System Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={initializeDataProtection} className="mt-4">
          Retry Initialization
        </Button>
      </div>
    )
  }

  if (!protectionResult) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>No Protection Data</AlertTitle>
          <AlertDescription>Data protection assessment data is not available.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { protectionOverview, encryptionStatus, privacyControls, privacyMetrics, confidence } = protectionResult

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Protection & Privacy Dashboard</h1>
          <p className="text-gray-600">Advanced data protection with encryption, privacy controls, and GDPR compliance</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            Confidence: {Math.round(confidence * 100)}%
          </Badge>
          <Button onClick={refreshDataProtection} disabled={isLoading}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Protection Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protection Coverage</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(protectionOverview.protectionCoverage * 100)}%
            </div>
            <Progress 
              value={protectionOverview.protectionCoverage * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {protectionOverview.protectedAssets}/{protectionOverview.totalDataAssets} assets protected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encryption Status</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(encryptionStatus.encryptionCoverage * 100)}%
            </div>
            <Progress 
              value={encryptionStatus.encryptionCoverage * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {protectionOverview.encryptedAssets} encrypted assets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Privacy Score</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(privacyMetrics.overallPrivacyScore * 100)}%
            </div>
            <Progress 
              value={privacyMetrics.overallPrivacyScore * 100} 
              className="mt-2"
            />
            <Badge className={`mt-2 ${getScoreColor(privacyMetrics.overallPrivacyScore)}`}>
              {privacyMetrics.overallPrivacyScore >= 0.9 ? 'EXCELLENT' :
               privacyMetrics.overallPrivacyScore >= 0.7 ? 'GOOD' :
               privacyMetrics.overallPrivacyScore >= 0.5 ? 'FAIR' : 'POOR'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(privacyMetrics.complianceScore * 100)}%
            </div>
            <Progress 
              value={privacyMetrics.complianceScore * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              GDPR & Privacy Regulations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Protection Gaps Alert */}
      {protectionOverview.protectionGaps.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Protection Gaps Identified</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              {protectionOverview.protectionGaps.slice(0, 3).map((gap) => (
                <div key={gap.gapId} className="flex items-center justify-between">
                  <span className="text-sm">{gap.description}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {gap.category}
                    </Badge>
                    <Badge 
                      className={`text-xs ${
                        gap.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        gap.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        gap.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {gap.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Protection Information */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="encryption">Encryption</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Controls</TabsTrigger>
          <TabsTrigger value="compliance">GDPR Compliance</TabsTrigger>
          <TabsTrigger value="classification">Data Classification</TabsTrigger>
          <TabsTrigger value="metrics">Privacy Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Asset Protection</CardTitle>
                <CardDescription>
                  Current protection status of data assets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Data Assets</span>
                    <Badge variant="outline">
                      {protectionOverview.totalDataAssets.toLocaleString()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Protected Assets:</span>
                      <span className="text-green-600">{protectionOverview.protectedAssets.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Encrypted Assets:</span>
                      <span className="text-blue-600">{protectionOverview.encryptedAssets.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Classified Assets:</span>
                      <span className="text-purple-600">{protectionOverview.classifiedAssets.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Protection Coverage</span>
                      <span>{Math.round(protectionOverview.protectionCoverage * 100)}%</span>
                    </div>
                    <Progress value={protectionOverview.protectionCoverage * 100} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy Metrics Trends</CardTitle>
                <CardDescription>
                  Recent trends in privacy and protection metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {privacyMetrics.trends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(trend.trend)}
                        <span className="text-sm font-medium">{trend.metric}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {trend.change > 0 ? '+' : ''}{Math.round(trend.change * 100)}%
                        </Badge>
                        <span className="text-xs text-gray-500">{trend.period}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="encryption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Encryption Status</CardTitle>
              <CardDescription>
                Current encryption coverage and key management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Encryption Methods</h4>
                  <div className="space-y-2">
                    {encryptionStatus.encryptionMethods.map((method) => (
                      <div key={method.methodId} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{method.name}</span>
                          <Badge 
                            className={
                              method.strength === 'very_strong' ? 'bg-green-100 text-green-800' :
                              method.strength === 'strong' ? 'bg-blue-100 text-blue-800' :
                              method.strength === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {method.strength.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Algorithm: {method.algorithm}</p>
                          <p>Key Size: {method.keySize} bits</p>
                          <p>Usage: {method.usage.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Key Management</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>KMS:</span>
                      <span>{encryptionStatus.keyManagement.keyManagementSystem}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Keys:</span>
                      <span>{encryptionStatus.keyManagement.totalKeys.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Active Keys:</span>
                      <span className="text-green-600">
                        {encryptionStatus.keyManagement.activeKeys.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Expired Keys:</span>
                      <span className="text-yellow-600">
                        {encryptionStatus.keyManagement.expiredKeys.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Revoked Keys:</span>
                      <span className="text-red-600">
                        {encryptionStatus.keyManagement.revokedKeys.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h5 className="text-xs font-medium mb-2">Key Rotation Policy</h5>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Enabled:</span>
                        <Badge variant={encryptionStatus.keyManagement.keyRotationPolicy.enabled ? 'default' : 'secondary'}>
                          {encryptionStatus.keyManagement.keyRotationPolicy.enabled ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Automatic:</span>
                        <Badge variant={encryptionStatus.keyManagement.keyRotationPolicy.automaticRotation ? 'default' : 'secondary'}>
                          {encryptionStatus.keyManagement.keyRotationPolicy.automaticRotation ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Interval:</span>
                        <span>90 days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Controls</CardTitle>
              <CardDescription>
                Privacy policies, consent management, and data subject rights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Privacy Policies</h4>
                  <div className="space-y-2">
                    {privacyControls.privacyPolicies.map((policy) => (
                      <div key={policy.policyId} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{policy.name}</span>
                          <Badge variant="outline">v{policy.version}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Effective: {new Date(policy.effectiveDate).toLocaleDateString()}</p>
                          <p>Last Update: {new Date(policy.lastUpdate).toLocaleDateString()}</p>
                          <p>Scope: {policy.scope.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Consent Management</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Consents:</span>
                      <span>{privacyControls.consentManagement.consentMetrics.totalConsents.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Active Consents:</span>
                      <span className="text-green-600">
                        {privacyControls.consentManagement.consentMetrics.activeConsents.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Withdrawn:</span>
                      <span className="text-red-600">
                        {privacyControls.consentManagement.consentMetrics.withdrawnConsents.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Consent Rate:</span>
                      <span>{Math.round(privacyControls.consentManagement.consentMetrics.consentRate * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Withdrawal Rate:</span>
                      <span>{Math.round(privacyControls.consentManagement.consentMetrics.withdrawalRate * 100)}%</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h5 className="text-xs font-medium mb-2">Data Subject Rights</h5>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Total Requests:</span>
                        <span>{privacyControls.dataSubjectRights.requestManagement.totalRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending:</span>
                        <span className="text-yellow-600">
                          {privacyControls.dataSubjectRights.requestManagement.pendingRequests}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span className="text-green-600">
                          {privacyControls.dataSubjectRights.requestManagement.completedRequests}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Response Time:</span>
                        <span>{privacyControls.dataSubjectRights.requestManagement.averageResponseTime} days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GDPR Compliance</CardTitle>
              <CardDescription>
                GDPR compliance status and requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">GDPR compliance details will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">
                  Article compliance, data processing activities, and breach notification
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Classification</CardTitle>
              <CardDescription>
                Data classification scheme and automated classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Data classification information will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">
                  Classification levels, automated classification, and data handling
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Metrics</CardTitle>
              <CardDescription>
                Comprehensive privacy and protection metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Privacy Scores</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Privacy Score</span>
                        <span>{Math.round(privacyMetrics.overallPrivacyScore * 100)}%</span>
                      </div>
                      <Progress value={privacyMetrics.overallPrivacyScore * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Data Protection Score</span>
                        <span>{Math.round(privacyMetrics.dataProtectionScore * 100)}%</span>
                      </div>
                      <Progress value={privacyMetrics.dataProtectionScore * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Consent Management Score</span>
                        <span>{Math.round(privacyMetrics.consentManagementScore * 100)}%</span>
                      </div>
                      <Progress value={privacyMetrics.consentManagementScore * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Data Subject Rights Score</span>
                        <span>{Math.round(privacyMetrics.dataSubjectRightsScore * 100)}%</span>
                      </div>
                      <Progress value={privacyMetrics.dataSubjectRightsScore * 100} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Incident Rate:</span>
                      <span className="text-green-600">{Math.round(privacyMetrics.incidentRate * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Response Time:</span>
                      <span>{privacyMetrics.responseTime} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer Satisfaction:</span>
                      <span className="text-blue-600">{Math.round(privacyMetrics.customerSatisfaction * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compliance Score:</span>
                      <span className="text-purple-600">{Math.round(privacyMetrics.complianceScore * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Privacy by Design Score:</span>
                      <span className="text-indigo-600">{Math.round(privacyMetrics.privacyByDesignScore * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DataProtectionDashboard
