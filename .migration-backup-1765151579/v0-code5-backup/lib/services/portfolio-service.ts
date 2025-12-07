export interface Portfolio {
  userId: string;
  equity: number;
  positions: Map<string, PortfolioPosition>;
  lastUpdate: Date;
}

export interface PortfolioPosition {
  market: string;
  size: number;
  averagePrice: number;
  unrealizedPnl: number;
}

export class PortfolioService {
  private portfolios: Map<string, Portfolio> = new Map();

  async getEquity(userId: string): Promise<number> {
    return this.portfolios.get(userId)?.equity || 0;
  }

  async getPortfolio(userId: string): Promise<Portfolio | undefined> {
    return this.portfolios.get(userId);
  }

  async updatePortfolio(userId: string, update: Partial<Portfolio>): Promise<void> {
    let portfolio = this.portfolios.get(userId);
    if (!portfolio) {
      portfolio = {
        userId,
        equity: 0,
        positions: new Map(),
        lastUpdate: new Date()
      };
      this.portfolios.set(userId, portfolio);
    }

    Object.assign(portfolio, update, { lastUpdate: new Date() });
  }
}