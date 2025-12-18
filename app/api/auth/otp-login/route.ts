import { NextRequest, NextResponse } from "next/server";
import { auth as adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { signSession, updateSession, createSession, logLoginHistory } from "@/lib/session";
import { cookies } from "next/headers";

// --------------------------------------------
// IN-MEMORY RATE LIMIT
// --------------------------------------------
const rateLimitMap = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

// --------------------------------------------
// DEVICE DETECTOR
// --------------------------------------------
function detectDevice(req: NextRequest) {
    const ua = req.headers.get("user-agent") || "";
    if (/mobile|android|iphone|ipad/i.test(ua)) return "Mobile";
    if (/windows/i.test(ua)) return "Windows";
    if (/macintosh/i.test(ua)) return "Mac";
    if (/linux/i.test(ua)) return "Linux";
    return "Unknown Device";
}

// --------------------------------------------
// RATE LIMIT FUNCTION
// --------------------------------------------
function rateLimit(ip: string) {
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, lastAttempt: now });
        return true;
    }

    const entry = rateLimitMap.get(ip)!;

    if (now - entry.lastAttempt > WINDOW_MS) {
        entry.count = 1;
        entry.lastAttempt = now;
        return true;
    }

    if (entry.count >= MAX_ATTEMPTS) return false;

    entry.count++;
    entry.lastAttempt = now;
    return true;
}

// --------------------------------------------
// MAIN LOGIN ROUTE
// --------------------------------------------
export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const device = detectDevice(req);

        // 1️⃣ RATE LIMIT
        if (!rateLimit(ip)) {
            return NextResponse.json(
                { message: "Too many OTP attempts. Try again later.", blocked: true },
                { status: 429 }
            );
        }

        // 2️⃣ EXTRACT TOKEN
        const { idToken } = await req.json();
        if (!idToken) {
            return NextResponse.json(
                { message: "ID token is required." },
                { status: 400 }
            );
        }

        // 3️⃣ VERIFY FIREBASE TOKEN
        const decodedToken = await adminAuth.verifyIdToken(idToken, true);
        const phoneNumber = decodedToken.phone_number ?? null;
        const firebaseUid = decodedToken.uid ?? null;

        if (!phoneNumber) {
            return NextResponse.json(
                { message: "Phone number missing in token." },
                { status: 400 }
            );
        }

        // 4️⃣ FIND EXISTING USER
        const existingUser = await prisma.user.findUnique({
            where: { phoneNumber },
        });

        const isNewUser = !existingUser;

        // 5️⃣ UPSERT USER
        const user = await prisma.user.upsert({
            where: { phoneNumber },
            update: {
                firebaseUid: firebaseUid ?? existingUser?.firebaseUid ?? "",
            },
            create: {
                phoneNumber,
                firebaseUid: firebaseUid ?? "",
            },
        });

        // 6️⃣ SUSPICIOUS LOGIN? (NO DB FIELDS → ALWAYS FALSE)
        const suspiciousLogin = false;

        // 7️⃣ (REMOVED) LOGIN HISTORY — table no longer exists
        // 8️⃣ (REMOVED) lastLoginAt, lastLoginIp, lastLoginDevice

        // 9️⃣ SESSION CREATION (DB-BACKED)
        const session = await createSession(user.id, req);

        // 🔟 SESSION PAYLOAD
        const sessionPayload = {
            userId: user.id,
            sessionId: session.id,
            phoneNumber: user.phoneNumber ?? "",
            firebaseUid: user.firebaseUid ?? "",
        };

        // 1️⃣1️⃣ SIGN TOKEN
        const token = await signSession(sessionPayload);

        // 1️⃣2️⃣ LOG HISTORY
        await logLoginHistory(user.id, req, "SUCCESS", "Phone Login via OTP");

        // 1️⃣3️⃣ SET COOKIE
        const cookieStore = await cookies();
        cookieStore.set("session_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        // 1️⃣4️⃣ RESPONSE
        return NextResponse.json({
            success: true,
            newUser: isNewUser,
            suspiciousLogin,
            ip,
            device,
            user: {
                id: user.id,
                phoneNumber: user.phoneNumber,
            },
        });

    } catch (error: any) {
        console.error("🔥 OTP Login Error:", error);

        // Firebase auth error
        if (error.code?.startsWith("auth/")) {
            return NextResponse.json(
                { message: "Invalid or expired OTP token." },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { message: "Internal server error." },
            { status: 500 }
        );
    }
}
