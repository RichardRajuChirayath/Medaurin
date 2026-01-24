"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";

// Define user type
interface User {
    id: string;
    email: string;
    phoneNumber: string;
    createdAt: string;
    allergies: string[];
    conditions: string[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    refreshUser: async () => { },
    logout: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUser = async () => {
        try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const logout = async () => {
        try {
            // 1. Clear Service Worker Cache first
            if (typeof window !== "undefined" && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_USER_DATA' });
            }

            // 2. Clear application caches manually
            if ("caches" in window) {
                const cacheNames = await caches.keys();
                for (const cacheName of cacheNames) {
                    await caches.delete(cacheName);
                }
            }

            // 3. NextAuth signOut
            const { signOut } = await import("next-auth/react");
            await signOut({ redirect: false });

            // 4. Custom API logout
            await fetch("/api/auth/logout", { method: "POST" });

            setUser(null);

            // 5. Force reload to home to ensure fresh state
            window.location.href = "/";
        } catch (error) {
            console.error("Logout error:", error);
            window.location.href = "/";
        }
    };

    return (
        <SessionProvider>
            <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser, logout }}>
                {children}
            </AuthContext.Provider>
        </SessionProvider>
    );
}

export const useAuth = () => useContext(AuthContext);
