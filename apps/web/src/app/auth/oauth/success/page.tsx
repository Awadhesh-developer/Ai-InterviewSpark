'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

function OAuthSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getCurrentUser } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token')
        const userParam = searchParams.get('user')
        const isNewUser = searchParams.get('new_user') === 'true'
        const error = searchParams.get('error')

        if (error) {
          throw new Error(decodeURIComponent(error))
        }

        if (!token || !userParam) {
          throw new Error('Missing authentication data')
        }

        // Parse user data
        const user = JSON.parse(decodeURIComponent(userParam))

        // Store token in cookie and localStorage
        if (typeof document !== 'undefined') {
          document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Lax`
          localStorage.setItem('auth_token', token)
        }

        // Hydrate auth store from backend using token
        await getCurrentUser()

        setStatus('success')
        setMessage(
          isNewUser 
            ? 'Welcome! Your account has been created successfully.' 
            : 'Welcome back! You have been logged in successfully.'
        )

        // Show success toast
        toast.success(
          isNewUser 
            ? 'Account created successfully!' 
            : 'Logged in successfully!'
        )

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)

      } catch (error: any) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setMessage(error.message || 'Authentication failed')
        toast.error(error.message || 'Authentication failed')
      }
    }

    handleOAuthCallback()
  }, [searchParams, router, getCurrentUser])

  const handleRetry = () => {
    router.push('/auth/login')
  }

  const handleContinue = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-12 h-12 text-green-600" />
            )}
            {status === 'error' && (
              <AlertCircle className="w-12 h-12 text-red-600" />
            )}
          </div>
          
          <CardTitle className="text-xl">
            {status === 'loading' && 'Completing Authentication...'}
            {status === 'success' && 'Authentication Successful!'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
          
          <CardDescription>
            {status === 'loading' && 'Please wait while we complete your authentication.'}
            {status === 'success' && message}
            {status === 'error' && message}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-sm text-gray-600">Verifying your credentials...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Redirecting you to the dashboard...
              </p>
              <Button onClick={handleContinue} className="w-full">
                Continue to Dashboard
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Please try again or contact support if the problem persists.
              </p>
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-xl">Loading...</CardTitle>
            <CardDescription>Please wait while we process your authentication.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <OAuthSuccessContent />
    </Suspense>
  )
}
