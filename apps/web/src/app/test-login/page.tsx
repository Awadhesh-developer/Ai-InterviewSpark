'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestLoginPage() {
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('password123')
  const { login, isLoading, user, isAuthenticated, error } = useAuthStore()

  const handleTestLogin = async () => {
    console.log('🧪 Test login started')
    try {
      await login({ email, password })
      console.log('✅ Test login successful')
    } catch (error) {
      console.error('❌ Test login failed:', error)
    }
  }

  const handleDirectApiTest = async () => {
    console.log('🔧 Direct API test started')
    try {
      const { apiClient } = await import('@/lib/api')
      const result = await apiClient.login({ email, password })
      console.log('✅ Direct API test successful:', result)
    } catch (error) {
      console.error('❌ Direct API test failed:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
            />
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleTestLogin} 
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              Test Login via Store
            </Button>

            <Button 
              onClick={handleDirectApiTest} 
              variant="outline"
              className="w-full"
            >
              Test Direct API Call
            </Button>
          </div>

          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-medium text-gray-900">Auth State:</h3>
            <div className="mt-2 text-sm text-gray-600">
              <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
              <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
              <div>User: {user ? `${user.firstName} ${user.lastName}` : 'None'}</div>
              <div>Error: {error || 'None'}</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h3 className="font-medium text-blue-900">Environment:</h3>
            <div className="mt-2 text-sm text-blue-600">
              <div>NODE_ENV: {process.env.NODE_ENV}</div>
              <div>API_URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</div>
              <div>USE_MOCK_API: {process.env.NEXT_PUBLIC_USE_MOCK_API || 'Not set'}</div>
            </div>
          </div>

          <div className="mt-4">
            <Button 
              onClick={() => window.location.href = '/auth/login'} 
              variant="ghost"
              className="w-full"
            >
              Go to Real Login Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
