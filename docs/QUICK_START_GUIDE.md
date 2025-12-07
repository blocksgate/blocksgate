# Quick Start Guide - DeFi Trading Platform

## 🚀 Getting Started

Your database is ready! Follow these steps to start using the platform.

## 1. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## 2. Create Your First User

### Option A: Email Sign Up
1. Go to `/auth/sign-up`
2. Enter your email and password
3. Verify your email
4. Sign in

### Option B: Wallet Connection
1. Connect your MetaMask wallet
2. Sign the authentication message
3. Start trading immediately

## 3. Test Core Features

### Swap Tokens
1. Go to `/dashboard/swap`
2. Select tokens (e.g., ETH → USDC)
3. Enter amount
4. Get quote
5. Execute swap

### Create Limit Order
1. Go to `/dashboard/orders`
2. Click "Create Limit Order"
3. Set price target
4. Set expiration
5. Submit order

### View Portfolio
1. Go to `/dashboard/portfolio`
2. View your holdings
3. Check P&L
4. View transaction history

### Arbitrage Opportunities
1. Go to `/dashboard/arbitrage`
2. View real-time opportunities
3. Check profit potential
4. Execute arbitrage trades

### Trading Bots
1. Go to `/dashboard/trading-bot`
2. Create a bot strategy (DCA, Grid, Momentum)
3. Configure parameters
4. Activate bot

## 4. API Testing

### Test Swap Quote
```bash
curl -X POST http://localhost:3000/api/swap/quote \
  -H "Content-Type: application/json" \
  -d '{
    "sellToken": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    "buyToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "sellAmount": "1000000000000000000",
    "chainId": 1
  }'
```

### Get Arbitrage Opportunities
```bash
curl http://localhost:3000/api/arbitrage/opportunities?chainId=1
```

### Get Bot Strategies
```bash
curl http://localhost:3000/api/bot/strategies \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 5. Environment Variables

Ensure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_WEBSOCKET_URL=your_websocket_url
```

## 6. Database Verification

Run verification anytime:
```bash
npm run migrate:verify
```

## 7. Common Tasks

### Create a Limit Order
```typescript
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tokenIn: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    tokenOut: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    amountIn: '1.0',
    priceTarget: '2500',
    orderType: 'limit',
    chainId: 1
  })
})
```

### Create a Bot Strategy
```typescript
const response = await fetch('/api/bot/strategies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My DCA Bot',
    strategyType: 'dca',
    tokenPair: 'ETH/USDC',
    config: {
      amountPerInterval: 100,
      interval: 3600
    },
    chainId: 1
  })
})
```

### Get Portfolio
```typescript
const response = await fetch('/api/portfolio')
const portfolio = await response.json()
```

## 8. Monitoring

### Check Logs
- Browser console for client-side errors
- Terminal for server-side logs
- Supabase Dashboard for database logs

### Error Tracking
- Sentry dashboard (if configured)
- Application logs
- API error responses

## 9. Troubleshooting

### Issue: "Unauthorized"
- Check authentication token
- Verify user is logged in
- Check RLS policies

### Issue: "Rate limit exceeded"
- Wait a few seconds
- Check rate limit settings
- Use service role key for admin operations

### Issue: "Transaction failed"
- Check wallet connection
- Verify sufficient balance
- Check gas prices
- Review transaction on block explorer

### Issue: "Table not found"
- Run `npm run migrate:verify`
- Check Supabase Dashboard
- Verify migrations were run

## 10. Next Steps

1. **Customize Features**
   - Adjust risk limits
   - Configure notification settings
   - Set up trading bot parameters

2. **Add More Tokens**
   - Update token list
   - Add custom tokens
   - Configure token metadata

3. **Integrate Additional Services**
   - Add more DEX aggregators
   - Integrate additional chains
   - Add more trading strategies

4. **Deploy to Production**
   - Set up production environment
   - Configure production database
   - Set up monitoring
   - Configure error tracking

## Resources

- **Documentation**: See `ARCHITECTURE_AND_FEATURES.md`
- **API Reference**: See `FEATURES.md`
- **Migration Guide**: See `MIGRATION_INSTRUCTIONS.md`
- **Enhancements**: See `ENHANCEMENTS_COMPLETED_V2.md`

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Review documentation
3. Check Supabase logs
4. Verify environment variables
5. Test API endpoints directly

## Congratulations! 🎉

Your DeFi trading platform is ready to use! Start by testing the core features and then customize it to your needs.

