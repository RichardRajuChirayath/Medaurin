"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Loader2, Download, Check, X, HardDriveDownload } from "lucide-react"
import { AudioVisualizer } from "./audio-visualizer"

interface VoiceInputProps {
    onTranscript: (text: string) => void
    onCommand?: (command: string) => void
    isProcessing?: boolean
}

export function VoiceInput({ onTranscript, onCommand, isProcessing = false }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false)
    const [modelStatus, setModelStatus] = useState<'not_loaded' | 'loading' | 'ready'>('not_loaded')
    const [progress, setProgress] = useState(0)
    const [downloadDetails, setDownloadDetails] = useState({ loaded: 0, total: 0 })
    const [error, setError] = useState<string | null>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [statusText, setStatusText] = useState<string>("")

    const worker = useRef<Worker | null>(null)
    const mediaRecorder = useRef<MediaRecorder | null>(null)
    const audioChunks = useRef<Blob[]>([])

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            worker.current?.terminate()
        }
    }, [])

    const initWorker = () => {
        if (!worker.current) {
            try {
                // Create worker from public file (bypassing bundler)
                worker.current = new Worker(
                    '/whisper-worker.js',
                    { type: 'module' }
                )

                worker.current.onerror = (error) => {
                    console.error("Worker error:", error)
                    setError("Failed to initialize voice worker. Please refresh the page.")
                    setModelStatus('not_loaded')
                    setIsListening(false)
                }

                worker.current.onmessage = (event) => {
                    const { type, data } = event.data

                    switch (type) {
                        case 'download':
                            if (data.status === 'progress') {
                                const progressVal = data.progress || 0
                                setProgress(progressVal)

                                // If loaded/total are available (Transformers.js usually provides them)
                                if (data.loaded && data.total) {
                                    setDownloadDetails({ loaded: data.loaded, total: data.total })
                                }

                                setStatusText(`Downloading... ${Math.round(progressVal)}%`)
                            } else if (data.status === 'done') {
                                setStatusText("Model ready!")
                            } else if (data.status === 'initiate') {
                                setModelStatus('loading')
                                setStatusText("Starting download...")
                            }
                            break

                        case 'ready':
                            setModelStatus('ready')
                            setStatusText("Ready")
                            break

                        case 'result':
                            const text = data.trim()
                            if (text) {
                                const lowerText = text.toLowerCase()
                                if (lowerText.includes('clear') || lowerText.includes('reset')) {
                                    onCommand?.('clear')
                                } else if (lowerText.includes('analyze') || lowerText.includes('check')) {
                                    onCommand?.('analyze')
                                } else {
                                    onTranscript(text)
                                }
                            }
                            setIsListening(false)
                            setStatusText("Ready")
                            break

                        case 'error':
                            setError(data)
                            setIsListening(false)
                            setModelStatus('not_loaded')
                            break
                    }
                }
            } catch (err) {
                console.error("Failed to create worker:", err)
                setError("Worker creation failed")
            }
        }
    }

    const startModelDownload = () => {
        try {
            initWorker()
            setModelStatus('loading')
            setStatusText("Initializing...")

            // Small delay to ensure worker is ready
            setTimeout(() => {
                if (worker.current) {
                    worker.current.postMessage({ type: 'load' })
                }
            }, 100)
        } catch (err) {
            console.error("Error starting download:", err)
            setError("Failed to start download")
            setModelStatus('not_loaded')
        }
    }

    const startRecording = async () => {
        try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
            setStream(audioStream)

            mediaRecorder.current = new MediaRecorder(audioStream)
            audioChunks.current = []

            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data)
            }

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
                const arrayBuffer = await audioBlob.arrayBuffer()
                const audioContext = new AudioContext({ sampleRate: 16000 })
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

                // Get channel data
                const audioData = audioBuffer.getChannelData(0)

                setStatusText("Transcribing...")
                worker.current?.postMessage({
                    type: 'generate',
                    audio: audioData
                })

                // Stop all tracks to release microphone
                audioStream.getTracks().forEach(track => track.stop())
                setStream(null)
            }

            mediaRecorder.current.start()
            setIsListening(true)
            setStatusText("Listening...")
            setError(null)
        } catch (err) {
            console.error("Error accessing microphone:", err)
            setError("Microphone access denied")
        }
    }

    const stopRecording = () => {
        if (mediaRecorder.current && isListening) {
            mediaRecorder.current.stop()
            setIsListening(false)
        }
    }

    const toggleListening = () => {
        if (modelStatus !== 'ready') {
            startModelDownload()
            return
        }

        if (isListening) {
            stopRecording()
        } else {
            startRecording()
        }
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 MB'
        const mb = bytes / (1024 * 1024)
        return `${mb.toFixed(1)} MB`
    }

    return (
        <div className="relative flex flex-col items-center">
            <div className="relative">
                {/* Visualizer Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <AudioVisualizer stream={stream} isListening={isListening} />
                </div>

                <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isProcessing || modelStatus === 'loading'}
                    className={`
            relative z-10 group flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300
            ${isListening
                            ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/20 ring-4 ring-indigo-100 dark:ring-indigo-900/30'
                            : error
                                ? 'bg-red-50 text-red-500 border-2 border-red-200'
                                : modelStatus === 'not_loaded'
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-200 dark:border-indigo-800 border-dashed'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                        }
          `}
                    title={modelStatus === 'not_loaded' ? "Download Voice Model" : "Voice Input"}
                >
                    {modelStatus === 'loading' ? (
                        <div className="relative">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                            {/* Progress Ring */}
                            <svg className="absolute -top-1 -left-1 w-8 h-8 rotate-[-90deg]" viewBox="0 0 36 36">
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#e2e8f0"
                                    strokeWidth="2"
                                />
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#6366f1"
                                    strokeWidth="2"
                                    strokeDasharray={`${progress}, 100`}
                                />
                            </svg>
                        </div>
                    ) : modelStatus === 'not_loaded' ? (
                        <HardDriveDownload className="w-6 h-6 animate-bounce" />
                    ) : isListening ? (
                        <div className="relative">
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900" />
                            <Mic className="w-6 h-6" />
                        </div>
                    ) : (
                        <Mic className={`w-6 h-6 ${error ? 'text-red-500' : ''}`} />
                    )}
                </button>
            </div>

            {/* Status Popover */}
            {(isListening || modelStatus === 'loading' || error || (modelStatus === 'not_loaded' && !error)) && (
                <div className={`
          absolute top-full mt-4 left-1/2 -translate-x-1/2 w-64 p-3 rounded-xl 
          bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 
          shadow-xl z-50 animate-slide-up text-center
        `}>
                    {error ? (
                        <div className="flex items-center justify-center gap-2 text-red-500 font-medium text-sm">
                            <X className="w-4 h-4" />
                            {error}
                        </div>
                    ) : modelStatus === 'loading' ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                                <Download className="w-3 h-3 animate-bounce" />
                                Downloading Model
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                <div
                                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                <span>{Math.round(progress)}%</span>
                                <span>{downloadDetails.total > 0 ? `${formatBytes(downloadDetails.loaded)} / ${formatBytes(downloadDetails.total)}` : 'Calculating...'}</span>
                            </div>
                        </div>
                    ) : modelStatus === 'not_loaded' ? (
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-800 dark:text-white">Enable Voice Input</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Click to download AI model (~40MB).<br />One-time download, works offline.
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 font-medium text-sm">
                            {isListening ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    {statusText}
                                </span>
                            ) : (
                                statusText
                            )}
                        </div>
                    )}

                    {/* Arrow */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 dark:bg-slate-800/90 border-t border-l border-slate-200 dark:border-slate-700 rotate-45" />
                </div>
            )}
        </div>
    )
}
