"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Target, Award, Zap, AlertCircle } from "lucide-react"

interface MetricCard {
  label: string
  value: string | number
  change: number
  icon: React.ReactNode
  status: "positive" | "negative" | "neutral"
  bgGradient: string
}

const metrics: MetricCard[] = [
  {
    label: "Total P&L",
    value: "$3,245.80",
    change: 12.5,
    icon: <TrendingUp className="w-5 h-5" />,
    status: "positive",
    bgGradient: "from-green-500/10 to-emerald-500/10",
  },
  {
    label: "Win Rate",
    value: "68.5%",
    change: 4.2,
    icon: <Target className="w-5 h-5" />,
    status: "positive",
    bgGradient: "from-cyan-500/10 to-blue-500/10",
  },
  {
    label: "Avg Trade Size",
    value: "$510.45",
    change: -2.1,
    icon: <Zap className="w-5 h-5" />,
    status: "negative",
    bgGradient: "from-yellow-500/10 to-orange-500/10",
  },
  {
    label: "Sharpe Ratio",
    value: "1.85",
    change: 0.15,
    icon: <Award className="w-5 h-5" />,
    status: "positive",
    bgGradient: "from-pink-500/10 to-rose-500/10",
  },
  {
    label: "Max Drawdown",
    value: "-8.3%",
    change: -1.2,
    icon: <TrendingDown className="w-5 h-5" />,
    status: "negative",
    bgGradient: "from-purple-500/10 to-indigo-500/10",
  },
  {
    label: "Profit Factor",
    value: "2.15",
    change: 0.35,
    icon: <Award className="w-5 h-5" />,
    status: "positive",
    bgGradient: "from-teal-500/10 to-cyan-500/10",
  },
]

const getStatusColor = (status: "positive" | "negative" | "neutral") => {
  switch (status) {
    case "positive":
      return "text-green-400"
    case "negative":
      return "text-red-400"
    default:
      return "text-gray-400"
  }
}

const getIconColor = (bgGradient: string) => {
  if (bgGradient.includes("green")) return "text-green-400"
  if (bgGradient.includes("cyan")) return "text-cyan-400"
  if (bgGradient.includes("yellow")) return "text-yellow-400"
  if (bgGradient.includes("pink")) return "text-pink-400"
  if (bgGradient.includes("purple")) return "text-purple-400"
  if (bgGradient.includes("teal")) return "text-teal-400"
  return "text-white"
}

export function PerformanceMetrics() {
  return (
    <Card className="col-span-full bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Performance Metrics</CardTitle>
            <p className="text-sm text-gray-400 mt-1">Real-time KPI tracking & analytics</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
            <AlertCircle className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-gray-400">Updated 2 mins ago</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={`p-5 rounded-lg bg-gradient-to-br ${metric.bgGradient} border border-white/10 hover:border-white/20 transition-all group cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-lg bg-white/5 border border-white/10 ${getIconColor(metric.bgGradient)}`}>
                  {metric.icon}
                </div>
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(metric.status)}`}
                >
                  {metric.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(metric.change).toFixed(2)}%
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-2">{metric.label}</p>
              <p className="text-2xl font-bold text-white">{metric.value}</p>

              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-500">
                  {metric.change >= 0 ? "↑" : "↓"} vs 24h ago
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-white font-semibold text-sm mb-4">Performance Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Total Trades</p>
              <p className="text-white font-bold text-lg">156</p>
              <p className="text-green-400 text-xs mt-1">+12 today</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Winning Trades</p>
              <p className="text-white font-bold text-lg">107</p>
              <p className="text-gray-500 text-xs mt-1">68.6% of total</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Avg Win</p>
              <p className="text-green-400 font-bold text-lg">$38.45</p>
              <p className="text-gray-500 text-xs mt-1">+2.3%</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Avg Loss</p>
              <p className="text-red-400 font-bold text-lg">-$17.82</p>
              <p className="text-gray-500 text-xs mt-1">-1.1%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
