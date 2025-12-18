import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { CaregiverDashboard } from "@/components/caregiver-dashboard"

export default async function CaregiverPage() {
    const session = await getSession()

    if (!session?.userId) {
        redirect("/login?next=/caregiver")
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 md:px-8">
            <div className="max-w-6xl mx-auto">
                <CaregiverDashboard />
            </div>
        </div>
    )
}
