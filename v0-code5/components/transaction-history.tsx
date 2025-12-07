"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, RefreshCw, Download } from "lucide-react"
import { toast } from "sonner"

interface Transaction {
  txHash: string
  status: "pending" | "confirmed" | "failed"
  blockNumber?: number
  confirmations: number
  gasCost?: string
  timestamp: number
  chainId: number
  type?: string
  tokenIn?: string
  tokenOut?: string
  amountIn?: string
  amountOut?: string
}

interface TransactionHistoryProps {
  limit?: number
  chainId?: number
  showExport?: boolean
}

export function TransactionHistory({ limit = 20, chainId, showExport = true }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTransactions = async () => {
    try {
      setRefreshing(true)
      // Fetch from trades API which includes transaction hashes
      const response = await fetch(`/api/trades?limit=${limit}${chainId ? `&chain_id=${chainId}` : ""}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch transactions")
      }

      const data = await response.json()
      
      // Transform trades to transaction format
      const txList: Transaction[] = (data.trades || []).map((trade: any) => ({
        txHash: trade.tx_hash || trade.txHash || "",
        status: trade.status === "completed" ? "confirmed" : trade.status === "failed" ? "failed" : "pending",
        blockNumber: trade.block_number,
        confirmations: 0, // Will be fetched separately
        gasCost: trade.gas_cost || trade.gasCost,
        timestamp: new Date(trade.created_at || trade.timestamp).getTime(),
        chainId: trade.chain_id || chainId || 1,
        type: trade.trade_type || "swap",
        tokenIn: trade.token_in,
        tokenOut: trade.token_out,
        amountIn: trade.amount_in,
        amountOut: trade.amount_out,
      }))

      setTransactions(txList)
    } catch (error) {
      console.error("[TransactionHistory] Error fetching transactions:", error)
      toast.error("Failed to load transaction history")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTransactions, 30000)
    return () => clearInterval(interval)
  }, [limit, chainId])

  const getExplorerUrl = (hash: string, chain: number) => {
    const explorers: Record<number, string> = {
      1: `https://etherscan.io/tx/${hash}`,
      10: `https://optimistic.etherscan.io/tx/${hash}`,
      42161: `https://arbiscan.io/tx/${hash}`,
      137: `https://polygonscan.com/tx/${hash}`,
      43114: `https://snowtrace.io/tx/${hash}`,
      8453: `https://basescan.org/tx/${hash}`,
    }
    return explorers[chain] || `https://etherscan.io/tx/${hash}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Confirmed</Badge>
      case "failed":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const exportToCSV = () => {
    const csv = [
      ["Tx Hash", "Status", "Block", "Gas Cost", "Type", "Timestamp"].join(","),
      ...transactions.map((tx) =>
        [
          tx.txHash,
          tx.status,
          tx.blockNumber || "",
          tx.gasCost || "",
          tx.type || "",
          new Date(tx.timestamp).toISOString(),
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Transaction history exported")
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <div className="flex gap-2">
            {showExport && (
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No transactions found</p>
            <p className="text-sm mt-2">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hash</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead>Gas Cost</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.txHash}>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.type || "swap"}</Badge>
                    </TableCell>
                    <TableCell>
                      {tx.blockNumber ? tx.blockNumber.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      {tx.gasCost ? `${Number.parseFloat(tx.gasCost).toFixed(6)} ETH` : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getExplorerUrl(tx.txHash, tx.chainId), "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

