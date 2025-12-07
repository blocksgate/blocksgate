import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { WalletProvider } from "@/lib/wallet-context"
import { ThemeProvider } from "@/components/theme-provider"
import { MetaMaskErrorHandler } from "@/components/metamask-error-handler"
import { Toaster } from "@/components/ui/toast"
import { ErrorBoundary } from "@/components/error-boundary"

// Initialize fonts
import { Geist, Geist_Mono } from "next/font/google"

const _geist = Geist({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})
const _geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${_geistMono.className} font-mono antialiased`}>
        <ErrorBoundary>
          <MetaMaskErrorHandler />
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <WalletProvider>{children}</WalletProvider>
          </ThemeProvider>
          <Toaster />
          <Analytics />
        </ErrorBoundary>
      </body>
    </html>
  )
}
