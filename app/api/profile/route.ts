import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch user profile
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch user with raw SQL to get new fields
        const users = await prisma.$queryRaw`
            SELECT id, name, username, email, image, allergies, conditions, "createdAt"
            FROM "User"
            WHERE email = ${session.user.email}
            LIMIT 1
        ` as any[]

        if (!users || users.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const user = users[0]

        return NextResponse.json({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            image: user.image,
            allergies: user.allergies || [],
            conditions: user.conditions || [],
            createdAt: user.createdAt
        })
    } catch (error) {
        console.error("Error fetching profile:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT - Update user profile
export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { username, allergies, conditions } = body

        console.log('[Profile] Update request:', { username, allergies, conditions })

        // Check if username is already taken (if provided)
        if (username) {
            const existing = await prisma.$queryRaw`
                SELECT email FROM "User" WHERE username = ${username} LIMIT 1
            ` as any[]

            if (existing.length > 0 && existing[0].email !== session.user.email) {
                return NextResponse.json(
                    { error: "Username already taken" },
                    { status: 400 }
                )
            }
        }

        // Update using raw SQL
        await prisma.$executeRaw`
            UPDATE "User"
            SET 
                username = ${username || null},
                allergies = ${allergies || []},
                conditions = ${conditions || []}
            WHERE email = ${session.user.email}
        `

        console.log('[Profile] Update successful')

        // Fetch updated user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
            }
        })

        return NextResponse.json({
            ...user,
            username,
            allergies: allergies || [],
            conditions: conditions || [],
        })
    } catch (error: any) {
        console.error("[Profile] Error updating:", error.message)
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
    }
}
