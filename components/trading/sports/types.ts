// ─── Union Types ─────────────────────────────────────────────────────────────

export type FootballLeague =
  | "EPL"
  | "La Liga"
  | "Bundesliga"
  | "Serie A"
  | "Ligue 1"
  | "UCL"
  | "UEL";

// Aligned with backend Fixture.status_short values
export type FixtureStatus =
  | "NS" // Not started
  | "LIVE" // Generic live (used when phase unknown)
  | "1H" // First half
  | "HT" // Half time
  | "2H" // Second half
  | "ET" // Extra time
  | "SUSP" // Suspended
  | "FT" // Full time
  | "AET" // After extra time
  | "PEN"; // After penalties

export type OddsMarket =
  | "FT Result"
  | "Over/Under 2.5"
  | "BTTS"
  | "Asian Handicap"
  | "Corners O9.5"
  | "HT Result"
  | "DNB";

// Aligned with backend bookmaker keys in FTOdds / ODOdds
export type Bookmaker =
  | "bet365"
  | "pinnacle"
  | "unibet"
  | "marathon"
  | "betfair_exchange"
  | "polymarket";

export type OddsMovement = "UP" | "DOWN" | "STABLE";

export type BetStatus = "open" | "won" | "lost" | "void" | "cashed_out";

// ─── Team & Fixture ───────────────────────────────────────────────────────────

export interface TeamRef {
  id: string;
  name: string;
  shortName: string; // "MCI", "LIV"
  logoSeed?: string; // for placeholder avatar colours
}

export interface MatchScore {
  home: number;
  away: number;
  ht?: { home: number; away: number };
}

// From FixtureStats / SFMatch
export interface TeamStats {
  xg: number;
  shotsTotal: number;
  shotsOnTarget: number;
  possession: number; // percentage 0-100
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  dangerousAttacks: number;
  dominanceIndex?: number; // SFMatchDominance rolling value
}

export interface MatchStats {
  home: TeamStats;
  away: TeamStats;
}

// From FixtureEvent / SFMatchEvent
export interface MatchEvent {
  minute: number;
  type:
    | "goal"
    | "yellow_card"
    | "red_card"
    | "substitution"
    | "var"
    | "penalty";
  team: "home" | "away";
  player: string;
  detail?: string; // "pen", "og", "assist: Salah"
}

export interface TeamLineup {
  formation: string; // "4-3-3"
  startingXI: string[];
  subs: string[];
}

// Pre-match data for NS fixtures
export interface PreMatchData {
  xgModel: { home: number; away: number };
  forecastProbs: { homeWin: number; draw: number; awayWin: number };
  weather?: { tempC: number; condition: string };
  injuries: { team: "home" | "away"; player: string; reason: string }[];
  homeForm: ("W" | "D" | "L")[]; // last 5
  awayForm: ("W" | "D" | "L")[]; // last 5
}

// SFMatchProgressiveStats — 30-second interval snapshots (completed matches, As-Of replay)
export interface ProgressiveStatsSnapshot {
  timer: string; // "45:30"
  minuteDecimal: number; // 45.5 — for slider positioning
  home: Partial<TeamStats>;
  away: Partial<TeamStats>;
}

// SFMatchProgressiveOdds — 30-second interval snapshots (completed matches, As-Of replay)
export interface ProgressiveOddsSnapshot {
  timer: string;
  minuteDecimal: number;
  odds1x2: { home: number; draw: number; away: number };
  ouLine: number; // 2.5
  ouOver: number;
  ouUnder: number;
}

export interface Fixture {
  id: string;
  canonicalKey: string; // fixture_canonical_key from backend
  league: FootballLeague;
  round: string; // "Matchday 28", "Quarter-Final"
  home: TeamRef;
  away: TeamRef;
  kickoff: string; // ISO datetime
  venue: string;
  referee?: string;
  status: FixtureStatus;
  minute?: number;
  score?: MatchScore;
  stats?: MatchStats;
  events?: MatchEvent[];
  lineups?: { home: TeamLineup; away: TeamLineup };
  preMatch?: PreMatchData; // NS fixtures only
  // Completed fixtures only — for As-Of replay slider
  progressiveOdds?: ProgressiveOddsSnapshot[];
  progressiveStats?: ProgressiveStatsSnapshot[];
}

// ─── Odds & Arb ──────────────────────────────────────────────────────────────

// One cell in the arb grid: fixture × bookmaker × market × outcome
export interface BookmakerOdds {
  fixtureId: string;
  bookmaker: Bookmaker;
  market: OddsMarket;
  outcome: string; // "Home", "Draw", "Away", "Over 2.5"
  odds: number;
  movement: OddsMovement;
  isLocked: boolean; // client not subscribed to this bookmaker
}

export interface ArbLeg {
  bookmaker: Bookmaker;
  outcome: string;
  odds: number;
  suggestedStake: number;
  suggestedReturn: number;
}

export interface ArbOpportunity {
  id: string;
  fixtureId: string;
  fixtureName: string; // "Man City vs Liverpool"
  league: FootballLeague;
  market: OddsMarket;
  status: FixtureStatus;
  legs: [ArbLeg, ArbLeg]; // always exactly two
  arbPct: number; // guaranteed profit %
  detectedAt: string; // ISO timestamp
  isActive: boolean; // false = decayed/closed
  decayedAt?: string;
}

// ─── Bets ─────────────────────────────────────────────────────────────────────

export interface AccumulatorLeg {
  fixtureId: string;
  fixtureName: string;
  market: OddsMarket;
  outcome: string;
  odds: number;
  legStatus: "pending" | "won" | "lost" | "void";
}

export interface Bet {
  id: string;
  fixtureId: string;
  fixtureName: string;
  league: FootballLeague;
  market: OddsMarket;
  outcome: string;
  bookmaker: Bookmaker;
  odds: number;
  stake: number;
  potentialReturn: number;
  status: BetStatus;
  placedAt: string;
  settledAt?: string;
  pnl?: number; // positive = profit
  isAccumulator: boolean;
  accumulatorLegs?: AccumulatorLeg[];
  kellyStake?: number; // suggested by Kelly criterion
}
