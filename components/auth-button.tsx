"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { User, LogOut, History, Loader2 } from "lucide-react"
import { useState } from "react"

export function AuthButton() {
    const { data: session, status } = useSession()
    const [showMenu, setShowMenu] = useState(false)

    if (status === "loading") {
        return (
            <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (session?.user) {
        return (
            <div className="relative">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-3 p-3 rounded-xl backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    {session.user.image ? (
                        <img
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            className="w-8 h-8 rounded-full border-2 border-indigo-500"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                    )}
                    <div className="text-left hidden md:block">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {session.user.name || "User"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {session.user.email}
                        </p>
                    </div>
                </button>

                {showMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-scale-in">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                <p className="font-bold text-slate-900 dark:text-white">
                                    {session.user.name}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {session.user.email}
                                </p>
                            </div>
                            <div className="p-2">
                                <a
                                    href="/profile"
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    onClick={() => setShowMenu(false)}
                                >
                                    <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        Profile Settings
                                    </span>
                                </a>
                                <a
                                    href="/medications"
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    onClick={() => setShowMenu(false)}
                                >
                                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        My Medications
                                    </span>
                                </a>
                                <a
                                    href="/history"
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    onClick={() => setShowMenu(false)}
                                >
                                    <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        View History
                                    </span>
                                </a>
                                <button
                                    onClick={() => {
                                        setShowMenu(false)
                                        signOut()
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                                >
                                    <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                        Sign Out
                                    </span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        )
    }

    return (
        <button
            onClick={() => signIn("google")}
            className="group relative px-6 py-3 rounded-xl backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity" />
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-slate-900 dark:text-white">Sign In</span>
        </button>
    )
}
