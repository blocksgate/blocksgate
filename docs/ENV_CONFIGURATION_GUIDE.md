# Environment Variables Configuration Guide

## Quick Setup

### 1. Create Your `.env.local` File

```bash
# Copy the example file
cp .env.example .env.local
```

### 2. Required Variables (Minimum Setup)

For the platform to work, you **MUST** have:

```bash
# At least one RPC provider
ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_ALCHEMY_KEY=your_alchemy_key

# 0x Protocol for swaps
NEXT_PUBLIC_0X_API_KEY=your_0x_key
```

---

## Detailed Configuration

### 🔑 **1. RPC Providers** (REQUIRED)

You need at least one RPC provider for blockchain access.

#### Option A: Alchemy (Recommended)
```bash
ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_ALCHEMY_KEY=your_alchemy_api_key
```

**Get your key:**
1. Go to https://dashboard.alchemy.com/
2. Sign up for free account
3. Create a new app
4. Copy the API key

#### Option B: Infura (Alternative)
```bash
INFURA_API_KEY=your_infura_api_key
NEXT_PUBLIC_INFURA_KEY=your_infura_api_key
```

**Get your key:**
1. Go to https://infura.io/dashboard
2. Sign up for free account
3. Create a new project
4. Copy the API key

---

### 💱 **2. 0x Protocol** (REQUIRED for Swaps)

```bash
NEXT_PUBLIC_0X_API_KEY=your_0x_api_key
```

**Get your key:**
1. Go to https://0x.org/docs/introduction/getting-started
2. Sign up for free account
3. Generate API key
4. Copy the key

**Without this key:**
- Swap quotes will use price-based estimation
- Still functional but not optimal rates

---

### 💾 **3. Supabase** (OPTIONAL - for persistent storage)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Get your credentials:**
1. Go to https://app.supabase.com/
2. Create a new project
3. Go to Settings → API
4. Copy the URL and anon/public key

**Benefits:**
- Persistent trade history
- Portfolio tracking across devices
- User profiles
- Cross-device sync

**Without Supabase:**
- Platform still works
- Wallet-only mode
- No persistent data

---

### 🔗 **4. WalletConnect** (OPTIONAL)

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

**Get your project ID:**
1. Go to https://cloud.walletconnect.com/
2. Create a new project
3. Copy the Project ID

**Benefits:**
- Mobile wallet support
- More wallet options
- QR code connection

**Without WalletConnect:**
- MetaMask still works
- Demo mode available

---

### 📊 **5. CoinGecko** (OPTIONAL)

```bash
COINGECKO_API_KEY=your_coingecko_api_key
```

**Free tier:**
- No API key needed
- Rate limited to 10-50 calls/minute
- Sufficient for most use cases

**Pro tier:**
- Get from https://www.coingecko.com/en/api/pricing
- Higher rate limits
- Better for production

---

## Complete `.env.local` Example

Here's a complete example with all variables:

```bash
# =============================================================================
# REQUIRED - Minimum Configuration
# =============================================================================

# RPC Provider (Choose one or both)
ALCHEMY_API_KEY=ak_abc123def456ghi789
NEXT_PUBLIC_ALCHEMY_KEY=ak_abc123def456ghi789

# 0x Protocol
NEXT_PUBLIC_0X_API_KEY=0x_abc123def456

# =============================================================================
# OPTIONAL - Enhanced Features
# =============================================================================

# Supabase (for persistent storage)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123def456ghi789

# CoinGecko Pro (optional)
COINGECKO_API_KEY=CG-abc123def456

# =============================================================================
# APPLICATION SETTINGS
# =============================================================================

NODE_ENV=development
NEXT_PUBLIC_API_URL=
```

---

## Verification

### Check if your configuration is working:

1. **Start the development server:**
```bash
npm run dev
```

2. **Check the console for:**
- ✅ No "missing environment variable" warnings
- ✅ Successful RPC connection
- ✅ Price feeds loading

3. **Test functionality:**
- Connect MetaMask wallet
- View your ETH balance
- See live ETH price
- Try getting a swap quote

---

## Troubleshooting

### Issue: "Failed to fetch price"
**Solution:** Check if CoinGecko API is accessible. Price will show as 0 but won't crash.

### Issue: "Failed to fetch quote"
**Solution:** 
- Verify `NEXT_PUBLIC_0X_API_KEY` is set correctly
- Check 0x API key is active
- Fallback will use price-based estimation

### Issue: "Cannot read balance"
**Solution:**
- Verify `ALCHEMY_API_KEY` or `INFURA_API_KEY` is set
- Check RPC provider is working
- MetaMask must be connected

### Issue: "Unauthorized" errors
**Solution:**
- Check cookies are enabled
- Verify wallet is connected
- For Supabase features, check Supabase keys are correct

---

## Security Best Practices

### ✅ DO:
- Use `.env.local` for local development
- Use `.env.production` for production
- Keep `.env.example` with dummy values
- Add `.env.local` to `.gitignore`

### ❌ DON'T:
- Commit `.env.local` to git
- Share your API keys publicly
- Use production keys in development
- Expose sensitive keys in `NEXT_PUBLIC_*` variables

---

## Environment Variable Priority

Next.js loads environment variables in this order (highest priority first):

1. `.env.local` (loaded in all environments except test)
2. `.env.development` (loaded in development)
3. `.env.production` (loaded in production)
4. `.env` (loaded in all environments)

**Recommendation:** Use `.env.local` for all your actual keys.

---

## Quick Reference

| Variable | Required | Purpose | Get From |
|----------|----------|---------|----------|
| `ALCHEMY_API_KEY` | ✅ Yes* | Blockchain access | alchemy.com |
| `NEXT_PUBLIC_0X_API_KEY` | ✅ Yes | Swap quotes | 0x.org |
| `NEXT_PUBLIC_SUPABASE_URL` | ⚠️ Optional | Persistent storage | supabase.com |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚠️ Optional | Database access | supabase.com |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ⚠️ Optional | Mobile wallets | walletconnect.com |
| `COINGECKO_API_KEY` | ⚠️ Optional | Better price data | coingecko.com |

*At least one RPC provider (Alchemy OR Infura) is required

---

## Need Help?

1. **Check the console** for specific error messages
2. **Verify API keys** are active and have correct permissions
3. **Test each service** individually
4. **Check rate limits** on free tiers

---

## Production Deployment

For production (Vercel, Netlify, etc.):

1. Add environment variables in your hosting dashboard
2. Use production-grade API keys
3. Enable rate limiting
4. Monitor API usage
5. Set up error tracking

**Vercel Example:**
```
Project Settings → Environment Variables → Add
Name: ALCHEMY_API_KEY
Value: your_production_key
Environment: Production
```

---

**Your platform is now configured and ready to use!** 🚀

