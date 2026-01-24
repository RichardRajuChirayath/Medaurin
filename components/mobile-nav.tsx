"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Pill, Receipt, Shield, User, History, Bot } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

export function MobileNav() {
    const pathname = usePathname()
    const { user } = useAuth()

    if (!user) return null

    const navItems = [
        {
            label: "Home",
            icon: Home,
            href: "/",
        },
        {
            label: "Guardian",
            icon: Shield,
            href: "/caregiver",
        },
        {
            label: "Assistant",
            icon: Bot,
            href: "#chat",
            onClick: (e: React.MouseEvent) => {
                e.preventDefault()
                window.dispatchEvent(new CustomEvent('open-medaurin-chat'))
            }
        },
        {
            label: "Expenses",
            icon: Receipt,
            href: "/expenses",
        },
        {
            label: "Profile",
            icon: User,
            href: "/profile",
        },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 block md:hidden">
            {/* Bottom Glow */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-indigo-500/20 to-transparent blur-2xl pointer-events-none" />

            <nav className="relative mx-4 mb-6 px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] flex items-center justify-between">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={item.onClick}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-all duration-300 relative group",
                                isActive ? "scale-110" : "opacity-60 grayscale-[0.5]"
                            )}
                        >
                            {isActive && (
                                <div className="absolute -top-2 w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.8)]" />
                            )}

                            <div className={cn(
                                "p-2 rounded-xl transition-all duration-300",
                                isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/40" : "group-hover:bg-slate-100 dark:group-hover:bg-slate-800"
                            )}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-tighter",
                                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            {/* Safe Area spacing */}
            <div className="h-safe-area shadow-none" />
        </div>
    )
}
