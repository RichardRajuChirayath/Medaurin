import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { medicines, status, score, analysisType, interactions, recommendations } = await request.json()

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Save analysis to database
        const analysis = await prisma.analysis.create({
            data: {
                userId: user.id,
                medicines,
                status,
                score,
                analysisType,
                interactions,
                recommendations,
            },
        })

        return NextResponse.json({ success: true, analysisId: analysis.id })
    } catch (error) {
        console.error("Save analysis error:", error)
        return NextResponse.json({ error: "Failed to save analysis" }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get user's analysis history
        const analyses = await prisma.analysis.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to last 50 analyses
        })

        return NextResponse.json({ analyses })
    } catch (error) {
        console.error("Get history error:", error)
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
    }
}
