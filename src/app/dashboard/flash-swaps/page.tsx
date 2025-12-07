"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { AuthGuard } from "@/components/auth-guard"
import { FlashSwapsModule } from "@/components/dashboard/flash-swaps-module"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Shield, DollarSign } from "lucide-react"

export default function FlashSwapsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Flash Swaps & MEV Protection</h1>
            <p className="text-gray-400">Advanced trading strategies with MEV protection and flash loan integration</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Protected Trades</span>
                  <Shield className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-white font-bold text-2xl">342</p>
                <p className="text-green-400 text-xs mt-1">+28 this week</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">MEV Savings</span>
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-white font-bold text-2xl">$18,456.22</p>
                <p className="text-cyan-400 text-xs mt-1">Monthly estimate</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Flash Loans Used</span>
                  <Zap className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-white font-bold text-2xl">18</p>
                <p className="text-yellow-400 text-xs mt-1">Aave & dYdX</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            <FlashSwapsModule />
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
