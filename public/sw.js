// Service Worker for PWA
const CACHE_NAME = 'maisonjoie-v1' // Bumped version to force update (rebrand)
const OFFLINE_URL = '/offline'

const STATIC_ASSETS = [
    '/',
    '/offline',
    '/shop',
    '/bundles',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS)
        })
    )
    self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        })
    )
    self.clients.claim()
})

// Fetch event - Network First Strategy
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and chrome extensions
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // If network works, cache it and return
                if (response.status === 200) {
                    const responseClone = response.clone()
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone)
                    })
                }
                return response
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse
                    }
                    // Return offline page for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL)
                    }
                })
            })
    )
})
