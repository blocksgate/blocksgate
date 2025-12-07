"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useWallet } from "@/lib/wallet-context"
import { web3Provider } from "@/lib/web3-provider"
import { useTokenBalance, COMMON_TOKENS } from "@/lib/hooks/use-token-balance"
import { useTokenPrice } from "@/lib/hooks/use-token-price"
import { Loader2, ArrowDownUp, Settings, Info, CheckCircle2, XCircle } from "lucide-react"
import { ethers } from "ethers"
import { toast } from "sonner"
import { TransactionStatus } from "@/components/transaction-status"

interface SwapQuote {
  buyAmount: string
  sellAmount: string
  price: string
  guaranteedPrice: string
  to: string
  data: string
  value: string
  gas: string
  gasPrice: string
  estimatedGas: string
  sources: Array<{ name: string; proportion: string }>
}

export function EnhancedSwapInterface() {
  const { connected, address } = useWallet()
  
  // Token selection
  const [sellToken, setSellToken] = useState<keyof typeof COMMON_TOKENS>("ETH")
  const [buyToken, setBuyToken] = useState<keyof typeof COMMON_TOKENS>("USDC")
  
  // Amounts
  const [sellAmount, setSellAmount] = useState("")
  const [buyAmount, setBuyAmount] = useState("")
  
  // Quote and execution state
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txStatus, setTxStatus] = useState<"pending" | "success" | "failed" | null>(null)
  
  // Settings
  const [slippage, setSlippage] = useState("0.5")
  const [showSettings, setShowSettings] = useState(false)
  
  // Fetch balances and prices
  const { balance: sellBalance, loading: sellBalanceLoading } = useTokenBalance(sellToken)
  const { balance: buyBalance, loading: buyBalanceLoading } = useTokenBalance(buyToken)
  const { price: sellTokenPrice } = useTokenPrice(
    sellToken === "ETH" ? "ethereum" : sellToken.toLowerCase()
  )
  const { price: buyTokenPrice } = useTokenPrice(
    buyToken === "ETH" ? "ethereum" : buyToken.toLowerCase()
  )

  // Fetch quote when sell amount changes
  useEffect(() => {
    if (sellAmount && Number.parseFloat(sellAmount) > 0) {
      const debounce = setTimeout(() => {
        fetchQuote()
      }, 500)
      return () => clearTimeout(debounce)
    } else {
      setQuote(null)
      setBuyAmount("")
    }
  }, [sellAmount, sellToken, buyToken, slippage])

  const fetchQuote = async () => {
    if (!sellAmount || Number.parseFloat(sellAmount) <= 0) return

    setIsLoadingQuote(true)
    try {
      const sellTokenInfo = COMMON_TOKENS[sellToken]
      const buyTokenInfo = COMMON_TOKENS[buyToken]
      
      // Convert amount to wei/smallest unit
      const sellAmountWei = ethers.parseUnits(sellAmount, sellTokenInfo.decimals).toString()
      
      // Use native ETH address for 0x API
      const sellTokenAddress = sellToken === "ETH" 
        ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" 
        : sellTokenInfo.address
      const buyTokenAddress = buyToken === "ETH"
        ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        : buyTokenInfo.address

      const response = await fetch(
        `/api/swap/quote?chainId=1&sellToken=${sellTokenAddress}&buyToken=${buyTokenAddress}&sellAmount=${sellAmountWei}&slippagePercentage=${slippage}`,
        {
          credentials: "include", // Include cookies for authentication
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Quote fetch error:", errorData)
        
        // Fallback: Calculate estimated amount using prices if available
        if (sellTokenPrice && buyTokenPrice) {
          const estimatedBuyAmount = (Number.parseFloat(sellAmount) * sellTokenPrice) / buyTokenPrice
          setBuyAmount(estimatedBuyAmount.toFixed(6))
          console.log("[Swap] Using price-based estimate:", estimatedBuyAmount)
        }
        throw new Error(errorData.error || "Failed to fetch quote")
      }

      const data = await response.json()
      setQuote(data.quote)
      
      // Format buy amount
      const buyAmountFormatted = ethers.formatUnits(data.quote.buyAmount, buyTokenInfo.decimals)
      setBuyAmount(Number.parseFloat(buyAmountFormatted).toFixed(6))
    } catch (error) {
      console.error("[Swap] Quote error:", error)
      setQuote(null)
      setBuyAmount("")
    } finally {
      setIsLoadingQuote(false)
    }
  }

  const handleSwap = () => {
    const temp = sellToken
    setSellToken(buyToken)
    setBuyToken(temp)
    setSellAmount(buyAmount)
    setBuyAmount(sellAmount)
    setQuote(null)
  }

  const executeSwap = async () => {
    if (!quote || !connected || !address) {
      return
    }

    setIsExecuting(true)
    setTxHash(null)
    setTxStatus(null)

    try {
      // Initialize web3 if needed
      if (!web3Provider.isInitialized()) {
        await web3Provider.initialize("metamask")
      }

      // Prepare transaction
      const transaction: ethers.TransactionRequest = {
        to: quote.to,
        data: quote.data,
        value: quote.value,
        from: address,
      }

      // Send transaction
      const hash = await web3Provider.sendTransaction(transaction)
      setTxHash(hash)
      setTxStatus("pending")

      console.log("[Swap] Transaction sent:", hash)

      // Wait for confirmation
      const receipt = await web3Provider.waitForTransaction(hash)
      
      if (receipt && receipt.status === 1) {
        setTxStatus("success")
        console.log("[Swap] Transaction confirmed:", hash)
        toast.success("Swap successful!", {
          description: `Transaction confirmed: ${hash.slice(0, 8)}...${hash.slice(-6)}`,
        })
        
        // Save to database
        await saveSwapToDatabase(hash)
        
        // Reset form after successful swap
        setTimeout(() => {
          setSellAmount("")
          setBuyAmount("")
          setQuote(null)
          setTxHash(null)
          setTxStatus(null)
        }, 5000)
      } else {
        setTxStatus("failed")
        console.error("[Swap] Transaction failed")
        toast.error("Transaction failed", {
          description: "Your transaction has failed on-chain",
        })
      }
    } catch (error: any) {
      console.error("[Swap] Execution error:", error)
      setTxStatus("failed")
      toast.error("Swap failed", {
        description: error?.message || "An error occurred during swap execution",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const saveSwapToDatabase = async (txHash: string) => {
    try {
      const response = await fetch("/api/swap/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          chainId: 1,
          sellToken: COMMON_TOKENS[sellToken].address,
          buyToken: COMMON_TOKENS[buyToken].address,
          sellAmount,
          buyAmount,
          txHash,
          quote,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save swap to database")
      }
    } catch (error) {
      console.error("[Swap] Save error:", error)
      toast.error("Failed to save transaction", {
        description: "Transaction executed but couldn't be saved to history",
      })
    }
  }

  const formatBalance = (balance: string) => {
    const num = Number.parseFloat(balance)
    if (num === 0) return "0.00"
    if (num < 0.01) return "<0.01"
    return num.toFixed(6)
  }

  const priceImpact = quote && sellTokenPrice && buyTokenPrice
    ? ((Number.parseFloat(quote.price) - (sellTokenPrice / buyTokenPrice)) / (sellTokenPrice / buyTokenPrice) * 100)
    : 0

  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10 max-w-lg mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">Swap Tokens</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-400 hover:text-white"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
        {showSettings && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg">
            <label className="text-sm text-gray-400 block mb-2">Slippage Tolerance</label>
            <div className="flex gap-2">
              {["0.1", "0.5", "1.0"].map((value) => (
                <Button
                  key={value}
                  variant={slippage === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSlippage(value)}
                  className="flex-1"
                >
                  {value}%
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sell Token */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">You Sell</label>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-2xl text-white outline-none w-full font-bold"
              />
              <span className="text-white font-semibold text-lg ml-2">{sellToken}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>
                Balance: {connected ? (sellBalanceLoading ? "..." : formatBalance(sellBalance)) : "—"}
              </span>
              {sellTokenPrice && (
                <span className="text-green-400">${sellTokenPrice.toFixed(2)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwap}
            className="rounded-full bg-white/10 hover:bg-white/20"
          >
            <ArrowDownUp className="w-5 h-5" />
          </Button>
        </div>

        {/* Buy Token */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">You Buy</label>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <input
                type="number"
                value={buyAmount}
                readOnly
                placeholder="0.00"
                className="bg-transparent text-2xl text-white outline-none w-full font-bold"
              />
              <span className="text-white font-semibold text-lg ml-2">{buyToken}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>
                Balance: {connected ? (buyBalanceLoading ? "..." : formatBalance(buyBalance)) : "—"}
              </span>
              {isLoadingQuote && <Loader2 className="w-3 h-3 animate-spin" />}
            </div>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="bg-white/5 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Rate</span>
              <span className="text-white">
                1 {sellToken} = {Number.parseFloat(quote.price).toFixed(6)} {buyToken}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Price Impact</span>
              <span className={Math.abs(priceImpact) > 1 ? "text-red-400" : "text-green-400"}>
                {priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Est. Gas</span>
              <span className="text-white">
                {(Number.parseFloat(ethers.formatUnits(quote.estimatedGas, "gwei"))).toFixed(4)} Gwei
              </span>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {txHash && (
          <div className="mt-4">
            <TransactionStatus
              txHash={txHash}
              chainId={1}
              onStatusChange={(status) => {
                if (status === "confirmed") {
                  setTxStatus("success")
                } else if (status === "failed") {
                  setTxStatus("failed")
                }
              }}
            />
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={executeSwap}
          disabled={!connected || !quote || isExecuting || !sellAmount || Number.parseFloat(sellAmount) <= 0}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-12 text-lg font-semibold disabled:opacity-50"
        >
          {!connected ? "Connect Wallet" :
           isExecuting ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Swapping...</> :
           !quote ? "Enter Amount" :
           "Swap"}
        </Button>
      </CardContent>
    </Card>
  )
}

