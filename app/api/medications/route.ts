import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

// GET - Fetch all medications for user
export async function GET() {
    try {
        const session = await getSession()

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch medications using raw SQL
        const medications = await prisma.$queryRaw`
      SELECT * FROM "Medication"
      WHERE "userId" = ${session.userId}
      ORDER BY "createdAt" DESC
    ` as any[]

        return NextResponse.json(medications)
    } catch (error) {
        console.error("Error fetching medications:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Create new medication
export async function POST(request: Request) {
    try {
        const session = await getSession()

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { medicineName, dosage, frequency, reminderTimes, reminderEnabled, notes, endDate } = body

        if (!medicineName || !dosage || !frequency) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // Create medication using raw SQL
        const result = await prisma.$queryRaw`
      INSERT INTO "Medication" (
        id, "userId", "medicineName", dosage, frequency, "reminderTimes",
        "reminderEnabled", notes, "startDate", "endDate", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text,
        ${session.userId},
        ${medicineName},
        ${dosage},
        ${frequency},
        ${reminderTimes || []}::text[],
        ${reminderEnabled !== false},
        ${notes || null},
        CURRENT_TIMESTAMP,
        ${endDate ? new Date(endDate) : null},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    ` as any[]

        return NextResponse.json(result[0])
    } catch (error: any) {
        console.error("Error creating medication:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE - Delete medication
export async function DELETE(request: Request) {
    try {
        const session = await getSession()

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "Missing medication ID" }, { status: 400 })
        }

        // Delete medication
        await prisma.$executeRaw`
      DELETE FROM "Medication"
      WHERE id = ${id} AND "userId" = ${session.userId}
    `

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Error deleting medication:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
