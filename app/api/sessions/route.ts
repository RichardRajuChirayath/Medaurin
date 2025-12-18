import { NextResponse, NextRequest } from "next/server";
import { getSession, revokeSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET: List active sessions
export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.session.findMany({
        where: { userId: session.userId },
        orderBy: { lastActive: "desc" },
        select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            device: true,
            lastActive: true,
            createdAt: true,
        }
    });

    const currentSessionId = session.sessionId;

    const formattedSessions = sessions.map(s => ({
        ...s,
        isCurrent: s.id === currentSessionId
    }));

    return NextResponse.json(formattedSessions);
}

// DELETE: Revoke a session
export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
        return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    // Verify ownership
    const targetSession = await prisma.session.findFirst({
        where: { id: sessionId, userId: session.userId }
    });

    if (!targetSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await revokeSession(sessionId);

    return NextResponse.json({ success: true });
}
