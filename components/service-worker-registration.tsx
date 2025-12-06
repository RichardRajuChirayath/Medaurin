"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            "serviceWorker" in navigator &&
            process.env.NODE_ENV === "production"
        ) {
            // Register service worker
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("✅ Service Worker registered:", registration.scope)

                    // Check for updates
                    registration.update()

                    // Listen for updates
                    registration.addEventListener("updatefound", () => {
                        const newWorker = registration.installing
                        console.log("🔄 Service Worker update found!")

                        newWorker?.addEventListener("statechange", () => {
                            if (newWorker.state === "activated") {
                                console.log("✅ Service Worker updated!")
                                // Optionally reload the page
                                // window.location.reload()
                            }
                        })
                    })
                })
                .catch((error) => {
                    console.error("❌ Service Worker registration failed:", error)
                })
        } else if (typeof window !== "undefined") {
            console.log("ℹ️ Service Workers are only registered in production")
        }
    }, [])

    return null
}
