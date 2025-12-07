"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface AddLiquidityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddLiquidityDialog({ open, onOpenChange }: AddLiquidityDialogProps) {
  const [token0, setToken0] = useState("ETH")
  const [token1, setToken1] = useState("USDC")
  const [amount0, setAmount0] = useState("")
  const [amount1, setAmount1] = useState("")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-white/5 to-white/0 border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Add Liquidity</DialogTitle>
          <DialogDescription className="text-gray-400">
            Provide liquidity to earn fees from swaps in this pool
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Token 0 */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Token 1</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.00"
                value={amount0}
                onChange={(e) => setAmount0(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
              <Select value={token0} onValueChange={setToken0}>
                <SelectTrigger className="w-24 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/80 border-white/10">
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="WETH">WETH</SelectItem>
                  <SelectItem value="DAI">DAI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-gray-500 mt-2">Balance: 5.42 ETH</div>
          </div>

          {/* Swap Icon */}
          <div className="flex justify-center">
            <button className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition">↓ ↑</button>
          </div>

          {/* Token 1 */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Token 2</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.00"
                value={amount1}
                onChange={(e) => setAmount1(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
              <Select value={token1} onValueChange={setToken1}>
                <SelectTrigger className="w-24 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/80 border-white/10">
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="DAI">DAI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-gray-500 mt-2">Balance: 12,450 USDC</div>
          </div>

          {/* Fee Tier Selection */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-3 block">Fee Tier</label>
            <div className="grid grid-cols-3 gap-2">
              {["0.01%", "0.05%", "0.30%"].map((fee) => (
                <button
                  key={fee}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm transition"
                >
                  {fee}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated APY */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Estimated APY</span>
              <span className="text-lg font-bold text-green-400">12.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Estimated Daily Fees</span>
              <span className="text-sm font-medium text-white">$0.42</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
              Connect Wallet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
