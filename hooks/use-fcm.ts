"use client"

import { useEffect, useState, useCallback } from "react"
import { getFirebaseMessaging } from "@/lib/firebase"
import { getToken, onMessage } from "firebase/messaging"
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { toast } from "sonner"

export function useFcmToken() {
    const [token, setToken] = useState<string | null>(null)
    const [permission, setPermission] = useState<NotificationPermission>("default")

    useEffect(() => {
        // 1. Initial Permission Check
        if (Capacitor.isNativePlatform()) {
            // Mobile: handled by push plugin checkPermissions() usually called on demand
        } else if (typeof window !== "undefined" && "Notification" in window) {
            setPermission(Notification.permission)
        }
    }, [])

    const requestPermission = useCallback(async () => {
        try {
            // --------------------------------------------
            // MOBILE (CAPACITOR)
            // --------------------------------------------
            if (Capacitor.isNativePlatform()) {
                const permStatus = await PushNotifications.requestPermissions()
                if (permStatus.receive === 'granted') {
                    // Register with Apple / Google to receive push via APNS/FCM
                    await PushNotifications.register()

                    // Listeners are usually set up once at app root, but efficient here too
                    addListeners()
                } else {
                    toast.error("Push notification permission denied")
                }
                return
            }

            // --------------------------------------------
            // WEB (LOCALHOST / HTTPS)
            // --------------------------------------------
            if (typeof window !== "undefined" && "Notification" in window) {
                const permission = await Notification.requestPermission()
                setPermission(permission)

                if (permission === "granted") {
                    const messaging = await getFirebaseMessaging()
                    if (!messaging) {
                        console.warn("FCM Messaging not supported.")
                        return
                    }

                    // Register Service Worker explicitly
                    // This is key for localhost/production consistency
                    let swRegistration
                    try {
                        swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
                    } catch (e) {
                        console.log("SW registration failed, trying ready state", e)
                        swRegistration = await navigator.serviceWorker.ready
                    }

                    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                    if (!vapidKey) {
                        console.warn("Skipping FCM: NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing in .env")
                        return
                    }

                    const currentToken = await getToken(messaging, {
                        vapidKey: vapidKey,
                        serviceWorkerRegistration: swRegistration
                    }).catch(err => {
                        if (err.message.includes("Registration failed - push service error")) {
                            console.warn("FCM Registration Failed: Check your VAPID key or Firebase Billing status.")
                            return null
                        }
                        throw err
                    })

                    if (currentToken) {
                        setToken(currentToken)
                        // Send to backend
                        await saveTokenToBackend(currentToken)
                    } else {
                        console.log("No registration token available. Request permission to generate one.")
                    }

                    // Foreground listener
                    onMessage(messaging, (payload) => {
                        console.log("Message received. ", payload)
                        toast.info(payload.notification?.title || "New Message", {
                            description: payload.notification?.body
                        })
                    })
                }
            }
        } catch (error: any) {
            // Silence specific errors to avoid console noise
            if (error?.code === "messaging/permission-blocked" || error?.name === "AbortError") {
                console.log("Notifications permission blocked or dismissed.")
                return
            }
            console.error("An error occurred while retrieving token: ", error)
        }
    }, [])

    // Mobile Listeners
    const addListeners = async () => {
        await PushNotifications.removeAllListeners()

        // Registration success -> get token
        await PushNotifications.addListener('registration', token => {
            console.log('Push registration success, token: ' + token.value)
            setToken(token.value)
            saveTokenToBackend(token.value)
        })

        await PushNotifications.addListener('registrationError', err => {
            console.error('Registration error: ', err.error)
        })

        await PushNotifications.addListener('pushNotificationReceived', notification => {
            console.log('Push received: ', notification)
            toast.info(notification.title || "New Message", {
                description: notification.body
            })
        })
    }

    const saveTokenToBackend = async (token: string) => {
        try {
            await fetch("/api/fcm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token })
            })
            console.log("Token saved to backend")
        } catch (err) {
            console.error("Failed to save token", err)
        }
    }

    return { fcmToken: token, requestPermission, permission }
}
