"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, X, Shield, Camera, Keyboard, Mic, CheckCircle2 } from "lucide-react"

export function WelcomeModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [hasSeenModal, setHasSeenModal] = useState(true) // Default true to prevent flash

    useEffect(() => {
        // Check if user has seen the modal before
        const seen = localStorage.getItem("mixsafe-welcome-seen")
        if (!seen) {
            setIsOpen(true)
            setHasSeenModal(false)
        }
    }, [])

    const handleClose = () => {
        localStorage.setItem("mixsafe-welcome-seen", "true")
        setIsOpen(false)
    }

    if (!isOpen || hasSeenModal) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <Shield className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Welcome to MixSafe</h2>
                                <p className="text-indigo-100 text-sm">Medicine Interaction Checker</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Warning Banner */}
                    <div className="bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-amber-800 dark:text-amber-300 text-lg">Important Notice</h3>
                                <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                                    This app is designed <strong>ONLY for checking medicine interactions</strong>.
                                    Please do not send random messages, greetings, or non-medicine related content.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* How to Use */}
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3">How to Use:</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                                    <Camera className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">📷 Upload Medicine Photo</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Take clear photos of medicine strips/bottles</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                                    <Keyboard className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">⌨️ Type Medicine Names</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Enter names separated by commas</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center">
                                    <Mic className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">🎤 Use Voice Input</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Speak medicine names clearly</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                        <p className="text-red-700 dark:text-red-400 text-xs text-center">
                            ⚠️ <strong>Not a substitute for medical advice.</strong> Always consult your doctor or pharmacist.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={handleClose}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        I Understand, Let's Start
                    </button>
                </div>
            </div>
        </div>
    )
}
