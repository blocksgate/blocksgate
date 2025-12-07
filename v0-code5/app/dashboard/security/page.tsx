"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle, CheckCircle, Lock, TrendingUp, Globe } from "lucide-react"

export default function SecurityPage() {
  const securityFeatures = [
    {
      name: "Private Mempool",
      status: "active",
      effectiveness: 95,
      savings: 1250,
      description: "Hide transactions from public mempool to prevent sandwich attacks",
    },
    {
      name: "MEV Protect",
      status: "active",
      effectiveness: 88,
      savings: 890,
      description: "Flashbots Protect RPC routing to minimize MEV exposure",
    },
    {
      name: "Order Batching",
      status: "inactive",
      effectiveness: 72,
      savings: 450,
      description: "Batch multiple orders to reduce individual exposure",
    },
    {
      name: "Intent Settlement",
      status: "inactive",
      effectiveness: 91,
      savings: 1100,
      description: "CoW Protocol for intent-based secure settlement",
    },
  ]

  const regions = [
    { name: "US-East", status: "healthy", uptime: "99.95%" },
    { name: "EU-West", status: "healthy", uptime: "99.98%" },
    { name: "Asia-Pacific", status: "healthy", uptime: "99.87%" },
  ]

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Security & MEV Protection</h1>
            <p className="text-gray-400">Advanced security measures and MEV protection strategies</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Protection Status</span>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-white font-bold text-2xl">2 Active</p>
                <p className="text-green-400 text-xs mt-1">2 available to enable</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Monthly Savings</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-white font-bold text-2xl">$2,140</p>
                <p className="text-green-400 text-xs mt-1">From MEV protection</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Active Regions</span>
                  <Globe className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-white font-bold text-2xl">3</p>
                <p className="text-blue-400 text-xs mt-1">Global coverage</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    MEV Protection Strategies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {securityFeatures.map((feature) => (
                    <div key={feature.name} className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-semibold text-sm">{feature.name}</p>
                          <p className="text-gray-400 text-xs mt-1">{feature.description}</p>
                        </div>
                        <Badge
                          className={`text-xs ${
                            feature.status === "active"
                              ? "bg-green-500/20 text-green-300"
                              : "bg-gray-500/20 text-gray-300"
                          }`}
                        >
                          {feature.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Effectiveness</span>
                          <span className="text-white font-semibold">{feature.effectiveness}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            style={{ width: `${feature.effectiveness}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs pt-2">
                          <span className="text-gray-400">Est. Monthly Savings</span>
                          <span className="text-green-400 font-semibold">${feature.savings}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 border-white/10 text-gray-400 hover:bg-white/5"
                      >
                        {feature.status === "active" ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-400" />
                    Geographic Redundancy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {regions.map((region) => (
                    <div key={region.name} className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-semibold">{region.name}</p>
                        <Badge className="bg-green-500/20 text-green-300 text-xs">
                          {region.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-400">Uptime</span>
                        <span className="text-green-400 font-semibold">{region.uptime}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-green-500"
                          style={{
                            width: region.uptime === "99.98%" ? "99.98%" : region.uptime === "99.95%" ? "99.95%" : "99.87%",
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 mt-4">
                    <div className="flex gap-2">
                      <Lock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-blue-300 font-semibold text-sm">Encrypted Credentials</p>
                        <p className="text-blue-200 text-xs mt-1">All sensitive data is encrypted and securely stored</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
