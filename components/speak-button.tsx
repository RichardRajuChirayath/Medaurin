"use client"

import { useState } from "react"
import { Volume2, VolumeX, Loader2 } from "lucide-react"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"

interface SpeakButtonProps {
    text: string
    label?: string
    className?: string
    autoSpeak?: boolean
}

export function SpeakButton({ text, label = "Listen", className = "", autoSpeak = false }: SpeakButtonProps) {
    const { speak, cancel, isSpeaking, isSupported } = useTextToSpeech({
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
    })

    const [hasAutoSpoken, setHasAutoSpoken] = useState(false)

    // Auto-speak on mount if enabled
    if (autoSpeak && !hasAutoSpoken && text && isSupported) {
        setHasAutoSpoken(true)
        setTimeout(() => speak(text), 500) // Small delay for better UX
    }

    const handleClick = () => {
        if (isSpeaking) {
            cancel()
        } else {
            speak(text)
        }
    }

    if (!isSupported) {
        return null // Hide button if TTS not supported
    }

    return (
        <button
            onClick={handleClick}
            className={`
                group relative inline-flex items-center gap-2 px-4 py-2.5 
                bg-gradient-to-r from-indigo-500 to-purple-600 
                hover:from-indigo-600 hover:to-purple-700
                text-white font-semibold rounded-xl
                transition-all duration-300 
                hover:scale-105 active:scale-95
                shadow-lg hover:shadow-xl
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className}
            `}
            disabled={!text}
            title={isSpeaking ? "Stop speaking" : "Read aloud"}
        >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity" />

            {/* Icon */}
            <div className="relative z-10">
                {isSpeaking ? (
                    <VolumeX className="w-5 h-5 animate-pulse" />
                ) : (
                    <Volume2 className="w-5 h-5" />
                )}
            </div>

            {/* Label */}
            <span className="relative z-10 text-sm">
                {isSpeaking ? "Stop" : label}
            </span>

            {/* Speaking indicator */}
            {isSpeaking && (
                <div className="relative z-10 flex gap-1">
                    <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
            )}
        </button>
    )
}
