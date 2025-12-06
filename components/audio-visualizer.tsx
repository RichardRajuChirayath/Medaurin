"use client"

import { useEffect, useRef } from "react"

interface AudioVisualizerProps {
    stream: MediaStream | null
    isListening: boolean
}

export function AudioVisualizer({ stream, isListening }: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>(null)
    const analyserRef = useRef<AnalyserNode>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode>(null)

    useEffect(() => {
        if (!stream || !isListening || !canvasRef.current) return

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256

        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        analyserRef.current = analyser
        sourceRef.current = source

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")!
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const draw = () => {
            if (!isListening) return

            animationRef.current = requestAnimationFrame(draw)
            analyser.getByteFrequencyData(dataArray)

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const centerX = canvas.width / 2
            const centerY = canvas.height / 2
            const radius = 25 // Base radius

            // Draw circular visualizer
            ctx.beginPath()
            for (let i = 0; i < bufferLength; i++) {
                const value = dataArray[i]
                const percent = value / 255
                const height = radius + (percent * 20) // Max additional height
                const angle = (i / bufferLength) * Math.PI * 2

                const x = centerX + Math.cos(angle) * height
                const y = centerY + Math.sin(angle) * height

                if (i === 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
            }
            ctx.closePath()
            ctx.strokeStyle = "#6366f1" // Indigo-500
            ctx.lineWidth = 2
            ctx.stroke()

            // Inner glow
            ctx.fillStyle = `rgba(99, 102, 241, ${0.2 + (dataArray[0] / 255) * 0.5})`
            ctx.fill()
        }

        draw()

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
            if (sourceRef.current) sourceRef.current.disconnect()
            if (audioContext.state !== "closed") audioContext.close()
        }
    }, [stream, isListening])

    if (!isListening) return null

    return (
        <canvas
            ref={canvasRef}
            width={100}
            height={100}
            className="absolute inset-0 pointer-events-none z-0"
        />
    )
}
