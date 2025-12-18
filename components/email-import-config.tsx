"use client"

import { useState, useEffect } from "react"
import { Mail, Lock, Server, CheckCircle2, XCircle, Loader2, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface EmailConfig {
    id?: string
    email: string
    imapServer: string
    imapPort: number
    autoImportEnabled: boolean
}

export function EmailImportConfig() {
    const [config, setConfig] = useState<EmailConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form state
    const [email, setEmail] = useState("")
    const [appPassword, setAppPassword] = useState("")
    const [imapServer, setImapServer] = useState("imap.gmail.com")
    const [imapPort, setImapPort] = useState(993)
    const [autoImport, setAutoImport] = useState(false)
    const [showForm, setShowForm] = useState(false)

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            const res = await fetch("/api/expenses/email-config")
            if (res.ok) {
                const data = await res.json()
                if (data.id) {
                    setConfig(data)
                    setEmail(data.email)
                    setImapServer(data.imapServer)
                    setImapPort(data.imapPort)
                    setAutoImport(data.autoImportEnabled)
                }
            }
        } catch (error) {
            console.error("Error fetching config:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!email || !appPassword || !imapServer) {
            toast.error("All fields are required")
            return
        }

        setSaving(true)
        try {
            const res = await fetch("/api/expenses/email-config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    appPassword,
                    imapServer,
                    imapPort,
                    autoImportEnabled: autoImport
                })
            })

            if (res.ok) {
                toast.success("Email config saved! Credentials are encrypted with AES-256.")
                setAppPassword("") // Clear password field
                setShowForm(false)
                await fetchConfig()
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to save")
            }
        } catch (error) {
            toast.error("Error saving config")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Delete email configuration? This cannot be undone.")) return

        try {
            const res = await fetch("/api/expenses/email-config", { method: "DELETE" })
            if (res.ok) {
                toast.success("Email config deleted")
                setConfig(null)
                setEmail("")
                setAppPassword("")
            }
        } catch (error) {
            toast.error("Error deleting config")
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-600" />
                        Email Invoice Import (IMAP)
                    </CardTitle>
                    <CardDescription>
                        Automatically import pharmacy invoices from your email inbox
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {config ? (
                        <div className="space-y-4">
                            {/* Current Config Display */}
                            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <span className="font-bold text-green-900 dark:text-green-300">
                                        Email Import Configured
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Email:</strong> {config.email}</p>
                                    <p><strong>Server:</strong> {config.imapServer}:{config.imapPort}</p>
                                    <p>
                                        <strong>Auto-Import:</strong>{" "}
                                        <Badge variant={config.autoImportEnabled ? "default" : "secondary"}>
                                            {config.autoImportEnabled ? "Enabled" : "Disabled"}
                                        </Badge>
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setShowForm(true)}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Update Configuration
                                </Button>
                                <Button
                                    onClick={handleDelete}
                                    variant="destructive"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Mail className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                No email configuration found. Set up IMAP to auto-import invoices.
                            </p>
                            <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
                                <Mail className="w-4 h-4 mr-2" />
                                Configure Email Import
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Configuration Form */}
            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Email Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@gmail.com"
                            />
                        </div>

                        <div>
                            <Label className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                App-Specific Password (NOT your email password)
                            </Label>
                            <Input
                                type="password"
                                value={appPassword}
                                onChange={(e) => setAppPassword(e.target.value)}
                                placeholder="••••••••••••••••"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                🔒 Encrypted with AES-256. Never stored in plain text.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="flex items-center gap-2">
                                    <Server className="w-4 h-4" />
                                    IMAP Server
                                </Label>
                                <Input
                                    value={imapServer}
                                    onChange={(e) => setImapServer(e.target.value)}
                                    placeholder="imap.gmail.com"
                                />
                            </div>
                            <div>
                                <Label>Port</Label>
                                <Input
                                    type="number"
                                    value={imapPort}
                                    onChange={(e) => setImapPort(parseInt(e.target.value))}
                                    placeholder="993"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="autoImport"
                                checked={autoImport}
                                onChange={(e) => setAutoImport(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <Label htmlFor="autoImport" className="cursor-pointer">
                                Enable automatic daily import
                            </Label>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                            >
                                {saving ? "Saving..." : "Save Configuration"}
                            </Button>
                            <Button
                                onClick={() => setShowForm(false)}
                                variant="outline"
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Help Card */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                    <CardTitle className="text-lg">📧 How to Get an App Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div>
                        <strong>Gmail:</strong>
                        <ol className="list-decimal ml-5 mt-1 space-y-1">
                            <li>Go to Google Account → Security</li>
                            <li>Enable 2-Step Verification</li>
                            <li>Search "App passwords"</li>
                            <li>Generate a password for "Mail"</li>
                            <li>Copy the 16-character password</li>
                        </ol>
                    </div>
                    <div>
                        <strong>Outlook/Hotmail:</strong>
                        <p className="ml-5 mt-1">IMAP Server: <code>outlook.office365.com</code></p>
                    </div>
                    <div>
                        <strong>Yahoo:</strong>
                        <p className="ml-5 mt-1">IMAP Server: <code>imap.mail.yahoo.com</code></p>
                    </div>
                    <p className="text-xs text-blue-900 dark:text-blue-300 mt-3">
                        <strong>⚠️ Security:</strong> We NEVER store your real email password. Only app-specific
                        passwords are accepted and they're encrypted with AES-256.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
