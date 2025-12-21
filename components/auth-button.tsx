"use client";

import { useAuth } from "@/components/auth-provider";
import { User, LogOut, History, Loader2, Mail, Receipt, Shield } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// Generate deterministic gradient from email hash
function generateGradient(input: string = "user") {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = input.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `linear-gradient(135deg, hsl(${h}, 80%, 60%), hsl(${(h + 60) % 360}, 80%, 60%))`;
}

export function AuthButton() {
    const { user, loading, logout } = useAuth();
    const [showMenu, setShowMenu] = useState(false);

    // Normalize
    const u = (user || {}) as any;

    // ---------------------------
    // DISPLAY NAME LOGIC
    // ---------------------------
    const emailName = u.email ? u.email.split("@")[0] : null;

    const displayName = emailName || u.phoneNumber || "Member";
    const subInfo = u.email || u.phoneNumber || "Verified User";

    // ---------------------------
    // STATUS DOT SYSTEM
    // ---------------------------
    const [status, setStatus] = useState<"online" | "idle" | "away">("online");
    const lastActivityRef = useRef(Date.now())

    useEffect(() => {
        const updateActivity = () => {
            lastActivityRef.current = Date.now()
        }
        window.addEventListener("mousemove", updateActivity);
        window.addEventListener("keydown", updateActivity);

        const interval = setInterval(() => {
            const diff = Date.now() - lastActivityRef.current;
            if (diff < 30000) setStatus("online");
            else if (diff < 120000) setStatus("idle");
            else setStatus("away");
        }, 5000);

        return () => {
            window.removeEventListener("mousemove", updateActivity);
            window.removeEventListener("keydown", updateActivity);
            clearInterval(interval);
        };
    }, []); // Empty deps - we use ref, not state

    const statusColor =
        status === "online"
            ? "bg-green-500"
            : status === "idle"
                ? "bg-yellow-500"
                : "bg-red-500";

    // ---------------------------
    // BADGES
    // ---------------------------
    const badge =
        u.createdAt
            ? (Date.now() - new Date(u.createdAt).getTime()) / 86400000 < 7
                ? "🆕 New User"
                : emailName?.length > 12
                    ? "🔥 Power User"
                    : "⭐ Verified"
            : "⭐ Verified";

    // ---------------------------
    // DROPDOWN ANIMATION
    // ---------------------------
    const dropdownAnimation =
        "transition-all duration-300 origin-top-right scale-100 animate-[fadeIn_0.15s_ease-out]";

    // ---------------------------
    // KEYBOARD SHORTCUTS
    // ---------------------------
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key === "M") setShowMenu((s) => !s);
            if (e.shiftKey && e.key === "L") logout();
            if (e.shiftKey && e.key === "P") window.location.href = "/profile";
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [logout]);

    // ---------------------------
    // KONAMI EASTER EGG
    // ---------------------------
    useEffect(() => {
        const sequence = [
            "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
            "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
        ];
        let pos = 0;

        const check = (e: KeyboardEvent) => {
            if (e.key === sequence[pos]) {
                pos++;
                if (pos === sequence.length) {
                    document.body.classList.add("konami-glow");
                    setTimeout(() => document.body.classList.remove("konami-glow"), 3000);
                    pos = 0;
                }
            } else pos = 0;
        };

        window.addEventListener("keydown", check);
        return () => window.removeEventListener("keydown", check);
    }, []);

    // ---------------------------
    // LOADING STATE
    // ---------------------------
    if (loading) {
        return (
            <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            </div>
        );
    }

    // ---------------------------
    // LOGGED-IN UI
    // ---------------------------
    if (user) {
        const avatarBg = generateGradient(u.email || u.phoneNumber || "user");

        return (
            <div className="relative group">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-3 p-3 rounded-xl backdrop-blur-xl
                     bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80
                     border border-slate-200/50 dark:border-slate-700/50 transition-all
                     shadow-lg hover:shadow-xl"
                >
                    <div
                        className="relative w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ background: avatarBg }}
                    >
                        {displayName.charAt(0).toUpperCase()}

                        {/* STATUS DOT */}
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-white ${statusColor}`} />
                    </div>

                    <div className="text-left hidden md:block">
                        <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {displayName}
                            <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-lg">
                                {badge}
                            </span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{subInfo}</p>
                    </div>
                </button>

                {/* Hover analytics card */}
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 hidden group-hover:flex
                        bg-black/80 text-white text-xs px-3 py-2 rounded-xl backdrop-blur-lg">
                    Active: {status} · Last: {Math.floor((Date.now() - lastActivityRef.current) / 1000)}s ago
                </div>

                {showMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMenu(false)}
                        />

                        <div
                            className={`absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 
                          rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700
                          overflow-hidden z-50 p-2 ${dropdownAnimation}`}
                        >
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                <p className="font-bold text-slate-900 dark:text-white">{displayName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{subInfo}</p>
                            </div>

                            <Link
                                href="/caregiver"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">Caregiver Portal</p>
                                    <p className="text-xs text-slate-500">Monitor family health</p>
                                </div>
                            </Link>

                            <a
                                href="/profile"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <User className="w-5 h-5 text-purple-600" />
                                Profile Settings
                            </a>

                            <a
                                href="/medications"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <History className="w-5 h-5 text-emerald-600" />
                                My Medications
                            </a>

                            <a
                                href="/expenses"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <Receipt className="w-5 h-5 text-amber-600" />
                                Expense Tracker
                            </a>

                            <a
                                href="/history"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <History className="w-5 h-5 text-indigo-600" />
                                View History
                            </a>

                            <button
                                onClick={logout}
                                className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <LogOut className="w-5 h-5 text-red-600" />
                                <span className="text-red-600">Sign Out</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // ---------------------------
    // LOGGED OUT UI
    // ---------------------------
    return (
        <Link
            href="/login"
            className="group relative px-6 py-3 rounded-xl backdrop-blur-xl bg-white/60 
                 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80
                 border border-slate-200/50 dark:border-slate-700/50 transition-all
                 shadow-lg hover:shadow-xl flex items-center gap-2"
        >
            <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-slate-900 dark:text-white">
                Login
            </span>
        </Link>
    );
}
