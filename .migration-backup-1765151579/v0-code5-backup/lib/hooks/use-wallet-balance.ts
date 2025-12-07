/**
 * Simplified hook for wallet balance without Web3 dependency
 * Falls back to mock data if Web3 is not available
 */

import { useState, useEffect } from "react"
import { useWallet } from "../wallet-context"

export function useWalletBalance() {
  const [ethBalance, setEthBalance] = useState("0")
  const [loading, setLoading] = useState(true)
  const { address, connected } = useWallet()

  useEffect(() => {
    if (!connected || !address) {
      setEthBalance("0")
      setLoading(false)
      return
    }

    const fetchBalance = async () => {
      try {
        setLoading(true)
        
        // Try to get balance from Web3 provider first
        try {
          const { web3Provider } = await import("@/lib/web3-provider")
          if (web3Provider.isInitialized()) {
            const balance = await web3Provider.getBalance(address)
            setEthBalance(Number.parseFloat(balance).toFixed(6))
            return
          }
        } catch (web3Error) {
          console.log("[Balance] Web3 provider not initialized, trying direct ethereum request")
        }
        
        // Fallback to direct ethereum request
        if (typeof window !== "undefined" && window.ethereum) {
          try {
            const balance = await window.ethereum.request({
              method: "eth_getBalance",
              params: [address, "latest"],
            })
            
            // Convert from hex wei to ETH
            const balanceInWei = BigInt(balance)
            const balanceInEth = Number(balanceInWei) / 1e18
            setEthBalance(balanceInEth.toFixed(6))
          } catch (error) {
            console.error("[Balance] Direct ethereum request error:", error)
            // Try to initialize Web3 provider and retry
            try {
              const { web3Provider } = await import("@/lib/web3-provider")
              await web3Provider.initialize("metamask")
              const balance = await web3Provider.getBalance(address)
              setEthBalance(Number.parseFloat(balance).toFixed(6))
            } catch (initError) {
              console.error("[Balance] Web3 initialization error:", initError)
              setEthBalance("0.00")
            }
          }
        } else {
          // No Web3 provider available
          setEthBalance("0.00")
        }
      } catch (error) {
        console.error("[Balance] Error:", error)
        setEthBalance("0.00")
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()

    // Refresh every 30 seconds
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [address, connected])

  return { balance: ethBalance, loading }
}

