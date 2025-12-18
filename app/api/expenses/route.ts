import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { verifyIndianMedicine, requiresAlert, generateAlertMessage } from "@/lib/india-medicine-verification"
import { messaging } from "@/lib/firebase-admin"

// GET - Fetch all expenses for user with pagination
export async function GET(req: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "50")
        const month = searchParams.get("month") // Format: YYYY-MM
        const pharmacy = searchParams.get("pharmacy")

        const skip = (page - 1) * limit

        // Build filters
        const where: any = { userId: session.userId }

        if (month) {
            const [year, monthNum] = month.split("-")
            const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
            const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59)
            where.purchaseDate = { gte: startDate, lte: endDate }
        }

        if (pharmacy) {
            where.pharmacyName = { contains: pharmacy, mode: "insensitive" }
        }

        const [expenses, total] = await Promise.all([
            prisma.medicineExpense.findMany({
                where,
                orderBy: { purchaseDate: "desc" },
                skip,
                take: limit
            }),
            prisma.medicineExpense.count({ where })
        ])

        return NextResponse.json({
            expenses,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("Error fetching expenses:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Create new expense
export async function POST(req: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const {
            medicineName,
            quantity,
            price,
            category,
            purchaseDate,
            pharmacyName,
            pharmacyLocation,
            importSource,
            invoiceUrl,
            rawInvoiceText,
            notes
        } = body

        if (!medicineName || price === undefined) {
            return NextResponse.json(
                { error: "Medicine name and price are required" },
                { status: 400 }
            )
        }

        const expense = await prisma.medicineExpense.create({
            data: {
                userId: session.userId,
                medicineName,
                quantity,
                price: parseFloat(price),
                category,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                pharmacyName,
                pharmacyLocation,
                importSource: importSource || "manual",
                invoiceUrl,
                rawInvoiceText,
                notes
            }
        })

        // Auto-verify medicine against India government databases
        try {
            const verification = await verifyIndianMedicine(
                medicineName,
                parseFloat(price),
                quantity
            )

            // Update expense with verification data
            const verifiedExpense = await prisma.medicineExpense.update({
                where: { id: expense.id },
                data: {
                    govApprovalStatus: verification.govApprovalStatus,
                    isBanned: verification.isBanned,
                    govMrp: verification.govMrp,
                    isOverpriced: verification.isOverpriced,
                    manufacturerName: verification.manufacturerName,
                    manufacturerLicense: verification.manufacturerLicense,
                    verifiedAt: verification.verifiedAt,
                    verificationAlerts: verification.verificationAlerts
                }
            })

            // Send FCM alert if medicine is banned or overpriced
            if (requiresAlert(verification)) {
                const user = await prisma.user.findUnique({
                    where: { id: session.userId },
                    select: { fcmToken: true }
                })

                if (user?.fcmToken) {
                    const alertMessage = generateAlertMessage(medicineName, verification)

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
                                medicineName: medicineName,
                                priority: "high"
                            }
                        })
                        console.log(`[FCM] Alert sent for ${medicineName}`)
                    } catch (fcmError) {
                        console.error("[FCM] Alert sending failed:", fcmError)
                    }
                }
            }

            return NextResponse.json({
                ...verifiedExpense,
                verification
            }, { status: 201 })
        } catch (verifyError) {
            console.error("Verification failed, returning unverified expense:", verifyError)
            return NextResponse.json(expense, { status: 201 })
        }
    } catch (error: any) {
        console.error("Error creating expense:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE - Delete expense
export async function DELETE(req: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "Expense ID required" }, { status: 400 })
        }

        await prisma.medicineExpense.delete({
            where: { id, userId: session.userId }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Error deleting expense:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
