// Service Worker for InterviewSpark PWA
const CACHE_NAME = 'interviewspark-v1.0.0'
const STATIC_CACHE = 'interviewspark-static-v1.0.0'
const DYNAMIC_CACHE = 'interviewspark-dynamic-v1.0.0'
const API_CACHE = 'interviewspark-api-v1.0.0'

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/interviews',
  '/dashboard/analytics',
  '/dashboard/resume',
  '/dashboard/experts',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other critical assets
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth/me',
  '/api/interviews/sessions',
  '/api/analytics',
  '/api/resume',
  '/api/experts'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with Cache Fallback
    event.respondWith(handleApiRequest(request))
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - Cache First
    event.respondWith(handleStaticAssets(request))
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    // Other static files - Cache First
    event.respondWith(handleStaticAssets(request))
  } else {
    // HTML pages - Stale While Revalidate
    event.respondWith(handlePageRequest(request))
  }
})

// Handle API requests - Network First with Cache Fallback
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for', request.url)
    
    // Fallback to cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for API failures
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are currently offline. Please check your connection.' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle static assets - Cache First
async function handleStaticAssets(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset', request.url)
    return new Response('Asset not available offline', { status: 404 })
  }
}

// Handle page requests - Stale While Revalidate
async function handlePageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone())
        }
      })
      .catch(() => {
        // Network failed, but we have cache
      })
    
    return cachedResponse
  }
  
  // No cache, try network
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Return offline page
    return getOfflinePage()
  }
}

// Get offline page
function getOfflinePage() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - InterviewSpark</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        .offline-container {
          max-width: 400px;
        }
        .offline-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        .offline-title {
          font-size: 2rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        .offline-message {
          font-size: 1.1rem;
          margin-bottom: 2rem;
          opacity: 0.9;
          line-height: 1.5;
        }
        .retry-button {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .retry-button:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }
        .features-list {
          margin-top: 2rem;
          text-align: left;
        }
        .features-list h3 {
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }
        .features-list ul {
          list-style: none;
          padding: 0;
        }
        .features-list li {
          margin-bottom: 0.5rem;
          opacity: 0.8;
        }
        .features-list li::before {
          content: "✓ ";
          color: #4ade80;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📡</div>
        <h1 class="offline-title">You're Offline</h1>
        <p class="offline-message">
          No internet connection detected. Some features may be limited, but you can still access cached content.
        </p>
        <button class="retry-button" onclick="window.location.reload()">
          Try Again
        </button>
        
        <div class="features-list">
          <h3>Available Offline:</h3>
          <ul>
            <li>View cached interview sessions</li>
            <li>Review previous analytics</li>
            <li>Access saved resume data</li>
            <li>Browse expert profiles</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'interview-data-sync') {
    event.waitUntil(syncInterviewData())
  } else if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalyticsData())
  }
})

// Sync interview data when back online
async function syncInterviewData() {
  try {
    // Get pending interview data from IndexedDB
    const pendingData = await getPendingInterviewData()
    
    for (const data of pendingData) {
      try {
        await fetch('/api/interviews/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        // Remove from pending queue
        await removePendingInterviewData(data.id)
      } catch (error) {
        console.error('Failed to sync interview data:', error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Sync analytics data when back online
async function syncAnalyticsData() {
  try {
    // Implementation for syncing analytics data
    console.log('Syncing analytics data...')
  } catch (error) {
    console.error('Analytics sync failed:', error)
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: 'You have a new interview session scheduled!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/dashboard/interviews'
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ]
  }
  
  if (event.data) {
    const data = event.data.json()
    options.body = data.body || options.body
    options.data = { ...options.data, ...data }
  }
  
  event.waitUntil(
    self.registration.showNotification('InterviewSpark', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  const action = event.action
  const data = event.notification.data
  
  if (action === 'view' || !action) {
    event.waitUntil(
      clients.openWindow(data.url || '/dashboard')
    )
  }
  // 'dismiss' action just closes the notification
})

// Placeholder functions for IndexedDB operations
async function getPendingInterviewData() {
  // Implementation would use IndexedDB to get pending data
  return []
}

async function removePendingInterviewData(id) {
  // Implementation would remove data from IndexedDB
  console.log('Removing pending data:', id)
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
