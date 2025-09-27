'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ATSOptimizationTab from '@/components/resume/ATSOptimizationTab'
import ResumeAnalyticsTab from '@/components/resume/ResumeAnalyticsTab'
import {
  Upload,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  BarChart3,
  Target,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  Star,
  Clock
} from 'lucide-react'

export default function ResumePage() {
  const router = useRouter()
  const [resumes, setResumes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedResume, setSelectedResume] = useState(null)

  useEffect(() => {
    // Load user's resumes
    loadResumes()
  }, [])

  const loadResumes = async () => {
    try {
      setIsLoading(true)
      // TODO: Implement API call to load resumes
      // const response = await apiClient.getResumes()
      // setResumes(response)

      // Mock data for now - will be replaced with real API call
      setResumes([
        {
          id: '1',
          name: 'Software Engineer Resume',
          fileName: 'john_doe_resume.pdf',
          uploadedAt: new Date('2024-01-15'),
          atsScore: 85,
          status: 'analyzed',
          fileSize: '245 KB',
          keywords: ['JavaScript', 'React', 'Node.js', 'Python'],
          suggestions: 3
        },
        {
          id: '2',
          name: 'Senior Developer Resume',
          fileName: 'john_doe_senior.pdf',
          uploadedAt: new Date('2024-01-10'),
          atsScore: 72,
          status: 'needs_improvement',
          fileSize: '198 KB',
          keywords: ['Java', 'Spring', 'AWS', 'Docker'],
          suggestions: 7
        }
      ])
    } catch (error) {
      console.error('Failed to load resumes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'analyzed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'needs_improvement':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resume Manager</h1>
          <p className="text-muted-foreground mt-2">
            Upload, analyze, and optimize your resumes for ATS systems
          </p>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/resume/builder')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Resume
          </Button>
          <Button onClick={() => router.push('/dashboard/resume/upload')}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Resume
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resumes">My Resumes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="optimization">ATS Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resumes.length}</div>
                <p className="text-xs text-muted-foreground">
                  +1 from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average ATS Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78.5</div>
                <p className="text-xs text-muted-foreground">
                  +5.2% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Optimizations</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">10</div>
                <p className="text-xs text-muted-foreground">
                  Suggestions applied
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-xs text-muted-foreground">
                  Interview callback rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest resume uploads and optimizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resumes.slice(0, 3).map((resume) => (
                  <div key={resume.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(resume.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600 truncate">
                        {resume.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Uploaded {resume.uploadedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant={getScoreBadgeVariant(resume.atsScore)}>
                        ATS: {resume.atsScore}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumes" className="space-y-6">
          {/* Resume List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <Card key={resume.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{resume.name}</CardTitle>
                    {getStatusIcon(resume.status)}
                  </div>
                  <CardDescription>{resume.fileName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ATS Score</span>
                    <span className={`text-lg font-bold ${getScoreColor(resume.atsScore)}`}>
                      {resume.atsScore}%
                    </span>
                  </div>
                  <Progress value={resume.atsScore} className="h-2" />
                  
                  <div className="flex flex-wrap gap-1">
                    {resume.keywords.slice(0, 3).map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {resume.keywords.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{resume.keywords.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{resume.fileSize}</span>
                    <span>{resume.suggestions} suggestions</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Resume Card */}
            <Card className="border-dashed border-2 hover:border-blue-500 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Upload New Resume</h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Drag and drop your resume or click to browse
                </p>
                <Button onClick={() => router.push('/dashboard/resume/upload')}>
                  Choose File
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ResumeAnalyticsTab />
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <ATSOptimizationTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
