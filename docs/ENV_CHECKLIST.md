# .env Configuration Checklist

## ✅ Required Variables

### Supabase (Required)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### WalletConnect (Required)
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## ⚠️ Recommended Variables

### 0x Protocol (For Swaps)
```env
ZX_API_KEY=your_0x_api_key
# OR
NEXT_PUBLIC_0X_API_KEY=your_0x_api_key
```

### RPC Providers (At least one recommended)
```env
ALCHEMY_API_KEY=your_alchemy_key
INFURA_API_KEY=your_infura_key
QUICKNODE_API_KEY=your_quicknode_key
```

## 🚀 Flashbots Mempool Monitoring (New!)

### Basic Configuration
```env
FLASHBOTS_ENABLE_MEMPOOL=true
FLASHBOTS_PROTECT_RPC_URL=https://rpc.flashbots.net?useMempool=true
```

### Advanced Configuration (With All Builders)
```env
FLASHBOTS_ENABLE_MEMPOOL=true
FLASHBOTS_PROTECT_RPC_URL=https://rpc.flashbots.net?builder=f1b.io&builder=rsync&builder=beaverbuild.org&builder=builder0x69&builder=Titan&builder=EigenPhi&builder=boba-builder&builder=Gambit+Labs&builder=payload&builder=Loki&builder=BuildAI&builder=JetBuilder&builder=tbuilder&builder=penguinbuild&builder=bobthebuilder&builder=BTCS&builder=bloXroute&builder=Blockbeelder&builder=Quasar&builder=Eureka&useMempool=true&hint=default_logs&refund=0x47f9018d3119b6c23538ba932f99e2a966bab52c%3A90&originId=flashbots
```

## 📋 Complete .env Template

```env
# ============================================
# SUPABASE CONFIGURATION (Required)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================
# WALLETCONNECT (Required)
# ============================================
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# ============================================
# 0X PROTOCOL (Recommended for Swaps)
# ============================================
ZX_API_KEY=your_0x_api_key_here
# OR use NEXT_PUBLIC_0X_API_KEY for client-side

# ============================================
# RPC PROVIDERS (At least one recommended)
# ============================================
ALCHEMY_API_KEY=your_alchemy_api_key
INFURA_API_KEY=your_infura_api_key
QUICKNODE_API_KEY=your_quicknode_api_key

# ============================================
# FLASHBOTS MEMPOOL MONITORING (New!)
# ============================================
# Enable Flashbots mempool monitoring
FLASHBOTS_ENABLE_MEMPOOL=true

# Flashbots Protect RPC URL with useMempool parameter
# Basic version:
FLASHBOTS_PROTECT_RPC_URL=https://rpc.flashbots.net?useMempool=true

# Advanced version with all builders (recommended):
# FLASHBOTS_PROTECT_RPC_URL=https://rpc.flashbots.net?builder=f1b.io&builder=rsync&builder=beaverbuild.org&builder=builder0x69&builder=Titan&builder=EigenPhi&builder=boba-builder&builder=Gambit+Labs&builder=payload&builder=Loki&builder=BuildAI&builder=JetBuilder&builder=tbuilder&builder=penguinbuild&builder=bobthebuilder&builder=BTCS&builder=bloXroute&builder=Blockbeelder&builder=Quasar&builder=Eureka&useMempool=true&hint=default_logs&refund=0x47f9018d3119b6c23538ba932f99e2a966bab52c%3A90&originId=flashbots

# Optional: Custom mempool RPC (if different from protect RPC)
# FLASHBOTS_MEMPOOL_RPC_URL=https://your-custom-node-url
```

## 🔍 Verification Steps

1. **Check Required Variables**:
   ```bash
   # Check if required variables are set
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   echo $NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
   ```

2. **Check Flashbots Configuration**:
   ```bash
   echo $FLASHBOTS_ENABLE_MEMPOOL
   echo $FLASHBOTS_PROTECT_RPC_URL
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Verify Mempool Monitoring**:
   - Look for console message: `[Flashbots Mempool] Starting monitoring...`
   - Check for: `[WebSocket Monitor] Flashbots mempool monitoring enabled`
   - Monitor should start detecting transactions within 2-5 seconds

## ⚡ Quick Start

1. Copy the template above to your `.env` file
2. Fill in your actual API keys and URLs
3. For Flashbots, use the advanced URL with all builders (commented in template)
4. Restart your development server
5. Check console for initialization messages

## 🐛 Common Issues

### Mempool Monitoring Not Starting
- **Issue**: No console message about Flashbots monitoring
- **Solution**: Check that `FLASHBOTS_ENABLE_MEMPOOL=true` and `FLASHBOTS_PROTECT_RPC_URL` is set

### RPC Method Not Supported
- **Issue**: Console shows "method not supported" errors
- **Solution**: This is normal - monitor automatically falls back to compatible method

### No Transactions Detected
- **Issue**: Mempool monitor running but no transactions detected
- **Solution**: 
  - Verify RPC endpoint is accessible
  - Check network connectivity
  - Ensure `useMempool=true` is in the URL
  - Wait a few seconds - transactions may take time to appear

## 📚 Additional Documentation

- See `ENV_CONFIGURATION.md` for detailed configuration guide
- See `FLASHBOTS_SETUP.md` for Flashbots-specific documentation
- See `lib/config.ts` for configuration structure

