/**
 * Wallet-based authentication helper for API routes
 * Allows wallet-only users to access API endpoints without Supabase session
 */

import { type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export interface AuthenticatedRequest {
  userId: string | null
  walletAddress: string | null
  isWalletOnly: boolean
  supabaseUser: any
}

/**
 * Authenticates a request using either Supabase session or wallet address
 * Returns authentication details or null if unauthorized
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedRequest | null> {
  // Try Supabase authentication first
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // User has Supabase session
    return {
      userId: user.id,
      walletAddress: user.user_metadata?.wallet_address || null,
      isWalletOnly: false,
      supabaseUser: user,
    }
  }

  // Check for wallet-only authentication via cookie
  const walletAddress = request.cookies.get("walletAddress")?.value
  const walletType = request.cookies.get("walletType")?.value

  if (walletAddress && walletType && walletType !== "demo") {
    // Valid wallet authentication (not demo mode)
    return {
      userId: null, // No Supabase user ID
      walletAddress,
      isWalletOnly: true,
      supabaseUser: null,
    }
  }

  // No valid authentication
  return null
}

/**
 * Gets or creates a user ID for wallet-only users
 * Uses wallet address as a unique identifier
 */
export function getWalletUserId(walletAddress: string): string {
  // Create a consistent user ID from wallet address
  // This allows us to track wallet-only users without Supabase accounts
  return `wallet_${walletAddress.toLowerCase()}`
}

