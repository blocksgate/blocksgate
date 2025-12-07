"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Zap, Timer, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { useState, useEffect } from "react"
import { useArbitrageWebSocket } from "@/lib/hooks/use-arbitrage-websocket"
import { toast } from "sonner"

interface ArbitrageOpportunity {
  id: string
  tokenPair: string
  sourcePrice: number
  destPrice: number
  profitPercentage: number
  profitAmount: number
  gasEstimate: number
  timeRemaining: number
  risk: "low" | "medium" | "high"
  source: string
  destination: string
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "low":
      return "bg-green-500/20 text-green-300 border-green-500/50"
    case "medium":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
    case "high":
      return "bg-red-500/20 text-red-300 border-red-500/50"
    default:
      return "bg-gray-500/20 text-gray-300 border-gray-500/50"
  }
}

// Convert WebSocket update to opportunity format
function convertUpdateToOpportunity(update: any): ArbitrageOpportunity {
  // Parse token pair from sellToken/buyToken
  const sellToken = update.sellToken?.split(":")[1] || update.sellToken || "TOKEN1"
  const buyToken = update.buyToken?.split(":")[1] || update.buyToken || "TOKEN2"
  const tokenPair = `${sellToken}/${buyToken}`

  // Estimate prices and gas from profit data
  const profitPercent = update.profitPercent || 0
  const profitUSD = parseFloat(update.profitUSD || "0")
  
  // Estimate risk based on profit percentage
  let risk: "low" | "medium" | "high" = "low"
  if (profitPercent > 1.0) risk = "high"
  else if (profitPercent > 0.5) risk = "medium"

  // Estimate gas (rough approximation)
  const gasEstimate = Math.max(20, Math.min(100, profitUSD * 2))

  return {
    id: update.id || `opp_${Date.now()}_${Math.random()}`,
    tokenPair,
    sourcePrice: 1000, // Placeholder - would come from actual price data
    destPrice: 1000 * (1 + profitPercent / 100),
    profitPercentage: profitPercent,
    profitAmount: profitUSD,
    gasEstimate,
    timeRemaining: update.expiresIn || 30,
    risk,
    source: "DEX A", // Placeholder
    destination: "DEX B", // Placeholder
  }
}

export function ArbitrageModule() {
  // Use WebSocket hook for real-time updates
  const { opportunities: wsOpportunities, isConnected, error: wsError } = useArbitrageWebSocket(1, 0.1)
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [sortBy, setSortBy] = useState<"profit" | "risk" | "time">("profit")
  
  // Convert WebSocket updates to opportunities
  useEffect(() => {
    if (wsOpportunities && wsOpportunities.length > 0) {
      const converted = wsOpportunities.map(convertUpdateToOpportunity)
      setOpportunities(converted)
    }
  }, [wsOpportunities])

  // Show connection status
  useEffect(() => {
    if (wsError) {
      toast.error("WebSocket connection error", {
        description: "Real-time updates may be limited",
      })
    }
  }, [wsError])

  useEffect(() => {
    const sorted = [...opportunities].sort((a, b) => {
      switch (sortBy) {
        case "profit":
          return b.profitPercentage - a.profitPercentage
        case "risk":
          const riskOrder = { low: 0, medium: 1, high: 2 }
          return riskOrder[a.risk as keyof typeof riskOrder] - riskOrder[b.risk as keyof typeof riskOrder]
        case "time":
          return a.timeRemaining - b.timeRemaining
        default:
          return 0
      }
    })
    setOpportunities(sorted)
  }, [sortBy])

  return (
    <Card className="col-span-1 bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Arbitrage Opportunities
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" title="Connected" />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-400" title="Disconnected" />
              )}
            </CardTitle>
            <p className="text-sm text-gray-400 mt-1">
              {isConnected ? "Real-time cross-DEX opportunities" : "Connecting to live feed..."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("profit")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                sortBy === "profit"
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
                  : "bg-white/5 text-gray-400 border border-white/10"
              }`}
            >
              Profit
            </button>
            <button
              onClick={() => setSortBy("risk")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                sortBy === "risk"
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
                  : "bg-white/5 text-gray-400 border border-white/10"
              }`}
            >
              Risk
            </button>
            <button
              onClick={() => setSortBy("time")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                sortBy === "time"
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
                  : "bg-white/5 text-gray-400 border border-white/10"
              }`}
            >
              Time
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {opportunities.map((opp) => (
            <div key={opp.id} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold text-sm">{opp.tokenPair}</p>
                    <Badge className={`text-xs ${getRiskColor(opp.risk)}`}>{opp.risk.toUpperCase()}</Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    {opp.source} → {opp.destination}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-bold">{opp.profitPercentage.toFixed(2)}%</span>
                  </div>
                  <p className="text-xs text-gray-400">${opp.profitAmount.toFixed(2)} profit</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="p-2 rounded bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-400">Source Price</p>
                  <p className="text-white font-semibold text-sm">${opp.sourcePrice.toFixed(4)}</p>
                </div>
                <div className="p-2 rounded bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-400">Dest Price</p>
                  <p className="text-white font-semibold text-sm">${opp.destPrice.toFixed(4)}</p>
                </div>
                <div className="p-2 rounded bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-400">Gas Cost</p>
                  <p className="text-white font-semibold text-sm">${opp.gasEstimate}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Timer className="w-3 h-3" />
                  <span>{opp.timeRemaining}s remaining</span>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold text-xs border-0"
                  disabled={opp.risk === "high"}
                >
                  Execute
                </Button>
              </div>
            </div>
          ))}

          {opportunities.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No opportunities available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
