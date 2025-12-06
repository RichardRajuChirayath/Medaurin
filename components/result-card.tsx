"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2, AlertTriangle, Pill, ArrowRight, TrendingUp, Shield, Info, Download } from "lucide-react"
import { InteractionList } from "./interaction-list"
import { FDAInfoSection } from "./fda-info-section"
import { SpeakButton } from "./speak-button"

interface ResultProps {
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
  medicineDetails?: Array<{
    name: string
    fdaText: string
    genericName?: string[]
    brandName?: string[]
    pharmClass?: string[]
    sideEffects?: string[]
    isUnknown?: boolean
  }>
  riskBreakdown?: {
    interactionScore: number
    polypharmacyScore: number
    drugClassScore: number
    cumulativeRisk: number
    multiplier: number
    factors: string[]
  }
  sameDrugDetected?: boolean
}

export function ResultCard(props: { result: ResultProps; analysisType: "photo" | "manual"; autoSpeak?: boolean }) {
  const { status, score, medicines, interactions, recommendations, medicineDetails } = props.result
  const { analysisType, autoSpeak } = props
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      console.log('Starting PDF generation...')
      console.log('Sending data:', props.result)

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(props.result),
      });

      console.log('PDF API Response status:', response.status)
      console.log('PDF API Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("PDF generation failed:", errorData);
        throw new Error(errorData.details || errorData.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      console.log('PDF blob created, size:', blob.size, 'bytes')
      console.log('PDF blob type:', blob.type)

      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "medicine-interaction-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      console.log('PDF download triggered successfully')
    } catch (error) {
      console.error("Download error:", error);
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false)
    }
  }

  const statusConfig = {
    safe: {
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50",
      borderColor: "border-emerald-300 dark:border-emerald-800",
      glowColor: "shadow-emerald-500/20",
      label: "SAFE TO USE",
      description: "No significant interactions detected between your medicines",
      emoji: "✅",
    },
    caution: {
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50",
      borderColor: "border-amber-300 dark:border-amber-800",
      glowColor: "shadow-amber-500/20",
      label: "USE WITH CAUTION",
      description: "Potential interactions detected. Please consult your healthcare provider",
      emoji: "⚠️",
    },
    danger: {
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50",
      borderColor: "border-red-300 dark:border-red-800",
      glowColor: "shadow-red-500/20",
      label: "SERIOUS RISK",
      description: "Dangerous interactions detected. Do NOT combine without immediate medical supervision",
      emoji: "🚨",
    },
    unknown: {
      icon: AlertCircle,
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50",
      borderColor: "border-slate-300 dark:border-slate-800",
      glowColor: "shadow-slate-500/20",
      label: "UNKNOWN MEDICINE",
      description: "One or more medicines could not be identified in our databases.",
      emoji: "❓",
    },
  }

  const config = statusConfig[status]
  const IconComponent = config.icon

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Main Status Card */}
      <div className={`relative overflow-hidden border-2 rounded-3xl p-8 md:p-12 ${config.bgColor} ${config.borderColor} shadow-2xl ${config.glowColor} animate-scale-in`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            {/* Icon with Glow */}
            <div className="relative">
              <div className={`absolute inset-0 rounded-2xl blur-2xl opacity-40 ${config.glowColor}`} />
              <div className={`relative w-20 h-20 bg-gradient-to-br ${status === 'safe' ? 'from-emerald-500 to-green-600' :
                status === 'caution' ? 'from-amber-500 to-yellow-600' :
                  'from-red-500 to-rose-600'
                } rounded-2xl flex items-center justify-center shadow-xl`}>
                <IconComponent className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Status Text */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{config.emoji}</span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight text-shadow-lg">
                  {config.label}
                </h2>
              </div>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                {config.description}
              </p>
            </div>

            {/* Download and Speak Buttons */}
            <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3">
              <SpeakButton
                text={`Analysis complete. Status: ${config.label}. ${config.description}. Risk score: ${score} out of 100. ${medicines.length} medicines analyzed: ${medicines.join(', ')}. ${interactions.length > 0 ? `${interactions.length} interactions found.` : 'No significant interactions detected.'} ${recommendations.length > 0 ? `Recommendations: ${recommendations.join('. ')}` : ''}`}
                label="Listen"
                className="px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-slate-800 dark:text-white"
                autoSpeak={autoSpeak}
              />
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="group flex items-center justify-center gap-3 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/50"
              >
                {isDownloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download Report</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Risk Score */}
          {status !== 'unknown' && !props.result.sameDrugDetected && (
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Advanced Risk Assessment
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">{score}</span>
                  <span className="text-xl font-bold text-slate-500 dark:text-slate-400">/100</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${score <= 39
                    ? "bg-gradient-to-r from-emerald-500 to-green-600"
                    : score <= 69
                      ? "bg-gradient-to-r from-amber-500 to-yellow-600"
                      : "bg-gradient-to-r from-red-500 to-rose-600"
                    }`}
                  style={{ width: `${score}%` }}
                />
              </div>

              {/* Score Labels */}
              <div className="flex justify-between mt-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Low Risk</span>
                <span>Medium Risk</span>
                <span>High Risk</span>
              </div>

              {/* Advanced Risk Breakdown */}
              {props.result.riskBreakdown && (
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    Score Breakdown
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-center">
                      <div className="text-lg font-black text-orange-600 dark:text-orange-400">
                        {Math.round(props.result.riskBreakdown.interactionScore)}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 font-semibold">Interactions</div>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-center">
                      <div className="text-lg font-black text-purple-600 dark:text-purple-400">
                        {props.result.riskBreakdown.polypharmacyScore}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 font-semibold">Polypharmacy</div>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-center">
                      <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                        {Math.round(props.result.riskBreakdown.drugClassScore)}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 font-semibold">Drug Class</div>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-center">
                      <div className="text-lg font-black text-red-600 dark:text-red-400">
                        ×{props.result.riskBreakdown.multiplier.toFixed(2)}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 font-semibold">Multiplier</div>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  {props.result.riskBreakdown.factors.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                        Detected Risk Factors
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {props.result.riskBreakdown.factors.slice(0, 5).map((factor, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-1 rounded-full text-[10px] font-bold ${factor.includes('high') || factor.includes('DANGER') || factor.includes('⚠️')
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : factor.includes('CNS') || factor.includes('Blood')
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Medicines Grid */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white gradient-text-blue">
              {analysisType === "photo" ? "Detected Medicines" : "Entered Medicines"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {medicines.length} {medicines.length === 1 ? 'medicine' : 'medicines'}{" "}
              {analysisType === "photo" ? "identified from your photo" : "analyzed"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {medicines.map((medicine, index) => (
            <div
              key={medicine}
              className="group flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-sm">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-slate-900 dark:text-white font-bold text-lg block truncate">
                  {medicine}
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>

      {/* FDA Information */}
      {medicineDetails && medicineDetails.length > 0 && (
        <FDAInfoSection medicineDetails={medicineDetails} />
      )}

      {/* Interactions */}
      {interactions.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <InteractionList interactions={interactions} />
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-2 border-blue-300 dark:border-blue-800 rounded-3xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                Safety Recommendations
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Important guidelines for safe medication use
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl border border-blue-200 dark:border-blue-800/50"
              >
                <div className="w-6 h-6 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white font-bold text-xs">{idx + 1}</span>
                </div>
                <p className="text-blue-900 dark:text-blue-200 leading-relaxed flex-1">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-bold">Medical Disclaimer:</span> This analysis is based on FDA, RxNorm & NIH databases with AI processing.
            It is <span className="font-bold">not a substitute for professional medical advice</span>.
            Always consult with your healthcare provider before making any changes to your medication regimen.
          </div>
        </div>
      </div>
    </div>
  )
}
