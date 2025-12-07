"use client"

import { useWallet } from "@/lib/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Wallet } from "lucide-react"

export default function LoginPage() {
  const { connect, connected, address, isConnecting, error, walletType } = useWallet()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    if (connected && address && !hasRedirected) {
      console.log("[Login] Wallet connected, preparing redirect...", { connected, address, hasRedirected })
      setHasRedirected(true)
      // Small delay to ensure cookies are set and UI updates
      const redirectTimer = setTimeout(() => {
        console.log("[Login] Redirecting to dashboard...")
        // Force a full page navigation to ensure cookies are sent
        window.location.href = "/dashboard"
      }, 1500)
      
      return () => clearTimeout(redirectTimer)
    }
  }, [connected, address, hasRedirected])

  const handleMetaMaskConnect = async () => {
    try {
      await connect("metamask")
      // Redirect after connection - cookie is set, state will update via useEffect
      // Also add direct redirect as backup
      setTimeout(() => {
        console.log("[Login] Redirecting to dashboard after MetaMask connection")
        window.location.href = "/dashboard"
      }, 1200)
    } catch (err) {
      console.error("MetaMask connection error:", err)
    }
  }

  const handleWalletConnect = async () => {
    try {
      await connect("walletconnect")
      setTimeout(() => {
        console.log("[Login] Redirecting to dashboard after WalletConnect connection")
        window.location.href = "/dashboard"
      }, 1200)
    } catch (err) {
      console.error("WalletConnect connection error:", err)
    }
  }

  const handleDemoMode = async () => {
    await connect("demo")
    setTimeout(() => {
      console.log("[Login] Redirecting to dashboard after demo mode")
      window.location.href = "/dashboard"
    }, 1000)
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-b from-background to-background/50">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl">Connect Your Wallet</CardTitle>
              <CardDescription className="text-base">
                Connect your wallet to access the DeFi trading platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {connected && address ? (
                  <div className="rounded-md bg-green-500/10 p-4 border border-green-500/20">
                    <p className="text-sm font-medium text-green-400 mb-2">Wallet Connected!</p>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {address}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Mode: {walletType === "demo" ? "Demo" : walletType === "metamask" ? "MetaMask" : "WalletConnect"}
                    </p>
                    {hasRedirected && (
                      <p className="text-xs text-muted-foreground mt-2 animate-pulse">
                        Redirecting to dashboard...
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={handleMetaMaskConnect}
                      disabled={isConnecting}
                      className="w-full h-12 text-base font-semibold"
                      size="lg"
                    >
                      {isConnecting ? (
                        "Connecting..."
                      ) : (
                        <>
                          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Connect with MetaMask
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleWalletConnect}
                      disabled={isConnecting}
                      variant="outline"
                      className="w-full h-12 text-base font-semibold"
                      size="lg"
                    >
                      {isConnecting ? (
                        "Connecting..."
                      ) : (
                        <>
                          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.12l-6.87 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                          </svg>
                          Connect with WalletConnect
                        </>
                      )}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleDemoMode}
                      disabled={isConnecting}
                      variant="ghost"
                      className="w-full h-12 text-base"
                      size="lg"
                    >
                      Continue in Demo Mode
                    </Button>
                  </>
                )}

                <div className="mt-4 text-center text-xs text-muted-foreground">
                  By connecting, you agree to our Terms of Service and Privacy Policy
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
