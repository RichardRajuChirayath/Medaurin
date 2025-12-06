"use client"

import { useState } from "react"
import * as stringSimilarity from "string-similarity"
import { Search, AlertCircle, CheckCircle, Stethoscope, Activity, X } from "lucide-react"
import { LoadingSpinner } from "./loading-spinner"

interface SymptomCheckerProps {
    result: any
}

const SYMPTOM_SYNONYMS: Record<string, string> = {
    "sick": "nausea",
    "feeling sick": "nausea",
    "queasy": "nausea",
    "throwing up": "vomiting",
    "puking": "vomiting",
    "barfing": "vomiting",
    "pain in head": "headache",
    "migraine": "headache",
    "head hurts": "headache",
    "dizzy": "dizziness",
    "lightheaded": "dizziness",
    "spinning": "dizziness",
    "tired": "fatigue",
    "exhausted": "fatigue",
    "sleepy": "drowsiness",
    "can't sleep": "insomnia",
    "awake": "insomnia",
    "belly pain": "abdominal pain",
    "stomach ache": "stomach pain",
    "tummy ache": "stomach pain",
    "loose motion": "diarrhea",
    "runs": "diarrhea",
    "hard stool": "constipation",
    "cant poop": "constipation",
    "skin rash": "rash",
    "itchy skin": "itching",
    "scratching": "itching",
    "swollen": "swelling",
    "puffiness": "swelling",
    "heart racing": "palpitations",
    "fast heart": "increased heart rate",
    "slow heart": "decreased heart rate",
    "breathless": "shortness of breath",
    "cant breathe": "difficulty breathing",
    "chest hurts": "chest pain",
    "shaking": "tremor",
    "shakes": "tremor",
    "nervous": "anxiety",
    "scared": "anxiety",
    "worried": "anxiety",
    "sad": "depression",
    "down": "depression",
    "forgetting": "memory problems",
    "cant focus": "difficulty concentrating",
    "hot": "fever",
    "burning up": "fever",
    "cold": "chills",
    "shivering": "chills",
    "ringing in ears": "tinnitus",
    "cant see": "blurred vision",
    "blurry": "blurred vision",
    "dry mouth": "dry mouth",
    "thirsty": "dry mouth",
    "peeing a lot": "urinary problems",
    "cant pee": "urinary problems",
    "hair falling out": "hair loss",
    "bald": "hair loss",
    "sweaty": "sweating",
    "perspiring": "sweating",
}

export function SymptomChecker({ result }: SymptomCheckerProps) {
    const [symptoms, setSymptoms] = useState("")
    const [matches, setMatches] = useState<any[]>([])
    const [checked, setChecked] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleCheck = () => {
        if (!symptoms.trim() || !result?.medicineDetails) return
        setIsLoading(true)

        // Simulate a delay to show the loading state
        setTimeout(() => {
            const userSymptoms = symptoms.toLowerCase().split(/,| and | or /).map(s => s.trim()).filter(Boolean)
            const foundMatches: any[] = []

            userSymptoms.forEach(userSymptom => {
                let targetSymptom = userSymptom
                for (const [synonym, standard] of Object.entries(SYMPTOM_SYNONYMS)) {
                    if (userSymptom.includes(synonym)) {
                        targetSymptom = standard
                        break
                    }
                }

                result.medicineDetails.forEach((med: any) => {
                    if (med.sideEffects && med.sideEffects.length > 0) {
                        const sideEffectsLower = med.sideEffects.map((s: string) => s.toLowerCase())
                        const { bestMatch } = stringSimilarity.findBestMatch(targetSymptom, sideEffectsLower)

                        if (bestMatch.rating > 0.5) { // Confidence threshold
                            const originalEffect = med.sideEffects.find((s: string) => s.toLowerCase() === bestMatch.target)
                            foundMatches.push({
                                symptom: userSymptom,
                                matchedEffect: originalEffect,
                                medicine: med.name,
                                generic: med.genericName,
                                rating: bestMatch.rating
                            })
                        }
                    }
                })
            })
            
            // Sort matches by rating to show the most relevant ones first
            foundMatches.sort((a, b) => b.rating - a.rating)

            setMatches(foundMatches)
            setChecked(true)
            setIsLoading(false)
        }, 1500) // 1.5 second delay
    }

    const handleReset = () => {
        setSymptoms("")
        setMatches([])
        setChecked(false)
    }

    if (!result) return null

    const highlightMatch = (text: string, match: string) => {
        const parts = text.split(new RegExp(`(${match})`, 'gi'));
        return <span>{parts.map((part, i) =>
            part.toLowerCase() === match.toLowerCase() ? <strong key={i} className="text-emerald-500">{part}</strong> : part
        )}</span>;
    }

    return (
        <div className="w-full max-w-4xl mx-auto mt-12 animate-slide-up">
            <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 pointer-events-none" />
                <div className="relative p-8 md:p-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Symptom Checker</h3>
                            <p className="text-slate-600 dark:text-slate-400 font-medium">
                                Check if your symptoms are known side effects of your medication.
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 text-yellow-800 dark:text-yellow-200 text-sm">
                        <p className="font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Disclaimer</p>
                        <p className="mt-1">This tool is for informational purposes only and does not provide medical advice. Always consult with a healthcare professional for any health concerns.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="relative">
                            <textarea
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                placeholder="Describe your symptoms to see if they match known side effects... (e.g., 'headache, nausea')"
                                className="w-full min-h-[120px] p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none text-lg placeholder:text-slate-400"
                                disabled={isLoading}
                            />
                            {symptoms && (
                                <button
                                    onClick={handleReset}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X className="w-4 h-4 text-slate-500" />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handleCheck}
                            disabled={!symptoms.trim() || isLoading}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? <LoadingSpinner /> : <Activity className="w-5 h-5" />}
                            {isLoading ? "Analyzing your symptoms, please wait..." : "Analyze Symptoms"}
                        </button>
                    </div>

                    {checked && (
                        <div className="mt-8 animate-fade-in">
                            {matches.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-4">
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Found {matches.length} potential matches</span>
                                    </div>
                                    <div className="grid gap-4">
                                        {matches.map((match, idx) => (
                                            <div key={idx} className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                                    <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                                                        "{highlightMatch(match.symptom, match.symptom)}" matches <span className="text-emerald-600 dark:text-emerald-400">{match.matchedEffect}</span>
                                                    </h4>
                                                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                                                        Listed side effect of <span className="font-bold text-slate-800 dark:text-slate-200">{match.medicine}</span>
                                                        {match.generic && <span className="text-sm opacity-75"> ({match.generic.join(", ")})</span>}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-2">Match confidence: {Math.round(match.rating * 100)}%</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-4">This is not a diagnosis. It is a tool to help you discuss your symptoms with your doctor.</p>
                                </div>
                            ) : (
                                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 mx-auto flex items-center justify-center mb-3">
                                        <CheckCircle className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">No Direct Matches Found</h4>
                                    <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                                        Your symptoms do not appear to match the common side effects listed for these medicines. However, always consult your doctor if you're feeling unwell.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
