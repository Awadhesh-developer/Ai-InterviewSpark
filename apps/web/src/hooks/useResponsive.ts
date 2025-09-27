import { useState, useEffect } from 'react'

export interface BreakpointConfig {
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

export interface ResponsiveState {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLargeDesktop: boolean
  breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  orientation: 'portrait' | 'landscape'
  isTouch: boolean
  pixelRatio: number
}

const defaultBreakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export function useResponsive(breakpoints: BreakpointConfig = defaultBreakpoints) {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        breakpoint: 'lg' as const,
        orientation: 'landscape' as const,
        isTouch: false,
        pixelRatio: 1
      }
    }

    return calculateResponsiveState(window.innerWidth, window.innerHeight, breakpoints)
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setState(calculateResponsiveState(window.innerWidth, window.innerHeight, breakpoints))
    }

    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated after orientation change
      setTimeout(() => {
        setState(calculateResponsiveState(window.innerWidth, window.innerHeight, breakpoints))
      }, 100)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    // Initial calculation
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [breakpoints])

  return state
}

function calculateResponsiveState(
  width: number, 
  height: number, 
  breakpoints: BreakpointConfig
): ResponsiveState {
  const isMobile = width < breakpoints.md
  const isTablet = width >= breakpoints.md && width < breakpoints.lg
  const isDesktop = width >= breakpoints.lg && width < breakpoints.xl
  const isLargeDesktop = width >= breakpoints.xl

  let breakpoint: ResponsiveState['breakpoint'] = 'sm'
  if (width >= breakpoints['2xl']) breakpoint = '2xl'
  else if (width >= breakpoints.xl) breakpoint = 'xl'
  else if (width >= breakpoints.lg) breakpoint = 'lg'
  else if (width >= breakpoints.md) breakpoint = 'md'

  const orientation = width > height ? 'landscape' : 'portrait'
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    breakpoint,
    orientation,
    isTouch,
    pixelRatio
  }
}

// Hook for specific breakpoint checks
export function useBreakpoint(breakpoint: keyof BreakpointConfig, breakpoints?: BreakpointConfig) {
  const { width } = useResponsive(breakpoints)
  const bp = breakpoints || defaultBreakpoints
  
  return width >= bp[breakpoint]
}

// Hook for media queries
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

// Hook for device detection
export function useDeviceDetection() {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isEdge: false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userAgent = navigator.userAgent.toLowerCase()
    const platform = navigator.platform.toLowerCase()

    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent)
    const isDesktop = !isMobile && !isTablet

    const isIOS = /iphone|ipad|ipod/i.test(userAgent)
    const isAndroid = /android/i.test(userAgent)

    const isSafari = /safari/i.test(userAgent) && !/chrome/i.test(userAgent)
    const isChrome = /chrome/i.test(userAgent) && !/edge/i.test(userAgent)
    const isFirefox = /firefox/i.test(userAgent)
    const isEdge = /edge/i.test(userAgent)

    setDevice({
      isMobile,
      isTablet,
      isDesktop,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      isFirefox,
      isEdge
    })
  }, [])

  return device
}

// Hook for viewport dimensions
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setViewport(prev => ({
        ...prev,
        width: window.innerWidth,
        height: window.innerHeight
      }))
    }

    const handleScroll = () => {
      setViewport(prev => ({
        ...prev,
        scrollY: window.scrollY
      }))
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return viewport
}

// Hook for safe area insets (for mobile devices with notches)
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement)
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0')
      })
    }

    updateSafeArea()
    window.addEventListener('resize', updateSafeArea)
    window.addEventListener('orientationchange', updateSafeArea)

    return () => {
      window.removeEventListener('resize', updateSafeArea)
      window.removeEventListener('orientationchange', updateSafeArea)
    }
  }, [])

  return safeArea
}

// Utility function to get responsive classes
export function getResponsiveClasses(
  classes: {
    base?: string
    sm?: string
    md?: string
    lg?: string
    xl?: string
    '2xl'?: string
  },
  responsive: ResponsiveState
): string {
  const { breakpoint } = responsive
  
  let result = classes.base || ''
  
  if (classes.sm && ['sm', 'md', 'lg', 'xl', '2xl'].includes(breakpoint)) {
    result += ` ${classes.sm}`
  }
  if (classes.md && ['md', 'lg', 'xl', '2xl'].includes(breakpoint)) {
    result += ` ${classes.md}`
  }
  if (classes.lg && ['lg', 'xl', '2xl'].includes(breakpoint)) {
    result += ` ${classes.lg}`
  }
  if (classes.xl && ['xl', '2xl'].includes(breakpoint)) {
    result += ` ${classes.xl}`
  }
  if (classes['2xl'] && breakpoint === '2xl') {
    result += ` ${classes['2xl']}`
  }
  
  return result.trim()
}
