"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { EnhancedSwapInterface } from "@/components/dashboard/enhanced-swap-interface"
import { MarketData } from "@/components/dashboard/market-data"
import { PaymentMethodSelector } from "@/components/dashboard/payment-method-selector"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Clock, Zap, ArrowRight } from "lucide-react"
import { useState } from "react"

interface NavigationTab {
  id: string
  label: string
  icon?: React.ReactNode
}

const navigationTabs: NavigationTab[] = [
  { id: "overview", label: "Overview" },
  { id: "week", label: "This week" },
  { id: "today", label: "Today" },
  { id: "reports", label: "Reports" },
]

export default function TradingPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showPaymentSelector, setShowPaymentSelector] = useState(false)

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Swap</h1>
                <p className="text-gray-400">Buy or sell any token instantly at the best price</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-400">Gas Saver Mode</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6">
              {navigationTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                      : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">SOL Trades</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-white font-bold text-2xl">$23,547.00</p>
                <p className="text-green-400 text-xs mt-1">+15.33% (Last 24h)</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">ETH in USDT</span>
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-white font-bold text-2xl">$112,054.00</p>
                <p className="text-blue-400 text-xs mt-1">8h ago</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Est. Profit</span>
                  <ArrowRight className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-white font-bold text-2xl">$4,127.56</p>
                <p className="text-yellow-400 text-xs mt-1">+7.24%</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Swaps</span>
                  <Badge className="bg-cyan-500/20 text-cyan-300 text-xs">24</Badge>
                </div>
                <p className="text-white font-bold text-2xl">24</p>
                <p className="text-cyan-400 text-xs mt-1">Last 7 days</p>
              </CardContent>
            </Card>
          </div>

          <div className="border-b border-white/10 pb-8">
            <EnhancedSwapInterface />
          </div>

          {showPaymentSelector && (
            <div className="pb-8 border-b border-white/10">
              <PaymentMethodSelector onSelect={(method) => console.log("Selected:", method)} />
            </div>
          )}

          <div className="pb-8">
            <MarketData />
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
