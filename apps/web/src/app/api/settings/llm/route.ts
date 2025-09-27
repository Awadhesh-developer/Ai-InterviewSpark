import { NextRequest, NextResponse } from 'next/server'

interface LLMProvider {
  id: string
  name: string
  displayName: string
  apiKeyLabel: string
  models: string[]
  enabled: boolean
  apiKey: string
  defaultModel: string
  rateLimit: number
  cost: number
}

// Mock LLM providers data - in production, this would be stored in a database
let llmProviders: LLMProvider[] = [
  {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI GPT',
    apiKeyLabel: 'OpenAI API Key',
    models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
    enabled: false,
    apiKey: '',
    defaultModel: 'gpt-4-turbo-preview',
    rateLimit: 1000,
    cost: 0.03
  },
  {
    id: 'gemini',
    name: 'gemini',
    displayName: 'Google Gemini',
    apiKeyLabel: 'Gemini API Key',
    models: ['gemini-pro', 'gemini-pro-vision'],
    enabled: false,
    apiKey: '',
    defaultModel: 'gemini-pro',
    rateLimit: 500,
    cost: 0.02
  },
  {
    id: 'claude',
    name: 'claude',
    displayName: 'Anthropic Claude',
    apiKeyLabel: 'Claude API Key',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    enabled: false,
    apiKey: '',
    defaultModel: 'claude-3-sonnet',
    rateLimit: 300,
    cost: 0.05
  }
]

export async function GET(request: NextRequest) {
  try {
    // Check if user has admin permissions
    const isAdmin = true // Replace with actual admin check

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Return providers with masked API keys for security
    const maskedProviders = llmProviders.map(provider => ({
      ...provider,
      apiKey: provider.apiKey ? '***' + provider.apiKey.slice(-4) : ''
    }))

    return NextResponse.json({
      success: true,
      providers: maskedProviders,
      usage: {
        totalCalls: 125847,
        monthlyCost: 247.32,
        successRate: 99.2
      }
    })
  } catch (error) {
    console.error('Error fetching LLM providers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch LLM providers' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAdmin = true // Replace with actual admin check

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { providerId, updates } = body

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }

    // Find and update the provider
    const providerIndex = llmProviders.findIndex(p => p.id === providerId)
    if (providerIndex === -1) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Validate updates
    if (updates.apiKey && typeof updates.apiKey !== 'string') {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      )
    }

    if (updates.rateLimit && (typeof updates.rateLimit !== 'number' || updates.rateLimit < 0)) {
      return NextResponse.json(
        { error: 'Invalid rate limit' },
        { status: 400 }
      )
    }

    // Update the provider
    llmProviders[providerIndex] = {
      ...llmProviders[providerIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    // Log the update for audit purposes
    console.log(`LLM provider ${providerId} updated:`, {
      fields: Object.keys(updates),
      timestamp: new Date().toISOString()
    })

    // Return updated provider with masked API key
    const updatedProvider = {
      ...llmProviders[providerIndex],
      apiKey: llmProviders[providerIndex].apiKey ? '***' + llmProviders[providerIndex].apiKey.slice(-4) : ''
    }

    return NextResponse.json({
      success: true,
      provider: updatedProvider,
      message: 'Provider updated successfully'
    })
  } catch (error) {
    console.error('Error updating LLM provider:', error)
    return NextResponse.json(
      { error: 'Failed to update LLM provider' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = true // Replace with actual admin check

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { providerId, action } = body

    if (!providerId || !action) {
      return NextResponse.json(
        { error: 'Provider ID and action are required' },
        { status: 400 }
      )
    }

    const provider = llmProviders.find(p => p.id === providerId)
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'test':
        // Test API connection
        if (!provider.apiKey || !provider.enabled) {
          return NextResponse.json(
            { error: 'Provider not configured or disabled' },
            { status: 400 }
          )
        }

        // Mock API test - in production, make actual API call
        const testResult = {
          success: Math.random() > 0.1, // 90% success rate
          responseTime: Math.floor(Math.random() * 1000) + 200, // 200-1200ms
          model: provider.defaultModel
        }

        return NextResponse.json({
          success: testResult.success,
          test: testResult,
          message: testResult.success ? 'Connection successful' : 'Connection failed'
        })

      case 'clear_key':
        // Clear API key
        const providerIndex = llmProviders.findIndex(p => p.id === providerId)
        llmProviders[providerIndex].apiKey = ''
        llmProviders[providerIndex].enabled = false

        return NextResponse.json({
          success: true,
          message: 'API key cleared successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing LLM provider action:', error)
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    )
  }
}
