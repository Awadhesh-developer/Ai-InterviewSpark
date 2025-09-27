'use client'

import { useState } from 'react'
import { useInternationalization } from '@/contexts/InternationalizationContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { culturalInterviewStyles, locales, localeNames, localeFlags, type Locale } from '@/i18n/config'
import {
  Globe,
  Users,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Target,
  Clock,
  Star,
  TrendingUp,
  Award,
  Brain
} from 'lucide-react'

export default function CulturalStylesPage() {
  const { currentLanguage, t } = useInternationalization()
  const currentLocale = currentLanguage.code as Locale
  const [selectedCulture, setSelectedCulture] = useState<Locale>(currentLocale)
  const [activeTab, setActiveTab] = useState('overview')

  const selectedStyle = culturalInterviewStyles[selectedCulture]

  const getCultureCard = (locale: Locale) => {
    const style = culturalInterviewStyles[locale]
    return (
      <Card 
        key={locale}
        className={`cursor-pointer transition-all hover:shadow-lg ${
          selectedCulture === locale ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => setSelectedCulture(locale)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{localeFlags[locale]}</span>
              <div>
                <CardTitle className="text-lg">{localeNames[locale]}</CardTitle>
                <CardDescription className="text-sm">{style.style}</CardDescription>
              </div>
            </div>
            {selectedCulture === locale && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{style.characteristics.length} key characteristics</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>{style.commonQuestions.length} common questions</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              <span>{style.etiquette.length} etiquette tips</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('cultural.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('cultural.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedCulture} onValueChange={(value: Locale) => setSelectedCulture(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('cultural.selectCulture')} />
            </SelectTrigger>
            <SelectContent>
              {locales.map((locale) => (
                <SelectItem key={locale} value={locale}>
                  <div className="flex items-center space-x-2">
                    <span>{localeFlags[locale]}</span>
                    <span>{localeNames[locale]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current Culture Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Globe className="h-4 w-4" />
        <AlertDescription>
          You're currently viewing the platform in <strong>{localeNames[currentLocale]}</strong>. 
          The interview questions and feedback will be adapted to {localeNames[currentLocale]} cultural norms.
        </AlertDescription>
      </Alert>

      {/* Culture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locales.map(getCultureCard)}
      </div>

      {/* Detailed View */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{localeFlags[selectedCulture]}</span>
            <div>
              <CardTitle className="text-2xl">{localeNames[selectedCulture]} {t('cultural.interviewStyle')}</CardTitle>
              <CardDescription className="text-lg">{selectedStyle.style}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">{t('cultural.characteristics')}</TabsTrigger>
              <TabsTrigger value="questions">{t('cultural.commonQuestions')}</TabsTrigger>
              <TabsTrigger value="etiquette">{t('cultural.etiquette')}</TabsTrigger>
              <TabsTrigger value="tips">{t('cultural.tips')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <span>Key Characteristics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {selectedStyle.characteristics.map((characteristic, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{characteristic}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <span>Cultural Context</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Communication Style</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedCulture === 'en' && 'Direct, confident, and achievement-focused communication is valued.'}
                        {selectedCulture === 'es' && 'Warm, relationship-building communication with emphasis on collaboration.'}
                        {selectedCulture === 'fr' && 'Formal, intellectual discussions with attention to detail and precision.'}
                        {selectedCulture === 'de' && 'Structured, thorough, and process-oriented communication style.'}
                        {selectedCulture === 'zh' && 'Respectful, harmony-focused communication emphasizing team success.'}
                        {selectedCulture === 'ja' && 'Extremely polite and respectful communication with group orientation.'}
                        {selectedCulture === 'ko' && 'Hierarchical respect with emphasis on dedication and hard work.'}
                        {selectedCulture === 'pt' && 'Personal, warm communication style with family considerations.'}
                        {selectedCulture === 'it' && 'Expressive, passionate communication with emphasis on personal style.'}
                        {selectedCulture === 'ru' && 'Direct, competence-focused communication emphasizing technical skills.'}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Values & Priorities</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCulture === 'en' && ['Individual Achievement', 'Innovation', 'Problem-solving'].map(value => (
                          <Badge key={value} variant="outline">{value}</Badge>
                        ))}
                        {selectedCulture === 'es' && ['Team Collaboration', 'Relationships', 'Work-life Balance'].map(value => (
                          <Badge key={value} variant="outline">{value}</Badge>
                        ))}
                        {selectedCulture === 'fr' && ['Education', 'Intellectual Rigor', 'Precision'].map(value => (
                          <Badge key={value} variant="outline">{value}</Badge>
                        ))}
                        {selectedCulture === 'de' && ['Process', 'Punctuality', 'Technical Competence'].map(value => (
                          <Badge key={value} variant="outline">{value}</Badge>
                        ))}
                        {selectedCulture === 'zh' && ['Harmony', 'Long-term Thinking', 'Continuous Learning'].map(value => (
                          <Badge key={value} variant="outline">{value}</Badge>
                        ))}
                        {selectedCulture === 'ja' && ['Respect', 'Group Harmony', 'Attention to Detail'].map(value => (
                          <Badge key={value} variant="outline">{value}</Badge>
                        ))}
                        {selectedCulture === 'ko' && ['Hierarchy', 'Education', 'Dedication'].map(value => (
                          <Badge key={value} variant="outline">{value}</Badge>
                        ))}
                        {selectedCulture === 'pt' && ['Personal Connections', 'Flexibility', 'Warmth'].map(value => (
                          <Badge key={value} variant="outline">{value}</Badge>
                        ))}
                        {selectedCulture === 'it' && ['Passion', 'Style', 'Creativity'].map(value => (
                          <Badge key={value} variant="outline">{value}</Badge>
                        ))}
                        {selectedCulture === 'ru' && ['Technical Expertise', 'Resilience', 'Directness'].map(value => (
                          <Badge key={value} variant="outline">{value}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {selectedStyle.commonQuestions.map((question, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{question}</p>
                          <div className="mt-2 flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Target className="h-3 w-3 mr-2" />
                              Practice This
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Lightbulb className="h-3 w-3 mr-2" />
                              Get Tips
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="etiquette" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedStyle.etiquette.map((tip, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{tip}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tips" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Do's</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedCulture === 'en' && [
                        'Be direct and confident in your responses',
                        'Highlight individual achievements and metrics',
                        'Ask thoughtful questions about the role',
                        'Maintain strong eye contact'
                      ].map((tip, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                      {selectedCulture === 'es' && [
                        'Show warmth and build personal connections',
                        'Emphasize team collaboration experiences',
                        'Discuss work-life balance appropriately',
                        'Demonstrate respect for company culture'
                      ].map((tip, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                      {/* Add more cultural do's for other locales */}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Don'ts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedCulture === 'en' && [
                        'Don\'t be overly modest about achievements',
                        'Avoid vague or indirect responses',
                        'Don\'t interrupt the interviewer',
                        'Avoid discussing personal problems'
                      ].map((tip, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <AlertTriangle className="h-3 w-3 text-red-500 mt-1 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                      {selectedCulture === 'es' && [
                        'Don\'t be overly formal or cold',
                        'Avoid focusing only on individual success',
                        'Don\'t ignore hierarchy and respect',
                        'Avoid rushing through relationship building'
                      ].map((tip, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <AlertTriangle className="h-3 w-3 text-red-500 mt-1 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                      {/* Add more cultural don'ts for other locales */}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Practice Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span>Practice with {localeNames[selectedCulture]} Style</span>
          </CardTitle>
          <CardDescription>
            Start a practice session adapted to {localeNames[selectedCulture]} cultural interview norms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button size="lg">
              <Star className="h-4 w-4 mr-2" />
              Start Cultural Practice
            </Button>
            <Button variant="outline" size="lg">
              <BookOpen className="h-4 w-4 mr-2" />
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
