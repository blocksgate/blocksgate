"use client"

import { useTokenPrices } from "@/hooks/use-token-prices"
import { cn } from "@/lib/utils"

interface PriceTickerProps {
  tokens: string[]
  className?: string
}

export function PriceTicker({ tokens, className }: PriceTickerProps) {
  const { prices, loading } = useTokenPrices(tokens)

  if (loading) {
    return <div className={cn("text-sm text-muted-foreground", className)}>Loading prices...</div>
  }

  return (
    <div className={cn("flex gap-6", className)}>
      {tokens.map((token) => (
        <div key={token} className="text-sm">
          <p className="text-muted-foreground capitalize">{token}</p>
          <p className="text-lg font-semibold">
            ${prices[token]?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || "0"}
          </p>
        </div>
      ))}
    </div>
  )
}
