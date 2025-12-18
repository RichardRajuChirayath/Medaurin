"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { Camera, RefreshCw, Check, X, Zap, ScanLine, Maximize, Smartphone, Sparkles } from "lucide-react"
import Webcam from "react-webcam"
import { toast } from "sonner"

interface SmartCameraProps {
    onCapture: (file: File) => void
    onClose: () => void
}

declare global {
    interface Window {
        cv: any
    }
}

export function SmartCamera({ onCapture, onClose }: SmartCameraProps) {
    const webcamRef = useRef<Webcam>(null)
    const [imgSrc, setImgSrc] = useState<string | null>(null)
    const [processedImg, setProcessedImg] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [processingStage, setProcessingStage] = useState<string>("")
    const [cvLoaded, setCvLoaded] = useState(false)
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
    const [viewMode, setViewMode] = useState<"original" | "processed">("processed")

    const [cameraError, setCameraError] = useState<string | null>(null)

    useEffect(() => {
        // Check if OpenCV is loaded
        const checkCv = setInterval(() => {
            if (window.cv && window.cv.Mat) {
                setCvLoaded(true)
                clearInterval(checkCv)
            }
        }, 500)

        // Timeout after 5 seconds to stop checking aggressively
        const timeout = setTimeout(() => clearInterval(checkCv), 5000)

        return () => {
            clearInterval(checkCv)
            clearTimeout(timeout)
        }
    }, [])

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot()
        if (imageSrc) {
            setImgSrc(imageSrc)
            processImage(imageSrc)
        }
    }, [webcamRef])

    const processImage = async (imageSrc: string) => {
        if (!cvLoaded) {
            toast.error("OpenCV engine not ready yet. Please wait...")
            return
        }

        setIsProcessing(true)
        setProcessingStage("Initializing Computer Vision...")

        try {
            const img = new Image()
            img.src = imageSrc
            img.onload = () => {
                try {
                    const cv = window.cv
                    setProcessingStage("Reading Image Data...")

                    // Create Mat from image
                    const src = cv.imread(img)
                    const dst = new cv.Mat()

                    setProcessingStage("Converting to Grayscale...")
                    // Convert to grayscale
                    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0)

                    setProcessingStage("Removing Noise...")
                    // Apply Gaussian Blur to reduce noise
                    const ksize = new cv.Size(5, 5)
                    cv.GaussianBlur(src, src, ksize, 0, 0, cv.BORDER_DEFAULT)

                    setProcessingStage("Enhancing Contrast (Adaptive Threshold)...")
                    // Apply Adaptive Thresholding
                    // This is the magic step that makes text pop out from shadows
                    cv.adaptiveThreshold(src, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2)

                    // Optional: Morphological operations to clean up small noise
                    // const M = cv.Mat.ones(3, 3, cv.CV_8U);
                    // cv.erode(dst, dst, M);
                    // cv.dilate(dst, dst, M);

                    setProcessingStage("Finalizing...")
                    // Show processed image
                    cv.imshow('processed-canvas', dst)

                    // Get Data URL from canvas
                    const canvas = document.getElementById('processed-canvas') as HTMLCanvasElement
                    if (canvas) {
                        setProcessedImg(canvas.toDataURL('image/png'))
                    }

                    // Cleanup
                    src.delete()
                    dst.delete()
                    // M.delete()

                    setIsProcessing(false)
                } catch (err) {
                    console.error("OpenCV Error:", err)
                    toast.error("Failed to process image with OpenCV")
                    setIsProcessing(false)
                    // Fallback to original
                    setProcessedImg(imageSrc)
                }
            }
        } catch (err) {
            console.error(err)
            setIsProcessing(false)
        }
    }

    const handleRetake = () => {
        setImgSrc(null)
        setProcessedImg(null)
    }

    const handleConfirm = () => {
        const finalImage = viewMode === "processed" && processedImg ? processedImg : imgSrc
        if (finalImage) {
            // Convert DataURL to File
            fetch(finalImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "smart-scan.png", { type: "image/png" })
                    onCapture(file)
                })
        }
    }

    const handleCameraError = useCallback((error: string | DOMException) => {
        console.error("Camera Error:", error)
        let msg = "Could not access camera."
        if (typeof error === 'object' && 'name' in error) {
            if (error.name === 'NotAllowedError') msg = "Camera access denied. Please allow permissions."
            if (error.name === 'NotFoundError') msg = "No camera device found."
            if (error.name === 'NotReadableError') msg = "Camera is currently in use by another app."
            // Chrome blocks HTTP camera access on non-localhost
            if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                msg = "Camera requires HTTPS or localhost. If testing on network, use a secure connection."
            }
        }
        setCameraError(msg)
        toast.error(msg)
    }, [])

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={onClose} className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md">
                    <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/80 backdrop-blur-md">
                    <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <span className="text-xs font-bold text-white">AI Enhanced</span>
                </div>
                <button
                    onClick={() => setFacingMode(prev => prev === "user" ? "environment" : "user")}
                    className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md"
                >
                    <RefreshCw className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
                {cameraError ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                            <X className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Camera Error</h3>
                        <p className="text-zinc-400 mb-6">{cameraError}</p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-colors font-medium"
                        >
                            Close Camera
                        </button>
                    </div>
                ) : !imgSrc ? (
                    <>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: facingMode }}
                            className="w-full h-full object-cover"
                            onUserMediaError={handleCameraError}
                        />

                        {/* Camera Overlay Elements */}
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Subtle vignette instead of thick border */}
                            <div className="absolute inset-0 bg-radial-gradient-vignette opacity-20" />

                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[75%] border-2 border-white/50 rounded-lg">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1" />
                            </div>

                            {!cvLoaded && (
                                <div className="absolute top-8 left-0 right-0 flex justify-center">
                                    <div className="bg-yellow-500/90 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md">
                                        <Zap className="w-3 h-3" />
                                        <span>AI Engine Loading... (Basic Scan Active)</span>
                                    </div>
                                </div>
                            )}

                            <p className="absolute bottom-32 left-0 right-0 text-center text-white/80 font-medium text-sm">
                                Align medicines within frame
                            </p>
                        </div>

                        <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center">
                            <button
                                onClick={capture}
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group transition-all active:scale-95"
                            >
                                <div className="w-16 h-16 rounded-full bg-white group-hover:bg-indigo-500 transition-colors" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="relative w-full h-full bg-black flex flex-col">
                        {/* Image Preview Area */}
                        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                            {/* Hidden Canvas for Processing */}
                            <canvas id="processed-canvas" className="hidden" />

                            {isProcessing ? (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="mt-4 text-indigo-400 font-mono animate-pulse">{processingStage}</p>
                                </div>
                            ) : (
                                <img
                                    src={viewMode === "processed" ? (processedImg || imgSrc) : imgSrc}
                                    alt="Capture"
                                    className="max-w-full max-h-full object-contain"
                                    style={{ filter: viewMode === "processed" ? 'contrast(1.2) brightness(1.1)' : 'none' }}
                                />
                            )}

                            {/* View Toggle - Only show if not processing */}
                            {!isProcessing && processedImg && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/20">
                                    <button
                                        onClick={() => setViewMode("original")}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === "original" ? "bg-white text-black" : "text-white hover:text-white/80"
                                            }`}
                                    >
                                        Original
                                    </button>
                                    <button
                                        onClick={() => setViewMode("processed")}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${viewMode === "processed" ? "bg-indigo-600 text-white" : "text-white hover:text-white/80"
                                            }`}
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        Enhanced
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Action Bar */}
                        <div className="h-24 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-8">
                            <button
                                onClick={handleRetake}
                                className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                                disabled={isProcessing}
                            >
                                <RefreshCw className="w-6 h-6" />
                                <span className="text-xs">Retake</span>
                            </button>

                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Check className="w-5 h-5" />
                                Use Photo
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
