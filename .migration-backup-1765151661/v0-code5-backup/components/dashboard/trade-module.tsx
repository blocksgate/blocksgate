"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useWallet } from "@/lib/wallet-context"
import { useRouter } from "next/navigation"
import { Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { useWalletBalance } from "@/lib/hooks/use-wallet-balance"
import { useTokenPrice } from "@/lib/hooks/use-token-price"

export function TradeModule() {
  const [activeTab, setActiveTab] = useState("swap")
  const [sellAmount, setSellAmount] = useState("")
  const [buyAmount, setBuyAmount] = useState("")
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const { connected, address } = useWallet()
  const router = useRouter()

  // Fetch real ETH balance and price
  const { balance: ethBalance, loading: ethBalanceLoading } = useWalletBalance()
  const { price: ethPrice, change24h: ethChange, loading: ethPriceLoading } = useTokenPrice("ethereum")
  
  // Mock USDC balance for now
  const usdcBalance = "0.00"
  const usdcBalanceLoading = false

  const handleSellAmountChange = async (value: string) => {
    setSellAmount(value)
    if (value && Number.parseFloat(value) > 0 && ethPrice) {
      setIsLoadingQuote(true)
      try {
        // Get real quote from 0x Protocol
        const sellAmountWei = (Number.parseFloat(value) * 1e18).toString()
        const response = await fetch(
          `/api/swap/quote?chainId=1&sellToken=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&buyToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&sellAmount=${sellAmountWei}`
        )
        
        if (response.ok) {
          const data = await response.json()
          const buyAmountFormatted = (Number.parseFloat(data.quote.buyAmount) / 1e6).toFixed(2)
          setBuyAmount(buyAmountFormatted)
        } else {
          // Fallback to price calculation
          const usdcAmount = (Number.parseFloat(value) * ethPrice).toFixed(2)
          setBuyAmount(usdcAmount)
        }
      } catch (error) {
        console.error("Failed to get quote:", error)
        // Fallback calculation
        if (ethPrice) {
          const usdcAmount = (Number.parseFloat(value) * ethPrice).toFixed(2)
          setBuyAmount(usdcAmount)
        }
      } finally {
        setIsLoadingQuote(false)
      }
    } else {
      setBuyAmount("")
    }
  }

  const handleSwap = () => {
    if (connected) {
      router.push("/dashboard/swap")
    }
  }

  const formatBalance = (balance: string) => {
    const num = Number.parseFloat(balance)
    if (num === 0) return "0.00"
    if (num < 0.01) return "<0.01"
    return num.toFixed(4)
  }

  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Quick Trade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("swap")}
              className={`flex-1 py-2 rounded transition-colors ${
                activeTab === "swap"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Swap
            </button>
            <button
              onClick={() => setActiveTab("limit")}
              className={`flex-1 py-2 rounded transition-colors ${
                activeTab === "limit"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Limit
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sell</label>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex justify-between items-center">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={sellAmount}
                    onChange={(e) => handleSellAmountChange(e.target.value)}
                    className="w-full bg-transparent text-white outline-none text-lg"
                  />
                  <span className="text-white font-semibold ml-2">ETH</span>
                </div>
                <div className="text-xs text-gray-400 mt-2 flex justify-between">
                  <span>
                    Balance: {connected ? (ethBalanceLoading ? "..." : formatBalance(ethBalance)) : "—"} ETH
                  </span>
                  {ethPrice && (
                    <span className="flex items-center gap-1">
                      <span className={ethChange >= 0 ? "text-green-400" : "text-red-400"}>
                        ${ethPrice.toFixed(2)}
                      </span>
                      {ethChange !== 0 && (
                        <span className={`text-xs ${ethChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {ethChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const temp = sellAmount
                setSellAmount(buyAmount)
                setBuyAmount(temp)
              }}
              className="w-full text-gray-400 hover:text-white py-2 text-sm transition-colors"
            >
              ↓ Swap ↑
            </button>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Buy</label>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex justify-between items-center">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={buyAmount}
                    readOnly
                    className="w-full bg-transparent text-white outline-none text-lg"
                  />
                  <span className="text-white font-semibold ml-2">USDC</span>
                </div>
                <div className="text-xs text-gray-400 mt-2 flex justify-between">
                  <span>
                    Balance: {connected ? (usdcBalanceLoading ? "..." : formatBalance(usdcBalance)) : "—"} USDC
                  </span>
                  {isLoadingQuote && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>
              </div>
            </div>

            <Button
              onClick={handleSwap}
              disabled={!connected || !sellAmount || Number.parseFloat(sellAmount) <= 0}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 disabled:opacity-50"
            >
              {connected ? "Swap" : "Connect Wallet"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
