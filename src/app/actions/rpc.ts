// Server Action: RPC Provider Operations (SECURE SERVER-SIDE)

"use server"

import { getRpcProvider } from "@/lib/rpc-provider"

export async function checkRpcHealth() {
  try {
    const rpc = getRpcProvider()
    const blockNumber = await rpc.getBlockNumber()
    const status = rpc.getHealthStatus()

    return {
      success: true,
      blockNumber,
      health: status,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    }
  }
}

export async function estimateSwapGas(txData: { from?: string; to?: string; value?: string; data?: string }) {
  try {
    const rpc = getRpcProvider()
    const gas = await rpc.estimateGas(txData)
    return {
      success: true,
      gas,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    }
  }
}

export async function getBalance(address: string) {
  try {
    const rpc = getRpcProvider()
    const balance = await rpc.getBalance(address)
    return {
      success: true,
      balance,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    }
  }
}
