import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    // 1. Clear custom session
    await clearSession();

    // 2. NextAuth session clearing is typically handled client-side via signOut()
    // but we can also manually expire the cookie here for safety if needed.
    // However, the standard way in NextAuth is signOut from next-auth/react.

    return NextResponse.json({ success: true });
}

export async function GET(req: Request) {
    await clearSession();
    return NextResponse.redirect(new URL("/", req.url));
}
