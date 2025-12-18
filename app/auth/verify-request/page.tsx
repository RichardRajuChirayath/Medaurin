"use client";

import { Mail, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function VerifyRequestPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                    <Mail className="w-10 h-10" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Check your email
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        A login link has been sent to your email address. Please click the link to sign in safely.
                    </p>
                </div>
                <div className="pt-4">
                    <Link
                        href="/login"
                        className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                    >
                        Return to sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
