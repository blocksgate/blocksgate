"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Activity, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const chartData = [
  { time: "00:00", value: 10500 },
  { time: "04:00", value: 11200 },
  { time: "08:00", value: 10800 },
  { time: "12:00", value: 12100 },
  { time: "16:00", value: 11900 },
  { time: "20:00", value: 12450 },
]

export function PortfolioCard() {
  const [rpcHealth, setRpcHealth] = useState(95)
  const [gasSavings, setGasSavings] = useState(245.5)

  useEffect(() => {
    const interval = setInterval(() => {
      setRpcHealth(Math.max(85, Math.min(100, 95 + Math.random() * 10 - 5)))
      setGasSavings((prev) => prev + Math.random() * 50 - 10)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Portfolio Value</CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium">RPC: {rpcHealth.toFixed(0)}%</span>
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
              <Zap className="w-3 h-3 mr-1" />${gasSavings.toFixed(2)} Saved
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="text-4xl font-bold text-white">$12,450.80</div>
          <div className="text-green-400 text-sm mt-2">↑ $1,450.80 (12.5%)</div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="time" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }} />
            <Area type="monotone" dataKey="value" stroke="#a855f7" fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
