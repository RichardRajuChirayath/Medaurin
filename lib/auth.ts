import { NextAuthOptions, DefaultSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// --------------------
// NextAuth type augmentation
// --------------------
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
        } & DefaultSession["user"];
    }
}

// --------------------
// Auth options
// --------------------
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,

    providers: [
        EmailProvider({
            from: process.env.EMAIL_FROM,

            async sendVerificationRequest({ identifier, url }) {
                const response = await fetch(
                    "https://api.brevo.com/v3/smtp/email",
                    {
                        method: "POST",
                        headers: {
                            "api-key": process.env.BREVO_API_KEY as string,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            sender: {
                                email: process.env.EMAIL_FROM,
                                name: "Medaurin",
                            },
                            to: [
                                {
                                    email: identifier,
                                },
                            ],
                            subject: "Sign in to Medaurin",
                            htmlContent: `
                                <p>Hello,</p>
                                <p>Click the link below to sign in to <strong>Medaurin</strong>:</p>
                                <p><a href="${url}">${url}</a></p>
                                <p>This link will expire in 10 minutes.</p>
                                <p>If you did not request this email, you can safely ignore it.</p>
                            `,
                        }),
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error("Brevo email failed: " + errorText);
                }
            },
        }),
    ],

    pages: {
        signIn: "/login",
        verifyRequest: "/auth/verify-request",
        error: "/auth/error",
    },

    session: {
        strategy: "jwt",
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.userId = user.id;
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.userId as string;
            }
            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
};
