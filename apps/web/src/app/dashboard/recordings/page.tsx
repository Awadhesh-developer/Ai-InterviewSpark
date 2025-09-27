'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RecordingSession } from '@/services/recordingService'
import {
  Play,
  Calendar,
  Clock,
  Target,
  Search,
  Filter,
  Download,
  Share2,
  Trash2,
  Eye,
  BarChart3,
  Video,
  Mic,
  Star,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react'

interface RecordingsPageState {
  recordings: RecordingSession[]
  filteredRecordings: RecordingSession[]
  isLoading: boolean
  searchQuery: string
  sortBy: 'date' | 'score' | 'duration' | 'name'
  filterBy: 'all' | 'behavioral' | 'technical' | 'case-study'
  selectedRecording: RecordingSession | null
}

export default function RecordingsPage() {
  const router = useRouter()
  const [state, setState] = useState<RecordingsPageState>({
    recordings: [],
    filteredRecordings: [],
    isLoading: true,
    searchQuery: '',
    sortBy: 'date',
    filterBy: 'all',
    selectedRecording: null
  })

  useEffect(() => {
    loadRecordings()
  }, [])

  useEffect(() => {
    filterAndSortRecordings()
  }, [state.recordings, state.searchQuery, state.sortBy, state.filterBy])

  const loadRecordings = async () => {
    try {
      // In a real implementation, this would fetch from API
      // For now, we'll create mock data
      const mockRecordings: RecordingSession[] = [
        {
          id: 'rec_001',
          userId: 'user_123',
          sessionName: 'Software Engineer Interview Practice',
          startTime: new Date('2024-01-15T10:00:00'),
          endTime: new Date('2024-01-15T10:45:00'),
          totalDuration: 2700000, // 45 minutes
          segments: [
            {
              id: 'seg_001',
              startTime: Date.now() - 2700000,
              endTime: Date.now() - 2400000,
              questionId: 'q1',
              questionText: 'Tell me about yourself and your background in software development.',
              analysis: {
                confidence: 85,
                clarity: 78,
                pace: 82,
                fillerWords: 2,
                keyPoints: ['Clear introduction', 'Relevant experience mentioned', 'Good structure'],
                improvements: ['Reduce filler words', 'Add more specific examples']
              }
            },
            {
              id: 'seg_002',
              startTime: Date.now() - 2400000,
              endTime: Date.now() - 2100000,
              questionId: 'q2',
              questionText: 'Describe a challenging project you worked on and how you overcame obstacles.',
              analysis: {
                confidence: 92,
                clarity: 88,
                pace: 75,
                fillerWords: 1,
                keyPoints: ['Specific example provided', 'Problem-solving approach clear', 'Results quantified'],
                improvements: ['Speak slightly faster', 'More eye contact']
              }
            }
          ],
          overallScore: 88,
          metadata: {
            interviewType: 'technical',
            jobRole: 'Software Engineer',
            difficulty: 'intermediate',
            questions: 2
          }
        },
        {
          id: 'rec_002',
          userId: 'user_123',
          sessionName: 'Product Manager Behavioral Interview',
          startTime: new Date('2024-01-12T14:30:00'),
          endTime: new Date('2024-01-12T15:15:00'),
          totalDuration: 2700000,
          segments: [
            {
              id: 'seg_003',
              startTime: Date.now() - 3600000,
              endTime: Date.now() - 3300000,
              questionId: 'q3',
              questionText: 'Describe a time when you had to lead a team through a difficult situation.',
              analysis: {
                confidence: 76,
                clarity: 82,
                pace: 88,
                fillerWords: 4,
                keyPoints: ['Leadership example provided', 'Team dynamics addressed'],
                improvements: ['Reduce filler words', 'More confident tone', 'Better structure']
              }
            }
          ],
          overallScore: 76,
          metadata: {
            interviewType: 'behavioral',
            jobRole: 'Product Manager',
            difficulty: 'advanced',
            questions: 1
          }
        }
      ]

      setState(prev => ({
        ...prev,
        recordings: mockRecordings,
        isLoading: false
      }))
    } catch (error) {
      console.error('Error loading recordings:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const filterAndSortRecordings = () => {
    let filtered = [...state.recordings]

    // Apply search filter
    if (state.searchQuery) {
      filtered = filtered.filter(recording =>
        recording.sessionName.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        recording.metadata.jobRole.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (state.filterBy !== 'all') {
      filtered = filtered.filter(recording => recording.metadata.interviewType === state.filterBy)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case 'date':
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        case 'score':
          return b.overallScore - a.overallScore
        case 'duration':
          return b.totalDuration - a.totalDuration
        case 'name':
          return a.sessionName.localeCompare(b.sessionName)
        default:
          return 0
      }
    })

    setState(prev => ({ ...prev, filteredRecordings: filtered }))
  }

  const handleSearch = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }))
  }

  const handleSort = (sortBy: RecordingsPageState['sortBy']) => {
    setState(prev => ({ ...prev, sortBy }))
  }

  const handleFilter = (filterBy: RecordingsPageState['filterBy']) => {
    setState(prev => ({ ...prev, filterBy }))
  }

  const viewRecording = (recording: RecordingSession) => {
    router.push(`/dashboard/recordings/${recording.id}`)
  }

  const deleteRecording = async (recordingId: string) => {
    // In a real implementation, this would call API to delete
    setState(prev => ({
      ...prev,
      recordings: prev.recordings.filter(r => r.id !== recordingId)
    }))
  }

  const formatDuration = (durationMs: number) => {
    const minutes = Math.floor(durationMs / 60000)
    const seconds = Math.floor((durationMs % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'technical': return <BarChart3 className="h-4 w-4" />
      case 'behavioral': return <Users className="h-4 w-4" />
      case 'case-study': return <FileText className="h-4 w-4" />
      default: return <Video className="h-4 w-4" />
    }
  }

  if (state.isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your recordings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interview Recordings</h1>
          <p className="text-muted-foreground mt-2">
            Review and analyze your interview practice sessions
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/interviews/new')}>
          <Video className="h-4 w-4 mr-2" />
          New Recording
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{state.recordings.length}</p>
                <p className="text-sm text-muted-foreground">Total Recordings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {state.recordings.length > 0 
                    ? Math.round(state.recordings.reduce((sum, r) => sum + r.overallScore, 0) / state.recordings.length)
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {formatDuration(state.recordings.reduce((sum, r) => sum + r.totalDuration, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total Practice Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {state.recordings.filter(r => r.overallScore >= 80).length}
                </p>
                <p className="text-sm text-muted-foreground">High Scores (80%+)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recordings..."
                  value={state.searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={state.filterBy} onValueChange={handleFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="case-study">Case Study</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={state.sortBy} onValueChange={handleSort}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Newest)</SelectItem>
                <SelectItem value="score">Score (Highest)</SelectItem>
                <SelectItem value="duration">Duration (Longest)</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recordings List */}
      {state.filteredRecordings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recordings found</h3>
            <p className="text-muted-foreground mb-4">
              {state.searchQuery || state.filterBy !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start practicing interviews to see your recordings here'
              }
            </p>
            <Button onClick={() => router.push('/dashboard/interviews/new')}>
              Start Recording
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {state.filteredRecordings.map((recording) => (
            <Card key={recording.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{recording.sessionName}</CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      {getInterviewTypeIcon(recording.metadata.interviewType)}
                      <span>{recording.metadata.jobRole}</span>
                      <Badge variant="outline">{recording.metadata.difficulty}</Badge>
                    </CardDescription>
                  </div>
                  <Badge variant={getScoreBadgeVariant(recording.overallScore)}>
                    {recording.overallScore}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(recording.startTime)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDuration(recording.totalDuration)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <span>{recording.segments.length} questions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className={getScoreColor(recording.overallScore)}>
                      {recording.overallScore}% avg
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => viewRecording(recording)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Watch
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRecording(recording.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
