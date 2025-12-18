import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET: List recent login history
export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const history = await prisma.loginHistory.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 20
    });

    return NextResponse.json(history);
}
