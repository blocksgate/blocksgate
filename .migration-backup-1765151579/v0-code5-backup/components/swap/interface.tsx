"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { getSwapPriceAction } from "@/app/actions/0x"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SwapToken {
  address: string
  symbol: string
  balance: string
}

const POPULAR_TOKENS = [
  { address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", symbol: "ETH", name: "Ethereum" },
  { address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", symbol: "USDC", name: "USD Coin" },
  { address: "0x6b175474e89094c44da98b954eedeac495271d0f", symbol: "DAI", name: "Dai Stablecoin" },
  { address: "0xdac17f958d2ee523a2206206994597c13d831ec7", symbol: "USDT", name: "Tether" },
  { address: "0x2260fac5e5542a773aa44fbcff9d8333aad63169", symbol: "WBTC", name: "Wrapped Bitcoin" },
]

function TokenSelector({
  onSelect,
  disabled = false,
}: { onSelect: (token: (typeof POPULAR_TOKENS)[0]) => void; disabled?: boolean }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition border-white/20"
        >
          <span>Select Token</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gradient-to-br from-gray-950 to-black border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Select Token</DialogTitle>
          <DialogDescription>Choose a token to swap</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-96 overflow-auto">
          {POPULAR_TOKENS.map((token) => (
            <button
              key={token.address}
              onClick={() => onSelect(token)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/10"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center font-bold text-white">
                {token.symbol[0]}
              </div>
              <div className="text-left">
                <div className="font-medium text-white">{token.symbol}</div>
                <div className="text-xs text-gray-400">{token.name}</div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SwapInterface() {
  const [sellToken, setSellToken] = useState<SwapToken>({
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    symbol: "ETH",
    balance: "5.42",
  })

  const [buyToken, setBuyToken] = useState<SwapToken>({
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    symbol: "USDC",
    balance: "12,450",
  })

  const [sellAmount, setSellAmount] = useState("")
  const [buyAmount, setBuyAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [slippage, setSlippage] = useState("0.5")
  const [openSellSelector, setOpenSellSelector] = useState(false)
  const [openBuySelector, setOpenBuySelector] = useState(false)

  const handleSellAmountChange = async (amount: string) => {
    setSellAmount(amount)
    if (amount && Number.parseFloat(amount) > 0) {
      setIsLoading(true)
      const sellAmountWei = (Number.parseFloat(amount) * 1e18).toString()
      const quote = await getSwapPriceAction(
        sellToken.address,
        buyToken.address,
        sellAmountWei,
        "0x1234567890123456789012345678901234567890",
      )
      if (quote) {
        setBuyAmount((Number.parseFloat(quote.buyAmount) / 1e6).toFixed(2))
      }
      setIsLoading(false)
    }
  }

  const handleSwapTokens = () => {
    const temp = sellToken
    setSellToken(buyToken)
    setBuyToken(temp)
    setSellAmount("")
    setBuyAmount("")
  }

  return (
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
                <TokenSelector
                  onSelect={(token) => {
                    setSellToken({
                      address: token.address,
                      symbol: token.symbol,
                      balance: "0",
                    })
                    setOpenSellSelector(false)
                  }}
                />
              </div>
              <div className="text-xs text-gray-400">
                Balance: {sellToken.balance} {sellToken.symbol}
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwapTokens}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 p-2 rounded-lg transition"
            >
              ↓ ↑
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
                <TokenSelector
                  onSelect={(token) => {
                    setBuyToken({
                      address: token.address,
                      symbol: token.symbol,
                      balance: "0",
                    })
                    setOpenBuySelector(false)
                  }}
                />
              </div>
              <div className="text-xs text-gray-400">
                Balance: {buyToken.balance} {buyToken.symbol}
              </div>
            </div>
          </div>

          {/* Slippage */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
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

          {/* Info */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Price Impact</span>
              <span className="text-yellow-400">-0.2%</span>
            </div>
            <div className="flex justify-between">
              <span>Liquidity Provider Fee</span>
              <span>0.02 {sellToken.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span>Route</span>
              <span className="text-gray-300">
                {sellToken.symbol} → {buyToken.symbol}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
