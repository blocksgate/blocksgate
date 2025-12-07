"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Zap, CheckCircle2 } from "lucide-react"
import { getGaslessSwapQuoteAction, getGaslessApprovalTokensAction } from "@/app/actions/gasless"

interface GaslessSwapProps {
  userAddress: string
  chainId: number
}

export function GaslessSwap({ userAddress, chainId }: GaslessSwapProps) {
  const [sellToken, setSellToken] = useState("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
  const [buyToken, setBuyToken] = useState("0x6b175474e89094c44da98b954eedeac495271d0f")
  const [sellAmount, setSellAmount] = useState("1")
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [supportedTokens, setSupportedTokens] = useState<string[]>([])

  const handleGetQuote = async () => {
    setLoading(true)
    try {
      const result = await getGaslessSwapQuoteAction(
        chainId,
        sellToken,
        buyToken,
        (Number.parseFloat(sellAmount) * 10 ** 18).toString(),
        userAddress,
      )
      setQuote(result)
      setStatus("success")
    } catch (error) {
      console.error("Error getting gasless quote:", error)
      setStatus("error")
    } finally {
      setLoading(false)
    }
  }

  const handleCheckGaslessTokens = async () => {
    try {
      const tokens = await getGaslessApprovalTokensAction(chainId)
      setSupportedTokens(tokens)
    } catch (error) {
      console.error("Error fetching gasless tokens:", error)
    }
  }

  return (
    <Card className="w-full bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          <div>
            <CardTitle>Gasless Swap</CardTitle>
            <CardDescription>Trade without paying gas fees using meta-transactions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-cyan-500/10 border-cyan-500/30">
          <AlertDescription className="text-cyan-200">
            Save on gas fees with meta-transactions. Pay zero gas - the 0x network covers it!
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label className="text-sm font-medium">Sell Amount (WETH)</label>
          <Input
            type="number"
            value={sellAmount}
            onChange={(e) => setSellAmount(e.target.value)}
            placeholder="Enter amount"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400">From</label>
            <Badge className="w-full justify-center mt-1 bg-purple-500/20 text-purple-200">WETH</Badge>
          </div>
          <div>
            <label className="text-xs text-gray-400">To</label>
            <Badge className="w-full justify-center mt-1 bg-pink-500/20 text-pink-200">DAI</Badge>
          </div>
        </div>

        {quote && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Receive:</span>
              <span className="font-medium text-cyan-300">{quote.buyAmount} DAI</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Gas Savings:</span>
              <span className="font-medium text-green-400">Save $50-200</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Network Fee:</span>
              <span className="font-medium text-cyan-300">Covered</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleGetQuote}
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 rounded-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting Gasless Quote...
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Execute Gasless Swap
            </>
          ) : (
            "Get Gasless Quote"
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleCheckGaslessTokens}
          className="w-full border-white/10 text-white hover:bg-white/5 bg-transparent"
        >
          Check Supported Tokens
        </Button>
      </CardContent>
    </Card>
  )
}
