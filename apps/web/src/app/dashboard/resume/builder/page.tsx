'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AIResumeBuilder } from '@/components/resume/AIResumeBuilder'
import { aiResumeService } from '@/services/aiResumeService'
import {
  ArrowLeft,
  Save,
  Download,
  Eye,
  Plus,
  Trash2,
  Edit,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Mail,
  Phone,
  MapPin,
  Globe,
  Brain,
  Sparkles,
  Target,
  Zap
} from 'lucide-react'

interface PersonalInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  website: string
  summary: string
  jobTitle: string
  industry: string
}

interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

interface Education {
  id: string
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  gpa?: string
}

interface Skill {
  id: string
  name: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
}

export default function AIResumeBuilderPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('setup')
  const [isSaving, setIsSaving] = useState(false)
  const [atsScore, setAtsScore] = useState(75)
  const [showAIAssistant, setShowAIAssistant] = useState(true)

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    summary: '',
    jobTitle: '',
    industry: ''
  })

  const [experiences, setExperiences] = useState<Experience[]>([
    {
      id: '1',
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    }
  ])

  const [education, setEducation] = useState<Education[]>([
    {
      id: '1',
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: ''
    }
  ])

  const [skills, setSkills] = useState<Skill[]>([
    { id: '1', name: '', level: 'Intermediate' }
  ])

  useEffect(() => {
    // Update ATS score when content changes
    updateATSScore()
  }, [personalInfo, experiences, skills])

  const updateATSScore = async () => {
    try {
      const content = `${personalInfo.summary} ${experiences.map(exp => exp.description).join(' ')}`
      const analysis = await aiResumeService.getATSOptimization(content)
      setAtsScore(analysis.score)
    } catch (error) {
      console.error('Error updating ATS score:', error)
    }
  }

  const handleAIContentChange = (section: string, content: string) => {
    if (section === 'summary') {
      setPersonalInfo(prev => ({ ...prev, summary: content }))
    } else if (section === 'experience') {
      // Update the first experience entry with AI-generated content
      setExperiences(prev => prev.map((exp, index) => 
        index === 0 ? { ...exp, description: content } : exp
      ))
    } else if (section === 'skills') {
      const skillNames = content.split(',').map(s => s.trim()).filter(s => s)
      const newSkills = skillNames.map((name, index) => ({
        id: `skill-${index}`,
        name,
        level: 'Intermediate' as const
      }))
      setSkills(newSkills)
    }
  }

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    }
    setExperiences([...experiences, newExp])
  }

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id))
  }

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setExperiences(experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ))
  }

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: ''
    }
    setEducation([...education, newEdu])
  }

  const removeEducation = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id))
  }

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setEducation(education.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ))
  }

  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: '',
      level: 'Intermediate'
    }
    setSkills([...skills, newSkill])
  }

  const removeSkill = (id: string) => {
    setSkills(skills.filter(skill => skill.id !== id))
  }

  const updateSkill = (id: string, field: keyof Skill, value: any) => {
    setSkills(skills.map(skill => 
      skill.id === id ? { ...skill, [field]: value } : skill
    ))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: Implement API call to save resume
      await new Promise(resolve => setTimeout(resolve, 2000))
      router.push('/dashboard/resume')
    } catch (error) {
      console.error('Failed to save resume:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-600 flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span>AI Resume Builder</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Create a professional resume with AI-powered suggestions and optimization
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* ATS Score Display */}
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">ATS Score:</span>
            <span className={`font-bold ${getScoreColor(atsScore)}`}>
              {atsScore}%
            </span>
          </div>
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* ATS Score Progress */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              ATS Compatibility Score
            </span>
            <Badge variant={atsScore >= 80 ? 'default' : 'secondary'}>
              {atsScore >= 80 ? 'Excellent' : atsScore >= 60 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>
          <Progress value={atsScore} className="h-3" />
          <p className="text-xs text-blue-700 mt-2">
            Your resume is {atsScore >= 80 ? 'highly optimized' : 'partially optimized'} for Applicant Tracking Systems
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <span>AI Resume Setup</span>
                  </CardTitle>
                  <CardDescription>
                    Tell us about your target role to get personalized AI assistance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Target Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={personalInfo.jobTitle}
                        onChange={(e) => setPersonalInfo({...personalInfo, jobTitle: e.target.value})}
                        placeholder="e.g., Senior Software Engineer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={personalInfo.industry}
                        onChange={(e) => setPersonalInfo({...personalInfo, industry: e.target.value})}
                        placeholder="e.g., Technology"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobDescription">Job Description (Optional)</Label>
                    <Textarea
                      id="jobDescription"
                      placeholder="Paste the job description here for more targeted AI suggestions..."
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                    <Brain className="h-8 w-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-900">AI Assistant Ready</h4>
                      <p className="text-sm text-blue-700">
                        Our AI will provide personalized suggestions based on your target role
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setActiveTab('personal')}
                    className="w-full"
                    disabled={!personalInfo.jobTitle}
                  >
                    Continue to Personal Information
                    <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other tabs content would continue here... */}
            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <CardDescription>
                    Enter your basic contact information and professional summary
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={personalInfo.firstName}
                        onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={personalInfo.lastName}
                        onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={personalInfo.phone}
                        onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={personalInfo.location}
                        onChange={(e) => setPersonalInfo({...personalInfo, location: e.target.value})}
                        placeholder="New York, NY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website/Portfolio</Label>
                      <Input
                        id="website"
                        value={personalInfo.website}
                        onChange={(e) => setPersonalInfo({...personalInfo, website: e.target.value})}
                        placeholder="https://johndoe.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="summary">Professional Summary</Label>
                    <Textarea
                      id="summary"
                      value={personalInfo.summary}
                      onChange={(e) => setPersonalInfo({...personalInfo, summary: e.target.value})}
                      placeholder="Write a brief summary of your professional background and career objectives..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Add other tab contents as needed */}
          </Tabs>
        </div>

        {/* AI Assistant Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <AIResumeBuilder
              onContentChange={handleAIContentChange}
              currentContent={{
                summary: personalInfo.summary,
                experience: experiences[0]?.description || '',
                skills: skills.map(s => s.name).filter(Boolean)
              }}
              jobTitle={personalInfo.jobTitle}
              industry={personalInfo.industry}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
