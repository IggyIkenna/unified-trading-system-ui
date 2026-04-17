/**
 * Category-aware market data mock generator.
 *
 * Generates realistic tick patterns per asset category:
 *   - CeFi:  Geometric Brownian motion, ~2-5% daily vol, volume spikes at round numbers, tight spreads
 *   - DeFi:  Block-aligned price updates (~12s), funding rates ~0.01%/8h, slow TVL drift
 *   - TradFi: Session-aware (9:30-16:00 ET), opening auction vol spike, closing cross, weekend gaps
 *   - Prediction Markets: Binary probabilities (0-1), jump processes on simulated news events
 *
 * All generators are deterministic (seeded PRNG) so they are safe to call during React render.
 */

import type { TerminalInstrument } from "@/components/widgets/terminal/terminal-data-context";

// ---------------------------------------------------------------------------
// Seeded PRNG (deterministic, render-safe)
// ---------------------------------------------------------------------------

function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return (state % 10000) / 10000;
  };
}

/** Deterministic normal-ish variate via Box-Muller with seeded uniform */
function seededNormal(rand: () => number): number {
  const u1 = Math.max(rand(), 1e-10);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MarketCategory = "CeFi" | "DeFi" | "TradFi" | "Prediction";

export interface MockCandle {
  time: number; // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isUp: boolean;
}

export interface MockTickUpdate {
  price: number;
  bid: number;
  ask: number;
  /** For DeFi: current funding rate (annualised %) */
  fundingRate?: number;
  /** For DeFi: pool TVL in USD */
  tvl?: number;
  /** For Prediction: probability 0-1 */
  probability?: number;
}

// ---------------------------------------------------------------------------
// Expanded instrument catalogue
// ---------------------------------------------------------------------------

export const MOCK_INSTRUMENTS: TerminalInstrument[] = [
  // ---- CeFi ----
  { symbol: "BTC/USDT", name: "Bitcoin", venue: "Binance", category: "CeFi", instrumentKey: "BTC-USDT-SPOT@BINANCE", midPrice: 87234.56, change: 1.23 },
  { symbol: "ETH/USDT", name: "Ethereum", venue: "Binance", category: "CeFi", instrumentKey: "ETH-USDT-SPOT@BINANCE", midPrice: 2045.78, change: -0.45 },
  { symbol: "ETH-PERP", name: "ETH Perpetual", venue: "Hyperliquid", category: "CeFi", instrumentKey: "ETH-PERP@HYPERLIQUID", midPrice: 2043.5, change: -0.52 },
  { symbol: "SOL/USDT", name: "Solana", venue: "Binance", category: "CeFi", instrumentKey: "SOL-USDT-SPOT@BINANCE", midPrice: 134.21, change: 2.15 },
  { symbol: "BTC-PERP", name: "BTC Perpetual", venue: "Binance", category: "CeFi", instrumentKey: "BTC-PERP@BINANCE", midPrice: 87200.0, change: 1.18 },

  // ---- DeFi ----
  { symbol: "ETH/USDC", name: "ETH (Uniswap)", venue: "Uniswap", category: "DeFi", instrumentKey: "ETH-USDC@UNISWAP_V3", midPrice: 2044.30, change: -0.48 },
  { symbol: "WBTC/ETH", name: "WBTC/ETH Pool", venue: "Uniswap", category: "DeFi", instrumentKey: "WBTC-ETH@UNISWAP_V3", midPrice: 42.68, change: 0.12 },
  { symbol: "AAVE-LEND", name: "AAVE USDT Lending", venue: "Aave V3", category: "DeFi", instrumentKey: "AAVE-LEND-USDT@AAVE_V3", midPrice: 4.82, change: 0.05 },

  // ---- TradFi ----
  { symbol: "SPY", name: "S&P 500 ETF", venue: "NYSE", category: "TradFi", instrumentKey: "SPY@NYSE", midPrice: 528.45, change: 0.34 },
  { symbol: "AAPL", name: "Apple Inc.", venue: "NASDAQ", category: "TradFi", instrumentKey: "AAPL@NASDAQ", midPrice: 198.72, change: -0.18 },
  { symbol: "ES-FUT", name: "E-mini S&P 500", venue: "CME", category: "TradFi", instrumentKey: "ES-FUT@CME", midPrice: 5290.25, change: 0.42 },

  // ---- Prediction Markets ----
  { symbol: "BTC>100K", name: "BTC > $100K by Dec", venue: "Polymarket", category: "Prediction", instrumentKey: "BTC-100K-DEC@POLYMARKET", midPrice: 0.62, change: 3.4 },
  { symbol: "ETH>5K", name: "ETH > $5K by Dec", venue: "Polymarket", category: "Prediction", instrumentKey: "ETH-5K-DEC@POLYMARKET", midPrice: 0.18, change: -2.1 },
  { symbol: "FED-CUT", name: "Fed Rate Cut Jul", venue: "Polymarket", category: "Prediction", instrumentKey: "FED-CUT-JUL@POLYMARKET", midPrice: 0.74, change: 1.8 },
];

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

interface CategoryConfig {
  /** Annualised volatility as fraction (e.g. 0.03 = 3%) */
  annualisedVol: number;
  /** Bid-ask spread as fraction of price */
  spreadFraction: number;
  /** Volume base multiplier */
  volumeBase: number;
  /** Seconds between price updates (0 = continuous/every tick) */
  updateIntervalSec: number;
}

const CATEGORY_CONFIGS: Record<MarketCategory, CategoryConfig> = {
  CeFi: {
    annualisedVol: 0.04,     // ~4% daily vol for crypto
    spreadFraction: 0.0005,  // 5 bps
    volumeBase: 50,
    updateIntervalSec: 0,
  },
  DeFi: {
    annualisedVol: 0.04,
    spreadFraction: 0.003,   // 30 bps (on-chain wider)
    volumeBase: 20,
    updateIntervalSec: 12,   // block time
  },
  TradFi: {
    annualisedVol: 0.015,    // ~1.5% daily vol
    spreadFraction: 0.0001,  // 1 bp (tight lit markets)
    volumeBase: 200,
    updateIntervalSec: 0,
  },
  Prediction: {
    annualisedVol: 0,        // Not used — jump process instead
    spreadFraction: 0.01,    // 1% spread (binary market)
    volumeBase: 10,
    updateIntervalSec: 0,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function instrumentCategory(inst: TerminalInstrument): MarketCategory {
  const cat = inst.category;
  if (cat === "CeFi" || cat === "DeFi" || cat === "TradFi" || cat === "Prediction") return cat;
  return "CeFi";
}

/** Is the given Unix-second timestamp during US equity market hours? */
function isTradFiMarketOpen(unixSec: number): boolean {
  const d = new Date(unixSec * 1000);
  const day = d.getUTCDay();
  // Weekend
  if (day === 0 || day === 6) return false;
  // Convert to ET (UTC-4 EDT / UTC-5 EST). Use UTC-4 as a reasonable approximation.
  const etHour = (d.getUTCHours() - 4 + 24) % 24;
  const etMinute = d.getUTCMinutes();
  const etMinutes = etHour * 60 + etMinute;
  // 9:30 = 570min, 16:00 = 960min
  return etMinutes >= 570 && etMinutes < 960;
}

/** Returns a volatility multiplier for TradFi session effects */
function tradFiSessionMultiplier(unixSec: number): number {
  const d = new Date(unixSec * 1000);
  const etHour = (d.getUTCHours() - 4 + 24) % 24;
  const etMinute = d.getUTCMinutes();
  const etMinutes = etHour * 60 + etMinute;

  // Opening auction (9:30 - 10:00): 2.5x vol
  if (etMinutes >= 570 && etMinutes < 600) return 2.5;
  // Closing cross (15:45 - 16:00): 2x vol
  if (etMinutes >= 945 && etMinutes < 960) return 2.0;
  // Lunch doldrums (12:00 - 13:00): 0.6x vol
  if (etMinutes >= 720 && etMinutes < 780) return 0.6;
  return 1.0;
}

// ---------------------------------------------------------------------------
// Candle generator
// ---------------------------------------------------------------------------

/**
 * Generate category-aware candle data.
 *
 * - CeFi: GBM with realistic crypto volatility, volume spikes at round numbers
 * - DeFi: Block-aligned timestamps (~12s), lower liquidity
 * - TradFi: Session-aware with gaps for nights/weekends, opening/closing vol effects
 * - Prediction: Probability (0-1) with jump processes simulating news events
 */
export function generateMockCandles(
  inst: TerminalInstrument,
  timeframe: string,
  count: number = 200,
): MockCandle[] {
  const cat = instrumentCategory(inst);
  const config = CATEGORY_CONFIGS[cat];
  const symbolSeed = inst.symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRng(symbolSeed * 31 + 42);

  const secondsPerCandle =
    timeframe === "1m" ? 60
    : timeframe === "5m" ? 300
    : timeframe === "15m" ? 900
    : timeframe === "1H" ? 3600
    : timeframe === "4H" ? 14400
    : 86400;

  // End at the last completed interval
  const nowSec = Math.floor(Date.now() / 1000);
  const lastCandleTime = Math.floor(nowSec / secondsPerCandle) * secondsPerCandle - secondsPerCandle;

  // Per-candle vol: annualised vol -> per-candle
  const candlesPerYear = (365.25 * 86400) / secondsPerCandle;
  const perCandleVol = config.annualisedVol / Math.sqrt(candlesPerYear);

  let price = inst.midPrice;
  const candles: MockCandle[] = [];

  if (cat === "Prediction") {
    return generatePredictionCandles(inst, timeframe, count, lastCandleTime, secondsPerCandle, rand);
  }

  for (let i = 0; i < count; i++) {
    const candleTime = lastCandleTime - (count - i - 1) * secondsPerCandle;

    // TradFi: skip candles outside market hours for intraday timeframes
    if (cat === "TradFi" && secondsPerCandle < 86400 && !isTradFiMarketOpen(candleTime)) {
      // Insert a flat candle at the close price (shows gap on chart)
      candles.push({
        time: candleTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 0,
        isUp: true,
      });
      continue;
    }

    const volMultiplier = cat === "TradFi" ? tradFiSessionMultiplier(candleTime) : 1.0;
    const effectiveVol = perCandleVol * volMultiplier;

    // GBM step
    const drift = effectiveVol * effectiveVol * 0.5; // risk-neutral drift
    const shock = seededNormal(rand) * effectiveVol;
    const returnPct = drift + shock;
    const open = price;
    price = price * Math.exp(returnPct);
    const close = price;

    // Intra-candle high/low via Parkinson estimator approximation
    const intraVol = effectiveVol * (0.5 + rand() * 0.5);
    const high = Math.max(open, close) * (1 + Math.abs(intraVol) * rand());
    const low = Math.min(open, close) * (1 - Math.abs(intraVol) * rand());

    // Volume: base + spike at round numbers
    let volume = config.volumeBase * (0.5 + rand() * 1.0);
    // CeFi: volume spike when price is near a round number
    if (cat === "CeFi") {
      const roundness = price > 1000 ? 1000 : price > 100 ? 100 : 10;
      const distToRound = Math.abs(price - Math.round(price / roundness) * roundness) / roundness;
      if (distToRound < 0.02) volume *= 2.5;
    }
    // DeFi: lower volume, occasional whale
    if (cat === "DeFi" && rand() > 0.95) volume *= 5;

    candles.push({
      time: candleTime,
      open,
      high,
      low,
      close,
      volume: Math.round(volume * 100) / 100,
      isUp: close >= open,
    });
  }

  return candles;
}

/** Prediction markets: probability (0-1) with jump processes */
function generatePredictionCandles(
  inst: TerminalInstrument,
  _timeframe: string,
  count: number,
  lastCandleTime: number,
  secondsPerCandle: number,
  rand: () => number,
): MockCandle[] {
  let prob = inst.midPrice; // midPrice is 0-1 for prediction markets
  const candles: MockCandle[] = [];

  for (let i = 0; i < count; i++) {
    const candleTime = lastCandleTime - (count - i - 1) * secondsPerCandle;
    const open = prob;

    // Mean-reverting drift toward 0.5 (slight)
    const drift = (0.5 - prob) * 0.001;

    // Small random walk
    const noise = (rand() - 0.5) * 0.008;

    // Jump process: ~3% chance per candle of a "news event"
    let jump = 0;
    if (rand() > 0.97) {
      jump = (rand() - 0.5) * 0.12; // up to +/-6% jump
    }

    prob = Math.max(0.01, Math.min(0.99, prob + drift + noise + jump));
    const close = prob;

    const high = Math.min(0.99, Math.max(open, close) + rand() * 0.005);
    const low = Math.max(0.01, Math.min(open, close) - rand() * 0.005);

    candles.push({
      time: candleTime,
      open,
      high,
      low,
      close,
      volume: Math.round((5 + rand() * 30) * 100) / 100,
      isUp: close >= open,
    });
  }

  return candles;
}

// ---------------------------------------------------------------------------
// Live price tick generator
// ---------------------------------------------------------------------------

/**
 * Compute the next mock price tick.
 * Called every ~500ms from the terminal page's price simulation interval.
 *
 * @param inst  Current instrument
 * @param prevPrice  Previous price
 * @param tickIndex  Monotonically increasing tick counter
 * @returns Updated tick data with category-specific fields
 */
export function nextMockTick(
  inst: TerminalInstrument,
  prevPrice: number,
  tickIndex: number,
): MockTickUpdate {
  const cat = instrumentCategory(inst);
  const config = CATEGORY_CONFIGS[cat];
  const rand = seededRng(tickIndex * 7 + inst.symbol.charCodeAt(0) * 31);

  if (cat === "Prediction") {
    return nextPredictionTick(inst, prevPrice, rand);
  }

  // DeFi: only update on "block boundaries" (~every 24th tick at 500ms = ~12s)
  if (cat === "DeFi" && tickIndex % 24 !== 0) {
    const halfSpread = prevPrice * config.spreadFraction / 2;
    return {
      price: prevPrice,
      bid: prevPrice - halfSpread,
      ask: prevPrice + halfSpread,
      fundingRate: 0.01 + (rand() - 0.5) * 0.005, // oscillates around 0.01%/8h
      tvl: 45_000_000 + (rand() - 0.5) * 500_000,
    };
  }

  // TradFi: flat outside market hours
  if (cat === "TradFi") {
    const nowSec = Math.floor(Date.now() / 1000);
    if (!isTradFiMarketOpen(nowSec)) {
      const halfSpread = prevPrice * config.spreadFraction / 2;
      return {
        price: prevPrice,
        bid: prevPrice - halfSpread,
        ask: prevPrice + halfSpread,
      };
    }
  }

  // Per-tick vol: annualised -> per 500ms tick (31.536M ticks/year at 1/s, so 63.072M at 500ms)
  const ticksPerYear = 365.25 * 86400 * 2; // 2 ticks per second
  const perTickVol = config.annualisedVol / Math.sqrt(ticksPerYear);

  const volMultiplier = cat === "TradFi"
    ? tradFiSessionMultiplier(Math.floor(Date.now() / 1000))
    : 1.0;

  const shock = seededNormal(rand) * perTickVol * volMultiplier;
  const drift = perTickVol * perTickVol * 0.5;
  const nextPrice = prevPrice * Math.exp(drift + shock);

  const halfSpread = nextPrice * config.spreadFraction / 2;

  const result: MockTickUpdate = {
    price: nextPrice,
    bid: nextPrice - halfSpread,
    ask: nextPrice + halfSpread,
  };

  // DeFi extras
  if (cat === "DeFi") {
    result.fundingRate = 0.01 + (rand() - 0.5) * 0.005;
    result.tvl = 45_000_000 + (rand() - 0.5) * 500_000;
  }

  return result;
}

/** Prediction market tick: jump process */
function nextPredictionTick(
  _inst: TerminalInstrument,
  prevPrice: number,
  rand: () => number,
): MockTickUpdate {
  const prob = prevPrice;

  // Mean reversion + noise + jump
  const drift = (0.5 - prob) * 0.0002;
  const noise = (rand() - 0.5) * 0.002;
  let jump = 0;
  if (rand() > 0.98) {
    jump = (rand() - 0.5) * 0.06;
  }

  const nextProb = Math.max(0.01, Math.min(0.99, prob + drift + noise + jump));
  const spread = 0.01;

  return {
    price: nextProb,
    bid: Math.max(0.01, nextProb - spread / 2),
    ask: Math.min(0.99, nextProb + spread / 2),
    probability: nextProb,
  };
}

// ---------------------------------------------------------------------------
// Category-aware order book
// ---------------------------------------------------------------------------

interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

/**
 * Generate a category-aware mock order book.
 * Replaces the generic `generateMockOrderBook` with category-specific behaviour:
 *   - CeFi: Tight spread, deep book, volume clusters
 *   - DeFi: Wider spread, thinner book, concentrated liquidity
 *   - TradFi: Very tight spread, deep institutional book
 *   - Prediction: Probability-based levels (0-1 range), thin book
 */
export function generateCategoryOrderBook(
  inst: TerminalInstrument,
  midPrice: number,
  tick: number = 0,
): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } {
  const cat = instrumentCategory(inst);
  const config = CATEGORY_CONFIGS[cat];
  const baseSeed = inst.symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRng(baseSeed + tick * 7919);

  const levels = cat === "Prediction" ? 10 : 15;
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];

  const halfSpread = midPrice * config.spreadFraction / 2;
  const bestBid = midPrice - halfSpread;
  const bestAsk = midPrice + halfSpread;

  // Tick size depends on price level and category
  const tickSize = cat === "Prediction"
    ? 0.01
    : cat === "TradFi"
      ? (midPrice > 1000 ? 0.25 : 0.01)
      : (midPrice > 10000 ? 0.1 : midPrice > 100 ? 0.01 : 0.001);

  let bidCum = 0;
  let askCum = 0;

  for (let i = 0; i < levels; i++) {
    const depthMultiplier = 1 + i * (cat === "TradFi" ? 0.5 : cat === "DeFi" ? 0.15 : 0.3);

    // DeFi: concentrated liquidity at first few levels, drops off
    const defiConcentration = cat === "DeFi" ? Math.max(0.1, 1 - i * 0.12) : 1;

    const bidPrice = bestBid - tickSize * i - rand() * tickSize * 0.3;
    const bidSize = config.volumeBase * 0.01 * (0.3 + rand() * 0.7) * depthMultiplier * defiConcentration;
    bidCum += bidSize;
    bids.push({
      price: cat === "Prediction" ? Math.max(0.01, bidPrice) : bidPrice,
      size: Math.round(bidSize * 1000) / 1000,
      total: Math.round(bidCum * 1000) / 1000,
    });

    const askPrice = bestAsk + tickSize * i + rand() * tickSize * 0.3;
    const askSize = config.volumeBase * 0.01 * (0.3 + rand() * 0.7) * depthMultiplier * defiConcentration;
    askCum += askSize;
    asks.push({
      price: cat === "Prediction" ? Math.min(0.99, askPrice) : askPrice,
      size: Math.round(askSize * 1000) / 1000,
      total: Math.round(askCum * 1000) / 1000,
    });
  }

  return { bids, asks };
}

// ---------------------------------------------------------------------------
// Weekend gap utility for TradFi candles
// ---------------------------------------------------------------------------

/**
 * Returns true if a TradFi daily candle should represent a weekend gap
 * (Saturday or Sunday). The chart will show the Friday close carried forward.
 */
export function isTradFiWeekend(unixSec: number): boolean {
  const d = new Date(unixSec * 1000);
  return d.getUTCDay() === 0 || d.getUTCDay() === 6;
}
