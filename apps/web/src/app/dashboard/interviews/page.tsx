'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { aiInterviewService, InterviewSession, AICoachSuggestion } from '@/services/aiInterviewService'
import {
  Play,
  Plus,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Brain,
  Video,
  Mic,
  FileText,
  Award,
  Users,
  Zap,
  BookOpen,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Star,
  Lightbulb
} from 'lucide-react'

export default function InterviewsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [coachingSuggestions, setCoachingSuggestions] = useState<AICoachSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageScore: 0,
    improvementRate: 0,
    readinessScore: 0
  })

  useEffect(() => {
    loadInterviewData()
  }, [])

  const loadInterviewData = async () => {
    try {
      setIsLoading(true)
      
      // Mock data - replace with actual API calls
      const mockSessions: InterviewSession[] = [
        {
          id: '1',
          title: 'Software Engineer Mock Interview',
          jobTitle: 'Senior Software Engineer',
          company: 'Google',
          industry: 'Technology',
          duration: 45,
          questions: [],
          status: 'completed',
          createdAt: new Date('2024-01-15'),
          completedAt: new Date('2024-01-15'),
          overallScore: 85,
          feedback: 'Strong technical responses with good examples'
        },
        {
          id: '2',
          title: 'Product Manager Practice',
          jobTitle: 'Product Manager',
          company: 'Meta',
          industry: 'Technology',
          duration: 60,
          questions: [],
          status: 'completed',
          createdAt: new Date('2024-01-12'),
          completedAt: new Date('2024-01-12'),
          overallScore: 78,
          feedback: 'Good strategic thinking, work on stakeholder scenarios'
        },
        {
          id: '3',
          title: 'Behavioral Interview Prep',
          jobTitle: 'Software Engineer',
          industry: 'Technology',
          duration: 30,
          questions: [],
          status: 'scheduled',
          createdAt: new Date('2024-01-20')
        }
      ]

      setSessions(mockSessions)

      // Calculate stats
      const completedSessions = mockSessions.filter(s => s.status === 'completed')
      const avgScore = completedSessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / completedSessions.length
      
      setStats({
        totalSessions: mockSessions.length,
        averageScore: avgScore || 0,
        improvementRate: 15, // Mock improvement rate
        readinessScore: avgScore > 80 ? 90 : avgScore > 70 ? 75 : 60
      })

      // Load coaching suggestions
      const suggestions = await aiInterviewService.generateCoachingSuggestions({
        jobTitle: 'Software Engineer',
        industry: 'Technology',
        recentPerformance: [85, 78, 82],
        weakAreas: ['technical', 'behavioral']
      })
      setCoachingSuggestions(suggestions)

    } catch (error) {
      console.error('Error loading interview data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in-progress':
        return <Play className="h-4 w-4 text-blue-600" />
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-orange-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-green-500 bg-green-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-600 flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span>AI Interview Coach</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Practice interviews with AI-powered feedback and personalized coaching
          </p>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/interviews/practice')}>
            <Play className="mr-2 h-4 w-4" />
            Quick Practice
          </Button>
          <Button onClick={() => router.push('/dashboard/interviews/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Interview
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
              {stats.averageScore.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{stats.improvementRate}%</div>
            <p className="text-xs text-muted-foreground">
              Performance growth
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Readiness</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(stats.readinessScore)}`}>
              {stats.readinessScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.readinessScore >= 80 ? 'Ready to interview!' : 'Keep practicing'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">My Sessions</TabsTrigger>
          <TabsTrigger value="coaching">AI Coaching</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Interview Readiness */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Interview Readiness Assessment</span>
              </CardTitle>
              <CardDescription>
                Your current readiness level based on recent practice sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Readiness</span>
                <span className={`text-lg font-bold ${getScoreColor(stats.readinessScore)}`}>
                  {stats.readinessScore}%
                </span>
              </div>
              <Progress value={stats.readinessScore} className="h-3" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">85%</div>
                  <div className="text-sm text-gray-600">Communication</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">78%</div>
                  <div className="text-sm text-gray-600">Technical</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">72%</div>
                  <div className="text-sm text-gray-600">Behavioral</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">80%</div>
                  <div className="text-sm text-gray-600">Cultural Fit</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => router.push('/dashboard/interviews/practice')}>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Video className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Video Interview</h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Practice with video recording and AI analysis
                </p>
                <Button className="w-full">
                  Start Video Practice
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push('/dashboard/interviews/practice?mode=audio')}>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Mic className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Audio Interview</h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Focus on verbal communication and content
                </p>
                <Button variant="outline" className="w-full">
                  Start Audio Practice
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push('/dashboard/interviews/practice?mode=text')}>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <FileText className="h-12 w-12 text-purple-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Text Interview</h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Practice written responses and structure
                </p>
                <Button variant="outline" className="w-full">
                  Start Text Practice
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
              <div className="space-y-4">
                {sessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(session.status)}
                      <div>
                        <p className="font-medium text-gray-600">{session.title}</p>
                        <p className="text-sm text-gray-500">
                          {session.jobTitle} • {session.duration} minutes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {session.overallScore && (
                        <Badge variant={session.overallScore >= 80 ? 'default' : 'secondary'}>
                          {session.overallScore}%
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/interviews/practice?sessionId=${session.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          {/* Sessions List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{session.title}</CardTitle>
                    {getStatusIcon(session.status)}
                  </div>
                  <CardDescription>
                    {session.jobTitle} {session.company && `at ${session.company}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span>{session.duration} minutes</span>
                  </div>
                  
                  {session.overallScore && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Score:</span>
                      <span className={`font-bold ${getScoreColor(session.overallScore)}`}>
                        {session.overallScore}%
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span>{session.createdAt.toLocaleDateString()}</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      {session.status === 'completed' ? 'Review' : 'Continue'}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Session Card */}
            <Card className="border-dashed border-2 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => router.push('/dashboard/interviews/new')}>
              <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <Plus className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">New Interview Session</h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Start a new practice interview session
                </p>
                <Button>
                  Create Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coaching" className="space-y-6">
          {/* AI Coaching Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span>AI Coaching Recommendations</span>
              </CardTitle>
              <CardDescription>
                Personalized suggestions to improve your interview performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {coachingSuggestions.map((suggestion, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      <h4 className="font-medium text-gray-600">{suggestion.title}</h4>
                    </div>
                    <Badge variant="outline">{suggestion.priority} priority</Badge>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">{suggestion.description}</p>
                  
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Action Items:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {suggestion.actionItems.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start space-x-2">
                          <span className="text-blue-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-500">
                      Estimated time: {suggestion.estimatedTime} minutes
                    </span>
                    <Button size="sm">
                      Start Practice
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span>Performance Analytics</span>
              </CardTitle>
              <CardDescription>
                Detailed insights into your interview performance trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Advanced Analytics Coming Soon
                </h3>
                <p className="text-gray-500">
                  We're building comprehensive analytics to track your progress and identify improvement areas.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
