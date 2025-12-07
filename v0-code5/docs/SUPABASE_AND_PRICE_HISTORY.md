# Supabase Function Types and Price History System

## Supabase RPC Functions

The system now includes proper TypeScript types and error handling for Supabase RPC functions:

### RPC Client Usage

```typescript
import { rpcClient } from "@/lib/supabase/rpc-client"

// Get daily PnL data
const dailyPnL = await rpcClient.getDailyPnL({
  user_id: "user-123",
  start_date: "2025-01-01",
  end_date: "2025-01-02",
  token_filter: null
})

// Get active sessions count
const activeSessions = await rpcClient.getActiveSessionsCount({
  window_minutes: 5
})

// Get request rate
const requestRate = await rpcClient.getRequestRate({
  window_minutes: 1
})
```

### Error Handling

RPC errors are now properly typed and include detailed information:

```typescript
try {
  const result = await rpcClient.getDailyPnL(args)
} catch (error) {
  if (isRpcError(error)) {
    console.error({
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
  }
}
```

## Price History System

The system includes a new price history system with support for multiple data sources:

### Usage

```typescript
import { priceAggregator } from "@/lib/price-aggregator"

// Get historical price data
const bars = await priceAggregator.getPriceHistory("ETH", "1h", {
  startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
  endTime: Date.now(),
  limit: 168 // 7 days * 24 hours
})

// Each bar includes OHLCV data
bars.forEach(bar => {
  console.log({
    timestamp: new Date(bar.timestamp),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume
  })
})
```

### Adding New Price History Providers

You can implement custom price history providers by implementing the `PriceHistoryProvider` interface:

```typescript
import { PriceHistoryProvider, HistoricalPriceOptions, PriceHistory } from "@/lib/types/price-history"

class CustomPriceHistoryProvider implements PriceHistoryProvider {
  async getPriceHistory(token: string, options: HistoricalPriceOptions): Promise<PriceHistory> {
    // Implementation
  }
}

// Add to the composite provider
priceHistoryProvider.addProvider(new CustomPriceHistoryProvider())
```

## Testing

The system includes comprehensive tests for both the RPC client and price history functionality. Run the tests using:

```bash
npm test
```

Test coverage includes:
- RPC function calls and error handling
- Price history data fetching
- Composite provider functionality
- Error scenarios and edge cases