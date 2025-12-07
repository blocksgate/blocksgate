"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function PoolStats() {
  const stats = [
    {
      label: "Total Liquidity Provided",
      value: "$8,300.50",
      change: "+$1,200 (16.8%)",
      icon: "💧",
    },
    {
      label: "Fees Earned (24h)",
      value: "$24.50",
      change: "+$5.20 (26.9%)",
      icon: "💰",
    },
    {
      label: "Active Positions",
      value: "2",
      change: "2 pools",
      icon: "📍",
    },
    {
      label: "Average APY",
      value: "10.3%",
      change: "Weighted across pools",
      icon: "📈",
    },
  ]

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">{stat.label}</CardTitle>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-xs text-green-400">{stat.change}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
