"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { initializeWalletConnect } from "@/lib/wallet-connect"
import { web3Provider } from "@/lib/web3-provider"

interface WalletContextType {
  address: string | null
  connected: boolean
  connect: (type: "metamask" | "walletconnect" | "demo") => Promise<void>
  disconnect: () => void
  isConnecting: boolean
  error: string | null
  isDemoMode: boolean
  setDemoMode: (demo: boolean) => void
  walletType: "metamask" | "walletconnect" | "demo"
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [walletType, setWalletType] = useState<"metamask" | "walletconnect" | "demo">("demo")

  const connect = useCallback(async (type: "metamask" | "walletconnect" | "demo") => {
    setIsConnecting(true)
    setError(null)
    try {
      if (typeof window === "undefined") {
        throw new Error("Wallet connection requires browser environment")
      }

      if (type === "walletconnect") {
        const wcProvider = initializeWalletConnect({
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        })
        await wcProvider.initialize()
        const accounts = await wcProvider.connect()

        if (accounts && accounts.length > 0) {
          setAddress(accounts[0])
          setConnected(true)
          setWalletType("walletconnect")
          setIsDemoMode(false)
          localStorage.setItem("walletAddress", accounts[0])
          localStorage.setItem("walletType", "walletconnect")
          localStorage.removeItem("demoMode")
          // Set cookie for server-side middleware access
          document.cookie = `walletAddress=${accounts[0]}; path=/; max-age=86400; SameSite=Lax`
          document.cookie = `walletType=walletconnect; path=/; max-age=86400; SameSite=Lax`
          console.log("[v0] WalletConnect connected:", accounts[0])
          
          // Initialize Web3 provider for blockchain interactions
          try {
            await web3Provider.initialize("metamask") // WalletConnect uses similar provider
            console.log("[v0] Web3 provider initialized")
          } catch (error) {
            console.error("[v0] Web3 initialization error:", error)
          }
          return
        }
      } else if (type === "metamask") {
        if (!window.ethereum) {
          throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
        }

        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })

        if (accounts && accounts.length > 0) {
          // Initialize Web3 provider for blockchain interactions
          try {
            await web3Provider.initialize("metamask")
            console.log("[v0] Web3 provider initialized")
          } catch (error) {
            console.error("[v0] Web3 initialization error:", error)
            // Don't throw - continue with connection even if Web3 init fails
          }

          setAddress(accounts[0])
          setConnected(true)
          setWalletType("metamask")
          setIsDemoMode(false)
          localStorage.setItem("walletAddress", accounts[0])
          localStorage.setItem("walletType", "metamask")
          localStorage.removeItem("demoMode")
          // Set cookie for server-side middleware access
          document.cookie = `walletAddress=${accounts[0]}; path=/; max-age=86400; SameSite=Lax`
          document.cookie = `walletType=metamask; path=/; max-age=86400; SameSite=Lax`
          console.log("[v0] MetaMask connected:", accounts[0])
          console.log("[v0] Web3 ready for blockchain interactions")
        } else {
          throw new Error("No accounts found. Please unlock MetaMask and try again.")
        }
      } else if (type === "demo") {
        // Only allow demo mode if explicitly requested
        setIsDemoMode(true)
        setAddress("0x1234567890123456789012345678901234567890")
        setConnected(true)
        setWalletType("demo")
        localStorage.setItem("walletAddress", "0x1234567890123456789012345678901234567890")
        localStorage.setItem("walletType", "demo")
        localStorage.setItem("demoMode", "true")
        // Set cookie for server-side middleware access
        document.cookie = `walletAddress=0x1234567890123456789012345678901234567890; path=/; max-age=86400; SameSite=Lax`
        document.cookie = `walletType=demo; path=/; max-age=86400; SameSite=Lax`
        console.log("[v0] Demo mode activated")
      } else {
        throw new Error("Invalid wallet type. Please use 'metamask' or 'walletconnect'.")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect wallet"
      console.error("[v0] Connection error:", errorMessage)
      setError(errorMessage)
      setConnected(false)
      setAddress(null)
      setIsDemoMode(false)
      setWalletType("demo")
      // Don't clear localStorage on error - user might want to retry
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setConnected(false)
    setIsDemoMode(false)
    setError(null)
    setWalletType("demo")
    localStorage.removeItem("walletAddress")
    localStorage.removeItem("walletType")
    localStorage.removeItem("demoMode")
    // Clear cookies
    document.cookie = "walletAddress=; path=/; max-age=0"
    document.cookie = "walletType=; path=/; max-age=0"
    console.log("[v0] Wallet disconnected")
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const attemptAutoConnect = () => {
      try {
        if (typeof window !== "undefined") {
          const savedAddress = localStorage.getItem("walletAddress")
          const wasDemoMode = localStorage.getItem("demoMode") === "true"
          const savedWalletType = localStorage.getItem("walletType")

          // Only auto-connect for real wallets (MetaMask, WalletConnect), not demo mode
          if (savedAddress && !wasDemoMode && savedWalletType && savedWalletType !== "demo") {
            setAddress(savedAddress)
            setConnected(true)
            if (savedWalletType === "walletconnect") {
              setWalletType("walletconnect")
            } else if (savedWalletType === "metamask") {
              setWalletType("metamask")
              // Re-initialize Web3 provider on auto-connect
              web3Provider.initialize("metamask").catch((error) => {
                console.error("[v0] Web3 auto-init error:", error)
              })
            }
            // Set cookies for server-side middleware access
            document.cookie = `walletAddress=${savedAddress}; path=/; max-age=86400; SameSite=Lax`
            document.cookie = `walletType=${savedWalletType}; path=/; max-age=86400; SameSite=Lax`
            console.log("[v0] Auto-connected wallet:", savedAddress, "Type:", savedWalletType)
          } else if (wasDemoMode) {
            // Clear demo mode on page load - user must explicitly choose demo mode
            localStorage.removeItem("walletAddress")
            localStorage.removeItem("demoMode")
            localStorage.removeItem("walletType")
            document.cookie = "walletAddress=; path=/; max-age=0"
            document.cookie = "walletType=; path=/; max-age=0"
            console.log("[v0] Cleared demo mode - please reconnect")
          }
        }
      } catch (err) {
        // Silently ignore auto-connect errors
      }
    }

    attemptAutoConnect()
  }, [isMounted])

  return (
    <WalletContext.Provider
      value={{
        address,
        connected,
        connect,
        disconnect,
        isConnecting,
        error,
        isDemoMode,
        setDemoMode: setIsDemoMode,
        walletType,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider")
  }
  return context
}
