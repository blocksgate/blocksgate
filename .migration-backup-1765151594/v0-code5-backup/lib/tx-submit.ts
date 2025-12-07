// Transaction submission flow using ethers.js
// Usage: Call submit0xQuoteTx(quote, signer) to send a 0x quote transaction
import { ethers } from 'ethers'

/**
 * Submit a 0x quote transaction using a signer
 * @param quote - 0x quote response (must include to, data, value, gas, gasPrice)
 * @param signer - ethers.js Signer instance (server-side, securely managed)
 * @returns txHash or error
 */
export async function submit0xQuoteTx(quote: any, signer: ethers.Signer): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Build transaction
    const tx = {
      to: quote.to,
      data: quote.data,
      value: ethers.BigNumber.from(quote.value || '0'),
      gasLimit: ethers.BigNumber.from(quote.gas || quote.estimatedGas || 210000),
      gasPrice: ethers.BigNumber.from(quote.gasPrice || ethers.utils.parseUnits('30', 'gwei')),
    }
    // Send transaction
    const response = await signer.sendTransaction(tx)
    await response.wait(1) // Wait for 1 confirmation
    return { success: true, txHash: response.hash }
  } catch (err: any) {
    return { success: false, error: String(err?.message ?? err) }
  }
}

/**
 * Guide: Secure signer setup
 * - Use environment variables for private key (never hardcode)
 * - Use ethers.Wallet(privateKey, provider) for server-side signing
 * - Restrict access to signing endpoints and keys
 * - Rotate keys regularly and monitor for unauthorized usage
 */
