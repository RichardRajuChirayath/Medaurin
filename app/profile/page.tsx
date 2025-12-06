"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { User, Shield, Pill, AlertTriangle, Save, X, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserProfile {
    id: string
    name: string | null
    username: string | null
    email: string
    image: string | null
    allergies: string[]
    conditions: string[]
}

const COMMON_ALLERGIES = [
    "Penicillin", "Sulfa drugs", "Aspirin", "Ibuprofen", "Codeine",
    "Latex", "Peanuts", "Shellfish", "Eggs", "Milk"
]

const COMMON_CONDITIONS = [
    "Diabetes", "Hypertension", "Asthma", "Heart Disease", "Kidney Disease",
    "Liver Disease", "Pregnancy", "Breastfeeding", "Epilepsy", "Glaucoma"
]

export default function ProfilePage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const [username, setUsername] = useState("")
    const [allergies, setAllergies] = useState<string[]>([])
    const [conditions, setConditions] = useState<string[]>([])
    const [newAllergy, setNewAllergy] = useState("")
    const [newCondition, setNewCondition] = useState("")

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/")
            return
        }

        if (status === "authenticated") {
            fetchProfile()
        }
    }, [status, router])

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/profile")
            if (!res.ok) throw new Error("Failed to fetch profile")

            const data = await res.json()
            setProfile(data)
            setUsername(data.username || "")
            setAllergies(data.allergies || [])
            setConditions(data.conditions || [])
        } catch (err) {
            setError("Failed to load profile")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setError("")
        setSuccess("")
        setIsSaving(true)

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, allergies, conditions })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to update profile")
            }

            const updated = await res.json()
            setProfile(updated)
            setUsername(updated.username || "")
            setAllergies(updated.allergies || [])
            setConditions(updated.conditions || [])

            setSuccess("Profile updated successfully!")

            // Refresh profile data to show latest from database
            await fetchProfile()

            setTimeout(() => setSuccess(""), 3000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveAndGoBack = async () => {
        await handleSave()
        setTimeout(() => {
            router.push("/")
        }, 1000)
    }

    const addAllergy = (allergy: string) => {
        if (allergy && !allergies.includes(allergy)) {
            setAllergies([...allergies, allergy])
            setNewAllergy("")
        }
    }

    const removeAllergy = (allergy: string) => {
        setAllergies(allergies.filter(a => a !== allergy))
    }

    const addCondition = (condition: string) => {
        if (condition && !conditions.includes(condition)) {
            setConditions([...conditions, condition])
            setNewCondition("")
        }
    }

    const removeCondition = (condition: string) => {
        setConditions(conditions.filter(c => c !== condition))
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
                        Profile Settings
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Manage your personal information and health details
                    </p>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-800 dark:text-green-200">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-200">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Basic Information
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={profile?.email || ""}
                                    disabled
                                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Choose a unique username"
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Allergies Card */}
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Allergies
                            </h2>
                        </div>

                        {/* Current Allergies */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {allergies.map((allergy) => (
                                <span
                                    key={allergy}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full text-sm font-medium"
                                >
                                    {allergy}
                                    <button
                                        onClick={() => removeAllergy(allergy)}
                                        className="hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>

                        {/* Add Custom Allergy */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newAllergy}
                                onChange={(e) => setNewAllergy(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && addAllergy(newAllergy)}
                                placeholder="Add custom allergy"
                                className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                            />
                            <button
                                onClick={() => addAllergy(newAllergy)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add
                            </button>
                        </div>

                        {/* Common Allergies */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                Common Allergies
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {COMMON_ALLERGIES.filter(a => !allergies.includes(a)).map((allergy) => (
                                    <button
                                        key={allergy}
                                        onClick={() => addAllergy(allergy)}
                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-colors"
                                    >
                                        + {allergy}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Medical Conditions Card */}
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Medical Conditions
                            </h2>
                        </div>

                        {/* Current Conditions */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {conditions.map((condition) => (
                                <span
                                    key={condition}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                                >
                                    {condition}
                                    <button
                                        onClick={() => removeCondition(condition)}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>

                        {/* Add Custom Condition */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newCondition}
                                onChange={(e) => setNewCondition(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && addCondition(newCondition)}
                                placeholder="Add custom condition"
                                className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                            />
                            <button
                                onClick={() => addCondition(newCondition)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add
                            </button>
                        </div>

                        {/* Common Conditions */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                Common Conditions
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {COMMON_CONDITIONS.filter(c => !conditions.includes(c)).map((condition) => (
                                    <button
                                        key={condition}
                                        onClick={() => addCondition(condition)}
                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-colors"
                                    >
                                        + {condition}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Profile
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleSaveAndGoBack}
                            disabled={isSaving}
                            className="py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save & Go Back
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
