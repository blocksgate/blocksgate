# Detailed Implementation Guides

## 1. Real Price Data Integration

### Architecture Overview
\`\`\`
Price Sources → Aggregator → Cache → Components
  ├── Coingecko
  ├── Chainlink
  └── DEX APIs
\`\`\`

### Implementation Steps

#### Step 1: Create Price Aggregator Service
Location: `/lib/price-aggregator.ts`

\`\`\`typescript
interface PriceData {
  token: string
  price: number
  source: string
  timestamp: number
  changePercent24h: number
}

interface PriceFeed {
  getCurrentPrice(token: string): Promise<number>
  getPriceHistory(token: string, hours: number): Promise<PriceData[]>
  getMultiplePrices(tokens: string[]): Promise<Map<string, number>>
  subscribeToUpdates(token: string, callback: (price: number) => void): () => void
}

export class PriceAggregator implements PriceFeed {
  private cache: Map<string, PriceData> = new Map()
  private subscribers: Map<string, Set<Function>> = new Map()
  
  // Implementation with fallback logic
}
\`\`\`

#### Step 2: Create Price Feed Action
Location: `/app/actions/price-feed.ts`

\`\`\`typescript
"use server"

export async function getPriceAction(tokenAddress: string): Promise<number | null>
export async function getPriceHistoryAction(token: string, hours: number): Promise<PriceData[]>
export async function getMultiplePricesAction(tokens: string[]): Promise<Record<string, number>>
\`\`\`

#### Step 3: Update Components
- Swap Interface
- Portfolio Card
- Analytics Dashboard

### Data Sources Priority
1. **Coingecko API** (Primary - Free, no auth needed)
   - Endpoint: `https://api.coingecko.com/api/v3/`
   - Rate limit: 10-50 calls/min
   
2. **Chainlink** (Fallback - On-chain oracle)
   - Contract calls for ETH, BTC, USDC prices
   
3. **1inch API** (Tertiary - DEX prices)
   - Best for small-cap tokens

### Caching Strategy
- Cache prices for 30 seconds
- Invalidate on new block
- Store last 24h history locally

---

## 2. Real Transaction Execution

### Architecture Overview
\`\`\`
User Input → Validation → Quote → Signature → Execution → Confirmation
                            ↓
                      Builder (0x/1inch)
\`\`\`

### Implementation Steps

#### Step 1: Transaction Builder Service
Location: `/lib/transaction-builder.ts`

\`\`\`typescript
interface TransactionRequest {
  type: 'swap' | 'flash' | 'arbitrage' | 'cross-chain'
  params: any
}

interface Transaction {
  to: string
  data: string
  value: string
  gasEstimate: string
}

export class TransactionBuilder {
  async buildSwap(sellToken, buyToken, amount, slippage): Promise<Transaction>
  async buildFlashSwap(loanToken, loanAmount, routes): Promise<Transaction>
  async buildArbitrage(opportunities): Promise<Transaction>
  async buildCrossChain(fromChain, toChain, amount): Promise<Transaction>
}
\`\`\`

#### Step 2: Execution Service
Location: `/app/actions/execute-transaction.ts`

\`\`\`typescript
export async function executeSwapAction(
  quote: SwapQuote,
  signature: string,
  userAddress: string
): Promise<{ txHash: string; status: 'pending' | 'confirmed' }>

export async function executeFlashSwapAction(
  flashData: FlashSwapData,
  signature: string
): Promise<{ txHash: string; profit: string }>
\`\`\`

#### Step 3: Update Dashboard Pages
- Swap page execution flow
- Flash swap builder
- Arbitrage execution
- Cross-chain router

### Gas Estimation
- Use simulation on node
- Add 20% buffer for safety
- Update in real-time based on network

### Signature Handling
- Use ethers.js for signing
- Request signature from wallet
- Validate before submission

---

## 3. Database & Transaction History

### Schema Design

\`\`\`sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trades Table
CREATE TABLE trades (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  trade_type VARCHAR(50), -- 'swap', 'flash', 'arbitrage'
  from_token VARCHAR(255),
  to_token VARCHAR(255),
  from_amount DECIMAL(38,18),
  to_amount DECIMAL(38,18),
  gas_used DECIMAL(38,18),
  fee DECIMAL(38,18),
  profit DECIMAL(38,18),
  status VARCHAR(50), -- 'pending', 'confirmed', 'failed'
  tx_hash VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  order_type VARCHAR(50), -- 'limit', 'stop', 'take-profit'
  token_pair VARCHAR(50),
  trigger_price DECIMAL(38,18),
  amount DECIMAL(38,18),
  status VARCHAR(50),
  created_at TIMESTAMP,
  executed_at TIMESTAMP
);

-- Performance Metrics Table
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total_trades INT,
  total_profit DECIMAL(38,18),
  win_rate DECIMAL(5,2),
  avg_trade_size DECIMAL(38,18),
  recorded_at TIMESTAMP
);
\`\`\`

### Implementation

#### Step 1: Setup Database
Location: `/lib/db/index.ts`

\`\`\`typescript
import { Pool } from 'pg'

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

export async function query(text: string, params?: any[]) {
  return pool.query(text, params)
}
\`\`\`

#### Step 2: Create API Routes
Location: `/app/api/trades/history.ts`

\`\`\`typescript
export async function GET(req: Request) {
  const { walletAddress } = req.query
  // Fetch trades from database
}

export async function POST(req: Request) {
  const trade = await req.json()
  // Store trade in database
}
\`\`\`

#### Step 3: Create Database Hooks
Location: `/hooks/use-trade-history.ts`

\`\`\`typescript
export function useTradingHistory(walletAddress: string) {
  const { data, isLoading, error } = useSWR(
    `/api/trades?wallet=${walletAddress}`,
    fetcher
  )
  return { trades: data, isLoading, error }
}
\`\`\`

### Migration Strategy
- Create migration files for version control
- Use database migration tools (Flyway, Alembic)
- Run migrations automatically on deployment

---

## Implementation Checklist

### Before Starting
- [ ] Review existing code patterns
- [ ] Set up development database
- [ ] Create feature branches
- [ ] Add comprehensive logging

### During Development
- [ ] Add unit tests as you go
- [ ] Update API documentation
- [ ] Follow existing code style
- [ ] Add error handling

### After Completion
- [ ] Run full test suite
- [ ] Update documentation
- [ ] Performance testing
- [ ] Security audit
- [ ] Create migration guide

---
