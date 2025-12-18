import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Secret key from environment
const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
    throw new Error("The SESSION_SECRET environment variable is not set.");
}
const key = new TextEncoder().encode(secretKey);

// Session payload supports ALL auth methods
export interface SessionPayload extends JWTPayload {
    userId: string;       // always required
    sessionId: string;    // Database Session ID
    email?: string;       // for magic link
    firebaseUid?: string; // for Firebase login
    phoneNumber?: string; // optional for phone-based login
}

/**
 * Create a new session in the database.
 */
export async function createSession(userId: string, req?: NextRequest) {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    let ipAddress = "Unknown";
    let userAgent = "Unknown";
    let device = "Unknown Device";

    if (req) {
        ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || "Unknown";
        userAgent = req.headers.get("user-agent") || "Unknown";

        // Simple device detection
        if (userAgent.includes("Mobile")) device = "Mobile";
        if (userAgent.includes("iPhone")) device = "iPhone";
        if (userAgent.includes("iPad")) device = "iPad";
        if (userAgent.includes("Android")) device = "Android";
        if (userAgent.includes("Windows")) device = "Windows PC";
        if (userAgent.includes("Macintosh")) device = "Mac";
        if (userAgent.includes("Linux")) device = "Linux PC";
    }

    const session = await prisma.session.create({
        data: {
            userId,
            sessionToken: "pending", // Will act as ID for now, or could store JWT signature
            expires,
            ipAddress,
            userAgent,
            device
        }
    });

    return session;
}

/**
 * Log a login history event
 */
export async function logLoginHistory(userId: string, req: NextRequest, status: "SUCCESS" | "FAILED", details?: string) {
    try {
        const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || "Unknown";
        const userAgent = req.headers.get("user-agent") || "Unknown";

        let device = "Unknown";
        if (userAgent.includes("Mobile")) device = "Mobile";
        else if (userAgent.includes("Windows")) device = "Windows";
        else if (userAgent.includes("Mac")) device = "Mac";

        await prisma.loginHistory.create({
            data: {
                userId,
                status,
                ipAddress,
                userAgent,
                device,
                location: details
            }
        });
    } catch (e) {
        console.error("Failed to log login history", e);
    }
}

/**
 * Create a signed session token (JWT) linked to a DB session.
 */
export async function signSession(payload: SessionPayload) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(key);

    // Update the DB session with the token (optional, but good for reference if needed)
    // We already have the ID in the payload.
    // Let's just return the token.
    return token;
}

/**
 * Update an existing session with new values (payload only).
 * Note: Does not update DB currently, only the JWT.
 */
export async function updateSession(
    request: NextRequest,
    newPayload: Partial<SessionPayload>
) {
    const cookie = request.cookies.get("session_token")?.value;
    if (!cookie) return null;

    let oldPayload: JWTPayload;

    try {
        const verified = await jwtVerify(cookie, key, {
            algorithms: ["HS256"],
        });
        oldPayload = verified.payload;
    } catch (err) {
        return null;
    }

    const merged = { ...oldPayload, ...newPayload } as SessionPayload;
    return await signSession(merged);
}

/**
 * Read and verify the session from cookies.
 * Checks against Database to ensure session is active.
 */
export async function getSession() {
    const token = (await cookies()).get("session_token")?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ["HS256"],
        });

        const sessionPayload = payload as SessionPayload;

        // 1. Check if session ID exists in DB
        if (sessionPayload.sessionId) {
            const dbSession = await prisma.session.findUnique({
                where: { id: sessionPayload.sessionId }
            });

            if (!dbSession) {
                // Session revoked or not found
                return null;
            }

            // 2. Optional: Check expiration if DB has stricter rules
            if (dbSession.expires < new Date()) {
                // clean up
                await prisma.session.delete({ where: { id: dbSession.id } }).catch(() => { });
                return null;
            }

            // 3. Update lastActive (async, don't await/block)
            prisma.session.update({
                where: { id: dbSession.id },
                data: { lastActive: new Date() }
            }).catch(err => {
                console.error("Failed to update session activity", err);
            });
        }

        return sessionPayload;
    } catch (err) {
        return null;
    }
}

/**
 * Clear the session cookie.
 */
export async function clearSession() {
    (await cookies()).delete("session_token");
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => { });
}

/**
 * Revoke all sessions for a user (except optionally one)
 */
export async function revokeAllUserSessions(userId: string, keepSessionId?: string) {
    if (keepSessionId) {
        await prisma.session.deleteMany({
            where: {
                userId,
                id: { not: keepSessionId }
            }
        });
    } else {
        await prisma.session.deleteMany({ where: { userId } });
    }
}
