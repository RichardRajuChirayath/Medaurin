"use client"

import { useState } from "react"
import { Camera, Sparkles, ScanLine, Zap, CheckCircle2 } from "lucide-react"
import { SmartCamera } from "@/components/smart-camera"

interface UploadBoxProps {
  onUpload: (file: File) => void
  disabled?: boolean
}

export function UploadBox({ onUpload, disabled }: UploadBoxProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Smart Camera Modal */}
      {isCameraOpen && (
        <SmartCamera
          onCapture={(file) => {
            handleFile(file)
            setIsCameraOpen(false)
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* Main Action Area */}
      <div className="relative group">

        {/* Animated Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-60 transition-all duration-500 animate-pulse-glow" />

        <div className={`relative bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-12 text-center overflow-hidden transition-all duration-500 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.01] hover:border-indigo-500/50"}`}>

          {/* Decorative Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

          <div className="relative z-10 flex flex-col items-center gap-8">

            {preview ? (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-indigo-500/50 max-w-md mx-auto animate-scale-in">
                <img src={preview} alt="Preview" className="w-full h-auto" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center p-4">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span>Image Captured</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Big Smart Scan Button */}
                <button
                  onClick={() => setIsCameraOpen(true)}
                  disabled={disabled}
                  className="group/btn relative w-full max-w-md mx-auto aspect-video flex flex-col items-center justify-center bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-yellow-400/50 rounded-3xl transition-all duration-500 shadow-2xl hover:shadow-[0_0_50px_rgba(234,179,8,0.2)] overflow-hidden"
                >
                  {/* Internal Glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/0 to-yellow-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10 flex flex-col items-center gap-4 group-hover/btn:scale-105 transition-transform duration-500">
                    <div className="relative">
                      <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-20 animate-pulse" />
                      <Camera className="w-20 h-20 text-yellow-400 drop-shadow-lg" />
                      <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-white animate-bounce" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-white tracking-tight">Smart Scan</h3>
                      <p className="text-zinc-400 font-medium">Tap to analyze medicines</p>
                    </div>
                  </div>

                  {/* Tech Lines */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  {/* Scanning Animation Line */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-scan-line opacity-0 group-hover/btn:opacity-100 placeholder-opacity-0" />
                </button>

                <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>AI Enhanced</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-zinc-600" />
                  <div className="flex items-center gap-1.5">
                    <ScanLine className="w-4 h-4 text-indigo-500" />
                    <span>Instant Analysis</span>
                  </div>
                </div>
              </>
            )}
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
      className="group p-6 rounded-2xl glass-card hover:-translate-y-1 transition-all duration-300 animate-slide-up hover:border-primary/50"
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
          <h4 className="font-black text-foreground text-base mb-2 tracking-tight">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">{description}</p>
        </div>
      </div>
    </div>
  )
}
