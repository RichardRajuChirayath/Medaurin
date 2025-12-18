import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { signSession, createSession, logLoginHistory } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { message: "Token missing" },
                { status: 400 }
            );
        }

        // Verify magic-link token
        const secretKey = process.env.SESSION_SECRET;
        if (!secretKey) throw new Error("SESSION_SECRET missing");
        const key = new TextEncoder().encode(secretKey);

        const { payload } = await jwtVerify(token, key, {
            algorithms: ["HS256"],
        });

        if (payload.type !== "magic-link" || !payload.email) {
            return NextResponse.json(
                { message: "Invalid token" },
                { status: 400 }
            );
        }

        const email = payload.email as string;

        // ----------------------------------------------------
        // UPSERT USER — ensures user exists with correct email
        // ----------------------------------------------------
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                // If user exists, ensure email still stored & cleaned
                email,
            },
            create: {
                // First-time user
                email,
                allergies: [],
                conditions: [],
            },
        });

        // ----------------------------------------------------
        // CREATE SESSION PAYLOAD
        // ----------------------------------------------------
        // ----------------------------------------------------
        // CREATE DB SESSION
        // ----------------------------------------------------
        const session = await createSession(user.id, req);

        // Log history
        await logLoginHistory(user.id, req, "SUCCESS", "Magic Link Login");

        // ----------------------------------------------------
        // CREATE SESSION PAYLOAD
        // ----------------------------------------------------
        const sessionPayload = {
            userId: user.id,
            sessionId: session.id,
            email: user.email ?? "",
            phoneNumber: user.phoneNumber ?? "",
            firebaseUid: user.firebaseUid ?? "",
        };

        // Sign session token
        const sessionToken = await signSession(sessionPayload);

        // ----------------------------------------------------
        // SET SECURE COOKIE
        // ----------------------------------------------------
        const cookieStore = await cookies();
        cookieStore.set("session_token", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        // ----------------------------------------------------
        // REDIRECT TO HOME
        // ----------------------------------------------------
        return NextResponse.redirect(new URL("/", req.url));

    } catch (error) {
        console.error("Magic Link verification error:", error);
        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
