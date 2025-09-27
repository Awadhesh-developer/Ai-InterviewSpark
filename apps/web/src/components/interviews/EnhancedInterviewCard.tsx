'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Video,
  Mic,
  MessageSquare,
  Zap,
  Clock,
  Target,
  Sparkles,
  Globe,
  TrendingUp,
  Brain,
  Users,
  Play,
  Settings,
  BarChart3,
  Calendar,
  CheckCircle
} from 'lucide-react'

interface EnhancedInterviewCardProps {
  title?: string
  description?: string
  isNew?: boolean
}

export default function EnhancedInterviewCard({ 
  title = "Enhanced AI Interview Practice",
  description = "Next-generation interview preparation with real-time question generation",
  isNew = true 
}: EnhancedInterviewCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const features = [
    {
      icon: Globe,
      title: "Perplexity Integration",
      description: "Real-time questions with latest industry data",
      color: "text-blue-500"
    },
    {
      icon: Video,
      title: "Multi-Modal Practice",
      description: "Text, Voice, Video, and Hybrid modes",
      color: "text-purple-500"
    },
    {
      icon: Brain,
      title: "Adaptive Intelligence",
      description: "Questions adapt to your performance",
      color: "text-green-500"
    },
    {
      icon: TrendingUp,
      title: "Real-Time Analysis",
      description: "Emotional and voice analysis",
      color: "text-orange-500"
    }
  ]

  const modes = [
    { icon: MessageSquare, name: "Text", color: "bg-blue-500" },
    { icon: Mic, name: "Voice", color: "bg-green-500" },
    { icon: Video, name: "Video", color: "bg-purple-500" },
    { icon: Zap, name: "Hybrid", color: "bg-orange-500" }
  ]

  const stats = [
    { label: "Success Rate", value: "94%", icon: Target },
    { label: "Avg Score", value: "87%", icon: BarChart3 },
    { label: "Users", value: "12K+", icon: Users },
    { label: "Sessions", value: "45K+", icon: Calendar }
  ]

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
        isHovered ? 'scale-[1.02]' : ''
      } border-2 ${isNew ? 'border-primary/20' : 'border-border'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      {/* New badge */}
      {isNew && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-primary/90 text-primary-foreground animate-pulse">
            <Sparkles className="h-3 w-3 mr-1" />
            New
          </Badge>
        </div>
      )}

      <CardHeader className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <span>{title}</span>
            </CardTitle>
            <CardDescription className="text-base">
              {description}
            </CardDescription>
          </div>
        </div>

        {/* Interview modes */}
        <div className="flex items-center space-x-2 pt-4">
          <span className="text-sm font-medium text-muted-foreground">Modes:</span>
          {modes.map((mode, index) => (
            <div key={index} className="flex items-center space-x-1">
              <div className={`p-1 rounded ${mode.color}`}>
                <mode.icon className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">{mode.name}</span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6">
        {/* Key features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-background/50 border">
              <feature.icon className={`h-5 w-5 mt-0.5 ${feature.color}`} />
              <div className="space-y-1">
                <h4 className="font-medium text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t">
          {stats.map((stat, index) => (
            <div key={index} className="text-center space-y-1">
              <stat.icon className="h-4 w-4 mx-auto text-primary" />
              <div className="font-bold text-sm">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">AI-Powered</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/interviews/enhanced?mode=preview">
                <Settings className="h-4 w-4 mr-1" />
                Preview
              </Link>
            </Button>
            
            <Button size="sm" asChild className="bg-primary hover:bg-primary/90">
              <Link href="/dashboard/interviews/enhanced">
                <Play className="h-4 w-4 mr-1" />
                Start Interview
              </Link>
            </Button>
          </div>
        </div>

        {/* Progress indicator for ongoing interviews */}
        <div className="space-y-2 pt-2 border-t border-dashed">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your Progress</span>
            <span className="font-medium">3 of 5 completed</span>
          </div>
          <Progress value={60} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Complete 2 more sessions to unlock advanced analytics
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
