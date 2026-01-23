import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { sendCaregiverInvitationEmail } from "@/lib/email"

// POST: Send a Caregiver Request (Caregiver -> Patient)
export async function POST(request: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { patientEmail, nickname } = await request.json()
        const normalizedEmail = patientEmail.trim()
        console.log(`[Caregiver Link] Searching for: ${normalizedEmail}`)

        // Get caregiver info for email
        const caregiver = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { name: true, email: true }
        })

        if (!caregiver) {
            return NextResponse.json({ error: "Caregiver not found" }, { status: 404 })
        }

        // Use findFirst for case-insensitive search if supported by DB config, 
        // or just rely on findFirst which is more flexible than findUnique here
        let patient = await prisma.user.findFirst({
            where: {
                email: {
                    equals: normalizedEmail,
                    mode: 'insensitive'
                }
            }
        })

        // 🌟 FEATURE: Auto-create user if they don't exist (Ghost User)
        if (!patient) {
            console.log(`[Caregiver Link] User not found. Creating placeholder for: ${normalizedEmail}`)
            patient = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    name: "Invited Family Member",
                    // No auth credentials yet - they will set them up on first login
                }
            })
        }

        if (patient.id === session.userId) {
            return NextResponse.json({ error: "You cannot be your own caregiver" }, { status: 400 })
        }

        // Check if exists
        const existing = await prisma.careRelationship.findFirst({
            where: {
                caregiverId: session.userId,
                patientId: patient.id
            }
        })

        if (existing) {
            return NextResponse.json({ error: "Relationship already exists or is pending" }, { status: 400 })
        }

        const relation = await prisma.careRelationship.create({
            data: {
                caregiverId: session.userId,
                patientId: patient.id,
                nickname: nickname || patient.name || "Patient",
                status: "PENDING"
            }
        })

        // 📧 Send email notification to patient
        const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
        const caregiverName = caregiver.name || caregiver.email || "Someone"

        const emailSent = await sendCaregiverInvitationEmail(
            normalizedEmail,
            caregiverName,
            appUrl
        )

        if (emailSent) {
            console.log(`[Caregiver Link] Email sent to ${normalizedEmail}`)
        } else {
            console.warn(`[Caregiver Link] Email failed to send to ${normalizedEmail}`)
        }

        return NextResponse.json(relation)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT: Accept/Reject Request (Patient -> Caregiver)
export async function PUT(request: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { relationshipId, action } = await request.json() // action: "ACCEPT" | "REJECT"

        const relation = await prisma.careRelationship.findUnique({
            where: { id: relationshipId }
        })

        if (!relation || relation.patientId !== session.userId) {
            return NextResponse.json({ error: "Request not found or unauthorized" }, { status: 404 })
        }

        if (action === "REJECT") {
            await prisma.careRelationship.delete({ where: { id: relationshipId } })
            return NextResponse.json({ status: "REJECTED" })
        }

        const updated = await prisma.careRelationship.update({
            where: { id: relationshipId },
            data: { status: "ACTIVE" }
        })

        return NextResponse.json(updated)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET: List Requests (For Patient to see pending requests)
export async function GET(request: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // Get requests sent TO this user (User is Patient)
        const requests = await prisma.careRelationship.findMany({
            where: {
                patientId: session.userId,
                status: "PENDING"
            },
            include: {
                caregiver: {
                    select: { name: true, email: true, avatarUrl: true }
                }
            }
        })

        return NextResponse.json(requests)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH: Update relationship (e.g., change nickname)
export async function PATCH(request: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { relationshipId, nickname } = await request.json()

        const relation = await prisma.careRelationship.findUnique({
            where: { id: relationshipId }
        })

        if (!relation || relation.caregiverId !== session.userId) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
        }

        const updated = await prisma.careRelationship.update({
            where: { id: relationshipId },
            data: { nickname }
        })

        return NextResponse.json(updated)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

