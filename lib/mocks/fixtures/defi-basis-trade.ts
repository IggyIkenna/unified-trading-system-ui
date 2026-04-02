/**
 * DeFi Basis Trade Mock Data
 *
 * Basis trade: long spot asset (SWAP) + short perpetual on CeFi (TRADE)
 * Strategy: delta-neutral funding rate arbitrage
 *
 * Flow:
 * 1. SWAP: USDT → ETH (90% of capital) via Uniswap V3/Curve
 * 2. TRANSFER: USDC → Hyperliquid margin (10% of capital)
 * 3. TRADE: Short ETH-USDC perp on Hyperliquid (size = ETH from step 1)
 */

export const BASIS_TRADE_MOCK_DATA = {
  // Supported assets for basis trading
  assets: ["ETH", "BTC", "SOL"],

  // Supported venues for spot (SOR)
  spotVenues: ["UNISWAPV3-ETHEREUM", "CURVE-ETHEREUM", "BALANCER-ETHEREUM"],

  // Perpetual venues
  perpVenues: ["HYPERLIQUID"],

  // Current market data (time-based, simulated)
  marketData: {
    ETH: {
      spotPrice: 3400,
      perpPrice: 3401, // +$1 premium = 3 bps
      fundingRate: 0.000125, // 0.0125% per 8h = ~11% APY when positive
      fundingRateAnnualized: 0.11,
      basis24h: 100, // $100 = 294 bps on $3400
      basisBps: 294, // basis in basis points
      volume24h: 1200000,
      slippage: 0.0005, // 5 bps typical for $1M+ swaps
    },
    BTC: {
      spotPrice: 68500,
      perpPrice: 68520,
      fundingRate: 0.00015, // higher funding on BTC
      fundingRateAnnualized: 0.135,
      basis24h: 200,
      basisBps: 292,
      volume24h: 900000,
      slippage: 0.0006,
    },
    SOL: {
      spotPrice: 175,
      perpPrice: 175.3,
      fundingRate: 0.0001,
      fundingRateAnnualized: 0.09,
      basis24h: 25,
      basisBps: 1428,
      volume24h: 300000,
      slippage: 0.001,
    },
  },

  // Hyperliquid margin requirements per asset
  marginRequirements: {
    ETH: {
      initialMarginPercent: 0.05, // 5% IMR = 20x leverage available
      maintenanceMarginPercent: 0.02, // 2% MMR
      liquidationPrice: -0.02,
    },
    BTC: {
      initialMarginPercent: 0.05,
      maintenanceMarginPercent: 0.02,
      liquidationPrice: -0.02,
    },
    SOL: {
      initialMarginPercent: 0.1,
      maintenanceMarginPercent: 0.05,
      liquidationPrice: -0.05,
    },
  },

  // Slippage impact by capital size
  slippageByCapital: (capital: number, baseSlippage: number): number => {
    if (capital < 100000) return baseSlippage;
    if (capital < 1000000) return baseSlippage + 0.0002; // +2 bps
    if (capital < 5000000) return baseSlippage + 0.0005; // +5 bps
    return baseSlippage + 0.001; // +10 bps for >$5M
  },

  // Margin usage calculation
  calculateMarginUsage: (capital: number, fundingRate: number, marginReq: number): number => {
    // Margin usage = (10% margin / IMR) * 100%
    const marginDeployed = capital * 0.1;
    const maxNotional = marginDeployed / marginReq;
    const positionNotional = capital * 0.9; // 90% in spot leg
    return (positionNotional / maxNotional) * 100;
  },

  // Daily funding income
  calculateFundingPnL: (spotAmount: number, spotPrice: number, fundingRate: number): number => {
    const notional = spotAmount * spotPrice;
    const dailyFunding = notional * fundingRate;
    return dailyFunding;
  },

  // P&L from basis widening/tightening
  calculateBasisPnL: (spotAmount: number, initialBasisBps: number, currentBasisBps: number): number => {
    const basisChange = (currentBasisBps - initialBasisBps) / 10000;
    const spotPrice = 3400; // Average for basis calc
    const pnl = spotAmount * spotPrice * basisChange;
    return pnl;
  },

  // Cost of carry (funding + fees + gas)
  calculateCostOfCarry: (capital: number, spot: number, perp: number, takerFee: number = 0.0004): number => {
    const notional = capital * 0.9 * spot;
    const fees = notional * takerFee * 2; // Entry + exit
    const gas = 15 + 10; // $15 entry swap + $10 exit (estimated)
    const totalCost = fees + gas;
    const apy = (totalCost / notional) * 365;
    return apy;
  },
};

/**
 * Trade history for basis trade operations
 * Each entry represents a SWAP + TRADE pair (or individual operations)
 */
export interface BasisTradeHistoryEntry {
  seq: number;
  timestamp: string;
  operation: "SWAP" | "TRADE" | "BOTH";
  asset: string;
  amount: number;
  expectedOutput: number;
  actualOutput: number;
  slippage: number;
  marginUsage: number;
  fundingRate: number;
  fundingPnL: number;
  basisBps: number;
  status: "pending" | "filled" | "failed";
  runningPnL: number;
}

const today = new Date();
const hours = (n: number) => new Date(today.getTime() - n * 3600000);

export const MOCK_BASIS_TRADE_HISTORY: BasisTradeHistoryEntry[] = [
  {
    seq: 1,
    timestamp: hours(48).toISOString(),
    operation: "BOTH",
    asset: "ETH",
    amount: 100000,
    expectedOutput: 26.47, // 100k USDT * 0.9 / 3400 * (1 - 0.005 slippage)
    actualOutput: 26.45,
    slippage: 0.0008,
    marginUsage: 45,
    fundingRate: 0.000125,
    fundingPnL: 127.5,
    basisBps: 294,
    status: "filled",
    runningPnL: -31.5, // Entry costs: ~160 (fees) + gas
  },
  {
    seq: 2,
    timestamp: hours(36).toISOString(),
    operation: "BOTH",
    asset: "ETH",
    amount: 50000,
    expectedOutput: 13.23,
    actualOutput: 13.21,
    slippage: 0.0007,
    marginUsage: 48,
    fundingRate: 0.000128,
    fundingPnL: 170,
    basisBps: 298,
    status: "filled",
    runningPnL: 265, // Funding earnings exceed costs
  },
  {
    seq: 3,
    timestamp: hours(24).toISOString(),
    operation: "BOTH",
    asset: "BTC",
    amount: 75000,
    expectedOutput: 1.094, // 75k USDT * 0.9 / 68500 * (1 - 0.006)
    actualOutput: 1.091,
    slippage: 0.0009,
    marginUsage: 52,
    fundingRate: 0.00015,
    fundingPnL: 156.3,
    basisBps: 292,
    status: "filled",
    runningPnL: 591, // Stronger funding on BTC
  },
  {
    seq: 4,
    timestamp: hours(12).toISOString(),
    operation: "SWAP",
    asset: "ETH",
    amount: 25000,
    expectedOutput: 7.35,
    actualOutput: 7.33,
    slippage: 0.0005,
    marginUsage: 45,
    fundingRate: 0.000125,
    fundingPnL: 0, // Not traded yet
    basisBps: 290,
    status: "filled",
    runningPnL: 581,
  },
];

/**
 * Expected output calculation for basis trade
 * Accounts for slippage, asset price, and operation type
 */
export function calculateBasisTradeExpectedOutput(
  amount: number,
  asset: string,
  operation: "SWAP" | "TRADE" | "BOTH",
  slippageBps: number = 5,
): number {
  const marketData = BASIS_TRADE_MOCK_DATA.marketData[asset as keyof typeof BASIS_TRADE_MOCK_DATA.marketData];
  if (!marketData) return 0;

  const slippageFactor = 1 - slippageBps / 10000;

  if (operation === "SWAP") {
    // Only swap: 90% of amount into asset
    const swapAmount = amount * 0.9;
    const output = (swapAmount / marketData.spotPrice) * slippageFactor;
    return output;
  }

  if (operation === "TRADE") {
    // Only trade: assumes we already have the spot position
    // For display, show notional exposure
    return amount * 0.9; // Dollar amount at risk
  }

  // BOTH: swap + trade
  const swapAmount = amount * 0.9;
  const spotAsset = (swapAmount / marketData.spotPrice) * slippageFactor;
  return spotAsset;
}

/**
 * Margin usage calculation
 */
export function calculateBasisTradeMarginUsage(amount: number, asset: string, fundingRate: number): number {
  const marginReqs =
    BASIS_TRADE_MOCK_DATA.marginRequirements[asset as keyof typeof BASIS_TRADE_MOCK_DATA.marginRequirements];
  if (!marginReqs) return 0;

  return BASIS_TRADE_MOCK_DATA.calculateMarginUsage(amount, fundingRate, marginReqs.initialMarginPercent);
}

/**
 * Funding rate impact (daily APY)
 */
export function calculateBasisTradeFundingImpact(asset: string): number {
  const marketData = BASIS_TRADE_MOCK_DATA.marketData[asset as keyof typeof BASIS_TRADE_MOCK_DATA.marketData];
  if (!marketData) return 0;
  return marketData.fundingRateAnnualized * 100; // Convert to percentage
}

/**
 * Cost of carry (entry + exit fees + gas)
 */
export function calculateBasisTradeCostOfCarry(capital: number, asset: string): number {
  const marketData = BASIS_TRADE_MOCK_DATA.marketData[asset as keyof typeof BASIS_TRADE_MOCK_DATA.marketData];
  if (!marketData) return 0;

  const notional = capital * 0.9 * marketData.spotPrice;
  const takerFee = 0.0004; // 4 bps typical
  const swapFees = notional * takerFee; // DEX fee
  const tradeFees = notional * takerFee; // Hyperliquid taker fee entry
  const exitFees = notional * takerFee; // Exit trade fee
  const gas = 15; // $15 swap on Ethereum mainnet

  const totalCost = swapFees + tradeFees + exitFees + gas;
  const costPercent = (totalCost / notional) * 100;
  return costPercent;
}

/**
 * Breakeven funding rate (what funding rate covers costs)
 */
export function calculateBreakenvenFundingRate(capital: number, asset: string): number {
  const marketData = BASIS_TRADE_MOCK_DATA.marketData[asset as keyof typeof BASIS_TRADE_MOCK_DATA.marketData];
  if (!marketData) return 0;

  const costOfCarry = calculateBasisTradeCostOfCarry(capital, asset);
  const notional = capital * 0.9 * marketData.spotPrice;
  const dailyCost = (costOfCarry / 100) * notional;
  const requiredDailyFunding = dailyCost / notional;

  return requiredDailyFunding * 365; // Annualized
}
