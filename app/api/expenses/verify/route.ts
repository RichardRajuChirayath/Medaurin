import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { verifyIndianMedicine, requiresAlert, generateAlertMessage } from "@/lib/india-medicine-verification"
import { messaging } from "@/lib/firebase-admin"

// POST - Verify a single medicine
export async function POST(req: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { expenseId } = await req.json()

        if (!expenseId) {
            return NextResponse.json({ error: "Expense ID required" }, { status: 400 })
        }

        // Get expense details
        const expense = await prisma.medicineExpense.findUnique({
            where: { id: expenseId, userId: session.userId }
        })

        if (!expense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 })
        }

        // Verify medicine
        const verification = await verifyIndianMedicine(
            expense.medicineName,
            expense.price,
            expense.quantity || undefined
        )

        // Update expense with verification data
        const updatedExpense = await prisma.medicineExpense.update({
            where: { id: expenseId },
            data: {
                isVerified: true,
                isApproved: verification.isApproved,
                isBanned: verification.isBanned,
                isControlled: verification.isControlled,
                approvalStatus: verification.approvalStatus,
                cdscoLicense: verification.cdscoLicense,
                governmentMRP: verification.governmentMRP,
                isPriceValid: verification.isPriceValid,
                priceVariance: verification.priceVariance,
                verificationAlerts: verification.alerts
            }
        })

        // Send FCM notification if medicine requires alert
        if (requiresAlert(verification)) {
            const user = await prisma.user.findUnique({
                where: { id: session.userId },
                select: { fcmToken: true }
            })

            if (user?.fcmToken) {
                const alertMessage = generateAlertMessage(expense.medicineName, verification)

                try {
                    await messaging().send({
                        token: user.fcmToken,
                        notification: {
                            title: verification.isBanned ? "⚠️ BANNED Medicine Alert" : "💰 Price Alert",
                            body: alertMessage
                        },
                        data: {
                            type: verification.isBanned ? "banned_medicine" : "overpriced_medicine",
                            expenseId: expense.id,
                            medicineName: expense.medicineName,
                            priority: "high"
                        }
                    })
                    console.log(`[FCM] Alert sent for ${expense.medicineName}`)
                } catch (fcmError) {
                    console.error("[FCM] Failed to send alert:", fcmError)
                }
            }
        }

        return NextResponse.json({
            ...updatedExpense,
            verification
        })
    } catch (error: any) {
        console.error("Verification error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET - Batch verify all unverified expenses
export async function GET(req: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get all unverified expenses
        const expenses = await prisma.medicineExpense.findMany({
            where: {
                userId: session.userId,
                isVerified: false
            },
            take: 50 // Limit to 50 at a time
        })

        const results = []
        let alertsSent = 0

        for (const expense of expenses) {
            const verification = await verifyIndianMedicine(
                expense.medicineName,
                expense.price,
                expense.quantity || undefined
            )

            // Update expense
            await prisma.medicineExpense.update({
                where: { id: expense.id },
                data: {
                    isVerified: true,
                    isApproved: verification.isApproved,
                    isBanned: verification.isBanned,
                    isControlled: verification.isControlled,
                    approvalStatus: verification.approvalStatus,
                    cdscoLicense: verification.cdscoLicense,
                    governmentMRP: verification.governmentMRP,
                    isPriceValid: verification.isPriceValid,
                    priceVariance: verification.priceVariance,
                    verificationAlerts: verification.alerts
                }
            })

            results.push({
                expenseId: expense.id,
                medicineName: expense.medicineName,
                verification
            })

            // Send alert if needed
            if (requiresAlert(verification)) {
                alertsSent++
            }
        }

        // Send summary FCM notification if any alerts
        if (alertsSent > 0) {
            const user = await prisma.user.findUnique({
                where: { id: session.userId },
                select: { fcmToken: true }
            })

            if (user?.fcmToken) {
                try {
                    await messaging().send({
                        token: user.fcmToken,
                        notification: {
                            title: "Medicine Verification Complete",
                            body: `⚠️ Found ${alertsSent} alert(s) in your medicines. Check your expense tracker.`
                        },
                        data: {
                            type: "verification_complete",
                            alertCount: alertsSent.toString()
                        }
                    })
                } catch (fcmError) {
                    console.error("[FCM] Failed to send summary:", fcmError)
                }
            }
        }

        return NextResponse.json({
            verified: results.length,
            alertsSent,
            results
        })
    } catch (error: any) {
        console.error("Batch verification error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
