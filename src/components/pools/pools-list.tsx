"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const poolsData = [
  {
    id: 1,
    tokens: "ETH/USDC",
    fee: "0.01%",
    tvl: "$2.4B",
    volume24h: "$450M",
    apy: "12.5%",
    yourLiquidity: "$5,200.00",
    yourFees: "$12.30",
    status: "Active",
  },
  {
    id: 2,
    tokens: "DAI/USDC",
    fee: "0.01%",
    tvl: "$1.2B",
    volume24h: "$150M",
    apy: "4.5%",
    yourLiquidity: "$3,100.50",
    yourFees: "$12.20",
    status: "Active",
  },
  {
    id: 3,
    tokens: "WETH/USDT",
    fee: "0.05%",
    tvl: "$1.8B",
    volume24h: "$280M",
    apy: "8.2%",
    yourLiquidity: "$0.00",
    yourFees: "$0.00",
    status: "Available",
  },
]

export function PoolsList() {
  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Your Positions & Available Pools</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-400">Pool</TableHead>
                <TableHead className="text-gray-400">Fee</TableHead>
                <TableHead className="text-gray-400">TVL</TableHead>
                <TableHead className="text-gray-400">24h Volume</TableHead>
                <TableHead className="text-gray-400">APY</TableHead>
                <TableHead className="text-gray-400">Your Liquidity</TableHead>
                <TableHead className="text-gray-400">Fees Earned</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {poolsData.map((pool) => (
                <TableRow key={pool.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{pool.tokens}</TableCell>
                  <TableCell className="text-gray-400">{pool.fee}</TableCell>
                  <TableCell className="text-gray-400">{pool.tvl}</TableCell>
                  <TableCell className="text-gray-400">{pool.volume24h}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{pool.apy}</Badge>
                  </TableCell>
                  <TableCell className="text-white font-medium">{pool.yourLiquidity}</TableCell>
                  <TableCell className="text-green-400 font-medium">{pool.yourFees}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {pool.status === "Active" ? (
                        <>
                          <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300">
                            Remove
                          </Button>
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                            Add More
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                          Add
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
