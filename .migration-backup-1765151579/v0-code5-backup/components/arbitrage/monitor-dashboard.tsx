"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Activity, Pause } from "lucide-react"

interface ArbitrageMetrics {
  timestamp: number
  opportunities: number
  avgProfit: number
  totalProfit: number
  mevProtected: number
  failovers: number
}

export function MonitorDashboard() {
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [timeframe, setTimeframe] = useState("1h")
  const [metrics, setMetrics] = useState<ArbitrageMetrics[]>([
    {
      timestamp: Date.now() - 3600000,
      opportunities: 12,
      avgProfit: 0.45,
      totalProfit: 5.4,
      mevProtected: 10,
      failovers: 0,
    },
    {
      timestamp: Date.now() - 3000000,
      opportunities: 15,
      avgProfit: 0.52,
      totalProfit: 7.8,
      mevProtected: 14,
      failovers: 1,
    },
    {
      timestamp: Date.now() - 2400000,
      opportunities: 18,
      avgProfit: 0.38,
      totalProfit: 6.84,
      mevProtected: 17,
      failovers: 0,
    },
    {
      timestamp: Date.now() - 1800000,
      opportunities: 22,
      avgProfit: 0.61,
      totalProfit: 13.42,
      mevProtected: 21,
      failovers: 1,
    },
    {
      timestamp: Date.now() - 1200000,
      opportunities: 19,
      avgProfit: 0.55,
      totalProfit: 10.45,
      mevProtected: 18,
      failovers: 0,
    },
    {
      timestamp: Date.now() - 600000,
      opportunities: 25,
      avgProfit: 0.68,
      totalProfit: 17,
      mevProtected: 24,
      failovers: 1,
    },
    {
      timestamp: Date.now(),
      opportunities: 28,
      avgProfit: 0.72,
      totalProfit: 20.16,
      mevProtected: 27,
      failovers: 0,
    },
  ])

  const chartData = metrics.map((m) => ({
    ...m,
    time: new Date(m.timestamp).toLocaleTimeString(),
  }))

  const currentMetrics = metrics[metrics.length - 1]
  const mevProtectionRate = ((currentMetrics.mevProtected / currentMetrics.opportunities) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Arbitrage Monitor</CardTitle>
              <CardDescription>
                Real-time opportunity detection with MEV protection and failover tracking
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`${
                  isMonitoring
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {isMonitoring ? (
                  <>
                    <Activity className="w-3 h-3 mr-1" />
                    Monitoring
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 mr-1" />
                    Paused
                  </>
                )}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => setIsMonitoring(!isMonitoring)}>
                {isMonitoring ? "Pause" : "Resume"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-card/50 border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Opportunities Found</div>
                <div className="text-2xl font-bold">{currentMetrics.opportunities}</div>
                <div className="text-xs text-green-400">Last hour</div>
              </div>
              <div className="bg-card/50 border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Avg Profit %</div>
                <div className="text-2xl font-bold">{(currentMetrics.avgProfit * 100).toFixed(2)}%</div>
                <div className="text-xs text-green-400">Per opportunity</div>
              </div>
              <div className="bg-card/50 border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">MEV Protected</div>
                <div className="text-2xl font-bold text-cyan-400">{mevProtectionRate}%</div>
                <div className="text-xs text-cyan-300">{currentMetrics.mevProtected} trades</div>
              </div>
              <div className="bg-card/50 border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Failovers</div>
                <div className="text-2xl font-bold">{currentMetrics.failovers}</div>
                <div className="text-xs text-yellow-400">This session</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Opportunity Trend</h3>
                <ToggleGroup type="single" value={timeframe} onValueChange={setTimeframe}>
                  <ToggleGroupItem value="1h">1H</ToggleGroupItem>
                  <ToggleGroupItem value="4h">4H</ToggleGroupItem>
                  <ToggleGroupItem value="24h">24H</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorOpportunities" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="time" stroke="#666" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="opportunities"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorOpportunities)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
