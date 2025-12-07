"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { PoolsList } from "@/components/pools/pools-list"
import { PoolStats } from "@/components/pools/pool-stats"
import { AddLiquidityDialog } from "@/components/pools/add-liquidity-dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function PoolsPage() {
  const [showAddLiquidity, setShowAddLiquidity] = useState(false)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Liquidity Pools</h1>
            <p className="text-gray-400">Manage your liquidity positions and earn fees</p>
          </div>
          <Button
            onClick={() => setShowAddLiquidity(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
          >
            Add Liquidity
          </Button>
        </div>

        <PoolStats />
        <PoolsList />

        <AddLiquidityDialog open={showAddLiquidity} onOpenChange={setShowAddLiquidity} />
      </div>
    </DashboardLayout>
  )
}
