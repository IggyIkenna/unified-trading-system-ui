/** Domain types for options / futures trading UI (mock-backed until API wiring). */

export type AssetClass = "crypto" | "tradfi";
export type Asset = "BTC" | "ETH" | "SOL" | "AVAX";
export type TradFiAsset = "SPY" | "QQQ" | "SPX";
export type Settlement = "inverse" | "linear";
export type Market = "deribit" | "okx" | "bybit";
export type TradFiMarket = "cboe" | "td" | "ibkr";
export type MainTab = "options" | "futures" | "strategies" | "scenario";
export type TradeDirection = "buy" | "sell";
export type OrderType = "limit" | "market" | "post-only" | "reduce-only";
export type GreekSurface = "delta" | "gamma" | "vega" | "theta";
export type StrategiesMode = "futures-spreads" | "options-combos";
export type ComboType = "vertical-spread" | "straddle" | "strangle" | "calendar" | "butterfly" | "risk-reversal";

/** Futures calendar-spread matrix asset (subset of crypto underlyings). */
export type SpreadAsset = "BTC" | "ETH";

export interface ComboLeg {
  strike: number;
  type: "call" | "put";
  direction: "buy" | "sell";
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface OptionRow {
  strike: number;
  callBid: number;
  callAsk: number;
  callMark: number;
  callIvBid: number;
  callIvAsk: number;
  callDelta: number;
  callOi: number;
  callSize: number;
  putBid: number;
  putAsk: number;
  putMark: number;
  putIvBid: number;
  putIvAsk: number;
  putDelta: number;
  putOi: number;
  putSize: number;
}

export interface FutureRow {
  contract: string;
  asset: Asset;
  settlement: string;
  markPrice: number;
  change24h: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number | null;
  basis: number | null;
  isPerpetual: boolean;
  favourite: boolean;
}

export interface SpreadCell {
  longLabel: string;
  shortLabel: string;
  spreadLabel: string;
  bid: number;
  ask: number;
  bidDepth: number;
  askDepth: number;
}

export interface SelectedInstrument {
  name: string;
  type: "option" | "future" | "spread" | "combo";
  strike?: number;
  expiry?: string;
  putCall?: "C" | "P";
  price: number;
  lastPrice?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  iv?: number;
  longLeg?: string;
  shortLeg?: string;
  spreadBid?: number;
  spreadAsk?: number;
  legs?: ComboLeg[];
  comboType?: string;
  netDebit?: number;
}
