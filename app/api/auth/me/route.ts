import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getSession();

    if (!session || !session.userId) {
        return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId as string },
        select: {
            id: true,
            email: true,
            phoneNumber: true,
            createdAt: true,
            allergies: true,
            conditions: true,
        },
    });

    return NextResponse.json({ user });
}
