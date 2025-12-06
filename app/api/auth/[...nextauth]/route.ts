import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

// IMPORTANT: Export for App Router
export { handler as GET, handler as POST };