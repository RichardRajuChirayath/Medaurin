import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  pages: {
    signIn: "/", // your login page
  },

  session: {
    strategy: "database", // store sessions in Prisma DB
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id; // attach user id to session
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});

// IMPORTANT: Export for App Router
export { handler as GET, handler as POST };