"use client"

import { useState, useEffect, useCallback } from "react"

interface UseTTSOptions {
    rate?: number // 0.1 to 10, default 1
    pitch?: number // 0 to 2, default 1
    volume?: number // 0 to 1, default 1
    lang?: string // default 'en-US'
}

export function useTextToSpeech(options: UseTTSOptions = {}) {
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setIsSupported(true)

            // Load voices
            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices()
                setVoices(availableVoices)

                // Select a good default voice (prefer Google or Microsoft voices)
                const preferredVoice = availableVoices.find(
                    v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft'))
                ) || availableVoices.find(v => v.lang.startsWith('en'))

                setSelectedVoice(preferredVoice || availableVoices[0] || null)
            }

            loadVoices()
            window.speechSynthesis.onvoiceschanged = loadVoices
        }
    }, [])

    const speak = useCallback((text: string, customOptions?: UseTTSOptions) => {
        if (!isSupported || !text) return

        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        // If voices aren't loaded yet, try to load them first
        if (voices.length === 0) {
            const availableVoices = window.speechSynthesis.getVoices()
            if (availableVoices.length > 0) {
                setVoices(availableVoices)
                // Retry speaking after a short delay to allow state update
                setTimeout(() => speak(text, customOptions), 100)
                return
            }
        }

        const utterance = new SpeechSynthesisUtterance(text)

        // Apply options
        const finalOptions = { ...options, ...customOptions }
        utterance.rate = finalOptions.rate || 1
        utterance.pitch = finalOptions.pitch || 1
        utterance.volume = finalOptions.volume || 1
        utterance.lang = finalOptions.lang || 'en-US'

        // Try to find the selected voice, or fallback to the first available one
        const voiceToUse = selectedVoice || voices.find(v => v.lang.startsWith('en')) || voices[0]
        if (voiceToUse) {
            utterance.voice = voiceToUse
        }

        // Event handlers
        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => {
            setIsSpeaking(false)
            setIsPaused(false)
        }
        utterance.onerror = (event) => {
            // Ignore "interrupted" or "canceled" errors as they are expected when stopping speech
            if (event.error === 'interrupted' || event.error === 'canceled') {
                setIsSpeaking(false)
                return
            }
            console.error('Speech synthesis error:', event)
            setIsSpeaking(false)
            setIsPaused(false)
        }
        utterance.onpause = () => setIsPaused(true)
        utterance.onresume = () => setIsPaused(false)

        // Small timeout to ensure browser is ready
        setTimeout(() => {
            window.speechSynthesis.speak(utterance)
        }, 10)
    }, [isSupported, selectedVoice, voices, options])

    const pause = useCallback(() => {
        if (isSupported && isSpeaking) {
            window.speechSynthesis.pause()
        }
    }, [isSupported, isSpeaking])

    const resume = useCallback(() => {
        if (isSupported && isPaused) {
            window.speechSynthesis.resume()
        }
    }, [isSupported, isPaused])

    const cancel = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.cancel()
            setIsSpeaking(false)
            setIsPaused(false)
        }
    }, [isSupported])

    return {
        speak,
        pause,
        resume,
        cancel,
        isSpeaking,
        isPaused,
        isSupported,
        voices,
        selectedVoice,
        setSelectedVoice
    }
}
