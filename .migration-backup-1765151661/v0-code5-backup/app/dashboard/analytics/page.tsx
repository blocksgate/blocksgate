"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { PerformanceMetrics } from "@/components/analytics/performance-metrics"
import { TradeHistory } from "@/components/analytics/trade-history"
import { PerformanceCharts } from "@/components/analytics/performance-charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { getSystemMetrics } from "@/app/actions/integrated-systems"

const volumeData = [
  { date: "Jan 1", volume: 4000, profit: 2400 },
  { date: "Jan 2", volume: 3000, profit: 1398 },
  { date: "Jan 3", volume: 2000, profit: 9800 },
  { date: "Jan 4", volume: 2780, profit: 3908 },
  { date: "Jan 5", volume: 1890, profit: 4800 },
  { date: "Jan 6", volume: 2390, profit: 3800 },
  { date: "Jan 7", volume: 3490, profit: 4300 },
]

const gasSavingsData = [
  { date: "Mon", savings: 250 },
  { date: "Tue", savings: 180 },
  { date: "Wed", savings: 320 },
  { date: "Thu", savings: 290 },
  { date: "Fri", savings: 410 },
  { date: "Sat", savings: 150 },
  { date: "Sun", savings: 280 },
]

const latencyData = [
  { region: "US-East", p50: 85, p95: 145, p99: 200 },
  { region: "EU-West", p50: 120, p95: 180, p99: 250 },
  { region: "Asia-Pacific", p50: 150, p95: 220, p99: 320 },
]

export default function AnalyticsPage() {
  const [realtimeSavings, setRealtimeSavings] = useState<any>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      const metrics = await getSystemMetrics()
      if (metrics.success && metrics.systems?.gas) {
        setRealtimeSavings(metrics.systems.gas)
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
          <h1 className="text-3xl font-bold">Trading Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive view of your trading performance with real-time system metrics
          </p>
        </div>

        <PerformanceMetrics />

        <PerformanceCharts />

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Volume & Profit</CardTitle>
              <CardDescription>7-day trading volume and profit trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area type="monotone" dataKey="volume" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorVolume)" />
                  <Area type="monotone" dataKey="profit" stroke="#ec4899" fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Gas Savings</CardTitle>
              <CardDescription>Weekly gas fee savings via optimized transactions</CardDescription>
              {realtimeSavings && (
                <p className="text-xs text-green-400 mt-2">
                  Total Saved: {realtimeSavings.metrics?.totalGasSaved || 0} Gwei
                </p>
              )}
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={gasSavingsData}>
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
                    dataKey="savings"
                    stroke="#0ea5e9"
                    dot={{ fill: "#0ea5e9", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Gas Savings ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Latency Heat Map</CardTitle>
            <CardDescription>RPC endpoint performance across regions (p50/p95/p99 percentiles)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="region" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="p50" fill="#10b981" name="P50 (ms)" />
                <Bar dataKey="p95" fill="#f59e0b" name="P95 (ms)" />
                <Bar dataKey="p99" fill="#ef4444" name="P99 (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <TradeHistory />
      </div>
    </DashboardLayout>
  )
}
