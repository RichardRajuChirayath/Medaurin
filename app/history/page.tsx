"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { History, Calendar, Shield, AlertTriangle, CheckCircle, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"

interface Analysis {
    id: string
    medicines: string[]
    status: string
    score: number
    analysisType: string
    interactions: any
    recommendations: string[]
    createdAt: string
}

export default function HistoryPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [analyses, setAnalyses] = useState<Analysis[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/")
        }
    }, [status, router])

    useEffect(() => {
        if (session) {
            fetchHistory()
        }
    }, [session])

    const fetchHistory = async () => {
        try {
            const response = await fetch("/api/history")
            if (response.ok) {
                const data = await response.json()
                setAnalyses(data.analyses)
            }
        } catch (error) {
            console.error("Failed to fetch history:", error)
        } finally {
            setLoading(false)
        }
    }

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-indigo-100 to-purple-100 dark:from-slate-950 dark:via-indigo-950/90 dark:to-purple-950/80">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
            </div>
        )
    }

    if (!session) {
        return null
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "safe":
                return "from-emerald-500 to-green-600"
            case "caution":
                return "from-amber-500 to-orange-600"
            case "danger":
                return "from-red-500 to-rose-600"
            default:
                return "from-slate-500 to-gray-600"
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "safe":
                return <CheckCircle className="w-5 h-5" />
            case "caution":
                return <AlertTriangle className="w-5 h-5" />
            case "danger":
                return <Shield className="w-5 h-5" />
            default:
                return <Shield className="w-5 h-5" />
        }
    }

    return (
        <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-sky-100 via-indigo-100 to-purple-100 dark:from-slate-950 dark:via-indigo-950/90 dark:to-purple-950/80">
            {/* Background Effects */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/40 to-blue-500/30 dark:from-cyan-600/25 dark:to-blue-700/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[100px] animate-float-slow" />
                <div className="absolute top-1/4 -right-40 w-[700px] h-[700px] bg-gradient-to-br from-purple-400/40 to-pink-500/30 dark:from-purple-600/25 dark:to-pink-700/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[120px] animate-float-slow" />
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-12">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Home
                    </Link>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <History className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white">
                                Analysis History
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 font-medium">
                                View your past medicine safety checks
                            </p>
                        </div>
                    </div>
                </div>

                {/* History List */}
                {analyses.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                            <History className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            No History Yet
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Your medicine analysis history will appear here
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
                        >
                            Start Analysis
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {analyses.map((analysis) => (
                            <div
                                key={analysis.id}
                                className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="p-6 md:p-8">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getStatusColor(analysis.status)} flex items-center justify-center text-white shadow-lg`}>
                                                {getStatusIcon(analysis.status)}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize">
                                                    {analysis.status} Status
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(analysis.createdAt).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {analysis.score}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                                                Risk Score
                                            </div>
                                        </div>
                                    </div>

                                    {/* Medicines */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                            Medicines Analyzed:
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.medicines.map((med, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-semibold"
                                                >
                                                    {med}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Analysis Type Badge */}
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400">
                                        {analysis.analysisType === "photo" ? "📸 Photo Upload" : "✍️ Manual Entry"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
