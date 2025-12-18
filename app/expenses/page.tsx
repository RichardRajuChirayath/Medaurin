"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import {
    DollarSign, Plus, Calendar, TrendingUp, TrendingDown,
    Pill, Store, ChevronLeft, Trash2, Receipt, BarChart3,
    Download, MapPin, Mail, FileUp, Settings
} from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OCRBillUploader } from "@/components/ocr-bill-uploader"
import { PharmacyFinder } from "@/components/pharmacy-finder"
import { DoctorFinder } from "@/components/doctor-finder"
import { EmailImportConfig } from "@/components/email-import-config"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { toast } from "sonner"

interface Expense {
    id: string
    medicineName: string
    quantity?: string
    price: number
    category?: string
    purchaseDate: string
    pharmacyName?: string
    importSource: string
    notes?: string
    // India Government Verification
    govApprovalStatus?: string
    isBanned?: boolean
    isOverpriced?: boolean
    governmentMRP?: number
    govMrp?: number
    manufacturerName?: string
    manufacturerLicense?: string
    verificationAlerts?: string[]
    verifiedAt?: string
}

interface Insights {
    month: string
    summary: {
        totalSpent: number
        transactionCount: number
        averagePerTransaction: number
        percentChange: number
    }
    categoryBreakdown: Record<string, number>
    pharmacyBreakdown: Record<string, number>
    topMedicines: Array<{ name: string; amount: number }>
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]

export default function ExpenseTrackerPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    const [expenses, setExpenses] = useState<Expense[]>([])
    const [insights, setInsights] = useState<Insights | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showOCRModal, setShowOCRModal] = useState(false)
    const [showPharmacyMap, setShowPharmacyMap] = useState(false)

    const currentMonth = format(new Date(), "yyyy-MM")
    const [selectedMonth, setSelectedMonth] = useState(currentMonth)

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login")
            return
        }
        if (user) {
            fetchExpenses()
            fetchInsights()
        }
    }, [user, loading, selectedMonth])

    const fetchExpenses = async () => {
        try {
            const res = await fetch(`/api/expenses?month=${selectedMonth}&limit=100`)
            if (res.ok) {
                const data = await res.json()
                setExpenses(data.expenses)
            }
        } catch (error) {
            console.error("Error fetching expenses:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchInsights = async () => {
        try {
            const res = await fetch(`/api/expenses/insights?month=${selectedMonth}`)
            if (res.ok) {
                const data = await res.json()
                setInsights(data)
            }
        } catch (error) {
            console.error("Error fetching insights:", error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this expense?")) return
        try {
            const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                fetchExpenses()
                fetchInsights()
            }
        } catch (error) {
            console.error("Error deleting:", error)
        }
    }

    const handleExport = async (format: "csv" | "excel" | "pdf") => {
        try {
            const res = await fetch(`/api/expenses/export?format=${format}&month=${selectedMonth}`)
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `medicine-expenses-${selectedMonth}.${format === "excel" ? "xlsx" : format}`
                a.click()
                toast.success(`Exported as ${format.toUpperCase()}`)
            }
        } catch (error) {
            toast.error("Export failed")
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    // Prepare chart data
    const categoryChartData = insights ? Object.entries(insights.categoryBreakdown).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
    })) : []

    const pharmacyChartData = insights ? Object.entries(insights.pharmacyBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, value })) : []

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/20 py-12 px-4">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap');
                
                * {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                
                h1, h2, h3, h4, h5, h6 {
                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                    letter-spacing: -0.02em;
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .animate-slide-in {
                    animation: slideIn 0.4s ease-out;
                }
                
                .animate-scale-in {
                    animation: scaleIn 0.3s ease-out;
                }
                
                .glass-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                
                .dark .glass-card {
                    background: rgba(15, 23, 42, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
            `}</style>

            <div className="max-w-7xl mx-auto animate-slide-in">
                {/* Back Button */}
                <button
                    onClick={() => router.push("/")}
                    className="group mb-8 flex items-center gap-2 px-4 py-2 rounded-xl glass-card hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                >
                    <ChevronLeft className="w-5 h-5 text-primary group-hover:-translate-x-1 transition-transform" />
                    <span className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Back to Dashboard</span>
                </button>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-scale-in">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary blur-xl opacity-40 animate-pulse"></div>
                                <div className="relative p-3 bg-primary rounded-2xl shadow-lg shadow-primary/30">
                                    <Receipt className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-5xl font-heading font-bold text-gradient-primary tracking-tight">
                                    Expense Tracker
                                </h1>
                                <p className="text-muted-foreground text-lg font-medium mt-1">
                                    Smart medicine spending insights
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <Input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="relative glass-card border-none shadow-lg font-semibold min-w-[180px]"
                            />
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="relative group px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Add Expense
                            </div>
                        </button>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="glass-card p-1.5 rounded-2xl shadow-xl">
                        <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-bold transition-all duration-300">Overview</TabsTrigger>
                        <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-bold transition-all duration-300">Analytics</TabsTrigger>
                        <TabsTrigger value="import" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-bold transition-all duration-300">Import</TabsTrigger>
                        <TabsTrigger value="pharmacies" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-bold transition-all duration-300">Medical Facilities</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-8">
                        {/* Stats Cards */}
                        {insights && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Total Spent Card */}
                                <div className="group relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                    <div className="relative glass-card rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Total Spent</p>
                                        <div className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                            ₹{insights.summary.totalSpent.toFixed(2)}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs mt-2 font-medium">
                                            {insights.summary.percentChange >= 0 ? (
                                                <>
                                                    <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                                                    <span className="text-red-500">
                                                        +{Math.abs(insights.summary.percentChange).toFixed(1)}%
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <TrendingDown className="w-3.5 h-3.5 text-green-500" />
                                                    <span className="text-green-500">
                                                        {insights.summary.percentChange.toFixed(1)}%
                                                    </span>
                                                </>
                                            )}
                                            <span className="text-slate-500">vs last month</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Transactions Card */}
                                <div className="group relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                    <div className="relative glass-card rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Transactions</p>
                                        <div className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                            {insights.summary.transactionCount}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 font-medium">purchases this month</p>
                                    </div>
                                </div>

                                {/* Average Card */}
                                <div className="group relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                    <div className="relative glass-card rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Avg per Purchase</p>
                                        <div className="text-3xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                            ₹{insights.summary.averagePerTransaction.toFixed(2)}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 font-medium">average spending</p>
                                    </div>
                                </div>

                                {/* Top Category Card */}
                                <div className="group relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                    <div className="relative glass-card rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Top Category</p>
                                        <div className="text-2xl font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent capitalize">
                                            {Object.entries(insights.categoryBreakdown).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 font-medium">most purchased</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Export Buttons */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    Export Data
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex gap-3">
                                <Button onClick={() => handleExport("csv")} variant="outline">
                                    CSV
                                </Button>
                                <Button onClick={() => handleExport("excel")} variant="outline">
                                    Excel
                                </Button>
                                <Button onClick={() => handleExport("pdf")} variant="outline">
                                    PDF
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Expenses List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Purchases</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {expenses.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <Receipt className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                        <p>No expenses recorded for this month</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {expenses.map((expense) => (
                                            <div
                                                key={expense.id}
                                                className="p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-4 flex-1">
                                                        <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                                            <Pill className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                                                {expense.medicineName}
                                                            </h4>
                                                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                                                {expense.quantity && <span>{expense.quantity}</span>}
                                                                {expense.pharmacyName && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="flex items-center gap-1">
                                                                            <Store className="w-3 h-3" />
                                                                            {expense.pharmacyName}
                                                                        </span>
                                                                    </>
                                                                )}
                                                                <span>•</span>
                                                                <span>{format(new Date(expense.purchaseDate), "MMM d, yyyy")}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-4">
                                                        <div className="text-right">
                                                            <div className="text-xl font-bold text-primary font-heading">₹{expense.price.toFixed(2)}</div>
                                                            <Badge variant="outline" className="text-xs mt-1 bg-background/50 backdrop-blur-sm">
                                                                {expense.importSource}
                                                            </Badge>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(expense.id)}
                                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ANALYTICS TAB */}
                    <TabsContent value="analytics" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Category Breakdown */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Spending by Category</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={categoryChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label
                                            >
                                                {categoryChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Top Pharmacies */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top 5 Pharmacies</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={pharmacyChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#6366f1" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Top Medicines */}
                        {insights && insights.topMedicines.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top 5 Medicines by Spending</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {insights.topMedicines.map((med, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                                <span className="font-medium">{med.name}</span>
                                                <span className="text-lg font-bold text-indigo-600">₹{med.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* IMPORT TAB */}
                    <TabsContent value="import" className="space-y-6">
                        <div className="space-y-6">
                            {/* OCR Scanner */}
                            <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => setShowOCRModal(true)}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileUp className="w-5 h-5 text-indigo-600" />
                                        Scan Bill (OCR)
                                    </CardTitle>
                                    <CardDescription>
                                        Upload a photo of your medicine bill. We'll auto-extract the details.
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            {/* Email Import Config */}
                            <EmailImportConfig />
                        </div>
                    </TabsContent>

                    {/* MEDICAL FACILITIES TAB */}
                    <TabsContent value="pharmacies" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <PharmacyFinder />
                            <DoctorFinder />
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Add Expense Modal */}
                {showAddModal && (
                    <AddExpenseModal
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            fetchExpenses()
                            fetchInsights()
                            setShowAddModal(false)
                        }}
                    />
                )}

                {/* OCR Modal */}
                {showOCRModal && (
                    <OCRModal
                        onClose={() => setShowOCRModal(false)}
                        onSuccess={() => {
                            fetchExpenses()
                            fetchInsights()
                            setShowOCRModal(false)
                        }}
                    />
                )}
            </div>
        </div>
    )
}

// OCR Modal Component
function OCRModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [extractedData, setExtractedData] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        if (!extractedData) return
        setIsSaving(true)

        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...extractedData,
                    importSource: "ocr"
                })
            })

            if (res.ok) {
                toast.success("Expense saved from OCR!")
                onSuccess()
            }
        } catch (error) {
            toast.error("Failed to save")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Scan Bill with OCR</h2>

                <OCRBillUploader onDataExtracted={(data) => setExtractedData(data)} />

                {extractedData && (
                    <div className="mt-6 space-y-4">
                        <h3 className="font-bold text-slate-900 dark:text-white">Extracted Data:</h3>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <div>
                                <Label className="text-xs text-slate-600">Medicine</Label>
                                <p className="font-bold">{extractedData.medicineName || "Not detected"}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-slate-600">Price</Label>
                                <p className="font-bold">₹{extractedData.price || "0.00"}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-slate-600">Quantity</Label>
                                <p className="font-bold">{extractedData.quantity || "Not detected"}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-slate-600">Pharmacy</Label>
                                <p className="font-bold">{extractedData.pharmacyName || "Not detected"}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Expense"}
                            </Button>
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Add Expense Modal Component
function AddExpenseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [medicineName, setMedicineName] = useState("")
    const [quantity, setQuantity] = useState("")
    const [price, setPrice] = useState("")
    const [category, setCategory] = useState("")
    const [pharmacyName, setPharmacyName] = useState("")
    const [purchaseDate, setPurchaseDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [notes, setNotes] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    medicineName,
                    quantity,
                    price: parseFloat(price),
                    category,
                    pharmacyName,
                    purchaseDate,
                    notes,
                    importSource: "manual"
                })
            })

            if (res.ok) {
                onSuccess()
            } else {
                const data = await res.json()
                alert(data.error || "Failed to save")
            }
        } catch (error) {
            console.error("Error saving expense:", error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Add Medicine Expense</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Medicine Name *</Label>
                        <Input
                            value={medicineName}
                            onChange={(e) => setMedicineName(e.target.value)}
                            required
                            placeholder="e.g., Paracetamol"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Quantity</Label>
                            <Input
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="e.g., 10 tablets"
                            />
                        </div>
                        <div>
                            <Label>Price (₹) *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Category</Label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        >
                            <option value="">Select...</option>
                            <option value="tablet">Tablet</option>
                            <option value="syrup">Syrup</option>
                            <option value="injection">Injection</option>
                            <option value="ointment">Ointment</option>
                            <option value="drops">Drops</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <Label>Pharmacy Name</Label>
                        <Input
                            value={pharmacyName}
                            onChange={(e) => setPharmacyName(e.target.value)}
                            placeholder="e.g., Apollo Pharmacy"
                        />
                    </div>

                    <div>
                        <Label>Purchase Date *</Label>
                        <Input
                            type="date"
                            value={purchaseDate}
                            onChange={(e) => setPurchaseDate(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Label>Notes</Label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                            rows={2}
                            placeholder="Optional notes..."
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isSaving ? "Saving..." : "Add Expense"}
                        </Button>
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                            className="px-6"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
