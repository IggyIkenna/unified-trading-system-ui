import type { WatchlistDefinition, WatchlistSymbol } from "@/components/trading/watchlist-panel";
import type { Asset, TradFiAsset, FutureRow, OptionRow, SpreadAsset, SpreadCell } from "@/lib/types/options";

export const ASSETS: Asset[] = ["BTC", "ETH", "SOL", "AVAX"];
export const TRADFI_ASSETS: TradFiAsset[] = ["SPY", "QQQ", "SPX"];

export const SPOT_PRICES: Record<Asset, number> = {
  BTC: 71583,
  ETH: 3456,
  SOL: 187.4,
  AVAX: 42.15,
};

export const TRADFI_SPOT_PRICES: Record<TradFiAsset, number> = {
  SPY: 521.4,
  QQQ: 446.2,
  SPX: 5238.0,
};

export const IV_INDEX: Record<Asset, number> = {
  BTC: 50.9,
  ETH: 55.2,
  SOL: 72.1,
  AVAX: 68.4,
};

export const TRADFI_IV_INDEX: Record<TradFiAsset, number> = {
  SPY: 16.8,
  QQQ: 20.1,
  SPX: 15.9,
};

export const EXPIRY_DATES = [
  "ALL",
  "24 MAR 26",
  "25 MAR 26",
  "26 MAR 26",
  "27 MAR 26",
  "03 APR 26",
  "10 APR 26",
  "24 APR 26",
  "29 MAY 26",
  "26 JUN 26",
  "25 SEP 26",
  "25 DEC 26",
] as const;

// US equity options follow monthly/quarterly OPEX cycle
export const TRADFI_EXPIRY_DATES = [
  "ALL",
  "21 MAR 26",
  "18 APR 26",
  "16 MAY 26",
  "20 JUN 26",
  "18 JUL 26",
  "15 AUG 26",
  "19 SEP 26",
  "17 OCT 26",
  "21 NOV 26",
  "19 DEC 26",
  "16 JAN 27",
  "20 MAR 27",
] as const;

export const EXPIRIES_WITH_POSITIONS = new Set(["26 JUN 26", "25 DEC 26"]);

export const STRIKE_INCREMENTS: Record<Asset, number> = {
  BTC: 2000,
  ETH: 100,
  SOL: 10,
  AVAX: 5,
};

export const TRADFI_STRIKE_INCREMENTS: Record<TradFiAsset, number> = {
  SPY: 5,
  QQQ: 5,
  SPX: 25,
};

// Scenario preset shocks used in the Scenario tab
export const SCENARIO_PRESETS = [
  { label: "Base", spotPct: 0, volPct: 0 },
  { label: "+10% Rally", spotPct: 10, volPct: -15 },
  { label: "-10% Crash", spotPct: -10, volPct: 30 },
  { label: "Vol Spike", spotPct: 0, volPct: 50 },
  { label: "Vol Crush", spotPct: 0, volPct: -30 },
  { label: "Melt-Up", spotPct: 20, volPct: -20 },
] as const;

// ---------- Watchlist mock data ----------

const CRYPTO_WATCHLIST_SYMBOLS: WatchlistSymbol[] = [
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    price: 71583,
    change24h: 2.41,
    iv: 50.9,
    category: "crypto",
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    price: 3456,
    change24h: 1.18,
    iv: 55.2,
    category: "crypto",
  },
  {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    price: 187.4,
    change24h: -0.83,
    iv: 72.1,
    category: "crypto",
  },
  {
    id: "avax",
    symbol: "AVAX",
    name: "Avalanche",
    price: 42.15,
    change24h: 3.5,
    iv: 68.4,
    category: "crypto",
  },
  {
    id: "bnb",
    symbol: "BNB",
    name: "BNB",
    price: 598,
    change24h: 0.77,
    iv: 44.2,
    category: "crypto",
  },
  {
    id: "link",
    symbol: "LINK",
    name: "Chainlink",
    price: 18.9,
    change24h: -1.2,
    iv: 82.3,
    category: "crypto",
  },
  {
    id: "arb",
    symbol: "ARB",
    name: "Arbitrum",
    price: 1.14,
    change24h: -2.1,
    iv: 91.5,
    category: "crypto",
  },
  {
    id: "op",
    symbol: "OP",
    name: "Optimism",
    price: 2.87,
    change24h: 4.3,
    iv: 88.7,
    category: "crypto",
  },
];

const TRADFI_WATCHLIST_SYMBOLS: WatchlistSymbol[] = [
  {
    id: "spy",
    symbol: "SPY",
    name: "SPDR S&P 500 ETF",
    price: 521.4,
    change24h: 0.62,
    iv: 16.8,
    category: "tradfi",
  },
  {
    id: "qqq",
    symbol: "QQQ",
    name: "Invesco QQQ Trust",
    price: 446.2,
    change24h: 0.91,
    iv: 20.1,
    category: "tradfi",
  },
  {
    id: "spx",
    symbol: "SPX",
    name: "S&P 500 Index",
    price: 5238.0,
    change24h: 0.58,
    iv: 15.9,
    category: "tradfi",
  },
  {
    id: "ndx",
    symbol: "NDX",
    name: "Nasdaq-100 Index",
    price: 18420,
    change24h: 0.85,
    iv: 19.4,
    category: "tradfi",
  },
  {
    id: "iwm",
    symbol: "IWM",
    name: "iShares Russell 2000",
    price: 207.8,
    change24h: -0.44,
    iv: 22.3,
    category: "tradfi",
  },
  {
    id: "aapl",
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 182.3,
    change24h: -0.31,
    iv: 24.1,
    category: "tradfi",
  },
  {
    id: "tsla",
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 248.5,
    change24h: 2.11,
    iv: 58.7,
    category: "tradfi",
  },
  {
    id: "nvda",
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    price: 875.4,
    change24h: 1.55,
    iv: 52.3,
    category: "tradfi",
  },
];

export const DEFAULT_WATCHLISTS: WatchlistDefinition[] = [
  {
    id: "crypto-top",
    label: "Crypto Top 8",
    symbols: CRYPTO_WATCHLIST_SYMBOLS,
  },
  {
    id: "crypto-defi",
    label: "DeFi Tokens",
    symbols: CRYPTO_WATCHLIST_SYMBOLS.filter((s) => ["arb", "op", "link"].includes(s.id)),
  },
  { id: "tradfi-us", label: "US Equities", symbols: TRADFI_WATCHLIST_SYMBOLS },
  {
    id: "tradfi-indices",
    label: "Indices & ETFs",
    symbols: TRADFI_WATCHLIST_SYMBOLS.filter((s) => ["spy", "qqq", "spx", "ndx", "iwm"].includes(s.id)),
  },
];

// ---------- Mock Data Generators ----------

export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateStrikes(asset: Asset): number[] {
  const spot = SPOT_PRICES[asset];
  const inc = STRIKE_INCREMENTS[asset];
  const strikes: number[] = [];
  const low = Math.floor((spot * 0.8) / inc) * inc;
  const high = Math.ceil((spot * 1.2) / inc) * inc;
  for (let s = low; s <= high; s += inc) {
    strikes.push(s);
  }
  return strikes;
}

export function generateOptionChain(asset: Asset, _expiry: string): OptionRow[] {
  const spot = SPOT_PRICES[asset];
  const strikes = generateStrikes(asset);
  const baseIv = IV_INDEX[asset];
  const timeToExpiry = 0.25; // ~3 months

  return strikes.map((strike, idx) => {
    const moneyness = (strike - spot) / spot;
    const absMoneyness = Math.abs(moneyness);

    // IV smile: higher for deep ITM/OTM
    const ivSmile = baseIv + absMoneyness * 30 + seededRandom(strike + 1) * 5;
    const ivBidOffset = 0.3 + absMoneyness * 0.5;
    const ivAskOffset = 0.3 + absMoneyness * 0.5;

    // Simplified Black-Scholes delta approximation
    const d1Approx = -moneyness / ((ivSmile / 100) * Math.sqrt(timeToExpiry));
    const callDelta = Math.max(0.01, Math.min(0.99, 0.5 + 0.4 * Math.tanh(d1Approx)));
    const putDelta = callDelta - 1;

    // Mark price approximation (intrinsic + time value)
    const callIntrinsic = Math.max(0, spot - strike);
    const putIntrinsic = Math.max(0, strike - spot);
    const timeValue = spot * (ivSmile / 100) * Math.sqrt(timeToExpiry) * 0.4 * (1 - absMoneyness * 0.5);
    const callMark = Math.max(callIntrinsic + timeValue * callDelta, spot * 0.001);
    const putMark = Math.max(putIntrinsic + timeValue * (1 - callDelta), spot * 0.001);

    // Spread: wider for OTM
    const spreadMultiplier = 1 + absMoneyness * 3;
    const callSpread = callMark * 0.02 * spreadMultiplier;
    const putSpread = putMark * 0.02 * spreadMultiplier;

    // OI: higher near ATM
    const oiBase = 25000 * (1 - absMoneyness * 2);
    const callOi = Math.max(500, Math.floor(oiBase + seededRandom(strike * 3) * 10000));
    const putOi = Math.max(500, Math.floor(oiBase + seededRandom(strike * 7) * 10000));

    return {
      strike,
      callBid: Math.max(0, callMark - callSpread),
      callAsk: callMark + callSpread,
      callMark,
      callIvBid: ivSmile - ivBidOffset,
      callIvAsk: ivSmile + ivAskOffset,
      callDelta,
      callOi,
      callSize: Math.floor(seededRandom(idx + 100) * 50),
      putBid: Math.max(0, putMark - putSpread),
      putAsk: putMark + putSpread,
      putMark,
      putIvBid: ivSmile - ivBidOffset,
      putIvAsk: ivSmile + ivAskOffset,
      putDelta,
      putOi,
      putSize: Math.floor(seededRandom(idx + 200) * 50),
    };
  });
}

export function generateFuturesData(asset: Asset): FutureRow[] {
  const spot = SPOT_PRICES[asset];
  const settlement = asset === "BTC" || asset === "ETH" ? asset : "USDC";
  const rows: FutureRow[] = [];

  // Perpetual
  rows.push({
    contract: `${asset}-PERPETUAL`,
    asset,
    settlement,
    markPrice: spot + seededRandom(1) * spot * 0.001,
    change24h: (seededRandom(2) - 0.5) * 6,
    volume24h: 500_000_000 + seededRandom(3) * 1_000_000_000,
    openInterest: 200_000_000 + seededRandom(4) * 500_000_000,
    fundingRate: (seededRandom(5) - 0.45) * 0.03,
    basis: null,
    isPerpetual: true,
    favourite: false,
  });

  // Dated futures
  const quarters = ["26MAR26", "26JUN26", "25SEP26", "25DEC26", "26MAR27"];
  quarters.forEach((q, i) => {
    const basisBps = 3 + i * 2 + seededRandom(i + 10) * 4;
    rows.push({
      contract: `${asset}-${q}`,
      asset,
      settlement,
      markPrice: spot * (1 + basisBps / 100),
      change24h: (seededRandom(i + 20) - 0.5) * 5,
      volume24h: 50_000_000 + seededRandom(i + 30) * 200_000_000,
      openInterest: 30_000_000 + seededRandom(i + 40) * 150_000_000,
      fundingRate: null,
      basis: basisBps,
      isPerpetual: false,
      favourite: false,
    });
  });

  return rows;
}

// ---------- Futures Spreads Data ----------

export const SPREAD_EXPIRIES = ["Perpetual", "27 MAR", "03 APR", "24 APR", "26 JUN", "25 SEP", "25 DEC"] as const;

export function generateSpreadMatrix(asset: SpreadAsset): (SpreadCell | null)[][] {
  const spot = SPOT_PRICES[asset];
  // Mark prices per expiry (increasing contango)
  const marks = SPREAD_EXPIRIES.map((_, i) => spot * (1 + i * 0.008 + seededRandom(i + 50) * 0.003));

  const matrix: (SpreadCell | null)[][] = [];

  for (let longIdx = 0; longIdx < SPREAD_EXPIRIES.length; longIdx++) {
    const row: (SpreadCell | null)[] = [];
    for (let shortIdx = 0; shortIdx < SPREAD_EXPIRIES.length; shortIdx++) {
      if (shortIdx <= longIdx) {
        // Upper triangle + diagonal: invalid (long must be before short, or same)
        row.push(null);
      } else {
        const rawSpread = marks[shortIdx] - marks[longIdx];
        const halfWidth = Math.abs(rawSpread) * 0.02 + seededRandom(longIdx * 10 + shortIdx) * 2;
        const bid = rawSpread - halfWidth;
        const ask = rawSpread + halfWidth;
        const bidDepth = Math.floor(5 + seededRandom(longIdx * 7 + shortIdx * 3) * 40);
        const askDepth = Math.floor(5 + seededRandom(longIdx * 11 + shortIdx * 5) * 40);

        const longLabel = SPREAD_EXPIRIES[longIdx] === "Perpetual" ? "PERP" : SPREAD_EXPIRIES[longIdx];
        const shortLabel = SPREAD_EXPIRIES[shortIdx] === "Perpetual" ? "PERP" : SPREAD_EXPIRIES[shortIdx];

        row.push({
          longLabel,
          shortLabel,
          spreadLabel: `${shortLabel} \u2013 ${longLabel}`,
          bid,
          ask,
          bidDepth,
          askDepth,
        });
      }
    }
    matrix.push(row);
  }

  return matrix;
}

// Generate a TradFi option chain (SPY/QQQ/SPX) using different spot/IV/strike params
export function generateTradFiOptionChain(asset: TradFiAsset, _expiry: string): OptionRow[] {
  const spot = TRADFI_SPOT_PRICES[asset];
  const inc = TRADFI_STRIKE_INCREMENTS[asset];
  const baseIv = TRADFI_IV_INDEX[asset];
  const timeToExpiry = 0.25;

  const low = Math.floor((spot * 0.88) / inc) * inc;
  const high = Math.ceil((spot * 1.12) / inc) * inc;
  const strikes: number[] = [];
  for (let s = low; s <= high; s += inc) strikes.push(s);

  return strikes.map((strike, idx) => {
    const moneyness = (strike - spot) / spot;
    const absMoneyness = Math.abs(moneyness);
    // Equity IV smile is shallower and skewed (put skew)
    const putSkew = moneyness < 0 ? Math.abs(moneyness) * 15 : 0;
    const ivSmile = baseIv + absMoneyness * 12 + putSkew + seededRandom(strike + idx) * 2;
    const ivBidOffset = 0.2 + absMoneyness * 0.3;
    const callMark = Math.max(0, spot - strike) + spot * (ivSmile / 100) * Math.sqrt(timeToExpiry) * 0.4;
    const putMark = Math.max(0, strike - spot) + spot * (ivSmile / 100) * Math.sqrt(timeToExpiry) * 0.4;
    const callSpread = callMark * 0.015 * (1 + absMoneyness * 2);
    const putSpread = putMark * 0.015 * (1 + absMoneyness * 2);
    const d1 = -moneyness / ((ivSmile / 100) * Math.sqrt(timeToExpiry));
    const callDelta = 0.5 + 0.4 * Math.tanh(d1);
    const putDelta = callDelta - 1;
    const oiBase = Math.round((5000 + seededRandom(strike + idx + 99) * 50000) * (1 - absMoneyness * 2));
    return {
      strike,
      callBid: Math.max(0.01, callMark - callSpread),
      callAsk: callMark + callSpread,
      callMark,
      callIvBid: ivSmile - ivBidOffset,
      callIvAsk: ivSmile + ivBidOffset,
      callDelta,
      callOi: Math.max(0, oiBase),
      callSize: Math.round(seededRandom(strike + idx + 10) * 500),
      putBid: Math.max(0.01, putMark - putSpread),
      putAsk: putMark + putSpread,
      putMark,
      putIvBid: ivSmile - ivBidOffset,
      putIvAsk: ivSmile + ivBidOffset,
      putDelta,
      putOi: Math.max(0, oiBase * 1.3),
      putSize: Math.round(seededRandom(strike + idx + 20) * 500),
    };
  });
}

// Generate scenario P&L grid: spotSteps × volSteps matrix
// Returns a 2D array of P&L values for a mock notional position
export function generateScenarioGrid(
  spotPrice: number,
  baseIv: number,
  spotSteps: number[], // e.g. [-20, -10, 0, 10, 20] as percentages
  volSteps: number[], // e.g. [-30, -15, 0, 15, 30] as percentage-point deltas
  notional: number,
): {
  pnl: number[][];
  delta: number[][];
  liqThreshold: number;
} {
  // Mock a delta-hedged options book: long gamma, short theta
  // P&L ≈ 0.5 * gamma * dS² - theta * dt + vega * dVol
  const gamma = notional * 0.00002;
  const theta = notional * 0.0003;
  const vega = notional * 0.008;
  const baseDelta = notional * 0.3;
  const dt = 1 / 252; // 1 day

  const pnl = spotSteps.map((spotPct) =>
    volSteps.map((volDelta) => {
      const dS = spotPrice * (spotPct / 100);
      const dVol = volDelta / 100;
      return baseDelta * dS + 0.5 * gamma * dS * dS - theta * dt * 365 + vega * dVol;
    }),
  );

  const delta = spotSteps.map((spotPct) =>
    volSteps.map((volDelta) => {
      const dS = spotPrice * (spotPct / 100);
      return baseDelta + gamma * dS + (volDelta / 100) * vega * 0.01;
    }),
  );

  // Liquidation threshold: loss > 40% of notional
  const liqThreshold = -notional * 0.4;

  return { pnl, delta, liqThreshold };
}

export function formatUsd(value: number, decimals: number = 2): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  return `$${value.toFixed(decimals)}`;
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

// ---------- Vol Surface Data ----------

export function generateVolSurface(asset: Asset): {
  strikes: number[];
  expiries: string[];
  ivs: number[][];
} {
  const spot = SPOT_PRICES[asset];
  const inc = STRIKE_INCREMENTS[asset];
  const baseIv = IV_INDEX[asset];

  const strikes = [
    Math.floor((spot * 0.85) / inc) * inc,
    Math.floor((spot * 0.9) / inc) * inc,
    Math.floor((spot * 0.95) / inc) * inc,
    Math.round(spot / inc) * inc,
    Math.ceil((spot * 1.05) / inc) * inc,
    Math.ceil((spot * 1.1) / inc) * inc,
  ];
  const expiries = ["1W", "1M", "3M", "6M", "1Y"];

  const ivs = strikes.map((strike) => {
    const moneyness = Math.abs((strike - spot) / spot);
    return expiries.map((_, eIdx) => {
      const termPremium = eIdx * 1.5;
      const smile = moneyness * 25;
      return baseIv + smile + termPremium + seededRandom(strike + eIdx) * 3;
    });
  });

  return { strikes, expiries, ivs };
}

export function ivToColor(iv: number): string {
  const minIv = 40;
  const maxIv = 80;
  const ratio = Math.max(0, Math.min(1, (iv - minIv) / (maxIv - minIv)));
  // Blue (cold) to orange (warm)
  const r = Math.round(50 + ratio * 200);
  const g = Math.round(100 + (1 - Math.abs(ratio - 0.5) * 2) * 100);
  const b = Math.round(220 - ratio * 180);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Spot shock percentages for scenario matrix rows. */
export const SPOT_STEPS = [-20, -15, -10, -5, 0, 5, 10, 15, 20];

/** Volatility shock (percentage points) for scenario matrix columns. */
export const VOL_STEPS = [-30, -20, -10, 0, 10, 20, 30];
