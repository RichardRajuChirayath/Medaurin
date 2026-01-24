"use client"

import { useState, useEffect } from "react"
import { UploadBox } from "@/components/upload-box"
import { ResultCard } from "@/components/result-card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Chatbot } from "@/components/chatbot"
import { SymptomChecker } from "@/components/symptom-checker"
import { BotProtection } from "@/components/bot-protection"
import { AuthButton } from "@/components/auth-button"

import { WelcomeModal } from "@/components/welcome-modal"
import { TypingAnimation } from "@/components/typing-animation"
import { Sparkles, Shield, Zap, Moon, Sun, Activity, Brain, Database } from "lucide-react"
import { toast } from "sonner"

interface AnalysisResult {
  status: "safe" | "caution" | "danger" | "unknown"
  score: number
  medicines: string[]
  analysisType: "photo" | "manual"
  interactions: Array<{
    from: string
    to: string
    severity: "high" | "moderate" | "low" | "unknown"
    description: string
  }>
  recommendations: string[]
  unknownMedicines?: string[]
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [manualMedicines, setManualMedicines] = useState("")
  const [analysisType, setAnalysisType] = useState<"photo" | "manual">("photo")
  const [isVerified, setIsVerified] = useState(false)
  const [shouldShake, setShouldShake] = useState(false)


  useEffect(() => {
    setMounted(true)
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const handleUpload = async (file: File) => {
    if (!isVerified) {
      setShouldShake(true)
      setTimeout(() => setShouldShake(false), 800)
      toast.error("Verification Required", {
        description: "Please click 'I'm not a robot' before scanning.",
        style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }
      })
      return
    }

    setAnalysisType("photo")
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("image", file)

      const ocrResponse = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      })

      if (!ocrResponse.ok) {
        throw new Error("Failed to extract text from image")
      }

      const ocrData = await ocrResponse.json()

      // Safety Check: Handle "Success: false" (Empty text or No meds)
      if (!ocrData.success) {
        console.warn(`[OCR] Analysis incomplete: ${ocrData.reason}`)

        // Show user-friendly toast instead of red error banner
        toast(ocrData.reason === "NO_VALID_MEDICINES" ? "Medicines not found" : "No text detected", {
          description: ocrData.message,
          icon: <span className="text-xl">⚠️</span>,
          style: { background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B' } // Warning Amber style
        })

        // Stop here, but don't throw error (prevents red banner)
        return
      }

      const medicines = ocrData.medicines || []
      const drugData = ocrData.drugData || []

      // Double check just in case
      if (medicines.length === 0) {
        toast.error("Analysis Failed", { description: "No medicines identified." })
        return
      }

      // Use pre-validated drug data directly from OCR response (efficient)
      const analysisResponse = await fetch("/api/analyzeMix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicines: drugData.map((d: any) => ({
            name: d.name,
            fdaText: d.fdaText,
            genericName: d.genericName,
            brandName: d.brandName,
            pharmClass: d.pharmClass,
          })),
        }),
      })

      if (!analysisResponse.ok) {
        throw new Error("Failed to analyze medicine mix")
      }

      const analysisResult = await analysisResponse.json()

      // Save to database
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicines: analysisResult.medicines,
          status: analysisResult.status,
          score: analysisResult.score,
          analysisType: "photo",
          interactions: analysisResult.interactions,
          recommendations: analysisResult.recommendations,
        }),
      }).catch(err => console.error("Failed to save:", err))

      setResult({
        ...analysisResult,
        analysisType: "photo"
      })

    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isVerified) {
      setShouldShake(true)
      setTimeout(() => setShouldShake(false), 800)
      toast.error("Verification Required", {
        description: "Please click 'I'm not a robot' before submitting.",
        style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }
      })
      return
    }

    setAnalysisType("manual")
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const medicines = manualMedicines.split(",").map((m) => m.trim()).filter(Boolean)
      if (medicines.length === 0) {
        throw new Error("Please enter at least one medicine name.")
      }

      const drugDataResponse = await fetch("/api/getDrugData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicines }),
      })

      if (!drugDataResponse.ok) {
        const errorData = await drugDataResponse.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || "Failed to fetch drug data";

        // If we have specific invalid medicines details, format them nicely
        if (errorData.invalidMedicines && Array.isArray(errorData.invalidMedicines)) {
          const details = errorData.invalidMedicines
            .map((m: any) => `${m.name}: ${m.reason}`)
            .join("\n");
          throw new Error(`${errorMessage}\n\n${details}`);
        }

        throw new Error(errorMessage)
      }

      const drugData = await drugDataResponse.json()

      const analysisResponse = await fetch("/api/analyzeMix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicines: drugData.map((d: any) => ({
            name: d.name,
            fdaText: d.fdaText,
            genericName: d.genericName,
            brandName: d.brandName,
            pharmClass: d.pharmClass,
          })),
        }),
      })

      if (!analysisResponse.ok) {
        throw new Error("Failed to analyze medicine mix")
      }

      const analysisResult = await analysisResponse.json()
      setResult({ ...analysisResult, analysisType: "manual" })

      // Save to database
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicines: analysisResult.medicines,
          status: analysisResult.status,
          score: analysisResult.score,
          analysisType: "manual",
          interactions: analysisResult.interactions,
          recommendations: analysisResult.recommendations,
        }),
      }).catch(err => console.error("Failed to save:", err))
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setIsVerified(false)
  }

  if (!mounted) return null

  return (
    <>
      <WelcomeModal />
      <main className="min-h-screen relative overflow-hidden">
        {/* ULTRA-ADVANCED ANIMATED BACKGROUND - WOW FACTOR */}
        <div className="fixed inset-0 -z-10">
          {/* Layer 1: Premium Base Gradient with Color Grading */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-indigo-950/90 dark:to-purple-950/80" />

          {/* Layer 2: Animated Mesh Gradient Overlay */}
          <div className="absolute inset-0 opacity-20 dark:opacity-40">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-300/40 via-blue-400/30 to-transparent animate-gradient-shift" />
            <div className="absolute inset-0 bg-gradient-to-bl from-purple-400/40 via-pink-400/30 to-transparent animate-gradient-shift-reverse" />
            <div className="absolute inset-0 bg-gradient-to-tl from-indigo-400/30 via-violet-400/25 to-transparent animate-gradient-pulse" />
          </div>

          {/* Layer 3: Large Floating Orbs with Advanced Blur */}
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/20 to-blue-500/10 dark:from-cyan-600/25 dark:to-blue-700/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[100px] animate-float-slow" />
          <div className="absolute top-1/4 -right-40 w-[700px] h-[700px] bg-gradient-to-br from-purple-400/20 to-pink-500/10 dark:from-purple-600/25 dark:to-pink-700/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[120px] animate-float-slow" style={{ animationDelay: '3s', animationDuration: '25s' }} />
          <div className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] bg-gradient-to-br from-indigo-400/20 to-violet-500/10 dark:from-indigo-600/25 dark:to-violet-700/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[110px] animate-float-slow" style={{ animationDelay: '6s', animationDuration: '30s' }} />
          <div className="absolute top-2/3 right-1/4 w-[550px] h-[550px] bg-gradient-to-br from-rose-400/15 to-orange-500/10 dark:from-rose-600/20 dark:to-orange-700/15 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[90px] animate-float-slow" style={{ animationDelay: '9s', animationDuration: '28s' }} />

          {/* Layer 4: Medium Floating Particles */}
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-300/50 to-cyan-400/40 dark:from-blue-500/30 dark:to-cyan-600/25 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[60px] animate-float-bubble" />
          <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-gradient-to-br from-violet-300/50 to-purple-400/40 dark:from-violet-500/30 dark:to-purple-600/25 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[70px] animate-float-bubble" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 right-1/2 w-56 h-56 bg-gradient-to-br from-pink-300/50 to-rose-400/40 dark:from-pink-500/30 dark:to-rose-600/25 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[50px] animate-float-bubble" style={{ animationDelay: '4s' }} />

          {/* Layer 5: Small Accent Particles */}
          <div className="absolute top-20 left-1/2 w-40 h-40 bg-gradient-to-br from-amber-300/60 to-yellow-400/50 dark:from-amber-500/35 dark:to-yellow-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[40px] animate-float-bubble" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-1/4 w-48 h-48 bg-gradient-to-br from-teal-300/60 to-emerald-400/50 dark:from-teal-500/35 dark:to-emerald-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[45px] animate-float-bubble" style={{ animationDelay: '3s' }} />
          <div className="absolute top-40 right-1/4 w-44 h-44 bg-gradient-to-br from-fuchsia-300/60 to-purple-400/50 dark:from-fuchsia-500/35 dark:to-purple-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[42px] animate-float-bubble" style={{ animationDelay: '5s' }} />

          {/* Layer 6: Animated Light Rays */}
          <div className="absolute inset-0 opacity-30 dark:opacity-20">
            <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-transparent via-blue-400/40 to-transparent animate-light-ray" />
            <div className="absolute top-0 left-1/2 w-1 h-full bg-gradient-to-b from-transparent via-purple-400/40 to-transparent animate-light-ray" style={{ animationDelay: '2s' }} />
            <div className="absolute top-0 left-3/4 w-1 h-full bg-gradient-to-b from-transparent via-pink-400/40 to-transparent animate-light-ray" style={{ animationDelay: '4s' }} />
          </div>

          {/* Layer 7: Dynamic Grid Pattern with Glow */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f615_1px,transparent_1px),linear-gradient(to_bottom,#3b82f615_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#3b82f608_1px,transparent_1px),linear-gradient(to_bottom,#3b82f608_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)]" />

          {/* Layer 8: Radial Glow Spots */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full filter blur-[80px] animate-pulse-glow" />
            <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/10 rounded-full filter blur-[80px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
          </div>

          {/* Layer 9: Noise Texture Overlay for Film Grain Effect */}
          <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025] bg-noise mix-blend-overlay" />

          {/* Layer 10: Vignette Effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        </div>

        {/* PREMIUM GLASSMORPHIC HEADER */}
        <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/70 dark:bg-slate-900/70 border-b border-white/30 dark:border-slate-700/30 shadow-xl shadow-indigo-500/5 dark:shadow-purple-500/10">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 relative">
            <div className="flex items-center justify-between">
              {/* Logo & Brand Section */}
              <div className="flex items-center gap-4">
                {/* Animated Logo with Premium Glow - LEGENDARY SIZE */}
                <div className="relative group cursor-pointer -ml-2">
                  {/* Extreme outer glow */}
                  <div className="absolute inset-x-0 -inset-y-4 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-full blur-[40px] opacity-0 group-hover:opacity-40 transition-all duration-700 animate-pulse-glow" />

                  {/* Logo container - Neural Sphere Backdrop for visibility */}
                  <div className="relative transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-700 flex items-center justify-center">
                    {/* The "Safe Light" Sphere - Ensures logo visibility in light mode */}
                    <div className="absolute inset-2 bg-slate-900/90 dark:bg-slate-800/40 rounded-full blur-md" />
                    <div className="absolute inset-0 bg-slate-900/80 dark:bg-transparent rounded-2xl backdrop-blur-sm border border-white/10 shadow-inner md:hidden" />

                    <img
                      src="/logo.png"
                      alt="Medaurin Logo"
                      className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-[0_0_20px_rgba(124,58,237,0.6)] animate-float relative z-10"
                      style={{ mixBlendMode: 'screen' }}
                    />

                    {/* Shine effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none z-20" />
                  </div>

                  {/* Active Pulse indicator */}
                  <div className="absolute bottom-4 right-4 w-5 h-5 bg-gradient-to-br from-emerald-400 to-green-600 border-4 border-white dark:border-slate-950 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-pulse" />
                </div>

                {/* Brand Text */}
                <div className="flex flex-col">
                  <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent drop-shadow-sm">
                    Medaurin
                  </h1>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-400 tracking-wide uppercase">
                      AI Medicine Safety
                    </p>
                    {/* Pro badge */}
                    <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] md:text-[10px] font-black rounded-full shadow-md">
                      PRO
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Section - Auth & Dark Mode Toggle */}
              <div className="flex items-center gap-3">
                <AuthButton />

                <button
                  onClick={toggleDarkMode}
                  className="relative group p-3.5 rounded-xl backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-purple-500 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl"
                  aria-label="Toggle dark mode"
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 dark:from-indigo-500 dark:to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />

                  {/* Icon */}
                  <div className="relative z-10">
                    {darkMode ? (
                      <Sun className="w-5 h-5 text-amber-500 group-hover:rotate-180 transition-transform duration-500" />
                    ) : (
                      <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />
                    )}
                  </div>

                  {/* Tooltip */}
                  <div className="absolute -bottom-10 right-0 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        </header>

        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {!result && !loading && (
            <div className="animate-slide-down">
              {/* Hero Section */}
              <div className="text-center mb-16 space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-indigo-200 dark:border-indigo-800 rounded-full text-indigo-700 dark:text-indigo-300 text-sm font-bold mb-6 animate-scale-in shadow-lg hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4 animate-pulse text-amber-500" />
                  <span>Powered by FDA, RxNorm & NIH APIs</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                </div>

                {/* Main Heading */}
                <h2 className="text-3xl sm:text-4xl md:text-7xl font-heading font-black text-foreground leading-tight tracking-tight drop-shadow-sm px-2">
                  Check If Your Medicines
                  <br />
                  <span className="text-gradient-primary inline-block filter drop-shadow-sm">
                    <TypingAnimation
                      words={["Aspirin", "Metformin", "Ibuprofen", "Dolo", "Crocin", "Paracetamol"]}
                    />
                  </span>
                  <br />
                  <span className="text-gradient-primary inline-block filter drop-shadow-sm">
                    Are Safe Together
                  </span>
                </h2>

                {/* Subheading */}
                <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium text-fade-in px-4">
                  Upload a photo of your medicines to get instant safety analysis using FDA, RxNorm & NIH databases.
                  Our AI analyzes potential interactions in <span className="font-bold text-primary">seconds</span>.
                </p>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
                  <FeatureCard
                    icon={Zap}
                    title="Lightning Fast"
                    description="Get results in under 5 seconds"
                    gradient="from-yellow-500 to-orange-600"
                    delay={0}
                  />
                  <FeatureCard
                    icon={Database}
                    title="Multi-Source Verified"
                    description="Official drug interaction database"
                    gradient="from-blue-500 to-indigo-600"
                    delay={0.1}
                  />
                  <FeatureCard
                    icon={Brain}
                    title="AI-Powered"
                    description="Advanced machine learning analysis"
                    gradient="from-purple-500 to-pink-600"
                    delay={0.2}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-8 p-6 glass dark:glass-dark border-2 border-red-300 dark:border-red-800 rounded-3xl backdrop-blur-xl animate-scale-in neon-glow shadow-2xl">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-white text-lg font-black">!</span>
                    </div>
                    <div>
                      <h4 className="font-black text-red-900 dark:text-red-300 mb-2 text-lg">Error Occurred</h4>
                      <p className="text-red-700 dark:text-red-400 font-medium whitespace-pre-wrap">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-8 max-w-xl mx-auto">
                <BotProtection onVerified={setIsVerified} isVerified={isVerified} shouldShake={shouldShake} />
              </div>

              {/* Upload Box */}
              <UploadBox onUpload={handleUpload} disabled={loading} />

              {/* Manual Input Section */}
              <div className="mt-12 text-center">
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
                  Or, enter medicine names manually
                </p>
                <form onSubmit={handleManualSubmit} className="max-w-xl mx-auto px-2">
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    <input
                      type="text"
                      value={manualMedicines}
                      onChange={(e) => setManualMedicines(e.target.value)}
                      placeholder="e.g., Aspirin, Metformin, Lipitor"
                      className="w-full px-6 py-4 text-lg text-slate-900 dark:text-white bg-white/80 dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 shadow-sm placeholder:text-slate-400"
                      disabled={loading}
                    />

                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 sm:mt-6 w-full sm:w-auto group relative inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-black rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-30 transition-opacity blur-xl" />
                    <span className="relative z-10 text-lg">Analyze Medicines</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && <LoadingSpinner />}

          {/* Result State */}
          {result && (
            <div className="animate-slide-up">
              <ResultCard
                result={result}
                analysisType={analysisType}
              />

              <SymptomChecker result={result} />

              <div className="text-center mt-12">
                <button
                  onClick={handleReset}
                  className="group w-full sm:w-auto relative inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-black rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-30 transition-opacity blur-xl" />
                  <Activity className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10 text-lg">Check Another Photo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Premium Footer */}
        <footer className="mt-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-white/50 dark:border-slate-700/50 shadow-2xl relative z-10">
          <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
            <div className="text-center space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Powered by FDA, RxNorm (NIH) & NIH Drug Interaction APIs.</span>
                </div>
                <span className="hidden md:inline text-slate-400">•</span>
                <span className="font-black text-slate-900 dark:text-white bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded text-amber-700 dark:text-amber-400">Not medical advice.</span>
                <span className="hidden md:inline text-slate-400">•</span>
                <span>Always consult a healthcare provider.</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 font-semibold tracking-wide">
                Built with ❤️ in INDIA.
              </p>
            </div>
          </div>
        </footer>
        <Chatbot context={result} />
      </main>
    </>
  )
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  gradient: string
  delay: number
}

function FeatureCard({ icon: Icon, title, description, gradient, delay }: FeatureCardProps) {
  return (
    <div
      className="group p-8 rounded-3xl glass-card hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 hover:border-primary/50 animate-scale-in flex flex-col items-center text-center"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="relative mb-6 group-hover:scale-110 transition-transform duration-500">
        {/* Refined Glow Effect */}
        <div className={`absolute -inset-4 bg-gradient-to-br ${gradient} rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />

        {/* Icon Container */}
        <div className={`relative w-20 h-20 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-xl`}>
          <Icon className="w-10 h-10 text-white drop-shadow-md" />

          {/* Shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>
      <h3 className="font-heading font-black text-foreground mb-3 text-xl tracking-tight">{title}</h3>
      <p className="text-base text-muted-foreground leading-relaxed font-medium">{description}</p>
    </div>
  )
}

