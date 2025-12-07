export interface WalletConnectConfig {
  projectId: string // WalletConnect v2 Project ID
  chains: number[] // Supported chain IDs
  methods?: string[] // Supported methods
  events?: string[] // Supported events
}

export interface WalletConnectSession {
  topic: string
  pairingTopic: string
  relay: {
    protocol: string
    data?: string
  }
  expiry: number
  accounts: string[]
  chainId: number
  status: "active" | "expired" | "disconnected"
}

const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

export class WalletConnectProvider {
  private projectId: string
  private chains: number[]
  private methods: string[]
  private events: string[]
  private session: WalletConnectSession | null = null

  constructor(config: WalletConnectConfig) {
    this.projectId = config.projectId
    this.chains = config.chains
    this.methods = config.methods || ["eth_sendTransaction", "eth_signTransaction", "eth_sign", "personal_sign"]
    this.events = config.events || ["chainChanged", "accountsChanged", "disconnect"]
  }

  async initialize(): Promise<void> {
    try {
      if (typeof window === "undefined") return

      // Check if WalletConnect is available in window
      if (!window.ethereum?.isWalletConnect) {
        console.log("[v0] WalletConnect not available, using standard wallet")
        return
      }

      console.log("[v0] WalletConnect provider initialized")
    } catch (error) {
      console.error("[v0] WalletConnect initialization error:", error)
    }
  }

  async connect(): Promise<string[]> {
    try {
      if (!window.ethereum) {
        throw new Error("No wallet detected")
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts && accounts.length > 0) {
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        })

        this.session = {
          topic: `session_${Date.now()}`,
          pairingTopic: `pairing_${Date.now()}`,
          relay: {
            protocol: "irn",
          },
          expiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
          accounts,
          chainId: Number.parseInt(chainId as string, 16),
          status: "active",
        }

        localStorage.setItem("walletConnectSession", JSON.stringify(this.session))
        console.log("[v0] WalletConnect session created:", this.session)

        return accounts
      }

      throw new Error("No accounts returned from wallet")
    } catch (error) {
      console.error("[v0] WalletConnect connection error:", error)
      throw error
    }
  }

  async restoreSession(): Promise<string[] | null> {
    try {
      const sessionData = localStorage.getItem("walletConnectSession")
      if (!sessionData) return null

      const session = JSON.parse(sessionData) as WalletConnectSession
      const now = Date.now()

      // Check if session is expired
      if (session.expiry < now) {
        localStorage.removeItem("walletConnectSession")
        return null
      }

      this.session = session
      console.log("[v0] WalletConnect session restored:", session)

      return session.accounts
    } catch (error) {
      console.error("[v0] WalletConnect session restore error:", error)
      return null
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.session = null
      localStorage.removeItem("walletConnectSession")
      console.log("[v0] WalletConnect disconnected")
    } catch (error) {
      console.error("[v0] WalletConnect disconnect error:", error)
    }
  }

  getSession(): WalletConnectSession | null {
    return this.session
  }

  isConnected(): boolean {
    return this.session?.status === "active"
  }

  getChainId(): number {
    return this.session?.chainId || 1
  }

  getAccounts(): string[] {
    return this.session?.accounts || []
  }
}

// Singleton instance
let walletConnectProvider: WalletConnectProvider | null = null

export function initializeWalletConnect(config: Partial<WalletConnectConfig> = {}): WalletConnectProvider {
  if (!walletConnectProvider) {
    walletConnectProvider = new WalletConnectProvider({
      projectId: config.projectId || WALLETCONNECT_PROJECT_ID,
      chains: config.chains || [1, 10, 42161, 137, 43114, 8453],
    })
  }
  return walletConnectProvider
}

export function getWalletConnectProvider(): WalletConnectProvider {
  if (!walletConnectProvider) {
    walletConnectProvider = new WalletConnectProvider({
      projectId: WALLETCONNECT_PROJECT_ID,
      chains: [1, 10, 42161, 137, 43114, 8453],
    })
  }
  return walletConnectProvider
}
