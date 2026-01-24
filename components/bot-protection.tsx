"use client"

import { useState, useEffect } from "react"
import { Shield, CheckCircle, AlertCircle } from "lucide-react"

interface BotProtectionProps {
    onVerified: (verified: boolean) => void
    isVerified: boolean
    shouldShake?: boolean
}

export function BotProtection({ onVerified, isVerified, shouldShake }: BotProtectionProps) {
    const [isChecking, setIsChecking] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const handleClick = () => {
        if (isVerified) {
            // Allow unchecking
            onVerified(false)
            setShowSuccess(false)
            return
        }

        setIsChecking(true)

        // Simulate verification delay (makes it feel more secure)
        setTimeout(() => {
            setIsChecking(false)
            setShowSuccess(true)
            onVerified(true)

            // Hide success message after 2 seconds
            setTimeout(() => setShowSuccess(false), 2000)
        }, 800)
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={handleClick}
                disabled={isChecking}
                className={`
          group relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300
          ${isVerified
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-600'
                        : 'bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'
                    }
          ${isChecking ? 'opacity-75 cursor-wait' : 'cursor-pointer hover:shadow-lg'}
          ${shouldShake && !isVerified ? 'animate-shake border-red-500' : ''}
          disabled:cursor-not-allowed
        `}
            >
                {/* Checkbox */}
                <div className={`
          relative w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300
          ${isVerified
                        ? 'bg-emerald-500 border-emerald-500 scale-110'
                        : 'bg-white dark:bg-slate-700 border-slate-400 dark:border-slate-500 group-hover:border-indigo-500'
                    }
          ${isChecking ? 'animate-pulse' : ''}
        `}>
                    {isChecking && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {isVerified && !isChecking && (
                        <CheckCircle className="w-5 h-5 text-white animate-scale-in" />
                    )}
                </div>

                {/* Text */}
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                        <Shield className={`w-5 h-5 ${isVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`} />
                        <span className={`font-bold text-lg ${isVerified ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                            {isChecking ? 'Verifying...' : isVerified ? 'Verified!' : "I'm not a robot"}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {isVerified ? 'You can now proceed with your analysis' : 'Click to verify you are human'}
                    </p>
                </div>

                {/* Success Animation */}
                {showSuccess && (
                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce">
                        ✓ Verified
                    </div>
                )}

                {/* Glow effect when verified */}
                {isVerified && (
                    <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl -z-10 animate-pulse-glow" />
                )}
            </button>

            {/* Security Badge */}
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                <Shield className="w-3 h-3" />
                <span>Protected by MixSafe Bot Detection</span>
            </div>
        </div>
    )
}
