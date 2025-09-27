'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// OAuth provider icons (you can replace with actual icons)
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const LinkedInIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

export type OAuthProvider = 'google' | 'facebook' | 'linkedin'

interface OAuthButtonsProps {
  mode?: 'login' | 'signup' | 'link'
  onSuccess?: (provider: OAuthProvider) => void
  onError?: (error: string) => void
  className?: string
}

export default function OAuthButtons({ 
  mode = 'login', 
  onSuccess, 
  onError,
  className = '' 
}: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null)

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    try {
      setLoadingProvider(provider)
      
      // Get the current URL for redirect after OAuth
      const currentUrl = window.location.href
      const redirectUrl = mode === 'link' ? currentUrl : `${window.location.origin}/auth/oauth/success`
      
      // Determine the API endpoint based on mode
      const endpoint = mode === 'link' 
        ? `/api/oauth/link/${provider}?redirect_url=${encodeURIComponent(redirectUrl)}`
        : `/api/oauth/auth/${provider}?redirect_url=${encodeURIComponent(redirectUrl)}`
      
      // Get authorization URL from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${endpoint}`, {
        method: mode === 'link' ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(mode === 'link' && {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          })
        },
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || `Failed to initiate ${provider} authentication`)
      }

      // Redirect to OAuth provider
      window.location.href = data.data.authorizationUrl
      
      onSuccess?.(provider)
    } catch (error: any) {
      console.error(`${provider} OAuth error:`, error)
      toast.error(error.message || `Failed to authenticate with ${provider}`)
      onError?.(error.message)
    } finally {
      setLoadingProvider(null)
    }
  }

  const getButtonText = (provider: OAuthProvider) => {
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1)
    switch (mode) {
      case 'signup':
        return `Sign up with ${providerName}`
      case 'link':
        return `Link ${providerName} account`
      default:
        return `Continue with ${providerName}`
    }
  }

  const getProviderIcon = (provider: OAuthProvider) => {
    switch (provider) {
      case 'google':
        return <GoogleIcon />
      case 'facebook':
        return <FacebookIcon />
      case 'linkedin':
        return <LinkedInIcon />
      default:
        return null
    }
  }

  const getProviderColor = (provider: OAuthProvider) => {
    switch (provider) {
      case 'google':
        return 'hover:bg-red-50 border-gray-300 text-gray-700'
      case 'facebook':
        return 'hover:bg-blue-50 border-blue-300 text-blue-700'
      case 'linkedin':
        return 'hover:bg-blue-50 border-blue-300 text-blue-700'
      default:
        return 'hover:bg-gray-50 border-gray-300 text-gray-700'
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {(['google', 'facebook', 'linkedin'] as OAuthProvider[]).map((provider) => (
        <Button
          key={provider}
          type="button"
          variant="outline"
          className={`w-full h-11 ${getProviderColor(provider)}`}
          onClick={() => handleOAuthLogin(provider)}
          disabled={loadingProvider !== null}
        >
          {loadingProvider === provider ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          ) : (
            <span className="mr-3">{getProviderIcon(provider)}</span>
          )}
          {getButtonText(provider)}
        </Button>
      ))}
    </div>
  )
}

// Individual OAuth button component for more granular control
interface OAuthButtonProps {
  provider: OAuthProvider
  mode?: 'login' | 'signup' | 'link'
  onSuccess?: (provider: OAuthProvider) => void
  onError?: (error: string) => void
  className?: string
  children?: React.ReactNode
}

export function OAuthButton({ 
  provider, 
  mode = 'login', 
  onSuccess, 
  onError,
  className = '',
  children 
}: OAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleOAuthLogin = async () => {
    try {
      setIsLoading(true)
      
      const currentUrl = window.location.href
      const redirectUrl = mode === 'link' ? currentUrl : `${window.location.origin}/auth/oauth/success`
      
      const endpoint = mode === 'link' 
        ? `/api/oauth/link/${provider}?redirect_url=${encodeURIComponent(redirectUrl)}`
        : `/api/oauth/auth/${provider}?redirect_url=${encodeURIComponent(redirectUrl)}`
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${endpoint}`, {
        method: mode === 'link' ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(mode === 'link' && {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          })
        },
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || `Failed to initiate ${provider} authentication`)
      }

      window.location.href = data.data.authorizationUrl
      onSuccess?.(provider)
    } catch (error: any) {
      console.error(`${provider} OAuth error:`, error)
      toast.error(error.message || `Failed to authenticate with ${provider}`)
      onError?.(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={handleOAuthLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <span className="mr-2">{getProviderIcon(provider)}</span>
      )}
      {children || `Continue with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
    </Button>
  )
}

function getProviderIcon(provider: OAuthProvider) {
  switch (provider) {
    case 'google':
      return <GoogleIcon />
    case 'facebook':
      return <FacebookIcon />
    case 'linkedin':
      return <LinkedInIcon />
    default:
      return null
  }
}
