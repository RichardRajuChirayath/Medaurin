"use client";

import { useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2, Phone, CheckCircle, AlertCircle, Mail, ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
    const [loginMethod, setLoginMethod] = useState<"PHONE" | "EMAIL">("PHONE");

    // Phone Login State
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    // Email Login State
    const [email, setEmail] = useState("");
    const [magicLinkSent, setMagicLinkSent] = useState(false);

    // Shared State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const { refreshUser } = useAuth();

    const setupRecaptcha = () => {
        if (!(window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
                size: "invisible",
            });
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            setupRecaptcha();
            const verifier = (window as any).recaptchaVerifier;
            const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;

            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
            setConfirmationResult(confirmation);
            setStep("OTP");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!confirmationResult) throw new Error("Something went wrong. Please restart.");

            const result = await confirmationResult.confirm(otp);
            const user = result.user;
            const idToken = await user.getIdToken();

            const res = await fetch("/api/auth/otp-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            if (!res.ok) {
                throw new Error("Failed to create session on server.");
            }

            await refreshUser();
            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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
                        Sign in to access your account
                    </p>
                </div>

                {/* Toggle Login Method */}
                {!magicLinkSent && step === "PHONE" && (
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl mb-8">
                        <button
                            onClick={() => { setLoginMethod("PHONE"); setError(""); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${loginMethod === "PHONE"
                                ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                        >
                            Phone
                        </button>
                        <button
                            onClick={() => { setLoginMethod("EMAIL"); setError(""); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${loginMethod === "EMAIL"
                                ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                        >
                            Email
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Phone Login Form */}
                {loginMethod === "PHONE" && (
                    step === "PHONE" ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="tel"
                                        placeholder="+1 234 567 8900"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div id="recaptcha-container"></div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    "Send Verification Code"
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full text-center text-2xl tracking-widest px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all"
                                    maxLength={6}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Verify & Sign In
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep("PHONE");
                                    setError("");
                                }}
                                className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                            >
                                Change Phone Number
                            </button>
                        </form>
                    )
                )}

                {/* Email Login Form */}
                {loginMethod === "EMAIL" && (
                    !magicLinkSent ? (
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
                    )
                )}
            </div>
        </div>
    );
}
