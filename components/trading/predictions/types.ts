import type { Bookmaker as SportsBookmaker } from "@/components/trading/sports/types";

// Re-export sports types that prediction markets also use
export type {
  ArbOpportunity,
  ArbLeg,
  Bookmaker,
  OddsMarket,
  Fixture,
  ProgressiveOddsSnapshot,
  ProgressiveStatsSnapshot,
  FixtureStatus,
  FootballLeague,
  TeamStats,
  MatchStats,
  OddsMovement,
} from "@/components/trading/sports/types";

// ─── Prediction Market Core ───────────────────────────────────────────────────

export type MarketCategory = "trending" | "breaking" | "sports" | "crypto" | "finance" | "geopolitics" | "elections";

export type MarketVenue = "polymarket" | "kalshi";
export type MarketType = "binary" | "multi";
export type SortOption = "trending" | "newest" | "highest_volume" | "closing_soon";

export interface MarketOutcome {
  name: string;
  probability: number; // 0-100
  yesPrice: number; // 0-1
  noPrice: number; // 0-1
}

export interface PredictionMarket {
  id: string;
  question: string;
  category: MarketCategory;
  venue: MarketVenue;
  type: MarketType;
  outcomes: MarketOutcome[];
  volume: number;
  volumeLabel: string;
  resolutionDate: string | null;
  isLive: boolean;
  isTrending: boolean;
  // Price history series for chart: probability of primary outcome over time
  priceSeries?: { t: number; prob: number }[]; // t = unix seconds
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export type PositionStatus = "open" | "settled";
export type SettlementOutcome = "won" | "lost" | "void";

export interface PredictionPosition {
  id: string;
  marketId: string;
  marketQuestion: string;
  category: MarketCategory;
  venue: MarketVenue;
  outcome: string; // "YES" | "NO" | multi outcome name
  side: "yes" | "no";
  sharesHeld: number;
  entryPricePerShare: number; // cents 0-100
  currentPricePerShare: number;
  totalStaked: number;
  potentialReturn: number;
  unrealisedPnl: number;
  resolutionDate: string | null;
  status: PositionStatus;
  openedAt: string;
  settledAt?: string;
  settlementOutcome?: SettlementOutcome;
  realisedPnl?: number;
}

// ─── ODUM Focus ───────────────────────────────────────────────────────────────

export type OdumInstrumentType = "crypto" | "tradfi" | "football";
export type Timeframe = "5m" | "15m" | "1h" | "4h" | "24h";

export interface UnderlyingDataPoint {
  t: number; // unix seconds
  price: number; // underlying asset price
  oddsYes: number; // 0-100 cents
}

export interface OdumInstrument {
  id: string;
  type: OdumInstrumentType;
  label: string;
  subLabel?: string; // e.g. "BTC/USD · Polymarket"
  timeframe?: Timeframe; // crypto/tradfi only
  fixtureId?: string; // football only
  polymarketMarketId: string;
  kalshiMarketId?: string;
  currentOddsYes: number; // 0-100 cents
  currentOddsNo: number;
  underlyingPrice?: number; // BTC/SPY current price
  underlyingSeries: UnderlyingDataPoint[];
  closestStrikeDelta?: number; // 0-1, options delta for BTC/ETH/SPY
  deltaSeriesSlope?: "up" | "down" | "flat";
  oddsSlopeVsDelta?: "aligned" | "diverging";
  resolutionAt: string; // ISO datetime
  volume: number;
  venue: MarketVenue;
  isTrending: boolean;
}

// ─── Prediction Arb ───────────────────────────────────────────────────────────

export type PredictionArbMarketType = "football" | "crypto" | "tradfi";

export type ArbVenue = MarketVenue | SportsBookmaker;

export interface PredictionArbLeg {
  venue: ArbVenue;
  odds: number; // decimal odds for arb calc
  oddsDisplay: string; // "68¢" or "1.55" depending on context
  suggestedStake: number;
}

export interface PredictionArbOpportunity {
  id: string;
  marketType: PredictionArbMarketType;
  question: string; // "Arsenal to win EPL 2025/26"
  outcome: string; // "YES" | "Home Win"
  legs: [PredictionArbLeg, PredictionArbLeg];
  arbPct: number;
  detectedAt: string;
  isActive: boolean;
  decayedAt?: string;
}
