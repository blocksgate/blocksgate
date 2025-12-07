// Configuration management for API keys and endpoints

export const config = {
  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },

  // 0x Protocol (server-side only)
  zxProtocol: {
    apiKey: process.env.ZX_API_KEY || "",
    baseUrl: "https://api.0x.org",
  },
  chainId: 1, // Default to Ethereum mainnet

  // RPC Providers
  rpc: {
    alchemy: process.env.ALCHEMY_API_KEY || "",
    infura: process.env.INFURA_API_KEY || "",
    quicknode: process.env.QUICKNODE_API_KEY || "",
  },

  // Flashbots Configuration
  flashbots: {
    // Flashbots Protect RPC for MEV-protected transactions
    // Default URL with useMempool=true for public mempool access
    // You can customize with builders and other parameters
    // Recommended: Use the advanced URL with all builders for better MEV protection
    protectRpcUrl: process.env.FLASHBOTS_PROTECT_RPC_URL || 
      "https://rpc.flashbots.net?builder=f1b.io&builder=rsync&builder=beaverbuild.org&builder=builder0x69&builder=Titan&builder=EigenPhi&builder=boba-builder&builder=Gambit+Labs&builder=payload&builder=Loki&builder=BuildAI&builder=JetBuilder&builder=tbuilder&builder=penguinbuild&builder=bobthebuilder&builder=BTCS&builder=bloXroute&builder=Blockbeelder&builder=Quasar&builder=Eureka&useMempool=true&hint=default_logs&refund=0x47f9018d3119b6c23538ba932f99e2a966bab52c%3A90&originId=flashbots",
    // Custom mempool RPC (optional) - for monitoring public mempool
    // If not set, uses protectRpcUrl
    mempoolRpcUrl: process.env.FLASHBOTS_MEMPOOL_RPC_URL || 
      process.env.FLASHBOTS_PROTECT_RPC_URL || 
      "https://rpc.flashbots.net?useMempool=true",
    // Enable Flashbots mempool monitoring (default: true if URL is configured)
    enableMempoolMonitoring: process.env.FLASHBOTS_ENABLE_MEMPOOL !== "false" && 
      (!!process.env.FLASHBOTS_PROTECT_RPC_URL || process.env.FLASHBOTS_ENABLE_MEMPOOL === "true"),
  },

  // WalletConnect
  walletConnect: {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  },

  // Chains
  chains: {
    ethereum: {
      id: 1,
      name: "Ethereum",
      rpcUrl: buildRpcUrl("https://eth-mainnet.g.alchemy.com/v2", "ethereum"),
    },
    optimism: {
      id: 10,
      name: "Optimism",
      rpcUrl: buildRpcUrl("https://opt-mainnet.g.alchemy.com/v2", "optimism"),
    },
    arbitrum: {
      id: 42161,
      name: "Arbitrum",
      rpcUrl: buildRpcUrl("https://arb-mainnet.g.alchemy.com/v2", "arbitrum"),
    },
    polygon: {
      id: 137,
      name: "Polygon",
      rpcUrl: buildRpcUrl("https://polygon-mainnet.g.alchemy.com/v2", "polygon"),
    },
    avalanche: {
      id: 43114,
      name: "Avalanche",
      rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    },
    base: {
      id: 8453,
      name: "Base",
      rpcUrl: buildRpcUrl("https://base-mainnet.g.alchemy.com/v2", "base"),
    },
  },
}

function buildRpcUrl(baseUrl: string, chainName: string): string {
  // Access environment variable directly to avoid circular dependency
  const alchemyKey = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_KEY || ""
  if (alchemyKey) {
    return `${baseUrl}/${alchemyKey}`
  }
  // Fallback to public endpoints if no API key
  const publicEndpoints: Record<string, string> = {
    ethereum: "https://eth.public.blastapi.io",
    optimism: "https://optimism.publicnode.com",
    arbitrum: "https://arbitrum.publicnode.com",
    polygon: "https://polygon.publicnode.com",
    base: "https://base.publicnode.com",
  }
  return publicEndpoints[chainName] || baseUrl
}

// Validation function - server-side only
export function validateConfig(): string[] {
  const errors: string[] = []

  if (!config.supabase.url) errors.push("NEXT_PUBLIC_SUPABASE_URL is not set")
  if (!config.supabase.anonKey) errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set")

  // 0x API Key is required for swaps (server-side, not exposed)
  if (!config.zxProtocol.apiKey) {
    errors.push("ZX_API_KEY is not set - 0x Protocol swaps will fail")
  }

  // WalletConnect is required
  if (!config.walletConnect.projectId) {
    errors.push("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set")
  }

  // At least one RPC provider should be configured
  const hasRpc = config.rpc.alchemy || config.rpc.infura || config.rpc.quicknode
  if (!hasRpc) {
    console.warn("No RPC provider configured - using public endpoints")
  }

  // Flashbots is optional but recommended for MEV protection
  if (config.flashbots.enableMempoolMonitoring && !config.flashbots.protectRpcUrl) {
    console.warn("Flashbots mempool monitoring enabled but FLASHBOTS_PROTECT_RPC_URL not configured")
  }

  return errors
}
