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
  FileText,
  Calendar,
  BarChart3,
  Users,
  Settings,
  Clock,
  Target,
  AlertCircle
} from 'lucide-react'
import EnhancedComplianceManagement, { 
  type ComplianceFrameworkResult, 
  type ComplianceOverview,
  type RegulatoryFramework,
  type AutomatedMonitoring,
  type ComplianceAnalytics
} from '@/services/enhancedComplianceManagement'

interface ComplianceDashboardProps {
  className?: string
}

const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ className }) => {
  const [complianceManager] = useState(() => new EnhancedComplianceManagement())
  const [complianceResult, setComplianceResult] = useState<ComplianceFrameworkResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeCompliance()
  }, [])

  const initializeCompliance = async () => {
    try {
      setIsLoading(true)
      await complianceManager.initialize()
      const result = await complianceManager.performComplianceAssessment()
      setComplianceResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize compliance management')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshCompliance = async () => {
    try {
      setIsLoading(true)
      const result = await complianceManager.performComplianceAssessment()
      setComplianceResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh compliance data')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'needs_improvement': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
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
          <span className="ml-2">Initializing Compliance Management...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Compliance Management Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={initializeCompliance} className="mt-4">
          Retry Initialization
        </Button>
      </div>
    )
  }

  if (!complianceResult) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>No Compliance Data</AlertTitle>
          <AlertDescription>Compliance assessment data is not available.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { complianceOverview, automatedMonitoring, confidence } = complianceResult

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600">Enterprise compliance management and regulatory monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            Confidence: {Math.round(confidence * 100)}%
          </Badge>
          <Button onClick={refreshCompliance} disabled={isLoading}>
            <Settings className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(complianceOverview.overallScore * 100)}%
            </div>
            <Progress 
              value={complianceOverview.overallScore * 100} 
              className="mt-2"
            />
            <Badge className={`mt-2 ${getStatusColor(complianceOverview.complianceStatus)}`}>
              {complianceOverview.complianceStatus.replace('_', ' ').toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Frameworks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {complianceOverview.activeFrameworks}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Regulatory frameworks monitored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requirements</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {complianceOverview.compliantRequirements}/{complianceOverview.totalRequirements}
            </div>
            <p className="text-xs text-muted-foreground">
              Compliant requirements
            </p>
            <Progress 
              value={(complianceOverview.compliantRequirements / complianceOverview.totalRequirements) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Gaps</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {complianceOverview.criticalGaps}
            </div>
            <p className="text-xs text-muted-foreground">
              Issues requiring attention
            </p>
            {complianceOverview.upcomingDeadlines > 0 && (
              <div className="flex items-center mt-2 text-xs text-orange-600">
                <Clock className="h-3 w-3 mr-1" />
                {complianceOverview.upcomingDeadlines} upcoming deadlines
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Changes Alert */}
      {complianceOverview.recentChanges.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Recent Compliance Changes</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              {complianceOverview.recentChanges.slice(0, 3).map((change) => (
                <div key={change.changeId} className="flex items-center justify-between">
                  <span className="text-sm">{change.description}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {change.framework}
                    </Badge>
                    <Badge 
                      className={`text-xs ${
                        change.impact === 'critical' ? 'bg-red-100 text-red-800' :
                        change.impact === 'high' ? 'bg-orange-100 text-orange-800' :
                        change.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {change.impact}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Compliance Information */}
      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitoring">Automated Monitoring</TabsTrigger>
          <TabsTrigger value="frameworks">Regulatory Frameworks</TabsTrigger>
          <TabsTrigger value="analytics">Compliance Analytics</TabsTrigger>
          <TabsTrigger value="audits">Audit Management</TabsTrigger>
          <TabsTrigger value="reports">Reports & Dashboards</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Monitoring Status</CardTitle>
              <CardDescription>
                Real-time compliance monitoring and automated checks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monitoring Status</span>
                    <Badge 
                      className={
                        automatedMonitoring.monitoringStatus === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : automatedMonitoring.monitoringStatus === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {automatedMonitoring.monitoringStatus}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {automatedMonitoring.totalChecks}
                  </div>
                  <p className="text-xs text-muted-foreground">Total automated checks</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Check Results</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Passed: {automatedMonitoring.passedChecks}</span>
                      <span className="text-green-600">
                        {Math.round((automatedMonitoring.passedChecks / automatedMonitoring.totalChecks) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Warnings: {automatedMonitoring.warningChecks}</span>
                      <span className="text-yellow-600">
                        {Math.round((automatedMonitoring.warningChecks / automatedMonitoring.totalChecks) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Failed: {automatedMonitoring.failedChecks}</span>
                      <span className="text-red-600">
                        {Math.round((automatedMonitoring.failedChecks / automatedMonitoring.totalChecks) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Coverage & Automation</span>
                    <Badge variant="outline">
                      {Math.round(automatedMonitoring.monitoringCoverage * 100)}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Monitoring Coverage</span>
                        <span>{Math.round(automatedMonitoring.monitoringCoverage * 100)}%</span>
                      </div>
                      <Progress value={automatedMonitoring.monitoringCoverage * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Automation Level</span>
                        <span>{Math.round(automatedMonitoring.automationLevel * 100)}%</span>
                      </div>
                      <Progress value={automatedMonitoring.automationLevel * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Last Monitoring</h4>
                <p className="text-sm text-gray-600">
                  {new Date(automatedMonitoring.lastMonitoring).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Next monitoring: {new Date(automatedMonitoring.nextMonitoring).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frameworks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Frameworks</CardTitle>
              <CardDescription>
                Active regulatory frameworks and compliance status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Regulatory frameworks data will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">
                  Framework details, requirements, and compliance status
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Analytics</CardTitle>
              <CardDescription>
                Advanced analytics and predictive insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Compliance analytics and trends will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">
                  Trend analysis, predictions, and benchmarking
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Management</CardTitle>
              <CardDescription>
                Audit scheduling, findings, and corrective actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Audit management information will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">
                  Scheduled audits, findings, and action items
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Dashboards</CardTitle>
              <CardDescription>
                Compliance reports and executive dashboards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Compliance reports and dashboards will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">
                  Executive summaries, regulatory reports, and metrics
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ComplianceDashboard
