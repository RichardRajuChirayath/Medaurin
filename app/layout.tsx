import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "../styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { ReminderInitializer } from "@/components/reminder-initializer";
import { Chatbot } from "@/components/chatbot";
import { Analytics } from "@vercel/analytics/react";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { MobileNav } from "@/components/mobile-nav";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Medaurin - Advanced Medicine Interaction Checker",
  description: "AI-powered safety analysis for your medications.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.png" />
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ServiceWorkerRegistration />
          <AuthProvider>
            <ReminderInitializer />
            <div className="pb-24 md:pb-0">
              {children}
            </div>
            <MobileNav />
            <Toaster position="top-center" richColors />
            <Chatbot />
          </AuthProvider>
          <Analytics />
        </ThemeProvider>
        <Script
          src="https://docs.opencv.org/4.8.0/opencv.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
