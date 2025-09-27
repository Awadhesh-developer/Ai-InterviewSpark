'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Link as LinkIcon, Unlink, AlertTriangle } from 'lucide-react'
import { OAuthButton } from '@/components/auth/OAuthButtons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export type OAuthProvider = 'google' | 'facebook' | 'linkedin'

interface OAuthProviderData {
  id: string
  provider: OAuthProvider
  providerEmail: string
  createdAt: string
}

interface OAuthProvidersProps {
  className?: string
}

export default function OAuthProviders({ className = '' }: OAuthProvidersProps) {
  const [providers, setProviders] = useState<OAuthProviderData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unlinkingProvider, setUnlinkingProvider] = useState<OAuthProvider | null>(null)

  // Fetch user's OAuth providers
  const fetchProviders = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/oauth/providers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch OAuth providers')
      }

      setProviders(data.data.providers || [])
    } catch (error: any) {
      console.error('Failed to fetch OAuth providers:', error)
      toast.error(error.message || 'Failed to load OAuth providers')
    } finally {
      setIsLoading(false)
    }
  }

  // Unlink OAuth provider
  const unlinkProvider = async (provider: OAuthProvider) => {
    try {
      setUnlinkingProvider(provider)
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/oauth/unlink/${provider}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to unlink OAuth provider')
      }

      // Remove provider from local state
      setProviders(prev => prev.filter(p => p.provider !== provider))
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked successfully`)
    } catch (error: any) {
      console.error('Failed to unlink OAuth provider:', error)
      toast.error(error.message || 'Failed to unlink OAuth provider')
    } finally {
      setUnlinkingProvider(null)
    }
  }

  // Handle successful OAuth linking
  const handleLinkSuccess = (provider: OAuthProvider) => {
    toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account linking initiated`)
    // Refresh providers list after a delay to allow for OAuth completion
    setTimeout(() => {
      fetchProviders()
    }, 2000)
  }

  // Handle OAuth linking error
  const handleLinkError = (error: string) => {
    toast.error(error || 'Failed to link OAuth provider')
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  const getProviderIcon = (provider: OAuthProvider) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )
      case 'facebook':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )
      case 'linkedin':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        )
      default:
        return null
    }
  }

  const getProviderName = (provider: OAuthProvider) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1)
  }

  const isProviderLinked = (provider: OAuthProvider) => {
    return providers.some(p => p.provider === provider)
  }

  const allProviders: OAuthProvider[] = ['google', 'facebook', 'linkedin']

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your OAuth provider connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading connected accounts...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          Link your social accounts for easier sign-in and enhanced features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {allProviders.map((provider) => {
          const linkedProvider = providers.find(p => p.provider === provider)
          const isLinked = !!linkedProvider

          return (
            <div key={provider} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getProviderIcon(provider)}
                <div>
                  <h4 className="font-medium">{getProviderName(provider)}</h4>
                  {isLinked ? (
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-600">{linkedProvider.providerEmail}</p>
                      <Badge variant="secondary" className="text-xs">
                        Connected
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not connected</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {isLinked ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={unlinkingProvider === provider}
                      >
                        {unlinkingProvider === provider ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Unlink className="w-4 h-4" />
                        )}
                        <span className="ml-2">Unlink</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Unlink {getProviderName(provider)} Account</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to unlink your {getProviderName(provider)} account? 
                          You will no longer be able to sign in using this provider.
                          {providers.length === 1 && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-start space-x-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                              <span className="text-sm text-yellow-800">
                                This is your only connected account. Make sure you have a password set before unlinking.
                              </span>
                            </div>
                          )}
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button
                          onClick={() => unlinkProvider(provider)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Unlink Account
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <OAuthButton
                    provider={provider}
                    mode="link"
                    onSuccess={handleLinkSuccess}
                    onError={handleLinkError}
                    className="text-sm"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span className="ml-2">Link</span>
                  </OAuthButton>
                )}
              </div>
            </div>
          )
        })}

        {providers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No accounts connected yet</p>
            <p className="text-sm">Link your social accounts for easier access</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
