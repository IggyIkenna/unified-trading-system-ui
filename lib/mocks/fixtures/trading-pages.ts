/** Trading pages — SAFT, options Greeks, overview service seeds, predictions, sports builders. */

import type { ServiceHealth } from "@/components/trading/health-status-grid";
import type { Bookmaker, Fixture, OddsMarket } from "@/components/trading/sports/types";

export interface SAFTRecord {
  id: string;
  token: string;
  round: "Seed" | "Series A" | "Strategic" | "Private";
  committedAmount: number;
  tokenPrice: number;
  tokensAllocated: number;
  vestedPct: number;
  cliffDate: string;
  fullVestDate: string;
  currentPrice: number;
  currentValue: number;
  npv: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export const MOCK_SAFTS: SAFTRecord[] = [
  {
    id: "SAFT-001",
    token: "Protocol X (PX)",
    round: "Seed",
    committedAmount: 500000,
    tokenPrice: 0.08,
    tokensAllocated: 6250000,
    vestedPct: 45,
    cliffDate: "2025-09-01",
    fullVestDate: "2027-09-01",
    currentPrice: 0.14,
    currentValue: 875000,
    npv: 742500,
  },
  {
    id: "SAFT-002",
    token: "Protocol Y (PY)",
    round: "Series A",
    committedAmount: 750000,
    tokenPrice: 0.25,
    tokensAllocated: 3000000,
    vestedPct: 30,
    cliffDate: "2026-01-15",
    fullVestDate: "2028-01-15",
    currentPrice: 0.42,
    currentValue: 1260000,
    npv: 1050000,
  },
  {
    id: "SAFT-003",
    token: "DeFi Chain (DFC)",
    round: "Strategic",
    committedAmount: 400000,
    tokenPrice: 1.2,
    tokensAllocated: 333333,
    vestedPct: 65,
    cliffDate: "2025-06-01",
    fullVestDate: "2027-06-01",
    currentPrice: 2.85,
    currentValue: 950000,
    npv: 855000,
  },
  {
    id: "SAFT-004",
    token: "ZK Layer (ZKL)",
    round: "Seed",
    committedAmount: 350000,
    tokenPrice: 0.015,
    tokensAllocated: 23333333,
    vestedPct: 20,
    cliffDate: "2026-03-01",
    fullVestDate: "2028-09-01",
    currentPrice: 0.028,
    currentValue: 653333,
    npv: 522667,
  },
  {
    id: "SAFT-005",
    token: "Cross Bridge (XBR)",
    round: "Private",
    committedAmount: 400000,
    tokenPrice: 0.5,
    tokensAllocated: 800000,
    vestedPct: 55,
    cliffDate: "2025-07-15",
    fullVestDate: "2027-07-15",
    currentPrice: 0.82,
    currentValue: 656000,
    npv: 557600,
  },
];

export type PricingModel = "black-scholes" | "svi" | "sabr" | "heston" | "mixed";
export type Underlying = "BTC" | "ETH";

export interface GreeksRow {
  strike: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface ModelComparison {
  strike: number;
  moneyness: string;
  bs: number;
  svi: number;
  sabr: number;
  heston: number;
  marketMid: number;
  closest: PricingModel;
}

export const MOCK_GREEKS: GreeksRow[] = [
  { strike: 60000, delta: 0.89, gamma: 0.00002, theta: -12.45, vega: 48.2, rho: 18.3 },
  { strike: 62000, delta: 0.82, gamma: 0.00003, theta: -15.67, vega: 62.1, rho: 16.8 },
  { strike: 64000, delta: 0.72, gamma: 0.00004, theta: -19.34, vega: 78.5, rho: 14.9 },
  { strike: 65000, delta: 0.65, gamma: 0.00005, theta: -22.1, vega: 89.3, rho: 13.4 },
  { strike: 66000, delta: 0.57, gamma: 0.00005, theta: -24.56, vega: 95.7, rho: 11.9 },
  { strike: 67000, delta: 0.51, gamma: 0.00006, theta: -25.89, vega: 98.2, rho: 10.5 },
  { strike: 68000, delta: 0.44, gamma: 0.00005, theta: -24.78, vega: 96.1, rho: 9.2 },
  { strike: 70000, delta: 0.32, gamma: 0.00004, theta: -20.45, vega: 82.4, rho: 7.1 },
  { strike: 72000, delta: 0.22, gamma: 0.00003, theta: -15.89, vega: 64.8, rho: 5.3 },
  { strike: 75000, delta: 0.12, gamma: 0.00002, theta: -9.67, vega: 42.1, rho: 3.2 },
];

export const MOCK_MODEL_COMPARISON: ModelComparison[] = [
  {
    strike: 60000,
    moneyness: "0.89",
    bs: 8234,
    svi: 8189,
    sabr: 8212,
    heston: 8201,
    marketMid: 8205,
    closest: "heston",
  },
  { strike: 64000, moneyness: "0.95", bs: 5102, svi: 5078, sabr: 5089, heston: 5095, marketMid: 5090, closest: "sabr" },
  { strike: 67000, moneyness: "0.99", bs: 3456, svi: 3423, sabr: 3440, heston: 3448, marketMid: 3442, closest: "sabr" },
  { strike: 70000, moneyness: "1.04", bs: 2187, svi: 2201, sabr: 2195, heston: 2190, marketMid: 2193, closest: "sabr" },
  { strike: 75000, moneyness: "1.11", bs: 987, svi: 1012, sabr: 1005, heston: 998, marketMid: 1002, closest: "heston" },
];

export const SEED_SERVICES: ServiceHealth[] = [
  { name: "Market Data", freshness: 2, sla: 10, status: "live" },
  { name: "Execution", freshness: 1, sla: 5, status: "live" },
  { name: "Risk Engine", freshness: 5, sla: 15, status: "live" },
  { name: "P&L Attribution", freshness: 8, sla: 30, status: "live" },
  { name: "Position Monitor", freshness: 3, sla: 10, status: "live" },
  { name: "Strategy Service", freshness: 4, sla: 10, status: "live" },
  { name: "Features Pipeline", freshness: 12, sla: 60, status: "live" },
  { name: "ML Inference", freshness: 45, sla: 60, status: "warning" },
];

export interface PredictionMarket {
  id: string;
  question: string;
  category: string;
  source: string;
  probabilityYes: number;
  volume24h: number;
  liquidity: number;
  expiresAt: string;
}

export interface AggregatorEntry {
  marketId: string;
  market: PredictionMarket;
  position: "yes" | "no";
  costPerShare: number;
}

export const MOCK_MARKETS: PredictionMarket[] = [
  {
    id: "mkt-001",
    question: "Will BTC exceed $150,000 by June 2026?",
    category: "Crypto",
    source: "Polymarket",
    probabilityYes: 0.34,
    volume24h: 2_840_000,
    liquidity: 8_200_000,
    expiresAt: "2026-06-30",
  },
  {
    id: "mkt-002",
    question: "Will ETH flip BTC in market cap by 2027?",
    category: "Crypto",
    source: "Polymarket",
    probabilityYes: 0.08,
    volume24h: 1_120_000,
    liquidity: 4_500_000,
    expiresAt: "2027-12-31",
  },
  {
    id: "mkt-003",
    question: "Will the Fed cut rates below 3% by December 2026?",
    category: "Macro",
    source: "Kalshi",
    probabilityYes: 0.42,
    volume24h: 5_600_000,
    liquidity: 12_000_000,
    expiresAt: "2026-12-31",
  },
  {
    id: "mkt-004",
    question: "Will Arsenal win the 2025/26 Premier League?",
    category: "Sports",
    source: "Polymarket",
    probabilityYes: 0.28,
    volume24h: 890_000,
    liquidity: 3_200_000,
    expiresAt: "2026-05-25",
  },
  {
    id: "mkt-005",
    question: "Will SOL reach $500 by Q2 2026?",
    category: "Crypto",
    source: "Polymarket",
    probabilityYes: 0.18,
    volume24h: 1_560_000,
    liquidity: 5_100_000,
    expiresAt: "2026-06-30",
  },
  {
    id: "mkt-006",
    question: "Will EU impose crypto capital gains harmonization by 2027?",
    category: "Regulation",
    source: "Kalshi",
    probabilityYes: 0.55,
    volume24h: 340_000,
    liquidity: 1_800_000,
    expiresAt: "2027-01-01",
  },
  {
    id: "mkt-007",
    question: "Will a major bank launch a stablecoin in 2026?",
    category: "Crypto",
    source: "Polymarket",
    probabilityYes: 0.67,
    volume24h: 2_100_000,
    liquidity: 6_400_000,
    expiresAt: "2026-12-31",
  },
  {
    id: "mkt-008",
    question: "Will Real Madrid win Champions League 2025/26?",
    category: "Sports",
    source: "Polymarket",
    probabilityYes: 0.22,
    volume24h: 1_230_000,
    liquidity: 4_100_000,
    expiresAt: "2026-05-31",
  },
  {
    id: "mkt-009",
    question: "Will US approve a spot ETH ETF with staking by 2026?",
    category: "Regulation",
    source: "Kalshi",
    probabilityYes: 0.61,
    volume24h: 3_400_000,
    liquidity: 9_800_000,
    expiresAt: "2026-12-31",
  },
  {
    id: "mkt-010",
    question: "Will global AI regulation treaty be signed by 2027?",
    category: "Politics",
    source: "Metaculus",
    probabilityYes: 0.15,
    volume24h: 180_000,
    liquidity: 950_000,
    expiresAt: "2027-12-31",
  },
];

export interface AccumulatorFixture {
  id: string;
  league: string;
  leagueCountry: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  oddsHome: number;
  oddsDraw: number;
  oddsAway: number;
}

export interface AccumulatorLeg {
  fixtureId: string;
  fixture: AccumulatorFixture;
  selection: "home" | "draw" | "away";
  odds: number;
}

export const MOCK_FIXTURES: AccumulatorFixture[] = [
  {
    id: "fix-020",
    league: "Premier League",
    leagueCountry: "England",
    homeTeam: "Arsenal",
    awayTeam: "Manchester City",
    kickoff: "2026-03-29T15:00:00Z",
    oddsHome: 2.45,
    oddsDraw: 3.3,
    oddsAway: 2.75,
  },
  {
    id: "fix-002",
    league: "Premier League",
    leagueCountry: "England",
    homeTeam: "Liverpool",
    awayTeam: "Chelsea",
    kickoff: "2026-03-29T17:30:00Z",
    oddsHome: 1.85,
    oddsDraw: 3.6,
    oddsAway: 4.1,
  },
  {
    id: "fix-003",
    league: "La Liga",
    leagueCountry: "Spain",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    kickoff: "2026-03-29T20:00:00Z",
    oddsHome: 2.1,
    oddsDraw: 3.4,
    oddsAway: 3.25,
  },
  {
    id: "fix-004",
    league: "La Liga",
    leagueCountry: "Spain",
    homeTeam: "Atletico Madrid",
    awayTeam: "Sevilla",
    kickoff: "2026-03-30T14:00:00Z",
    oddsHome: 1.75,
    oddsDraw: 3.5,
    oddsAway: 4.8,
  },
  {
    id: "fix-005",
    league: "Serie A",
    leagueCountry: "Italy",
    homeTeam: "AC Milan",
    awayTeam: "Inter Milan",
    kickoff: "2026-03-30T17:45:00Z",
    oddsHome: 2.9,
    oddsDraw: 3.15,
    oddsAway: 2.4,
  },
  {
    id: "fix-006",
    league: "Bundesliga",
    leagueCountry: "Germany",
    homeTeam: "Bayern Munich",
    awayTeam: "Borussia Dortmund",
    kickoff: "2026-03-30T17:30:00Z",
    oddsHome: 1.55,
    oddsDraw: 4.2,
    oddsAway: 5.5,
  },
  {
    id: "fix-007",
    league: "Ligue 1",
    leagueCountry: "France",
    homeTeam: "PSG",
    awayTeam: "Marseille",
    kickoff: "2026-03-30T20:45:00Z",
    oddsHome: 1.4,
    oddsDraw: 4.8,
    oddsAway: 7.0,
  },
  {
    id: "fix-008",
    league: "Premier League",
    leagueCountry: "England",
    homeTeam: "Tottenham",
    awayTeam: "Newcastle",
    kickoff: "2026-03-31T14:00:00Z",
    oddsHome: 2.3,
    oddsDraw: 3.4,
    oddsAway: 3.0,
  },
];

// ─── Mock fixtures with multi-bookmaker odds ────────────────────────────────

interface FixtureOdds {
  bookmaker: Bookmaker;
  market: OddsMarket;
  outcomes: { label: string; odds: number }[];
}

interface FixtureWithOdds {
  fixture: Fixture;
  odds: FixtureOdds[];
}

function makeOdds(bk: Bookmaker, market: OddsMarket, outcomes: { label: string; odds: number }[]): FixtureOdds {
  return { bookmaker: bk, market, outcomes };
}

export const MOCK_FIXTURES_WITH_ODDS: FixtureWithOdds[] = [
  {
    fixture: {
      id: "fix-001",
      canonicalKey: "EPL_MCI_LIV_2026-03-29",
      league: "EPL",
      round: "Matchday 30",
      home: { id: "mci", name: "Manchester City", shortName: "MCI" },
      away: { id: "liv", name: "Liverpool", shortName: "LIV" },
      kickoff: "2026-03-29T15:00:00Z",
      venue: "Etihad Stadium",
      status: "NS",
    },
    odds: [
      makeOdds("bet365", "FT Result", [
        { label: "Home", odds: 2.1 },
        { label: "Draw", odds: 3.4 },
        { label: "Away", odds: 3.25 },
      ]),
      makeOdds("pinnacle", "FT Result", [
        { label: "Home", odds: 2.15 },
        { label: "Draw", odds: 3.45 },
        { label: "Away", odds: 3.2 },
      ]),
      makeOdds("betfair_exchange", "FT Result", [
        { label: "Home", odds: 2.18 },
        { label: "Draw", odds: 3.5 },
        { label: "Away", odds: 3.3 },
      ]),
      makeOdds("williamhill", "FT Result", [
        { label: "Home", odds: 2.05 },
        { label: "Draw", odds: 3.3 },
        { label: "Away", odds: 3.4 },
      ]),
      makeOdds("paddypower", "FT Result", [
        { label: "Home", odds: 2.1 },
        { label: "Draw", odds: 3.4 },
        { label: "Away", odds: 3.25 },
      ]),
      makeOdds("bet365", "Over/Under 2.5", [
        { label: "Over 2.5", odds: 1.72 },
        { label: "Under 2.5", odds: 2.1 },
      ]),
      makeOdds("pinnacle", "Over/Under 2.5", [
        { label: "Over 2.5", odds: 1.75 },
        { label: "Under 2.5", odds: 2.08 },
      ]),
      makeOdds("bet365", "BTTS", [
        { label: "Yes", odds: 1.65 },
        { label: "No", odds: 2.15 },
      ]),
    ],
  },
  {
    fixture: {
      id: "fix-002",
      canonicalKey: "EPL_ARS_CHE_2026-03-29",
      league: "EPL",
      round: "Matchday 30",
      home: { id: "ars", name: "Arsenal", shortName: "ARS" },
      away: { id: "che", name: "Chelsea", shortName: "CHE" },
      kickoff: "2026-03-29T17:30:00Z",
      venue: "Emirates Stadium",
      status: "NS",
    },
    odds: [
      makeOdds("bet365", "FT Result", [
        { label: "Home", odds: 1.75 },
        { label: "Draw", odds: 3.6 },
        { label: "Away", odds: 4.5 },
      ]),
      makeOdds("pinnacle", "FT Result", [
        { label: "Home", odds: 1.78 },
        { label: "Draw", odds: 3.55 },
        { label: "Away", odds: 4.4 },
      ]),
      makeOdds("betfair_exchange", "FT Result", [
        { label: "Home", odds: 1.8 },
        { label: "Draw", odds: 3.65 },
        { label: "Away", odds: 4.55 },
      ]),
      makeOdds("ladbrokes", "FT Result", [
        { label: "Home", odds: 1.72 },
        { label: "Draw", odds: 3.5 },
        { label: "Away", odds: 4.6 },
      ]),
      makeOdds("skybet", "FT Result", [
        { label: "Home", odds: 1.73 },
        { label: "Draw", odds: 3.6 },
        { label: "Away", odds: 4.5 },
      ]),
      makeOdds("bet365", "Over/Under 2.5", [
        { label: "Over 2.5", odds: 1.85 },
        { label: "Under 2.5", odds: 1.95 },
      ]),
      makeOdds("pinnacle", "BTTS", [
        { label: "Yes", odds: 1.72 },
        { label: "No", odds: 2.05 },
      ]),
    ],
  },
  {
    fixture: {
      id: "fix-003",
      canonicalKey: "LALIGA_RMA_BAR_2026-03-30",
      league: "La Liga",
      round: "Matchday 29",
      home: { id: "rma", name: "Real Madrid", shortName: "RMA" },
      away: { id: "bar", name: "Barcelona", shortName: "BAR" },
      kickoff: "2026-03-30T20:00:00Z",
      venue: "Santiago Bernabéu",
      status: "NS",
    },
    odds: [
      makeOdds("bet365", "FT Result", [
        { label: "Home", odds: 2.4 },
        { label: "Draw", odds: 3.2 },
        { label: "Away", odds: 2.9 },
      ]),
      makeOdds("pinnacle", "FT Result", [
        { label: "Home", odds: 2.45 },
        { label: "Draw", odds: 3.25 },
        { label: "Away", odds: 2.85 },
      ]),
      makeOdds("betfair_exchange", "FT Result", [
        { label: "Home", odds: 2.48 },
        { label: "Draw", odds: 3.3 },
        { label: "Away", odds: 2.88 },
      ]),
      makeOdds("bwin", "FT Result", [
        { label: "Home", odds: 2.35 },
        { label: "Draw", odds: 3.15 },
        { label: "Away", odds: 2.95 },
      ]),
      makeOdds("unibet", "FT Result", [
        { label: "Home", odds: 2.42 },
        { label: "Draw", odds: 3.22 },
        { label: "Away", odds: 2.88 },
      ]),
      makeOdds("bet365", "Over/Under 2.5", [
        { label: "Over 2.5", odds: 1.6 },
        { label: "Under 2.5", odds: 2.3 },
      ]),
    ],
  },
  {
    fixture: {
      id: "fix-004",
      canonicalKey: "UCL_BAY_PSG_2026-04-02",
      league: "UCL",
      round: "Quarter-Final 1st Leg",
      home: { id: "bay", name: "Bayern Munich", shortName: "BAY" },
      away: { id: "psg", name: "Paris Saint-Germain", shortName: "PSG" },
      kickoff: "2026-04-02T20:00:00Z",
      venue: "Allianz Arena",
      status: "NS",
    },
    odds: [
      makeOdds("bet365", "FT Result", [
        { label: "Home", odds: 1.9 },
        { label: "Draw", odds: 3.5 },
        { label: "Away", odds: 3.8 },
      ]),
      makeOdds("pinnacle", "FT Result", [
        { label: "Home", odds: 1.92 },
        { label: "Draw", odds: 3.55 },
        { label: "Away", odds: 3.75 },
      ]),
      makeOdds("betfair_exchange", "FT Result", [
        { label: "Home", odds: 1.95 },
        { label: "Draw", odds: 3.6 },
        { label: "Away", odds: 3.85 },
      ]),
      makeOdds("coral", "FT Result", [
        { label: "Home", odds: 1.85 },
        { label: "Draw", odds: 3.4 },
        { label: "Away", odds: 3.9 },
      ]),
    ],
  },
];
