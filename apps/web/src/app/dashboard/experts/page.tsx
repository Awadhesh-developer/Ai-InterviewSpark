"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import AICoachingConfig, { CoachingConfig } from '@/components/coaching/AICoachingConfig'
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

export default function ExpertsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard')
  }, [router])

  return null
}
