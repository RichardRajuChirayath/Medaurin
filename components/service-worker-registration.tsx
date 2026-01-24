"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
    useEffect(() => {
        const registerServiceWorker = async () => {
            if (typeof window !== "undefined" && "serviceWorker" in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js', {
                        scope: '/',
                        updateViaCache: 'none'
                    });

                    console.log("🚀 Medaurin Service Worker registered with scope:", registration.scope);

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log("✨ New content available! Please refresh.");
                                }
                            });
                        }
                    });

                } catch (error) {
                    console.error("❌ Service Worker registration failed:", error);
                }
            }
        };

        registerServiceWorker();
    }, []);

    return null
}
