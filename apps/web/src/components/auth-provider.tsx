'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize } = useAuthStore()

  useEffect(() => {
    // Always initialize on mount to check for stored tokens
    console.log('AuthProvider - Initializing auth state on mount')
    initialize().catch((error) => {
      console.error('AuthProvider - Auth initialization failed:', error)
    })
  }, [initialize])

  return <>{children}</>
}
