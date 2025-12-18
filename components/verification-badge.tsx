"use client"

import { Shield, ShieldAlert, ShieldCheck, DollarSign, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface VerificationBadgeProps {
    expense: {
        govApprovalStatus?: string
        isBanned?: boolean
        isOverpriced?: boolean
        govMrp?: number
    }
}

export function VerificationBadge({ expense }: VerificationBadgeProps) {
    // Banned medicine - critical alert
    if (expense.isBanned) {
        return (
            <div className="flex flex-col gap-1.5">
                <Badge variant="destructive" className="flex items-center gap-1.5 animate-pulse">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span className="font-bold">BANNED IN INDIA</span>
                </Badge>
                <p className="text-xs text-red-600 font-semibold">⚠️ Prohibited by CDSCO</p>
            </div>
        )
    }

    // Overpriced medicine - warning
    if (expense.isOverpriced) {
        return (
            <div className="flex flex-col gap-1.5">
                <Badge className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span className="font-bold">MAY BE OVERPRICED</span>
                </Badge>
                {expense.govMrp && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        Govt ceiling: ₹{expense.govMrp}/unit
                    </p>
                )}
            </div>
        )
    }

    // Approved medicine
    if (expense.govApprovalStatus === "APPROVED") {
        return (
            <Badge variant="outline" className="flex items-center gap-1.5 border-green-600 text-green-600">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-semibold">GOVT APPROVED</span>
            </Badge>
        )
    }

    // Unknown
    return (
        <Badge variant="outline" className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span className="font-semibold text-xs">NOT IN DATABASE</span>
        </Badge>
    )
}

interface VerificationDetailsProps {
    expense: {
        govApprovalStatus?: string
        isBanned?: boolean
        isOverpriced?: boolean
        manufacturerName?: string
        manufacturerLicense?: string
        govMrp?: number
        verificationAlerts?: string[]
        verifiedAt?: string
    }
}

export function VerificationDetails({ expense }: VerificationDetailsProps) {
    if (!expense.govApprovalStatus || expense.govApprovalStatus === "UNKNOWN") {
        return null
    }

    return (
        <div className="mt-3 space-y-2 p-4 bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/20 rounded-xl border-2 border-indigo-100 dark:border-indigo-900">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                🇮🇳 India Government Verification
            </h4>

            <div className="space-y-2 text-xs">
                {/* Approval Status */}
                <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Status:</span>
                    <span className={`font-bold ${expense.govApprovalStatus === "BANNED" ? "text-red-600" :
                            expense.govApprovalStatus === "APPROVED" ? "text-green-600" :
                                "text-slate-600"
                        }`}>
                        {expense.govApprovalStatus}
                    </span>
                </div>

                {/* Manufacturer */}
                {expense.manufacturerName && (
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg space-y-1">
                        <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Manufacturer:</span>
                        </div>
                        <div className="font-semibold text-indigo-600 pl-5">{expense.manufacturerName}</div>
                        {expense.manufacturerLicense && (
                            <div className="text-xs font-mono text-slate-500 pl-5">{expense.manufacturerLicense}</div>
                        )}
                    </div>
                )}

                {/* Govt MRP */}
                {expense.govMrp && (
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Govt Ceiling Price:</span>
                        <span className="font-bold text-indigo-600 text-sm">₹{expense.govMrp}/unit</span>
                    </div>
                )}

                {/* Alerts */}
                {expense.verificationAlerts && expense.verificationAlerts.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                        {expense.verificationAlerts.map((alert, idx) => (
                            <div
                                key={idx}
                                className={`p-3 rounded-lg text-xs font-medium flex items-start gap-2 ${alert.includes("BANNED") || alert.includes("CRITICAL") ?
                                        "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-2 border-red-300 dark:border-red-900" :
                                        alert.includes("overcharged") || alert.includes("overpriced") ?
                                            "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-2 border-amber-300 dark:border-amber-900" :
                                            alert.includes("Good deal") || alert.includes("saved") ?
                                                "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-300 dark:border-emerald-900" :
                                                "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-900"
                                    }`}
                            >
                                <span className="flex-shrink-0 text-base">
                                    {alert.includes("BANNED") || alert.includes("CRITICAL") ? "⚠️" :
                                        alert.includes("overcharged") ? "💰" :
                                            alert.includes("Good deal") ? "✓" : "ℹ️"}
                                </span>
                                <span className="flex-1">{alert}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Timestamp */}
                {expense.verifiedAt && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2 border-t border-slate-200 dark:border-slate-700">
                        Verified: {new Date(expense.verifiedAt).toLocaleString('en-IN')}
                    </div>
                )}
            </div>
        </div>
    )
}
