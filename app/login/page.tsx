"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
    // Email Login State
    const [email, setEmail] = useState("");
    const [magicLinkSent, setMagicLinkSent] = useState(false);

    // Shared State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const { refreshUser } = useAuth();

    const handleSendMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("email", {
                email,
                callbackUrl: "/",
                redirect: false,
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            setMagicLinkSent(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to send magic link");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Sign in to access your account via magic link
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {!magicLinkSent ? (
                    <form onSubmit={handleSendMagicLink} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending Link...
                                </>
                            ) : (
                                <>
                                    Send Magic Link <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="text-center space-y-6 py-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                            <Mail className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Check your email</h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                We sent a login link to <br />
                                <span className="font-medium text-slate-900 dark:text-white">{email}</span>
                            </p>
                        </div>
                        <button
                            onClick={() => { setMagicLinkSent(false); setError(""); }}
                            className="w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Use a different email
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
