"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
    useEffect(() => {
        const disableServiceWorker = async () => {
            if (typeof window !== "undefined" && "serviceWorker" in navigator) {
                try {
                    // 1. Unregister all service workers
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                        console.log("🗑️ Service Worker unregistered");
                    }

                    // 2. Clear all caches
                    if ("caches" in window) {
                        const cacheNames = await caches.keys();
                        for (const cacheName of cacheNames) {
                            await caches.delete(cacheName);
                            console.log("🧹 Cache cleared:", cacheName);
                        }
                    }

                    // 3. Optional: Reload once if we just cleared things
                    // if (registrations.length > 0) window.location.reload();

                } catch (error) {
                    console.error("❌ Error disabling Service Worker:", error);
                }
            }
        };

        disableServiceWorker();
    }, []);

    return null
}
