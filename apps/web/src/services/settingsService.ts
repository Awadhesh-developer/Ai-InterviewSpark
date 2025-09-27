interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  avatar: string
  bio: string
  timezone: string
  language: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    marketing: boolean
  }
}

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

interface SystemSettings {
  siteName: string
  siteDescription: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailVerificationRequired: boolean
  maxFileSize: number
  sessionTimeout: number
  backupFrequency: string
  logLevel: string
}

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalSessions: number
  apiCalls: number
  storageUsed: string
  uptime: string
  serverStatus: {
    webServer: 'online' | 'offline'
    database: 'online' | 'offline'
    redis: 'online' | 'offline'
    storage: 'online' | 'offline'
  }
  resourceUsage: {
    cpu: number
    memory: number
    disk: number
  }
}

class SettingsService {
  private baseUrl = '/api/settings'

  // User Profile Methods
  async getUserProfile(): Promise<{
    success: boolean
    profile?: UserProfile
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/profile`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user profile')
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async updateUserProfile(profile: Partial<UserProfile>): Promise<{
    success: boolean
    profile?: UserProfile
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user profile')
      }

      return data
    } catch (error) {
      console.error('Error updating user profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // LLM Provider Methods
  async getLLMProviders(): Promise<{
    success: boolean
    providers?: LLMProvider[]
    usage?: {
      totalCalls: number
      monthlyCost: number
      successRate: number
    }
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/llm`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch LLM providers')
      }

      return data
    } catch (error) {
      console.error('Error fetching LLM providers:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async updateLLMProvider(providerId: string, updates: Partial<LLMProvider>): Promise<{
    success: boolean
    provider?: LLMProvider
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/llm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerId, updates }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update LLM provider')
      }

      return data
    } catch (error) {
      console.error('Error updating LLM provider:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async testLLMProvider(providerId: string): Promise<{
    success: boolean
    test?: {
      success: boolean
      responseTime: number
      model: string
    }
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerId, action: 'test' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test LLM provider')
      }

      return data
    } catch (error) {
      console.error('Error testing LLM provider:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async clearLLMProviderKey(providerId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerId, action: 'clear_key' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear API key')
      }

      return data
    } catch (error) {
      console.error('Error clearing LLM provider key:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // System Settings Methods
  async getSystemSettings(): Promise<{
    success: boolean
    settings?: SystemSettings
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/system`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch system settings')
      }

      return data
    } catch (error) {
      console.error('Error fetching system settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<{
    success: boolean
    settings?: SystemSettings
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/system`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update system settings')
      }

      return data
    } catch (error) {
      console.error('Error updating system settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getSystemMetrics(): Promise<{
    success: boolean
    metrics?: SystemMetrics
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/system?type=metrics`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch system metrics')
      }

      return data
    } catch (error) {
      console.error('Error fetching system metrics:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async createSystemBackup(): Promise<{
    success: boolean
    backup?: {
      id: string
      status: string
      size: string
      createdAt: string
    }
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/system`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'backup' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create system backup')
      }

      return data
    } catch (error) {
      console.error('Error creating system backup:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async clearSystemCache(): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/system`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear_cache' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear system cache')
      }

      return data
    } catch (error) {
      console.error('Error clearing system cache:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Utility method to handle API errors
  private handleApiError(error: any): string {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    return 'An unexpected error occurred'
  }
}

export const settingsService = new SettingsService()
export type { UserProfile, LLMProvider, SystemSettings, SystemMetrics }
