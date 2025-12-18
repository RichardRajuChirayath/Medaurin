"use client"

import { useState, useEffect } from "react"
import {
    Users, Plus, Bell, Activity, Clock,
    AlertTriangle, CheckCircle, Shield, Phone,
    UserPlus, Mail
} from "lucide-react"
import { toast } from "sonner"

interface Patient {
    relationshipId: string
    patientId: string
    name: string
    avatarUrl?: string
    status: "OK" | "WARNING" | "CRITICAL"
    stats: {
        totalScheduled: number
        taken: number
        missed: number
    }
    nextDose?: {
        medicine: string
        time: string
    }
    lastActive: string
}

export function CaregiverDashboard() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [email, setEmail] = useState("")

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 30000) // Poll every 30s
        return () => clearInterval(interval)
    }, [])

    const fetchData = async () => {
        try {
            const res = await fetch("/api/caregiver/dashboard")
            if (res.ok) {
                const data = await res.json()
                setPatients(data)
            }
        } catch (error) {
            console.error("Failed to fetch dashboard", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddPatient = async () => {
        if (!email) return toast.error("Please enter an email")

        try {
            const res = await fetch("/api/caregiver/link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ patientEmail: email, nickname: "Family Member" })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error)
            }

            toast.success("Request sent!", { description: "Ask them to approve it in their account." })
            setShowAddModal(false)
            setEmail("")
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    if (isLoading) {
        return <div className="p-8 text-center animate-pulse">Loading Caregiver Portal...</div>
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-3">
                        <Shield className="w-8 h-8 text-emerald-600" />
                        Guardian Dashboard
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Monitoring {patients.length} active family members
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
                >
                    <UserPlus className="w-5 h-5" />
                    Connect Family
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {patients.map(p => (
                    <PatientCard key={p.relationshipId} patient={p} />
                ))}

                {patients.length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-900/50">
                        <Users className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Family Members Connected</h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            Link your account to a loved one's to receive critical alerts about their medication adherence.
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700"
                        >
                            Add Your First Patient
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6">
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                            <Plus className="w-6 h-6 text-emerald-600" />
                            Connect a Loved One
                        </h3>
                        <div>
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                                Enter their email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="mom@example.com"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-none ring-2 ring-transparent focus:ring-emerald-500 transition-all font-medium"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                We'll send them a request to appear on your dashboard.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddPatient}
                                className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
                            >
                                Send Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function PatientCard({ patient }: { patient: Patient }) {
    const isCritical = patient.status === "CRITICAL"
    const isWarning = patient.status === "WARNING"

    // Gradient logic
    const bgGradient = isCritical
        ? "bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/50 dark:to-rose-950/50 border-red-500"
        : isWarning
            ? "bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50 border-orange-500"
            : "bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/50 dark:to-green-950/50 border-emerald-500"

    const textColor = isCritical ? "text-red-900 dark:text-red-200" : isWarning ? "text-orange-900 dark:text-orange-200" : "text-emerald-900 dark:text-emerald-200"

    return (
        <div className={`relative overflow-hidden rounded-3xl border-2 p-6 shadow-xl transition-all hover:scale-[1.01] ${bgGradient}`}>
            {/* Background effects */}
            {isCritical && (
                <div className="absolute inset-0 bg-red-500/10 animate-pulse z-0" />
            )}

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-2xl font-black">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className={`text-xl font-black ${textColor}`}>
                                {patient.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-white/50 backdrop-blur-md border border-black/5`}>
                                    <Activity className="w-3 h-3" />
                                    {isCritical ? "MISSED DOSE ALERT" : isWarning ? "Attention Needed" : "On Track"}
                                </span>
                            </div>
                        </div>
                    </div>
                    {isCritical && (
                        <button className="p-3 bg-red-600 text-white rounded-xl font-bold shadow-lg animate-bounce flex items-center gap-2">
                            <Phone className="w-5 h-5" />
                            CALL
                        </button>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className={`p-3 rounded-xl bg-white/60 backdrop-blur-sm`}>
                        <div className="text-xs font-bold opacity-60 uppercase mb-1">Scheduled</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{patient.stats.totalScheduled}</div>
                    </div>
                    <div className={`p-3 rounded-xl bg-white/60 backdrop-blur-sm`}>
                        <div className="text-xs font-bold opacity-60 uppercase mb-1 text-green-700">Taken</div>
                        <div className="text-2xl font-black text-green-600">{patient.stats.taken}</div>
                    </div>
                    <div className={`p-3 rounded-xl bg-white/60 backdrop-blur-sm ${patient.stats.missed > 0 ? "bg-red-100/80" : ""}`}>
                        <div className="text-xs font-bold opacity-60 uppercase mb-1 text-red-700">Missed</div>
                        <div className="text-2xl font-black text-red-600">{patient.stats.missed}</div>
                    </div>
                </div>

                {/* Next Dose */}
                {patient.nextDose ? (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/20">
                        <Clock className="w-5 h-5 opacity-70" />
                        <div>
                            <div className="text-xs font-bold opacity-70 uppercase">Next Dose</div>
                            <div className="font-bold">{patient.nextDose.medicine} at {patient.nextDose.time}</div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/20 text-emerald-800">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">All done for today!</span>
                    </div>
                )}
            </div>
        </div>
    )
}
