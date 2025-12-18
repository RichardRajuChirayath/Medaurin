import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

// GET - Monthly insights and summary
export async function GET(req: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const month = searchParams.get("month") // Format: YYYY-MM

        if (!month) {
            return NextResponse.json({ error: "Month parameter required (YYYY-MM)" }, { status: 400 })
        }

        const [year, monthNum] = month.split("-")
        const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59)

        // Previous month for comparison
        const prevMonthStart = new Date(parseInt(year), parseInt(monthNum) - 2, 1)
        const prevMonthEnd = new Date(parseInt(year), parseInt(monthNum) - 1, 0, 23, 59, 59)

        const [currentExpenses, previousExpenses] = await Promise.all([
            prisma.medicineExpense.findMany({
                where: {
                    userId: session.userId,
                    purchaseDate: { gte: startDate, lte: endDate }
                }
            }),
            prisma.medicineExpense.findMany({
                where: {
                    userId: session.userId,
                    purchaseDate: { gte: prevMonthStart, lte: prevMonthEnd }
                }
            })
        ])

        // Calculate totals
        const currentTotal = currentExpenses.reduce((sum, e) => sum + e.price, 0)
        const previousTotal = previousExpenses.reduce((sum, e) => sum + e.price, 0)
        const percentChange = previousTotal > 0
            ? ((currentTotal - previousTotal) / previousTotal) * 100
            : 0

        // Category breakdown
        const categoryBreakdown: Record<string, number> = {}
        currentExpenses.forEach(e => {
            const cat = e.category || "Uncategorized"
            categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + e.price
        })

        // Pharmacy breakdown
        const pharmacyBreakdown: Record<string, number> = {}
        currentExpenses.forEach(e => {
            const pharmacy = e.pharmacyName || "Unknown"
            pharmacyBreakdown[pharmacy] = (pharmacyBreakdown[pharmacy] || 0) + e.price
        })

        // Top medicines by spending
        const medicineBreakdown: Record<string, number> = {}
        currentExpenses.forEach(e => {
            medicineBreakdown[e.medicineName] = (medicineBreakdown[e.medicineName] || 0) + e.price
        })
        const topMedicines = Object.entries(medicineBreakdown)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, amount]) => ({ name, amount }))

        return NextResponse.json({
            month,
            summary: {
                totalSpent: currentTotal,
                transactionCount: currentExpenses.length,
                averagePerTransaction: currentExpenses.length > 0 ? currentTotal / currentExpenses.length : 0,
                percentChange: Math.round(percentChange * 10) / 10
            },
            categoryBreakdown,
            pharmacyBreakdown,
            topMedicines,
            previousMonthTotal: previousTotal
        })
    } catch (error) {
        console.error("Error calculating insights:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
