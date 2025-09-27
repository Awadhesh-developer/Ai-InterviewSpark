'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useInternationalization } from '@/contexts/InternationalizationContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config'
import { Globe, Check, Loader2 } from 'lucide-react'

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'icon-only'
  showFlag?: boolean
  showName?: boolean
  className?: string
}

export default function LanguageSelector({
  variant = 'default',
  showFlag = true,
  showName = true,
  className = ''
}: LanguageSelectorProps) {
  const { t, currentLanguage, changeLanguage } = useInternationalization()
  const locale = currentLanguage.code as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = (newLocale: Locale) => {
    startTransition(async () => {
      await changeLanguage(newLocale)
      setIsOpen(false)
    })
  }

  const getCurrentLanguageDisplay = () => {
    const flag = showFlag ? localeFlags[locale] : ''
    const name = showName ? localeNames[locale] : ''
    
    switch (variant) {
      case 'icon-only':
        return <Globe className="h-4 w-4" />
      case 'compact':
        return (
          <div className="flex items-center space-x-1">
            {showFlag && <span className="text-sm">{flag}</span>}
            <span className="text-sm font-medium">{locale.toUpperCase()}</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center space-x-2">
            {showFlag && <span>{flag}</span>}
            {showName && <span>{name}</span>}
            <Globe className="h-4 w-4 opacity-50" />
          </div>
        )
    }
  }

  const getLanguageItemDisplay = (targetLocale: Locale) => {
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          <span>{localeFlags[targetLocale]}</span>
          <span>{localeNames[targetLocale]}</span>
          {targetLocale === locale && (
            <Badge variant="secondary" className="text-xs">
              {t('language.currentLanguage')}
            </Badge>
          )}
        </div>
        {targetLocale === locale && (
          <Check className="h-4 w-4 text-green-600" />
        )}
      </div>
    )
  }

  // Group languages by region for better organization
  const languageGroups = {
    western: ['en', 'es', 'fr', 'de', 'pt', 'it'] as Locale[],
    eastern: ['zh', 'ja', 'ko', 'ru'] as Locale[]
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === 'compact' ? 'sm' : 'default'}
          className={`${className} ${isPending ? 'opacity-50' : ''}`}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            getCurrentLanguageDisplay()
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center space-x-2">
          <Globe className="h-4 w-4" />
          <span>{t('language.selectLanguage')}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Western Languages */}
        <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
          Western Languages
        </DropdownMenuLabel>
        {languageGroups.western.map((targetLocale) => (
          <DropdownMenuItem
            key={targetLocale}
            onClick={() => handleLanguageChange(targetLocale)}
            className={`cursor-pointer ${targetLocale === locale ? 'bg-muted' : ''}`}
          >
            {getLanguageItemDisplay(targetLocale)}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Eastern Languages */}
        <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
          Eastern Languages
        </DropdownMenuLabel>
        {languageGroups.eastern.map((targetLocale) => (
          <DropdownMenuItem
            key={targetLocale}
            onClick={() => handleLanguageChange(targetLocale)}
            className={`cursor-pointer ${targetLocale === locale ? 'bg-muted' : ''}`}
          >
            {getLanguageItemDisplay(targetLocale)}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Auto-detect option */}
        <DropdownMenuItem
          onClick={() => {
            const browserLocale = navigator.language.split('-')[0] as Locale
            const supportedLocale = locales.includes(browserLocale) ? browserLocale : 'en'
            handleLanguageChange(supportedLocale)
          }}
          className="cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 opacity-50" />
            <span>{t('language.autoDetect')}</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Compact version for mobile/small spaces
export function CompactLanguageSelector(props: Omit<LanguageSelectorProps, 'variant'>) {
  return <LanguageSelector {...props} variant="compact" />
}

// Icon-only version for minimal UI
export function IconLanguageSelector(props: Omit<LanguageSelectorProps, 'variant'>) {
  return <LanguageSelector {...props} variant="icon-only" showFlag={false} showName={false} />
}

// Hook for language detection and management
export function useLanguageDetection() {
  const { currentLanguage, changeLanguage } = useInternationalization()
  const locale = currentLanguage.code as Locale

  const detectAndSetLanguage = async () => {
    const stored = localStorage.getItem('preferred-language') as Locale
    const browser = navigator.language.split('-')[0] as Locale
    const detected = stored || (locales.includes(browser) ? browser : 'en')

    if (detected !== locale) {
      await changeLanguage(detected)
    }
  }

  const setLanguage = async (newLocale: Locale) => {
    await changeLanguage(newLocale)
  }

  return {
    currentLocale: locale,
    detectAndSetLanguage,
    setLanguage,
    supportedLocales: locales,
    localeNames,
    localeFlags
  }
}

// Cultural interview style component
export function CulturalInterviewGuide() {
  const { currentLanguage, t } = useInternationalization()
  const locale = currentLanguage.code as Locale
  
  // This would typically come from the cultural interview styles config
  const culturalStyle = {
    style: 'Direct and Achievement-Focused',
    characteristics: [
      'Direct communication style',
      'Focus on individual achievements',
      'Emphasis on problem-solving skills'
    ],
    commonQuestions: [
      'Tell me about yourself',
      'What are your strengths?',
      'Describe a challenge you overcame'
    ],
    etiquette: [
      'Firm handshake and eye contact',
      'Arrive 10-15 minutes early',
      'Ask thoughtful questions'
    ]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <span className="text-2xl">{localeFlags[locale]}</span>
        <h3 className="text-lg font-semibold">{localeNames[locale]} {t('cultural.interviewStyle')}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">{t('cultural.characteristics')}</h4>
          <ul className="text-sm space-y-1">
            {culturalStyle.characteristics.map((char, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>{char}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">{t('cultural.etiquette')}</h4>
          <ul className="text-sm space-y-1">
            {culturalStyle.etiquette.map((tip, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-green-500">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">{t('cultural.commonQuestions')}</h4>
        <div className="space-y-2">
          {culturalStyle.commonQuestions.map((question, index) => (
            <div key={index} className="p-2 bg-muted rounded text-sm">
              {question}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
