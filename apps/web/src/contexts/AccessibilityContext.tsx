'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface AccessibilitySettings {
  highContrast: boolean
  reducedMotion: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  focusIndicators: boolean
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  announcements: boolean
}

export interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void
  resetSettings: () => void
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void
  isKeyboardUser: boolean
  setKeyboardUser: (isKeyboard: boolean) => void
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  screenReader: false,
  keyboardNavigation: true,
  focusIndicators: true,
  colorBlindMode: 'none',
  fontSize: 'medium',
  announcements: true
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [isKeyboardUser, setIsKeyboardUser] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('accessibility-settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          setSettings({ ...defaultSettings, ...parsed })
        } catch (error) {
          console.error('Error parsing accessibility settings:', error)
        }
      }

      // Detect system preferences
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
      
      if (prefersReducedMotion || prefersHighContrast) {
        setSettings(prev => ({
          ...prev,
          reducedMotion: prefersReducedMotion,
          highContrast: prefersHighContrast
        }))
      }
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessibility-settings', JSON.stringify(settings))
    }
  }, [settings])

  // Apply CSS classes based on settings
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      
      // High contrast mode
      root.classList.toggle('high-contrast', settings.highContrast)
      
      // Reduced motion
      root.classList.toggle('reduced-motion', settings.reducedMotion)
      
      // Large text
      root.classList.toggle('large-text', settings.largeText)
      
      // Font size
      root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large')
      root.classList.add(`font-${settings.fontSize}`)
      
      // Color blind mode
      root.classList.remove('protanopia', 'deuteranopia', 'tritanopia')
      if (settings.colorBlindMode !== 'none') {
        root.classList.add(settings.colorBlindMode)
      }
      
      // Focus indicators
      root.classList.toggle('enhanced-focus', settings.focusIndicators)
    }
  }, [settings])

  // Keyboard navigation detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          setIsKeyboardUser(true)
        }
      }

      const handleMouseDown = () => {
        setIsKeyboardUser(false)
      }

      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('mousedown', handleMouseDown)

      return () => {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('mousedown', handleMouseDown)
      }
    }
  }, [])

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.announcements) return

    if (typeof document !== 'undefined') {
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', priority)
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = message

      document.body.appendChild(announcement)

      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)
    }
  }

  const setKeyboardUser = (isKeyboard: boolean) => {
    setIsKeyboardUser(isKeyboard)
  }

  const value: AccessibilityContextType = {
    settings,
    updateSetting,
    resetSettings,
    announceToScreenReader,
    isKeyboardUser,
    setKeyboardUser
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

// Hook for screen reader announcements
export function useScreenReader() {
  const { announceToScreenReader, settings } = useAccessibility()

  const announce = (message: string, priority?: 'polite' | 'assertive') => {
    if (settings.screenReader || settings.announcements) {
      announceToScreenReader(message, priority)
    }
  }

  return { announce }
}

// Hook for keyboard navigation
export function useKeyboardNavigation() {
  const { isKeyboardUser, settings } = useAccessibility()

  const isKeyboardNavigationEnabled = settings.keyboardNavigation && isKeyboardUser

  return {
    isKeyboardUser,
    isKeyboardNavigationEnabled,
    shouldShowFocusIndicators: settings.focusIndicators && isKeyboardUser
  }
}

// Hook for focus management
export function useFocusManagement() {
  const trapFocus = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }

  const restoreFocus = (previousElement: HTMLElement | null) => {
    if (previousElement) {
      previousElement.focus()
    }
  }

  return { trapFocus, restoreFocus }
}

// Hook for ARIA live regions
export function useAriaLive() {
  const { announceToScreenReader } = useAccessibility()

  const announceStatus = (message: string) => {
    announceToScreenReader(message, 'polite')
  }

  const announceAlert = (message: string) => {
    announceToScreenReader(message, 'assertive')
  }

  return { announceStatus, announceAlert }
}
