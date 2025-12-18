"use client"

import { useEffect, useState } from "react"
import { Users, Check, X, Shield, Bell } from "lucide-react"
import { toast } from "sonner"

interface Request {
    id: string
    caregiver: {
        name: string | null
        email: string | null
        avatarUrl: string | null
    }
    createdAt: string
}

export function CaregiverRequestNotifications() {
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRequests = async () => {
        try {
            const res = await fetch("/api/caregiver/link")
            if (res.ok) {
                const data = await res.json()
                setRequests(data)
            }
        } catch (error) {
            console.error("Failed to fetch requests", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleAction = async (id: string, action: "ACCEPT" | "REJECT") => {
        try {
            const res = await fetch("/api/caregiver/link", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ relationshipId: id, action })
            })

            if (!res.ok) throw new Error("Failed to process request")

            toast.success(action === "ACCEPT" ? "Caregiver Connected!" : "Request Rejected")

            // Remove from list
            setRequests(prev => prev.filter(r => r.id !== id))
        } catch (error) {
            toast.error("Something went wrong")
        }
    }

    if (loading || requests.length === 0) return null

    return (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md animate-pulse">
                        <Bell className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">New Caregiver Requests</h3>
                </div>

                <div className="space-y-3 relative z-10">
                    {requests.map(req => (
                        <div key={req.id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                                    {(req.caregiver.name || req.caregiver.email || "U").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold">{req.caregiver.name || "A User"}</p>
                                    <p className="text-xs text-indigo-100">{req.caregiver.email}</p>
                                    <p className="text-xs text-indigo-200 mt-0.5">wants to monitor your health & meds</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleAction(req.id, "REJECT")}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors"
                                >
                                    Decline
                                </button>
                                <button
                                    onClick={() => handleAction(req.id, "ACCEPT")}
                                    className="px-6 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-bold shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Accept
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
