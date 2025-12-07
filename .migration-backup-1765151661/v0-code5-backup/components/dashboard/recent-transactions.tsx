"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const transactions = [
  {
    id: 1,
    type: "Swap",
    from: "2.5 ETH",
    to: "4,250 USDC",
    hash: "0x1234...5678",
    status: "Confirmed",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "Liquidity Add",
    from: "1 ETH + 1,700 USDC",
    to: "LP Tokens",
    hash: "0x2345...6789",
    status: "Confirmed",
    time: "5 hours ago",
  },
  {
    id: 3,
    type: "Swap",
    from: "500 USDC",
    to: "0.3 ETH",
    hash: "0x3456...7890",
    status: "Confirmed",
    time: "1 day ago",
  },
]

export function RecentTransactions() {
  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition"
            >
              <div className="flex-1">
                <div className="font-medium text-white">{tx.type}</div>
                <div className="text-sm text-gray-400">
                  {tx.from} → {tx.to}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <a href="#" className="text-purple-400 hover:text-purple-300 text-sm">
                    {tx.hash}
                  </a>
                  <div className="text-xs text-gray-400 mt-1">{tx.time}</div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{tx.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
