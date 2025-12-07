"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts"
import { useState } from "react"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"

interface ChartPoint {
  time: string
  portfolio: number
  eth: number
  usdc: number
  trades: number
}

const analyticsData: ChartPoint[] = [
  { time: "00:00", portfolio: 10500, eth: 5200, usdc: 3100, trades: 2 },
  { time: "04:00", portfolio: 11200, eth: 5400, usdc: 3200, trades: 1 },
  { time: "08:00", portfolio: 10800, eth: 5100, usdc: 3100, trades: 3 },
  { time: "12:00", portfolio: 12100, eth: 5600, usdc: 3400, trades: 2 },
  { time: "16:00", portfolio: 11900, eth: 5500, usdc: 3300, trades: 4 },
  { time: "20:00", portfolio: 12450, eth: 5800, usdc: 3450, trades: 1 },
]

const performanceData = [
  { metric: "Win Rate", current: 68, target: 75 },
  { metric: "Profit Factor", current: 2.1, target: 2.5 },
  { metric: "Sharpe Ratio", current: 1.8, target: 2.0 },
  { metric: "ROI", current: 15.2, target: 20 },
]

const tradeStats = [
  { status: "Completed", count: 24, color: "#00f0ff" },
  { status: "Pending", count: 3, color: "#ffaa00" },
  { status: "Failed", count: 2, color: "#ff3333" },
]

export function AdvancedAnalytics() {
  const [selectedMetric, setSelectedMetric] = useState<"portfolio" | "comparison" | "performance">("portfolio")

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{ name: string; value: number; color: string }>
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 border border-cyan-500/50 rounded p-3 shadow-lg">
          <p className="text-cyan-300 font-semibold text-sm">{payload[0].payload.time}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-white text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === "number" && entry.value > 100 ? `$${entry.value}` : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-full bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Advanced Analytics</CardTitle>
            <p className="text-sm text-gray-400 mt-1">Performance tracking & market analysis</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMetric("portfolio")}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                selectedMetric === "portfolio"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setSelectedMetric("comparison")}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                selectedMetric === "comparison"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              Comparison
            </button>
            <button
              onClick={() => setSelectedMetric("performance")}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                selectedMetric === "performance"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              Performance
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedMetric === "portfolio" && (
          <div className="space-y-6">
            <div>
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-2">Portfolio Value Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="portfolio"
                    stroke="#00f0ff"
                    fill="url(#portfolioGradient)"
                    name="Portfolio Value"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">24h Change</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-white font-bold text-lg">+$1,950.80</p>
                <p className="text-green-400 text-xs mt-1">+18.6%</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Trades</span>
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-white font-bold text-lg">24</p>
                <p className="text-cyan-400 text-xs mt-1">Today</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Avg Trade</span>
                  <TrendingUp className="w-4 h-4 text-pink-400" />
                </div>
                <p className="text-white font-bold text-lg">$510.45</p>
                <p className="text-pink-400 text-xs mt-1">+2.5% avg</p>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === "comparison" && (
          <div className="space-y-6">
            <div>
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-2">Asset Comparison</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="eth"
                    stroke="#00f0ff"
                    dot={{ fill: "#00f0ff", r: 4 }}
                    name="ETH Value"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="usdc"
                    stroke="#ff006e"
                    dot={{ fill: "#ff006e", r: 4 }}
                    name="USDC Value"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {tradeStats.map((stat) => (
                <div key={stat.status} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{stat.status}</p>
                      <p className="text-white font-bold text-2xl mt-1">{stat.count}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full" style={{ backgroundColor: `${stat.color}20`, border: `2px solid ${stat.color}` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedMetric === "performance" && (
          <div className="space-y-6">
            <div>
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-2">Performance Metrics</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="metric" stroke="#666" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="current" fill="#00f0ff" radius={[8, 8, 0, 0]} name="Current" />
                  <Bar dataKey="target" fill="#ff006e" radius={[8, 8, 0, 0]} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {performanceData.map((perf) => (
                <div key={perf.metric} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-gray-400 text-sm mb-2">{perf.metric}</p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-white font-bold text-lg">{perf.current}</p>
                    <p className="text-gray-500 text-xs">Target: {perf.target}</p>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mt-3">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500"
                      style={{ width: `${(perf.current / perf.target) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
