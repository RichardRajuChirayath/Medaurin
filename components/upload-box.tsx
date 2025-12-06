"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Upload, Camera, FileImage, CheckCircle2, Sparkles, Image as ImageIcon } from "lucide-react"

interface UploadBoxProps {
  onUpload: (file: File) => void
  disabled?: boolean
}

export function UploadBox({ onUpload, disabled }: UploadBoxProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      onUpload(file)
    }
  }

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`group relative overflow-hidden rounded-3xl transition-all duration-500 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
      >
        {/* Animated Border Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl ${isDragActive ? "opacity-100 animate-pulse-glow" : ""
          }`} />

        {/* Main Container */}
        <div className={`relative border-3 rounded-3xl p-16 text-center transition-all duration-500 ${isDragActive
          ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 scale-[1.02] shadow-2xl neon-glow"
          : "border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-2xl"
          } ${disabled ? "" : "hover:scale-[1.01]"}`}
        >

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
            className="hidden"
            disabled={disabled}
          />

          <div className="flex flex-col items-center gap-8">
            {/* Icon Container with Particles */}
            <div className="relative">
              {/* Glow Effect */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-3xl transition-all duration-500 ${isDragActive ? "scale-150 opacity-50 animate-pulse-glow" : "scale-100"
                }`}
              />

              {/* Rotating Ring */}
              <div className={`absolute inset-0 w-32 h-32 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 transition-all duration-700 ${isDragActive ? "animate-rotate-gradient" : ""
                }`}
              />

              {/* Icon Background */}
              <div className={`relative w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center transition-all duration-500 shadow-2xl ${isDragActive ? "scale-110 rotate-6" : "group-hover:scale-105"
                }`}
              >
                {isDragActive ? (
                  <Upload className="w-16 h-16 text-white animate-bounce" />
                ) : preview ? (
                  <CheckCircle2 className="w-16 h-16 text-white animate-scale-in" />
                ) : (
                  <Camera className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
                )}

                {/* Sparkle Effect */}
                {!preview && (
                  <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-pulse" />
                )}
              </div>
            </div>

            {/* Text Content */}
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {isDragActive ? (
                  <span className="gradient-text-animated">Drop your image here</span>
                ) : preview ? (
                  <span className="text-green-600 dark:text-green-400">Image uploaded successfully!</span>
                ) : (
                  "Upload Medicine Photo"
                )}
              </h3>

              <p className="text-lg text-slate-700 dark:text-slate-300 max-w-lg mx-auto font-medium leading-relaxed">
                {isDragActive ? (
                  "Release to upload"
                ) : preview ? (
                  "Processing your image with AI..."
                ) : (
                  "Drag and drop your medicine photo here, or click to browse"
                )}
              </p>
            </div>

            {/* Preview Image */}
            {preview && (
              <div className="mt-6 rounded-3xl overflow-hidden border-4 border-indigo-500 shadow-2xl max-w-md animate-scale-in neon-glow">
                <img src={preview} alt="Preview" className="w-full h-auto" />
              </div>
            )}

            {/* Upload Button */}
            {!preview && !isDragActive && (
              <button
                type="button"
                className="group/btn mt-6 px-10 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-black rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl neon-glow-hover relative overflow-hidden"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick()
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 opacity-0 group-hover/btn:opacity-30 transition-opacity blur-xl" />
                <span className="flex items-center gap-3 relative z-10 text-lg">
                  <FileImage className="w-6 h-6" />
                  Choose File
                </span>
              </button>
            )}

            {/* File Info */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-700 dark:text-slate-300 mt-6 font-bold">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span>JPG, PNG, GIF</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                <span>Max 10MB</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                <span>Clear labels recommended</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Tips Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <TipCard
          number={1}
          title="Good Lighting"
          description="Ensure labels are clearly visible and well-lit"
          gradient="from-indigo-500 to-blue-600"
          delay={0}
        />
        <TipCard
          number={2}
          title="Focus on Names"
          description="Medicine names should be sharp and in focus"
          gradient="from-purple-500 to-pink-600"
          delay={0.1}
        />
        <TipCard
          number={3}
          title="Multiple Meds"
          description="Include all medicines in one clear photo"
          gradient="from-pink-500 to-rose-600"
          delay={0.2}
        />
      </div>
    </div>
  )
}

interface TipCardProps {
  number: number
  title: string
  description: string
  gradient: string
  delay: number
}

function TipCard({ number, title, description, gradient, delay }: TipCardProps) {
  return (
    <div
      className="group p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up hover:border-indigo-300 dark:hover:border-indigo-700"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300`} />
          <div className={`relative w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <span className="text-white font-black text-xl">{number}</span>
          </div>
        </div>
        <div>
          <h4 className="font-black text-slate-900 dark:text-white text-base mb-2 tracking-tight">{title}</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{description}</p>
        </div>
      </div>
    </div>
  )
}
