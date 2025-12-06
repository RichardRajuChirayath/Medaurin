"use client"

import { Loader2, Sparkles, Search, Database, Brain, Zap, Activity } from "lucide-react"

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-slide-up">
      {/* Main Spinner Container */}
      <div className="relative mb-16">
        {/* Outer Glow Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-3xl animate-pulse-glow" />

        {/* Rotating Rings */}
        <div className="relative w-40 h-40">
          {/* Base Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />

          {/* Gradient Ring 1 - Outer */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400 border-r-indigo-600 dark:border-r-indigo-400 animate-spin" />

          {/* Gradient Ring 2 - Middle */}
          <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-purple-600 dark:border-t-purple-400 border-r-purple-600 dark:border-r-purple-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />

          {/* Gradient Ring 3 - Inner */}
          <div className="absolute inset-6 rounded-full border-4 border-transparent border-t-pink-600 dark:border-t-pink-400 border-r-pink-600 dark:border-r-pink-400 animate-spin" style={{ animationDuration: '2s' }} />

          {/* Center Icon with Glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse-glow">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center space-y-4 mb-16">
        <h3 className="text-3xl font-black gradient-text-animated">
          Analyzing Your Medicines
        </h3>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl font-medium">
          Our AI is processing your image and checking FDA, RxNorm & NIH databases for interactions
        </p>
      </div>

      {/* Progress Steps */}
      <div className="w-full max-w-3xl space-y-5">
        <ProcessStep
          icon={Search}
          title="Extracting Medicine Names"
          description="Using advanced OCR to read labels from your photo"
          gradient="from-indigo-500 to-blue-600"
          delay={0}
        />
        <ProcessStep
          icon={Database}
          title="Analyzing Data"
          description="Retrieving official drug information from database"
          gradient="from-purple-500 to-pink-600"
          delay={0.15}
        />
        <ProcessStep
          icon={Brain}
          title="Analyzing Interactions"
          description="AI checking for potential risks and interactions"
          gradient="from-pink-500 to-rose-600"
          delay={0.3}
        />
      </div>

      {/* Animated Progress Bar */}
      <div className="w-full max-w-3xl mt-16">
        <div className="relative h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-shimmer" style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite'
          }} />
        </div>
        <div className="flex justify-between mt-3 text-xs font-bold text-slate-500 dark:text-slate-500">
          <span>Processing...</span>
          <span className="animate-pulse">Almost there...</span>
        </div>
      </div>
    </div>
  )
}

interface ProcessStepProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  gradient: string
  delay: number
}

function ProcessStep({ icon: Icon, title, description, gradient, delay }: ProcessStepProps) {
  return (
    <div
      className="group flex items-start gap-5 p-7 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 animate-slide-up"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Icon */}
      <div className="relative flex-shrink-0">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse`} />
        <div className={`relative w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-wide">{title}</h4>
          <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{description}</p>
      </div>

      {/* Animated Dots */}
      <div className="flex gap-1.5 items-center mt-2">
        <div className={`w-2.5 h-2.5 bg-gradient-to-br ${gradient} rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '0s' }} />
        <div className={`w-2.5 h-2.5 bg-gradient-to-br ${gradient} rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '0.2s' }} />
        <div className={`w-2.5 h-2.5 bg-gradient-to-br ${gradient} rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}
