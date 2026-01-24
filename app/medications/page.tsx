"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Pill, Plus, Clock, Calendar, CheckCircle2, AlertCircle, TrendingUp, Bell, ChevronLeft, BellOff } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { WeatherHealthShield } from "@/components/weather-health-shield"
import { toast } from "sonner"


interface Medication {
    id: string
    medicineName: string
    dosage: string
    frequency: string
    reminderTimes: string[]
    reminderEnabled: boolean
    startDate: string
    endDate?: string
    notes?: string
    createdAt: string
}

interface DosageLog {
    id: string
    medicationId: string
    takenAt: string
    scheduledTime: string
    status: "taken" | "missed" | "skipped"
}

export default function MedicationsPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const { permission, requestPermission, scheduleMultipleNotifications } = useNotifications()

    const [medications, setMedications] = useState<Medication[]>([])
    const [dosageLogs, setDosageLogs] = useState<DosageLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [todaySchedule, setTodaySchedule] = useState<any[]>([])

    useEffect(() => {
        if (!loading && !user) {
            router.push("/")
            return
        }

        if (user) {
            fetchMedications()
            fetchDosageLogs()
        }
    }, [user, loading, router])

    // Setup notifications when medications change
    useEffect(() => {
        if (medications.length === 0 || permission !== "granted") return

        const allReminderTimes: string[] = []
        const reminderMap: Record<string, { med: Medication; time: string }> = {}

        medications.forEach(med => {
            if (med.reminderEnabled && med.reminderTimes) {
                med.reminderTimes.forEach(time => {
                    allReminderTimes.push(time)
                    reminderMap[time] = { med, time }
                })
            }
        })

        const cleanup = scheduleMultipleNotifications(allReminderTimes, (time) => ({
            title: `💊 Time to take your medicine!`,
            body: reminderMap[time]
                ? `${reminderMap[time].med.medicineName} - ${reminderMap[time].med.dosage}`
                : `Scheduled dose at ${time}`,
            tag: `medication-${time}`,
        }))

        return cleanup
    }, [medications, permission])

    const fetchMedications = async () => {
        try {
            const res = await fetch("/api/medications")
            if (res.ok) {
                const data = await res.json()
                setMedications(data)
                generateTodaySchedule(data)
            }
        } catch (error) {
            console.error("Error fetching medications:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchDosageLogs = async () => {
        try {
            const res = await fetch("/api/dosage-logs?limit=50")
            if (res.ok) {
                const data = await res.json()
                setDosageLogs(data)
            }
        } catch (error) {
            console.error("Error fetching logs:", error)
        }
    }

    const generateTodaySchedule = (meds: Medication[]) => {
        const schedule: any[] = []
        const today = new Date().toDateString()

        meds.forEach(med => {
            if (med.reminderEnabled && med.reminderTimes) {
                med.reminderTimes.forEach(time => {
                    schedule.push({
                        medicationId: med.id,
                        medicineName: med.medicineName,
                        dosage: med.dosage,
                        time: time,
                        taken: false // TODO: Check against dosage logs
                    })
                })
            }
        })

        schedule.sort((a, b) => a.time.localeCompare(b.time))
        setTodaySchedule(schedule)
    }

    const handleMarkAsTaken = async (medicationId: string, scheduledTime: string) => {
        try {
            const res = await fetch("/api/dosage-logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    medicationId,
                    scheduledTime,
                    status: "taken"
                })
            })

            if (res.ok) {
                fetchDosageLogs()
                // Update schedule
                setTodaySchedule(prev =>
                    prev.map(item =>
                        item.medicationId === medicationId && item.time === scheduledTime
                            ? { ...item, taken: true }
                            : item
                    )
                )
            }
        } catch (error) {
            console.error("Error logging dose:", error)
        }
    }

    const handleDeleteMedication = async (id: string) => {
        if (!confirm("Are you sure you want to delete this medication?")) return

        try {
            const res = await fetch(`/api/medications?id=${id}`, {
                method: "DELETE"
            })

            if (res.ok) {
                fetchMedications()
            }
        } catch (error) {
            console.error("Error deleting medication:", error)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    const todaysTaken = dosageLogs.filter(log => {
        const logDate = new Date(log.takenAt).toDateString()
        const today = new Date().toDateString()
        return logDate === today && log.status === "taken"
    }).length

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.push("/")}
                    className="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back to Dashboard
                </button>

                {/* Header with Notification Toggle */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                            <Pill className="w-10 h-10 text-indigo-600" />
                            My Medications
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Manage your medications and track your dosages
                        </p>
                    </div>

                    {/* Notification Permission Button */}
                    <button
                        onClick={requestPermission}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${permission === "granted"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default"
                            : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                            }`}
                    >
                        {permission === "granted" ? (
                            <>
                                <Bell className="w-5 h-5 fill-current" />
                                Notifications On
                            </>
                        ) : (
                            <>
                                <BellOff className="w-5 h-5" />
                                Enable Notifications
                            </>
                        )}
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Pill className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Active Medications</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{medications.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Taken Today</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{todaysTaken}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Scheduled Today</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{todaySchedule.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Weather Health Shield - New Feature */}
                <div className="mb-8">
                    <WeatherHealthShield />
                </div>

                {/* Today's Schedule */}
                {todaySchedule.length > 0 && (
                    <div className="mb-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 shadow-xl">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-indigo-600" />
                            Today's Schedule
                        </h2>
                        <div className="space-y-3">
                            {todaySchedule.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between p-4 rounded-xl transition-all ${item.taken
                                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800"
                                        : "bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold ${item.taken
                                            ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                                            : "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                                            }`}>
                                            {item.time}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{item.medicineName}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{item.dosage}</p>
                                        </div>
                                    </div>
                                    {!item.taken && (
                                        <button
                                            onClick={() => handleMarkAsTaken(item.medicationId, item.time)}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Mark as Taken
                                        </button>
                                    )}
                                    {item.taken && (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5" />
                                            Taken
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add Medication Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="mb-6 w-full md:w-auto px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add New Medication
                </button>

                {/* Medications List */}
                {medications.length === 0 ? (
                    <div className="text-center py-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50">
                        <Pill className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-400 text-lg">No medications added yet</p>
                        <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">Click "Add New Medication" to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {medications.map((med) => (
                            <div
                                key={med.id}
                                className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                            {med.medicineName}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{med.dosage}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${med.reminderEnabled
                                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                        }`}>
                                        {med.reminderEnabled ? "Active" : "Paused"}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                        <span className="font-bold">Frequency:</span> {med.frequency}
                                    </p>
                                    {med.reminderTimes && med.reminderTimes.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {med.reminderTimes.map((time, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold"
                                                >
                                                    {time}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {med.notes && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                            {med.notes}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleDeleteMedication(med.id)}
                                    className="w-full py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-bold transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Medication Modal - Will create next */}
                {showAddModal && (
                    <AddMedicationModal
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            fetchMedications()
                            setShowAddModal(false)
                        }}
                    />
                )}
            </div>
        </div>
    )
}

// Placeholder - will create full modal next
function AddMedicationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [medicineName, setMedicineName] = useState("")
    const [dosage, setDosage] = useState("")
    const [frequency, setFrequency] = useState("Once daily")
    const [reminderHour, setReminderHour] = useState("09")
    const [reminderMinute, setReminderMinute] = useState("00")
    const [reminderPeriod, setReminderPeriod] = useState<"AM" | "PM">("AM")
    const [notes, setNotes] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        // Convert AM/PM to 24h format for storage
        let hours = parseInt(reminderHour)
        if (reminderPeriod === "PM" && hours < 12) hours += 12
        if (reminderPeriod === "AM" && hours === 12) hours = 0

        const formattedTime = `${hours.toString().padStart(2, '0')}:${reminderMinute}`
        const reminderTimes = [formattedTime]

        try {
            const res = await fetch("/api/medications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    medicineName,
                    dosage,
                    frequency,
                    reminderTimes,
                    notes,
                    reminderEnabled: true
                })
            })

            if (res.ok) {
                toast.success("Medication added with background reminders!")
                onSuccess()
            } else {
                const data = await res.json()
                toast.error("Failed to save medication")
                console.error("Failed to add:", data)
            }
        } catch (error) {
            console.error("Error adding medication:", error)
            toast.error("An error occurred. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 dark:border-white/10 animate-scale-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">New Medication</h2>
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Reminders On</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                            Medicine Name
                        </label>
                        <input
                            type="text"
                            value={medicineName}
                            onChange={(e) => setMedicineName(e.target.value)}
                            required
                            className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:border-indigo-500 transition-all font-medium"
                            placeholder="e.g., Paracetamol"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                                Dosage
                            </label>
                            <input
                                type="text"
                                value={dosage}
                                onChange={(e) => setDosage(e.target.value)}
                                required
                                className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:border-indigo-500 transition-all font-medium"
                                placeholder="e.g., 500mg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                                Frequency
                            </label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:border-indigo-500 transition-all font-bold"
                            >
                                <option>Once daily</option>
                                <option>Twice daily</option>
                                <option>Thrice daily</option>
                                <option>Every 4 hours</option>
                                <option>As needed</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                            Reminder Time
                        </label>
                        <div className="flex items-center gap-2">
                            <select
                                value={reminderHour}
                                onChange={(e) => setReminderHour(e.target.value)}
                                className="flex-1 px-3 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold"
                            >
                                {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                            <span className="font-bold">:</span>
                            <select
                                value={reminderMinute}
                                onChange={(e) => setReminderMinute(e.target.value)}
                                className="flex-1 px-3 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold"
                            >
                                {["00", "15", "30", "45"].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border-2 border-slate-200 dark:border-slate-700 ml-2">
                                <button
                                    type="button"
                                    onClick={() => setReminderPeriod("AM")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${reminderPeriod === "AM" ? "bg-white dark:bg-indigo-600 shadow-sm text-indigo-600 dark:text-white" : "text-slate-400"}`}
                                >
                                    AM
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReminderPeriod("PM")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${reminderPeriod === "PM" ? "bg-white dark:bg-indigo-600 shadow-sm text-indigo-600 dark:text-white" : "text-slate-400"}`}
                                >
                                    PM
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Notifications will fire even when Medaurin is closed.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:border-indigo-500 transition-all font-medium resize-none"
                            rows={2}
                            placeholder="e.g., Take after food"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-2xl shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : "Set Reminder"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
