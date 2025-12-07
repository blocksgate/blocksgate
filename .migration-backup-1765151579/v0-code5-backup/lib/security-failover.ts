// Security & multi-region failover system with audit logging

export interface SecurityAuditLog {
  timestamp: number
  event: string
  severity: "info" | "warning" | "critical"
  userId?: string
  ipAddress?: string
  details: Record<string, any>
  action: "logged" | "blocked" | "flagged"
}

export interface RegionalEndpoint {
  region: string
  endpoint: string
  isActive: boolean
  latency: number
  failoverPriority: number
  lastHealthCheck: number
}

export interface FailoverState {
  activeRegion: string
  previousRegion?: string
  switchTime: number
  reason: string
  recoveryProgress: number
}

export interface SecurityPolicy {
  maxRequestsPerSecond: number
  maxTransactionSize: number
  allowedOrigins: string[]
  requiresSignature: boolean
  rateLimitByIp: boolean
}

class SecurityFailoverSystem {
  private auditLog: SecurityAuditLog[] = []
  private regions: Map<string, RegionalEndpoint> = new Map()
  private failoverState: FailoverState | null = null
  private securityPolicy: SecurityPolicy
  private rateLimitMap: Map<string, number[]> = new Map()
  private healthCheckInterval: NodeJS.Timeout | null = null
  private privateKeyStore: Map<string, string> = new Map() // In production, use secure vault

  constructor() {
    this.securityPolicy = {
      maxRequestsPerSecond: 100,
      maxTransactionSize: 10000000, // 10MB
      allowedOrigins: ["https://yourdomain.com", "https://app.yourdomain.com"],
      requiresSignature: true,
      rateLimitByIp: true,
    }
    this.initializeRegions()
    this.startHealthChecks()
  }

  private initializeRegions() {
    const endpoints: RegionalEndpoint[] = [
      {
        region: "us-east-1",
        endpoint: process.env.RPC_US_EAST || "https://rpc-us-east.example.com",
        isActive: true,
        latency: 0,
        failoverPriority: 1,
        lastHealthCheck: Date.now(),
      },
      {
        region: "eu-west-1",
        endpoint: process.env.RPC_EU_WEST || "https://rpc-eu-west.example.com",
        isActive: true,
        latency: 0,
        failoverPriority: 2,
        lastHealthCheck: Date.now(),
      },
      {
        region: "ap-southeast-1",
        endpoint: process.env.RPC_AP_SE || "https://rpc-ap-se.example.com",
        isActive: true,
        latency: 0,
        failoverPriority: 3,
        lastHealthCheck: Date.now(),
      },
    ]

    endpoints.forEach((ep) => {
      this.regions.set(ep.region, ep)
    })

    // Set initial active region
    this.failoverState = {
      activeRegion: "us-east-1",
      switchTime: Date.now(),
      reason: "Initial setup",
      recoveryProgress: 100,
    }
  }

  private startHealthChecks() {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks()
    }, 30000) // Every 30 seconds
  }

  private async performHealthChecks() {
    for (const [region, endpoint] of this.regions.entries()) {
      try {
        const startTime = performance.now()
        const response = await fetch(endpoint.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_blockNumber",
            params: [],
          }),
        })

        const latency = performance.now() - startTime
        endpoint.latency = latency
        endpoint.lastHealthCheck = Date.now()

        if (response.ok) {
          if (!endpoint.isActive) {
            endpoint.isActive = true
            this.logAudit("region-recovered", "info", { region }, "logged")
          }
        } else {
          endpoint.isActive = false
          this.logAudit("region-unhealthy", "critical", { region, status: response.status }, "flagged")

          // Trigger failover if current region is down
          if (region === this.failoverState?.activeRegion) {
            this.triggerFailover(region)
          }
        }
      } catch (error) {
        endpoint.isActive = false
        endpoint.lastHealthCheck = Date.now()
        this.logAudit("health-check-failed", "warning", { region, error: String(error) }, "flagged")

        if (region === this.failoverState?.activeRegion) {
          this.triggerFailover(region)
        }
      }
    }
  }

  private triggerFailover(failedRegion: string) {
    const activeEndpoints = Array.from(this.regions.values())
      .filter((ep) => ep.isActive && ep.region !== failedRegion)
      .sort((a, b) => a.failoverPriority - b.failoverPriority)

    if (activeEndpoints.length === 0) {
      this.logAudit("failover-failed", "critical", { failedRegion, reason: "No healthy regions available" }, "blocked")
      return
    }

    const nextRegion = activeEndpoints[0].region
    const previousRegion = this.failoverState?.activeRegion

    this.failoverState = {
      activeRegion: nextRegion,
      previousRegion,
      switchTime: Date.now(),
      reason: `Failed region: ${failedRegion}`,
      recoveryProgress: 0,
    }

    this.logAudit(
      "failover-triggered",
      "warning",
      {
        fromRegion: previousRegion,
        toRegion: nextRegion,
        reason: `Region ${failedRegion} became unhealthy`,
      },
      "logged",
    )

    console.log(`[v0] Failover triggered: ${previousRegion} -> ${nextRegion}`)
  }

  validateRequest(
    ipAddress: string,
    origin: string,
    requestSize: number,
    signature?: string,
  ): { valid: boolean; reason?: string } {
    // Origin validation
    if (!this.securityPolicy.allowedOrigins.includes(origin)) {
      this.logAudit("invalid-origin", "warning", { origin, ip: ipAddress }, "blocked")
      return { valid: false, reason: "Origin not allowed" }
    }

    // Size validation
    if (requestSize > this.securityPolicy.maxTransactionSize) {
      this.logAudit("oversized-request", "warning", { size: requestSize, ip: ipAddress }, "blocked")
      return { valid: false, reason: "Request too large" }
    }

    // Rate limiting
    if (this.securityPolicy.rateLimitByIp) {
      const now = Date.now()
      const windowStart = now - 1000

      if (!this.rateLimitMap.has(ipAddress)) {
        this.rateLimitMap.set(ipAddress, [])
      }

      const requests = this.rateLimitMap.get(ipAddress)!
      const recentRequests = requests.filter((t) => t > windowStart)

      if (recentRequests.length >= this.securityPolicy.maxRequestsPerSecond) {
        this.logAudit(
          "rate-limit-exceeded",
          "warning",
          { ip: ipAddress, requestCount: recentRequests.length },
          "blocked",
        )
        return { valid: false, reason: "Rate limit exceeded" }
      }

      recentRequests.push(now)
      this.rateLimitMap.set(ipAddress, recentRequests)
    }

    // Signature validation (if required)
    if (this.securityPolicy.requiresSignature && !signature) {
      this.logAudit("missing-signature", "warning", { ip: ipAddress }, "blocked")
      return { valid: false, reason: "Signature required" }
    }

    return { valid: true }
  }

  private logAudit(
    event: string,
    severity: "info" | "warning" | "critical",
    details: Record<string, any>,
    action: "logged" | "blocked" | "flagged",
  ) {
    const log: SecurityAuditLog = {
      timestamp: Date.now(),
      event,
      severity,
      details,
      action,
    }

    this.auditLog.push(log)

    // Keep last 10,000 logs in memory
    if (this.auditLog.length > 10000) {
      this.auditLog.shift()
    }

    // Log to external service in production
    if (severity === "critical") {
      console.error(`[v0] CRITICAL SECURITY EVENT: ${event}`, details)
    }
  }

  rotatePrivateKey(keyId: string, newKey: string) {
    const oldKey = this.privateKeyStore.get(keyId)
    this.privateKeyStore.set(keyId, newKey)

    this.logAudit("key-rotated", "info", { keyId, hasOldKey: !!oldKey }, "logged")
    console.log(`[v0] Private key rotated for ${keyId}`)
  }

  getActiveRegion(): RegionalEndpoint | null {
    return this.regions.get(this.failoverState?.activeRegion || "") || null
  }

  getAllRegions(): Record<string, RegionalEndpoint> {
    const result: Record<string, RegionalEndpoint> = {}
    this.regions.forEach((ep, region) => {
      result[region] = ep
    })
    return result
  }

  getFailoverState(): FailoverState | null {
    return this.failoverState
  }

  getAuditLog(limit = 100, severity?: string): SecurityAuditLog[] {
    let logs = this.auditLog.slice(-limit)
    if (severity) {
      logs = logs.filter((log) => log.severity === severity)
    }
    return logs
  }

  updateSecurityPolicy(policy: Partial<SecurityPolicy>) {
    this.securityPolicy = { ...this.securityPolicy, ...policy }
    this.logAudit("policy-updated", "info", { policy: this.securityPolicy }, "logged")
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
  }

  getMetrics() {
    const activeRegions = Array.from(this.regions.values()).filter((r) => r.isActive).length
    return {
      activeRegions,
      totalRegions: this.regions.size,
      failoverCount: this.auditLog.filter((log) => log.event === "failover-triggered").length,
      auditLogSize: this.auditLog.length,
      currentRegion: this.failoverState?.activeRegion,
    }
  }

  getRegionStatus() {
    const regions: Record<string, any> = {}
    this.regions.forEach((ep, region) => {
      regions[region] = {
        isActive: ep.isActive,
        latency: ep.latency,
        lastHealthCheck: ep.lastHealthCheck,
      }
    })
    return regions
  }
}

let securitySystem: SecurityFailoverSystem | null = null

export function getSecurityFailoverSystem(): SecurityFailoverSystem {
  if (!securitySystem) {
    securitySystem = new SecurityFailoverSystem()
  }
  return securitySystem
}

export function getSecurityFailover(): SecurityFailoverSystem {
  return getSecurityFailoverSystem()
}
