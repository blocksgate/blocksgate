// MEV (Maximal Extractable Value) analysis and detection

export interface MEVRisk {
  type: "sandwich" | "frontrun" | "backrun" | "liquidation" | "slippage"
  riskLevel: "low" | "medium" | "high"
  description: string
  potentialImpact: string
  mitigation: string[]
}

export interface BlockMEVData {
  blockNumber: number
  sandwichAttacks: number
  frontrunAttacks: number
  backrunAttacks: number
  totalMEVExtracted: string
  timestamp: number
}

export interface FlashLoanStrategy {
  id: string
  name: string
  type: "arbitrage" | "liquidation" | "custom"
  flashToken: string
  flashAmount: string
  profitToken: string
  estimatedProfit: string
  estimatedFee: string
  gasEstimate: string
  riskScore: number
  executionPath: string[]
}

export function analyzeMEVRisks(
  gasPrice: number,
  slippage: number,
  tradeSize: string,
  tokenLiquidity: string,
): MEVRisk[] {
  const risks: MEVRisk[] = []

  // Sandwich attack risk
  if (Number.parseFloat(tradeSize) > 100000) {
    risks.push({
      type: "sandwich",
      riskLevel: "high",
      description: "Large trade size makes sandwich attacks more profitable",
      potentialImpact: "-5-10%",
      mitigation: ["Use MEV-resistant relayers", "Split orders across time", "Use private pools"],
    })
  }

  // Slippage risk
  if (slippage < 0.5) {
    risks.push({
      type: "slippage",
      riskLevel: "high",
      description: "Low slippage tolerance increases failed transaction risk",
      potentialImpact: "Gas loss or partial execution",
      mitigation: ["Increase slippage tolerance", "Use limit orders", "Retry on failure"],
    })
  }

  // Gas price impact
  if (gasPrice > 100) {
    risks.push({
      type: "backrun",
      riskLevel: "medium",
      description: "High gas prices make backrun extraction more valuable",
      potentialImpact: "-2-3%",
      mitigation: ["Wait for lower gas prices", "Use optimistic rollups", "Batch transactions"],
    })
  }

  // Liquidation risk (simplified check)
  if (Number.parseFloat(tradeSize) > 500000) {
    risks.push({
      type: "liquidation",
      riskLevel: "medium",
      description: "Large position size increases liquidation vulnerability",
      potentialImpact: "-15% or full loss",
      mitigation: ["Use stop-loss orders", "Reduce leverage", "Diversify positions"],
    })
  }

  return risks
}

export function calculateFlashLoanProfit(
  flashAmount: string,
  arbSpreadPercent: number,
  flashFeePercent = 0.05,
  gasEstimate = "500000",
  gasPrice = 50,
): FlashLoanStrategy {
  const flashAmountNum = Number.parseFloat(flashAmount)
  const flashFee = (flashAmountNum * flashFeePercent) / 100
  const arbProfit = (flashAmountNum * arbSpreadPercent) / 100
  const gasCost = ((Number.parseInt(gasEstimate) * gasPrice) / 1e9) * 2500 // Assuming ~$2500 per ETH

  const netProfit = arbProfit - flashFee - gasCost

  return {
    id: `flash-${Date.now()}`,
    name: "Flash Arbitrage",
    type: "arbitrage",
    flashToken: "0x6b175474e89094c44da98b954eedeac495271d0f",
    flashAmount,
    profitToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    estimatedProfit: Math.max(0, netProfit).toFixed(2),
    estimatedFee: flashFee.toFixed(2),
    gasEstimate,
    riskScore: arbSpreadPercent < 0.2 ? 50 : arbSpreadPercent < 0.5 ? 65 : 80,
    executionPath: ["Borrow from Flash Pool", "Execute Arbitrage", "Repay + Fee", "Collect Profit"],
  }
}

export function generateBlockMEVData(blockNumber: number): BlockMEVData {
  return {
    blockNumber,
    sandwichAttacks: Math.floor(Math.random() * 5),
    frontrunAttacks: Math.floor(Math.random() * 3),
    backrunAttacks: Math.floor(Math.random() * 2),
    totalMEVExtracted: (Math.random() * 50 + 10).toFixed(2),
    timestamp: Date.now(),
  }
}

// Estimate MEV for a given transaction
export function estimateTransactionMEV(gasPrice: number, tradeSize: string, isLargeOrder: boolean): string {
  const baselineRisk = Number.parseFloat(tradeSize) * 0.001 // 0.1% baseline
  const gasMultiplier = gasPrice / 50 // Normalize to 50 gwei
  const largeOrderMultiplier = isLargeOrder ? 1.5 : 1

  const estimatedMEV = baselineRisk * gasMultiplier * largeOrderMultiplier
  return estimatedMEV.toFixed(2)
}
