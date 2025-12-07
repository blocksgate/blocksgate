"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { X, Copy, Check } from "lucide-react"

interface WithdrawalModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WithdrawalModal({ isOpen, onClose }: WithdrawalModalProps) {
  const [amount, setAmount] = useState("100")
  const [selectedToken, setSelectedToken] = useState("USDC")
  const [withdrawalAddress, setWithdrawalAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f2F897")
  const [copied, setCopied] = useState(false)

  const tokens = ["ETH", "USDC", "DAI", "USDT"]
  const transferFee = Number.parseFloat(amount) * 0.005
  const totalAmount = Number.parseFloat(amount) + transferFee

  const handleCopy = () => {
    navigator.clipboard.writeText(withdrawalAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-gradient-to-br from-white/10 to-white/5 border-white/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Withdrawal Info</CardTitle>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Amount</label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-white/5 border-white/10 text-white placeholder-gray-500"
                placeholder="0.00"
              />
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="bg-white/5 border border-white/10 rounded px-3 text-white outline-none cursor-pointer hover:bg-white/10 transition-colors"
              >
                {tokens.map((token) => (
                  <option key={token} value={token} className="bg-black text-white">
                    {token}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Available Balance</label>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-white font-semibold">3,200.00 {selectedToken}</p>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Recipient Address</label>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
              <p className="text-white font-mono text-sm truncate">{withdrawalAddress}</p>
              <button
                onClick={handleCopy}
                className="ml-2 p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Amount</span>
              <span className="text-white font-semibold">${amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Transfer Fee</span>
              <span className="text-white font-semibold">${transferFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <span className="text-white font-semibold text-sm">You will get</span>
              <div className="text-right">
                <p className="text-white font-bold">${totalAmount.toFixed(2)}</p>
                <p className="text-gray-400 text-xs">{totalAmount.toFixed(4)} {selectedToken}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/10 text-gray-400 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold border-0">
              Confirm Withdrawal
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By confirming, you agree to the withdrawal terms and conditions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
