"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, DollarSign, Zap } from "lucide-react"

interface CrossChainRoute {
  bridgeName: string
  estimatedTime: string
  fees: {
    totalFee: string
  }
  liquidity: string
}

interface RouteSelectiorProps {
  routes: CrossChainRoute[]
  selectedRoute: string | null
  onSelectRoute: (bridgeName: string) => void
}

export function RouteSelector({ routes, selectedRoute, onSelectRoute }: RouteSelectiorProps) {
  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <CardTitle>Cross-Chain Routes</CardTitle>
        <CardDescription>Select the best bridge for your transfer</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {routes.map((route) => (
            <button
              key={route.bridgeName}
              onClick={() => onSelectRoute(route.bridgeName)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedRoute === route.bridgeName
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">{route.bridgeName}</h4>
                <Badge className="bg-green-500/20 text-green-300">{route.liquidity}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{route.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <DollarSign className="w-4 h-4" />
                  <span>{route.fees.totalFee}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Zap className="w-4 h-4" />
                  <span>Native Token</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
