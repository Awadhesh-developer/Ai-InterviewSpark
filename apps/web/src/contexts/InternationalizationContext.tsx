'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  rtl: boolean
}

export interface TranslationKeys {
  // Common
  'common.loading': string
  'common.error': string
  'common.success': string
  'common.cancel': string
  'common.save': string
  'common.delete': string
  'common.edit': string
  'common.view': string
  'common.back': string
  'common.next': string
  'common.previous': string
  'common.submit': string
  'common.close': string
  'common.search': string
  'common.filter': string
  'common.sort': string
  'common.export': string
  'common.import': string
  'common.download': string
  'common.upload': string
  'common.share': string
  'common.copy': string
  'common.paste': string
  'common.cut': string
  'common.undo': string
  'common.redo': string
  'common.select': string
  'common.selectAll': string
  'common.clear': string
  'common.reset': string
  'common.refresh': string
  'common.retry': string
  'common.confirm': string
  'common.yes': string
  'common.no': string
  'common.ok': string
  'common.apply': string
  'common.discard': string

  // Navigation
  'nav.dashboard': string
  'nav.interviews': string
  'nav.analytics': string
  'nav.resume': string
  'nav.experts': string
  'nav.settings': string
  'nav.help': string
  'nav.logout': string

  // Authentication
  'auth.login': string
  'auth.register': string
  'auth.logout': string
  'auth.forgotPassword': string
  'auth.resetPassword': string
  'auth.email': string
  'auth.password': string
  'auth.confirmPassword': string
  'auth.firstName': string
  'auth.lastName': string
  'auth.rememberMe': string
  'auth.loginSuccess': string
  'auth.loginError': string
  'auth.registerSuccess': string
  'auth.registerError': string

  // Dashboard
  'dashboard.welcome': string
  'dashboard.recentActivity': string
  'dashboard.quickActions': string
  'dashboard.statistics': string
  'dashboard.upcomingSessions': string

  // Interviews
  'interviews.title': string
  'interviews.create': string
  'interviews.practice': string
  'interviews.history': string
  'interviews.results': string
  'interviews.feedback': string
  'interviews.score': string
  'interviews.duration': string
  'interviews.questions': string
  'interviews.answers': string

  // Analytics
  'analytics.title': string
  'analytics.performance': string
  'analytics.trends': string
  'analytics.insights': string
  'analytics.benchmarks': string
  'analytics.goals': string

  // Resume
  'resume.title': string
  'resume.upload': string
  'resume.analyze': string
  'resume.optimize': string
  'resume.download': string
  'resume.atsScore': string

  // Experts
  'experts.title': string
  'experts.browse': string
  'experts.book': string
  'experts.sessions': string
  'experts.reviews': string

  // Settings
  'settings.title': string
  'settings.profile': string
  'settings.preferences': string
  'settings.accessibility': string
  'settings.language': string
  'settings.notifications': string
  'settings.privacy': string
  'settings.security': string

  // Language
  'language.title': string
  'language.subtitle': string
  'language.selectLanguage': string
  'language.currentLanguage': string
  'language.changeLanguage': string
  'language.languageChanged': string
  'language.autoDetect': string
  'language.browserLanguage': string
  'language.systemLanguage': string

  // Cultural
  'cultural.title': string
  'cultural.subtitle': string
  'cultural.selectCulture': string
  'cultural.interviewStyle': string
  'cultural.characteristics': string
  'cultural.commonQuestions': string
  'cultural.etiquette': string
  'cultural.tips': string
  'cultural.doAndDonts': string
  'cultural.preparation': string
  'cultural.communication': string
  'cultural.expectations': string
  'cultural.followUp': string

  // Accessibility
  'accessibility.highContrast': string
  'accessibility.reducedMotion': string
  'accessibility.largeText': string
  'accessibility.screenReader': string
  'accessibility.keyboardNavigation': string
  'accessibility.focusIndicators': string
  'accessibility.colorBlindMode': string
  'accessibility.fontSize': string
  'accessibility.announcements': string

  // Errors
  'error.generic': string
  'error.network': string
  'error.unauthorized': string
  'error.forbidden': string
  'error.notFound': string
  'error.serverError': string
  'error.validation': string

  // Success messages
  'success.saved': string
  'success.deleted': string
  'success.updated': string
  'success.created': string
  'success.uploaded': string
  'success.downloaded': string
}

export interface InternationalizationContextType {
  currentLanguage: Language
  availableLanguages: Language[]
  translations: Partial<TranslationKeys>
  changeLanguage: (languageCode: string) => Promise<void>
  t: (key: keyof TranslationKeys, params?: Record<string, string | number>) => string
  formatNumber: (number: number) => string
  formatCurrency: (amount: number, currency?: string) => string
  formatDate: (date: Date, format?: 'short' | 'medium' | 'long' | 'full') => string
  formatTime: (date: Date, format?: 'short' | 'medium') => string
  formatRelativeTime: (date: Date) => string
  isRTL: boolean
}

const availableLanguages: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    rtl: false
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    rtl: false
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    rtl: false
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    rtl: false
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    rtl: true
  }
]

// Default English translations
const defaultTranslations: TranslationKeys = {
  // Common
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.view': 'View',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.previous': 'Previous',
  'common.submit': 'Submit',
  'common.close': 'Close',
  'common.search': 'Search',
  'common.filter': 'Filter',
  'common.sort': 'Sort',
  'common.export': 'Export',
  'common.import': 'Import',
  'common.download': 'Download',
  'common.upload': 'Upload',
  'common.share': 'Share',
  'common.copy': 'Copy',
  'common.paste': 'Paste',
  'common.cut': 'Cut',
  'common.undo': 'Undo',
  'common.redo': 'Redo',
  'common.select': 'Select',
  'common.selectAll': 'Select All',
  'common.clear': 'Clear',
  'common.reset': 'Reset',
  'common.refresh': 'Refresh',
  'common.retry': 'Retry',
  'common.confirm': 'Confirm',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.ok': 'OK',
  'common.apply': 'Apply',
  'common.discard': 'Discard',

  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.interviews': 'Interviews',
  'nav.analytics': 'Analytics',
  'nav.resume': 'Resume',
  'nav.experts': 'Experts',
  'nav.settings': 'Settings',
  'nav.help': 'Help',
  'nav.logout': 'Logout',

  // Authentication
  'auth.login': 'Login',
  'auth.register': 'Register',
  'auth.logout': 'Logout',
  'auth.forgotPassword': 'Forgot Password',
  'auth.resetPassword': 'Reset Password',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm Password',
  'auth.firstName': 'First Name',
  'auth.lastName': 'Last Name',
  'auth.rememberMe': 'Remember Me',
  'auth.loginSuccess': 'Login successful',
  'auth.loginError': 'Login failed',
  'auth.registerSuccess': 'Registration successful',
  'auth.registerError': 'Registration failed',

  // Dashboard
  'dashboard.welcome': 'Welcome to InterviewSpark',
  'dashboard.recentActivity': 'Recent Activity',
  'dashboard.quickActions': 'Quick Actions',
  'dashboard.statistics': 'Statistics',
  'dashboard.upcomingSessions': 'Upcoming Sessions',

  // Interviews
  'interviews.title': 'Interviews',
  'interviews.create': 'Create Interview',
  'interviews.practice': 'Practice',
  'interviews.history': 'History',
  'interviews.results': 'Results',
  'interviews.feedback': 'Feedback',
  'interviews.score': 'Score',
  'interviews.duration': 'Duration',
  'interviews.questions': 'Questions',
  'interviews.answers': 'Answers',

  // Analytics
  'analytics.title': 'Analytics',
  'analytics.performance': 'Performance',
  'analytics.trends': 'Trends',
  'analytics.insights': 'Insights',
  'analytics.benchmarks': 'Benchmarks',
  'analytics.goals': 'Goals',

  // Resume
  'resume.title': 'Resume',
  'resume.upload': 'Upload Resume',
  'resume.analyze': 'Analyze',
  'resume.optimize': 'Optimize',
  'resume.download': 'Download',
  'resume.atsScore': 'ATS Score',

  // Experts
  'experts.title': 'Expert Coaches',
  'experts.browse': 'Browse Experts',
  'experts.book': 'Book Session',
  'experts.sessions': 'Sessions',
  'experts.reviews': 'Reviews',

  // Settings
  'settings.title': 'Settings',
  'settings.profile': 'Profile',
  'settings.preferences': 'Preferences',
  'settings.accessibility': 'Accessibility',
  'settings.language': 'Language',
  'settings.notifications': 'Notifications',
  'settings.privacy': 'Privacy',
  'settings.security': 'Security',

  // Language
  'language.title': 'Language Settings',
  'language.subtitle': 'Choose your preferred language',
  'language.selectLanguage': 'Select Language',
  'language.currentLanguage': 'Current Language',
  'language.changeLanguage': 'Change Language',
  'language.languageChanged': 'Language changed successfully',
  'language.autoDetect': 'Auto-detect',
  'language.browserLanguage': 'Browser Language',
  'language.systemLanguage': 'System Language',

  // Cultural
  'cultural.title': 'Cultural Interview Styles',
  'cultural.subtitle': 'Learn about interview practices in different cultures',
  'cultural.selectCulture': 'Select Culture',
  'cultural.interviewStyle': 'Interview Style',
  'cultural.characteristics': 'Characteristics',
  'cultural.commonQuestions': 'Common Questions',
  'cultural.etiquette': 'Interview Etiquette',
  'cultural.tips': 'Cultural Tips',
  'cultural.doAndDonts': 'Do\'s and Don\'ts',
  'cultural.preparation': 'Cultural Preparation',
  'cultural.communication': 'Communication Style',
  'cultural.expectations': 'Expectations',
  'cultural.followUp': 'Follow-up Practices',

  // Accessibility
  'accessibility.highContrast': 'High Contrast',
  'accessibility.reducedMotion': 'Reduced Motion',
  'accessibility.largeText': 'Large Text',
  'accessibility.screenReader': 'Screen Reader',
  'accessibility.keyboardNavigation': 'Keyboard Navigation',
  'accessibility.focusIndicators': 'Focus Indicators',
  'accessibility.colorBlindMode': 'Color Blind Mode',
  'accessibility.fontSize': 'Font Size',
  'accessibility.announcements': 'Announcements',

  // Errors
  'error.generic': 'An error occurred',
  'error.network': 'Network error',
  'error.unauthorized': 'Unauthorized',
  'error.forbidden': 'Forbidden',
  'error.notFound': 'Not found',
  'error.serverError': 'Server error',
  'error.validation': 'Validation error',

  // Success messages
  'success.saved': 'Saved successfully',
  'success.deleted': 'Deleted successfully',
  'success.updated': 'Updated successfully',
  'success.created': 'Created successfully',
  'success.uploaded': 'Uploaded successfully',
  'success.downloaded': 'Downloaded successfully'
}

const InternationalizationContext = createContext<InternationalizationContextType | undefined>(undefined)

export function InternationalizationProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(availableLanguages[0])
  const [translations, setTranslations] = useState<Partial<TranslationKeys>>(defaultTranslations)

  // Load saved language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferred-language')
      if (savedLanguage) {
        const language = availableLanguages.find(lang => lang.code === savedLanguage)
        if (language) {
          setCurrentLanguage(language)
          loadTranslations(language.code)
        }
      } else {
        // Detect browser language
        const browserLanguage = navigator.language.split('-')[0]
        const language = availableLanguages.find(lang => lang.code === browserLanguage)
        if (language) {
          setCurrentLanguage(language)
          loadTranslations(language.code)
        }
      }
    }
  }, [])

  // Apply RTL styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = currentLanguage.rtl ? 'rtl' : 'ltr'
      document.documentElement.lang = currentLanguage.code
    }
  }, [currentLanguage])

  const loadTranslations = async (languageCode: string) => {
    try {
      // In a real app, this would load from translation files
      // For now, we'll use the default English translations
      if (languageCode === 'en') {
        setTranslations(defaultTranslations)
      } else {
        // Mock loading other languages
        setTranslations(defaultTranslations) // Would be replaced with actual translations
      }
    } catch (error) {
      console.error('Error loading translations:', error)
      setTranslations(defaultTranslations)
    }
  }

  const changeLanguage = async (languageCode: string) => {
    const language = availableLanguages.find(lang => lang.code === languageCode)
    if (language) {
      setCurrentLanguage(language)
      await loadTranslations(languageCode)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferred-language', languageCode)
      }
    }
  }

  const t = (key: keyof TranslationKeys, params?: Record<string, string | number>): string => {
    let translation = translations[key] || key

    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{{${paramKey}}}`, String(paramValue))
      })
    }

    return translation
  }

  const formatNumber = (number: number): string => {
    return new Intl.NumberFormat(currentLanguage.code).format(number)
  }

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat(currentLanguage.code, {
      style: 'currency',
      currency
    }).format(amount)
  }

  const formatDate = (date: Date, format: 'short' | 'medium' | 'long' | 'full' = 'medium'): string => {
    const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
      short: { dateStyle: 'short' as const },
      medium: { dateStyle: 'medium' as const },
      long: { dateStyle: 'long' as const },
      full: { dateStyle: 'full' as const }
    }

    const options = optionsMap[format]
    return new Intl.DateTimeFormat(currentLanguage.code, options).format(date)
  }

  const formatTime = (date: Date, format: 'short' | 'medium' = 'short'): string => {
    const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
      short: { timeStyle: 'short' as const },
      medium: { timeStyle: 'medium' as const }
    }

    const options = optionsMap[format]
    return new Intl.DateTimeFormat(currentLanguage.code, options).format(date)
  }

  const formatRelativeTime = (date: Date): string => {
    const rtf = new Intl.RelativeTimeFormat(currentLanguage.code, { numeric: 'auto' })
    const diffInSeconds = (date.getTime() - Date.now()) / 1000
    
    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(Math.round(diffInSeconds), 'second')
    } else if (Math.abs(diffInSeconds) < 3600) {
      return rtf.format(Math.round(diffInSeconds / 60), 'minute')
    } else if (Math.abs(diffInSeconds) < 86400) {
      return rtf.format(Math.round(diffInSeconds / 3600), 'hour')
    } else {
      return rtf.format(Math.round(diffInSeconds / 86400), 'day')
    }
  }

  const value: InternationalizationContextType = {
    currentLanguage,
    availableLanguages,
    translations,
    changeLanguage,
    t,
    formatNumber,
    formatCurrency,
    formatDate,
    formatTime,
    formatRelativeTime,
    isRTL: currentLanguage.rtl
  }

  return (
    <InternationalizationContext.Provider value={value}>
      {children}
    </InternationalizationContext.Provider>
  )
}

export function useInternationalization() {
  const context = useContext(InternationalizationContext)
  if (context === undefined) {
    throw new Error('useInternationalization must be used within an InternationalizationProvider')
  }
  return context
}

// Shorthand hook for translations
export function useTranslation() {
  const { t } = useInternationalization()
  return { t }
}
