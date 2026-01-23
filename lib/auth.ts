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
                                <div style="font-family: 'Outfit', 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc; color: #0f172a;">
                                    <div style="text-align: center; margin-bottom: 30px;">
                                        <div style="font-size: 32px; font-weight: 900; color: #7c3aed; letter-spacing: -1px; margin-bottom: 8px;">
                                            🛡️ Medaurin
                                        </div>
                                        <div style="font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; tracking: 2px;">
                                            Medicine Safety Portal
                                        </div>
                                    </div>
                                    
                                    <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
                                        <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; text-align: center;">
                                            Welcome Back
                                        </div>
                                        
                                        <p style="font-size: 16px; line-height: 24px; color: #475569; margin-bottom: 32px; text-align: center;">
                                            Click the button below to securely sign in to your Medaurin dashboard. This link is only valid for 10 minutes.
                                        </p>
                                        
                                        <div style="text-align: center; margin-bottom: 32px;">
                                            <a href="${url}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 18px 48px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 18px; box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.39); transition: all 0.2s ease;">
                                                Sign In to Dashboard
                                            </a>
                                        </div>
                                        
                                        <div style="padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
                                            <p style="font-size: 13px; color: #94a3b8; font-weight: 500; margin-bottom: 0;">
                                                If the button doesn't work, copy and paste this URL into your browser:
                                            </p>
                                            <p style="font-size: 13px; color: #7c3aed; word-break: break-all; margin-top: 8px; font-weight: 500;">
                                                ${url}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; font-weight: 500;">
                                        &copy; ${new Date().getFullYear()} Medaurin. Built for a safer medicated life.
                                        <br />
                                        You received this because you requested a sign-in link. If it wasn't you, safe to ignore.
                                    </div>
                                </div>
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
