"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, Zap, Gauge } from "lucide-react"

interface PerformanceMetric {
  label: string
  value: string
  change: string
  isPositive: boolean
  icon: React.ReactNode
}

export function PerformanceMetrics() {
  const [latency, setLatency] = useState(145)

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.max(80, Math.min(300, 145 + Math.random() * 60 - 30)))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const metrics: PerformanceMetric[] = [
    {
      label: "Total Volume",
      value: "$125,432",
      change: "+18.5%",
      isPositive: true,
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      label: "Total Profit/Loss",
      value: "$3,250.50",
      change: "+12.3%",
      isPositive: true,
      icon: <TrendingUp className="w-5 h-5 text-green-400" />,
    },
    {
      label: "Avg Gas Saved",
      value: "$128.40",
      change: "Via gasless",
      isPositive: true,
      icon: <Zap className="w-5 h-5 text-accent" />,
    },
    {
      label: "Avg Latency",
      value: `${latency.toFixed(0)}ms`,
      change: "Real-time",
      isPositive: latency < 200,
      icon: <Gauge className="w-5 h-5 text-blue-400" />,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, idx) => (
        <Card key={idx} className="bg-card border-border hover:border-accent/50 transition">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
              <div className="text-accent">{metric.icon}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{metric.value}</div>
              <Badge
                variant="secondary"
                className={`${metric.isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
              >
                {metric.isPositive ? "↑" : "↓"} {metric.change}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
