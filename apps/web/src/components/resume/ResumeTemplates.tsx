'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IndustryTemplate } from '@/services/aiResumeService'
import {
  Palette,
  Briefcase,
  Code,
  TrendingUp,
  Users,
  Heart,
  Building,
  Zap,
  Star,
  CheckCircle
} from 'lucide-react'

interface ResumeTemplatesProps {
  onSelectTemplate: (template: IndustryTemplate) => void
  selectedIndustry?: string
}

export function ResumeTemplates({ onSelectTemplate, selectedIndustry }: ResumeTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const templates: IndustryTemplate[] = [
    {
      id: 'tech-modern',
      name: 'Modern Tech Professional',
      industry: 'Technology',
      description: 'Clean, modern design perfect for software engineers, developers, and tech professionals',
      sections: ['Professional Summary', 'Technical Skills', 'Experience', 'Projects', 'Education'],
      keywords: ['innovative', 'scalable', 'agile', 'collaborative', 'full-stack', 'cloud'],
      format: 'modern'
    },
    {
      id: 'finance-executive',
      name: 'Finance Executive',
      industry: 'Finance',
      description: 'Professional, conservative design for finance, banking, and investment professionals',
      sections: ['Executive Summary', 'Core Competencies', 'Professional Experience', 'Education', 'Certifications'],
      keywords: ['analytical', 'strategic', 'compliance', 'risk management', 'financial modeling'],
      format: 'traditional'
    },
    {
      id: 'creative-portfolio',
      name: 'Creative Portfolio',
      industry: 'Design',
      description: 'Visually striking design for designers, artists, and creative professionals',
      sections: ['Creative Summary', 'Skills & Tools', 'Portfolio Highlights', 'Experience', 'Education'],
      keywords: ['creative', 'innovative', 'visual', 'brand', 'user experience'],
      format: 'creative'
    },
    {
      id: 'healthcare-professional',
      name: 'Healthcare Professional',
      industry: 'Healthcare',
      description: 'Clean, professional design for medical professionals and healthcare workers',
      sections: ['Professional Summary', 'Clinical Skills', 'Experience', 'Education', 'Licenses & Certifications'],
      keywords: ['patient-focused', 'clinical', 'compassionate', 'evidence-based', 'healthcare'],
      format: 'traditional'
    },
    {
      id: 'marketing-digital',
      name: 'Digital Marketing Pro',
      industry: 'Marketing',
      description: 'Dynamic design for marketing professionals and digital strategists',
      sections: ['Marketing Summary', 'Core Skills', 'Campaign Experience', 'Education', 'Achievements'],
      keywords: ['data-driven', 'creative', 'ROI-focused', 'digital', 'growth'],
      format: 'modern'
    },
    {
      id: 'sales-executive',
      name: 'Sales Executive',
      industry: 'Sales',
      description: 'Results-focused design for sales professionals and business development',
      sections: ['Sales Summary', 'Key Achievements', 'Sales Experience', 'Education', 'Awards'],
      keywords: ['results-driven', 'relationship-building', 'revenue growth', 'negotiation'],
      format: 'traditional'
    },
    {
      id: 'consulting-minimal',
      name: 'Consulting Minimal',
      industry: 'Consulting',
      description: 'Clean, minimal design for consultants and business analysts',
      sections: ['Professional Summary', 'Core Competencies', 'Consulting Experience', 'Education', 'Skills'],
      keywords: ['strategic', 'analytical', 'problem-solving', 'client-focused'],
      format: 'minimal'
    },
    {
      id: 'startup-founder',
      name: 'Startup Founder',
      industry: 'Entrepreneurship',
      description: 'Bold, innovative design for entrepreneurs and startup founders',
      sections: ['Founder Summary', 'Ventures & Achievements', 'Leadership Experience', 'Education', 'Skills'],
      keywords: ['entrepreneurial', 'innovative', 'leadership', 'growth', 'vision'],
      format: 'modern'
    }
  ]

  const getIndustryIcon = (industry: string) => {
    switch (industry.toLowerCase()) {
      case 'technology':
        return <Code className="h-5 w-5 text-blue-600" />
      case 'finance':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'design':
        return <Palette className="h-5 w-5 text-purple-600" />
      case 'healthcare':
        return <Heart className="h-5 w-5 text-red-600" />
      case 'marketing':
        return <Zap className="h-5 w-5 text-orange-600" />
      case 'sales':
        return <Users className="h-5 w-5 text-indigo-600" />
      case 'consulting':
        return <Building className="h-5 w-5 text-gray-600" />
      case 'entrepreneurship':
        return <Star className="h-5 w-5 text-yellow-600" />
      default:
        return <Briefcase className="h-5 w-5 text-gray-600" />
    }
  }

  const getFormatBadge = (format: string) => {
    const variants = {
      modern: 'default',
      traditional: 'secondary',
      creative: 'destructive',
      minimal: 'outline'
    } as const

    return (
      <Badge variant={variants[format as keyof typeof variants] || 'secondary'}>
        {format.charAt(0).toUpperCase() + format.slice(1)}
      </Badge>
    )
  }

  const filteredTemplates = selectedIndustry 
    ? templates.filter(template => 
        template.industry.toLowerCase().includes(selectedIndustry.toLowerCase())
      )
    : templates

  const handleSelectTemplate = (template: IndustryTemplate) => {
    setSelectedTemplate(template.id)
    onSelectTemplate(template)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Resume Template
        </h2>
        <p className="text-gray-600">
          Select a professionally designed template optimized for your industry
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedTemplate === template.id 
                ? 'ring-2 ring-blue-500 border-blue-500' 
                : 'hover:border-gray-300'
            }`}
            onClick={() => handleSelectTemplate(template)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getIndustryIcon(template.industry)}
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                {selectedTemplate === template.id && (
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="flex items-center space-x-2">
                {getFormatBadge(template.format)}
                <Badge variant="outline">{template.industry}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>{template.description}</CardDescription>
              
              {/* Template Preview */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                <div className="h-1 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-1">
                  <div className="h-1 bg-gray-200 rounded w-full"></div>
                  <div className="h-1 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-1 bg-gray-200 rounded w-4/5"></div>
                </div>
                <div className="h-1 bg-gray-300 rounded w-2/3"></div>
                <div className="space-y-1">
                  <div className="h-1 bg-gray-200 rounded w-full"></div>
                  <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>

              {/* Sections */}
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Sections Included:</h4>
                <div className="flex flex-wrap gap-1">
                  {template.sections.slice(0, 3).map((section, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {section}
                    </Badge>
                  ))}
                  {template.sections.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.sections.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Optimized Keywords:</h4>
                <div className="flex flex-wrap gap-1">
                  {template.keywords.slice(0, 3).map((keyword, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {keyword}
                    </span>
                  ))}
                  {template.keywords.length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      +{template.keywords.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <Button 
                className="w-full" 
                variant={selectedTemplate === template.id ? "default" : "outline"}
                onClick={() => handleSelectTemplate(template)}
              >
                {selectedTemplate === template.id ? 'Selected' : 'Use This Template'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Template Option */}
      <Card className="border-dashed border-2 hover:border-blue-500 transition-colors">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Palette className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Create Custom Template
          </h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            Want something unique? Our AI can help you create a custom template
          </p>
          <Button variant="outline">
            Coming Soon
          </Button>
        </CardContent>
      </Card>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No templates found
          </h3>
          <p className="text-gray-500">
            Try selecting a different industry or browse all templates
          </p>
        </div>
      )}
    </div>
  )
}
