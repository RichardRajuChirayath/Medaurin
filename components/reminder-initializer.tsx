"use client"

import { useMedicationReminders } from "@/hooks/use-medication-reminders"
import { useFcmToken } from "@/hooks/use-fcm"
import { useEffect, useState } from "react"
import { Bell, Volume2, VolumeX } from "lucide-react"

type NotificationMode = "standard" | "alarm"

export function ReminderInitializer() {
    const { syncReminders } = useMedicationReminders()
    const { requestPermission } = useFcmToken()
    const [notificationMode, setNotificationMode] = useState<NotificationMode>("standard")
    const [alarmSound, setAlarmSound] = useState<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)

    useEffect(() => {
        // Load notification mode from localStorage
        const savedMode = localStorage.getItem("notificationMode") as NotificationMode
        if (savedMode) {
            setNotificationMode(savedMode)
        }

        // Sync reminders (non-blocking, with error handling)
        syncReminders().catch(err => {
            console.log("Reminder sync failed (user may not be logged in):", err)
        })

        // Request FCM permission if already granted
        if (typeof window !== "undefined" && Notification.permission === "granted") {
            requestPermission().catch(err => {
                console.log("FCM permission request failed:", err)
            })
        }

        // Initialize alarm sound
        if (typeof window !== "undefined" && window.Audio) {
            // Using a data URI for a simple beep sound to avoid external dependencies
            const audio = new Audio()
            // Simple alarm tone (440Hz beep)
            audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLPfTQGHm238eGVRAwQU6bh8rVhGgg2jdf0yHYsBSF0yPDdi0ILElyx6OynVBELRp/h88BtJAUpgM/z0H84BxxpvO/inkkNDlOm4PKzYRkHNo/Y88p3KwUhdsrw3YtDCxFYr+fqpVIQC0Wc4fPBbiMGKoDO89CCOQccab3v4p1JDgyAg4N+cWxscHh5eHJub3p5dHFvcG5ucW9ubnduba2sraysqKukq6ypq6ynoqaopKGkoaGZn52amJiXlpWUk5KSkZCRkI+Pj4+PjpCPjo+PjpCPjo+PjpCPjo+PjpCPjo+PjpCPjo+PjpCPj5CQkJCQkZGRkZGSk5OUlJSVlpWWl5eYmJiZmZqanJubnJ2cm56eq6yrrK2sraipqaqoqKgAAAA="
            audio.loop = true
            setAlarmSound(audio)
        }
    }, []) // Empty deps - only run once on mount!

    // Handle notification mode change
    const toggleNotificationMode = () => {
        const newMode = notificationMode === "standard" ? "alarm" : "standard"
        setNotificationMode(newMode)
        localStorage.setItem("notificationMode", newMode)

        // Stop alarm if switching away from alarm mode
        if (newMode === "standard" && alarmSound) {
            alarmSound.pause()
            alarmSound.currentTime = 0
            setIsPlaying(false)
        }
    }

    // Test alarm sound
    const testAlarm = () => {
        if (!alarmSound) return

        if (isPlaying) {
            alarmSound.pause()
            alarmSound.currentTime = 0
            setIsPlaying(false)
        } else {
            alarmSound.play().catch(err => {
                console.error("Failed to play alarm:", err)
            })
            setIsPlaying(true)

            // Auto-stop after 5 seconds for testing
            setTimeout(() => {
                if (alarmSound) {
                    alarmSound.pause()
                    alarmSound.currentTime = 0
                    setIsPlaying(false)
                }
            }, 5000)
        }
    }

    // Setup service worker message listener for alarms
    useEffect(() => {
        if (notificationMode !== "alarm" || typeof navigator === "undefined" || !navigator.serviceWorker) {
            return
        }

        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === "ALARM_NOTIFICATION" && alarmSound) {
                // Play alarm when notification fires
                alarmSound.play().catch(err => {
                    console.error("Failed to play alarm from service worker:", err)
                })
                setIsPlaying(true)

                // Stop after 30 seconds or when user interacts
                const timeout = setTimeout(() => {
                    alarmSound.pause()
                    alarmSound.currentTime = 0
                    setIsPlaying(false)
                }, 30000)

                // Listen for user interaction to stop alarm
                const stopAlarm = () => {
                    clearTimeout(timeout)
                    if (alarmSound) {
                        alarmSound.pause()
                        alarmSound.currentTime = 0
                        setIsPlaying(false)
                    }
                    document.removeEventListener("click", stopAlarm)
                    document.removeEventListener("keydown", stopAlarm)
                }

                document.addEventListener("click", stopAlarm)
                document.addEventListener("keydown", stopAlarm)
            }
        }

        navigator.serviceWorker.addEventListener("message", handleMessage)

        return () => {
            navigator.serviceWorker.removeEventListener("message", handleMessage)
        }
    }, [notificationMode, alarmSound])

    // Store notification mode globally for other components to access
    useEffect(() => {
        if (typeof window !== "undefined") {
            (window as any).__notificationMode = notificationMode
        }
    }, [notificationMode])

    // Return null to hide UI while keeping background logic active
    return null
}
