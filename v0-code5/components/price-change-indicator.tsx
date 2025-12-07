"use client"

import { useTokenPrice } from "@/hooks/use-token-price"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PriceChangeIndicatorProps {
  tokenId: string
  className?: string
}

export function PriceChangeIndicator({ tokenId, className }: PriceChangeIndicatorProps) {
  const { data, loading } = useTokenPrice(tokenId)

  if (loading || !data) {
    return <span className="text-sm text-muted-foreground">--</span>
  }

  const isPositive = data.priceChange24h > 0

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {isPositive ? (
        <TrendingUp className="w-4 h-4 text-green-600" />
      ) : (
        <TrendingDown className="w-4 h-4 text-red-600" />
      )}
      <span className={cn("text-sm font-semibold", isPositive ? "text-green-600" : "text-red-600")}>
        {Math.abs(data.priceChange24h).toFixed(2)}%
      </span>
    </div>
  )
}
