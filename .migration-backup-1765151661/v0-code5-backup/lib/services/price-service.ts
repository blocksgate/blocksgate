import { EventEmitter } from "events";

export class PriceService extends EventEmitter {
  private prices: Map<string, number> = new Map();
  private subscriptions: Map<string, Set<(price: number) => void>> = new Map();

  async getPrice(market: string): Promise<number> {
    return this.prices.get(market) || 0;
  }

  subscribe(market: string, callback: (price: number) => void): void {
    if (!this.subscriptions.has(market)) {
      this.subscriptions.set(market, new Set());
    }
    this.subscriptions.get(market)?.add(callback);
  }

  unsubscribe(market: string, callback?: (price: number) => void): void {
    if (callback) {
      this.subscriptions.get(market)?.delete(callback);
    } else {
      this.subscriptions.delete(market);
    }
  }

  updatePrice(market: string, price: number): void {
    this.prices.set(market, price);
    this.subscriptions.get(market)?.forEach(callback => callback(price));
  }
}