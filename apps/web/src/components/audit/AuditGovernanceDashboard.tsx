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
  Users,
  Settings,
  BarChart3,
  Calendar,
  Target,
  Activity,
  Clock,
  Eye,
  BookOpen
} from 'lucide-react'
import EnterpriseAuditGovernance, { 
  type AuditGovernanceResult, 
  type AuditOverview,
  type GovernanceFramework,
  type ComplianceStatus,
  type RiskAssessment,
  type AuditFinding,
  type GovernanceMetrics
} from '@/services/enterpriseAuditGovernance'

interface AuditGovernanceDashboardProps {
  className?: string
}

const AuditGovernanceDashboard: React.FC<AuditGovernanceDashboardProps> = ({ className }) => {
  const [auditGovernance] = useState(() => new EnterpriseAuditGovernance())
  const [auditResult, setAuditResult] = useState<AuditGovernanceResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeAuditGovernance()
  }, [])

  const initializeAuditGovernance = async () => {
    try {
      setIsLoading(true)
      await auditGovernance.initialize()
      const result = await auditGovernance.performAuditAssessment()
      setAuditResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize audit governance system')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAuditGovernance = async () => {
    try {
      setIsLoading(true)
      const result = await auditGovernance.performAuditAssessment()
      setAuditResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh audit governance data')
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />
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
          <span className="ml-2">Initializing Audit & Governance System...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Audit & Governance System Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={initializeAuditGovernance} className="mt-4">
          Retry Initialization
        </Button>
      </div>
    )
  }

  if (!auditResult) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>No Audit Data</AlertTitle>
          <AlertDescription>Audit and governance data is not available.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { auditOverview, complianceStatus, riskAssessment, governanceMetrics, confidence } = auditResult

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit & Governance Dashboard</h1>
          <p className="text-gray-600">Enterprise audit system with governance frameworks and compliance management</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            Confidence: {Math.round(confidence * 100)}%
          </Badge>
          <Button onClick={refreshAuditGovernance} disabled={isLoading}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Audit Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Coverage</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(auditOverview.auditCoverage * 100)}%
            </div>
            <Progress 
              value={auditOverview.auditCoverage * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {auditOverview.completedAudits}/{auditOverview.totalAudits} audits completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(complianceStatus.overallCompliance * 100)}%
            </div>
            <Progress 
              value={complianceStatus.overallCompliance * 100} 
              className="mt-2"
            />
            <Badge className={`mt-2 ${getScoreColor(complianceStatus.overallCompliance)}`}>
              {complianceStatus.overallCompliance >= 0.9 ? 'EXCELLENT' :
               complianceStatus.overallCompliance >= 0.7 ? 'GOOD' :
               complianceStatus.overallCompliance >= 0.5 ? 'FAIR' : 'POOR'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((1 - riskAssessment.overallRisk) * 100)}%
            </div>
            <Progress 
              value={(1 - riskAssessment.overallRisk) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Risk level: {riskAssessment.overallRisk < 0.3 ? 'Low' : 
                          riskAssessment.overallRisk < 0.6 ? 'Medium' : 'High'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Audits</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {auditOverview.activeAudits}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending: {auditOverview.pendingAudits}
            </p>
            {auditOverview.upcomingAudits.length > 0 && (
              <div className="flex items-center mt-2 text-xs text-blue-600">
                <Calendar className="h-3 w-3 mr-1" />
                {auditOverview.upcomingAudits.length} upcoming
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Findings Alert */}
      {auditOverview.recentFindings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Recent Audit Findings</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              {auditOverview.recentFindings.slice(0, 3).map((finding) => (
                <div key={finding.findingId} className="flex items-center justify-between">
                  <span className="text-sm">{finding.title}</span>
                  <div className="flex items-center space-x-2">
                    {getSeverityIcon(finding.severity)}
                    <Badge variant="outline" className="text-xs">
                      {finding.category}
                    </Badge>
                    <Badge 
                      className={`text-xs ${
                        finding.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        finding.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        finding.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {finding.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Audit & Governance Information */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="governance">Governance Frameworks</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="findings">Audit Findings</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Governance Metrics</CardTitle>
                <CardDescription>
                  Key governance performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Overall Governance Score</span>
                    <Badge variant="outline">
                      {Math.round(governanceMetrics.overallGovernanceScore * 100)}%
                    </Badge>
                  </div>
                  <Progress value={governanceMetrics.overallGovernanceScore * 100} />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Framework Maturity:</span>
                      <span>{Math.round(governanceMetrics.frameworkMaturity * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Policy Compliance:</span>
                      <span>{Math.round(governanceMetrics.policyCompliance * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Control Effectiveness:</span>
                      <span>{Math.round(governanceMetrics.controlEffectiveness * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Risk Management:</span>
                      <span>{Math.round(governanceMetrics.riskManagement * 100)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Audits</CardTitle>
                <CardDescription>
                  Scheduled audits and preparation status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditOverview.upcomingAudits.length === 0 ? (
                  <div className="text-center py-4">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No upcoming audits scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditOverview.upcomingAudits.slice(0, 3).map((audit) => (
                      <div key={audit.auditId} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{audit.title}</span>
                          <Badge variant="outline">{audit.type}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Auditor: {audit.auditor}</p>
                          <p>Scheduled: {new Date(audit.scheduledDate).toLocaleDateString()}</p>
                          <p>Duration: {audit.duration} days</p>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Preparation</span>
                            <span>{Math.round(audit.preparation.readinessScore * 100)}%</span>
                          </div>
                          <Progress value={audit.preparation.readinessScore * 100} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="governance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Governance Frameworks</CardTitle>
              <CardDescription>
                Active governance frameworks and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditResult.governanceFrameworks.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No governance frameworks configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditResult.governanceFrameworks.map((framework) => (
                    <div key={framework.frameworkId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{framework.name}</h4>
                          <p className="text-sm text-gray-600">Version {framework.version}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{framework.type.replace('_', ' ')}</Badge>
                          <Badge 
                            className={
                              framework.status === 'active' ? 'bg-green-100 text-green-800' :
                              framework.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {framework.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium mb-1">Scope:</p>
                          <p className="text-gray-600">{framework.scope.join(', ')}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Last Review:</p>
                          <p className="text-gray-600">
                            {new Date(framework.lastReview).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Stakeholders:</p>
                          <p className="text-gray-600">{framework.stakeholders.length} assigned</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Next Review:</p>
                          <p className="text-gray-600">
                            {new Date(framework.nextReview).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>
                Current compliance status across frameworks and regulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Framework Compliance */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Framework Compliance</h4>
                  <div className="space-y-3">
                    {complianceStatus.frameworkCompliance.map((framework) => (
                      <div key={framework.framework} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{framework.framework}</span>
                          <Badge variant="outline">
                            {Math.round(framework.compliance * 100)}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Compliant: </span>
                            <span className="text-green-600">{framework.compliant}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Non-compliant: </span>
                            <span className="text-red-600">{framework.nonCompliant}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total: </span>
                            <span>{framework.requirements}</span>
                          </div>
                        </div>
                        <Progress value={framework.compliance * 100} className="mt-2 h-2" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Gaps */}
                {complianceStatus.complianceGaps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Compliance Gaps</h4>
                    <div className="space-y-2">
                      {complianceStatus.complianceGaps.slice(0, 3).map((gap) => (
                        <div key={gap.gapId} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{gap.requirement}</span>
                            <div className="flex items-center space-x-2">
                              {getSeverityIcon(gap.severity)}
                              <Badge variant="outline">{gap.framework}</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{gap.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Owner: {gap.owner}</span>
                            <span>Due: {new Date(gap.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>
                Current risk profile and risk management status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Risk Categories</h4>
                    <div className="space-y-2">
                      {riskAssessment.riskCategories.map((category) => (
                        <div key={category.category} className="flex items-center justify-between">
                          <span className="text-sm">{category.category}</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={category.riskLevel * 100} className="w-20 h-2" />
                            <span className="text-xs w-8">
                              {Math.round(category.riskLevel * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3">Risk Appetite & Tolerance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Risk Appetite:</span>
                        <Badge variant="outline">{riskAssessment.riskAppetite.appetite}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Tolerance:</span>
                        <span>{Math.round(riskAssessment.riskTolerance.tolerance * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Review:</span>
                        <span>{new Date(riskAssessment.riskAppetite.lastReview).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Factors */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Key Risk Factors</h4>
                  <div className="space-y-2">
                    {riskAssessment.riskFactors.slice(0, 3).map((factor) => (
                      <div key={factor.factorId} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{factor.name}</span>
                          <Badge variant="outline">{factor.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{factor.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Impact: </span>
                            <span>{Math.round(factor.impact * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Likelihood: </span>
                            <span>{Math.round(factor.likelihood * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Findings</CardTitle>
              <CardDescription>
                Recent audit findings and their resolution status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditOverview.recentFindings.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No recent audit findings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditOverview.recentFindings.map((finding) => (
                    <div key={finding.findingId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{finding.title}</h4>
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(finding.severity)}
                          <Badge variant="outline">{finding.category}</Badge>
                          <Badge 
                            className={
                              finding.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              finding.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              finding.status === 'open' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {finding.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{finding.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium mb-1">Impact:</p>
                          <p className="text-gray-600">{finding.impact}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Assignee:</p>
                          <p className="text-gray-600">{finding.assignee}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Created:</p>
                          <p className="text-gray-600">
                            {new Date(finding.createdDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Due Date:</p>
                          <p className="text-gray-600">
                            {new Date(finding.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {finding.recommendations.length > 0 && (
                        <div className="mt-3">
                          <p className="font-medium text-sm mb-1">Recommendations:</p>
                          <div className="flex flex-wrap gap-1">
                            {finding.recommendations.map((rec, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {rec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Reports</CardTitle>
              <CardDescription>
                Generated reports and executive summaries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Audit reports and executive summaries will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">
                  Executive reports, detailed findings, and compliance reports
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AuditGovernanceDashboard
