"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const pools = [
  {
    id: 1,
    tokens: "ETH/USDC",
    fee: "0.01%",
    tvl: "$2.4B",
    volume24h: "$450M",
    apy: "12.5%",
    yourLiquidity: "$5,200.00",
  },
  {
    id: 2,
    tokens: "WETH/USDT",
    fee: "0.05%",
    tvl: "$1.8B",
    volume24h: "$280M",
    apy: "8.2%",
    yourLiquidity: "$0.00",
  },
  {
    id: 3,
    tokens: "DAI/USDC",
    fee: "0.01%",
    tvl: "$1.2B",
    volume24h: "$150M",
    apy: "4.5%",
    yourLiquidity: "$3,100.50",
  },
]

export function PoolsOverview() {
  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Liquidity Pools</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Pool</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Fee</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">TVL</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">24h Volume</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">APY</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Your Liquidity</th>
              </tr>
            </thead>
            <tbody>
              {pools.map((pool) => (
                <tr key={pool.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="py-4 px-4 text-white font-medium">{pool.tokens}</td>
                  <td className="py-4 px-4 text-gray-400">{pool.fee}</td>
                  <td className="py-4 px-4 text-gray-400">{pool.tvl}</td>
                  <td className="py-4 px-4 text-gray-400">{pool.volume24h}</td>
                  <td className="py-4 px-4">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{pool.apy}</Badge>
                  </td>
                  <td className="py-4 px-4 text-white font-medium">{pool.yourLiquidity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
