import { EventEmitter } from "events";
import {
  StrategyConfig,
  Position,
  IndicatorConfig,
  RiskParameters,
  Rule
} from "./types";
import { PriceService } from "../services/price-service";
import { OrderService } from "../services/order-service";
import { PortfolioService } from "../services/portfolio-service";
import { DatabaseService } from "../services/database-service";

interface MarketData {
  values: number[];
  lastUpdate: Date;
}

interface Indicator {
  id: string;
  type: string;
  parameters: Record<string, number | string>;
  marketData: Map<string, MarketData>;
  value?: number;
  previous?: number;
}

export class StrategyEngine extends EventEmitter {
  private strategies: Map<string, StrategyState> = new Map();
  private priceService: PriceService;
  private orderService: OrderService;
  private portfolioService: PortfolioService;
  private dbService: DatabaseService;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(
    priceService: PriceService,
    orderService: OrderService,
    portfolioService: PortfolioService,
    dbService: DatabaseService
  ) {
    super();
    this.priceService = priceService;
    this.orderService = orderService;
    this.portfolioService = portfolioService;
    this.dbService = dbService;
    this.startUpdateCycle();
  }

  // Strategy Execution
  async executeStrategy(config: StrategyConfig, userId: string): Promise<void> {
    if (this.strategies.has(config.id)) {
      throw new Error("Strategy already running");
    }

    const state = await this.initializeStrategyState(config, userId);
    this.strategies.set(config.id, state);
    await this.persistStrategyState(config.id, state);

    // Subscribe to market data
    for (const market of config.markets) {
      this.priceService.subscribe(market, (price) => 
        this.handlePriceUpdate(config.id, market, price)
      );
    }

    this.emit("strategy:started", { strategyId: config.id, userId });
  }

  private async handlePriceUpdate(
    strategyId: string,
    market: string,
    price: number
  ): Promise<void> {
    const state = this.strategies.get(strategyId);
    if (!state || !state.active) return;

    try {
      // Update indicators
      this.updateIndicators(state, market, price);

      // Check trading hours
      if (!this.isWithinTradingHours(state.config)) {
        return;
      }

      // Position management
      if (!state.positions.has(market)) {
        await this.checkEntryConditions(state, market, price);
      } else {
        await this.checkExitConditions(state, market, price);
      }

      // Risk monitoring
      await this.monitorRisk(state);

      // Update and persist state
      state.lastUpdate = new Date();
      await this.persistStrategyState(strategyId, state);

    } catch (error) {
      console.error("Strategy execution error:", error);
      this.emit("strategy:error", {
        strategyId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Indicator Management
  private updateIndicators(
    state: StrategyState,
    market: string,
    price: number
  ): void {
    for (const [id, indicator] of state.indicators) {
      const data = this.getMarketData(indicator, market);
      data.values.push(price);
      data.lastUpdate = new Date();

      const maxPeriod = this.getMaxPeriod(indicator);
      if (data.values.length > maxPeriod) {
        data.values.shift();
      }

      indicator.previous = indicator.value;

      switch (indicator.type) {
        case "SMA":
          this.updateSMA(indicator, market);
          break;
        case "RSI":
          this.updateRSI(indicator, market);
          break;
      }
    }
  }

  private getMarketData(indicator: Indicator, market: string): MarketData {
    if (!indicator.marketData.has(market)) {
      indicator.marketData.set(market, {
        values: [],
        lastUpdate: new Date()
      });
    }
    return indicator.marketData.get(market)!;
  }

  private getMaxPeriod(indicator: Indicator): number {
    switch (indicator.type) {
      case "SMA":
        return Number(indicator.parameters.period) || 14;
      case "RSI":
        return Number(indicator.parameters.period) || 14;
      default:
        return 100; // Default max period
    }
  }

  private updateSMA(indicator: Indicator, market: string): void {
    const data = this.getMarketData(indicator, market);
    if (data.values.length >= Number(indicator.parameters.period)) {
      indicator.value = data.values.reduce((sum: number, val: number) => 
        sum + val, 0) / data.values.length;
    }
  }

  private updateRSI(indicator: Indicator, market: string): void {
    const data = this.getMarketData(indicator, market);
    const period = Number(indicator.parameters.period) || 14;

    if (data.values.length >= period) {
      const changes: number[] = [];
      for (let i = 1; i < data.values.length; i++) {
        changes.push(data.values[i] - data.values[i - 1]);
      }

      const gains = changes.map(c => Math.max(c, 0));
      const losses = changes.map(c => Math.abs(Math.min(c, 0)));

      const avgGain = gains.reduce((sum: number, g: number) => 
        sum + g, 0) / period;
      const avgLoss = losses.reduce((sum: number, l: number) => 
        sum + l, 0) / period;

      indicator.value = 100 - (100 / (1 + (avgGain / (avgLoss || 1))));
    }
  }

  // Position Management
  private async checkEntryConditions(
    state: StrategyState,
    market: string,
    price: number
  ): Promise<void> {
    if (this.evaluateRules(state.config.entryRules, state.indicators)) {
      await this.enterPosition(state, market, price);
    }
  }

  private async checkExitConditions(
    state: StrategyState,
    market: string,
    price: number
  ): Promise<void> {
    if (this.evaluateRules(state.config.exitRules, state.indicators)) {
      await this.exitPosition(state, market, price);
    }
  }

  private evaluateRules(rules: Rule[], indicators: Map<string, Indicator>): boolean {
    return rules.every(rule => {
      const indicator = indicators.get(rule.indicatorId);
      if (!indicator?.value) return false;

      switch (rule.condition) {
        case "GREATER_THAN":
          return indicator.value > rule.value;
        case "LESS_THAN":
          return indicator.value < rule.value;
        case "EQUALS":
          return Math.abs(indicator.value - rule.value) < 0.0001;
        case "CROSSES_ABOVE":
          return indicator.value > rule.value && 
                 (indicator.previous || 0) <= rule.value;
        case "CROSSES_BELOW":
          return indicator.value < rule.value && 
                 (indicator.previous || 0) >= rule.value;
        case "IN_RANGE":
          return indicator.value >= rule.value && 
                 indicator.value <= (rule.secondaryValue || rule.value);
        default:
          return false;
      }
    });
  }

  private async enterPosition(
    state: StrategyState,
    market: string,
    price: number
  ): Promise<void> {
    const size = this.calculatePositionSize(state, price);
    const order = await this.orderService.placeOrder({
      userId: state.userId,
      market,
      side: "buy",
      size,
      price,
      type: "MARKET"
    });

    state.positions.set(market, {
      size,
      entryPrice: price,
      entryTime: new Date(),
      orderId: order.id
    });

    this.emit("position:opened", {
      strategyId: state.config.id,
      market,
      size,
      price
    });
  }

  private async exitPosition(
    state: StrategyState,
    market: string,
    price: number
  ): Promise<void> {
    const position = state.positions.get(market);
    if (!position) return;

    await this.orderService.placeOrder({
      userId: state.userId,
      market,
      side: "sell",
      size: position.size,
      price,
      type: "MARKET"
    });

    const pnl = (price - position.entryPrice) * position.size;
    state.positions.delete(market);
    state.equity += pnl;

    this.emit("position:closed", {
      strategyId: state.config.id,
      market,
      pnl,
      roi: pnl / (position.entryPrice * position.size)
    });
  }

  // Risk Management
  private async monitorRisk(state: StrategyState): Promise<void> {
    const { maxDrawdown, maxPositionSize } = state.config.riskParameters;
    
    // Check drawdown
    const drawdown = (state.peakEquity - state.equity) / state.peakEquity;
    if (drawdown > maxDrawdown) {
      await this.stopStrategy(state.config.id, "MAX_DRAWDOWN_EXCEEDED");
      return;
    }

    // Check position sizes
    for (const [market, position] of state.positions) {
      const positionValue = position.size * (await this.priceService.getPrice(market));
      if (positionValue / state.equity > maxPositionSize) {
        await this.exitPosition(state, market, await this.priceService.getPrice(market));
      }
    }

    // Update peak equity
    if (state.equity > state.peakEquity) {
      state.peakEquity = state.equity;
    }
  }

  private calculatePositionSize(state: StrategyState, price: number): number {
    const { riskPerTrade, maxPositionSize } = state.config.riskParameters;
    const riskAmount = state.equity * riskPerTrade;
    const size = riskAmount / price;
    return Math.min(size, state.equity * maxPositionSize / price);
  }

  // State Management
  private async initializeStrategyState(
    config: StrategyConfig,
    userId: string
  ): Promise<StrategyState> {
    const equity = await this.portfolioService.getEquity(userId);
    
    return {
      config,
      userId,
      active: true,
      equity,
      peakEquity: equity,
      positions: new Map<string, Position>(),
      indicators: this.initializeIndicators(config.indicators),
      lastUpdate: new Date()
    };
  }

  private initializeIndicators(
    configs: IndicatorConfig[]
  ): Map<string, Indicator> {
    const indicators = new Map<string, Indicator>();
    
    for (const config of configs) {
      indicators.set(config.id, {
        ...config,
        marketData: new Map<string, MarketData>()
      });
    }

    return indicators;
  }

  private isWithinTradingHours(config: StrategyConfig): boolean {
    if (!config.tradingHours) return true;

    const now = new Date();
    const [startHours, startMinutes] = config.tradingHours.start.split(":").map(Number);
    const [endHours, endMinutes] = config.tradingHours.end.split(":").map(Number);

    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;

    return currentMinutes >= startMinutesTotal && currentMinutes <= endMinutesTotal;
  }

  private async persistStrategyState(
    strategyId: string,
    state: StrategyState
  ): Promise<void> {
    await this.dbService.saveStrategyState({
      strategyId,
      userId: state.userId,
      equity: state.equity,
      peakEquity: state.peakEquity,
      positions: Array.from(state.positions.entries()),
      lastUpdate: state.lastUpdate,
      active: state.active
    });
  }

  // Lifecycle Management
  private startUpdateCycle(): void {
    this.updateInterval = setInterval(() => this.updateAllStrategies(), 5000);
  }

  private async updateAllStrategies(): Promise<void> {
    for (const [strategyId, state] of this.strategies) {
      if (!state.active) continue;

      try {
        state.equity = await this.portfolioService.getEquity(state.userId);
        await this.monitorRisk(state);
        await this.persistStrategyState(strategyId, state);
      } catch (error) {
        console.error(`Strategy update error (${strategyId}):`, error);
      }
    }
  }

  async stopStrategy(strategyId: string, reason?: string): Promise<void> {
    const state = this.strategies.get(strategyId);
    if (!state) return;

    // Close all positions
    for (const [market, position] of state.positions) {
      await this.exitPosition(state, market, await this.priceService.getPrice(market));
    }

    // Cleanup
    state.active = false;
    await this.persistStrategyState(strategyId, state);
    this.strategies.delete(strategyId);

    // Unsubscribe from price updates
    for (const market of state.config.markets) {
      this.priceService.unsubscribe(market);
    }

    this.emit("strategy:stopped", {
      strategyId,
      reason: reason || "USER_REQUESTED"
    });
  }

  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Stop all strategies
    for (const strategyId of this.strategies.keys()) {
      this.stopStrategy(strategyId, "SERVICE_SHUTDOWN");
    }
  }
}

interface StrategyState {
  config: StrategyConfig;
  userId: string;
  active: boolean;
  equity: number;
  peakEquity: number;
  positions: Map<string, Position>;
  indicators: Map<string, any>;
  lastUpdate: Date;
}
