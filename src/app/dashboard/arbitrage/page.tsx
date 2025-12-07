"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { AuthGuard } from "@/components/auth-guard"
import { ArbitrageModule } from "@/components/dashboard/arbitrage-module"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Zap, Timer } from "lucide-react"

export default function ArbitragePage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Arbitrage Opportunities</h1>
            <p className="text-gray-400">Real-time cross-DEX arbitrage detection and execution</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Today's Profit</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-white font-bold text-2xl">$2,451.80</p>
                <p className="text-green-400 text-xs mt-1">+18.5% vs yesterday</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Opportunities Found</span>
                  <Zap className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-white font-bold text-2xl">24</p>
                <p className="text-yellow-400 text-xs mt-1">4 executable</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Execution Time</span>
                  <Timer className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-white font-bold text-2xl">245ms</p>
                <p className="text-cyan-400 text-xs mt-1">Avg response</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3">
            <ArbitrageModule />
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
