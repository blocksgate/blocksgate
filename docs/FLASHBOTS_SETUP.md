# Flashbots Mempool Monitoring Setup

## Overview

This platform now supports Flashbots mempool monitoring for real-time transaction detection and MEV protection. Flashbots provides a private transaction pool that protects users from front-running and sandwich attacks.

## How It Works

1. **Mempool Monitoring**: Polls Ethereum mempool using RPC calls to detect pending transactions
2. **MEV Protection**: Uses Flashbots Protect RPC to submit transactions privately
3. **Public Mempool Fallback**: With `useMempool=true`, transactions can be sent to public mempool when needed

## Configuration

### Basic Setup

Add to your `.env` file:

```env
FLASHBOTS_ENABLE_MEMPOOL=true
FLASHBOTS_PROTECT_RPC_URL=https://rpc.flashbots.net?useMempool=true
```

### Advanced Setup with Builders

You can customize the Flashbots RPC URL with specific builders:

```env
FLASHBOTS_PROTECT_RPC_URL=https://rpc.flashbots.net?builder=f1b.io&builder=rsync&builder=beaverbuild.org&builder=builder0x69&builder=Titan&builder=EigenPhi&builder=boba-builder&builder=Gambit+Labs&builder=payload&builder=Loki&builder=BuildAI&builder=JetBuilder&builder=tbuilder&builder=penguinbuild&builder=bobthebuilder&builder=BTCS&builder=bloXroute&builder=Blockbeelder&builder=Quasar&builder=Eureka&useMempool=true&hint=default_logs&refund=0x47f9018d3119b6c23538ba932f99e2a966bab52c%3A90&originId=flashbots
```

## useMempool Parameter

The `useMempool=true` parameter enables public mempool fallback:

- **When enabled**: Transactions are sent to public mempool if:
  1. The next block proposer doesn't run MEV-Boost (~10% of blocks)
  2. Transaction hasn't been included for 25 blocks (low priority fee transactions)

- **Benefits**: Improves inclusion likelihood for transactions that might otherwise wait
- **Trade-offs**: Reduces privacy and MEV refunds

## Monitoring Features

### Real-time Transaction Detection
- Polls mempool every 2 seconds (configurable)
- Detects new pending transactions
- Tracks up to 1,000 recent transactions in buffer
- Maintains known transaction set (max 10,000)

### Metrics
- Transactions detected count
- Polling latency
- Error rate
- Buffer size

## MEV Protection

### Submitting Protected Transactions

Use Flashbots Protect RPC to submit MEV-protected transactions:

```typescript
import { getFlashbotsMempoolMonitor } from "@/lib/flashbots-mempool-monitor"

const monitor = getFlashbotsMempoolMonitor()
if (monitor) {
  const txHash = await monitor.submitProtectedTransaction({
    from: "0x...",
    to: "0x...",
    value: "0x0",
    data: "0x...",
    gas: "0x5208",
    gasPrice: "0x...",
  })
}
```

### Integration with MEV Protector

The MEV Protector automatically uses Flashbots mempool monitoring to:
- Detect front-running attempts
- Identify sandwich attacks
- Monitor arbitrage opportunities
- Assess MEV risks

## RPC Methods

### Primary Method: txpool_content
- Most efficient for mempool monitoring
- Returns all pending and queued transactions
- Not supported by all RPC providers

### Fallback Method: eth_getBlockByNumber
- Uses "pending" block parameter
- Works with most RPC providers
- Less efficient but more compatible

## Troubleshooting

### Mempool Monitoring Not Starting

1. Check environment variables:
   ```bash
   echo $FLASHBOTS_ENABLE_MEMPOOL
   echo $FLASHBOTS_PROTECT_RPC_URL
   ```

2. Verify URL format:
   - Must include `useMempool=true` for mempool access
   - URL should be properly encoded
   - Check for typos in builder names

3. Check console logs:
   - Look for `[Flashbots Mempool] Starting monitoring...`
   - Check for error messages

### RPC Method Not Supported

If `txpool_content` is not supported:
- Monitor automatically falls back to `eth_getBlockByNumber`
- This is less efficient but works with most providers
- Check console for fallback messages

### High Memory Usage

- Reduce buffer size in code (default: 1000 transactions)
- Increase polling interval (default: 2000ms)
- Limit known transaction set (default: 10,000)

### No Transactions Detected

- Verify RPC endpoint is accessible
- Check network connectivity
- Ensure `useMempool=true` is set
- Try a different RPC provider as fallback

## Performance Tuning

### Polling Interval
- Default: 2000ms (2 seconds)
- Lower = more frequent updates, higher CPU usage
- Higher = less frequent updates, lower CPU usage
- Recommended: 1000-5000ms

### Transaction Buffer
- Default: 1000 transactions
- Larger = more history, higher memory usage
- Smaller = less history, lower memory usage
- Recommended: 500-2000 transactions

### Known Transaction Set
- Default: 10,000 transactions
- Tracks seen transactions to avoid duplicates
- Automatically cleaned when limit exceeded
- Recommended: 5,000-20,000 transactions

## Security Considerations

1. **Privacy**: With `useMempool=true`, transactions may be visible in public mempool
2. **MEV Refunds**: Public mempool transactions don't receive MEV refunds
3. **Cancellation**: All cancellations are forwarded to public mempool when enabled
4. **Rate Limiting**: Be mindful of RPC rate limits when polling frequently

## Best Practices

1. **Use Flashbots for sensitive transactions**: Protect high-value transactions from MEV
2. **Monitor mempool for arbitrage**: Detect opportunities in real-time
3. **Adjust polling based on needs**: Balance between latency and resource usage
4. **Handle errors gracefully**: Implement fallback mechanisms
5. **Monitor metrics**: Track performance and adjust configuration

## API Reference

### FlashbotsMempoolMonitor

```typescript
class FlashbotsMempoolMonitor {
  start(): void
  stop(): void
  getRecentMempoolTxs(limit?: number): MempoolEvent[]
  getMetrics(): Metrics
  submitProtectedTransaction(txData: TransactionData): Promise<string>
}
```

### Events

- `mempool-tx`: Emitted when new transaction is detected
- `error`: Emitted when polling error occurs

## Additional Resources

- [Flashbots Documentation](https://docs.flashbots.net/)
- [Flashbots Protect RPC](https://docs.flashbots.net/flashbots-protect/rpc/overview)
- [MEV Protection Guide](https://docs.flashbots.net/flashbots-protect/users)

