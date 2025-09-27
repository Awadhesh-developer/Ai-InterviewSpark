'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('password123')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { login, isLoading, user, isAuthenticated, error } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    console.log('Simple login form submitted:', { email, password })
    
    try {
      await login({ email, password })
      console.log('Login successful, redirecting...')
      router.push('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Simple Login Test</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-medium text-gray-900">Status:</h3>
            <div className="mt-2 text-sm text-gray-600">
              <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
              <div>Submitting: {isSubmitting ? 'Yes' : 'No'}</div>
              <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
              <div>User: {user ? `${user.firstName} ${user.lastName}` : 'None'}</div>
              <div>Error: {error || 'None'}</div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Button 
              onClick={() => window.location.href = '/auth/login'} 
              variant="outline"
              className="w-full"
            >
              Go to React Hook Form Login
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/test-login'} 
              variant="ghost"
              className="w-full"
            >
              Go to Test Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
