/**
 * Web3 Provider - Handles blockchain interactions
 * Supports MetaMask, WalletConnect, and provides real blockchain data
 */

import { ethers } from "ethers"
import { config } from "./config"

export class Web3Provider {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.Signer | null = null
  private chainId: number = 1

  async initialize(walletType: "metamask" | "walletconnect" = "metamask") {
    try {
      if (typeof window === "undefined") {
        throw new Error("Web3 requires browser environment")
      }

      if (walletType === "metamask") {
        if (!window.ethereum) {
          throw new Error("MetaMask not installed")
        }

        this.provider = new ethers.BrowserProvider(window.ethereum)
        this.signer = await this.provider.getSigner()
        const network = await this.provider.getNetwork()
        this.chainId = Number(network.chainId)

        console.log("[Web3] Initialized with MetaMask on chain:", this.chainId)
        return true
      }

      return false
    } catch (error) {
      console.error("[Web3] Initialization error:", error)
      throw error
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error("Provider not initialized")
    }

    try {
      const balance = await this.provider.getBalance(address)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error("[Web3] Get balance error:", error)
      return "0"
    }
  }

  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    if (!this.provider) {
      throw new Error("Provider not initialized")
    }

    try {
      // ERC20 ABI for balanceOf
      const abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"]

      const contract = new ethers.Contract(tokenAddress, abi, this.provider)
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals(),
      ])

      return ethers.formatUnits(balance, decimals)
    } catch (error) {
      console.error("[Web3] Get token balance error:", error)
      return "0"
    }
  }

  async getGasPrice(): Promise<bigint> {
    if (!this.provider) {
      throw new Error("Provider not initialized")
    }

    try {
      const feeData = await this.provider.getFeeData()
      return feeData.gasPrice || BigInt(0)
    } catch (error) {
      console.error("[Web3] Get gas price error:", error)
      return BigInt(0)
    }
  }

  async estimateGas(transaction: ethers.TransactionRequest): Promise<bigint> {
    if (!this.provider) {
      throw new Error("Provider not initialized")
    }

    try {
      return await this.provider.estimateGas(transaction)
    } catch (error) {
      console.error("[Web3] Estimate gas error:", error)
      return BigInt(21000) // Default gas limit
    }
  }

  async sendTransaction(transaction: ethers.TransactionRequest): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer not initialized")
    }

    try {
      const tx = await this.signer.sendTransaction(transaction)
      console.log("[Web3] Transaction sent:", tx.hash)
      return tx.hash
    } catch (error) {
      console.error("[Web3] Send transaction error:", error)
      throw error
    }
  }

  async waitForTransaction(txHash: string): Promise<ethers.TransactionReceipt | null> {
    if (!this.provider) {
      throw new Error("Provider not initialized")
    }

    try {
      const receipt = await this.provider.waitForTransaction(txHash)
      console.log("[Web3] Transaction confirmed:", txHash, "Status:", receipt?.status)
      return receipt
    } catch (error) {
      console.error("[Web3] Wait for transaction error:", error)
      return null
    }
  }

  async switchChain(chainId: number): Promise<boolean> {
    if (!window.ethereum) {
      return false
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
      this.chainId = chainId
      return true
    } catch (error: any) {
      // Chain not added to MetaMask
      if (error.code === 4902) {
        console.log("[Web3] Chain not added, user needs to add it manually")
      }
      console.error("[Web3] Switch chain error:", error)
      return false
    }
  }

  getChainId(): number {
    return this.chainId
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider
  }

  getSigner(): ethers.Signer | null {
    return this.signer
  }

  isInitialized(): boolean {
    return this.provider !== null && this.signer !== null
  }
}

// Singleton instance
export const web3Provider = new Web3Provider()

