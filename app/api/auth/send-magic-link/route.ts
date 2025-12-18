import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ message: "Email is required" }, { status: 400 });
        }

        const secretKey = process.env.SESSION_SECRET;
        if (!secretKey) throw new Error("SESSION_SECRET missing");
        const key = new TextEncoder().encode(secretKey);

        const token = await new SignJWT({ email, type: "magic-link" })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("10m")
            .sign(key);

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const magicLink = `${appUrl}/api/auth/magic-link?token=${token}`;

        // Send email via Brevo
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": process.env.BREVO_API_KEY as string,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                sender: { email: process.env.EMAIL_FROM },
                to: [{ email }],
                subject: "Your Magic Login Link",
                htmlContent: `<p>Click here to login: <a href="${magicLink}">Login to MixSafe</a></p>`,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Brevo Error:", errorText);
            return NextResponse.json({ message: "Failed to send email" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Magic link sent" });
    } catch (error) {
        console.error("Magic Link Error:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
