"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { getAllowanceHolderPriceAction } from "@/app/actions/0x-enhanced"
import { MethodSelector } from "./method-selector"

interface SwapToken {
  address: string
  symbol: string
  decimals: number
  balance: string
}

export function AdvancedSwapInterface() {
  const [swapMethod, setSwapMethod] = useState<"permit2" | "allowance-holder" | "gasless">("permit2")
  const [sellToken, setSellToken] = useState<SwapToken>({
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    symbol: "WETH",
    decimals: 18,
    balance: "5.42",
  })

  const [buyToken, setBuyToken] = useState<SwapToken>({
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    symbol: "USDC",
    decimals: 6,
    balance: "12,450",
  })

  const [sellAmount, setSellAmount] = useState("")
  const [buyAmount, setBuyAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [slippage, setSlippage] = useState("0.5")
  const [priceImpact, setPriceImpact] = useState("0.0")

  const handleSellAmountChange = async (amount: string) => {
    setSellAmount(amount)
    if (amount && Number.parseFloat(amount) > 0) {
      setIsLoading(true)
      const sellAmountWei = (Number.parseFloat(amount) * Math.pow(10, sellToken.decimals)).toString()

      const quote = await getAllowanceHolderPriceAction(
        sellToken.address,
        buyToken.address,
        sellAmountWei,
        "0x1234567890123456789012345678901234567890",
        Math.round(Number.parseFloat(slippage) * 100),
      )

      if (quote) {
        const bought = Number.parseFloat(quote.buyAmount || "0") / Math.pow(10, buyToken.decimals)
        setBuyAmount(bought.toFixed(buyToken.decimals))

        // Calculate price impact
        const spotPrice = Number.parseFloat(quote.price || "0")
        const expectedAmount = Number.parseFloat(amount) * spotPrice
        const impact = (((expectedAmount - bought) / expectedAmount) * 100).toFixed(2)
        setPriceImpact(impact)
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Method Selector */}
      <MethodSelector selectedMethod={swapMethod} onMethodChange={setSwapMethod} />

      {/* Main Swap Card */}
      <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Sell Section */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">You Sell</label>
              <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                <div className="flex justify-between items-end mb-3">
                  <input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => handleSellAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="bg-transparent text-3xl text-white outline-none w-full font-bold"
                  />
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition">
                    <span className="font-semibold">{sellToken.symbol}</span>
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  Balance: {sellToken.balance} {sellToken.symbol}
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 p-2 rounded-lg transition">
                ↓
              </button>
            </div>

            {/* Buy Section */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">You Receive</label>
              <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                <div className="flex justify-between items-end mb-3">
                  <input
                    type="number"
                    value={buyAmount}
                    disabled
                    placeholder="0.00"
                    className="bg-transparent text-3xl text-white outline-none w-full font-bold disabled:text-gray-500"
                  />
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition">
                    <span className="font-semibold">{buyToken.symbol}</span>
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  Balance: {buyToken.balance} {buyToken.symbol}
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Slippage Tolerance</span>
                <div className="flex gap-2">
                  {["0.1", "0.5", "1"].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      className={`px-3 py-1 rounded text-sm transition ${
                        slippage === value ? "bg-purple-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <Button
              disabled={!sellAmount || isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-base border-0 rounded-lg disabled:opacity-50"
            >
              {isLoading ? "Getting Quote..." : "Connect Wallet to Swap"}
            </Button>

            {/* Details */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-xs text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Price Impact</span>
                <span className={Number.parseFloat(priceImpact) > 0.5 ? "text-red-400" : "text-yellow-400"}>
                  -{priceImpact}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Swap Method</span>
                <span className="text-gray-300 capitalize">{swapMethod}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
