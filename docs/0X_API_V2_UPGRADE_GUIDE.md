# 0x API v2 Upgrade Guide

## Overview

This guide documents the upgrade from 0x API v1 to v2 for full compliance with the latest 0x Protocol infrastructure.

## Changes Made

### 1. Updated `lib/0x-client.ts`

#### Endpoint Changes
- **Before**: `/swap/v1/quote`
- **After**: `/swap/allowance-holder/quote` or `/swap/permit2/quote`

#### Header Changes
- **Added**: `0x-version: v2` header (required for v2 API)
- **Updated**: Always include `0x-api-key` header when API key is configured

#### Parameter Changes
- **Before**: `slippagePercentage` (percentage, e.g., 0.5 for 0.5%)
- **After**: `slippageBps` (basis points, e.g., 50 for 0.5%)
- **Conversion**: `slippageBps = slippagePercentage * 100`

### 2. Response Field Updates

#### New Fields in v2 Response
- `guaranteedPrice`: Guaranteed execution price
- `minimumProtocolFee`: Minimum protocol fee
- `allowanceTarget`: Address to approve tokens to
- `sellTokenToEthRate`: Sell token to ETH exchange rate
- `buyTokenToEthRate`: Buy token to ETH exchange rate

#### Existing Fields (Still Supported)
- `to`: Settlement contract address
- `data`: Transaction calldata
- `value`: ETH value (if native ETH)
- `gas`: Estimated gas
- `gasPrice`: Gas price
- `buyAmount`: Expected output amount
- `sellAmount`: Input amount
- `price`: Exchange rate
- `sources`: DEX sources used

## Migration Checklist

### ✅ Completed
- [x] Updated `lib/0x-client.ts` to use v2 endpoints
- [x] Added `0x-version: v2` header
- [x] Updated slippage parameter to use basis points
- [x] Verified other files already use v2 (`app/actions/0x.ts`, `app/actions/0x-enhanced.ts`)

### ⚠️ Needs Testing
- [ ] Test with real API key
- [ ] Test with different token pairs
- [ ] Test with different chain IDs
- [ ] Test error handling
- [ ] Test slippage tolerance

### 🔄 May Need Updates
- [ ] Update `getPrices()` method if 0x API v2 has different pricing endpoint
- [ ] Update error messages for v2-specific errors
- [ ] Update documentation with v2 examples

## API Endpoint Reference

### Swap Quotes
```
GET /swap/allowance-holder/quote
GET /swap/permit2/quote
```

### Swap Prices
```
GET /swap/allowance-holder/price
GET /swap/permit2/price
```

### Required Headers
```
0x-api-key: <your_api_key>
0x-version: v2
Content-Type: application/json
```

### Required Parameters
```
chainId: number
sellToken: string (token address)
buyToken: string (token address)
sellAmount: string (amount in wei)
taker: string (user address, optional but recommended)
slippageBps: number (0-10000, default: 100)
```

### Optional Parameters
```
recipient: string (receive address)
txOrigin: string (transaction origin, for contracts)
swapFeeRecipient: string (fee recipient)
swapFeeBps: number (fee in basis points)
swapFeeToken: string (fee token address)
excludedSources: string (comma-separated sources to exclude)
sellEntireBalance: boolean (sell entire balance)
```

## Testing

### 1. Test Basic Swap Quote
```typescript
const quote = await zxClient.getQuote(
  1, // chainId
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
  "1000000000", // 1000 USDC (6 decimals)
  0.5 // 0.5% slippage
)
```

### 2. Test Permit2 Quote
```typescript
const quote = await zxClient.getQuote(
  1, // chainId
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
  "1000000000", // 1000 USDC
  0.5, // 0.5% slippage
  "permit2" // method
)
```

### 3. Test Error Handling
```typescript
try {
  const quote = await zxClient.getQuote(1, "0x...", "0x...", "1000000", 0.5)
} catch (error) {
  // Handle v2-specific errors
  if (error.message.includes("no Route matched")) {
    // No route available
  } else if (error.message.includes("403")) {
    // Invalid API key
  } else if (error.message.includes("429")) {
    // Rate limit exceeded
  }
}
```

## Breaking Changes

### 1. Endpoint URLs
- **v1**: `/swap/v1/quote`
- **v2**: `/swap/allowance-holder/quote` or `/swap/permit2/quote`

### 2. Slippage Parameter
- **v1**: `slippagePercentage` (percentage)
- **v2**: `slippageBps` (basis points)

### 3. Required Headers
- **v1**: `0x-api-key` (optional)
- **v2**: `0x-api-key` (required) + `0x-version: v2` (required)

### 4. Response Fields
- **v2**: Includes additional fields like `guaranteedPrice`, `allowanceTarget`, etc.

## Compatibility

### Backward Compatibility
- ❌ **Not backward compatible**: v1 and v2 are separate endpoints
- ✅ **Migration path**: Update code to use v2 endpoints

### Forward Compatibility
- ✅ **Future-proof**: v2 is the current version and will be maintained
- ✅ **New features**: v2 includes new features like Permit2, gasless swaps, etc.

## Resources

- [0x API v2 Documentation](https://0x.org/docs/api)
- [0x API v2 OpenAPI Spec](https://github.com/0xProject/0x-api)
- [0x Settler Contract](https://github.com/0xProject/0x-settler)
- [0x Examples](https://github.com/0xProject/0x-examples)

## Support

For issues or questions:
1. Check 0x API documentation
2. Review error messages
3. Test with 0x API explorer
4. Contact 0x support if needed

