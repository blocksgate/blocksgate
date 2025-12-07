export interface StrategyState {
  strategyId: string;
  userId: string;
  equity: number;
  peakEquity: number;
  positions: [string, any][]; // Market to Position mapping
  lastUpdate: Date;
  active: boolean;
}

export class DatabaseService {
  private strategyStates: Map<string, StrategyState> = new Map();

  async saveStrategyState(state: StrategyState): Promise<void> {
    this.strategyStates.set(state.strategyId, { ...state });
  }

  async getStrategyState(strategyId: string): Promise<StrategyState | undefined> {
    return this.strategyStates.get(strategyId);
  }

  async deleteStrategyState(strategyId: string): Promise<boolean> {
    return this.strategyStates.delete(strategyId);
  }

  async listStrategyStates(userId: string): Promise<StrategyState[]> {
    return Array.from(this.strategyStates.values())
      .filter(state => state.userId === userId);
  }
}