/**
 * Unit Tests for Security Analytics Service
 * Tests real-time security metrics, threat intelligence, and predictive analytics
 */

import { SecurityAnalyticsService } from '@/services/securityAnalyticsService'

// Mock TensorFlow.js for predictive analytics
jest.mock('@tensorflow/tfjs', () => ({
  sequential: jest.fn(() => ({
    add: jest.fn(),
    compile: jest.fn(),
    fit: jest.fn().mockResolvedValue({}),
    predict: jest.fn(() => ({
      dataSync: jest.fn(() => [0.7, 0.3])
    }))
  })),
  layers: {
    dense: jest.fn(() => ({}))
  },
  tensor2d: jest.fn(() => ({})),
  dispose: jest.fn()
}))

describe('SecurityAnalyticsService', () => {
  let analyticsService: SecurityAnalyticsService
  
  beforeEach(() => {
    analyticsService = new SecurityAnalyticsService({
      enableRealTimeAnalytics: true,
      enablePredictiveAnalytics: true,
      enableThreatIntelligence: true,
      enableBehavioralAnalytics: true,
      dataRetentionDays: 90,
      alertThresholds: {
        criticalThreatScore: 0.8,
        highRiskBehaviorScore: 0.7,
        anomalyDetectionSensitivity: 0.6
      },
      analyticsRefreshInterval: 60000 // 1 minute
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(analyticsService.initialize()).resolves.not.toThrow()
      expect(analyticsService.isInitialized()).toBe(true)
    })

    it('should start real-time analytics engine', async () => {
      await analyticsService.initialize()
      
      const status = analyticsService.getAnalyticsStatus()
      expect(status.realTimeAnalyticsActive).toBe(true)
      expect(status.lastUpdate).toBeDefined()
    })
  })

  describe('Real-Time Security Metrics', () => {
    beforeEach(async () => {
      await analyticsService.initialize()
    })

    it('should collect and process security events', async () => {
      const securityEvent = {
        eventType: 'authentication_attempt',
        userId: 'user-123',
        sessionId: 'session-456',
        timestamp: Date.now(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Test Browser',
        success: true,
        riskFactors: ['new_device', 'unusual_location'],
        metadata: {
          deviceFingerprint: 'device-123',
          geolocation: { country: 'US', city: 'New York' }
        }
      }

      const result = await analyticsService.processSecurityEvent(securityEvent)

      expect(result.eventProcessed).toBe(true)
      expect(result.riskScore).toBeDefined()
      expect(result.anomalyDetected).toBeDefined()
      expect(result.recommendedActions).toBeDefined()
    })

    it('should generate real-time security dashboard', async () => {
      // Simulate multiple security events
      const events = [
        { eventType: 'login_success', riskScore: 0.2 },
        { eventType: 'login_failure', riskScore: 0.8 },
        { eventType: 'data_access', riskScore: 0.3 },
        { eventType: 'privilege_escalation', riskScore: 0.9 }
      ]

      for (const event of events) {
        await analyticsService.processSecurityEvent({
          eventType: event.eventType,
          userId: 'test-user',
          sessionId: 'test-session',
          timestamp: Date.now(),
          ipAddress: '192.168.1.1',
          userAgent: 'Browser',
          success: true,
          riskFactors: [],
          metadata: {}
        })
      }

      const dashboard = await analyticsService.getRealTimeDashboard()

      expect(dashboard.currentThreatLevel).toBeDefined()
      expect(dashboard.activeThreats).toBeDefined()
      expect(dashboard.securityMetrics).toHaveProperty('totalEvents')
      expect(dashboard.securityMetrics).toHaveProperty('highRiskEvents')
      expect(dashboard.securityMetrics).toHaveProperty('averageRiskScore')
      expect(dashboard.topRiskFactors).toBeDefined()
    })

    it('should detect security anomalies', async () => {
      const anomalousEvent = {
        eventType: 'data_export',
        userId: 'user-123',
        sessionId: 'session-456',
        timestamp: Date.now(),
        ipAddress: '10.0.0.1', // Unusual IP
        userAgent: 'Automated Script/1.0', // Suspicious user agent
        success: true,
        riskFactors: ['bulk_data_access', 'off_hours_activity', 'new_ip_address'],
        metadata: {
          dataVolume: 1000000, // Large data volume
          accessPattern: 'bulk_download'
        }
      }

      const result = await analyticsService.processSecurityEvent(anomalousEvent)

      expect(result.anomalyDetected).toBe(true)
      expect(result.riskScore).toBeGreaterThan(0.7)
      expect(result.recommendedActions).toContain('investigate_user_activity')
    })
  })

  describe('Threat Intelligence Analytics', () => {
    beforeEach(async () => {
      await analyticsService.initialize()
    })

    it('should analyze threat patterns', async () => {
      const threatData = {
        threatType: 'credential_stuffing',
        sourceIPs: ['10.0.0.1', '10.0.0.2', '10.0.0.3'],
        targetUsers: ['user1', 'user2', 'user3'],
        timeframe: {
          startTime: Date.now() - 3600000, // 1 hour ago
          endTime: Date.now()
        },
        attackVectors: ['automated_login_attempts', 'password_spraying'],
        indicators: {
          failedLoginRate: 0.95,
          uniqueIPCount: 50,
          requestFrequency: 100 // requests per minute
        }
      }

      const analysis = await analyticsService.analyzeThreatPattern(threatData)

      expect(analysis.threatSeverity).toBeDefined()
      expect(analysis.attackProbability).toBeGreaterThan(0)
      expect(analysis.recommendedMitigations).toBeDefined()
      expect(analysis.similarThreats).toBeDefined()
    })

    it('should correlate threat intelligence feeds', async () => {
      const threatIntelligence = {
        maliciousIPs: ['192.168.1.100', '10.0.0.1'],
        suspiciousDomains: ['malicious-site.com', 'phishing-domain.net'],
        knownAttackSignatures: ['signature1', 'signature2'],
        threatActorProfiles: ['APT-Group-1', 'Cybercriminal-Gang-2']
      }

      await analyticsService.updateThreatIntelligence(threatIntelligence)

      const correlation = await analyticsService.correlateThreatIntelligence({
        ipAddress: '192.168.1.100',
        userAgent: 'Suspicious Bot',
        requestPattern: 'automated'
      })

      expect(correlation.threatMatch).toBe(true)
      expect(correlation.matchedIndicators).toContain('malicious_ip')
      expect(correlation.riskLevel).toBeGreaterThan(0.5)
    })

    it('should generate threat intelligence reports', async () => {
      const reportRequest = {
        reportType: 'weekly_threat_summary',
        timeframe: {
          startDate: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
          endDate: Date.now()
        },
        includeMetrics: true,
        includeTrends: true,
        includeRecommendations: true
      }

      const report = await analyticsService.generateThreatIntelligenceReport(reportRequest)

      expect(report.reportId).toBeDefined()
      expect(report.executiveSummary).toBeDefined()
      expect(report.threatMetrics).toBeDefined()
      expect(report.emergingThreats).toBeDefined()
      expect(report.mitigationRecommendations).toBeDefined()
    })
  })

  describe('Behavioral Analytics', () => {
    beforeEach(async () => {
      await analyticsService.initialize()
    })

    it('should establish user behavior baselines', async () => {
      const userActivity = {
        userId: 'user-123',
        activities: [
          { action: 'login', timestamp: Date.now() - 86400000, location: 'New York' },
          { action: 'view_dashboard', timestamp: Date.now() - 86400000 + 300000 },
          { action: 'start_interview', timestamp: Date.now() - 86400000 + 600000 },
          { action: 'logout', timestamp: Date.now() - 86400000 + 3600000 }
        ],
        sessionDuration: 3600000, // 1 hour
        accessPatterns: {
          typicalLoginHours: [9, 10, 11, 14, 15, 16],
          commonLocations: ['New York', 'Boston'],
          averageSessionDuration: 3600000
        }
      }

      const baseline = await analyticsService.establishBehaviorBaseline(userActivity)

      expect(baseline.userId).toBe('user-123')
      expect(baseline.behaviorProfile).toBeDefined()
      expect(baseline.riskFactors).toBeDefined()
      expect(baseline.confidence).toBeGreaterThan(0)
    })

    it('should detect behavioral anomalies', async () => {
      // First establish baseline
      await analyticsService.establishBehaviorBaseline({
        userId: 'user-456',
        activities: [
          { action: 'login', timestamp: Date.now() - 86400000, location: 'San Francisco' }
        ],
        sessionDuration: 1800000,
        accessPatterns: {
          typicalLoginHours: [9, 10, 11],
          commonLocations: ['San Francisco'],
          averageSessionDuration: 1800000
        }
      })

      // Then test anomalous behavior
      const anomalousActivity = {
        userId: 'user-456',
        currentActivity: {
          action: 'bulk_data_download',
          timestamp: Date.now(), // 3 AM - unusual hour
          location: 'Unknown Location',
          sessionDuration: 7200000, // Much longer than usual
          dataVolume: 500000 // Large data access
        }
      }

      const anomalyResult = await analyticsService.detectBehavioralAnomaly(anomalousActivity)

      expect(anomalyResult.anomalyDetected).toBe(true)
      expect(anomalyResult.anomalyScore).toBeGreaterThan(0.5)
      expect(anomalyResult.anomalyTypes).toContain('unusual_access_time')
      expect(anomalyResult.riskLevel).toBeDefined()
    })

    it('should track behavior evolution over time', async () => {
      const behaviorEvolution = await analyticsService.trackBehaviorEvolution({
        userId: 'user-789',
        timeframe: '30d',
        metrics: ['login_frequency', 'session_duration', 'access_patterns']
      })

      expect(behaviorEvolution.userId).toBe('user-789')
      expect(behaviorEvolution.evolutionTrends).toBeDefined()
      expect(behaviorEvolution.riskTrendAnalysis).toBeDefined()
      expect(behaviorEvolution.recommendedActions).toBeDefined()
    })
  })

  describe('Predictive Analytics', () => {
    beforeEach(async () => {
      await analyticsService.initialize()
    })

    it('should predict security incidents', async () => {
      const predictionRequest = {
        timeframe: '24h',
        riskFactors: [
          'increased_failed_logins',
          'unusual_access_patterns',
          'new_device_registrations',
          'elevated_privilege_requests'
        ],
        historicalData: {
          pastIncidents: 5,
          averageIncidentSeverity: 0.6,
          commonAttackVectors: ['credential_stuffing', 'phishing']
        }
      }

      const prediction = await analyticsService.predictSecurityIncidents(predictionRequest)

      expect(prediction.incidentProbability).toBeDefined()
      expect(prediction.predictedSeverity).toBeDefined()
      expect(prediction.likelyAttackVectors).toBeDefined()
      expect(prediction.recommendedPreventiveMeasures).toBeDefined()
      expect(prediction.confidence).toBeGreaterThan(0)
    })

    it('should forecast threat landscape changes', async () => {
      const forecastRequest = {
        timeHorizon: '30d',
        threatCategories: ['malware', 'phishing', 'insider_threats', 'ddos'],
        externalFactors: {
          geopoliticalEvents: ['election_period'],
          industryTrends: ['remote_work_increase'],
          seasonalFactors: ['holiday_season']
        }
      }

      const forecast = await analyticsService.forecastThreatLandscape(forecastRequest)

      expect(forecast.threatTrends).toBeDefined()
      expect(forecast.emergingThreats).toBeDefined()
      expect(forecast.riskLevelProjection).toBeDefined()
      expect(forecast.strategicRecommendations).toBeDefined()
    })

    it('should optimize security controls based on predictions', async () => {
      const optimizationRequest = {
        currentControls: [
          { controlType: 'firewall', effectiveness: 0.8, cost: 1000 },
          { controlType: 'ids', effectiveness: 0.7, cost: 800 },
          { controlType: 'endpoint_protection', effectiveness: 0.9, cost: 1200 }
        ],
        threatPredictions: {
          malwareProbability: 0.6,
          phishingProbability: 0.4,
          insiderThreatProbability: 0.3
        },
        budget: 5000,
        riskTolerance: 0.2
      }

      const optimization = await analyticsService.optimizeSecurityControls(optimizationRequest)

      expect(optimization.recommendedControls).toBeDefined()
      expect(optimization.expectedRiskReduction).toBeDefined()
      expect(optimization.costBenefitAnalysis).toBeDefined()
      expect(optimization.implementationPriority).toBeDefined()
    })
  })

  describe('Performance and Scalability', () => {
    beforeEach(async () => {
      await analyticsService.initialize()
    })

    it('should handle high-volume event processing', async () => {
      const events = Array.from({ length: 1000 }, (_, i) => ({
        eventType: 'user_activity',
        userId: `user-${i}`,
        sessionId: `session-${i}`,
        timestamp: Date.now() + i * 1000,
        ipAddress: '192.168.1.1',
        userAgent: 'Browser',
        success: true,
        riskFactors: [],
        metadata: {}
      }))

      const startTime = Date.now()
      const results = await Promise.all(
        events.map(event => analyticsService.processSecurityEvent(event))
      )
      const endTime = Date.now()

      expect(results).toHaveLength(1000)
      expect(results.every(r => r.eventProcessed)).toBe(true)
      expect(endTime - startTime).toBeLessThan(10000) // Should complete within 10 seconds
    })

    it('should maintain performance under concurrent load', async () => {
      const concurrentRequests = Array.from({ length: 50 }, (_, i) =>
        analyticsService.getRealTimeDashboard()
      )

      const startTime = Date.now()
      const results = await Promise.all(concurrentRequests)
      const endTime = Date.now()

      expect(results).toHaveLength(50)
      expect(results.every(r => r.currentThreatLevel !== undefined)).toBe(true)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })

  describe('Error Handling', () => {
    beforeEach(async () => {
      await analyticsService.initialize()
    })

    it('should handle malformed security events gracefully', async () => {
      const malformedEvent = {
        eventType: null,
        userId: '',
        timestamp: 'invalid-timestamp',
        invalidField: 'should-be-ignored'
      } as any

      await expect(analyticsService.processSecurityEvent(malformedEvent))
        .resolves.not.toThrow()
    })

    it('should handle service unavailability', async () => {
      const unavailableService = new SecurityAnalyticsService({
        enableRealTimeAnalytics: false,
        enablePredictiveAnalytics: false,
        enableThreatIntelligence: false,
        enableBehavioralAnalytics: false
      })

      const result = await unavailableService.processSecurityEvent({
        eventType: 'test',
        userId: 'test-user',
        sessionId: 'test-session',
        timestamp: Date.now(),
        ipAddress: '192.168.1.1',
        userAgent: 'Browser',
        success: true,
        riskFactors: [],
        metadata: {}
      })

      expect(result).toBeDefined()
      expect(result.eventProcessed).toBe(false)
    })

    it('should validate configuration parameters', async () => {
      const invalidConfig = {
        enableRealTimeAnalytics: 'invalid',
        dataRetentionDays: -1,
        alertThresholds: null
      } as any

      const invalidService = new SecurityAnalyticsService(invalidConfig)
      await expect(invalidService.initialize()).resolves.not.toThrow()
    })
  })
})
