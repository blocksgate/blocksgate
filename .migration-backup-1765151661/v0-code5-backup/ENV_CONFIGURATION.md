# Environment Variables Configuration Guide

This document outlines all environment variables needed for the DeFi trading platform, including Flashbots mempool monitoring.

## Required Variables

### Supabase Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### WalletConnect
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## Optional but Recommended

### 0x Protocol (for swaps)
```env
ZX_API_KEY=your_0x_api_key
# OR
NEXT_PUBLIC_0X_API_KEY=your_0x_api_key
```

### RPC Providers (at least one recommended)
```env
ALCHEMY_API_KEY=your_alchemy_api_key
INFURA_API_KEY=your_infura_api_key
QUICKNODE_API_KEY=your_quicknode_api_key
```

## Flashbots Mempool Monitoring

### Basic Configuration
```env
# Enable Flashbots mempool monitoring (default: true if FLASHBOTS_PROTECT_RPC_URL is set)
FLASHBOTS_ENABLE_MEMPOOL=true

# Flashbots Protect RPC URL with useMempool parameter
FLASHBOTS_PROTECT_RPC_URL=https://rpc.flashbots.net?useMempool=true
```

### Advanced Configuration with Builders
```env
# Custom Flashbots RPC URL with specific builders and parameters
FLASHBOTS_PROTECT_RPC_URL=https://rpc.flashbots.net?builder=f1b.io&builder=rsync&builder=beaverbuild.org&builder=builder0x69&builder=Titan&builder=EigenPhi&builder=boba-builder&builder=Gambit+Labs&builder=payload&builder=Loki&builder=BuildAI&builder=JetBuilder&builder=tbuilder&builder=penguinbuild&builder=bobthebuilder&builder=BTCS&builder=bloXroute&builder=Blockbeelder&builder=Quasar&builder=Eureka&useMempool=true&hint=default_logs&refund=0x47f9018d3119b6c23538ba932f99e2a966bab52c%3A90&originId=flashbots
```

### Optional: Custom Mempool RPC
```env
# Use a different RPC endpoint for mempool monitoring (optional)
# If not set, uses FLASHBOTS_PROTECT_RPC_URL
FLASHBOTS_MEMPOOL_RPC_URL=https://your-custom-node-url
```

## Flashbots Configuration Notes

### useMempool Parameter
- `useMempool=true`: Sends transactions to public mempool when:
  1. The next block proposer doesn't run MEV-Boost (~10% of blocks)
  2. Transaction hasn't been included for 25 blocks
- This improves inclusion likelihood at the expense of privacy and MEV refunds

### Builder Selection
You can specify multiple builders in the URL:
- `builder=f1b.io`
- `builder=rsync`
- `builder=beaverbuild.org`
- etc.

### Transaction Cancellation
When `useMempool=true` is enabled, all cancellations are immediately forwarded to the public mempool, regardless of whether the original transaction was made public.

## Example .env File

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# 0x Protocol
ZX_API_KEY=your_0x_api_key

# RPC Providers
ALCHEMY_API_KEY=your_alchemy_key
INFURA_API_KEY=your_infura_key

# Flashbots
FLASHBOTS_ENABLE_MEMPOOL=true
FLASHBOTS_PROTECT_RPC_URL=https://rpc.flashbots.net?useMempool=true
```

## Verification

After setting up your `.env` file:

1. Restart your development server: `npm run dev`
2. Check the console for initialization messages:
   - `[Flashbots Mempool] Starting monitoring...`
   - `[WebSocket Monitor] Flashbots mempool monitoring enabled`
3. Verify mempool monitoring is working:
   - Check the dashboard for mempool transaction count
   - Monitor should start detecting transactions within 2-5 seconds

## Troubleshooting

### Mempool Monitoring Not Starting
- Check that `FLASHBOTS_ENABLE_MEMPOOL=true` is set
- Verify `FLASHBOTS_PROTECT_RPC_URL` is correctly formatted
- Check console for error messages

### RPC Method Not Supported
- Some RPC providers don't support `txpool_content`
- The monitor will automatically fall back to `eth_getBlockByNumber` with "pending"
- This is less efficient but works with most providers

### High Memory Usage
- The monitor keeps a buffer of recent transactions (max 1000)
- Known transaction set is limited to 10,000 entries
- Adjust `pollingInterval` in code if needed (default: 2000ms)

## Security Notes

- **Never commit `.env` files to version control**
- **Use environment-specific keys** (development, staging, production)
- **Rotate API keys regularly**
- **Flashbots RPC is public** - transactions sent through it are MEV-protected but may be visible in mempool when `useMempool=true`

