"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CaregiverRequestNotifications } from "@/components/caregiver-request-notifications"

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    User, Shield, Pill, AlertTriangle, Save, X, Plus,
    Smartphone, Globe, Clock, MapPin, Loader2, LogOut, Trash2
} from "lucide-react"
import { toast } from "sonner"

// Types
interface Session {
    id: string
    ipAddress: string
    userAgent: string
    device: string
    lastActive: string
    createdAt: string
    isCurrent: boolean
}

interface LoginHistory {
    id: string
    ipAddress: string
    device: string
    status: string
    createdAt: string
    location?: string
}

interface UserProfile {
    id: string
    name: string | null
    username: string | null
    email: string | null
    phoneNumber: string | null
    avatarUrl: string | null
    allergies: string[]
    conditions: string[]
    notificationSettings: any
    createdAt: string
}

export default function ProfilePage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [sessions, setSessions] = useState<Session[]>([])
    const [history, setHistory] = useState<LoginHistory[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Form States
    const [name, setName] = useState("")
    const [username, setUsername] = useState("")
    const [avatarUrl, setAvatarUrl] = useState("")
    const [allergies, setAllergies] = useState<string[]>([])
    const [conditions, setConditions] = useState<string[]>([])

    // Notifications
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        marketing: false
    })

    useEffect(() => {
        if (!loading && !user) router.push("/login")
        if (user) loadData()
    }, [user, loading])

    const loadData = async () => {
        setIsLoading(true)
        try {
            // Parallel fetch
            const [profileRes, sessionsRes, historyRes] = await Promise.all([
                fetch("/api/profile"),
                fetch("/api/sessions"),
                fetch("/api/login-history")
            ])

            if (profileRes.ok) {
                const data = await profileRes.json()
                setProfile(data)
                setName(data.name || "")
                setUsername(data.username || "")
                setAvatarUrl(data.avatarUrl || "")
                setAllergies(data.allergies || [])
                setConditions(data.conditions || [])
                if (data.notificationSettings) {
                    setNotifications(data.notificationSettings)
                }
            }

            if (sessionsRes.ok) setSessions(await sessionsRes.json())
            if (historyRes.ok) setHistory(await historyRes.json())

        } catch (error) {
            toast.error("Failed to load profile data")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveProfile = async () => {
        setIsSaving(true)
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    username,
                    avatarUrl,
                    allergies,
                    conditions,
                    notificationSettings: notifications
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setProfile(data)
            toast.success("Profile updated successfully")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleRevokeSession = async (sessionId: string) => {
        try {
            const res = await fetch("/api/sessions", {
                method: "DELETE",
                body: JSON.stringify({ sessionId })
            })
            if (res.ok) {
                setSessions(prev => prev.filter(s => s.id !== sessionId))
                toast.success("Session revoked")
            }
        } catch (e) {
            toast.error("Failed to revoke session")
        }
    }

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure? This cannot be undone.")) return
        try {
            await fetch("/api/profile", { method: "DELETE" })
            router.push("/")
            toast.success("Account deleted")
        } catch (e) {
            toast.error("Failed to delete account")
        }
    }

    // Health Helpers
    const [newAllergy, setNewAllergy] = useState("")
    const [newCondition, setNewCondition] = useState("")

    const addAllergy = () => {
        if (newAllergy && !allergies.includes(newAllergy)) {
            setAllergies([...allergies, newAllergy])
            setNewAllergy("")
        }
    }

    const addCondition = () => {
        if (newCondition && !conditions.includes(newCondition)) {
            setConditions([...conditions, newCondition])
            setNewCondition("")
        }
    }

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    )

    return (
        <div className="container max-w-5xl mx-auto py-10 px-4 space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Account Settings
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Manage your profile, health data, and security preferences.
                    </p>
                </div>
                <Avatar className="w-16 h-16 border-2 border-slate-200 dark:border-slate-700">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-xl">
                        {name?.[0] || profile?.phoneNumber?.[0] || "U"}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Caregiver Requests Banner */}
            <CaregiverRequestNotifications />

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px] h-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <TabsTrigger value="profile" className="py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">Profile</TabsTrigger>
                    <TabsTrigger value="health" className="py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">Health</TabsTrigger>
                    <TabsTrigger value="security" className="py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">Security</TabsTrigger>
                    <TabsTrigger value="account" className="py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">Account</TabsTrigger>
                </TabsList>

                {/* PROFILE TAB */}
                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your public profile details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Display Name</Label>
                                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="@johndoe" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Avatar URL</Label>
                                <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveProfile} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* HEALTH TAB */}
                <TabsContent value="health" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Medical Profile</CardTitle>
                            <CardDescription>Manage your allergies and conditions for accurate interaction checks.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Allergies */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Allergies</Label>
                                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Critical</Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {allergies.map(a => (
                                        <Badge key={a} variant="secondary" className="pl-3 pr-1 py-1.5 flex gap-2">
                                            {a}
                                            <button onClick={() => setAllergies(allergies.filter(x => x !== a))} className="hover:bg-slate-200 rounded-full p-0.5">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={newAllergy}
                                        onChange={e => setNewAllergy(e.target.value)}
                                        placeholder="Add allergy..."
                                        className="max-w-xs"
                                        onKeyDown={e => e.key === 'Enter' && addAllergy()}
                                    />
                                    <Button size="sm" onClick={addAllergy}><Plus className="w-4 h-4" /> Add</Button>
                                </div>
                            </div>

                            <Separator />

                            {/* Conditions */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Medical Conditions</Label>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Info</Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {conditions.map(c => (
                                        <Badge key={c} variant="secondary" className="pl-3 pr-1 py-1.5 flex gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                                            {c}
                                            <button onClick={() => setConditions(conditions.filter(x => x !== c))} className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={newCondition}
                                        onChange={e => setNewCondition(e.target.value)}
                                        placeholder="Add condition..."
                                        className="max-w-xs"
                                        onKeyDown={e => e.key === 'Enter' && addCondition()}
                                    />
                                    <Button size="sm" onClick={addCondition}><Plus className="w-4 h-4" /> Add</Button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveProfile} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Health Profile
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* SECURITY TAB */}
                <TabsContent value="security" className="space-y-6">
                    {/* Active Sessions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Sessions</CardTitle>
                            <CardDescription>Manage devices where you are currently logged in.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {sessions.map((session) => (
                                    <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded-full border shadow-sm">
                                                {session.device.includes("Mobile") ? <Smartphone className="w-5 h-5 text-slate-500" /> : <Globe className="w-5 h-5 text-slate-500" />}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                                    {session.device}
                                                    {session.isCurrent && <Badge className="ml-2 bg-green-500 hover:bg-green-600">Current Device</Badge>}
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                    <MapPin className="w-3 h-3" /> {session.ipAddress}
                                                    <span className="text-slate-300">•</span>
                                                    <Clock className="w-3 h-3" /> Last active {format(new Date(session.lastActive), "MMM d, h:mm a")}
                                                </div>
                                            </div>
                                        </div>
                                        {!session.isCurrent && (
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleRevokeSession(session.id)}>
                                                Revoke
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {sessions.length === 0 && <p className="text-sm text-slate-500 italic">No active sessions found.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Login History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Login History</CardTitle>
                            <CardDescription>Recent login attempts to your account.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Device</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((h) => (
                                        <TableRow key={h.id}>
                                            <TableCell className="text-xs font-medium">
                                                {format(new Date(h.createdAt), "MMM d, yyyy h:mm a")}
                                            </TableCell>
                                            <TableCell className="text-xs">{h.device}</TableCell>
                                            <TableCell className="text-xs font-mono text-slate-500">{h.ipAddress}</TableCell>
                                            <TableCell>
                                                <Badge variant={h.status === "SUCCESS" ? "default" : "destructive"} className={h.status === "SUCCESS" ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : ""}>
                                                    {h.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {history.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-slate-500">
                                                No login history available.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ACCOUNT TAB */}
                <TabsContent value="account" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>Manage how we contact you.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input value={profile?.email || ""} disabled className="bg-slate-100" />
                                <p className="text-xs text-slate-500">Contact support to change your email.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input value={profile?.phoneNumber || ""} disabled className="bg-slate-100" />
                                <p className="text-xs text-slate-500">Managed via verified login.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>Choose what updates you want to receive.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Email Notifications</Label>
                                    <p className="text-sm text-slate-500">Receive security alerts and updates.</p>
                                </div>
                                <Switch
                                    checked={notifications.email}
                                    onCheckedChange={(c) => setNotifications({ ...notifications, email: c })}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Push Notifications</Label>
                                    <p className="text-sm text-slate-500">Receive alerts on your devices.</p>
                                </div>
                                <Switch
                                    checked={notifications.push}
                                    onCheckedChange={(c) => setNotifications({ ...notifications, push: c })}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Marketing Emails</Label>
                                    <p className="text-sm text-slate-500">Receive news and promotional offers.</p>
                                </div>
                                <Switch
                                    checked={notifications.marketing}
                                    onCheckedChange={(c) => setNotifications({ ...notifications, marketing: c })}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveProfile} disabled={isSaving}>Save Preferences</Button>
                        </CardFooter>
                    </Card>

                    <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/10">
                        <CardHeader>
                            <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                            <CardDescription className="text-red-800/60 dark:text-red-400/60">Irreversible account actions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                                Deleting your account will permanently remove all your data, including medical history and settings. This action cannot be undone.
                            </p>
                            <Button variant="destructive" onClick={handleDeleteAccount} className="w-full sm:w-auto">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Account
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
