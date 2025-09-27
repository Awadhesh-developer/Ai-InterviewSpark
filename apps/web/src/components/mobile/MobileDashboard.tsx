'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MobileCard, MobileStatsGrid } from './MobileNavigation'
import {
  Play,
  Video,
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  Star,
  Calendar,
  Award,
  Zap,
  ArrowRight,
  Plus,
  PlayCircle,
  Users,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Globe
} from 'lucide-react'

interface MobileDashboardProps {
  user: {
    name: string
    totalSessions: number
    averageScore: number
    currentStreak: number
    nextGoal: string
  }
  recentSessions: Array<{
    id: string
    date: string
    score: number
    type: string
    duration: number
  }>
  upcomingGoals: Array<{
    id: string
    title: string
    progress: number
    deadline: string
  }>
}

export default function MobileDashboard({ 
  user, 
  recentSessions, 
  upcomingGoals 
}: MobileDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'recent' | 'goals'>('overview')

  const quickActions = [
    {
      title: 'Start Practice',
      description: 'Begin a new interview session',
      icon: Play,
      href: '/dashboard/interviews/practice',
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'View Recordings',
      description: 'Review past sessions',
      icon: PlayCircle,
      href: '/dashboard/recordings',
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Analytics',
      description: 'Track your progress',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Cultural Styles',
      description: 'Learn interview cultures',
      icon: Globe,
      href: '/dashboard/cultural-styles',
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ]

  const stats = [
    {
      label: 'Total Sessions',
      value: user.totalSessions,
      icon: Video,
      color: 'text-blue-500'
    },
    {
      label: 'Average Score',
      value: `${user.averageScore}%`,
      icon: Target,
      color: 'text-green-500'
    },
    {
      label: 'Current Streak',
      value: `${user.currentStreak} days`,
      icon: Zap,
      color: 'text-yellow-500'
    },
    {
      label: 'This Week',
      value: '3 sessions',
      icon: Calendar,
      color: 'text-purple-500'
    }
  ]

  const achievements = [
    { title: 'First Interview', icon: Star, unlocked: true },
    { title: '10 Sessions', icon: Award, unlocked: true },
    { title: 'Week Streak', icon: Zap, unlocked: true },
    { title: 'High Scorer', icon: Target, unlocked: false }
  ]

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Header */}
      <MobileCard>
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user.name}! 👋</h1>
            <p className="text-muted-foreground">Ready to practice your interview skills?</p>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">+12% this week</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>{user.currentStreak} day streak</span>
            </div>
          </div>
        </div>
      </MobileCard>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon
            return (
              <Link key={index} href={action.href}>
                <MobileCard className="h-full hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{action.title}</h3>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </MobileCard>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your Progress</h2>
        <MobileStatsGrid stats={stats} />
      </div>

      {/* Tab Navigation */}
      <div className="space-y-3">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'recent', label: 'Recent' },
            { key: 'goals', label: 'Goals' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Next Goal */}
            <MobileCard>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Next Milestone</h3>
                  <Badge variant="outline">In Progress</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">{user.nextGoal}</p>
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-muted-foreground">75% complete</p>
                </div>
              </div>
            </MobileCard>

            {/* Achievements */}
            <MobileCard>
              <div className="space-y-3">
                <h3 className="font-medium">Recent Achievements</h3>
                <div className="grid grid-cols-4 gap-2">
                  {achievements.map((achievement, index) => {
                    const IconComponent = achievement.icon
                    return (
                      <div
                        key={index}
                        className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${
                          achievement.unlocked
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span className="text-xs text-center">{achievement.title}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </MobileCard>
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="space-y-3">
            {recentSessions.map((session, index) => (
              <MobileCard key={session.id}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {session.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(session.date)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {session.duration} min
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(session.score)}`}>
                      {session.score}%
                    </div>
                    <Button variant="ghost" size="sm" className="h-auto p-1">
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </MobileCard>
            ))}
            
            <Button variant="outline" className="w-full">
              <PlayCircle className="h-4 w-4 mr-2" />
              View All Sessions
            </Button>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-3">
            {upcomingGoals.map((goal, index) => (
              <MobileCard key={goal.id}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{goal.title}</h4>
                    <span className="text-xs text-muted-foreground">{goal.deadline}</span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={goal.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{goal.progress}% complete</p>
                  </div>
                </div>
              </MobileCard>
            ))}
            
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Goal
            </Button>
          </div>
        )}
      </div>

      {/* Daily Tip */}
      <MobileCard className="bg-blue-50 border-blue-200">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <h3 className="font-medium text-blue-900">Daily Tip</h3>
          </div>
          <p className="text-sm text-blue-800">
            Practice the STAR method (Situation, Task, Action, Result) for behavioral questions. 
            It helps structure your responses effectively.
          </p>
        </div>
      </MobileCard>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20" />
    </div>
  )
}

// Mobile-optimized loading component
export function MobileDashboardSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Header skeleton */}
      <MobileCard>
        <div className="space-y-3">
          <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          <div className="flex space-x-4">
            <div className="h-4 bg-muted rounded w-20 animate-pulse" />
            <div className="h-4 bg-muted rounded w-16 animate-pulse" />
          </div>
        </div>
      </MobileCard>

      {/* Quick actions skeleton */}
      <div className="space-y-3">
        <div className="h-5 bg-muted rounded w-32 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <MobileCard key={i}>
              <div className="space-y-3">
                <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                </div>
              </div>
            </MobileCard>
          ))}
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="space-y-3">
        <div className="h-5 bg-muted rounded w-28 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <MobileCard key={i}>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-4 animate-pulse" />
                <div className="h-6 bg-muted rounded w-12 animate-pulse" />
                <div className="h-3 bg-muted rounded w-16 animate-pulse" />
              </div>
            </MobileCard>
          ))}
        </div>
      </div>
    </div>
  )
}
