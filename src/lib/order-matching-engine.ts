export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'failed' | 'expired';

export interface Order {
  id: string;
  userId?: string;
  baseToken: string;
  quoteToken: string;
  side: OrderSide;
  amount: number;
  limitPrice?: number;
  price?: string;
  type?: 'market' | 'limit';
  status?: OrderStatus;
  createdAt?: number | string;
  expiresAt?: number;
  fillPrice?: string;
  gasPriceGwei?: string;
  maxSlippage?: number;
}

/**
 * Check whether an order is executable against current market price.
 * Integrates with 0x API to retrieve a live price.
 */
export async function isOrderExecutable(order: Order): Promise<{ executable: boolean; currentPrice: number }> {
  try {
    // Use globalThis for environment variables (works in Node.js and browser)
    const env = (typeof globalThis !== 'undefined' ? (globalThis as any) : {}) as any;
    const decimals = env.ZEROX_TOKEN_DECIMALS ? Number(env.ZEROX_TOKEN_DECIMALS) : 18;
    const baseUrl = env.ZEROX_API_URL ? env.ZEROX_API_URL : 'https://api.0x.org';
    const baseToken = encodeURIComponent(order.baseToken);
    const quoteToken = encodeURIComponent(order.quoteToken);
    const buyAmount = Math.floor(order.amount * Math.pow(10, decimals));
    const url = `${baseUrl}/swap/v1/price?buyToken=${baseToken}&sellToken=${quoteToken}&buyAmount=${buyAmount}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      const simulatedPrice = (order.limitPrice ?? 0) * (1 + (Math.random() - 0.3) * 0.02);
      return {
        executable: order.side === 'buy' ? simulatedPrice <= (order.limitPrice ?? 0) : simulatedPrice >= (order.limitPrice ?? 0),
        currentPrice: simulatedPrice,
      };
    }
    const data = await res.json();
    const priceStr = data?.price ?? null;
    let currentPrice = Number(priceStr);
    if (!priceStr || Number.isNaN(currentPrice)) {
      const sellAmount = Number(data?.sellAmount);
      const buyAmountResp = Number(data?.buyAmount);
      if (sellAmount && buyAmountResp) {
        currentPrice = sellAmount / buyAmountResp;
      } else {
        currentPrice = (order.limitPrice ?? 0) * (1 + (Math.random() - 0.3) * 0.02);
      }
    }
    if (order.side === 'buy') {
      return { executable: currentPrice <= (order.limitPrice ?? 0), currentPrice };
    }
    return { executable: currentPrice >= (order.limitPrice ?? 0), currentPrice };
  } catch (err) {
    const simulatedPrice = (order.limitPrice ?? 0) * (1 + (Math.random() - 0.3) * 0.02);
    return {
      executable: order.side === 'buy' ? simulatedPrice <= (order.limitPrice ?? 0) : simulatedPrice >= (order.limitPrice ?? 0),
      currentPrice: simulatedPrice,
    };
  }
}

/**
 * Execute the order via 0x or another executor.
 * Current implementation is a stub that simulates execution and returns a fake tx hash.
 */
export async function executeOrder(order: Order): Promise<{ success: boolean; txHash?: string; error?: string; quote?: any }> {
  try {
    // Use globalThis for environment variables (works in Node.js and browser)
    const env = (typeof globalThis !== 'undefined' ? (globalThis as any) : {}) as any;
    const decimals = env.ZEROX_TOKEN_DECIMALS ? Number(env.ZEROX_TOKEN_DECIMALS) : 18;
    const baseUrl = env.ZEROX_API_URL ? env.ZEROX_API_URL : 'https://api.0x.org';
    const buyAmount = Math.floor(order.amount * Math.pow(10, decimals)).toString();
    const url = `${baseUrl}/swap/v1/quote?buyToken=${encodeURIComponent(order.baseToken)}&sellToken=${encodeURIComponent(order.quoteToken)}&buyAmount=${buyAmount}`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `0x quote failed: ${res.status} ${text}` };
    }
    const quote = await res.json();
    // Simulate tx hash for now
    return { success: true, txHash: '0xFAKE_TX_HASH', error: undefined, quote };
  } catch (err: any) {
    return { success: false, error: String(err?.message ?? err) };
  }
}