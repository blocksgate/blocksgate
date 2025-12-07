"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { PortfolioCard } from "@/components/dashboard/portfolio-card"
import { PoolsOverview } from "@/components/dashboard/pools-overview"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { AuthGuard } from "@/components/auth-guard"
import { SystemIntegrationMonitor } from "@/components/dashboard/system-integration-monitor"
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary"
import { RecentTrades } from "@/components/dashboard/recent-trades"
import { AssetAllocation } from "@/components/dashboard/asset-allocation"
import { AdvancedAnalytics } from "@/components/dashboard/advanced-analytics"
import { ArbitrageModule } from "@/components/dashboard/arbitrage-module"
import { FlashSwapsModule } from "@/components/dashboard/flash-swaps-module"
import { PerformanceMetrics } from "@/components/dashboard/performance-metrics"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Coins, TrendingUp, Shield } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const featureModules = [
    {
      id: "trading",
      name: "Trading",
      description: "Execute advanced swaps with real-time pricing",
      icon: Coins,
      link: "/dashboard/trading",
      color: "from-cyan-500 to-blue-500",
    },
    {
      id: "arbitrage",
      name: "Arbitrage",
      description: "Monitor and execute profitable arbitrage opportunities",
      icon: TrendingUp,
      link: "/dashboard/arbitrage",
      color: "from-yellow-500 to-orange-500",
    },
    {
      id: "flash-swaps",
      name: "Flash Swaps",
      description: "Flash loans and MEV protection strategies",
      icon: Zap,
      link: "/dashboard/flash-swaps",
      color: "from-blue-500 to-purple-500",
    },
    {
      id: "security",
      name: "Security",
      description: "MEV protection and advanced security features",
      icon: Shield,
      link: "/dashboard/security",
      color: "from-green-500 to-emerald-500",
    },
  ]

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Sophisticated DeFi trading platform with advanced features and real-time analytics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureModules.map((module) => {
              const Icon = module.icon
              return (
                <Link key={module.id} href={module.link}>
                  <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10 hover:border-white/30 transition-all cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${module.color} text-white`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                      <h3 className="text-white font-semibold mb-1">{module.name}</h3>
                      <p className="text-gray-400 text-sm">{module.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          <PerformanceMetrics />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <PortfolioCard />
              <AdvancedAnalytics />
            </div>
            <div className="space-y-6">
              <AssetAllocation />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ArbitrageModule />
            <FlashSwapsModule />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <PoolsOverview />
            </div>
            <div className="space-y-6">
              <PortfolioSummary />
              <RecentTrades />
            </div>
          </div>

          <div className="border-t border-border/50 pt-8">
            <h2 className="text-2xl font-bold mb-4">System Status</h2>
            <SystemIntegrationMonitor />
          </div>

          <RecentTransactions />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
