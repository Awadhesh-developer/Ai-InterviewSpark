'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { SimpleThemeToggle } from '@/components/theme-toggle'
import LanguageSelector from '@/components/ui/language-selector'
import MobileNavigation from '@/components/mobile/MobileNavigation'
import {
  Brain,
  LayoutDashboard,
  Video,
  BarChart3,
  FileText,
  Users,
  Settings,
  LogOut,
  User,
  PlayCircle,
  Globe
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isAuthenticated, isLoading, _hasHydrated, logout, getCurrentUser } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    console.log('Dashboard Layout - Auth State:', { isAuthenticated, user: !!user, isLoading, _hasHydrated })

    // Wait for hydration to complete before making auth decisions
    if (!_hasHydrated) {
      console.log('Dashboard Layout - Waiting for hydration to complete')
      return
    }

    // Only redirect if we're definitely not authenticated, not loading, and no token exists
    if (!isLoading && !isAuthenticated) {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.log('Dashboard Layout - No token and not authenticated, redirecting to login')
        router.push('/auth/login')
      } else {
        console.log('Dashboard Layout - Token exists but not authenticated yet, waiting for initialization')
      }
    }
  }, [isAuthenticated, isLoading, _hasHydrated, router])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // Show loading spinner while hydrating, loading, or if authenticated but no user yet
  if (!_hasHydrated || isLoading || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If not authenticated and not loading, the useEffect will handle redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Interviews', href: '/dashboard/interviews', icon: Video },
    { name: 'Recordings', href: '/dashboard/recordings', icon: PlayCircle },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Cultural Styles', href: '/dashboard/cultural-styles', icon: Globe },
    { name: 'Resume', href: '/dashboard/resume', icon: FileText },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation */}
      <MobileNavigation
        user={{
          name: "John Doe",
          email: "john@example.com"
        }}
        notifications={3}
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-foreground">AI-InterviewSpark</span>
            </div>
            <div className="flex items-center space-x-2">
              <LanguageSelector variant="compact" />
              <SimpleThemeToggle />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="border-t border-border p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="p-4 lg:p-8 bg-background min-h-screen pt-20 lg:pt-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}