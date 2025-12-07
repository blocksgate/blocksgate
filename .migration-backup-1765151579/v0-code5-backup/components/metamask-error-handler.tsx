"use client"

import { useEffect } from "react"

/**
 * Suppresses MetaMask RPC errors for methods that don't exist
 * These errors come from MetaMask's internal code and don't affect functionality
 */
export function MetaMaskErrorHandler() {
  useEffect(() => {
    // Suppress console errors from MetaMask for non-existent methods
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn
    const originalConsoleLog = console.log
    
    // List of MetaMask error patterns to suppress
    const suppressPatterns = [
      "isDefaultWallet",
      "getEnabledChains",
      "does not exist / is not available",
      "ethereum.send",
      "MetaMask - RPC Error",
      "deprecated and may be removed"
    ]
    
    const shouldSuppress = (message: any): boolean => {
      const messageStr = String(message?.message || message || "")
      return suppressPatterns.some(pattern => messageStr.includes(pattern))
    }
    
    console.error = (...args: any[]) => {
      if (shouldSuppress(args[0])) {
        return // Suppress these errors
      }
      originalConsoleError.apply(console, args)
    }

    console.warn = (...args: any[]) => {
      if (shouldSuppress(args[0])) {
        return // Suppress these warnings
      }
      originalConsoleWarn.apply(console, args)
    }

    console.log = (...args: any[]) => {
      // Also suppress MetaMask logs
      if (shouldSuppress(args[0])) {
        return
      }
      originalConsoleLog.apply(console, args)
    }

    // Handle unhandled promise rejections from MetaMask
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (shouldSuppress(event.reason)) {
        event.preventDefault() // Suppress the error
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
      console.log = originalConsoleLog
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  return null
}

