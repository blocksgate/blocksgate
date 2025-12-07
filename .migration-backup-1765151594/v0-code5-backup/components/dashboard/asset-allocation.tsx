"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { useState } from "react"

interface AssetData {
  name: string
  value: number
  percentage: number
  color: string
}

const allocationData: AssetData[] = [
  { name: "ETH", value: 4250.50, percentage: 34.1, color: "#00f0ff" },
  { name: "USDC", value: 3200.00, percentage: 25.7, color: "#ff006e" },
  { name: "USDT", value: 2100.75, percentage: 16.9, color: "#8000ff" },
  { name: "DAI", value: 1500.30, percentage: 12.0, color: "#00ff88" },
  { name: "Others", value: 799.25, percentage: 6.4, color: "#ffaa00" },
]

const holdingData = [
  { token: "ETH", amount: 2.15, value: 4250.50, change: 5.2 },
  { token: "USDC", amount: 3200, value: 3200.00, change: 0.0 },
  { token: "USDT", amount: 2100, value: 2100.75, change: 0.05 },
  { token: "DAI", amount: 1500, value: 1500.30, change: 0.2 },
]

export function AssetAllocation() {
  const [viewType, setViewType] = useState<"pie" | "bar">("pie")
  const totalValue = allocationData.reduce((sum, asset) => sum + asset.value, 0)

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 border border-cyan-500/50 rounded p-3">
          <p className="text-cyan-300 font-semibold">{payload[0].name}</p>
          <p className="text-white">${payload[0].value.toFixed(2)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-1 bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Asset Allocation</CardTitle>
            <p className="text-sm text-gray-400 mt-1">Total Portfolio: ${totalValue.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewType("pie")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewType === "pie"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                  : "bg-white/5 text-gray-400 border border-white/10"
              }`}
            >
              Pie
            </button>
            <button
              onClick={() => setViewType("bar")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewType === "bar"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                  : "bg-white/5 text-gray-400 border border-white/10"
              }`}
            >
              Holdings
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewType === "pie" ? (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {allocationData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-3">
              {allocationData.map((asset) => (
                <div key={asset.name} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }} />
                    <span className="text-white font-semibold text-sm">{asset.name}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    <p>${asset.value.toFixed(2)}</p>
                    <p className="text-cyan-300 mt-1">{asset.percentage}%</p>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1 mt-2">
                    <div
                      className="h-1 rounded-full"
                      style={{ width: `${asset.percentage}%`, backgroundColor: asset.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={holdingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="token" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#00f0ff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="space-y-2">
              {holdingData.map((holding) => (
                <div key={holding.token} className="p-3 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-pink-500/20 border border-cyan-500/30 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{holding.token.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{holding.token}</p>
                      <p className="text-gray-400 text-xs">{holding.amount.toFixed(2)} tokens</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold text-sm">${holding.value.toFixed(2)}</p>
                    <p className={`text-xs ${holding.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {holding.change >= 0 ? "+" : ""}{holding.change.toFixed(2)}%
                    </p>
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
