'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const ERROR_MESSAGES: Record<string, string> = {
  'access_denied': 'You denied access to your account. Please try again and grant the necessary permissions.',
  'invalid_request': 'The authentication request was invalid. Please try again.',
  'unauthorized_client': 'The application is not authorized to perform this action.',
  'unsupported_response_type': 'The authentication method is not supported.',
  'invalid_scope': 'The requested permissions are invalid.',
  'server_error': 'The authentication server encountered an error. Please try again later.',
  'temporarily_unavailable': 'The authentication service is temporarily unavailable. Please try again later.',
  'validation_failed': 'The authentication data was invalid. Please try again.',
  'unsupported_provider': 'The selected authentication provider is not supported.',
  'authentication_failed': 'Authentication failed. Please try again.',
  'state_mismatch': 'Security validation failed. Please try again.',
  'token_exchange_failed': 'Failed to complete authentication. Please try again.',
}

function OAuthErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorCode, setErrorCode] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [errorDescription, setErrorDescription] = useState<string>('')

  useEffect(() => {
    const error = searchParams.get('error') || 'unknown_error'
    const description = searchParams.get('error_description') || ''
    
    setErrorCode(error)
    setErrorDescription(description)
    
    // Get user-friendly error message
    const friendlyMessage = ERROR_MESSAGES[error] || 
      'An unexpected error occurred during authentication. Please try again.'
    
    setErrorMessage(friendlyMessage)

    // Show error toast
    toast.error('Authentication failed')
  }, [searchParams])

  const handleRetry = () => {
    router.push('/auth/login')
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const getErrorTitle = () => {
    switch (errorCode) {
      case 'access_denied':
        return 'Access Denied'
      case 'server_error':
      case 'temporarily_unavailable':
        return 'Service Unavailable'
      case 'invalid_request':
      case 'validation_failed':
        return 'Invalid Request'
      default:
        return 'Authentication Failed'
    }
  }

  const getErrorIcon = () => {
    return <AlertCircle className="w-12 h-12 text-red-600" />
  }

  const shouldShowRetry = () => {
    // Don't show retry for permanent errors like access_denied
    return !['access_denied', 'unauthorized_client', 'unsupported_response_type'].includes(errorCode)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {getErrorIcon()}
          </div>
          
          <CardTitle className="text-xl text-red-700">
            {getErrorTitle()}
          </CardTitle>
          
          <CardDescription className="text-gray-600">
            {errorMessage}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error details for debugging (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 p-3 rounded-md text-sm">
              <p className="font-medium text-gray-700">Debug Information:</p>
              <p className="text-gray-600">Error Code: {errorCode}</p>
              {errorDescription && (
                <p className="text-gray-600">Description: {errorDescription}</p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {shouldShowRetry() && (
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            
            <Button onClick={handleGoHome} variant="ghost" className="w-full">
              Return to Home
            </Button>
          </div>

          {/* Help text */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-500">
              Need help? Contact our{' '}
              <a 
                href="/support" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                support team
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function OAuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
            </div>
            <CardTitle className="text-xl">Loading...</CardTitle>
            <CardDescription>Processing error information...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <OAuthErrorContent />
    </Suspense>
  )
}
