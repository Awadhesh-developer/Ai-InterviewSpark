import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, LoginRequest, RegisterRequest } from '@/types'
import { unifiedApiClient } from '@/lib/unified-api'
import { toast } from 'sonner'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  _hasHydrated: boolean
}

interface AuthActions {
  normalizeUser: (raw: any) => User
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Ensures API user shape matches frontend User type
      normalizeUser: (raw: any): User => ({
        id: raw.id,
        email: raw.email,
        firstName: raw.firstName || raw.first_name || '',
        lastName: raw.lastName || raw.last_name || '',
        role: raw.role || 'job_seeker',
        avatar: raw.avatar || '',
        bio: raw.bio || '',
        location: raw.location || '',
        timezone: raw.timezone || 'UTC',
        language: raw.language || 'en',
        accessibility: raw.accessibility || { highContrast: false, screenReader: false, captions: true },
        createdAt: raw.createdAt || new Date().toISOString(),
        updatedAt: raw.updatedAt || new Date().toISOString(),
      }),
      // Initial state - start with loading true to prevent premature redirects
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start with loading true
      error: null,
      _hasHydrated: false,

      // Actions
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null })

          const authResponse = await unifiedApiClient.login(credentials)

          // Set cookie for middleware authentication
          if (typeof document !== 'undefined') {
            document.cookie = `auth_token=${authResponse.token}; path=/; max-age=86400; SameSite=Lax`
            console.log('Auth token set in cookie:', authResponse.token)
          }

          set({
            user: get().normalizeUser(authResponse.user),
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          console.log('Auth state updated, isAuthenticated:', true)
          toast.success('Successfully logged in!')
        } catch (error: any) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message,
          })
          toast.error(error.message || 'Login failed')
          throw error
        }
      },

      register: async (userData: RegisterRequest) => {
        try {
          set({ isLoading: true, error: null })

          const authResponse = await unifiedApiClient.register(userData)

          set({
            user: get().normalizeUser(authResponse.user),
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          toast.success('Account created successfully!')
        } catch (error: any) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message,
          })
          toast.error(error.message || 'Registration failed')
          throw error
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true })

          await unifiedApiClient.logout()

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })

          toast.success('Successfully logged out')
        } catch (error: any) {
          // Even if logout fails on server, clear local state
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })

          toast.error('Logout failed, but you have been signed out locally')
        }
      },

      getCurrentUser: async () => {
        try {
          set({ isLoading: true, error: null })

          const user = await unifiedApiClient.getCurrentUser()

          set({
            user: get().normalizeUser(user),
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message,
          })
          throw error
        }
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          set({ isLoading: true, error: null })

          const updatedUser = await unifiedApiClient.updateProfile(data)

          set({
            user: get().normalizeUser(updatedUser),
            isLoading: false,
            error: null,
          })

          toast.success('Profile updated successfully!')
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message,
          })
          toast.error(error.message || 'Failed to update profile')
          throw error
        }
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // Initialize auth state from stored token
      initialize: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        console.log('Auth Store - Initialize called, token exists:', !!token)

        if (token) {
          try {
            console.log('Auth Store - Setting loading state and fetching user')
            set({ isLoading: true, error: null })
            const currentUser = await unifiedApiClient.getCurrentUser()
            console.log('Auth Store - Successfully got current user:', currentUser.email)

            set({
              user: get().normalizeUser(currentUser),
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } catch (error: any) {
            console.error('Auth Store - Failed to get current user:', error.message)
            // Token is invalid, clear it
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth_token')
            }
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            })
          }
        } else {
          console.log('Auth Store - No token found, setting loading to false')
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('Auth Store - Rehydration completed')
        if (state) {
          state._hasHydrated = true
          // If we have persisted auth state but no token, clear the state
          const token = localStorage.getItem('auth_token')
          if (state.isAuthenticated && !token) {
            console.log('Auth Store - Persisted auth state but no token, clearing state')
            state.user = null
            state.isAuthenticated = false
          }
        }
      },
    }
  )
)