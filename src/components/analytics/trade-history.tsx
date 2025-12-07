"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, Download, Filter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Trade {
  id: string
  type: "swap" | "gasless" | "limit"
  from: { symbol: string; amount: string }
  to: { symbol: string; amount: string }
  price: string
  executedAt: string
  status: "completed" | "pending" | "failed"
  gasUsed?: string
  profit?: string
}

interface TradeHistoryProps {
  onExport?: () => void
}

export function TradeHistory({ onExport }: TradeHistoryProps) {
  const [trades] = useState<Trade[]>([
    {
      id: "1",
      type: "swap",
      from: { symbol: "WETH", amount: "5.0" },
      to: { symbol: "DAI", amount: "12500" },
      price: "$2500",
      executedAt: "2024-01-15 14:32:10",
      status: "completed",
      gasUsed: "0.012 ETH",
      profit: "+$125",
    },
    {
      id: "2",
      type: "gasless",
      from: { symbol: "USDC", amount: "10000" },
      to: { symbol: "WETH", amount: "4.2" },
      price: "$2380",
      executedAt: "2024-01-15 13:15:22",
      status: "completed",
      gasUsed: "$0",
      profit: "+$50",
    },
    {
      id: "3",
      type: "limit",
      from: { symbol: "DAI", amount: "5000" },
      to: { symbol: "WETH", amount: "2.1" },
      price: "$2380",
      executedAt: "2024-01-15 12:08:45",
      status: "completed",
      gasUsed: "0.008 ETH",
      profit: "-$10",
    },
  ])

  const getStatusColor = (status: Trade["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/20"
    }
  }

  const getTypeColor = (type: Trade["type"]) => {
    switch (type) {
      case "swap":
        return "bg-primary/10 text-primary border-primary/20"
      case "gasless":
        return "bg-accent/10 text-accent border-accent/20"
      case "limit":
        return "bg-secondary/10 text-secondary border-secondary/20"
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Trade History</CardTitle>
            <CardDescription>All your completed trades and transactions</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>All Types</DropdownMenuItem>
                <DropdownMenuItem>Swaps Only</DropdownMenuItem>
                <DropdownMenuItem>Gasless Only</DropdownMenuItem>
                <DropdownMenuItem>Limit Orders</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Gas Cost</TableHead>
                <TableHead>Profit/Loss</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id} className="border-border hover:bg-muted/30">
                  <TableCell>
                    <Badge className={`font-mono text-xs ${getTypeColor(trade.type)}`}>
                      {trade.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{trade.from.amount}</span>
                    <span className="text-muted-foreground ml-1">{trade.from.symbol}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{trade.to.amount}</span>
                    <span className="text-muted-foreground ml-1">{trade.to.symbol}</span>
                  </TableCell>
                  <TableCell className="text-right">{trade.price}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{trade.gasUsed}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${trade.profit?.includes("-") ? "text-red-400" : "text-green-400"}`}
                  >
                    {trade.profit}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(trade.status)} border`}>{trade.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{trade.executedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
