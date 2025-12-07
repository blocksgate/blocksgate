"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { BotStrategyBuilder } from "@/components/bot/bot-strategy-builder"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { getSystemMetrics } from "@/app/actions/integrated-systems"

const performanceData = [
  { date: "Jan 1", profit: 100, trades: 5 },
  { date: "Jan 2", profit: 350, trades: 12 },
  { date: "Jan 3", profit: 800, trades: 28 },
  { date: "Jan 4", profit: 1200, trades: 45 },
  { date: "Jan 5", profit: 2050, trades: 72 },
  { date: "Jan 6", profit: 3100, trades: 98 },
  { date: "Jan 7", profit: 4250, trades: 128 },
]

const botStrategies = [
  {
    name: "Dollar Cost Averaging",
    description: "Invest fixed amount regularly to reduce market volatility impact",
    key: "dca",
  },
  {
    name: "Grid Trading",
    description: "Place multiple buy/sell orders at different price levels",
    key: "grid",
  },
  {
    name: "Momentum Trading",
    description: "Capitalize on market trends and price movements",
    key: "momentum",
  },
  {
    name: "Mean Reversion",
    description: "Trade when price deviates from average back to mean",
    key: "meanreversion",
  },
]

export default function TradingBotPage() {
  const [gasMetrics, setGasMetrics] = useState<any>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      const metrics = await getSystemMetrics()
      if (metrics.success && metrics.systems?.gas) {
        setGasMetrics(metrics.systems.gas)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Automated Trading Bot</h1>
          <p className="text-muted-foreground mt-2">Deploy sophisticated trading strategies with gas optimization</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">$4,250.00</div>
              <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78.5%</div>
              <p className="text-xs text-muted-foreground mt-1">Successful trades</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Trades Executed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">205</div>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border neon-border border-blue-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-400">Gas Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{gasMetrics?.metrics?.totalGasSaved || 0} Gwei</div>
              <p className="text-xs text-muted-foreground mt-1">Optimized</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Bot Performance</CardTitle>
            <CardDescription>Cumulative profit from all active strategies with gas optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#22c55e"
                  dot={{ fill: "#22c55e", r: 4 }}
                  name="Profit ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <BotStrategyBuilder />

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Available Strategies</CardTitle>
            <CardDescription>
              Choose from pre-built trading strategies optimized with adaptive gas pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {botStrategies.map((strategy) => (
              <div
                key={strategy.key}
                className="p-4 rounded-lg border border-border bg-card/50 hover:border-primary/50 transition"
              >
                <h3 className="font-semibold mb-1">{strategy.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>
                <Badge variant="secondary" className="text-xs">
                  Ready to Deploy
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
