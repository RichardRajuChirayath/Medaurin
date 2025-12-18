// import NextAuth from "next-auth";
// import { authOptions } from "@/lib/auth";

// const handler = NextAuth(authOptions);

// // IMPORTANT: Export for App Router
// export { handler as GET, handler as POST };

export function GET() {
    return new Response("Use /api/auth/otp-login for authentication", { status: 404 });
}
export function POST() {
    return new Response("Use /api/auth/otp-login for authentication", { status: 404 });
}