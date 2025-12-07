"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Shield, TrendingUp, AlertTriangle, Gauge } from "lucide-react"
import { useState } from "react"

interface FlashLoanProvider {
  name: string
  available: boolean
  fee: number
  minAmount: number
  maxAmount: number
  executionTime: number
  lastUsed?: string
}

interface MEVProtection {
  strategy: string
  effectiveness: number
  estimatedSavings: number
  active: boolean
}

const flashProviders: FlashLoanProvider[] = [
  {
    name: "Aave",
    available: true,
    fee: 0.05,
    minAmount: 1,
    maxAmount: 10000,
    executionTime: 150,
    lastUsed: "2 hours ago",
  },
  {
    name: "dYdX",
    available: true,
    fee: 0,
    minAmount: 2,
    maxAmount: 5000,
    executionTime: 180,
  },
  {
    name: "Uniswap V3",
    available: true,
    fee: 0.06,
    minAmount: 0.5,
    maxAmount: 8000,
    executionTime: 120,
    lastUsed: "4 hours ago",
  },
  {
    name: "Balancer",
    available: false,
    fee: 0.03,
    minAmount: 3,
    maxAmount: 12000,
    executionTime: 200,
  },
]

const mevStrategies: MEVProtection[] = [
  { strategy: "Private Mempool", effectiveness: 95, estimatedSavings: 342.50, active: true },
  { strategy: "MEV-Protect", effectiveness: 88, estimatedSavings: 285.30, active: true },
  { strategy: "Order Batching", effectiveness: 72, estimatedSavings: 156.80, active: false },
  { strategy: "Intent Settlement", effectiveness: 91, estimatedSavings: 318.40, active: false },
]

export function FlashSwapsModule() {
  const [selectedProvider, setSelectedProvider] = useState<string>("Aave")
  const [loanAmount, setLoanAmount] = useState("")
  const [viewMode, setViewMode] = useState<"loans" | "mev">("loans")

  const selectedProviderData = flashProviders.find((p) => p.name === selectedProvider)
  const expectedFee = loanAmount
    ? ((Number.parseFloat(loanAmount) * (selectedProviderData?.fee || 0)) / 100).toFixed(2)
    : "0.00"

  return (
    <Card className="col-span-1 bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Flash Swaps & MEV
            </CardTitle>
            <p className="text-sm text-gray-400 mt-1">Protected trading & advanced strategies</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("loans")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                viewMode === "loans"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                  : "bg-white/5 text-gray-400 border border-white/10"
              }`}
            >
              Flash Loans
            </button>
            <button
              onClick={() => setViewMode("mev")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                viewMode === "mev"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                  : "bg-white/5 text-gray-400 border border-white/10"
              }`}
            >
              MEV Protection
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "loans" ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-white font-semibold text-sm">Flash Loan Calculator</h3>
                <Gauge className="w-4 h-4 text-blue-400" />
              </div>
              <input
                type="number"
                placeholder="Enter loan amount (USD)"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm mb-3 placeholder-gray-500"
              />
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Provider Fee:</span>
                  <span className="text-cyan-300 font-semibold">${expectedFee}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Selected:</span>
                  <span className="text-white font-semibold">{selectedProvider}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {flashProviders.map((provider) => (
                <button
                  key={provider.name}
                  onClick={() => setSelectedProvider(provider.name)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedProvider === provider.name
                      ? "bg-blue-500/20 border-blue-500/50"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  } border`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">{provider.name}</span>
                      {provider.available ? (
                        <Badge className="bg-green-500/20 text-green-300 text-xs">Available</Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-300 text-xs">Unavailable</Badge>
                      )}
                    </div>
                    <span className={`text-xs font-semibold ${provider.fee === 0 ? "text-green-400" : "text-yellow-400"}`}>
                      {provider.fee}% fee
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-xs">
                      <p className="text-gray-400">Min</p>
                      <p className="text-white font-semibold">${provider.minAmount}</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-gray-400">Max</p>
                      <p className="text-white font-semibold">${provider.maxAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-gray-400">Execution</p>
                      <p className="text-white font-semibold">{provider.executionTime}ms</p>
                    </div>
                  </div>
                  {provider.lastUsed && <p className="text-xs text-gray-500 mt-2">Last used: {provider.lastUsed}</p>}
                </button>
              ))}
            </div>

            {loanAmount && (
              <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 font-semibold">
                Execute Flash Loan
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {mevStrategies.map((strategy) => (
              <div key={strategy.strategy} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <p className="text-white font-semibold text-sm">{strategy.strategy}</p>
                    {strategy.active && <Badge className="bg-green-500/20 text-green-300 text-xs">Active</Badge>}
                  </div>
                  <Button
                    size="sm"
                    variant={strategy.active ? "default" : "outline"}
                    className="text-xs h-7"
                  >
                    {strategy.active ? "Disable" : "Enable"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Effectiveness</span>
                    <span className="text-white font-semibold">{strategy.effectiveness}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${strategy.effectiveness}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-gray-400">Est. Savings</span>
                    </div>
                    <span className="text-green-400 font-semibold text-sm">${strategy.estimatedSavings.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">
                These strategies reduce MEV exposure. Estimated monthly savings from all active strategies: $1,258.40
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
