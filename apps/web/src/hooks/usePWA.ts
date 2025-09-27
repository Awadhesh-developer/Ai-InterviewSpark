import { useState, useEffect, useCallback } from 'react'

export interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  isUpdateAvailable: boolean
  isLoading: boolean
  installPrompt: BeforeInstallPromptEvent | null
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isUpdateAvailable: false,
    isLoading: true,
    installPrompt: null
  })

  // Check if app is installed
  const checkInstallStatus = useCallback(() => {
    if (typeof window !== 'undefined') {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         window.matchMedia('(display-mode: fullscreen)').matches ||
                         (window.navigator as any).standalone === true

      setState(prev => ({ ...prev, isInstalled }))
    }
  }, [])

  // Handle install prompt
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const installEvent = e as BeforeInstallPromptEvent
      
      setState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: installEvent
      }))
    }

    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null
      }))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Handle online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }))
    }

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Service Worker registration and updates
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setState(prev => ({ ...prev, isLoading: false }))
      return
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, isUpdateAvailable: true }))
              }
            })
          }
        })

        // Handle controller change (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })

        setState(prev => ({ ...prev, isLoading: false }))
      } catch (error) {
        console.error('Service Worker registration failed:', error)
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    registerServiceWorker()
    checkInstallStatus()
  }, [checkInstallStatus])

  // Install app
  const installApp = useCallback(async () => {
    if (!state.installPrompt) return false

    try {
      await state.installPrompt.prompt()
      const choiceResult = await state.installPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        setState(prev => ({
          ...prev,
          isInstallable: false,
          installPrompt: null
        }))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error installing app:', error)
      return false
    }
  }, [state.installPrompt])

  // Update app
  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
    }
  }, [])

  // Share content
  const shareContent = useCallback(async (data: ShareData) => {
    if (navigator.share) {
      try {
        await navigator.share(data)
        return true
      } catch (error) {
        console.error('Error sharing:', error)
        return false
      }
    }
    
    // Fallback to clipboard
    if (navigator.clipboard && data.url) {
      try {
        await navigator.clipboard.writeText(data.url)
        return true
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        return false
      }
    }
    
    return false
  }, [])

  return {
    ...state,
    installApp,
    updateApp,
    shareContent,
    checkInstallStatus
  }
}

// Hook for push notifications
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [isSupported])

  const subscribe = useCallback(async (vapidPublicKey: string) => {
    if (!isSupported || permission !== 'granted') return null

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      })
      
      setSubscription(subscription)
      return subscription
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return null
    }
  }, [isSupported, permission])

  const unsubscribe = useCallback(async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe()
        setSubscription(null)
        return true
      } catch (error) {
        console.error('Error unsubscribing from push notifications:', error)
        return false
      }
    }
    return false
  }, [subscription])

  return {
    permission,
    subscription,
    isSupported,
    requestPermission,
    subscribe,
    unsubscribe
  }
}

// Hook for background sync
export function useBackgroundSync() {
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype)
    }
  }, [])

  const registerSync = useCallback(async (tag: string) => {
    if (!isSupported) return false

    try {
      const registration = await navigator.serviceWorker.ready
      // Check if background sync is supported
      if ('sync' in registration) {
        await (registration as any).sync.register(tag)
        return true
      }
      return false
    } catch (error) {
      console.error('Error registering background sync:', error)
      return false
    }
  }, [isSupported])

  return {
    isSupported,
    registerSync
  }
}

// Hook for offline storage
export function useOfflineStorage() {
  const [isSupported, setIsSupported] = useState(false)
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('storage' in navigator && 'estimate' in navigator.storage)
      
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(setStorageEstimate)
      }
    }
  }, [])

  const requestPersistentStorage = useCallback(async () => {
    if (!isSupported || !navigator.storage.persist) return false

    try {
      const granted = await navigator.storage.persist()
      return granted
    } catch (error) {
      console.error('Error requesting persistent storage:', error)
      return false
    }
  }, [isSupported])

  const getStorageEstimate = useCallback(async () => {
    if (!isSupported || !navigator.storage.estimate) return null

    try {
      const estimate = await navigator.storage.estimate()
      setStorageEstimate(estimate)
      return estimate
    } catch (error) {
      console.error('Error getting storage estimate:', error)
      return null
    }
  }, [isSupported])

  return {
    isSupported,
    storageEstimate,
    requestPersistentStorage,
    getStorageEstimate
  }
}

// Hook for app shortcuts
export function useAppShortcuts() {
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('getInstalledRelatedApps' in navigator)
    }
  }, [])

  const getInstalledApps = useCallback(async () => {
    if (!isSupported) return []

    try {
      const apps = await (navigator as any).getInstalledRelatedApps()
      return apps
    } catch (error) {
      console.error('Error getting installed apps:', error)
      return []
    }
  }, [isSupported])

  return {
    isSupported,
    getInstalledApps
  }
}
