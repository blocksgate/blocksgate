"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { useState } from "react"
import { Search, Settings, Share2, Copy, Info, TrendingUp, TrendingDown, Clock, Zap, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const priceChartData = [
  { time: "5:47 PM", price: 1400.0 },
  { time: "6:00 PM", price: 1402.5 },
  { time: "6:15 PM", price: 1401.2 },
  { time: "6:30 PM", price: 1405.8 },
  { time: "7:00 PM", price: 1408.3 },
  { time: "7:30 PM", price: 1410.5 },
  { time: "8:00 PM", price: 1407.2 },
  { time: "8:30 PM", price: 1412.1 },
]

interface TokenInfo {
  symbol: string
  name: string
  price: number
  change24h: number
  icon: string
}

const tokens: TokenInfo[] = [
  { symbol: "ETH", name: "Ethereum", price: 1412.1, change24h: 2.3, icon: "Ξ" },
  { symbol: "USDC", name: "USD Coin", price: 1.0, change24h: 0.0, icon: "U" },
  { symbol: "DAI", name: "Dai", price: 0.999, change24h: 0.02, icon: "D" },
  { symbol: "BTC", name: "Bitcoin", price: 43215.5, change24h: 1.8, icon: "₿" },
]

interface SwapDetails {
  maxSlippage: number
  priceImpact: number
  gasEstimate: number
  minimumReceived: number
}

export function EnhancedSwapInterface() {
  const [fromToken, setFromToken] = useState<TokenInfo>(tokens[0])
  const [toToken, setToToken] = useState<TokenInfo>(tokens[1])
  const [fromAmount, setFromAmount] = useState("1")
  const [toAmount, setToAmount] = useState("1412.10")
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)
  const [chartTimeframe, setChartTimeframe] = useState<"1h" | "4h" | "1d" | "1w">("1h")

  const swapDetails: SwapDetails = {
    maxSlippage: 0.6,
    priceImpact: 0.12,
    gasEstimate: 45.32,
    minimumReceived: 1405.28,
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-cyan-500/50 rounded p-3">
          <p className="text-cyan-300 font-semibold text-sm">${payload[0].value.toFixed(2)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-semibold text-sm">Swap to:</span>
                  <Badge variant="outline" className="text-cyan-300 border-cyan-500/50">
                    Crypto
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded transition-colors">
                  <Settings className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded transition-colors">
                  <Share2 className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Buy or sell any token instantly at the best price</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">From</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-cyan-500/50 transition-colors"
                  />
                  <button
                    onClick={() => setShowFromDropdown(!showFromDropdown)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <span className="text-white font-semibold text-sm">{fromToken.symbol}</span>
                  </button>

                  {showFromDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-black/90 border border-white/10 rounded-lg p-2 z-10">
                      {tokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setFromToken(token)
                            setShowFromDropdown(false)
                          }}
                          className="w-full flex items-center justify-between p-2 rounded hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                              {token.icon}
                            </div>
                            <div className="text-left">
                              <p className="text-white font-semibold text-sm">{token.symbol}</p>
                              <p className="text-gray-400 text-xs">{token.name}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-2 flex justify-between">
                  <span>Balance: 0.00 {fromToken.symbol}</span>
                  <span>${(Number.parseFloat(fromAmount) * fromToken.price).toFixed(2)}</span>
                </div>
              </div>

              <button className="w-full flex items-center justify-center py-2 text-gray-400 hover:text-white transition-colors">
                ↓ Swap ↑
              </button>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">To</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0.00"
                    value={toAmount}
                    readOnly
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none"
                  />
                  <button
                    onClick={() => setShowToDropdown(!showToDropdown)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <span className="text-white font-semibold text-sm">{toToken.symbol}</span>
                  </button>

                  {showToDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-black/90 border border-white/10 rounded-lg p-2 z-10">
                      {tokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setToToken(token)
                            setShowToDropdown(false)
                          }}
                          className="w-full flex items-center justify-between p-2 rounded hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                              {token.icon}
                            </div>
                            <div className="text-left">
                              <p className="text-white font-semibold text-sm">{token.symbol}</p>
                              <p className="text-gray-400 text-xs">{token.name}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-2 flex justify-between">
                  <span>Balance: 3200.00 {toToken.symbol}</span>
                  <span>${(Number.parseFloat(toAmount) * toToken.price).toFixed(2)}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Max Slippage</span>
                  <span className="text-white font-semibold">{swapDetails.maxSlippage}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Price Impact</span>
                  <span className="text-yellow-400 font-semibold">{swapDetails.priceImpact}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Gas Estimate</span>
                  <span className="text-white font-semibold">${swapDetails.gasEstimate}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between text-xs">
                  <span className="text-gray-400">Minimum Received</span>
                  <span className="text-cyan-300 font-semibold">{swapDetails.minimumReceived.toFixed(2)} {toToken.symbol}</span>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold border-0 h-12">
                Swap
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Price Chart</CardTitle>
              <div className="flex gap-2">
                {(["1h", "4h", "1d", "1w"] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setChartTimeframe(tf)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      chartTimeframe === tf
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                        : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={priceChartData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="#666" style={{ fontSize: "12px" }} />
                <YAxis stroke="#666" style={{ fontSize: "12px" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#00f0ff"
                  fill="url(#priceGradient)"
                  name="ETH/USD"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm">More Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Exchange Rate</p>
              <p className="text-white font-semibold">
                1 {fromToken.symbol} = {(fromToken.price / toToken.price).toFixed(4)} {toToken.symbol}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Last Traded</p>
              <p className="text-white font-semibold">Just now</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Daily Range</p>
              <p className="text-white font-semibold">
                ${(fromToken.price * 0.98).toFixed(2)} - ${(fromToken.price * 1.02).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-yellow-300 font-semibold mb-1">Price Impact</p>
                <p className="text-xs text-gray-400">
                  High slippage detected. Consider splitting your order across multiple trades.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
