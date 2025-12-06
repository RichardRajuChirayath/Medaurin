"use client"

import { useEffect, useState } from "react"
import { getFirebaseMessaging } from "@/lib/firebase"
import { getToken, onMessage } from "firebase/messaging"

interface NotificationOptions {
    title: string
    body: string
    icon?: string
    tag?: string
    onClick?: () => void
}

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>("default")
    const [isSupported, setIsSupported] = useState(false)
    const [fcmToken, setFcmToken] = useState<string | null>(null)

    useEffect(() => {
        // Check if notifications are supported
        setIsSupported("Notification" in window)

        if ("Notification" in window) {
            setPermission(Notification.permission)
        }
    }, [])

    // Listen for foreground messages
    useEffect(() => {
        const setupMessaging = async () => {
            const messaging = await getFirebaseMessaging()
            if (!messaging) return

            onMessage(messaging, (payload) => {
                console.log("Foreground message received:", payload)
                if (payload.notification) {
                    const { title, body } = payload.notification
                    new Notification(title || "MixSafe Reminder", {
                        body,
                        icon: "/icon.png"
                    })
                }
            })
        }

        setupMessaging()
    }, [])

    const requestPermission = async () => {
        if (!isSupported) {
            console.log("Notifications not supported")
            return false
        }

        try {
            const result = await Notification.requestPermission()
            setPermission(result)

            if (result === "granted") {
                // Get FCM Token
                const messaging = await getFirebaseMessaging()
                if (messaging) {
                    try {
                        // Get the SW registration to use
                        let swRegistration = await navigator.serviceWorker.getRegistration('/sw.js');
                        if (!swRegistration) {
                            swRegistration = await navigator.serviceWorker.ready;
                        }

                        const token = await getToken(messaging, {
                            vapidKey: "BKu_WbwUp9dNeUVywa50gOvbBLIsdWqY6EyRQt_wyNtcqy-Q917KLnZfknSYLenOX9X8sPoTCGtVp0Jnss2wwwg",
                            serviceWorkerRegistration: swRegistration
                        })
                        if (token) {
                            console.log("FCM Token:", token)
                            setFcmToken(token)
                        }
                    } catch (err) {
                        console.error("Error getting FCM token:", err)
                    }
                }
            }

            return result === "granted"
        } catch (error) {
            console.error("Error requesting notification permission:", error)
            return false
        }
    }

    const sendNotification = (options: NotificationOptions) => {
        if (!isSupported || permission !== "granted") return null

        try {
            const notification = new Notification(options.title, {
                body: options.body,
                icon: options.icon || "/icon.png",
                tag: options.tag,
                badge: "/icon.png",
                requireInteraction: true,
            })

            if (options.onClick) {
                notification.onclick = () => {
                    options.onClick?.()
                    notification.close()
                    window.focus()
                }
            }
            return notification
        } catch (error) {
            console.error("Error sending notification:", error)
            return null
        }
    }

    const scheduleNotification = (time: string, options: NotificationOptions) => {
        const [hours, minutes] = time.split(":").map(Number)
        const now = new Date()
        const scheduledTime = new Date()
        scheduledTime.setHours(hours, minutes, 0, 0)
        if (scheduledTime <= now) scheduledTime.setDate(scheduledTime.getDate() + 1)

        const delay = scheduledTime.getTime() - now.getTime()

        console.log(`Scheduling client-side notification for ${time}`)

        const timeoutId = setTimeout(() => {
            sendNotification(options)
        }, delay)

        return timeoutId
    }

    const scheduleMultipleNotifications = (
        times: string[],
        getOptions: (time: string) => NotificationOptions
    ) => {
        const timeoutIds: NodeJS.Timeout[] = []
        times.forEach((time) => {
            const timeoutId = scheduleNotification(time, getOptions(time))
            if (timeoutId) timeoutIds.push(timeoutId)
        })
        return () => timeoutIds.forEach((id) => clearTimeout(id))
    }

    return {
        permission,
        isSupported,
        requestPermission,
        fcmToken,
        sendNotification,
        scheduleNotification,
        scheduleMultipleNotifications,
    }
}
