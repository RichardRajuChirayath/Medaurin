"use client"

import { useState, useEffect } from "react"

interface TypingAnimationProps {
    words: string[]
    className?: string
}

export function TypingAnimation({ words, className = "" }: TypingAnimationProps) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0)
    const [currentText, setCurrentText] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)
    const [isPaused, setIsPaused] = useState(false)

    useEffect(() => {
        const currentWord = words[currentWordIndex]

        const timeout = setTimeout(() => {
            if (isPaused) {
                // Pause after completing a word
                setIsPaused(false)
                setIsDeleting(true)
                return
            }

            if (isDeleting) {
                // Delete one character
                if (currentText.length > 0) {
                    setCurrentText(currentText.slice(0, -1))
                } else {
                    // Move to next word
                    setIsDeleting(false)
                    setCurrentWordIndex((prev) => (prev + 1) % words.length)
                }
            } else {
                // Type one character
                if (currentText.length < currentWord.length) {
                    setCurrentText(currentWord.slice(0, currentText.length + 1))
                } else {
                    // Pause before deleting
                    setIsPaused(true)
                }
            }
        }, isPaused ? 2000 : isDeleting ? 50 : 100) // Pause: 2s, Delete: 50ms, Type: 100ms

        return () => clearTimeout(timeout)
    }, [currentText, currentWordIndex, isDeleting, isPaused, words.join(",")])

    return (
        <span className={className}>
            {currentText}
            <span className="animate-pulse">|</span>
        </span>
    )
}
