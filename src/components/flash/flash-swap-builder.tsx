"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code2, AlertTriangle, Copy, ZapIcon } from "lucide-react"
import { calculateFlashLoanProfit } from "@/lib/mev-analyzer"

export function FlashSwapBuilder() {
  const [flashToken, setFlashToken] = useState("0x6b175474e89094c44da98b954eedeac495271d0f")
  const [buyToken, setBuyToken] = useState("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
  const [flashAmount, setFlashAmount] = useState("1000000")
  const [arbSpread, setArbSpread] = useState(0.75)
  const [strategy, setStrategy] = useState<"arbitrage" | "liquidation" | "custom">("arbitrage")
  const [code, setCode] = useState(
    `
// Flash Loan Callback
function executeOperation(
  asset: address,
  amount: uint256,
  premium: uint256,
  initiator: address,
  params: bytes
) external override returns (bytes32) {
  // Your arbitrage logic here
  uint256 amountOwed = amount + premium;
  
  // Profit calculation and execution
  // ...
  
  return keccak256("ERC3156FlashBorrower.onFlashLoan");
}
  `.trim(),
  )
  const [copied, setCopied] = useState(false)

  const strategy_data = calculateFlashLoanProfit(flashAmount, arbSpread)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ZapIcon className="w-5 h-5 text-cyan-400" />
            <div>
              <CardTitle>Flash Loan Aggregator</CardTitle>
              <CardDescription>
                Create and simulate flash loan arbitrage with multi-provider aggregation
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            <ZapIcon className="w-3 h-3 mr-1" />
            Multi-Provider Ready
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="configure" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
            <TabsTrigger value="configure">Configure</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-4 mt-4">
            <Alert className="bg-cyan-500/10 border-cyan-500/30">
              <AlertTriangle className="h-4 w-4 text-cyan-400" />
              <AlertDescription className="text-cyan-300">
                Sourcing from multiple providers: Aave, dYdX, Uniswap V3, Balancer for best rates and availability.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">Strategy Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(["arbitrage", "liquidation", "custom"] as const).map((strat) => (
                  <button
                    key={strat}
                    onClick={() => setStrategy(strat)}
                    className={`p-3 rounded-lg border transition text-sm font-medium ${
                      strategy === strat
                        ? "bg-purple-500/20 border-purple-500 text-purple-200"
                        : "bg-white/5 border-white/10 text-white hover:border-white/20"
                    }`}
                  >
                    {strat.charAt(0).toUpperCase() + strat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Flash Token</label>
              <Input
                value={flashToken}
                onChange={(e) => setFlashToken(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-mono text-xs"
                placeholder="0x..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Flash Amount</label>
              <Input
                type="number"
                value={flashAmount}
                onChange={(e) => setFlashAmount(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                placeholder="1000000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Arbitrage Spread (%)</label>
              <Input
                type="number"
                step="0.1"
                value={arbSpread}
                onChange={(e) => setArbSpread(Number(e.target.value))}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                placeholder="0.75"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/10 rounded-lg p-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Flash Fee</div>
                <div className="font-semibold text-cyan-300">${strategy_data.estimatedFee}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Est. Net Profit</div>
                <div
                  className={`font-semibold ${Number.parseFloat(strategy_data.estimatedProfit) > 0 ? "text-green-400" : "text-red-400"}`}
                >
                  ${strategy_data.estimatedProfit}
                </div>
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0">
              Validate & Deploy
            </Button>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 mt-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-gray-400">Flash Amount</div>
                  <div className="font-semibold text-lg text-white">{flashAmount} DAI</div>
                </div>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">DAI</Badge>
              </div>

              <div className="h-px bg-white/10" />

              <div className="space-y-2">
                <div className="text-sm font-medium">Execution Flow</div>
                <div className="space-y-1 text-sm">
                  {strategy_data.executionPath.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span className="text-gray-300">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-gray-400">Fee Rate</div>
                  <div className="font-semibold text-white">0.05%</div>
                </div>
                <div>
                  <div className="text-gray-400">Gas Est.</div>
                  <div className="font-semibold text-white">{strategy_data.gasEstimate}</div>
                </div>
                <div>
                  <div className="text-gray-400">Risk Score</div>
                  <div
                    className={`font-semibold ${strategy_data.riskScore > 70 ? "text-red-400" : strategy_data.riskScore > 45 ? "text-yellow-400" : "text-green-400"}`}
                  >
                    {strategy_data.riskScore}%
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code" className="space-y-4 mt-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium flex items-center gap-2 text-white">
                  <Code2 className="w-4 h-4" />
                  Smart Contract
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="border-white/10 text-white hover:bg-white/10 bg-transparent"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre className="text-xs overflow-x-auto bg-black/20 rounded p-3 text-gray-400">
                <code>{code}</code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
