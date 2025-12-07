"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Clock, Zap, DollarSign } from "lucide-react"

interface Bridge {
  name: string
  fee: number
  estimatedTime: number
  liquidity: string
  routeCount: number
}

interface BridgeSelectorProps {
  selectedBridge: string
  onSelectBridge: (bridge: string) => void
}

export function BridgeSelector({ selectedBridge, onSelectBridge }: BridgeSelectorProps) {
  const bridges: Bridge[] = [
    {
      name: "Stargate Finance",
      fee: 0.05,
      estimatedTime: 20,
      liquidity: "$500M+",
      routeCount: 5,
    },
    {
      name: "Across Protocol",
      fee: 0.03,
      estimatedTime: 15,
      liquidity: "$200M+",
      routeCount: 4,
    },
    {
      name: "Axelar",
      fee: 0.02,
      estimatedTime: 30,
      liquidity: "$100M+",
      routeCount: 6,
    },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Select Bridge</CardTitle>
        <CardDescription>Choose the best bridge for your cross-chain swap</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={selectedBridge} onValueChange={onSelectBridge}>
          {bridges.map((bridge) => (
            <div
              key={bridge.name}
              className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition"
            >
              <RadioGroupItem value={bridge.name} id={bridge.name} className="mt-1" />
              <label htmlFor={bridge.name} className="flex-1 cursor-pointer space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{bridge.name}</div>
                  {bridge.fee === Math.min(...bridges.map((b) => b.fee)) && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                      Lowest Fee
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <div>
                      <div className="text-xs text-muted-foreground">Fee</div>
                      <div className="font-medium">{bridge.fee}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Time</div>
                      <div className="font-medium">{bridge.estimatedTime}m</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-secondary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Liquidity</div>
                      <div className="font-medium">{bridge.liquidity}</div>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}
