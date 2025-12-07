"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPortfolioAnalytics } from "@/lib/api-client"
import { TrendingUp, TrendingDown } from "lucide-react"

interface PortfolioMetrics {
  portfolio_value: number
  total_cost_basis: number
  unrealized_pnl: number
  total_trades: number
  winning_trades: number
  win_rate: number
  holdings_count: number
}

export function PortfolioSummary() {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  async function loadMetrics() {
    try {
      const data = await getPortfolioAnalytics() as PortfolioMetrics
      setMetrics(data)
    } catch (error) {
      console.error("Failed to load portfolio metrics:", error)
      // Set default values on error to prevent UI from breaking
      setMetrics({
        portfolio_value: 0,
        total_cost_basis: 0,
        unrealized_pnl: 0,
        total_trades: 0,
        winning_trades: 0,
        win_rate: 0,
        holdings_count: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">Loading...</CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return null
  }

  const isPositive = metrics.unrealized_pnl > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Portfolio Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Value</span>
          <span className="font-semibold">
            $
            {metrics.portfolio_value.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Unrealized P&L</span>
          <span className={`font-semibold flex items-center gap-2 ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}$
            {Math.abs(metrics.unrealized_pnl).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Holdings</span>
          <span className="font-semibold">{metrics.holdings_count}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Win Rate</span>
          <span className="font-semibold">{metrics.win_rate.toFixed(1)}%</span>
        </div>
      </CardContent>
    </Card>
  )
}
