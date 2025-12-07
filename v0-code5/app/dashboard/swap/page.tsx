"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { EnhancedSwapInterface } from "@/components/swap/enhanced-swap-interface"

export default function SwapPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Token Swap</h1>
          <p className="text-gray-400">
            Swap tokens with the best rates powered by 0x Protocol
          </p>
        </div>
        <EnhancedSwapInterface />
      </div>
    </DashboardLayout>
  )
}
