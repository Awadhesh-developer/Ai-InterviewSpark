'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CompactLanguageSelector } from '@/components/ui/language-selector'
import { SimpleThemeToggle } from '@/components/theme-toggle'
import {
  Menu,
  X,
  Home,
  Video,
  PlayCircle,
  BarChart3,
  Globe,
  FileText,
  Users,
  Settings,
  Brain,
  Bell,
  Search,
  Plus,
  User
} from 'lucide-react'

interface MobileNavigationProps {
  user?: {
    name: string
    email: string
    avatar?: string
  }
  notifications?: number
}

export default function MobileNavigation({ user, notifications = 0 }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Interviews', href: '/dashboard/interviews', icon: Video },
    { name: 'Recordings', href: '/dashboard/recordings', icon: PlayCircle },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Cultural Styles', href: '/dashboard/cultural-styles', icon: Globe },
    { name: 'Resume', href: '/dashboard/resume', icon: FileText },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const quickActions = [
    { name: 'Start Practice', href: '/dashboard/interviews/practice', icon: Video, color: 'bg-blue-500' },
    { name: 'New Recording', href: '/dashboard/recordings/new', icon: PlayCircle, color: 'bg-green-500' },
    { name: 'View Analytics', href: '/dashboard/analytics', icon: BarChart3, color: 'bg-purple-500' },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <SheetHeader className="p-6 border-b">
                    <div className="flex items-center space-x-3">
                      <Brain className="h-8 w-8 text-primary" />
                      <SheetTitle className="text-lg">InterviewSpark</SheetTitle>
                    </div>
                  </SheetHeader>

                  {/* User Profile */}
                  {user && (
                    <div className="p-4 border-b">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <User className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="p-4 border-b">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      {quickActions.map((action) => {
                        const IconComponent = action.icon
                        return (
                          <Link key={action.name} href={action.href}>
                            <Button variant="ghost" className="w-full justify-start h-auto p-3">
                              <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center mr-3`}>
                                <IconComponent className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-sm">{action.name}</span>
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex-1 p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Navigation</h3>
                    <nav className="space-y-1">
                      {navigation.map((item) => {
                        const IconComponent = item.icon
                        const active = isActive(item.href)
                        return (
                          <Link key={item.name} href={item.href}>
                            <Button
                              variant={active ? "secondary" : "ghost"}
                              className="w-full justify-start"
                            >
                              <IconComponent className="h-4 w-4 mr-3" />
                              {item.name}
                            </Button>
                          </Link>
                        )
                      })}
                    </nav>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Language</span>
                      <CompactLanguageSelector />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Theme</span>
                      <SimpleThemeToggle />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">InterviewSpark</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {notifications > 9 ? '9+' : notifications}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigation.slice(0, 5).map((item) => {
            const IconComponent = item.icon
            const active = isActive(item.href)
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center space-y-1 h-auto py-2 px-1 ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-xs truncate max-w-full">{item.name}</span>
                </Button>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobile Content Padding */}
      <div className="lg:hidden h-16" /> {/* Top padding */}
    </>
  )
}

// Mobile-optimized card component
export function MobileCard({ 
  children, 
  className = '',
  padding = 'p-4',
  ...props 
}: {
  children: React.ReactNode
  className?: string
  padding?: string
  [key: string]: any
}) {
  return (
    <div 
      className={`bg-card rounded-lg border shadow-sm ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// Mobile-optimized button group
export function MobileButtonGroup({ 
  buttons,
  orientation = 'horizontal'
}: {
  buttons: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'secondary' | 'outline' | 'ghost'
    icon?: React.ComponentType<{ className?: string }>
    disabled?: boolean
  }>
  orientation?: 'horizontal' | 'vertical'
}) {
  return (
    <div className={`flex ${orientation === 'vertical' ? 'flex-col space-y-2' : 'flex-row space-x-2'} w-full`}>
      {buttons.map((button, index) => {
        const IconComponent = button.icon
        return (
          <Button
            key={index}
            variant={button.variant || 'default'}
            onClick={button.onClick}
            disabled={button.disabled}
            className={`${orientation === 'vertical' ? 'w-full' : 'flex-1'} justify-center`}
          >
            {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
            {button.label}
          </Button>
        )
      })}
    </div>
  )
}

// Mobile-optimized stats grid
export function MobileStatsGrid({ 
  stats 
}: {
  stats: Array<{
    label: string
    value: string | number
    icon?: React.ComponentType<{ className?: string }>
    color?: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
  }>
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <MobileCard key={index} padding="p-3">
            <div className="flex items-center justify-between mb-2">
              {IconComponent && (
                <IconComponent className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`} />
              )}
              {stat.trend && (
                <Badge variant="outline" className="text-xs">
                  {stat.trendValue}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </MobileCard>
        )
      })}
    </div>
  )
}
