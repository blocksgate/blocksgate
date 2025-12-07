"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { ChainSelector } from "@/components/cross-chain/chain-selector"
import { BridgeSelector } from "@/components/cross-chain/bridge-selector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Zap } from "lucide-react"

export default function CrossChainPage() {
  const [fromChain, setFromChain] = useState<number | null>(1)
  const [toChain, setToChain] = useState<number | null>(42161)
  const [selectedBridge, setSelectedBridge] = useState("Stargate Finance")
  const [amount, setAmount] = useState("10")

  const estimatedReceived = (Number.parseFloat(amount) * 0.9975).toFixed(2)
  const totalFee = (Number.parseFloat(amount) - Number.parseFloat(estimatedReceived)).toFixed(2)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cross-Chain Swaps</h1>
          <p className="text-muted-foreground mt-2">Seamlessly swap tokens across multiple blockchain networks</p>
        </div>

        <Alert className="bg-primary/10 border-primary/30">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            Cross-chain transfers are powered by leading bridge protocols. Select your route for optimal cost and speed.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ChainSelector
              fromChain={fromChain}
              toChain={toChain}
              onSelectFromChain={setFromChain}
              onSelectToChain={setToChain}
            />

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Amount</CardTitle>
                <CardDescription>How much would you like to transfer?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Send Amount (USDC)</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-input border-border text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 bg-card/50 border border-border rounded-lg p-4">
                  <div>
                    <div className="text-xs text-muted-foreground">You Send</div>
                    <div className="text-lg font-semibold">{amount} USDC</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">You Receive</div>
                    <div className="text-lg font-semibold">{estimatedReceived} USDC</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bridge Fee</span>
                    <span>${totalFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Time</span>
                    <span>15-30 minutes</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total Cost</span>
                    <span className="text-accent">${totalFee}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <BridgeSelector selectedBridge={selectedBridge} onSelectBridge={setSelectedBridge} />

            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-base"
            >
              Execute Cross-Chain Swap
            </Button>
          </div>

          <div className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Route Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">From Chain</div>
                  <Badge variant="secondary" className="w-full justify-center">
                    Ethereum
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">To Chain</div>
                  <Badge variant="secondary" className="w-full justify-center">
                    Arbitrum
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Bridge</div>
                  <Badge variant="secondary" className="w-full justify-center">
                    {selectedBridge}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Available Routes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { bridge: "Stargate", fee: "0.05%", time: "20m" },
                  { bridge: "Across", fee: "0.03%", time: "15m" },
                  { bridge: "Axelar", fee: "0.02%", time: "30m" },
                ].map((route) => (
                  <div key={route.bridge} className="p-2 rounded border border-border/50 text-xs">
                    <div className="font-medium">{route.bridge}</div>
                    <div className="text-muted-foreground">
                      {route.fee} fee • {route.time}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
