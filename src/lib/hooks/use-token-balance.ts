/**
 * Hook for fetching and monitoring token balances
 */

import { useState, useEffect } from "react"
import { web3Provider } from "../web3-provider"
import { useWallet } from "../wallet-context"

export interface TokenBalance {
  symbol: string
  balance: string
  decimals: number
  usdValue?: number
}

const COMMON_TOKENS = {
  ETH: {
    address: "0x0000000000000000000000000000000000000000", // Native ETH
    symbol: "ETH",
    decimals: 18,
  },
  USDC: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC",
    decimals: 6,
  },
  USDT: {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    symbol: "USDT",
    decimals: 6,
  },
  DAI: {
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    symbol: "DAI",
    decimals: 18,
  },
  WBTC: {
    address: "0x2260FAC5E5542a773Aa44fBCfeB9D8C8F315B169",
    symbol: "WBTC",
    decimals: 8,
  },
}

export function useTokenBalance(tokenSymbol: keyof typeof COMMON_TOKENS) {
  const [balance, setBalance] = useState<string>("0")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { address, connected } = useWallet()

  useEffect(() => {
    if (!connected || !address) {
      setBalance("0")
      setLoading(false)
      return
    }

    const fetchBalance = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = COMMON_TOKENS[tokenSymbol]
        if (!token) {
          throw new Error(`Unknown token: ${tokenSymbol}`)
        }

        // Initialize web3 if needed
        if (!web3Provider.isInitialized()) {
          await web3Provider.initialize("metamask")
        }

        let bal: string
        if (token.address === "0x0000000000000000000000000000000000000000") {
          // Native ETH
          bal = await web3Provider.getBalance(address)
        } else {
          // ERC20 token
          bal = await web3Provider.getTokenBalance(token.address, address)
        }

        setBalance(bal)
      } catch (err) {
        console.error(`[useTokenBalance] Error fetching ${tokenSymbol}:`, err)
        setError(err instanceof Error ? err.message : "Failed to fetch balance")
        setBalance("0")
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [address, connected, tokenSymbol])

  return { balance, loading, error }
}

export function useMultipleTokenBalances(tokens: Array<keyof typeof COMMON_TOKENS>) {
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const { address, connected } = useWallet()

  useEffect(() => {
    if (!connected || !address) {
      setBalances({})
      setLoading(false)
      return
    }

    const fetchBalances = async () => {
      try {
        setLoading(true)

        if (!web3Provider.isInitialized()) {
          await web3Provider.initialize("metamask")
        }

        const balancePromises = tokens.map(async (symbol) => {
          const token = COMMON_TOKENS[symbol]
          if (!token) return { symbol, balance: "0" }

          try {
            let balance: string
            if (token.address === "0x0000000000000000000000000000000000000000") {
              balance = await web3Provider.getBalance(address)
            } else {
              balance = await web3Provider.getTokenBalance(token.address, address)
            }
            return { symbol, balance }
          } catch (error) {
            console.error(`Error fetching ${symbol}:`, error)
            return { symbol, balance: "0" }
          }
        })

        const results = await Promise.all(balancePromises)
        const balanceMap = results.reduce(
          (acc, { symbol, balance }) => {
            acc[symbol] = balance
            return acc
          },
          {} as Record<string, string>
        )

        setBalances(balanceMap)
      } catch (error) {
        console.error("[useMultipleTokenBalances] Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBalances()

    // Refresh every 30 seconds
    const interval = setInterval(fetchBalances, 30000)
    return () => clearInterval(interval)
  }, [address, connected, tokens])

  return { balances, loading }
}

export { COMMON_TOKENS }

