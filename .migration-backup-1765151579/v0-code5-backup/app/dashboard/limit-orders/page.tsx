"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { LimitOrder } from "@/components/swap/limit-order"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function LimitOrdersPage() {
  const userAddress = "0x70a9f34f9b34c64957b9c401a97bfed35b95049e"
  const chainId = 1

  // Mock active orders
  const activeOrders = [
    {
      id: 1,
      pair: "ETH/USDC",
      triggerPrice: "$2,450.50",
      amount: "1.0 ETH",
      status: "Active",
      createdAt: "2 hours ago",
    },
    {
      id: 2,
      pair: "USDC/DAI",
      triggerPrice: "$0.999",
      amount: "10,000 USDC",
      status: "Pending",
      createdAt: "5 minutes ago",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Limit Orders</h1>
          <p className="text-muted-foreground mt-2">
            Set buy and sell orders at specific price points and let them execute automatically
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <LimitOrder userAddress={userAddress} chainId={chainId} />

          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardHeader>
                <CardTitle>How Limit Orders Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400 font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Set Your Price</p>
                    <p className="text-xs text-gray-400">Specify the price at which you want to trade</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0 text-pink-400 font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Automatic Execution</p>
                    <p className="text-xs text-gray-400">Order executes when market price reaches your limit</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Portfolio Update</p>
                    <p className="text-xs text-gray-400">Tokens instantly appear in your wallet</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
          <CardHeader>
            <CardTitle>Active Orders</CardTitle>
            <CardDescription>Your pending and active limit orders</CardDescription>
          </CardHeader>
          <CardContent>
            {activeOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No active orders</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>Pair</TableHead>
                    <TableHead>Trigger Price</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeOrders.map((order) => (
                    <TableRow key={order.id} className="border-white/10">
                      <TableCell className="font-medium">{order.pair}</TableCell>
                      <TableCell>{order.triggerPrice}</TableCell>
                      <TableCell>{order.amount}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === "Active" ? "default" : "secondary"}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">{order.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
