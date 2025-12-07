// Advanced swap method selector (Permit2 vs AllowanceHolder)

import { zxClient } from "@/lib/0x-client"
import { ethers } from "ethers"

export type SwapMethod = "permit2" | "allowance-holder" | "gasless"

export interface MethodComparison {
  method: SwapMethod
  gasEstimate: string
  gasCostUSD: string
  advantages: string[]
  disadvantages: string[]
  recommended: boolean
}

export interface TokenApprovalStatus {
  hasApproval: boolean
  approvalAmount: string
  needsApproval: boolean
  method: SwapMethod
}

export class SwapMethodSelector {
  /**
   * Compare swap methods and recommend the best one
   */
  async compareMethods(
    chainId: number,
    sellToken: string,
    buyToken: string,
    sellAmount: string,
    userAddress: string
  ): Promise<MethodComparison[]> {
    const comparisons: MethodComparison[] = []

    try {
      // Get Permit2 quote
      const permit2Quote = await zxClient.getQuote(
        chainId,
        sellToken,
        buyToken,
        sellAmount,
        0.5,
        "permit2"
      ).catch(() => null)

      if (permit2Quote) {
        const gasEstimate = permit2Quote.gas?.toString() || "0"
        const gasCostUSD = this.estimateGasCostUSD(gasEstimate, chainId)
        
        comparisons.push({
          method: "permit2",
          gasEstimate,
          gasCostUSD,
          advantages: [
            "No separate approval transaction needed",
            "Gas efficient",
            "Supports EIP-2612 permit",
          ],
          disadvantages: [
            "Requires token to support Permit2",
            "More complex signature",
          ],
          recommended: true,
        })
      }

      // Get AllowanceHolder quote
      const allowanceHolderQuote = await zxClient.getQuote(
        chainId,
        sellToken,
        buyToken,
        sellAmount,
        0.5,
        "allowance-holder"
      ).catch(() => null)

      if (allowanceHolderQuote) {
        const gasEstimate = allowanceHolderQuote.gas?.toString() || "0"
        const gasCostUSD = this.estimateGasCostUSD(gasEstimate, chainId)
        
        comparisons.push({
          method: "allowance-holder",
          gasEstimate,
          gasCostUSD,
          advantages: [
            "Works with all tokens",
            "Simple approval mechanism",
            "Widely supported",
          ],
          disadvantages: [
            "Requires separate approval transaction",
            "Higher gas costs",
          ],
          recommended: !permit2Quote, // Recommended if Permit2 is not available
        })
      }

      // Check if gasless is available
      const gaslessAvailable = await this.checkGaslessAvailability(
        chainId,
        sellToken,
        userAddress
      )

      if (gaslessAvailable) {
        comparisons.push({
          method: "gasless",
          gasEstimate: "0",
          gasCostUSD: "0",
          advantages: [
            "Zero gas fees",
            "User doesn't pay for gas",
            "Better UX",
          ],
          disadvantages: [
            "Limited token support",
            "May have higher fees",
            "Requires relayer",
          ],
          recommended: false, // Not always recommended due to limitations
        })
      }

      // Sort by recommended first, then by gas cost
      comparisons.sort((a, b) => {
        if (a.recommended && !b.recommended) return -1
        if (!a.recommended && b.recommended) return 1
        return Number.parseFloat(a.gasCostUSD) - Number.parseFloat(b.gasCostUSD)
      })

      return comparisons
    } catch (error) {
      console.error("[SwapMethodSelector] Error comparing methods:", error)
      return comparisons
    }
  }

  /**
   * Get recommended swap method
   */
  async getRecommendedMethod(
    chainId: number,
    sellToken: string,
    buyToken: string,
    sellAmount: string,
    userAddress: string
  ): Promise<SwapMethod> {
    const comparisons = await this.compareMethods(
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      userAddress
    )

    const recommended = comparisons.find((c) => c.recommended)
    return recommended?.method || "allowance-holder"
  }

  /**
   * Check token approval status
   */
  async checkApprovalStatus(
    chainId: number,
    token: string,
    userAddress: string,
    spender: string
  ): Promise<TokenApprovalStatus> {
    try {
      // In production, you would check the token contract's allowance
      // For now, return a mock status
      return {
        hasApproval: false,
        approvalAmount: "0",
        needsApproval: true,
        method: "allowance-holder",
      }
    } catch (error) {
      console.error("[SwapMethodSelector] Error checking approval:", error)
      return {
        hasApproval: false,
        approvalAmount: "0",
        needsApproval: true,
        method: "allowance-holder",
      }
    }
  }

  /**
   * Estimate gas cost in USD
   */
  private estimateGasCostUSD(gasEstimate: string, chainId: number): string {
    // Simplified gas cost estimation
    // In production, you would fetch current gas prices and ETH/USD price
    const gasPrice = 30 // Gwei (example)
    const ethPrice = 2500 // USD (example)
    const gasCostETH = (Number.parseFloat(gasEstimate) * gasPrice) / 1e9
    const gasCostUSD = gasCostETH * ethPrice
    return gasCostUSD.toFixed(2)
  }

  /**
   * Check if gasless swaps are available for a token
   */
  private async checkGaslessAvailability(
    chainId: number,
    token: string,
    userAddress: string
  ): Promise<boolean> {
    try {
      // In production, you would check 0x's gasless token list
      // For now, return false
      return false
    } catch (error) {
      return false
    }
  }
}

export const swapMethodSelector = new SwapMethodSelector()

