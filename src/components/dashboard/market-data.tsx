"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Star, TrendingUp, TrendingDown, Search } from "lucide-react"
import { useState } from "react"
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts"

interface TokenData {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
  supply: number
  chart: Array<{ time: string; price: number }>
  isFavorite: boolean
}

const marketTokens: TokenData[] = [
  {
    id: "1",
    name: "Bitcoin",
    symbol: "BTC",
    price: 44244.0,
    change24h: 22.07,
    marketCap: 871.9,
    volume24h: 321,
    supply: 897,
    chart: [
      { time: "0", price: 43000 },
      { time: "1", price: 43500 },
      { time: "2", price: 43200 },
      { time: "3", price: 43800 },
      { time: "4", price: 44244 },
    ],
    isFavorite: false,
  },
  {
    id: "2",
    name: "Ethereum",
    symbol: "ETH",
    price: 2662.0,
    change24h: -1.05,
    marketCap: 318.2,
    volume24h: 188.8,
    supply: 183.2,
    chart: [
      { time: "0", price: 2700 },
      { time: "1", price: 2680 },
      { time: "2", price: 2690 },
      { time: "3", price: 2670 },
      { time: "4", price: 2662 },
    ],
    isFavorite: true,
  },
  {
    id: "3",
    name: "Solana",
    symbol: "SOL",
    price: 197.0,
    change24h: -4.39,
    marketCap: 86,
    volume24h: 1968.7,
    supply: 843.8,
    chart: [
      { time: "0", price: 210 },
      { time: "1", price: 205 },
      { time: "2", price: 200 },
      { time: "3", price: 198 },
      { time: "4", price: 197 },
    ],
    isFavorite: false,
  },
  {
    id: "4",
    name: "Litecoin",
    symbol: "LTC",
    price: 141.0,
    change24h: -0.21,
    marketCap: 21.2,
    volume24h: 662.7,
    supply: 821.2,
    chart: [
      { time: "0", price: 142 },
      { time: "1", price: 141.5 },
      { time: "2", price: 141.2 },
      { time: "3", price: 141.1 },
      { time: "4", price: 141 },
    ],
    isFavorite: false,
  },
  {
    id: "5",
    name: "Ripple",
    symbol: "XRP",
    price: 2.4,
    change24h: 1.25,
    marketCap: 132.4,
    volume24h: 2145,
    supply: 53761,
    chart: [
      { time: "0", price: 2.38 },
      { time: "1", price: 2.39 },
      { time: "2", price: 2.4 },
      { time: "3", price: 2.41 },
      { time: "4", price: 2.4 },
    ],
    isFavorite: false,
  },
]

const MiniChart = ({ data }: { data: Array<{ time: string; price: number }> }) => (
  <ResponsiveContainer width={50} height={30}>
    <LineChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
      <Line
        type="monotone"
        dataKey="price"
        stroke="#00f0ff"
        dot={false}
        strokeWidth={1.5}
        isAnimationActive={false}
      />
    </LineChart>
  </ResponsiveContainer>
)

export function MarketData() {
  const [tokens, setTokens] = useState(marketTokens)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "favorites" | "gainers" | "losers">("all")

  const handleToggleFavorite = (id: string) => {
    setTokens(
      tokens.map((token) =>
        token.id === id ? { ...token, isFavorite: !token.isFavorite } : token
      )
    )
  }

  const filteredTokens = tokens
    .filter((token) => {
      const matchesSearch =
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase())

      switch (filterType) {
        case "favorites":
          return token.isFavorite && matchesSearch
        case "gainers":
          return token.change24h > 0 && matchesSearch
        case "losers":
          return token.change24h < 0 && matchesSearch
        default:
          return matchesSearch
      }
    })

  return (
    <Card className="col-span-full bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-white">Market</CardTitle>
            <p className="text-xs text-gray-400 mt-1">Real-time cryptocurrency market data</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                filterType === "all"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              All Assets
            </button>
            <button
              onClick={() => setFilterType("favorites")}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                filterType === "favorites"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              Favorites
            </button>
            <button
              onClick={() => setFilterType("gainers")}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                filterType === "gainers"
                  ? "bg-green-500/20 text-green-300 border border-green-500/50"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              Gainers
            </button>
            <button
              onClick={() => setFilterType("losers")}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                filterType === "losers"
                  ? "bg-red-500/20 text-red-300 border border-red-500/50"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              Losers
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder-gray-500 pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">#</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Currency</th>
                <th className="text-right py-3 px-4 text-gray-400 font-semibold">Price</th>
                <th className="text-right py-3 px-4 text-gray-400 font-semibold">Change</th>
                <th className="text-right py-3 px-4 text-gray-400 font-semibold">Market Cap</th>
                <th className="text-right py-3 px-4 text-gray-400 font-semibold">Volume (24h)</th>
                <th className="text-right py-3 px-4 text-gray-400 font-semibold">Supply</th>
                <th className="text-right py-3 px-4 text-gray-400 font-semibold">Chart</th>
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map((token, index) => (
                <tr
                  key={token.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggleFavorite(token.id)}
                      className="text-gray-400 hover:text-yellow-400 transition-colors"
                    >
                      <Star
                        className="w-4 h-4"
                        fill={token.isFavorite ? "currentColor" : "none"}
                      />
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {token.symbol.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{token.symbol}</p>
                        <p className="text-gray-400 text-xs">{token.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <p className="text-white font-semibold">${token.price.toFixed(2)}</p>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className={`flex items-center justify-end gap-1 ${token.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {token.change24h >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span className="font-semibold">{Math.abs(token.change24h).toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-gray-400">
                    ${(token.marketCap / 1000).toFixed(1)}B
                  </td>
                  <td className="py-4 px-4 text-right text-gray-400">
                    ${(token.volume24h / 1000).toFixed(1)}B
                  </td>
                  <td className="py-4 px-4 text-right text-gray-400">
                    {(token.supply / 1000).toFixed(1)}M
                  </td>
                  <td className="py-4 px-4 text-right">
                    <MiniChart data={token.chart} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
