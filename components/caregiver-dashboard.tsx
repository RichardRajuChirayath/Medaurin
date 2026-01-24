"use client"

import { useState, useEffect } from "react"
import {
    Users, Plus, Bell, Activity, Clock,
    AlertTriangle, CheckCircle, Shield, Phone,
    UserPlus, Mail, PencilLine, Check, X,
    ChevronRight, Heart
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

            toast.success("Request sent!", {
                description: "We've emailed them. Ask them to approve it in their account."
            })
            setShowAddModal(false)
            setEmail("")
            fetchData() // Refresh list
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-bold animate-pulse">Syncing Guardian Shield...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* --- Premium Header --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-2">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm transition-all group-hover:border-primary/50">
                        <div className="bg-slate-900 rounded p-0.5 flex items-center justify-center">
                            <img src="/logo.png" className="w-3.5 h-3.5 object-contain" alt="Logo" style={{ mixBlendMode: 'screen' }} />
                        </div>
                        <span className="text-primary text-[10px] font-black uppercase tracking-widest">Guardian Shield Active</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        Family <span className="text-gradient-primary">Guardian</span>
                    </h2>
                    <p className="text-lg text-slate-500 font-medium max-w-lg">
                        You are monitoring <span className="text-slate-900 dark:text-white font-bold">{patients.length} active</span> family members.
                        Critical alerts will appear here in real-time.
                    </p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="group relative flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg transition-all hover:scale-[1.03] active:scale-95 shadow-2xl hover:shadow-primary/20 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                    <UserPlus className="w-6 h-6" />
                    Connect Family
                </button>
            </div>

            {/* --- Stats Overview --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">
                            {patients.filter(p => p.status === "OK").length}
                        </div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Safe & On Track</div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">
                            {patients.filter(p => p.status === "WARNING").length}
                        </div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Needs Attention</div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-3xl flex items-center gap-4 border-red-500/30">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">
                            {patients.filter(p => p.status === "CRITICAL").length}
                        </div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Critical Alerts</div>
                    </div>
                </div>
            </div>

            {/* --- Connection Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                {patients.map(p => (
                    <PatientCard key={p.relationshipId} patient={p} onRefresh={fetchData} />
                ))}

                {patients.length === 0 && (
                    <div className="col-span-full py-24 text-center glass-card border-dashed border-2 border-slate-300 dark:border-slate-800 rounded-[40px]">
                        <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
                            <Heart className="w-12 h-12 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">No Connections Found</h3>
                        <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto font-medium">
                            Protect your loved ones by connecting their account. You'll get notified if they miss a medicine dose.
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-lg hover:shadow-primary/40 hover:scale-105 transition-all"
                        >
                            Invite Your First Family Member
                        </button>
                    </div>
                )}
            </div>

            {/* --- Enhanced Invite Modal --- */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in transition-all">
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] max-w-xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 space-y-8 animate-in zoom-in-95 duration-200">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
                                <Plus className="w-8 h-8 text-primary" />
                                Secure Connection
                            </h3>
                            <p className="text-slate-500 font-medium">
                                We'll send a secure email invitation to your loved one. They must approve the request before you can monitor them.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest pl-1">
                                Family Member Email
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-5 w-6 h-6 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="e.g. mom@gmail.com"
                                    className="w-full pl-14 pr-6 py-5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-primary/30 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-lg"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-5 text-slate-500 font-black hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                            >
                                Not Now
                            </button>
                            <button
                                onClick={handleAddPatient}
                                className="flex-[2] py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Send Secure Invite
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function PatientCard({ patient, onRefresh }: { patient: Patient, onRefresh: () => void }) {
    const [isEditing, setIsEditing] = useState(false)
    const [nickname, setNickname] = useState(patient.name)
    const [isSaving, setIsSaving] = useState(false)

    const isCritical = patient.status === "CRITICAL"
    const isWarning = patient.status === "WARNING"

    const handleUpdateNickname = async () => {
        if (!nickname.trim()) return toast.error("Name cannot be empty")
        setIsSaving(true)
        try {
            const res = await fetch("/api/caregiver/link", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    relationshipId: patient.relationshipId,
                    nickname: nickname.trim()
                })
            })

            if (res.ok) {
                toast.success("Name updated!")
                setIsEditing(false)
                onRefresh()
            } else {
                throw new Error("Failed to update name")
            }
        } catch (error) {
            toast.error("Error updating name")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className={`group relative overflow-hidden rounded-[32px] border-2 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 ${isCritical
            ? "bg-red-50/50 dark:bg-red-950/20 border-red-500 shadow-xl shadow-red-500/10"
            : isWarning
                ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-500 shadow-xl shadow-amber-500/10"
                : "glass-card border-slate-200 dark:border-white/10 hover:border-primary/50"
            }`}>
            {/* --- Status Glow Effect --- */}
            {isCritical && (
                <div className="absolute inset-0 bg-red-500/5 animate-[pulse_2s_ease-in-out_infinite]" />
            )}

            <div className="relative p-8 space-y-8">
                {/* --- Top Section: Identity --- */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-6">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black shadow-inner border-2 ${isCritical ? "bg-red-100 dark:bg-red-900 border-red-200 text-red-600" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-white/10 text-slate-400 group-hover:text-primary transition-colors"
                            }`}>
                            {patient.name.charAt(0)}
                        </div>

                        <div className="space-y-1">
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        autoFocus
                                        value={nickname}
                                        onChange={e => setNickname(e.target.value)}
                                        className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1 font-black text-xl w-40 outline-none focus:ring-2 focus:ring-primary/50"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleUpdateNickname()
                                            if (e.key === 'Escape') setIsEditing(false)
                                        }}
                                    />
                                    <button
                                        onClick={handleUpdateNickname}
                                        disabled={isSaving}
                                        className="p-1.5 bg-emerald-500 text-white rounded-lg hover:scale-110 transition-all disabled:opacity-50"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => { setIsEditing(false); setNickname(patient.name); }}
                                        className="p-1.5 bg-slate-300 dark:bg-slate-700 text-white rounded-lg hover:scale-110 transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {patient.name}
                                    </h3>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
                                    >
                                        <PencilLine className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${isCritical ? "bg-red-500 text-white animate-pulse" : isWarning ? "bg-amber-500 text-white" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border border-emerald-500/20"
                                    }`}>
                                    <Activity className="w-3 h-3" />
                                    {isCritical ? "MISSED DOSE ALERT" : isWarning ? "Attention Needed" : "System Secure"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {isCritical && (
                        <button className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-500/30 animate-bounce hover:scale-105 active:scale-95 transition-all">
                            <Phone className="w-5 h-5 fill-white" />
                            Emergency Contact
                        </button>
                    )}
                </div>

                {/* --- Grid Stats: High Contrast --- */}
                <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <div className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Scheduled</div>
                        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-4xl font-black text-slate-900 dark:text-white">
                            {patient.stats.totalScheduled}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs font-black text-emerald-600 uppercase tracking-widest pl-1">Taken</div>
                        <div className="p-4 rounded-2xl bg-emerald-100/50 dark:bg-emerald-900/20 border border-emerald-500/20 text-4xl font-black text-emerald-600">
                            {patient.stats.taken}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs font-black text-red-600 uppercase tracking-widest pl-1">Missed</div>
                        <div className={`p-4 rounded-2xl border text-4xl font-black ${patient.stats.missed > 0
                            ? "bg-red-100 dark:bg-red-900/40 border-red-500 text-red-600 shadow-lg shadow-red-500/10"
                            : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-300 dark:text-slate-700"
                            }`}>
                            {patient.stats.missed}
                        </div>
                    </div>
                </div>

                {/* --- Dynamic Footer Section --- */}
                <div className="pt-2">
                    {patient.nextDose ? (
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-black/10 flex items-center justify-center">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Upcoming Dose</div>
                                    <div className="text-lg font-black">{patient.nextDose.medicine}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black">{patient.nextDose.time}</div>
                                <div className="text-[10px] font-bold uppercase opacity-60">EST. Time</div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-emerald-600">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-black text-lg leading-tight">Schedule Completed</div>
                                <div className="text-xs font-bold opacity-80 uppercase tracking-wider">All medicines taken today</div>
                            </div>
                            <ChevronRight className="w-5 h-5 ml-auto opacity-30" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
