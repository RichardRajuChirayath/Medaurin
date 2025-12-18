import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    const session = await getSession()

    if (!session?.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await req.json()

    if (!token) {
        return NextResponse.json({ error: "FCM token is required" }, { status: 400 })
    }

    try {
        // Use raw SQL to update to avoid any Prisma Client regeneration issues
        await prisma.$executeRaw`
            UPDATE "User" 
            SET "fcmToken" = ${token} 
            WHERE id = ${session.userId}
        `
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error saving FCM token:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
