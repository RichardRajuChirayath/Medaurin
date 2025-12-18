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
            // NextAuth signOut
            const { signOut } = await import("next-auth/react");
            await signOut({ redirect: false });

            // Custom API logout
            await fetch("/api/auth/logout", { method: "POST" });

            setUser(null);
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Logout error:", error);
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
