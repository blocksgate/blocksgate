"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, Zap } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface OpportunityCardProps {
  id: string
  sellToken: string
  buyToken: string
  profit: string
  profitPercent: number
  sources: string[]
  expiresIn: number
  estimatedGas: string
}

export function OpportunityCard({
  id,
  sellToken,
  buyToken,
  profit,
  profitPercent,
  sources,
  expiresIn,
  estimatedGas,
}: OpportunityCardProps) {
  const progressPercent = Math.max(0, Math.min(100, (expiresIn / 60) * 100))

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-accent/30 hover:border-accent/60 transition">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              {sellToken} → {buyToken}
            </CardTitle>
            <CardDescription>Arbitrage Opportunity</CardDescription>
          </div>
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
            <TrendingUp className="w-3 h-3 mr-1" />
            {profitPercent.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-green-500/5 border-green-500/30">
          <Zap className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-400">
            Potential Profit: <span className="font-bold">${profit}</span>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-card/30 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">Gas Cost</div>
            <div className="font-medium">{estimatedGas}</div>
          </div>
          <div className="bg-card/30 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">Expires In</div>
            <div className="font-medium">{expiresIn}s</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Opportunity expires in:</div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Trading Sources</div>
          <div className="flex flex-wrap gap-1">
            {sources.map((source) => (
              <Badge key={source} variant="secondary" className="text-xs font-mono">
                {source}
              </Badge>
            ))}
          </div>
        </div>

        <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
          Execute Arbitrage
        </Button>
      </CardContent>
    </Card>
  )
}
