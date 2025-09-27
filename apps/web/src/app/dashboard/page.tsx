'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useInterviewStore } from '@/stores/interview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

import {
  Brain,
  Video,
  TrendingUp,
  Clock,
  Target,
  Plus,
  Play,
  BarChart3,
  Users,
  Award
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { sessions, loadSessions, isLoading } = useInterviewStore()

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const recentSessions = sessions.slice(0, 3)
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const averageScore = sessions.length > 0
    ? sessions.reduce((acc, s) => {
        const metricsArray: any = (s as any).performanceMetrics
        const score = Array.isArray(metricsArray) && metricsArray.length > 0
          ? Number(metricsArray[0]?.overallScore || 0)
          : Number((s as any).performanceMetrics?.overallScore || (s as any).overallScore || 0)
        return acc + (isNaN(score) ? 0 : score)
      }, 0) / sessions.length
    : 0

  const userName = user?.firstName || 'User'

  return ( 
  <>
      {/* Mobile Dashboard */}
      <div className="lg:hidden">
        <div className="p-4 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Welcome, {userName}!</h1>
            <p className="text-muted-foreground">Your Interview Practice Dashboard</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold text-primary">{completedSessions}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold text-primary">{Math.round(averageScore)}%</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Recent Sessions</h2>
            {recentSessions.length > 0 ? (
              recentSessions.map((session, index) => (
                <div key={session.id || index} className="bg-card p-3 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{session.jobTitle || 'Interview'}</div>
                      <div className="text-sm text-muted-foreground">
                        {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                    <div className="text-right">
                      {(() => {
                        const pm: any = (session as any).performanceMetrics
                        const score = Array.isArray(pm) && pm.length > 0
                          ? Number(pm[0]?.overallScore || 0)
                          : Number((session as any).performanceMetrics?.overallScore || (session as any).overallScore || 0)
                        return (
                          <div className="font-bold text-primary">
                            {isNaN(score) ? '—' : `${Math.round(score)}%`}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No sessions yet. Start your first interview practice!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Dashboard */}
      <div className="hidden lg:block space-y-8">
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Ready to practice your interview skills today?
          </p>
        </div>
        <Button
          size="lg"
          className="flex items-center gap-2"
          onClick={() => window.location.href = '/dashboard/interviews/new'}
        >
          <Plus className="h-5 w-5" />
          New Interview
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedSessions} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageScore)}%</div>
            <p className="text-xs text-muted-foreground">
              +2.5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practice Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5h</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15%</div>
            <p className="text-xs text-muted-foreground">
              Since last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <Brain className="h-12 w-12 text-primary mb-4" />
            <CardTitle>AI Mock Interview</CardTitle>
            <CardDescription>
              Practice with AI-generated questions tailored to your target role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => window.location.href = '/dashboard/interviews/new'}
            >
              <Play className="mr-2 h-4 w-4" />
              Start Interview
            </Button>
          </CardContent>
        </Card>

        {/* Expert Coaching disabled */}

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <BarChart3 className="h-12 w-12 text-violet-600 dark:text-violet-400 mb-4" />
            <CardTitle>Performance Analytics</CardTitle>
            <CardDescription>
              Review your progress and identify areas for improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Interview Sessions</CardTitle>
          <CardDescription>
            Your latest practice sessions and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : recentSessions.length > 0 ? (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{session.jobTitle}</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.company} • {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                      {session.status}
                    </Badge>
                    {(() => {
                      const pm: any = (session as any).performanceMetrics
                      const score = Array.isArray(pm) && pm.length > 0
                        ? Number(pm[0]?.overallScore || 0)
                        : Number((session as any).performanceMetrics?.overallScore || (session as any).overallScore || 0)
                      return (
                        <>
                          {!isNaN(score) && score > 0 && (
                            <div className="text-right">
                              <div className="font-medium text-foreground">{Math.round(score)}%</div>
                              <div className="text-sm text-muted-foreground">Score</div>
                            </div>
                          )}
                        </>
                      )
                    })()}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => (window.location.href = `/dashboard/interviews/practice?sessionId=${session.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No interviews yet</h3>
              <p className="text-muted-foreground mb-4">Start your first mock interview to begin practicing</p>
              <Button onClick={() => window.location.href = '/dashboard/interviews/new'}>
                <Plus className="mr-2 h-4 w-4" />
                Create Interview
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
      </div>
    </>
  )
}