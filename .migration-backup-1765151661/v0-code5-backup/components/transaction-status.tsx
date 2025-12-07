"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface TransactionStatusProps {
  txHash: string
  chainId?: number
  onStatusChange?: (status: string) => void
}

interface TransactionData {
  txHash: string
  status: "pending" | "confirmed" | "failed" | "not_found"
  blockNumber?: number
  confirmations: number
  gasUsed?: string
  gasCost?: string
  gasCostFormatted?: string
  chainId: number
  error?: string
}

export function TransactionStatus({ txHash, chainId = 1, onStatusChange }: TransactionStatusProps) {
  const [transaction, setTransaction] = useState<TransactionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(true)

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

  const fetchTransactionStatus = async () => {
    try {
      const response = await fetch(`/api/transactions/${txHash}?chainId=${chainId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch transaction status")
      }

      const data = await response.json()
      setTransaction(data)

      // Call status change callback
      if (onStatusChange && data.status) {
        onStatusChange(data.status)
      }

      // Show toast notifications for status changes
      if (data.status === "confirmed") {
        toast.success("Transaction confirmed!", {
          description: `Transaction has been confirmed with ${data.confirmations} confirmations`,
        })
        setPolling(false) // Stop polling when confirmed
      } else if (data.status === "failed") {
        toast.error("Transaction failed", {
          description: "Your transaction has failed on-chain",
        })
        setPolling(false) // Stop polling when failed
      }
    } catch (error) {
      console.error("[TransactionStatus] Error fetching status:", error)
      toast.error("Failed to fetch transaction status")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactionStatus()

    // Poll for status updates if pending
    if (polling) {
      const interval = setInterval(() => {
        fetchTransactionStatus()
      }, 5000) // Poll every 5 seconds

      return () => clearInterval(interval)
    }
  }, [txHash, chainId, polling])

  // Stop polling if transaction is confirmed or failed
  useEffect(() => {
    if (transaction?.status === "confirmed" || transaction?.status === "failed") {
      setPolling(false)
    }
  }, [transaction?.status])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  if (!transaction) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Transaction not found</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = () => {
    switch (transaction.status) {
      case "confirmed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = () => {
    switch (transaction.status) {
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

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-semibold">Transaction Status</span>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hash:</span>
            <span className="font-mono text-xs break-all">{transaction.txHash}</span>
          </div>

          {transaction.blockNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Block:</span>
              <span className="font-mono">{transaction.blockNumber.toLocaleString()}</span>
            </div>
          )}

          {transaction.confirmations >= 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confirmations:</span>
              <span>{transaction.confirmations}</span>
            </div>
          )}

          {transaction.gasCostFormatted && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gas Cost:</span>
              <span>{Number.parseFloat(transaction.gasCostFormatted).toFixed(6)} ETH</span>
            </div>
          )}

          {transaction.gasUsed && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gas Used:</span>
              <span>{Number.parseInt(transaction.gasUsed).toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getExplorerUrl(transaction.txHash, transaction.chainId), "_blank")}
            className="flex-1"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Explorer
          </Button>
          {transaction.status === "pending" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTransactionStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>

        {transaction.error && (
          <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/20">
            <p className="text-sm text-destructive">{transaction.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

