"use client"

import { useState } from "react"
import { AlertCircle, ArrowRightLeft, AlertTriangle, FileText, Info, ChevronDown, PlusCircle, MinusCircle } from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Interaction {
  from: string
  to: string
  severity: "high" | "moderate" | "low" | "unknown"
  description: string
  source?: string
}

interface InteractionListProps {
  interactions: Interaction[]
}

export function InteractionList({ interactions }: InteractionListProps) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const toggleExpanded = (idx: number) => {
    setExpanded(expanded === idx ? null : idx)
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "high":
        return {
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-100 dark:bg-red-900/30",
          borderColor: "border-red-200 dark:border-red-800",
          badgeColor: "bg-red-600",
          label: "High Risk",
          icon: AlertCircle,
        }
      case "moderate":
        return {
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-100 dark:bg-amber-900/30",
          borderColor: "border-amber-200 dark:border-amber-800",
          badgeColor: "bg-amber-600",
          label: "Moderate Risk",
          icon: AlertTriangle,
        }
      case "low":
        return {
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          borderColor: "border-blue-200 dark:border-blue-800",
          badgeColor: "bg-blue-600",
          label: "Low Risk",
          icon: Info,
        }
      default:
        return {
          color: "text-slate-600 dark:text-slate-400",
          bgColor: "bg-slate-100 dark:bg-slate-900/30",
          borderColor: "border-slate-200 dark:border-slate-800",
          badgeColor: "bg-slate-600",
          label: "Unknown Risk",
          icon: Info,
        }
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
          <AlertTriangle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Drug Interactions Detected
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {interactions.length} potential {interactions.length === 1 ? 'interaction' : 'interactions'} found via NIH & FDA databases
          </p>
        </div>
      </div>

      {/* Interactions List */}
      <div className="space-y-4">
        {interactions.map((interaction, idx) => {
          const config = getSeverityConfig(interaction.severity)
          const Icon = config.icon

          const isExpanded = expanded === idx

          return (
            <Card
              key={idx}
              className={`group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 ${config.borderColor} rounded-2xl hover:shadow-xl hover:scale-[1.01] transition-all duration-300`}
            >
              <CardHeader className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Severity Badge */}
                <div className={`self-start md:self-center px-3 py-1 rounded-full text-xs font-bold text-white ${config.badgeColor} shadow-sm uppercase tracking-wide`}>
                  {config.label}
                </div>

                {/* Medicine Names */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {interaction.from}
                    </span>
                  </div>

                  <div className="flex-shrink-0">
                    <ArrowRightLeft className="w-5 h-5 text-slate-400" />
                  </div>

                  <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {interaction.to}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className={`${config.bgColor} rounded-xl p-4 border ${config.borderColor} transition-all`}>
                <div className="flex items-start gap-3">
                  <FileText className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={`font-bold ${config.color} text-sm`}>
                        {interaction.source?.includes('NIH') ? 'NIH Verified' : 'FDA Information'}:
                      </h4>
                      {interaction.source && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-full">
                          {interaction.source.includes('NIH') ? '✓ NIH API' : 'FDA Label'}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm ${config.color} leading-relaxed opacity-90 transition-all duration-300 ease-in-out ${isExpanded ? "line-clamp-none" : "line-clamp-4"
                        }`}
                    >
                      {interaction.description}
                    </p>
                  </div>
                </div>
              </CardContent>

              {interaction.description.length > 100 && ( // Show button if text is reasonably long
                <CardFooter>
                  <Button
                    variant="link"
                    onClick={() => toggleExpanded(idx)}
                    className="w-full text-left text-indigo-600 dark:text-indigo-400 font-bold text-sm mt-3 flex items-center gap-2 group"
                  >
                    {isExpanded ? (
                      <>
                        <MinusCircle className="w-4 h-4" />
                        <span>Hide Full Warning</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>View Full FDA Warning</span>
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          )
        })}
      </div>

      {/* Warning Footer */}
      <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-bold">Important:</span> These interactions are identified from FDA, RxNorm & NIH data.
            The severity and clinical significance may vary. Please consult your healthcare provider for personalized advice.
          </p>
        </div>
      </div>
    </div>
  )
}
