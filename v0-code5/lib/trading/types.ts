export interface StrategyConfig {
  id: string;
  name: string;
  description?: string;
  markets: string[];
  indicators: IndicatorConfig[];
  entryRules: Rule[];
  exitRules: Rule[];
  riskParameters: RiskParameters;
  tradingHours?: TradingHours;
}

export interface IndicatorConfig {
  id: string;
  type: IndicatorType;
  parameters: Record<string, number | string>;
}

export type IndicatorType = "SMA" | "RSI" | "MACD" | "Bollinger";

export interface Rule {
  id: string;
  indicatorId: string;
  condition: RuleCondition;
  value: number;
  secondaryValue?: number;
}

export type RuleCondition =
  | "GREATER_THAN"
  | "LESS_THAN"
  | "EQUALS"
  | "CROSSES_ABOVE"
  | "CROSSES_BELOW"
  | "IN_RANGE";

export interface RiskParameters {
  maxDrawdown: number;
  maxPositionSize: number;
  riskPerTrade: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Position {
  size: number;
  entryPrice: number;
  entryTime: Date;
  orderId: string;
}

export interface TradingHours {
  start: string; // Format: "HH:mm"
  end: string;   // Format: "HH:mm"
  timezone?: string;
}