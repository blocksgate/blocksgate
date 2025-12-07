"use client"

import type React from "react"

import { useWallet } from "@/lib/wallet-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { connected, connect, isConnecting } = useWallet()

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full bg-gradient-to-br from-white/5 to-white/0 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Wallet Connection Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400">Connect your wallet to access the DeFi dashboard and start trading.</p>
            <Button
              onClick={() => connect("demo")}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
