"use client"

import { useState } from "react"
import { useFcmToken } from "@/hooks/use-fcm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Bell, Copy, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function NotificationTester() {
    const { fcmToken, requestPermission, permission } = useFcmToken()

    // Test Message State
    const [title, setTitle] = useState("Hello from MixSafe")
    const [body, setBody] = useState("This is a test notification!")
    const [sending, setSending] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleCopyToken = () => {
        if (fcmToken) {
            navigator.clipboard.writeText(fcmToken)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            toast.success("Token copied to clipboard")
        }
    }

    const handleSendTest = async () => {
        if (!fcmToken) {
            toast.error("No FCM token available. Allow permissions first.")
            return
        }

        setSending(true)
        try {
            const res = await fetch("/api/send-notification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: fcmToken,
                    title,
                    body
                })
            })

            const data = await res.json()
            if (res.ok) {
                toast.success("Notification sent!", { description: "You should see it shortly." })
            } else {
                throw new Error(data.error)
            }
        } catch (error: any) {
            toast.error("Failed to send", { description: error.message })
        } finally {
            setSending(false)
        }
    }

    return (
        <Card className="max-w-md w-full mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-500" />
                    Push Notification Tester
                </CardTitle>
                <CardDescription>
                    Debug FCM notifications on Web & Mobile
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* STATUS & TOKEN */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <span className="text-sm font-medium">Status</span>
                        {fcmToken ? (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">Active</span>
                        ) : (
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-bold">Waiting...</span>
                        )}
                    </div>

                    {!fcmToken && permission !== 'granted' && (
                        <Button onClick={requestPermission} className="w-full">
                            Enable Notifications
                        </Button>
                    )}

                    {fcmToken && (
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500 uppercase">Device Token</Label>
                            <div className="flex gap-2">
                                <code className="flex-1 bg-slate-950 text-slate-50 p-2 rounded text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                                    {fcmToken}
                                </code>
                                <Button size="icon" variant="outline" onClick={handleCopyToken} className="shrink-0">
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* TEST SENDER */}
                <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Body</Label>
                        <Input value={body} onChange={e => setBody(e.target.value)} />
                    </div>
                    <Button
                        onClick={handleSendTest}
                        disabled={sending || !fcmToken}
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                        {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Test Push
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
