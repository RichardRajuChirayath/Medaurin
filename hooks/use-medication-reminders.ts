"use client"

import { useEffect } from "react"
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import { toast } from "sonner"

interface Medication {
    id: string
    medicineName: string
    reminderTimes: string[]
    reminderEnabled: boolean
    startDate: string
    endDate?: string | null
}

export function useMedicationReminders() {

    // 1. Load medications from API
    const syncReminders = async () => {
        try {
            const res = await fetch("/api/medications")
            if (!res.ok) return

            const medications: Medication[] = await res.json()

            if (Capacitor.isNativePlatform()) {
                await scheduleMobileNotifications(medications)
            } else {
                scheduleWebNotifications(medications)
            }
        } catch (error) {
            console.error("Failed to sync reminders", error)
        }
    }

    // 2. Mobile Logic (Local Notifications)
    const scheduleMobileNotifications = async (medications: Medication[]) => {
        // Request permissions first
        const perm = await LocalNotifications.requestPermissions()
        if (perm.display !== 'granted') return

        // Clear existing to avoid dupes
        // Note: In a real app, you might want to manage IDs more carefully
        const pending = await LocalNotifications.getPending()
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel(pending)
        }

        const notifications = []
        let idCounter = 1

        for (const med of medications) {
            if (!med.reminderEnabled || !med.reminderTimes) continue

            for (const time of med.reminderTimes) {
                const [hours, minutes] = time.split(":").map(Number)

                notifications.push({
                    id: idCounter++,
                    title: `Time to take ${med.medicineName}`,
                    body: `It's ${time}. Stay healthy!`,
                    schedule: {
                        on: { hour: hours, minute: minutes },
                        allowWhileIdle: true
                    },
                    sound: "beep.wav",
                    attachments: [],
                    actionTypeId: "",
                    extra: null
                })
            }
        }

        if (notifications.length > 0) {
            await LocalNotifications.schedule({ notifications })
            console.log(`Scheduled ${notifications.length} notifications on mobile`)
        }
    }

    // 3. Web Logic (Browser Notifications + Timeout)
    const scheduleWebNotifications = (medications: Medication[]) => {
        if (typeof window === "undefined") return
        if (!("Notification" in window)) return

        if (Notification.permission !== "granted") {
            Notification.requestPermission()
        }

        // Clear existing timeouts if you store them in a ref (omitted for brevity, running basic check)

        // Simple daily scheduler for active tab
        medications.forEach(med => {
            if (!med.reminderEnabled || !med.reminderTimes) return

            med.reminderTimes.forEach(time => {
                const [targetHour, targetMinute] = time.split(":").map(Number)
                const now = new Date()
                const target = new Date()
                target.setHours(targetHour, targetMinute, 0, 0)

                if (target <= now) {
                    target.setDate(target.getDate() + 1) // Schedule for tomorrow if passed
                }

                const delay = target.getTime() - now.getTime()

                // Schedule timeout
                setTimeout(() => {
                    new Notification(`Time to take ${med.medicineName}`, {
                        body: `It's ${time}. Stay healthy!`,
                        icon: "/icon.png"
                    })
                    // Play sound
                    const audio = new Audio("/notification.mp3") // Ensure this exists or remove
                    audio.play().catch(e => console.log("Audio play failed", e))

                    toast.info(`Time to take ${med.medicineName}!`)

                }, delay)
            })
        })
    }

    // Auto-sync on mount
    useEffect(() => {
        syncReminders()

        // Optional: Re-sync every hour or on window focus
        const interval = setInterval(syncReminders, 60 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    return { syncReminders }
}
