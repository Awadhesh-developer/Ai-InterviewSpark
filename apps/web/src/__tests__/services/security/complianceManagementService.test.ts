/**
 * Unit Tests for Compliance Management Service
 * Tests GDPR, SOC2, ISO27001 compliance monitoring and automated compliance checks
 */

import { ComplianceManagementService } from '@/services/complianceManagementService'

describe('ComplianceManagementService', () => {
  let complianceService: ComplianceManagementService
  
  beforeEach(() => {
    complianceService = new ComplianceManagementService({
      enableGDPR: true,
      enableSOC2: true,
      enableISO27001: true,
      enableHIPAA: false,
      enablePCIDSS: false,
      autoRemediation: true,
      complianceReporting: true,
      auditTrailRetention: 2555, // 7 years in days
      dataRetentionPolicies: {
        personalData: 1095, // 3 years
        auditLogs: 2555, // 7 years
        systemLogs: 365 // 1 year
      }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(complianceService.initialize()).resolves.not.toThrow()
      expect(complianceService.isInitialized()).toBe(true)
    })

    it('should load compliance frameworks', async () => {
      await complianceService.initialize()
      
      const frameworks = complianceService.getSupportedFrameworks()
      expect(frameworks).toContain('gdpr')
      expect(frameworks).toContain('soc2')
      expect(frameworks).toContain('iso27001')
    })
  })

  describe('GDPR Compliance', () => {
    beforeEach(async () => {
      await complianceService.initialize()
    })

    it('should validate data processing consent', async () => {
      const dataProcessingRequest = {
        userId: 'eu-user-123',
        dataType: 'personal',
        processingPurpose: 'interview_analysis',
        consentGiven: true,
        consentTimestamp: Date.now(),
        dataSubject: {
          region: 'EU',
          age: 25,
          consentCapable: true
        }
      }

      const result = await complianceService.validateGDPRCompliance(dataProcessingRequest)

      expect(result.compliant).toBe(true)
      expect(result.violations).toHaveLength(0)
      expect(result.recommendations).toBeDefined()
    })

    it('should detect GDPR violations for missing consent', async () => {
      const invalidRequest = {
        userId: 'eu-user-456',
        dataType: 'personal',
        processingPurpose: 'marketing',
        consentGiven: false,
        consentTimestamp: null,
        dataSubject: {
          region: 'EU',
          age: 30,
          consentCapable: true
        }
      }

      const result = await complianceService.validateGDPRCompliance(invalidRequest)

      expect(result.compliant).toBe(false)
      expect(result.violations).toContain('missing_consent')
      expect(result.recommendations).toContain('obtain_explicit_consent')
    })

    it('should handle data subject rights requests', async () => {
      const rightsRequest = {
        userId: 'eu-user-789',
        requestType: 'data_portability',
        requestTimestamp: Date.now(),
        verificationStatus: 'verified'
      }

      const result = await complianceService.handleDataSubjectRights(rightsRequest)

      expect(result.requestAccepted).toBe(true)
      expect(result.estimatedCompletionTime).toBeDefined()
      expect(result.referenceNumber).toBeDefined()
    })

    it('should validate data retention periods', async () => {
      const retentionCheck = {
        dataType: 'personal',
        createdAt: Date.now() - (4 * 365 * 24 * 60 * 60 * 1000), // 4 years ago
        lastAccessed: Date.now() - (2 * 365 * 24 * 60 * 60 * 1000), // 2 years ago
        retentionPurpose: 'interview_records'
      }

      const result = await complianceService.validateDataRetention(retentionCheck)

      expect(result.retentionValid).toBeDefined()
      expect(result.actionRequired).toBeDefined()
    })
  })

  describe('SOC2 Compliance', () => {
    beforeEach(async () => {
      await complianceService.initialize()
    })

    it('should validate security controls', async () => {
      const securityAssessment = {
        controlCategory: 'access_control',
        systemComponent: 'interview_platform',
        assessmentDate: Date.now(),
        controls: {
          userAuthentication: 'implemented',
          roleBasedAccess: 'implemented',
          sessionManagement: 'implemented',
          auditLogging: 'implemented'
        }
      }

      const result = await complianceService.validateSOC2Compliance(securityAssessment)

      expect(result.compliant).toBe(true)
      expect(result.controlsAssessed).toBeGreaterThan(0)
      expect(result.deficiencies).toHaveLength(0)
    })

    it('should detect control deficiencies', async () => {
      const deficientAssessment = {
        controlCategory: 'availability',
        systemComponent: 'backup_system',
        assessmentDate: Date.now(),
        controls: {
          backupProcedures: 'not_implemented',
          disasterRecovery: 'partially_implemented',
          systemMonitoring: 'implemented'
        }
      }

      const result = await complianceService.validateSOC2Compliance(deficientAssessment)

      expect(result.compliant).toBe(false)
      expect(result.deficiencies.length).toBeGreaterThan(0)
      expect(result.remediationPlan).toBeDefined()
    })

    it('should generate SOC2 audit reports', async () => {
      const reportRequest = {
        reportType: 'type2',
        auditPeriod: {
          startDate: Date.now() - (365 * 24 * 60 * 60 * 1000), // 1 year ago
          endDate: Date.now()
        },
        scope: ['security', 'availability', 'confidentiality']
      }

      const report = await complianceService.generateSOC2Report(reportRequest)

      expect(report.reportId).toBeDefined()
      expect(report.executiveSummary).toBeDefined()
      expect(report.controlsAssessment).toBeDefined()
      expect(report.exceptions).toBeDefined()
    })
  })

  describe('ISO27001 Compliance', () => {
    beforeEach(async () => {
      await complianceService.initialize()
    })

    it('should assess information security management system', async () => {
      const ismsAssessment = {
        organizationContext: 'interview_platform',
        scope: 'entire_organization',
        assessmentDate: Date.now(),
        controls: {
          'A.5.1.1': 'implemented', // Information security policies
          'A.6.1.1': 'implemented', // Information security roles
          'A.8.1.1': 'implemented', // Inventory of assets
          'A.9.1.1': 'implemented'  // Access control policy
        }
      }

      const result = await complianceService.validateISO27001Compliance(ismsAssessment)

      expect(result.compliant).toBe(true)
      expect(result.maturityLevel).toBeDefined()
      expect(result.controlsImplemented).toBeGreaterThan(0)
    })

    it('should identify security control gaps', async () => {
      const gappedAssessment = {
        organizationContext: 'interview_platform',
        scope: 'partial_implementation',
        assessmentDate: Date.now(),
        controls: {
          'A.5.1.1': 'not_implemented',
          'A.6.1.1': 'partially_implemented',
          'A.8.1.1': 'implemented',
          'A.9.1.1': 'not_applicable'
        }
      }

      const result = await complianceService.validateISO27001Compliance(gappedAssessment)

      expect(result.compliant).toBe(false)
      expect(result.gaps.length).toBeGreaterThan(0)
      expect(result.improvementPlan).toBeDefined()
    })
  })

  describe('Automated Compliance Monitoring', () => {
    beforeEach(async () => {
      await complianceService.initialize()
    })

    it('should perform continuous compliance monitoring', async () => {
      const monitoringConfig = {
        frameworks: ['gdpr', 'soc2'],
        monitoringInterval: 3600000, // 1 hour
        alertThresholds: {
          criticalViolations: 1,
          majorViolations: 5,
          minorViolations: 10
        }
      }

      await complianceService.startContinuousMonitoring(monitoringConfig)

      const status = complianceService.getMonitoringStatus()
      expect(status.active).toBe(true)
      expect(status.lastCheck).toBeDefined()
    })

    it('should generate compliance alerts', async () => {
      const violationEvent = {
        framework: 'gdpr',
        violationType: 'data_processing_without_consent',
        severity: 'critical',
        timestamp: Date.now(),
        details: {
          userId: 'user-123',
          dataType: 'personal',
          processingActivity: 'unauthorized_analysis'
        }
      }

      const alert = await complianceService.processComplianceViolation(violationEvent)

      expect(alert.alertId).toBeDefined()
      expect(alert.severity).toBe('critical')
      expect(alert.requiresImmediateAction).toBe(true)
      expect(alert.remediationSteps).toBeDefined()
    })

    it('should auto-remediate minor violations', async () => {
      const minorViolation = {
        framework: 'soc2',
        violationType: 'session_timeout_exceeded',
        severity: 'minor',
        timestamp: Date.now(),
        details: {
          sessionId: 'session-456',
          timeoutDuration: 3600000,
          maxAllowedTimeout: 1800000
        }
      }

      const remediation = await complianceService.processComplianceViolation(minorViolation)

      expect(remediation.autoRemediated).toBe(true)
      expect(remediation.remediationActions).toContain('force_session_logout')
    })
  })

  describe('Compliance Reporting', () => {
    beforeEach(async () => {
      await complianceService.initialize()
    })

    it('should generate comprehensive compliance dashboard', async () => {
      const dashboard = await complianceService.getComplianceDashboard()

      expect(dashboard.overallComplianceScore).toBeDefined()
      expect(dashboard.frameworkStatus).toHaveProperty('gdpr')
      expect(dashboard.frameworkStatus).toHaveProperty('soc2')
      expect(dashboard.frameworkStatus).toHaveProperty('iso27001')
      expect(dashboard.recentViolations).toBeDefined()
      expect(dashboard.upcomingAudits).toBeDefined()
    })

    it('should export compliance reports', async () => {
      const exportRequest = {
        format: 'pdf',
        frameworks: ['gdpr', 'soc2'],
        dateRange: {
          startDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
          endDate: Date.now()
        },
        includeEvidence: true
      }

      const exportResult = await complianceService.exportComplianceReport(exportRequest)

      expect(exportResult.reportUrl).toBeDefined()
      expect(exportResult.fileSize).toBeGreaterThan(0)
      expect(exportResult.expiresAt).toBeDefined()
    })

    it('should track compliance metrics over time', async () => {
      const metrics = await complianceService.getComplianceMetrics({
        timeframe: '30d',
        granularity: 'daily'
      })

      expect(metrics.complianceScoreTrend).toBeDefined()
      expect(metrics.violationsTrend).toBeDefined()
      expect(metrics.remediationEffectiveness).toBeDefined()
    })
  })

  describe('Data Privacy Management', () => {
    beforeEach(async () => {
      await complianceService.initialize()
    })

    it('should classify data sensitivity levels', async () => {
      const dataClassification = {
        dataType: 'interview_recording',
        content: 'audio_video_transcript',
        personalDataPresent: true,
        sensitiveDataPresent: false
      }

      const classification = await complianceService.classifyDataSensitivity(dataClassification)

      expect(classification.sensitivityLevel).toBeDefined()
      expect(classification.handlingRequirements).toBeDefined()
      expect(classification.retentionPeriod).toBeDefined()
    })

    it('should manage consent lifecycle', async () => {
      const consentManagement = {
        userId: 'user-789',
        consentType: 'data_processing',
        purpose: 'interview_analysis',
        action: 'grant'
      }

      const result = await complianceService.manageConsent(consentManagement)

      expect(result.consentId).toBeDefined()
      expect(result.status).toBe('active')
      expect(result.expiresAt).toBeDefined()
    })

    it('should handle consent withdrawal', async () => {
      const withdrawalRequest = {
        userId: 'user-789',
        consentId: 'consent-123',
        withdrawalReason: 'user_request',
        effectiveDate: Date.now()
      }

      const result = await complianceService.withdrawConsent(withdrawalRequest)

      expect(result.withdrawalProcessed).toBe(true)
      expect(result.dataProcessingStopped).toBe(true)
      expect(result.deletionScheduled).toBe(true)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      await complianceService.initialize()
    })

    it('should handle invalid compliance requests gracefully', async () => {
      const invalidRequest = {
        framework: 'invalid_framework',
        data: null
      } as any

      await expect(complianceService.validateCompliance(invalidRequest))
        .resolves.not.toThrow()
    })

    it('should handle service unavailability', async () => {
      // Simulate service unavailability
      const unavailableService = new ComplianceManagementService({
        enableGDPR: true,
        enableSOC2: false,
        enableISO27001: false
      })

      const result = await unavailableService.validateGDPRCompliance({
        userId: 'test-user',
        dataType: 'personal',
        processingPurpose: 'test',
        consentGiven: true,
        consentTimestamp: Date.now(),
        dataSubject: { region: 'EU', age: 25, consentCapable: true }
      })

      expect(result).toBeDefined()
      expect(result.confidence).toBeLessThan(1)
    })

    it('should validate configuration parameters', async () => {
      const invalidConfig = {
        enableGDPR: 'invalid',
        auditTrailRetention: -1,
        dataRetentionPolicies: null
      } as any

      const invalidService = new ComplianceManagementService(invalidConfig)
      await expect(invalidService.initialize()).resolves.not.toThrow()
    })
  })
})
