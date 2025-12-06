import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { AuthProvider } from "@/components/auth-provider"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"

import "../styles/globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "MixSafe — AI-Powered Medicine Safety Checker",
  description:
    "Check if your medicines are safe to take together using FDA, RxNorm & NIH databases with AI. Upload a photo and get instant safety analysis with detailed interaction warnings.",
  keywords: ["medicine safety", "drug interactions", "FDA data", "medication checker", "pharmacy", "health"],
  authors: [{ name: "MixSafe" }],
  creator: "MixSafe",
  publisher: "MixSafe",
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }
  ],
  openGraph: {
    title: "MixSafe — AI-Powered Medicine Safety Checker",
    description: "Check if your medicines are safe using FDA, RxNorm & NIH databases",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MixSafe — AI-Powered Medicine Safety Checker",
    description: "Check if your medicines are safe using FDA, RxNorm & NIH databases",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <ServiceWorkerRegistration />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
