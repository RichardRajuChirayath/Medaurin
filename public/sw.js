// Service Worker for MixSafe
// Handles: Push notifications, offline caching, background sync

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDFfdpSAJwmp7_FNKGhnHGucKQHkiyiBVk",
    authDomain: "expensetracker-dc734.firebaseapp.com",
    projectId: "expensetracker-dc734",
    storageBucket: "expensetracker-dc734.firebasestorage.app",
    messagingSenderId: "633688564128",
    appId: "1:633688564128:web:d97c9cfe2ad4c62aae44c5",
    measurementId: "G-4BCR6G3B9C"
};

try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log('[SW] Received background message ', payload);
        const notificationTitle = payload.notification?.title || 'MixSafe Reminder';
        const notificationOptions = {
            body: payload.notification?.body || 'Check your medications',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: payload.notification?.tag || 'medication-reminder'
        };

        return self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (e) {
    console.error('[SW] Firebase init failed', e);
}

const CACHE_NAME = 'mixsafe-v1'
const urlsToCache = [
    '/',
    '/medications',
    '/profile',
    '/offline.html'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...')
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell')
                return cache.addAll(urlsToCache)
            })
            .catch((err) => console.log('[SW] Cache failed:', err))
    )
    self.skipWaiting()
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...')
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName)
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
    self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) return response;

                const fetchRequest = event.request.clone();
                return fetch(fetchRequest).then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                });
            })
            .catch(() => {
                // Fallback to offline page if available (ignoring for now to prevent 404 loops in dev)
                return null;
            })
    );
});

// Notification click event handles opening the app
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event)
    event.notification.close()

    const urlToOpen = event.notification.data?.url || '/medications'

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i]
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus()
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen)
                }
            })
    )
})
