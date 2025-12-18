import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || "default-32-char-encryption-key!!" // Must be 32 chars
const IV_LENGTH = 16

// AES-256-CBC encryption
function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")
    return iv.toString("hex") + ":" + encrypted
}

function decrypt(text: string): string {
    const parts = text.split(":")
    const iv = Buffer.from(parts.shift()!, "hex")
    const encryptedText = Buffer.from(parts.join(":"), "hex")
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)
    let decrypted = decipher.update(encryptedText, undefined, "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
}

// GET - Get email config
export async function GET() {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const config = await prisma.emailConfig.findUnique({
            where: { userId: session.userId },
            select: {
                id: true,
                email: true,
                imapServer: true,
                imapPort: true,
                autoImportEnabled: true,
                lastSyncedAt: true,
                createdAt: true
            }
        })

        return NextResponse.json(config || {})
    } catch (error) {
        console.error("Error fetching email config:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Save/update email config
export async function POST(req: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { email, imapServer, imapPort, appPassword, autoImportEnabled } = await req.json()

        if (!email || !imapServer || !appPassword) {
            return NextResponse.json(
                { error: "Email, IMAP server, and app password are required" },
                { status: 400 }
            )
        }

        // Encrypt the app password
        const encryptedPassword = encrypt(appPassword)

        const config = await prisma.emailConfig.upsert({
            where: { userId: session.userId },
            create: {
                userId: session.userId,
                email,
                imapServer,
                imapPort: imapPort || 993,
                encryptedPassword,
                autoImportEnabled: autoImportEnabled || false
            },
            update: {
                email,
                imapServer,
                imapPort: imapPort || 993,
                encryptedPassword,
                autoImportEnabled: autoImportEnabled || false
            }
        })

        return NextResponse.json({
            id: config.id,
            email: config.email,
            imapServer: config.imapServer,
            autoImportEnabled: config.autoImportEnabled
        })
    } catch (error: any) {
        console.error("Error saving email config:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE - Remove email config
export async function DELETE() {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await prisma.emailConfig.delete({
            where: { userId: session.userId }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Error deleting email config:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
