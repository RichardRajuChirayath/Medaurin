import { NextResponse } from 'next/server';

export async function GET() {
    const config = `
// Medaurin Unified Service Worker
// Handles: Offline Caching + Firebase Push Notifications

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
    authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
    projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
    storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}",
    messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}",
    appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}",
    measurementId: "${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}"
};

// 1. Initialize Firebase Background Messaging
try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log('[SW] Received background message ', payload);
        const notificationTitle = payload.notification?.title || 'Medaurin Reminder';
        const notificationOptions = {
            body: payload.notification?.body || 'Time for your scheduled dose.',
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'medication-reminder',
            data: payload.data
        };

        return self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (e) {
    console.error('[SW] Firebase background init failed', e);
}

// 2. Offline Caching & PWA Logic
const CACHE_NAME = 'medaurin-pwa-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/medications',
    '/profile',
    '/logo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            }).catch(() => {
                // If offline and request fails, we can either return a cached asset or null
                return caches.match('/');
            });
        })
    );
});

// 3. Notification Interactions
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/medications';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
`;

    return new NextResponse(config, {
        headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
}
