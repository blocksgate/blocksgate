"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"
import { getPortfolioAnalytics } from "@/lib/api-client"

interface PortfolioMetrics {
  portfolio_value: number
  total_cost_basis: number
  unrealized_pnl: number
  total_trades: number
  winning_trades: number
  win_rate: number
  holdings_count: number
}

export default function PortfolioValuePage() {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  async function loadMetrics() {
    try {
      const data = await getPortfolioAnalytics()
      setMetrics(data)
    } catch (error) {
      console.error("Failed to load portfolio analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading portfolio data...</div>
  }

  if (!metrics) {
    return <div className="text-center py-8">Failed to load portfolio data</div>
  }

  const portfolioReturn = metrics.portfolio_value - metrics.total_cost_basis
  const returnPercentage = metrics.total_cost_basis > 0 ? (portfolioReturn / metrics.total_cost_basis) * 100 : 0

  const isPositive = portfolioReturn > 0

  // Mock historical data - in production this would come from database
  const chartData = [
    { date: "Jan 1", value: metrics.total_cost_basis * 0.8 },
    { date: "Jan 8", value: metrics.total_cost_basis * 0.85 },
    { date: "Jan 15", value: metrics.total_cost_basis * 0.92 },
    { date: "Jan 22", value: metrics.total_cost_basis * 0.95 },
    { date: "Jan 29", value: metrics.total_cost_basis * 1.05 },
    { date: "Today", value: metrics.portfolio_value },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio Analytics</h1>
        <p className="text-muted-foreground">Track your portfolio performance and trading statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.portfolio_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold flex items-center gap-2 ${isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}$
              {Math.abs(portfolioReturn).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{returnPercentage.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.win_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.winning_trades} / {metrics.total_trades} trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.holdings_count}</div>
            <p className="text-xs text-muted-foreground mt-1">unique tokens</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Historical portfolio value over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" dot={false} name="Portfolio Value" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trading Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Trades</p>
              <p className="text-2xl font-bold">{metrics.total_trades}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Winning Trades</p>
              <p className="text-2xl font-bold text-green-600">{metrics.winning_trades}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Losing Trades</p>
              <p className="text-2xl font-bold text-red-600">{metrics.total_trades - metrics.winning_trades}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unrealized P&L</p>
              <p className={`text-2xl font-bold ${metrics.unrealized_pnl > 0 ? "text-green-600" : "text-red-600"}`}>
                ${Math.abs(metrics.unrealized_pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
