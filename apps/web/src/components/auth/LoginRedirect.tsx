'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'

interface LoginRedirectProps {
  redirectTo?: string
  delay?: number
}

export default function LoginRedirect({ redirectTo = '/dashboard', delay = 1000 }: LoginRedirectProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User authenticated, redirecting to:', redirectTo)
      
      // Use multiple redirect methods for reliability
      const redirect = () => {
        try {
          // Method 1: Router push
          router.push(redirectTo)
          
          // Method 2: Window location (fallback)
          setTimeout(() => {
            if (window.location.pathname !== redirectTo) {
              window.location.href = redirectTo
            }
          }, 500)
        } catch (error) {
          console.error('Redirect error:', error)
          // Final fallback
          window.location.href = redirectTo
        }
      }

      // Delay the redirect slightly to ensure state is updated
      const timer = setTimeout(redirect, delay)
      
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, redirectTo, delay, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg border">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    </div>
  )
}
