/**
 * Integration Tests for LLM Providers
 * Tests actual API integration with OpenAI, Gemini, and Claude
 * Note: These tests require valid API keys and may incur costs
 */

import { llmConfig } from '@/config/llmProviders'

// Skip integration tests if no API keys are provided
const hasOpenAIKey = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY || !!process.env.OPENAI_API_KEY
const hasGeminiKey = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY || !!process.env.GEMINI_API_KEY
const hasClaudeKey = !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || !!process.env.ANTHROPIC_API_KEY

const skipIfNoKeys = (condition: boolean) => condition ? describe : describe.skip

describe('LLM Providers Integration Tests', () => {
  beforeAll(() => {
    // Ensure configuration is loaded
    const config = llmConfig.getConfiguration()
    expect(config).toBeDefined()
  })

  describe('Provider Health Checks', () => {
    it('should report correct provider status', () => {
      const status = llmConfig.getProviderStatus()
      
      expect(status.openai.enabled).toBe(hasOpenAIKey)
      expect(status.gemini.enabled).toBe(hasGeminiKey)
      expect(status.claude.enabled).toBe(hasClaudeKey)
      
      if (hasOpenAIKey) {
        expect(status.openai.configured).toBe(true)
        expect(status.openai.healthy).toBe(true)
      }
      
      if (hasGeminiKey) {
        expect(status.gemini.configured).toBe(true)
        expect(status.gemini.healthy).toBe(true)
      }
      
      if (hasClaudeKey) {
        expect(status.claude.configured).toBe(true)
        expect(status.claude.healthy).toBe(true)
      }
    })
  })

  skipIfNoKeys(hasOpenAIKey)('OpenAI Integration', () => {
    let openaiProvider: any

    beforeAll(() => {
      openaiProvider = llmConfig.getProvider('openai')
      expect(openaiProvider).not.toBeNull()
      expect(openaiProvider.enabled).toBe(true)
    })

    it('should successfully connect to OpenAI API', async () => {
      const testPrompt = 'Generate a simple behavioral interview question for a software engineer position. Respond with just the question.'
      
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiProvider.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: openaiProvider.model,
            messages: [
              {
                role: 'user',
                content: testPrompt
              }
            ],
            max_tokens: 100,
            temperature: 0.7
          })
        })

        expect(response.ok).toBe(true)
        
        const data = await response.json()
        expect(data.choices).toBeDefined()
        expect(data.choices.length).toBeGreaterThan(0)
        expect(data.choices[0].message.content).toBeDefined()
        expect(typeof data.choices[0].message.content).toBe('string')
        expect(data.choices[0].message.content.length).toBeGreaterThan(10)
      } catch (error) {
        console.error('OpenAI API test failed:', error)
        throw error
      }
    }, 30000) // 30 second timeout

    it('should handle rate limiting gracefully', async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array(5).fill(null).map(() =>
        fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiProvider.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: openaiProvider.model,
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 10
          })
        })
      )

      const responses = await Promise.allSettled(promises)
      
      // At least some requests should succeed
      const successful = responses.filter(r => r.status === 'fulfilled' && (r.value as Response).ok)
      expect(successful.length).toBeGreaterThan(0)
    }, 60000)

    it('should validate response format for question generation', async () => {
      const prompt = `Generate 2 interview questions in JSON format:
      [{"question": "question text", "type": "behavioral", "difficulty": "medium"}]`
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiProvider.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: openaiProvider.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7
        })
      })

      expect(response.ok).toBe(true)
      
      const data = await response.json()
      const content = data.choices[0].message.content
      
      // Should contain JSON-like structure
      expect(content).toMatch(/\[.*\]/)
      expect(content).toContain('question')
      expect(content).toContain('type')
    }, 30000)
  })

  skipIfNoKeys(hasGeminiKey)('Google Gemini Integration', () => {
    let geminiProvider: any

    beforeAll(() => {
      geminiProvider = llmConfig.getProvider('gemini')
      expect(geminiProvider).not.toBeNull()
      expect(geminiProvider.enabled).toBe(true)
    })

    it('should successfully connect to Gemini API', async () => {
      const testPrompt = 'Generate a technical interview question about JavaScript. Respond with just the question.'
      
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiProvider.model}:generateContent?key=${geminiProvider.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: testPrompt
              }]
            }],
            generationConfig: {
              temperature: geminiProvider.temperature,
              maxOutputTokens: 100
            }
          })
        })

        expect(response.ok).toBe(true)
        
        const data = await response.json()
        expect(data.candidates).toBeDefined()
        expect(data.candidates.length).toBeGreaterThan(0)
        expect(data.candidates[0].content.parts[0].text).toBeDefined()
        expect(typeof data.candidates[0].content.parts[0].text).toBe('string')
        expect(data.candidates[0].content.parts[0].text.length).toBeGreaterThan(10)
      } catch (error) {
        console.error('Gemini API test failed:', error)
        throw error
      }
    }, 30000)

    it('should handle technical question generation well', async () => {
      const prompt = 'Generate a coding interview question about algorithms. Include the problem statement and expected approach.'
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiProvider.model}:generateContent?key=${geminiProvider.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      })

      expect(response.ok).toBe(true)
      
      const data = await response.json()
      const content = data.candidates[0].content.parts[0].text
      
      // Should contain technical terms
      expect(content.toLowerCase()).toMatch(/(algorithm|code|function|complexity|solution)/i)
      expect(content.length).toBeGreaterThan(50)
    }, 30000)
  })

  skipIfNoKeys(hasClaudeKey)('Anthropic Claude Integration', () => {
    let claudeProvider: any

    beforeAll(() => {
      claudeProvider = llmConfig.getProvider('claude')
      expect(claudeProvider).not.toBeNull()
      expect(claudeProvider.enabled).toBe(true)
    })

    it('should successfully connect to Claude API', async () => {
      const testPrompt = 'Generate a company-specific interview question for a startup environment. Respond with just the question.'
      
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${claudeProvider.apiKey}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: claudeProvider.model,
            max_tokens: 100,
            temperature: claudeProvider.temperature,
            messages: [
              {
                role: 'user',
                content: testPrompt
              }
            ]
          })
        })

        expect(response.ok).toBe(true)
        
        const data = await response.json()
        expect(data.content).toBeDefined()
        expect(data.content.length).toBeGreaterThan(0)
        expect(data.content[0].text).toBeDefined()
        expect(typeof data.content[0].text).toBe('string')
        expect(data.content[0].text.length).toBeGreaterThan(10)
      } catch (error) {
        console.error('Claude API test failed:', error)
        throw error
      }
    }, 30000)

    it('should excel at nuanced company-specific questions', async () => {
      const prompt = 'Generate an interview question that assesses cultural fit for a company that values innovation, collaboration, and customer focus.'
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${claudeProvider.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: claudeProvider.model,
          max_tokens: 300,
          temperature: 0.7,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      })

      expect(response.ok).toBe(true)
      
      const data = await response.json()
      const content = data.content[0].text
      
      // Should contain culture-related terms
      expect(content.toLowerCase()).toMatch(/(culture|team|collaboration|innovation|customer)/i)
      expect(content.length).toBeGreaterThan(30)
    }, 30000)
  })

  describe('Cross-Provider Comparison', () => {
    const testPrompt = 'Generate a behavioral interview question about leadership.'

    it('should get different responses from different providers', async () => {
      const responses: string[] = []
      
      if (hasOpenAIKey) {
        const openaiProvider = llmConfig.getProvider('openai')
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiProvider?.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: openaiProvider?.model,
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 100,
            temperature: 0.7
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          responses.push(data.choices[0].message.content)
        }
      }

      if (hasGeminiKey) {
        const geminiProvider = llmConfig.getProvider('gemini')
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiProvider?.model}:generateContent?key=${geminiProvider?.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: testPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 100
            }
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          responses.push(data.candidates[0].content.parts[0].text)
        }
      }

      if (hasClaudeKey) {
        const claudeProvider = llmConfig.getProvider('claude')
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${claudeProvider?.apiKey}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: claudeProvider?.model,
            max_tokens: 100,
            temperature: 0.7,
            messages: [{ role: 'user', content: testPrompt }]
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          responses.push(data.content[0].text)
        }
      }

      // If we have multiple providers, responses should be different
      if (responses.length > 1) {
        const uniqueResponses = new Set(responses)
        expect(uniqueResponses.size).toBeGreaterThan(1)
      }
      
      // All responses should be valid
      responses.forEach(response => {
        expect(response).toBeDefined()
        expect(typeof response).toBe('string')
        expect(response.length).toBeGreaterThan(10)
      })
    }, 60000)
  })

  describe('Error Handling', () => {
    it('should handle invalid API keys gracefully', async () => {
      const invalidResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      })

      expect(invalidResponse.ok).toBe(false)
      expect(invalidResponse.status).toBe(401)
    })

    it('should handle malformed requests gracefully', async () => {
      if (!hasOpenAIKey) return

      const openaiProvider = llmConfig.getProvider('openai')
      const malformedResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiProvider?.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Missing required fields
          messages: 'invalid format'
        })
      })

      expect(malformedResponse.ok).toBe(false)
      expect(malformedResponse.status).toBe(400)
    })
  })
})
