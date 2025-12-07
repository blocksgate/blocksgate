# OgDeFi - Developer Quick Reference

## Feature Integration Map

### 1. Arbitrage Monitoring
- **Files**: `lib/arbitrage-detector.ts`, `app/dashboard/arbitrage/page.tsx`
- **0x Integration**: Uses `/swap/permit2/price` endpoints
- **Key Function**: `detectArbitrageOpportunities(chainId, tokenPairs)`
- **Output**: Array of opportunities sorted by profit %

### 2. Liquidity Pools
- **Files**: `components/pools/`, `app/dashboard/pools/page.tsx`
- **0x Integration**: Price discovery for pool tokens
- **Key Function**: Pool TVL, APY, and fee tracking
- **Output**: Active positions with earned fees

### 3. Trading Bot
- **Files**: `lib/trading-engine.ts`, `app/dashboard/trading-bot/page.tsx`
- **0x Integration**: Continuous quote fetching via server actions
- **Key Classes**: `TradingBot`, `ArbitrageMonitor`
- **Strategies**: DCA, Grid, Momentum, Mean Reversion

### 4. Flash Swaps & MEV
- **Files**: `lib/mev-analyzer.ts`, `app/dashboard/flash-swaps/page.tsx`
- **0x Integration**: Transaction analysis and MEV detection
- **Key Functions**: `analyzeMEVRisks()`, `calculateFlashLoanProfit()`
- **Output**: Risk scores and profit projections

### 5. Token Swap
- **Files**: `components/swap/`, `app/actions/0x-enhanced.ts`
- **0x Integration**: Permit2 & AllowanceHolder methods
- **Key Function**: `determineBestSwapMethod()`
- **Output**: Optimized swap transaction

### 6. Gasless Swaps
- **Files**: `components/swap/gasless-swap.tsx`, `app/actions/gasless.ts`
- **0x Integration**: Meta-transaction routing
- **Key Feature**: Zero gas swaps via relayer network
- **Output**: User-signed, relayer-executed swaps

### 7. Cross-Chain
- **Files**: `lib/cross-chain-routes.ts`, `app/dashboard/cross-chain/page.tsx`
- **0x Integration**: Multi-chain quote comparison
- **Bridge Support**: Stargate, Across, Axelar, LiFi
- **Output**: Best route across chains

## API Endpoints Reference

### 0x Protocol v4 Endpoints

\`\`\`javascript
// Standard Swaps
GET /swap/permit2/price
GET /swap/permit2/quote
GET /swap/allowance-holder/price
GET /swap/allowance-holder/quote

// Supported Chains Endpoint
GET /swap/v1/supported/chains

// Trade Tracking
GET /trade-api/trades
GET /trade-api/tokens/{address}

// Analytics
GET /trade-api/volume
GET /trade-api/transactions
\`\`\`

### Key Parameters

\`\`\`javascript
{
  chainId: 1,                    // Network ID
  sellToken: "0xc02...",         // WETH on Ethereum
  buyToken: "0x6b1...",          // DAI on Ethereum
  sellAmount: "1000000000000000000", // 1 token (wei)
  taker: "0x...",                // User wallet
  slippageBps: 100,              // 1% slippage
  skipValidation: false,         // Validate quote
  feeRecipient: "0x...",         // Optional fee receiver
}
\`\`\`

## Server Action Examples

### Get Swap Quote
\`\`\`typescript
import { getPermit2QuoteAction } from "@/app/actions/0x-enhanced"

const quote = await getPermit2QuoteAction(
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
  "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
  "1000000000000000000", // 1 WETH
  userAddress,
  100, // 1% slippage
  1 // Ethereum
)
\`\`\`

### Detect Arbitrage
\`\`\`typescript
import { detectArbitrageOpportunities } from "@/lib/arbitrage-detector"

const opportunities = await detectArbitrageOpportunities(
  1, // Ethereum
  [
    { sell: "0xc02...", buy: "0x6b1..." }, // WETH -> DAI
    { sell: "0xa0b...", buy: "0xc02..." }, // USDC -> WETH
  ]
)
\`\`\`

### Analyze MEV
\`\`\`typescript
import { analyzeMEVRisks } from "@/lib/mev-analyzer"

const risks = analyzeMEVRisks(
  50, // Gas price in Gwei
  0.5, // Slippage tolerance %
  "100000", // Trade size in USD
  "1000000" // Token liquidity in wei
)
\`\`\`

## Component Usage

### Swap Interface
\`\`\`tsx
import { AdvancedSwapInterface } from "@/components/swap/advanced-interface"

<AdvancedSwapInterface
  defaultSellToken="0xc02..."
  defaultBuyToken="0x6b1..."
  chainId={1}
/>
\`\`\`

### Arbitrage Monitor
\`\`\`tsx
import { MonitorDashboard } from "@/components/arbitrage/monitor-dashboard"

<MonitorDashboard
  refreshInterval={10000}
  autoExecute={false}
/>
\`\`\`

### Trading Bot Builder
\`\`\`tsx
import { BotStrategyBuilder } from "@/components/bot/bot-strategy-builder"

<BotStrategyBuilder
  onStrategyCreate={(config) => {
    // Handle bot creation
  }}
/>
\`\`\`

## Debugging Tips

1. **Check RPC Health**: View `components/rpc-status.tsx`
2. **Monitor 0x API**: Log all API calls in server actions
3. **Test Quotes**: Use Permit2 then AllowanceHolder, compare
4. **Gas Estimation**: Cross-reference with multiple providers
5. **Arbitrage Validation**: Manually calculate profit offline

## Deployment Checklist

- [ ] All API keys added to Vercel secrets
- [ ] RPC providers configured (5 minimum)
- [ ] 0x API key tested on Sepolia
- [ ] WalletConnect ID generated
- [ ] Mainnet environment configured
- [ ] RPC health monitoring verified
- [ ] Error logging configured
- [ ] Analytics tracking enabled
- [ ] Security audit completed
- [ ] Load testing on quote endpoints

# Advanced Systems Integration Guide

## RPC Load Balancer

**Basic Usage**:
\`\`\`typescript
import { getRPCLoadBalancer } from "@/lib/rpc-load-balancer"

// Get singleton instance
const loadBalancer = getRPCLoadBalancer()

// Get current metrics
const metrics = loadBalancer.getMetrics()
console.log(`Average latency: ${metrics.averageLatency}ms`)
console.log(`Healthy nodes: ${metrics.healthyNodeCount}`)

// Submit a request (auto-routed to best node)
const result = await loadBalancer.submitRequest({
  method: "eth_blockNumber",
  params: [],
})
\`\`\`

## WebSocket Monitor

**Basic Usage**:
\`\`\`typescript
import { getWebSocketMonitor } from "@/lib/websocket-monitor"

// Get singleton instance
const wsMonitor = getWebSocketMonitor()

// Check if connected
if (wsMonitor.isConnected("alchemy")) {
  console.log("Alchemy WebSocket connected")
}

// Get recent mempool transactions
const recentTxs = wsMonitor.getRecentMempoolTxs(10)
recentTxs.forEach(tx => {
  console.log(`Pending: ${tx.txHash}`)
})

// Subscribe to events
wsMonitor.on("transaction", (tx) => {
  console.log("New transaction detected:", tx.hash)
})
\`\`\`

## Latency Tracker

**Basic Usage**:
\`\`\`typescript
import { getLatencyTracker } from "@/lib/latency-tracker"

// Get singleton instance
const tracker = getLatencyTracker()

// Create a trace span
const span = tracker.createSpan("getUserBalance")

// Do some work...
await fetchUserBalance()

// End the span
const trace = tracker.endSpan(span.spanId, { success: true })
console.log(`Operation took ${trace.duration}ms`)

// Get metrics
const metrics = tracker.getMetrics()
console.log(`p99 latency: ${metrics.p99}ms`)
\`\`\`

## MEV Analyzer

**Basic Usage**:
\`\`\`typescript
import { getMEVAnalyzerAdvanced } from "@/lib/mev-analyzer-advanced"

// Get singleton instance
const mevAnalyzer = getMEVAnalyzerAdvanced()

// Analyze a swap for MEV risk
const analysis = await mevAnalyzer.analyzeSwapForMEV({
  tokenIn: "0xc02...", // WETH
  tokenOut: "0x6b1...", // DAI
  amountIn: "1000000000000000000",
  userAddress: "0x...",
})

console.log(`MEV risk: ${analysis.mevRiskLevel}`)
console.log(`Estimated savings: $${analysis.estimatedMevValue}`)

// Get available protection strategies
const strategies = mevAnalyzer.getAdvancedStrategies()
strategies.forEach(s => console.log(`Strategy: ${s.name}`))
\`\`\`

## Flash Loan Aggregator

**Basic Usage**:
\`\`\`typescript
import { getFlashLoanAggregator } from "@/lib/flash-loan-aggregator"

// Get singleton instance
const flashLoanAgg = getFlashLoanAggregator()

// Find flash loan opportunity
const opportunity = await flashLoanAgg.findFlashLoanOpportunity({
  tokenIn: "0xc02...",
  tokenOut: "0x6b1...",
  amount: "100000000000000000",
})

if (opportunity) {
  console.log(`Best provider: ${opportunity.provider}`)
  console.log(`Fee: ${opportunity.fee}%`)
  console.log(`Net profit: $${opportunity.netProfit}`)
}

// Execute flash loan
const result = await flashLoanAgg.executeFlashLoan(opportunity)
\`\`\`

## Gas Optimizer

**Basic Usage**:
\`\`\`typescript
import { getGasOptimizer } from "@/lib/gas-optimizer"

// Get singleton instance
const gasOptimizer = getGasOptimizer()

// Get gas optimization recommendation
const recommendation = gasOptimizer.recommendOptimalGasPrice({
  profitabilityLevel: "high", // "low" | "medium" | "high"
  txType: "swap", // transaction type
})

console.log(`Suggested gas price: ${recommendation.suggestedGasPrice} Gwei`)
console.log(`Estimated savings: ${recommendation.estimatedSavings} Gwei`)

// Get optimization recommendations
const recs = gasOptimizer.getOptimizationRecommendations()
recs.forEach(rec => console.log(`Tip: ${rec}`))
\`\`\`

## Security Failover

**Basic Usage**:
\`\`\`typescript
import { getSecurityFailover } from "@/lib/security-failover"

// Get singleton instance
const securityFailover = getSecurityFailover()

// Check region status
const regionStatus = securityFailover.getRegionStatus()
regionStatus.forEach(region => {
  console.log(`Region: ${region.name}, Status: ${region.status}`)
})

// Validate a request
const validation = securityFailover.validateRequest({
  origin: "user-origin",
  method: "swap",
  params: { tokenIn, tokenOut },
})

if (validation.isValid) {
  console.log("Request passed security checks")
} else {
  console.log(`Security issue: ${validation.reason}`)
}
\`\`\`

## Integrated System Actions

**Server Actions in `app/actions/integrated-systems.ts`**:

\`\`\`typescript
// Get all system metrics
const metrics = await getSystemMetrics()

// Get mempool data
const mempool = await getMempool()

// Execute optimized swap
const swap = await executeOptimizedSwap(
  tokenIn,
  tokenOut,
  amount,
  userAddress
)

// Monitor latency
const latencySpan = await monitorLatency("swapExecution")

// End latency monitoring
await endLatencyMonitoring(latencySpan.spanId, {
  txHash,
  gasUsed,
})
\`\`\`

## Frontend Component Integration

**Using System Monitor in Components**:
\`\`\`tsx
import { SystemIntegrationMonitor } from "@/components/dashboard/system-integration-monitor"

export default function Dashboard() {
  return (
    <div>
      <h1>System Status</h1>
      <SystemIntegrationMonitor />
    </div>
  )
}
\`\`\`

---

## Testing Advanced Systems

### Test RPC Failover
\`\`\`typescript
// Disable primary provider in dashboard
// Observe automatic failover to secondary provider
// Verify requests still succeed
\`\`\`

### Test WebSocket Events
\`\`\`typescript
// Monitor WebSocket tab in browser DevTools
// Send test transaction to mempool
// Observe WebSocket event received within 1 second
\`\`\`

### Test Gas Optimization
\`\`\`typescript
// Execute swap with high profitability level
// Observe gas savings in transaction
// Compare to non-optimized gas price
\`\`\`

### Test MEV Protection
\`\`\`typescript
// Execute large swap
// Monitor for sandwich attack detection
// Verify protection strategy activated
\`\`\`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| RPC failover slow | Check network connectivity to all providers |
| WebSocket disconnects | Verify WebSocket URL, check firewall |
| High latency | Review metrics for bottleneck identification |
| MEV protection failing | Check sufficient liquidity for protected route |
| Gas optimization not saving | Verify gas price model matches current market |
| Failover not triggering | Ensure region health checks pass |

---

## Performance Tuning

### Optimize RPC Routing
- Increase health check frequency if latency critical
- Add more RPC providers for redundancy
- Monitor node performance trends

### Optimize WebSocket Monitoring
- Adjust event buffer size for memory constraints
- Tune reconnection backoff for network conditions
- Filter unnecessary events to reduce CPU load

### Optimize Latency Tracking
- Adjust percentile calculations for accuracy
- Reduce trace frequency if CPU bound
- Archive old traces to storage

---

**Last Updated**: 2024
**Version**: 2.0.0
