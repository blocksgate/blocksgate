"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface Chain {
  id: number
  name: string
  icon: string
  tvl: string
  isSelected?: boolean
}

interface ChainSelectorProps {
  fromChain: number | null
  toChain: number | null
  onSelectFromChain: (chainId: number) => void
  onSelectToChain: (chainId: number) => void
}

export function ChainSelector({ fromChain, toChain, onSelectFromChain, onSelectToChain }: ChainSelectorProps) {
  const chains: Chain[] = [
    { id: 1, name: "Ethereum", icon: "⟠", tvl: "$500B" },
    { id: 10, name: "Optimism", icon: "⭕", tvl: "$2B" },
    { id: 42161, name: "Arbitrum", icon: "▲", tvl: "$3B" },
    { id: 137, name: "Polygon", icon: "■", tvl: "$1B" },
    { id: 43114, name: "Avalanche", icon: "▲", tvl: "$800M" },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Select Chains</CardTitle>
        <CardDescription>Choose your source and destination chains</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4 items-start">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">From Chain</h3>
            <div className="grid grid-cols-2 gap-2">
              {chains.map((chain) => (
                <Button
                  key={chain.id}
                  variant={fromChain === chain.id ? "default" : "outline"}
                  onClick={() => onSelectFromChain(chain.id)}
                  className={`h-auto flex-col items-start p-3 ${
                    fromChain === chain.id
                      ? "bg-gradient-to-r from-primary to-accent"
                      : "border-border hover:border-primary"
                  }`}
                >
                  <div className="text-lg">{chain.icon}</div>
                  <div className="font-medium text-sm">{chain.name}</div>
                  <div className="text-xs text-muted-foreground">{chain.tvl}</div>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center md:py-8 py-4 md:py-0">
            <div className="hidden md:block">
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="md:hidden">
              <div className="w-full h-px bg-border" />
            </div>
          </div>

          <div className="space-y-3 md:col-span-1 col-span-2 md:mt-0 -order-1 md:order-none">
            <h3 className="text-sm font-medium text-muted-foreground">To Chain</h3>
            <div className="grid grid-cols-2 gap-2">
              {chains
                .filter((c) => c.id !== fromChain)
                .map((chain) => (
                  <Button
                    key={chain.id}
                    variant={toChain === chain.id ? "default" : "outline"}
                    onClick={() => onSelectToChain(chain.id)}
                    className={`h-auto flex-col items-start p-3 ${
                      toChain === chain.id
                        ? "bg-gradient-to-r from-primary to-accent"
                        : "border-border hover:border-accent"
                    }`}
                  >
                    <div className="text-lg">{chain.icon}</div>
                    <div className="font-medium text-sm">{chain.name}</div>
                    <div className="text-xs text-muted-foreground">{chain.tvl}</div>
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
