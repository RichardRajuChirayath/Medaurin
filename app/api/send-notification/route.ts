import { NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Ensure Firebase Admin is initialized (reuse existing lib logic slightly modified for here)
// We need to import the initialized app from lib/firebase-admin if possible, 
// or re-initialize safely.
if (!admin.apps.length) {
    try {
        // Should rely on lib/firebase-admin initialization if that file is imported elsewhere
        // But for safety in a route, we can do this:
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
            });
        }
    } catch (e) {
        console.error("Firebase admin init fail", e);
    }
}

export async function POST(req: Request) {
    try {
        const { token, title, body, imageUrl } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Token is required" }, { status: 400 });
        }

        const message: admin.messaging.Message = {
            token: token,
            notification: {
                title: title || "Test Notification",
                body: body || "This is a test message from MixSafe.",
                imageUrl: imageUrl || undefined,
            },
            // Android specific settings
            android: {
                notification: {
                    imageUrl: imageUrl || undefined,
                },
            },
            // Apple specific settings
            apns: {
                payload: {
                    aps: {
                        "mutable-content": 1,
                    },
                },
                fcmOptions: {
                    imageUrl: imageUrl || undefined,
                },
            },
        };

        const response = await admin.messaging().send(message);
        return NextResponse.json({ success: true, messageId: response });

    } catch (error: any) {
        console.error("Error sending notification:", error);
        return NextResponse.json({ error: error.message || "Failed to send" }, { status: 500 });
    }
}
