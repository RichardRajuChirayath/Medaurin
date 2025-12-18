"use client"

import { useRouter } from "next/navigation"
import { Receipt, TrendingUp, Calendar, FileUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ExpenseTrackerCard() {
    const router = useRouter()

    return (
        <Card className="hover:shadow-xl transition-all duration-300 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-white to-indigo-50 dark:from-slate-900 dark:to-indigo-950/20">
            <CardHeader>
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-xl">
                        <Receipt className="w-6 h-6 text-white" />
                    </div>
                    Expense Tracker
                </CardTitle>
                <CardDescription className="text-base">
                    Track, analyze, and optimize your medicine spending
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                        <FileUp className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">OCR Scan</p>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Analytics</p>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                        <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Monthly</p>
                    </div>
                </div>

                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span>Scan bills with OCR - auto-extract data</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span>Visual analytics with charts & insights</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span>Export to PDF, Excel, or CSV</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span>Find cheaper pharmacies nearby (OSM)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span>Budget alerts via push notifications</span>
                    </li>
                </ul>

                <Button
                    onClick={() => router.push("/expenses")}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-bold text-lg py-6"
                >
                    Open Expense Tracker →
                </Button>
            </CardContent>
        </Card>
    )
}
