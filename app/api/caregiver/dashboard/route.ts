import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const relationships = await prisma.careRelationship.findMany({
            where: {
                caregiverId: session.userId,
                status: "ACTIVE"
            },
            include: {
                patient: {
                    include: {
                        medications: {
                            where: { reminderEnabled: true }
                        },
                        dosageLogs: {
                            where: {
                                takenAt: {
                                    gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today start
                                }
                            }
                        }
                    }
                }
            }
        })

        const dashboardData = relationships.map(rel => {
            const patient = rel.patient
            const medications = patient.medications
            const logs = patient.dosageLogs

            let takenCount = 0
            let missedCount = 0
            let nextDose = null
            let status = "OK" // OK, WARNING, CRITICAL

            const now = new Date()
            const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })

            // Analyze Schedule
            medications.forEach(med => {
                med.reminderTimes.forEach(time => {
                    // Check if taken
                    const taken = logs.some(l =>
                        l.medicationId === med.id &&
                        l.status === "taken" &&
                        // Sloppy matching for MVP (exact time + medication)
                        // Ideally we check time windows. Here simple boolean:
                        l.scheduledTime === time
                    )

                    if (taken) {
                        takenCount++
                    } else {
                        // Check if missed
                        if (time < currentTimeStr) {
                            // Calculate delay hours
                            // Simple logic: if > 2 hours late -> CRITICAL
                            const [h, m] = time.split(':').map(Number)
                            const [nowH, nowM] = currentTimeStr.split(':').map(Number)

                            const diffMins = (nowH * 60 + nowM) - (h * 60 + m)

                            if (diffMins > 120) {
                                status = "CRITICAL"
                                missedCount++
                            } else {
                                missedCount++
                                if (status !== "CRITICAL") status = "WARNING"
                            }
                        } else {
                            // Future
                            if (!nextDose || time < nextDose.time) {
                                nextDose = {
                                    medicine: med.medicineName,
                                    time: time
                                }
                            }
                        }
                    }
                })
            })

            return {
                relationshipId: rel.id,
                patientId: patient.id,
                name: rel.nickname || patient.name || "Patient",
                avatarUrl: patient.avatarUrl,
                status,
                stats: {
                    totalScheduled: medications.reduce((acc, m) => acc + m.reminderTimes.length, 0),
                    taken: takenCount,
                    missed: missedCount
                },
                nextDose,
                lastActive: "Just now" // Mock for MVP
            }
        })

        return NextResponse.json(dashboardData)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
