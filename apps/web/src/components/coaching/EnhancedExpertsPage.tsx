'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Award,
  Search,
  Filter,
  Video,
  Phone,
  MessageCircle,
  ArrowRight,
  Globe,
  CheckCircle,
  Brain,
  Bot,
  Zap,
  TrendingUp,
  Target,
  Lightbulb,
  Sparkles
} from 'lucide-react'
import RealTimeAICoach from './RealTimeAICoach'
import { advancedAICoachService } from '@/services/advancedAICoachService'
import { RoleSpecificCoachFactory } from '@/services/roleSpecificCoaches'

interface Expert {
  id: string
  name: string
  title: string
  company: string
  avatar: string
  rating: number
  reviewCount: number
  hourlyRate: number
  expertise: string[]
  location: string
  languages: string[]
  experience: number
  availability: 'available' | 'busy' | 'offline'
  bio: string
  sessionTypes: ('video' | 'audio' | 'chat')[]
  responseTime: string
  completedSessions: number
}

interface AICoachProfile {
  role: string
  name: string
  description: string
  expertise: string[]
  features: string[]
  availability: '24/7'
  rating: number
  sessionsCompleted: number
}

export default function EnhancedExpertsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('ai-coaches')
  const [experts, setExperts] = useState<Expert[]>([])
  const [aiCoaches, setAiCoaches] = useState<AICoachProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExpertise, setSelectedExpertise] = useState('all')
  const [showAICoach, setShowAICoach] = useState(false)
  const [selectedRole, setSelectedRole] = useState('software-engineer')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Load AI Coaches
      const aiCoachProfiles: AICoachProfile[] = [
        {
          role: 'software-engineer',
          name: 'AI Software Engineering Coach',
          description: 'Advanced AI coach specialized in software engineering interviews and skill development',
          expertise: ['System Design', 'Algorithms', 'Code Quality', 'Technical Leadership', 'Architecture'],
          features: ['Real-time feedback', 'Emotional analysis', 'Adaptive questioning', 'Performance tracking'],
          availability: '24/7',
          rating: 4.9,
          sessionsCompleted: 10000
        },
        {
          role: 'product-manager',
          name: 'AI Product Management Coach',
          description: 'Intelligent coaching for product management skills and strategic thinking',
          expertise: ['Product Strategy', 'Stakeholder Management', 'Data Analysis', 'Go-to-Market', 'Leadership'],
          features: ['Strategic guidance', 'Case study practice', 'Metrics coaching', 'Communication skills'],
          availability: '24/7',
          rating: 4.8,
          sessionsCompleted: 8500
        },
        {
          role: 'data-scientist',
          name: 'AI Data Science Coach',
          description: 'Expert AI coaching for data science and machine learning interviews',
          expertise: ['Machine Learning', 'Statistics', 'Python/R', 'Data Visualization', 'Business Intelligence'],
          features: ['Technical deep-dives', 'Model explanation', 'Code review', 'Industry insights'],
          availability: '24/7',
          rating: 4.9,
          sessionsCompleted: 7200
        },
        {
          role: 'ux-designer',
          name: 'AI UX Design Coach',
          description: 'Creative AI coach for UX design principles and portfolio development',
          expertise: ['User Research', 'Design Systems', 'Prototyping', 'Usability Testing', 'Design Thinking'],
          features: ['Portfolio review', 'Design critique', 'User empathy training', 'Process optimization'],
          availability: '24/7',
          rating: 4.7,
          sessionsCompleted: 6800
        }
      ]

      // Mock human experts data
      const mockExperts: Expert[] = [
        {
          id: 'expert-1',
          name: 'Sarah Chen',
          title: 'Senior Engineering Manager',
          company: 'Google',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          rating: 4.9,
          reviewCount: 127,
          hourlyRate: 150,
          expertise: ['System Design', 'Leadership', 'Technical Interviews', 'Career Growth'],
          location: 'San Francisco, CA',
          languages: ['English', 'Mandarin'],
          experience: 8,
          availability: 'available',
          bio: 'Former Google and Meta engineer with 8+ years of experience. Specialized in helping engineers advance to senior and staff levels.',
          sessionTypes: ['video', 'audio'],
          responseTime: '< 2 hours',
          completedSessions: 340
        },
        {
          id: 'expert-2',
          name: 'Michael Rodriguez',
          title: 'VP of Product',
          company: 'Stripe',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          rating: 4.8,
          reviewCount: 89,
          hourlyRate: 200,
          expertise: ['Product Strategy', 'Product Management', 'Leadership', 'Go-to-Market'],
          location: 'New York, NY',
          languages: ['English', 'Spanish'],
          experience: 12,
          availability: 'available',
          bio: 'Product leader with experience at Stripe, Airbnb, and startups. Expert in product strategy and team building.',
          sessionTypes: ['video', 'chat'],
          responseTime: '< 4 hours',
          completedSessions: 256
        }
      ]

      setAiCoaches(aiCoachProfiles)
      setExperts(mockExperts)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startAICoaching = (role: string) => {
    setSelectedRole(role)
    setShowAICoach(true)
  }

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'busy': return 'bg-yellow-100 text-yellow-800'
      case 'offline': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'available': return 'Available'
      case 'busy': return 'Busy'
      case 'offline': return 'Offline'
      default: return 'Unknown'
    }
  }

  if (showAICoach) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowAICoach(false)}
            className="flex items-center space-x-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            <span>Back to Coaches</span>
          </Button>
        </div>
        <RealTimeAICoach 
          userId="current-user" 
          role={selectedRole}
          sessionType="practice"
          onSessionComplete={(session) => {
            console.log('Session completed:', session)
            setShowAICoach(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="h-8 w-8 text-blue-600" />
            <span>Expert Coaches</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Get personalized coaching from AI experts and industry professionals
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/experts/become-expert')}>
          <Award className="mr-2 h-4 w-4" />
          Become an Expert
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search coaches by expertise, company, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai-coaches" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>AI Coaches</span>
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              New
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="human-experts" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Human Experts</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Coaches Tab */}
        <TabsContent value="ai-coaches" className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI-Powered Coaching</h3>
                <p className="text-gray-600">Advanced AI coaches available 24/7 with real-time feedback</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>Instant feedback</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Adaptive learning</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span>Personalized coaching</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiCoaches.map((coach) => (
              <Card key={coach.role} className="hover:shadow-lg transition-shadow border-2 border-blue-100">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                        <Brain className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{coach.name}</CardTitle>
                        <p className="text-sm text-gray-600 capitalize">{coach.role.replace('-', ' ')}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {coach.availability}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{coach.description}</p>
                  
                  {/* Expertise */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Expertise</h4>
                    <div className="flex flex-wrap gap-1">
                      {coach.expertise.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {coach.expertise.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{coach.expertise.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">AI Features</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {coach.features.map((feature) => (
                        <div key={feature} className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{coach.rating}</span>
                    </div>
                    <div className="text-gray-600">
                      {coach.sessionsCompleted.toLocaleString()} sessions
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    onClick={() => startAICoaching(coach.role)}
                  >
                    <Bot className="mr-2 h-4 w-4" />
                    Start AI Coaching
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Human Experts Tab */}
        <TabsContent value="human-experts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.map((expert) => (
              <Card key={expert.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={expert.avatar} alt={expert.name} />
                      <AvatarFallback>{expert.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{expert.name}</CardTitle>
                      <p className="text-sm text-gray-600 truncate">{expert.title}</p>
                      <p className="text-sm text-gray-500 truncate">{expert.company}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Rating and Reviews */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{expert.rating}</span>
                      <span className="text-sm text-gray-500">({expert.reviewCount})</span>
                    </div>
                    <Badge className={getAvailabilityColor(expert.availability)}>
                      {getAvailabilityText(expert.availability)}
                    </Badge>
                  </div>

                  {/* Expertise */}
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {expert.expertise.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {expert.expertise.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{expert.expertise.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{expert.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Responds in {expert.responseTime}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>${expert.hourlyRate}/hour</span>
                    </div>
                  </div>

                  {/* Session Types */}
                  <div className="flex items-center space-x-2 mb-4">
                    {expert.sessionTypes.includes('video') && (
                      <Video className="h-4 w-4 text-blue-600" />
                    )}
                    {expert.sessionTypes.includes('audio') && (
                      <Phone className="h-4 w-4 text-green-600" />
                    )}
                    {expert.sessionTypes.includes('chat') && (
                      <MessageCircle className="h-4 w-4 text-purple-600" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/experts/${expert.id}/book`)}
                      disabled={expert.availability === 'offline'}
                    >
                      Book Session
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push(`/dashboard/experts/${expert.id}`)}
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
