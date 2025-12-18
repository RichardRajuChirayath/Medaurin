import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { messaging } from "@/lib/firebase-admin"

// POST - Check budget and send alert if needed
export async function POST(req: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get user's budget and FCM token
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { medicineBudget: true, fcmToken: true }
        })

        if (!user?.medicineBudget) {
            return NextResponse.json({ message: "No budget set" })
        }

        // Get current month spending
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const expenses = await prisma.medicineExpense.findMany({
            where: {
                userId: session.userId,
                purchaseDate: { gte: startOfMonth, lte: endOfMonth }
            }
        })

        const totalSpent = expenses.reduce((sum, e) => sum + e.price, 0)
        const percentUsed = (totalSpent / user.medicineBudget) * 100

        // Send alert if nearing or exceeding budget
        let alertSent = false
        let alertMessage = ""

        if (percentUsed >= 100) {
            alertMessage = `🚨 Budget Alert: You've exceeded your medicine budget! Spent ₹${totalSpent.toFixed(2)} / ₹${user.medicineBudget.toFixed(2)} this month.`
            alertSent = true
        } else if (percentUsed >= 80) {
            alertMessage = `⚠️ Budget Warning: You've used ${percentUsed.toFixed(0)}% of your medicine budget. Spent ₹${totalSpent.toFixed(2)} / ₹${user.medicineBudget.toFixed(2)}.`
            alertSent = true
        }

        if (alertSent && user.fcmToken) {
            try {
                await messaging().send({
                    token: user.fcmToken,
                    notification: {
                        title: "MixSafe Budget Alert",
                        body: alertMessage
                    },
                    data: {
                        type: "budget_alert",
                        totalSpent: totalSpent.toString(),
                        budget: user.medicineBudget.toString(),
                        percentUsed: percentUsed.toString()
                    }
                })
                console.log("Budget alert sent via FCM")
            } catch (fcmError) {
                console.error("FCM send error:", fcmError)
            }
        }

        return NextResponse.json({
            budget: user.medicineBudget,
            totalSpent,
            percentUsed: Math.round(percentUsed),
            alertSent,
            alertMessage
        })
    } catch (error) {
        console.error("Budget check error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
