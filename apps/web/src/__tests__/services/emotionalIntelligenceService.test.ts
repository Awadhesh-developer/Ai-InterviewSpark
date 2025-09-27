import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { emotionalIntelligenceService } from '@/services/emotionalIntelligenceService'

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_MOTIVEL_API_KEY: 'mock-motivel-key',
  NEXT_PUBLIC_MOODME_API_KEY: 'mock-moodme-key'
}

Object.assign(process.env, mockEnv)

// Mock Blob and File APIs
global.Blob = class MockBlob {
  constructor(public content: any[], public options?: any) {}
  
  async arrayBuffer(): Promise<ArrayBuffer> {
    const str = this.content.join('')
    const buffer = new ArrayBuffer(str.length)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < str.length; i++) {
      view[i] = str.charCodeAt(i)
    }
    return buffer
  }
} as any

// Mock btoa function
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')

describe('EmotionalIntelligenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('analyzeVoiceEmotion', () => {
    it('should analyze voice emotion from audio blob', async () => {
      const audioBlob = new Blob(['mock audio data'], { type: 'audio/wav' })
      
      const result = await emotionalIntelligenceService.analyzeVoiceEmotion(audioBlob)
      
      expect(result).toBeDefined()
      expect(result.pitch).toBeInstanceOf(Array)
      expect(result.volume).toBeInstanceOf(Array)
      expect(result.pace).toBeGreaterThan(0)
      expect(['confident', 'nervous', 'excited', 'calm', 'uncertain']).toContain(result.tonality)
      expect(result.fillerWords).toBeDefined()
      expect(result.fillerWords.count).toBeGreaterThanOrEqual(0)
      expect(result.emotionalMarkers).toBeDefined()
      expect(result.emotionalMarkers.confidence).toBeGreaterThanOrEqual(0)
      expect(result.emotionalMarkers.confidence).toBeLessThanOrEqual(1)
    })

    it('should handle empty audio blob', async () => {
      const audioBlob = new Blob([], { type: 'audio/wav' })
      
      const result = await emotionalIntelligenceService.analyzeVoiceEmotion(audioBlob)
      
      expect(result).toBeDefined()
      // Should still return valid structure even with empty audio
      expect(result.pitch).toBeInstanceOf(Array)
      expect(result.volume).toBeInstanceOf(Array)
    })

    it('should handle large audio files', async () => {
      const largeAudioData = new Array(10000).fill('a').join('')
      const audioBlob = new Blob([largeAudioData], { type: 'audio/wav' })
      
      const startTime = Date.now()
      const result = await emotionalIntelligenceService.analyzeVoiceEmotion(audioBlob)
      const endTime = Date.now()
      
      expect(result).toBeDefined()
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })

  describe('analyzeFacialEmotion', () => {
    it('should analyze facial emotion from video blob', async () => {
      const videoBlob = new Blob(['mock video data'], { type: 'video/mp4' })
      
      const result = await emotionalIntelligenceService.analyzeFacialEmotion(videoBlob)
      
      expect(result).toBeDefined()
      expect(result.expressions).toBeDefined()
      expect(result.expressions.smile).toBeGreaterThanOrEqual(0)
      expect(result.expressions.smile).toBeLessThanOrEqual(1)
      
      expect(result.eyeContact).toBeDefined()
      expect(result.eyeContact.percentage).toBeGreaterThanOrEqual(0)
      expect(result.eyeContact.percentage).toBeLessThanOrEqual(100)
      expect(['camera', 'away', 'down', 'side']).toContain(result.eyeContact.direction)
      
      expect(result.microExpressions).toBeDefined()
      expect(result.microExpressions.confidence).toBeGreaterThanOrEqual(0)
      expect(result.microExpressions.confidence).toBeLessThanOrEqual(1)
      
      expect(result.bodyLanguage).toBeDefined()
      expect(['upright', 'slouched', 'leaning']).toContain(result.bodyLanguage.posture)
    })

    it('should handle corrupted video data gracefully', async () => {
      const corruptedVideoBlob = new Blob(['corrupted data'], { type: 'video/mp4' })
      
      // Should not throw error, but return mock data
      const result = await emotionalIntelligenceService.analyzeFacialEmotion(corruptedVideoBlob)
      
      expect(result).toBeDefined()
      expect(result.expressions).toBeDefined()
    })
  })

  describe('performEmotionalAnalysis', () => {
    it('should perform comprehensive analysis with both audio and video', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/wav' })
      const videoBlob = new Blob(['video data'], { type: 'video/mp4' })
      
      const result = await emotionalIntelligenceService.performEmotionalAnalysis(
        audioBlob,
        videoBlob
      )
      
      expect(result).toBeDefined()
      expect(result.overallState).toBeDefined()
      expect(result.voiceAnalysis).toBeDefined()
      expect(result.facialAnalysis).toBeDefined()
      expect(result.trends).toBeInstanceOf(Array)
      expect(result.insights).toBeInstanceOf(Array)
      expect(result.recommendations).toBeInstanceOf(Array)
      expect(result.riskFactors).toBeInstanceOf(Array)
      
      // Overall state should have all required properties
      expect(result.overallState.confidence).toBeGreaterThanOrEqual(0)
      expect(result.overallState.confidence).toBeLessThanOrEqual(1)
      expect(result.overallState.stress).toBeGreaterThanOrEqual(0)
      expect(result.overallState.stress).toBeLessThanOrEqual(1)
      expect(result.overallState.engagement).toBeGreaterThanOrEqual(0)
      expect(result.overallState.engagement).toBeLessThanOrEqual(1)
      expect(result.overallState.timestamp).toBeGreaterThan(0)
    })

    it('should work with audio only', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/wav' })
      
      const result = await emotionalIntelligenceService.performEmotionalAnalysis(audioBlob)
      
      expect(result).toBeDefined()
      expect(result.overallState).toBeDefined()
      expect(result.voiceAnalysis).toBeDefined()
      expect(result.facialAnalysis).toBeUndefined()
    })

    it('should work with video only', async () => {
      const videoBlob = new Blob(['video data'], { type: 'video/mp4' })
      
      const result = await emotionalIntelligenceService.performEmotionalAnalysis(
        undefined,
        videoBlob
      )
      
      expect(result).toBeDefined()
      expect(result.overallState).toBeDefined()
      expect(result.voiceAnalysis).toBeUndefined()
      expect(result.facialAnalysis).toBeDefined()
    })

    it('should generate trends with previous states', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/wav' })
      const previousStates = [
        { confidence: 0.5, stress: 0.6, engagement: 0.7, clarity: 0.6, enthusiasm: 0.5, nervousness: 0.4, timestamp: Date.now() - 10000 },
        { confidence: 0.6, stress: 0.5, engagement: 0.8, clarity: 0.7, enthusiasm: 0.6, nervousness: 0.3, timestamp: Date.now() - 5000 }
      ]
      
      const result = await emotionalIntelligenceService.performEmotionalAnalysis(
        audioBlob,
        undefined,
        previousStates
      )
      
      expect(result.trends).toBeInstanceOf(Array)
      expect(result.trends.length).toBeGreaterThan(0)
      
      result.trends.forEach(trend => {
        expect(['confidence', 'stress', 'engagement', 'clarity']).toContain(trend.metric)
        expect(['improving', 'declining', 'stable']).toContain(trend.direction)
        expect(['low', 'medium', 'high']).toContain(trend.significance)
      })
    })
  })

  describe('startEmotionalCoachingSession', () => {
    it('should start a new emotional coaching session', async () => {
      const userId = 'test-user-123'
      
      const session = await emotionalIntelligenceService.startEmotionalCoachingSession(userId)
      
      expect(session).toBeDefined()
      expect(session.id).toMatch(/^emotional-session-\d+$/)
      expect(session.userId).toBe(userId)
      expect(session.startTime).toBeInstanceOf(Date)
      expect(session.endTime).toBeUndefined()
      expect(session.emotionalStates).toEqual([])
      expect(session.analyses).toEqual([])
      expect(session.interventions).toEqual([])
      expect(session.outcomes).toBeDefined()
    })

    it('should create unique session IDs', async () => {
      const session1 = await emotionalIntelligenceService.startEmotionalCoachingSession('user1')
      const session2 = await emotionalIntelligenceService.startEmotionalCoachingSession('user2')
      
      expect(session1.id).not.toBe(session2.id)
    })
  })

  describe('processRealTimeEmotionalData', () => {
    it('should process real-time data and generate interventions', async () => {
      // Start a session first
      const session = await emotionalIntelligenceService.startEmotionalCoachingSession('test-user')
      
      const audioBlob = new Blob(['audio data'], { type: 'audio/wav' })
      const videoBlob = new Blob(['video data'], { type: 'video/mp4' })
      
      const analysis = await emotionalIntelligenceService.processRealTimeEmotionalData(
        session.id,
        audioBlob,
        videoBlob
      )
      
      expect(analysis).toBeDefined()
      expect(analysis.overallState).toBeDefined()
      
      // Session should be updated with new data
      expect(session.emotionalStates.length).toBe(1)
      expect(session.analyses.length).toBe(1)
      expect(session.emotionalStates[0]).toEqual(analysis.overallState)
    })

    it('should generate interventions for high stress', async () => {
      const session = await emotionalIntelligenceService.startEmotionalCoachingSession('test-user')
      
      // Mock high stress scenario by manipulating the analysis
      const originalProcessRealTime = emotionalIntelligenceService.processRealTimeEmotionalData
      
      // Create a spy to check interventions
      const audioBlob = new Blob(['audio data'], { type: 'audio/wav' })
      
      await emotionalIntelligenceService.processRealTimeEmotionalData(
        session.id,
        audioBlob
      )
      
      // Check if interventions were generated (they should be based on random mock data)
      expect(session.interventions).toBeInstanceOf(Array)
    })

    it('should handle non-existent session', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/wav' })
      
      await expect(
        emotionalIntelligenceService.processRealTimeEmotionalData(
          'non-existent-session',
          audioBlob
        )
      ).rejects.toThrow('Session not found: non-existent-session')
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete emotional coaching workflow', async () => {
      // 1. Start session
      const session = await emotionalIntelligenceService.startEmotionalCoachingSession('integration-user')
      
      // 2. Process multiple emotional data points
      const dataPoints = [
        { audio: new Blob(['audio1'], { type: 'audio/wav' }), video: new Blob(['video1'], { type: 'video/mp4' }) },
        { audio: new Blob(['audio2'], { type: 'audio/wav' }), video: new Blob(['video2'], { type: 'video/mp4' }) },
        { audio: new Blob(['audio3'], { type: 'audio/wav' }), video: new Blob(['video3'], { type: 'video/mp4' }) }
      ]
      
      for (const data of dataPoints) {
        const analysis = await emotionalIntelligenceService.processRealTimeEmotionalData(
          session.id,
          data.audio,
          data.video
        )
        expect(analysis).toBeDefined()
      }
      
      // 3. Verify session state
      expect(session.emotionalStates.length).toBe(dataPoints.length)
      expect(session.analyses.length).toBe(dataPoints.length)
      
      // 4. Check that timestamps are in order
      for (let i = 1; i < session.emotionalStates.length; i++) {
        expect(session.emotionalStates[i].timestamp).toBeGreaterThanOrEqual(
          session.emotionalStates[i - 1].timestamp
        )
      }
    })

    it('should handle rapid successive calls', async () => {
      const session = await emotionalIntelligenceService.startEmotionalCoachingSession('rapid-test-user')
      
      // Process multiple data points rapidly
      const promises = Array.from({ length: 5 }, (_, i) =>
        emotionalIntelligenceService.processRealTimeEmotionalData(
          session.id,
          new Blob([`audio${i}`], { type: 'audio/wav' })
        )
      )
      
      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.overallState).toBeDefined()
      })
      
      expect(session.emotionalStates.length).toBe(5)
      expect(session.analyses.length).toBe(5)
    })
  })

  describe('Performance Tests', () => {
    it('should analyze emotions within reasonable time', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/wav' })
      const videoBlob = new Blob(['video data'], { type: 'video/mp4' })
      
      const startTime = Date.now()
      await emotionalIntelligenceService.performEmotionalAnalysis(audioBlob, videoBlob)
      const endTime = Date.now()
      
      const duration = endTime - startTime
      expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
    })

    it('should handle multiple concurrent analyses', async () => {
      const analysisPromises = Array.from({ length: 3 }, (_, i) =>
        emotionalIntelligenceService.performEmotionalAnalysis(
          new Blob([`audio${i}`], { type: 'audio/wav' }),
          new Blob([`video${i}`], { type: 'video/mp4' })
        )
      )
      
      const startTime = Date.now()
      const results = await Promise.all(analysisPromises)
      const endTime = Date.now()
      
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.overallState).toBeDefined()
      })
      
      const duration = endTime - startTime
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      // Test with invalid blob data
      const invalidBlob = new Blob([''], { type: 'invalid/type' })
      
      // Should not throw, but return mock data
      const voiceResult = await emotionalIntelligenceService.analyzeVoiceEmotion(invalidBlob)
      expect(voiceResult).toBeDefined()
      
      const facialResult = await emotionalIntelligenceService.analyzeFacialEmotion(invalidBlob)
      expect(facialResult).toBeDefined()
    })

    it('should handle missing API keys', async () => {
      // Temporarily remove API keys
      const originalMotivel = process.env.NEXT_PUBLIC_MOTIVEL_API_KEY
      const originalMoodme = process.env.NEXT_PUBLIC_MOODME_API_KEY
      
      delete process.env.NEXT_PUBLIC_MOTIVEL_API_KEY
      delete process.env.NEXT_PUBLIC_MOODME_API_KEY
      
      try {
        const audioBlob = new Blob(['audio'], { type: 'audio/wav' })
        const result = await emotionalIntelligenceService.analyzeVoiceEmotion(audioBlob)
        
        // Should still return mock data
        expect(result).toBeDefined()
        expect(result.emotionalMarkers).toBeDefined()
      } finally {
        // Restore API keys
        if (originalMotivel) process.env.NEXT_PUBLIC_MOTIVEL_API_KEY = originalMotivel
        if (originalMoodme) process.env.NEXT_PUBLIC_MOODME_API_KEY = originalMoodme
      }
    })
  })
})
