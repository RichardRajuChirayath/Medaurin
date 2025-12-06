"use client"

import { useEffect, useRef } from "react"

export function BackgroundEffects() {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const x = e.clientX
                const y = e.clientY
                containerRef.current.style.setProperty("--mouse-x", `${x}px`)
                containerRef.current.style.setProperty("--mouse-y", `${y}px`)
            }
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    return (
        <div ref={containerRef} className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
            {/* Mouse-tracked Gradient Orb */}
            <div className="mouse-gradient" />

            {/* Morphing Blobs */}
            <div className="blob-container">
                <div className="blob blob-1" />
                <div className="blob blob-2" />
                <div className="blob blob-3" />
            </div>

            {/* Noise Overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiAvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMzMzIiBvcGFjaXR5PSIwLjEiIC8+Cjwvc3ZnPg==')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
        </div>
    )
}
