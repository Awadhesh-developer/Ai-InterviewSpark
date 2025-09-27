'use client'

import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { unifiedApiClient } from '@/lib/unified-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import UserManagement from '@/components/settings/UserManagement'
import UserCreationForm from '@/components/settings/UserCreationForm'
import PermissionManager from '@/components/settings/PermissionManager'
import { 
  Settings,
  User,
  Shield,
  Key,
  Brain,
  Bell,
  Database,
  Users,
  BarChart3,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Plus,
  Edit,
  Monitor,
  Zap,
  Cloud,
  Server,
  Activity
} from 'lucide-react'

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

interface UserRole {
  id: string
  name: string
  permissions: string[]
  userCount: number
}

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalSessions: number
  apiCalls: number
  storageUsed: string
  uptime: string
}

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState('profile')
  const isAdmin = user?.role === 'admin' || true // Allow all users to see admin tabs for now
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showUserCreation, setShowUserCreation] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)

  // LLM Providers State
  const [llmProviders, setLlmProviders] = useState<LLMProvider[]>([
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
  ])

  // User Profile State
  const [userProfile, setUserProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'Administrator',
    avatar: '',
    bio: '',
    timezone: 'UTC-8',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false
    }
  })

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    siteName: 'InterviewSpark',
    siteDescription: 'AI-Powered Interview Preparation Platform',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    maxFileSize: 10, // MB
    sessionTimeout: 30, // minutes
    backupFrequency: 'daily',
    logLevel: 'info'
  })

  // User Roles State
  const [userRoles, setUserRoles] = useState<UserRole[]>([
    {
      id: 'admin',
      name: 'Administrator',
      permissions: ['all'],
      userCount: 2
    },
    {
      id: 'expert',
      name: 'Expert Coach',
      permissions: ['coaching', 'sessions', 'analytics'],
      userCount: 15
    },
    {
      id: 'user',
      name: 'Standard User',
      permissions: ['interviews', 'resume', 'basic_analytics'],
      userCount: 1247
    }
  ])

  // System Metrics State
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalUsers: 1264,
    activeUsers: 342,
    totalSessions: 5847,
    apiCalls: 125847,
    storageUsed: '2.4 GB',
    uptime: '99.9%'
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // Load user profile
      const profileResult = await fetch('/api/settings/profile')
      if (profileResult.ok) {
        const profileData = await profileResult.json()
        if (profileData.success) {
          setUserProfile(profileData.profile)
        }
      }

      // Load LLM providers
      const llmResult = await fetch('/api/settings/llm')
      if (llmResult.ok) {
        const llmData = await llmResult.json()
        if (llmData.success) {
          setLlmProviders(llmData.providers)
        }
      }

      // Load system settings
      const systemResult = await fetch('/api/settings/system')
      if (systemResult.ok) {
        const systemData = await systemResult.json()
        if (systemData.success) {
          setSystemSettings(systemData.settings)
        }
      }

      // Load system metrics
      const metricsResult = await fetch('/api/settings/system?type=metrics')
      if (metricsResult.ok) {
        const metricsData = await metricsResult.json()
        if (metricsData.success) {
          setSystemMetrics(metricsData.metrics)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveSettings = async () => {
    try {
      setIsSaving(true)
      setSaveStatus('idle')

      // Save user profile
      const profileResponse = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile)
      })

      // Save LLM providers
      for (const provider of llmProviders) {
        await fetch('/api/settings/llm', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId: provider.id,
            updates: provider
          })
        })
      }

      // Save system settings (admin only)
      if (isAdmin) {
        await fetch('/api/settings/system', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(systemSettings)
        })
      }

      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }))
  }

  const updateLLMProvider = (providerId: string, updates: Partial<LLMProvider>) => {
    setLlmProviders(prev => prev.map(provider => 
      provider.id === providerId ? { ...provider, ...updates } : provider
    ))
  }

  const testLLMConnection = async (providerId: string) => {
    try {
      console.log(`Testing connection for ${providerId}...`)

      const response = await fetch('/api/settings/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, action: 'test' })
      })

      const result = await response.json()

      if (result.success && result.test.success) {
        alert(`✅ Connection successful!\nResponse time: ${result.test.responseTime}ms\nModel: ${result.test.model}`)
      } else {
        alert(`❌ Connection failed: ${result.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`Error testing ${providerId}:`, error)
      alert(`❌ Connection test failed: ${error}`)
    }
  }

  // User Management Functions
  const handleCreateUser = async (userData: any) => {
    try {
      setIsSaving(true)
      const user = await unifiedApiClient.createUser(userData)
      setShowUserCreation(false)
      setEditingUser(null)
      alert('User created successfully!')
    } catch (error: any) {
      console.error('Error creating user:', error)
      alert(`Failed to create user: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setShowUserCreation(true)
  }

  const handleUpdateUser = async (userData: any) => {
    if (!editingUser) return

    try {
      setIsSaving(true)
      // Only include fields that have changed and are allowed to be updated
      const updateData: any = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        department: userData.department,
        phoneNumber: userData.phoneNumber,
        bio: userData.bio,
        status: userData.isActive ? 'active' : 'inactive'
      }

      // Only include password if it was provided
      if (userData.password) {
        updateData.password = userData.password
      }

      const updatedUser = await unifiedApiClient.updateUser(editingUser.id, updateData)
      setShowUserCreation(false)
      setEditingUser(null)
      alert('User updated successfully!')
    } catch (error: any) {
      console.error('Error updating user:', error)
      alert(`Failed to update user: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      await unifiedApiClient.deleteUser(userId)
      alert('User deleted successfully!')
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(`Failed to delete user: ${error.message}`)
    }
  }

  const handleViewUser = (user: any) => {
    const userDetails = `
User Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Name: ${user.firstName} ${user.lastName}
📧 Email: ${user.email}
🎯 Role: ${user.role}
🏢 Department: ${user.department || 'Not specified'}
📱 Phone: ${user.phoneNumber || 'Not specified'}
📝 Bio: ${user.bio || 'Not specified'}
📊 Status: ${user.status}
🔑 Permissions: ${user.permissions?.length || 0} permissions
📅 Created: ${new Date(user.createdAt).toLocaleDateString()}
🕒 Last Login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
    `.trim()
    
    alert(userDetails)
  }

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>Personal Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={userProfile.firstName}
                onChange={(e) => setUserProfile(prev => ({ ...prev, firstName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={userProfile.lastName}
                onChange={(e) => setUserProfile(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={userProfile.email}
              onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={userProfile.bio}
              onChange={(e) => setUserProfile(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={userProfile.timezone}
                onChange={(e) => setUserProfile(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full p-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="UTC-8">Pacific Time (UTC-8)</option>
                <option value="UTC-5">Eastern Time (UTC-5)</option>
                <option value="UTC+0">UTC</option>
                <option value="UTC+1">Central European Time (UTC+1)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={userProfile.language}
                onChange={(e) => setUserProfile(prev => ({ ...prev, language: e.target.value }))}
                className="w-full p-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-green-600" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(userProfile.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()} Notifications
              </Label>
              <Switch
                id={key}
                checked={value}
                onCheckedChange={(checked) => 
                  setUserProfile(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, [key]: checked }
                  }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  // For now, allow access even if not authenticated to prevent login redirect
  // In production, you might want proper authentication checks here

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
              <Settings className="h-8 w-8 text-primary" />
              <span>Settings</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your account, system configuration, and AI integrations
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {saveStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Settings saved</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Save failed</span>
              </div>
            )}
            <Button 
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="llm" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Models</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="users" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center space-x-2">
                  <Server className="h-4 w-4" />
                  <span className="hidden sm:inline">System</span>
                </TabsTrigger>
                <TabsTrigger value="monitoring" className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Monitor</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            {renderProfileSettings()}
          </TabsContent>

          {/* LLM Integration Settings */}
          <TabsContent value="llm">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span>AI Model Providers</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure API keys and settings for AI model providers used throughout the application
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {llmProviders.map((provider) => (
                      <div key={provider.id} className="border border-border rounded-lg p-6 bg-card">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${provider.enabled ? 'bg-green-500' : 'bg-muted'}`} />
                            <h3 className="text-lg font-medium text-foreground">{provider.displayName}</h3>
                            <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                              {provider.enabled ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <Switch
                            checked={provider.enabled}
                            onCheckedChange={(checked) => updateLLMProvider(provider.id, { enabled: checked })}
                          />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`${provider.id}-api-key`}>{provider.apiKeyLabel}</Label>
                            <div className="relative mt-1">
                              <Input
                                id={`${provider.id}-api-key`}
                                type={showApiKeys[provider.id] ? 'text' : 'password'}
                                value={provider.apiKey}
                                onChange={(e) => updateLLMProvider(provider.id, { apiKey: e.target.value })}
                                placeholder="Enter API key..."
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => toggleApiKeyVisibility(provider.id)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              >
                                {showApiKeys[provider.id] ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor={`${provider.id}-model`}>Default Model</Label>
                            <select
                              id={`${provider.id}-model`}
                              value={provider.defaultModel}
                              onChange={(e) => updateLLMProvider(provider.id, { defaultModel: e.target.value })}
                              className="w-full mt-1 p-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              {provider.models.map((model) => (
                                <option key={model} value={model}>{model}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <Label htmlFor={`${provider.id}-rate-limit`}>Rate Limit (requests/hour)</Label>
                            <Input
                              id={`${provider.id}-rate-limit`}
                              type="number"
                              value={provider.rateLimit}
                              onChange={(e) => updateLLMProvider(provider.id, { rateLimit: parseInt(e.target.value) })}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`${provider.id}-cost`}>Cost per 1K tokens ($)</Label>
                            <Input
                              id={`${provider.id}-cost`}
                              type="number"
                              step="0.001"
                              value={provider.cost}
                              onChange={(e) => updateLLMProvider(provider.id, { cost: parseFloat(e.target.value) })}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testLLMConnection(provider.id)}
                            disabled={!provider.apiKey || !provider.enabled}
                          >
                            <Zap className="mr-2 h-4 w-4" />
                            Test Connection
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateLLMProvider(provider.id, { apiKey: '' })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear Key
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="h-5 w-5 text-yellow-600" />
                    <span>API Usage & Monitoring</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">125,847</div>
                      <div className="text-sm text-muted-foreground">Total API Calls</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">$247.32</div>
                      <div className="text-sm text-muted-foreground">Monthly Cost</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">99.2%</div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-red-600" />
                    <span>Password & Authentication</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <Button className="bg-red-600 hover:bg-red-700">
                    <Lock className="mr-2 h-4 w-4" />
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span>Two-Factor Authentication</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div>
                      <h4 className="font-medium text-foreground">Enable 2FA</h4>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="h-5 w-5 text-blue-600" />
                    <span>API Keys</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Personal API Keys</h4>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Generate Key
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {[
                        { name: 'Production API Key', created: '2024-01-15', lastUsed: '2 hours ago', status: 'active' },
                        { name: 'Development API Key', created: '2024-01-10', lastUsed: '1 day ago', status: 'active' }
                      ].map((key, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                          <div>
                            <h5 className="font-medium text-foreground">{key.name}</h5>
                            <p className="text-sm text-muted-foreground">Created: {key.created} • Last used: {key.lastUsed}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                              {key.status}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              {showUserCreation ? (
                <UserCreationForm
                  onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                  onCancel={() => {
                    setShowUserCreation(false)
                    setEditingUser(null)
                  }}
                  isLoading={isSaving}
                  editingUser={editingUser}
                  isEditMode={!!editingUser}
                />
              ) : (
                <UserManagement
                  onCreateUser={() => setShowUserCreation(true)}
                  onEditUser={handleEditUser}
                  onDeleteUser={handleDeleteUser}
                  onViewUser={handleViewUser}
                />
              )}
            </TabsContent>
          )}

          {isAdmin && (
            <>
              <TabsContent value="admin">
                <div className="space-y-6">
                  {/* User Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <span>User Management</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{systemMetrics.totalUsers}</div>
                          <div className="text-sm text-muted-foreground">Total Users</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{systemMetrics.activeUsers}</div>
                          <div className="text-sm text-muted-foreground">Active Users</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{systemMetrics.totalSessions}</div>
                          <div className="text-sm text-muted-foreground">Total Sessions</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-foreground">User Roles</h4>
                          <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Role
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {userRoles.map((role) => (
                            <div key={role.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                              <div>
                                <h5 className="font-medium text-foreground">{role.name}</h5>
                                <p className="text-sm text-muted-foreground">{role.userCount} users</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{role.permissions.length} permissions</Badge>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-red-600" />
                        <span>System Actions</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-border rounded-lg bg-card">
                          <h4 className="font-medium text-foreground mb-2">Maintenance Mode</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Enable maintenance mode to prevent user access during updates
                          </p>
                          <div className="flex items-center justify-between">
                            <Switch
                              checked={systemSettings.maintenanceMode}
                              onCheckedChange={(checked) =>
                                setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))
                              }
                            />
                            <Badge variant={systemSettings.maintenanceMode ? 'destructive' : 'default'}>
                              {systemSettings.maintenanceMode ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>

                        <div className="p-4 border border-border rounded-lg bg-card">
                          <h4 className="font-medium text-foreground mb-2">User Registration</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Allow new users to register for accounts
                          </p>
                          <div className="flex items-center justify-between">
                            <Switch
                              checked={systemSettings.registrationEnabled}
                              onCheckedChange={(checked) =>
                                setSystemSettings(prev => ({ ...prev, registrationEnabled: checked }))
                              }
                            />
                            <Badge variant={systemSettings.registrationEnabled ? 'default' : 'secondary'}>
                              {systemSettings.registrationEnabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>

                        <div className="p-4 border border-border rounded-lg bg-card">
                          <h4 className="font-medium text-foreground mb-2">Email Verification</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Require email verification for new accounts
                          </p>
                          <div className="flex items-center justify-between">
                            <Switch
                              checked={systemSettings.emailVerificationRequired}
                              onCheckedChange={(checked) =>
                                setSystemSettings(prev => ({ ...prev, emailVerificationRequired: checked }))
                              }
                            />
                            <Badge variant={systemSettings.emailVerificationRequired ? 'default' : 'secondary'}>
                              {systemSettings.emailVerificationRequired ? 'Required' : 'Optional'}
                            </Badge>
                          </div>
                        </div>

                        <div className="p-4 border border-border rounded-lg bg-card">
                          <h4 className="font-medium text-foreground mb-2">System Backup</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Create a full system backup
                          </p>
                          <Button variant="outline" className="w-full">
                            <Database className="mr-2 h-4 w-4" />
                            Create Backup
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="system">
                <div className="space-y-6">
                  {/* General System Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Server className="h-5 w-5 text-green-600" />
                        <span>General Configuration</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="siteName">Site Name</Label>
                          <Input
                            id="siteName"
                            value={systemSettings.siteName}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                          <Input
                            id="sessionTimeout"
                            type="number"
                            value={systemSettings.sessionTimeout}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="siteDescription">Site Description</Label>
                        <Textarea
                          id="siteDescription"
                          value={systemSettings.siteDescription}
                          onChange={(e) => setSystemSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                          <Input
                            id="maxFileSize"
                            type="number"
                            value={systemSettings.maxFileSize}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="logLevel">Log Level</Label>
                          <select
                            id="logLevel"
                            value={systemSettings.logLevel}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, logLevel: e.target.value }))}
                            className="w-full p-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="debug">Debug</option>
                            <option value="info">Info</option>
                            <option value="warn">Warning</option>
                            <option value="error">Error</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Backup & Storage */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        <span>Backup & Storage</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="backupFrequency">Backup Frequency</Label>
                          <select
                            id="backupFrequency"
                            value={systemSettings.backupFrequency}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                            className="w-full mt-1 p-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>

                        <div className="text-center p-4 bg-muted/50 rounded-lg border border-border">
                          <div className="text-lg font-bold text-foreground">{systemMetrics.storageUsed}</div>
                          <div className="text-sm text-muted-foreground">Storage Used</div>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Cloud className="mr-2 h-4 w-4" />
                            Manage Storage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="monitoring">
                <div className="space-y-6">
                  {/* System Health */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-green-600" />
                        <span>System Health</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{systemMetrics.uptime}</div>
                          <div className="text-sm text-muted-foreground">Uptime</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{systemMetrics.apiCalls.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">API Calls</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{systemMetrics.activeUsers}</div>
                          <div className="text-sm text-muted-foreground">Active Users</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">45ms</div>
                          <div className="text-sm text-muted-foreground">Avg Response</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-border rounded-lg bg-card">
                          <h4 className="font-medium text-foreground mb-2 flex items-center">
                            <Monitor className="mr-2 h-4 w-4" />
                            Server Status
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Web Server</span>
                              <Badge className="bg-green-100 text-green-800">Online</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Database</span>
                              <Badge className="bg-green-100 text-green-800">Online</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Redis Cache</span>
                              <Badge className="bg-green-100 text-green-800">Online</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">File Storage</span>
                              <Badge className="bg-green-100 text-green-800">Online</Badge>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 border border-border rounded-lg bg-card">
                          <h4 className="font-medium text-foreground mb-2 flex items-center">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Resource Usage
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>CPU Usage</span>
                                <span>23%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full" style={{ width: '23%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Memory Usage</span>
                                <span>67%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div className="bg-yellow-500 dark:bg-yellow-400 h-2 rounded-full" style={{ width: '67%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Disk Usage</span>
                                <span>45%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div className="bg-green-500 dark:bg-green-400 h-2 rounded-full" style={{ width: '45%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <span>Recent Activity</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { time: '2 minutes ago', event: 'User john.doe@example.com logged in', type: 'info' },
                          { time: '5 minutes ago', event: 'AI coaching session started', type: 'success' },
                          { time: '12 minutes ago', event: 'System backup completed', type: 'success' },
                          { time: '1 hour ago', event: 'API rate limit exceeded for user', type: 'warning' },
                          { time: '2 hours ago', event: 'New user registration: jane.smith@example.com', type: 'info' }
                        ].map((activity, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full ${
                                activity.type === 'success' ? 'bg-green-500' :
                                activity.type === 'warning' ? 'bg-yellow-500' :
                                activity.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                              }`} />
                              <span className="text-sm text-foreground">{activity.event}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  )
}
