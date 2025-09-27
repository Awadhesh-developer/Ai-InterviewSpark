"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft,
  Award,
  Star,
  Users,
  Clock,
  DollarSign,
  CheckCircle,
  Upload,
  Globe,
  Video,
  MessageCircle,
  Phone,
  Briefcase,
  GraduationCap,
  Target,
  TrendingUp
} from 'lucide-react'

export default function BecomeExpertPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard')
  }, [router])

  return null

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    timezone: '',
    
    // Professional Background
    currentTitle: '',
    currentCompany: '',
    yearsExperience: '',
    linkedinUrl: '',
    portfolioUrl: '',
    
    // Expertise
    primaryRole: '',
    expertise: [] as string[],
    industries: [] as string[],
    certifications: [] as string[],
    
    // Coaching Preferences
    sessionTypes: [] as string[],
    hourlyRate: '',
    availability: [] as string[],
    languages: [] as string[],
    
    // Profile
    bio: '',
    achievements: '',
    coachingExperience: '',
    whyCoach: ''
  })

  const expertiseOptions = [
    'System Design', 'Algorithms', 'Data Structures', 'Software Architecture',
    'Product Strategy', 'Product Management', 'Go-to-Market', 'User Research',
    'Machine Learning', 'Data Science', 'Statistics', 'Python/R',
    'UX Design', 'UI Design', 'Design Systems', 'User Research',
    'Leadership', 'Team Management', 'Career Development', 'Technical Interviews',
    'Frontend Development', 'Backend Development', 'Full Stack', 'DevOps',
    'Mobile Development', 'Cloud Computing', 'Cybersecurity', 'Database Design'
  ]

  const industryOptions = [
    'Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education',
    'Gaming', 'Media', 'Automotive', 'Real Estate', 'Consulting',
    'Startups', 'Enterprise', 'Government', 'Non-profit'
  ]

  const sessionTypeOptions = [
    { id: 'video', label: 'Video Calls', icon: Video },
    { id: 'audio', label: 'Audio Calls', icon: Phone },
    { id: 'chat', label: 'Text Chat', icon: MessageCircle }
  ]

  const availabilityOptions = [
    'Monday Morning', 'Monday Afternoon', 'Monday Evening',
    'Tuesday Morning', 'Tuesday Afternoon', 'Tuesday Evening',
    'Wednesday Morning', 'Wednesday Afternoon', 'Wednesday Evening',
    'Thursday Morning', 'Thursday Afternoon', 'Thursday Evening',
    'Friday Morning', 'Friday Afternoon', 'Friday Evening',
    'Saturday Morning', 'Saturday Afternoon', 'Saturday Evening',
    'Sunday Morning', 'Sunday Afternoon', 'Sunday Evening'
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayToggle = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].includes(value)
        ? (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
        : [...(prev[field as keyof typeof prev] as string[]), value]
    }))
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      // Here you would submit the form data to your API
      console.log('Submitting expert application:', formData)
      
      // Show success message and redirect
      alert('Your expert application has been submitted successfully! We will review it and get back to you within 2-3 business days.')
      router.push('/dashboard/experts')
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('There was an error submitting your application. Please try again.')
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
          </div>
          {step < 4 && (
            <div className={`w-16 h-1 mx-2 ${
              step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span>Personal Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <Input
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <Input
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your.email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <Input
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="City, State/Country"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <Input
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              placeholder="e.g., PST, EST, GMT"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Briefcase className="h-5 w-5 text-blue-600" />
          <span>Professional Background</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Title</label>
            <Input
              value={formData.currentTitle}
              onChange={(e) => handleInputChange('currentTitle', e.target.value)}
              placeholder="e.g., Senior Software Engineer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Company</label>
            <Input
              value={formData.currentCompany}
              onChange={(e) => handleInputChange('currentCompany', e.target.value)}
              placeholder="e.g., Google, Microsoft, Startup"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
            <Input
              type="number"
              value={formData.yearsExperience}
              onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
              placeholder="e.g., 5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Role</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={formData.primaryRole}
              onChange={(e) => handleInputChange('primaryRole', e.target.value)}
            >
              <option value="">Select your primary role</option>
              <option value="software-engineer">Software Engineer</option>
              <option value="product-manager">Product Manager</option>
              <option value="data-scientist">Data Scientist</option>
              <option value="ux-designer">UX Designer</option>
              <option value="engineering-manager">Engineering Manager</option>
              <option value="product-designer">Product Designer</option>
              <option value="data-engineer">Data Engineer</option>
              <option value="devops-engineer">DevOps Engineer</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
            <Input
              value={formData.linkedinUrl}
              onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio/Website URL</label>
            <Input
              value={formData.portfolioUrl}
              onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
              placeholder="https://yourportfolio.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Areas of Expertise</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {expertiseOptions.map((expertise) => (
              <label key={expertise} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.expertise.includes(expertise)}
                  onChange={() => handleArrayToggle('expertise', expertise)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{expertise}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Industries</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {industryOptions.map((industry) => (
              <label key={industry} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.industries.includes(industry)}
                  onChange={() => handleArrayToggle('industries', industry)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{industry}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-600" />
          <span>Coaching Preferences</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Types</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sessionTypeOptions.map((option) => (
              <label key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.sessionTypes.includes(option.id)}
                  onChange={() => handleArrayToggle('sessionTypes', option.id)}
                  className="rounded border-gray-300"
                />
                <option.icon className="h-5 w-5 text-gray-600" />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (USD)</label>
            <Input
              type="number"
              value={formData.hourlyRate}
              onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
              placeholder="e.g., 150"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
            <Input
              value={formData.languages.join(', ')}
              onChange={(e) => handleInputChange('languages', e.target.value.split(', ').filter(Boolean))}
              placeholder="e.g., English, Spanish, French"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {availabilityOptions.map((slot) => (
              <label key={slot} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.availability.includes(slot)}
                  onChange={() => handleArrayToggle('availability', slot)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{slot}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <GraduationCap className="h-5 w-5 text-blue-600" />
          <span>Profile & Experience</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Professional Bio</label>
          <Textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Tell us about your professional background, experience, and what makes you unique..."
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Key Achievements</label>
          <Textarea
            value={formData.achievements}
            onChange={(e) => handleInputChange('achievements', e.target.value)}
            placeholder="List your key professional achievements, awards, publications, or notable projects..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Coaching/Mentoring Experience</label>
          <Textarea
            value={formData.coachingExperience}
            onChange={(e) => handleInputChange('coachingExperience', e.target.value)}
            placeholder="Describe any previous coaching, mentoring, or teaching experience you have..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Why do you want to be a coach?</label>
          <Textarea
            value={formData.whyCoach}
            onChange={(e) => handleInputChange('whyCoach', e.target.value)}
            placeholder="Share your motivation for becoming a coach and how you plan to help candidates..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/experts')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Experts
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-600 mb-2">Become an Expert Coach</h1>
            <p className="text-gray-600">Join our community of expert coaches and help candidates succeed in their interviews</p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Earn Money</h3>
              <p className="text-sm text-gray-600">Set your own rates and earn from coaching sessions</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Help Others</h3>
              <p className="text-sm text-gray-600">Make a difference in candidates' career journeys</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Grow Your Network</h3>
              <p className="text-sm text-gray-600">Connect with professionals across industries</p>
            </CardContent>
          </Card>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form Steps */}
        <div className="mb-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < 4 ? (
            <Button onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              <Award className="mr-2 h-4 w-4" />
              Submit Application
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
