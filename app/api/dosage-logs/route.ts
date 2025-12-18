import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

// POST - Log a dose
export async function POST(request: Request) {
    try {
        const session = await getSession()

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { medicationId, scheduledTime, status, notes } = body

        if (!medicationId || !status) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // Create dosage log
        const result = await prisma.$queryRaw`
      INSERT INTO "DosageLog" (
        id, "userId", "medicationId", "takenAt", "scheduledTime",
        status, notes
      )
      VALUES (
        gen_random_uuid()::text,
        ${session.userId},
        ${medicationId},
        CURRENT_TIMESTAMP,
        ${scheduledTime},
        ${status},
        ${notes || null}
      )
      RETURNING *
    ` as any[]

        return NextResponse.json(result[0])
    } catch (error: any) {
        console.error("Error logging dose:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET - Fetch dosage logs
export async function GET(request: Request) {
    try {
        const session = await getSession()

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const medicationId = searchParams.get("medicationId")
        const limit = searchParams.get("limit") || "30"

        let logs
        if (medicationId) {
            logs = await prisma.$queryRaw`
        SELECT * FROM "DosageLog"
        WHERE "userId" = ${session.userId} AND "medicationId" = ${medicationId}
        ORDER BY "takenAt" DESC
        LIMIT ${parseInt(limit)}
      ` as any[]
        } else {
            logs = await prisma.$queryRaw`
        SELECT * FROM "DosageLog"
        WHERE "userId" = ${session.userId}
        ORDER BY "takenAt" DESC
        LIMIT ${parseInt(limit)}
      ` as any[]
        }

        return NextResponse.json(logs)
    } catch (error: any) {
        console.error("Error fetching dosage logs:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
