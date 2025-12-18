import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { messaging } from "@/lib/firebase-admin"

export const dynamic = 'force-dynamic' // Ensure this route is not cached

export async function GET(request: Request) {
    // Basic security check (skip if no secret set in env, useful for dev)
    const { searchParams } = new URL(request.url)
    if (process.env.CRON_SECRET && searchParams.get("key") !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current time in HH:mm format
    // Note: This relies on server time. For a real app, you'd handle user timezones.
    const now = new Date()
    const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

    console.log(`[Cron] Checking reminders for time: ${timeString}`)

    try {
        // Find medications with reminder enabled, matching time, and user has token
        // Using raw query for array containment if Prisma type isn't perfectly synced or for safety
        // Use raw SQL to fetch medications and associated user tokens
        // This bypasses Prisma type issues if the client isn't fully regenerated
        const medicationsToRemind = await prisma.$queryRaw`
            SELECT m.*, u."fcmToken", u.email as "user_email"
            FROM "Medication" m
            JOIN "User" u ON m."userId" = u.id
            WHERE m."reminderEnabled" = true
            AND ${timeString} = ANY(m."reminderTimes")
            AND u."fcmToken" IS NOT NULL
        ` as any[]

        console.log(`[Cron] Found ${medicationsToRemind.length} reminders to send`)

        const results = []

        for (const med of medicationsToRemind) {
            if (med.fcmToken) {
                try {
                    await messaging().send({
                        token: med.fcmToken,
                        notification: {
                            title: "Time to take your medication!",
                            body: `It's time to take ${med.medicineName} (${med.dosage})`,
                        },
                        data: {
                            url: "/medications",
                            medicationId: med.id
                        }
                    })
                    results.push({ medId: med.id, user: med.user_email, status: "sent" })
                } catch (e: any) {
                    console.error(`[Cron] FCM Send Error for ${med.id}:`, e)
                    results.push({ medId: med.id, status: "error", error: e.message })
                }
            }
        }

        return NextResponse.json({ success: true, checkTime: timeString, sentCount: results.length, results })

    } catch (e: any) {
        console.error("[Cron] Error:", e)
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}
