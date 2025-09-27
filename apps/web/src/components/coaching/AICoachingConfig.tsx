'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings,
  Brain,
  Clock,
  Target,
  Zap,
  Heart,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb
} from 'lucide-react'

export interface AICoachingConfigProps {
  role: string
  onConfigChange: (config: CoachingConfig) => void
  onStartSession: (config: CoachingConfig) => void
  initialConfig?: Partial<CoachingConfig>
}

export interface CoachingConfig {
  sessionType: 'practice' | 'mock-interview' | 'skill-assessment' | 'behavioral'
  difficulty: number
  focusAreas: string[]
  timeLimit?: number
  questionCount: number
  adaptiveDifficulty: boolean
  emotionalAnalysis: boolean
  userProfile: {
    level: 'novice' | 'intermediate' | 'advanced' | 'expert'
    experience: string[]
    weaknesses: string[]
    goals: string[]
  }
  llmProvider: 'openai' | 'gemini' | 'claude'
  llmModel: string
}

export default function AICoachingConfig({ 
  role, 
  onConfigChange, 
  onStartSession, 
  initialConfig 
}: AICoachingConfigProps) {
  const [config, setConfig] = useState<CoachingConfig>({
    sessionType: 'practice',
    difficulty: 5,
    focusAreas: [],
    questionCount: 10,
    adaptiveDifficulty: true,
    emotionalAnalysis: true,
    userProfile: {
      level: 'intermediate',
      experience: [],
      weaknesses: [],
      goals: []
    },
    llmProvider: 'openai',
    llmModel: 'gpt-4-turbo-preview',
    ...initialConfig
  })

  const sessionTypes = [
    { 
      id: 'practice', 
      label: 'Practice Session', 
      description: 'Casual practice with adaptive questions',
      icon: Target,
      color: 'bg-blue-100 text-blue-800'
    },
    { 
      id: 'mock-interview', 
      label: 'Mock Interview', 
      description: 'Realistic interview simulation',
      icon: Brain,
      color: 'bg-purple-100 text-purple-800'
    },
    { 
      id: 'skill-assessment', 
      label: 'Skill Assessment', 
      description: 'Evaluate your current skill level',
      icon: BarChart3,
      color: 'bg-green-100 text-green-800'
    },
    { 
      id: 'behavioral', 
      label: 'Behavioral Questions', 
      description: 'Focus on behavioral and situational questions',
      icon: Heart,
      color: 'bg-orange-100 text-orange-800'
    }
  ]

  const focusAreasByRole = {
    'software-engineer': [
      'System Design', 'Algorithms', 'Data Structures', 'Code Quality',
      'Software Architecture', 'Database Design', 'API Design', 'Performance Optimization',
      'Testing', 'DevOps', 'Security', 'Scalability'
    ],
    'product-manager': [
      'Product Strategy', 'Stakeholder Management', 'Data Analysis', 'Go-to-Market',
      'User Research', 'Product Roadmap', 'Metrics & KPIs', 'Competitive Analysis',
      'Pricing Strategy', 'Product Launch', 'Team Leadership', 'Customer Development'
    ],
    'data-scientist': [
      'Machine Learning', 'Statistics', 'Data Visualization', 'Python/R',
      'SQL', 'Deep Learning', 'Feature Engineering', 'Model Deployment',
      'A/B Testing', 'Business Intelligence', 'Data Pipeline', 'MLOps'
    ],
    'ux-designer': [
      'User Research', 'Design Systems', 'Prototyping', 'Usability Testing',
      'Information Architecture', 'Interaction Design', 'Visual Design', 'Accessibility',
      'Design Thinking', 'User Journey Mapping', 'Wireframing', 'Design Tools'
    ]
  }

  const llmProviders = [
    { id: 'openai', label: 'OpenAI GPT', models: ['gpt-4-turbo-preview', 'gpt-3.5-turbo'] },
    { id: 'gemini', label: 'Google Gemini', models: ['gemini-pro', 'gemini-pro-vision'] },
    { id: 'claude', label: 'Anthropic Claude', models: ['claude-3-opus', 'claude-3-sonnet'] }
  ]

  const updateConfig = (updates: Partial<CoachingConfig>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  const toggleFocusArea = (area: string) => {
    const newFocusAreas = config.focusAreas.includes(area)
      ? config.focusAreas.filter(a => a !== area)
      : [...config.focusAreas, area]
    
    updateConfig({ focusAreas: newFocusAreas })
  }

  const updateUserProfile = (updates: Partial<CoachingConfig['userProfile']>) => {
    updateConfig({
      userProfile: { ...config.userProfile, ...updates }
    })
  }

  const addExperience = (experience: string) => {
    if (experience.trim() && !config.userProfile.experience.includes(experience.trim())) {
      updateUserProfile({
        experience: [...config.userProfile.experience, experience.trim()]
      })
    }
  }

  const removeExperience = (experience: string) => {
    updateUserProfile({
      experience: config.userProfile.experience.filter(e => e !== experience)
    })
  }

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 3) return 'Beginner'
    if (difficulty <= 6) return 'Intermediate'
    if (difficulty <= 8) return 'Advanced'
    return 'Expert'
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'text-green-600'
    if (difficulty <= 6) return 'text-yellow-600'
    if (difficulty <= 8) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-600 mb-2">Configure AI Coaching Session</h2>
        <p className="text-gray-600">
          Customize your {role.replace('-', ' ')} coaching experience
        </p>
      </div>

      {/* Session Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Session Type</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessionTypes.map((type) => (
              <div
                key={type.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  config.sessionType === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateConfig({ sessionType: type.id as any })}
              >
                <div className="flex items-start space-x-3">
                  <type.icon className="h-6 w-6 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-600">{type.label}</h3>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    <Badge className={`mt-2 ${type.color}`}>
                      {type.label}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Difficulty & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span>Difficulty & Duration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Difficulty Level</Label>
              <div className="mt-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={config.difficulty}
                  onChange={(e) => updateConfig({ difficulty: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Beginner</span>
                  <span className={`font-medium ${getDifficultyColor(config.difficulty)}`}>
                    {config.difficulty}/10 - {getDifficultyLabel(config.difficulty)}
                  </span>
                  <span>Expert</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Questions</Label>
                <Input
                  type="number"
                  min="5"
                  max="50"
                  value={config.questionCount}
                  onChange={(e) => updateConfig({ questionCount: parseInt(e.target.value) || 10 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Time Limit (min)</Label>
                <Input
                  type="number"
                  min="15"
                  max="180"
                  value={config.timeLimit ? config.timeLimit / 60 : ''}
                  onChange={(e) => updateConfig({ 
                    timeLimit: e.target.value ? parseInt(e.target.value) * 60 : undefined 
                  })}
                  placeholder="No limit"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="adaptive"
                  checked={config.adaptiveDifficulty}
                  onChange={(e) => updateConfig({ adaptiveDifficulty: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="adaptive" className="text-sm">
                  Adaptive difficulty based on performance
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="emotional"
                  checked={config.emotionalAnalysis}
                  onChange={(e) => updateConfig({ emotionalAnalysis: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="emotional" className="text-sm">
                  Real-time emotional intelligence analysis
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>AI Model Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">LLM Provider</Label>
              <select
                value={config.llmProvider}
                onChange={(e) => updateConfig({ 
                  llmProvider: e.target.value as any,
                  llmModel: llmProviders.find(p => p.id === e.target.value)?.models[0] || ''
                })}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                {llmProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium">Model</Label>
              <select
                value={config.llmModel}
                onChange={(e) => updateConfig({ llmModel: e.target.value })}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                {llmProviders
                  .find(p => p.id === config.llmProvider)
                  ?.models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium">User Level</Label>
              <select
                value={config.userProfile.level}
                onChange={(e) => updateUserProfile({ level: e.target.value as any })}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="novice">Novice</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Focus Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            <span>Focus Areas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {(focusAreasByRole[role as keyof typeof focusAreasByRole] || []).map((area) => (
              <button
                key={area}
                onClick={() => toggleFocusArea(area)}
                className={`p-2 text-sm rounded-lg border transition-all ${
                  config.focusAreas.includes(area)
                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
          {config.focusAreas.length === 0 && (
            <div className="flex items-center space-x-2 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Select at least one focus area for better personalized coaching
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <span>Your Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Experience & Skills</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {config.userProfile.experience.map((exp) => (
                <Badge
                  key={exp}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-100"
                  onClick={() => removeExperience(exp)}
                >
                  {exp} ×
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add experience (press Enter)"
              className="mt-2"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addExperience(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Areas you want to improve</Label>
            <Textarea
              value={config.userProfile.weaknesses.join(', ')}
              onChange={(e) => updateUserProfile({ 
                weaknesses: e.target.value.split(',').map(w => w.trim()).filter(Boolean)
              })}
              placeholder="e.g., System design, Communication, Problem solving..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Your goals</Label>
            <Textarea
              value={config.userProfile.goals.join(', ')}
              onChange={(e) => updateUserProfile({ 
                goals: e.target.value.split(',').map(g => g.trim()).filter(Boolean)
              })}
              placeholder="e.g., Get hired at FAANG, Improve technical skills, Practice interviews..."
              rows={2}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Start Session Button */}
      <div className="flex items-center justify-center">
        <Button
          onClick={() => onStartSession(config)}
          disabled={config.focusAreas.length === 0}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
        >
          <Brain className="mr-2 h-5 w-5" />
          Start AI Coaching Session
        </Button>
      </div>

      {/* Info Box */}
      <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">How AI Coaching Works:</p>
          <ul className="space-y-1 text-xs">
            <li>• AI analyzes your responses in real-time and adapts questions accordingly</li>
            <li>• Emotional intelligence tracking helps optimize your stress and confidence levels</li>
            <li>• Personalized feedback is generated based on your profile and performance</li>
            <li>• Session results include detailed analytics and improvement recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
