import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

// GET - Fetch user profile
export async function GET() {
    try {
        const session = await getSession()

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
                email: true,
                phoneNumber: true,
                allergies: true,
                conditions: true,
                notificationSettings: true,
                createdAt: true,
            }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error("Error fetching profile:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT - Update user profile
export async function PUT(request: Request) {
    try {
        const session = await getSession()

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const {
            name,
            username,
            avatarUrl,
            allergies,
            conditions,
            notificationSettings
        } = body

        // Validate username uniqueness if provided
        if (username) {
            const existing = await prisma.user.findUnique({
                where: { username }
            })
            if (existing && existing.id !== session.userId) {
                return NextResponse.json({ error: "Username already taken" }, { status: 400 })
            }
        }

        const user = await prisma.user.update({
            where: { id: session.userId },
            data: {
                name,
                username,
                avatarUrl,
                allergies,
                conditions,
                notificationSettings,
            },
            select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
                email: true,
                phoneNumber: true,
                allergies: true,
                conditions: true,
                notificationSettings: true,
                createdAt: true,
            }
        })

        return NextResponse.json(user)
    } catch (error: any) {
        console.error("[Profile] Error updating:", error.message)
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
    }
}

// DELETE - Delete account
export async function DELETE() {
    try {
        const session = await getSession()
        if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await prisma.user.delete({ where: { id: session.userId } })

        // Clear session cookie
        const cookieStore = await cookies()
        cookieStore.delete("session_token")

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
    }
}
