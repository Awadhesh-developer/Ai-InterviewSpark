import { apiClient } from '@/lib/api'

export interface AIResumeRequest {
  jobTitle?: string
  industry?: string
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive'
  skills?: string[]
  currentContent?: string
  targetCompany?: string
  jobDescription?: string
}

export interface AIResumeResponse {
  content: string
  suggestions: string[]
  atsScore: number
  keywords: string[]
  improvements: string[]
}

export interface AIContentSuggestion {
  type: 'summary' | 'experience' | 'skills' | 'achievement'
  content: string
  reasoning: string
  atsOptimized: boolean
}

export interface IndustryTemplate {
  id: string
  name: string
  industry: string
  description: string
  sections: string[]
  keywords: string[]
  format: 'modern' | 'traditional' | 'creative' | 'minimal'
}

class AIResumeService {
  // Generate AI-powered professional summary
  async generateSummary(request: AIResumeRequest): Promise<string> {
    try {
      // Mock AI-generated summary - replace with actual AI API call
      const summaries = {
        'software-engineer': `Innovative Software Engineer with ${this.getExperienceText(request.experienceLevel)} developing scalable applications and leading cross-functional teams. Proven expertise in modern technologies including ${request.skills?.slice(0, 3).join(', ')} with a track record of delivering high-quality solutions that drive business growth.`,
        'data-scientist': `Results-driven Data Scientist with ${this.getExperienceText(request.experienceLevel)} transforming complex datasets into actionable business insights. Expert in machine learning, statistical analysis, and data visualization with proven ability to drive data-driven decision making.`,
        'product-manager': `Strategic Product Manager with ${this.getExperienceText(request.experienceLevel)} leading product development from conception to launch. Demonstrated success in market research, user experience optimization, and cross-functional team leadership.`,
        'marketing-manager': `Creative Marketing Manager with ${this.getExperienceText(request.experienceLevel)} developing and executing comprehensive marketing strategies. Proven track record in digital marketing, brand management, and campaign optimization that drives customer acquisition and retention.`,
        default: `Dedicated professional with ${this.getExperienceText(request.experienceLevel)} delivering exceptional results in ${request.industry || 'various industries'}. Strong analytical and problem-solving skills with a proven ability to work effectively in fast-paced environments.`
      }

      const key = request.jobTitle?.toLowerCase().replace(/\s+/g, '-') || 'default'
      return summaries[key as keyof typeof summaries] || summaries.default
    } catch (error) {
      console.error('Error generating summary:', error)
      return 'Professional with strong background and proven track record of success.'
    }
  }

  // Generate AI-powered bullet points for experience
  async generateExperienceBullets(request: AIResumeRequest & { 
    company: string
    position: string
    responsibilities?: string
  }): Promise<string[]> {
    try {
      // Mock AI-generated bullets - replace with actual AI API call
      const bulletTemplates = {
        'software-engineer': [
          `Developed and maintained ${request.skills?.includes('React') ? 'React-based' : 'web'} applications serving 10,000+ users daily`,
          `Collaborated with cross-functional teams to deliver features 25% faster than industry average`,
          `Implemented automated testing strategies reducing bug reports by 40%`,
          `Optimized application performance resulting in 30% faster load times`,
          `Mentored junior developers and conducted code reviews to maintain high code quality standards`
        ],
        'data-scientist': [
          `Analyzed large datasets using Python and SQL to identify trends and patterns driving business decisions`,
          `Built machine learning models that improved prediction accuracy by 35%`,
          `Created interactive dashboards and visualizations for executive leadership`,
          `Collaborated with product teams to implement data-driven features`,
          `Presented findings to stakeholders resulting in $500K cost savings`
        ],
        'product-manager': [
          `Led product roadmap development for features used by 50,000+ monthly active users`,
          `Conducted market research and user interviews to identify product opportunities`,
          `Collaborated with engineering and design teams to deliver products on time and within budget`,
          `Analyzed user metrics and feedback to drive product improvements`,
          `Managed product launches resulting in 25% increase in user engagement`
        ],
        default: [
          `Achieved measurable results through strategic planning and execution`,
          `Collaborated effectively with team members to meet project deadlines`,
          `Implemented process improvements that increased efficiency by 20%`,
          `Maintained high standards of quality and attention to detail`,
          `Contributed to team success through strong communication and problem-solving skills`
        ]
      }

      const key = request.position?.toLowerCase().replace(/\s+/g, '-') || 'default'
      return bulletTemplates[key as keyof typeof bulletTemplates] || bulletTemplates.default
    } catch (error) {
      console.error('Error generating experience bullets:', error)
      return ['Contributed to team success and project completion']
    }
  }

  // Generate skill recommendations based on job title and industry
  async generateSkillSuggestions(request: AIResumeRequest): Promise<string[]> {
    try {
      const skillSets = {
        'software-engineer': [
          'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'Git',
          'REST APIs', 'GraphQL', 'MongoDB', 'PostgreSQL', 'Agile', 'CI/CD'
        ],
        'data-scientist': [
          'Python', 'R', 'SQL', 'Machine Learning', 'TensorFlow', 'Pandas', 'NumPy',
          'Tableau', 'Power BI', 'Statistics', 'A/B Testing', 'Big Data', 'Spark'
        ],
        'product-manager': [
          'Product Strategy', 'Roadmap Planning', 'User Research', 'A/B Testing',
          'Analytics', 'Agile', 'Scrum', 'Wireframing', 'Market Research', 'SQL'
        ],
        'marketing-manager': [
          'Digital Marketing', 'SEO/SEM', 'Google Analytics', 'Social Media Marketing',
          'Content Marketing', 'Email Marketing', 'Marketing Automation', 'CRM', 'A/B Testing'
        ],
        default: [
          'Communication', 'Leadership', 'Problem Solving', 'Project Management',
          'Team Collaboration', 'Time Management', 'Critical Thinking', 'Adaptability'
        ]
      }

      const key = request.jobTitle?.toLowerCase().replace(/\s+/g, '-') || 'default'
      return skillSets[key as keyof typeof skillSets] || skillSets.default
    } catch (error) {
      console.error('Error generating skill suggestions:', error)
      return ['Communication', 'Problem Solving', 'Team Collaboration']
    }
  }

  // Get ATS optimization suggestions
  async getATSOptimization(content: string, jobDescription?: string): Promise<{
    score: number
    suggestions: string[]
    keywords: string[]
    improvements: string[]
  }> {
    try {
      // Mock ATS analysis - replace with actual AI API call
      const keywords = this.extractKeywords(jobDescription || content)
      const score = this.calculateATSScore(content, keywords)
      
      return {
        score,
        keywords,
        suggestions: [
          'Include more industry-specific keywords',
          'Use standard section headings (Experience, Education, Skills)',
          'Avoid graphics and complex formatting',
          'Include relevant certifications and achievements',
          'Use action verbs to start bullet points'
        ],
        improvements: [
          'Add quantifiable achievements with numbers and percentages',
          'Include relevant technical skills mentioned in job description',
          'Optimize summary section with target role keywords',
          'Ensure consistent formatting throughout document'
        ]
      }
    } catch (error) {
      console.error('Error getting ATS optimization:', error)
      return {
        score: 75,
        keywords: [],
        suggestions: [],
        improvements: []
      }
    }
  }

  // Get industry-specific templates
  async getIndustryTemplates(industry: string): Promise<IndustryTemplate[]> {
    const templates: IndustryTemplate[] = [
      {
        id: 'tech-modern',
        name: 'Modern Tech',
        industry: 'Technology',
        description: 'Clean, modern design perfect for tech roles',
        sections: ['Summary', 'Technical Skills', 'Experience', 'Projects', 'Education'],
        keywords: ['innovative', 'scalable', 'agile', 'collaborative'],
        format: 'modern'
      },
      {
        id: 'finance-traditional',
        name: 'Finance Professional',
        industry: 'Finance',
        description: 'Traditional, conservative design for finance sector',
        sections: ['Professional Summary', 'Core Competencies', 'Professional Experience', 'Education', 'Certifications'],
        keywords: ['analytical', 'detail-oriented', 'compliance', 'strategic'],
        format: 'traditional'
      },
      {
        id: 'creative-portfolio',
        name: 'Creative Portfolio',
        industry: 'Design',
        description: 'Creative design showcasing artistic abilities',
        sections: ['Creative Summary', 'Skills & Tools', 'Portfolio Highlights', 'Experience', 'Education'],
        keywords: ['creative', 'innovative', 'visual', 'collaborative'],
        format: 'creative'
      },
      {
        id: 'healthcare-professional',
        name: 'Healthcare Professional',
        industry: 'Healthcare',
        description: 'Professional design for healthcare roles',
        sections: ['Professional Summary', 'Clinical Skills', 'Experience', 'Education', 'Licenses & Certifications'],
        keywords: ['patient-focused', 'clinical', 'compassionate', 'evidence-based'],
        format: 'traditional'
      }
    ]

    return templates.filter(template => 
      template.industry.toLowerCase().includes(industry.toLowerCase()) ||
      industry.toLowerCase() === 'all'
    )
  }

  // Real-time content analysis
  async analyzeContent(content: string, section: string): Promise<AIContentSuggestion[]> {
    try {
      const suggestions: AIContentSuggestion[] = []

      if (section === 'summary') {
        if (content.length < 50) {
          suggestions.push({
            type: 'summary',
            content: 'Consider expanding your summary to 2-3 sentences highlighting your key strengths and career objectives.',
            reasoning: 'A comprehensive summary helps recruiters quickly understand your value proposition.',
            atsOptimized: true
          })
        }
      }

      if (section === 'experience') {
        if (!content.includes('•') && !content.includes('-')) {
          suggestions.push({
            type: 'experience',
            content: 'Use bullet points to make your achievements more readable and scannable.',
            reasoning: 'Bullet points improve readability and help ATS systems parse your content better.',
            atsOptimized: true
          })
        }
      }

      return suggestions
    } catch (error) {
      console.error('Error analyzing content:', error)
      return []
    }
  }

  // Helper methods
  private getExperienceText(level?: string): string {
    switch (level) {
      case 'entry': return '2+ years of experience'
      case 'mid': return '5+ years of experience'
      case 'senior': return '8+ years of experience'
      case 'executive': return '15+ years of leadership experience'
      default: return 'proven experience'
    }
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - replace with more sophisticated NLP
    const commonKeywords = [
      'leadership', 'management', 'development', 'analysis', 'strategy',
      'communication', 'collaboration', 'innovation', 'optimization',
      'implementation', 'planning', 'execution', 'results', 'growth'
    ]
    
    return commonKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  private calculateATSScore(content: string, keywords: string[]): number {
    let score = 60 // Base score
    
    // Check for keywords
    score += Math.min(keywords.length * 2, 20)
    
    // Check for quantifiable achievements
    if (/\d+%|\$\d+|\d+\+/.test(content)) score += 10
    
    // Check for action verbs
    const actionVerbs = ['developed', 'implemented', 'managed', 'led', 'created', 'improved']
    const hasActionVerbs = actionVerbs.some(verb => content.toLowerCase().includes(verb))
    if (hasActionVerbs) score += 10
    
    return Math.min(score, 100)
  }
}

export const aiResumeService = new AIResumeService()
