"use client"

import { useState } from "react"
import { Info, Shield, ChevronDown, ChevronUp } from "lucide-react"

interface MedicineDetail {
    name: string
    fdaText: string
    genericName?: string[]
    brandName?: string[]
    pharmClass?: string[]
    sideEffects?: string[]
    isUnknown?: boolean
}

interface FDAInfoSectionProps {
    medicineDetails: MedicineDetail[]
}

export function FDAInfoSection({ medicineDetails }: FDAInfoSectionProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

    if (!medicineDetails || medicineDetails.length === 0) {
        return null
    }

    const toggleExpand = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index)
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-2 border-blue-300 dark:border-blue-800 rounded-3xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        Drug Database Information
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                        Click "Show Details" to view data from FDA, RxNorm & NIH databases
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {medicineDetails.map((med, idx) => {
                    const isExpanded = expandedIndex === idx
                    const hasData = !med.isUnknown && med.fdaText && med.fdaText.length > 0 &&
                        !med.fdaText.includes('No FDA data') && !med.fdaText.includes('Unable to fetch')

                    return (
                        <div
                            key={idx}
                            className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl border border-blue-200 dark:border-blue-800/50 overflow-hidden transition-all duration-300"
                        >
                            {/* Header - Always Visible */}
                            <div className="flex items-center justify-between p-5">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                                        <span className="text-white font-bold text-sm">{idx + 1}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-xl font-bold text-blue-900 dark:text-blue-200">
                                            {med.name}
                                        </h4>
                                        {med.isUnknown ? (
                                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                                ⚠️ No database data available
                                            </p>
                                        ) : (
                                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                                {med.genericName && med.genericName.length > 0
                                                    ? `Generic: ${med.genericName[0]}`
                                                    : hasData ? 'Database verified' : 'Recognized'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Show Details Button */}
                                {hasData && (
                                    <button
                                        onClick={() => toggleExpand(idx)}
                                        className="group flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                                    >
                                        <span className="text-sm">{isExpanded ? 'Hide Details' : 'Show Details'}</span>
                                        {isExpanded ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && hasData && (
                                <div className="px-5 pb-5 space-y-4 animate-slide-down">
                                    {/* Generic and Brand Names */}
                                    {(med.genericName || med.brandName) && (
                                        <div className="space-y-3">
                                            {med.genericName && med.genericName.length > 0 && (
                                                <div>
                                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Generic Names:</span>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {med.genericName.map((name, i) => (
                                                            <span key={i} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium shadow-sm">
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {med.brandName && med.brandName.length > 0 && (
                                                <div>
                                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Brand Names:</span>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {med.brandName.slice(0, 8).map((name, i) => (
                                                            <span key={i} className="px-3 py-1.5 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 rounded-full text-sm font-medium shadow-sm">
                                                                {name}
                                                            </span>
                                                        ))}
                                                        {med.brandName.length > 8 && (
                                                            <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-sm font-medium">
                                                                +{med.brandName.length - 8} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Pharmaceutical Class */}
                                    {med.pharmClass && med.pharmClass.length > 0 && (
                                        <div>
                                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Pharmaceutical Class:</span>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {med.pharmClass.slice(0, 4).map((cls, i) => (
                                                    <span key={i} className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium shadow-sm">
                                                        {cls}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Common Side Effects */}
                                    {med.sideEffects && med.sideEffects.length > 0 && (
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-5 border-2 border-amber-200 dark:border-amber-800">
                                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-2 mb-3">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                Common Side Effects:
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {med.sideEffects.map((effect, i) => (
                                                    <span key={i} className="px-3 py-1.5 bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-200 rounded-full text-sm font-medium shadow-sm border border-amber-300 dark:border-amber-700">
                                                        {effect}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-3 italic">
                                                💡 These are potential side effects. Not everyone experiences them. Consult your doctor if you have concerns.
                                            </p>
                                        </div>
                                    )}

                                    {/* FDA Warnings and Interactions */}
                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl p-5 border-2 border-slate-200 dark:border-slate-700 shadow-inner">
                                        <h5 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            Official Warnings & Drug Interactions
                                        </h5>
                                        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-h-96 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                            <p className="whitespace-pre-wrap">{med.fdaText}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* No Data Message */}
                            {med.isUnknown && (
                                <div className="px-5 pb-5">
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-4">
                                        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                                            <strong>⚠️ No Database Data Available</strong><br />
                                            This medicine may be a local brand, supplement, or not registered in our databases.
                                            Please consult your healthcare provider for detailed information.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
