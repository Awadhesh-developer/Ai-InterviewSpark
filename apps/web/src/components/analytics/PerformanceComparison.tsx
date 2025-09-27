'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import {
  Users,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Zap,
  Star,
  Trophy,
  Medal,
  Crown,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'

interface ComparisonData {
  category: string
  userScore: number
  averageScore: number
  topPercentile: number
  userPercentile: number
  sampleSize: number
}

interface PeerComparison {
  metric: string
  userValue: number
  peerAverage: number
  industryAverage: number
  percentile: number
  trend: 'up' | 'down' | 'stable'
}

interface BenchmarkData {
  role: string
  experience: string
  location: string
  averageScore: number
  topScore: number
  userScore: number
  userRank: number
  totalCandidates: number
}

interface PerformanceComparisonProps {
  userId: string
  userRole: string
  experienceLevel: string
  location: string
}

export default function PerformanceComparison({ 
  userId, 
  userRole, 
  experienceLevel, 
  location 
}: PerformanceComparisonProps) {
  const [comparisonType, setComparisonType] = useState<'peers' | 'industry' | 'role' | 'experience'>('peers')
  const [selectedMetric, setSelectedMetric] = useState('overall')

  // Mock data - in real implementation, this would come from API
  const comparisonData: ComparisonData[] = [
    {
      category: 'Technical Skills',
      userScore: 82,
      averageScore: 74,
      topPercentile: 92,
      userPercentile: 78,
      sampleSize: 1250
    },
    {
      category: 'Communication',
      userScore: 76,
      averageScore: 71,
      topPercentile: 89,
      userPercentile: 65,
      sampleSize: 1250
    },
    {
      category: 'Problem Solving',
      userScore: 88,
      averageScore: 76,
      topPercentile: 94,
      userPercentile: 85,
      sampleSize: 1250
    },
    {
      category: 'Behavioral',
      userScore: 71,
      averageScore: 73,
      topPercentile: 87,
      userPercentile: 45,
      sampleSize: 1250
    },
    {
      category: 'System Design',
      userScore: 79,
      averageScore: 68,
      topPercentile: 91,
      userPercentile: 82,
      sampleSize: 850
    }
  ]

  const peerComparisons: PeerComparison[] = [
    {
      metric: 'Overall Score',
      userValue: 79,
      peerAverage: 72,
      industryAverage: 70,
      percentile: 75,
      trend: 'up'
    },
    {
      metric: 'Confidence Level',
      userValue: 82,
      peerAverage: 76,
      industryAverage: 74,
      percentile: 68,
      trend: 'up'
    },
    {
      metric: 'Response Time',
      userValue: 45, // seconds
      peerAverage: 52,
      industryAverage: 58,
      percentile: 78,
      trend: 'stable'
    },
    {
      metric: 'Clarity Score',
      userValue: 76,
      peerAverage: 71,
      industryAverage: 69,
      percentile: 65,
      trend: 'down'
    }
  ]

  const benchmarkData: BenchmarkData = {
    role: userRole,
    experience: experienceLevel,
    location: location,
    averageScore: 72,
    topScore: 94,
    userScore: 79,
    userRank: 312,
    totalCandidates: 1250
  }

  const radarData = comparisonData.map(item => ({
    category: item.category,
    user: item.userScore,
    average: item.averageScore,
    top: item.topPercentile
  }))

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return 'text-green-600'
    if (percentile >= 75) return 'text-blue-600'
    if (percentile >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPercentileBadge = (percentile: number) => {
    if (percentile >= 95) return { label: 'Top 5%', variant: 'default' as const, icon: Crown }
    if (percentile >= 90) return { label: 'Top 10%', variant: 'secondary' as const, icon: Trophy }
    if (percentile >= 75) return { label: 'Top 25%', variant: 'outline' as const, icon: Medal }
    if (percentile >= 50) return { label: 'Above Average', variant: 'outline' as const, icon: Star }
    return { label: 'Below Average', variant: 'destructive' as const, icon: Target }
  }

  const formatValue = (value: number, metric: string) => {
    if (metric === 'Response Time') {
      return `${value}s`
    }
    return `${value}%`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Comparison</h2>
          <p className="text-muted-foreground">See how you stack up against your peers</p>
        </div>
        <Select value={comparisonType} onValueChange={(value: any) => setComparisonType(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Comparison type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="peers">Similar Peers</SelectItem>
            <SelectItem value="industry">Industry Average</SelectItem>
            <SelectItem value="role">Same Role</SelectItem>
            <SelectItem value="experience">Experience Level</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall Ranking Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>Your Ranking</span>
          </CardTitle>
          <CardDescription>
            Among {benchmarkData.totalCandidates.toLocaleString()} {benchmarkData.role}s with {benchmarkData.experience} experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">#{benchmarkData.userRank}</div>
              <p className="text-sm text-muted-foreground">Your Rank</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{benchmarkData.userScore}%</div>
              <p className="text-sm text-muted-foreground">Your Score</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{benchmarkData.averageScore}%</div>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round((1 - benchmarkData.userRank / benchmarkData.totalCandidates) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Percentile</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="radar">Skill Radar</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {comparisonData.map((item, index) => {
              const badge = getPercentileBadge(item.userPercentile)
              const IconComponent = badge.icon
              
              return (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{item.category}</CardTitle>
                      <Badge variant={badge.variant} className="flex items-center space-x-1">
                        <IconComponent className="h-3 w-3" />
                        <span>{badge.label}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Your Score</span>
                        <span className="font-bold text-primary">{item.userScore}%</span>
                      </div>
                      <Progress value={item.userScore} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Average</span>
                        <span className="text-sm">{item.averageScore}%</span>
                      </div>
                      <Progress value={item.averageScore} className="h-1 opacity-50" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Top 10%</span>
                        <span className="text-sm">{item.topPercentile}%</span>
                      </div>
                      <Progress value={item.topPercentile} className="h-1 opacity-30" />
                    </div>
                    
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      Based on {item.sampleSize.toLocaleString()} candidates
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="space-y-4">
            {peerComparisons.map((comparison, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold">{comparison.metric}</h3>
                      {getTrendIcon(comparison.trend)}
                    </div>
                    <Badge variant="outline" className={getPercentileColor(comparison.percentile)}>
                      {comparison.percentile}th percentile
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {formatValue(comparison.userValue, comparison.metric)}
                      </div>
                      <p className="text-sm text-muted-foreground">Your Score</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatValue(comparison.peerAverage, comparison.metric)}
                      </div>
                      <p className="text-sm text-muted-foreground">Peer Average</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {formatValue(comparison.industryAverage, comparison.metric)}
                      </div>
                      <p className="text-sm text-muted-foreground">Industry Average</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="radar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skill Comparison Radar</CardTitle>
              <CardDescription>
                Visual comparison of your skills vs. averages and top performers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Your Score"
                      dataKey="user"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Average"
                      dataKey="average"
                      stroke="#6b7280"
                      fill="transparent"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                    />
                    <Radar
                      name="Top 10%"
                      dataKey="top"
                      stroke="#10b981"
                      fill="transparent"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Your Score</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-1 bg-gray-500"></div>
                  <span className="text-sm">Average</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-1 bg-green-500"></div>
                  <span className="text-sm">Top 10%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
