import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { medicines, status, score, analysisType, interactions, recommendations } = await request.json()

        // Save analysis to database
        const analysis = await prisma.analysis.create({
            data: {
                userId: session.userId as string,
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
        const session = await getSession()

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get user's analysis history
        const analyses = await prisma.analysis.findMany({
            where: { userId: session.userId as string },
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to last 50 analyses
        })

        return NextResponse.json({ analyses })
    } catch (error) {
        console.error("Get history error:", error)
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
    }
}
