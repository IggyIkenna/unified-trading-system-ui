// ─── Union Types ─────────────────────────────────────────────────────────────

export type FootballLeague = "EPL" | "La Liga" | "Bundesliga" | "Serie A" | "Ligue 1" | "UCL" | "UEL";

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

// Aligned with backend VENUE_EXECUTION_REGISTRY — 78+ bookmakers across 4 categories
export type Bookmaker =
  // Exchanges (API execution)
  | "betfair_exchange"
  | "betfair_ex_uk"
  | "betfair_ex_eu"
  | "betfair_ex_au"
  | "matchbook"
  | "kalshi"
  | "polymarket"
  | "novig"
  | "prophetx"
  // Bookmaker APIs (API execution)
  | "pinnacle"
  | "onexbet"
  // International scrapers
  | "bet365"
  | "unibet"
  | "unibet_uk"
  | "unibet_fr"
  | "marathon"
  | "williamhill"
  | "paddypower"
  | "ladbrokes"
  | "ladbrokes_uk"
  | "coral"
  | "skybet"
  | "betway"
  | "betfred"
  | "betvictor"
  | "boylesports"
  | "bwin"
  | "sport888"
  | "betsson"
  | "coolbet"
  | "virginbet"
  | "livescorebet"
  | "bovada"
  | "betonlineag"
  | "mybookieag"
  // Australia
  | "sportsbet"
  | "tab"
  | "neds"
  | "pointsbetau"
  | "ladbrokes_au"
  | "bet365_au"
  // Regional
  | "winamax_fr"
  | "tipico_de"
  | "leovegas"
  // US sportsbooks
  | "draftkings"
  | "fanduel"
  | "betmgm"
  | "caesars"
  | "williamhill_us"
  | "betrivers"
  | "espnbet"
  | "hardrockbet"
  | "fanatics"
  // US DFS/Social
  | "prizepicks"
  | "underdog"
  | "fliff";

/** Bookmakers that can execute bets (not just odds) */
export const EXECUTION_CAPABLE_BOOKMAKERS: Bookmaker[] = [
  "betfair_exchange",
  "betfair_ex_uk",
  "betfair_ex_eu",
  "matchbook",
  "kalshi",
  "polymarket",
  "pinnacle",
  "onexbet",
  "bet365",
  "williamhill",
  "paddypower",
  "ladbrokes",
  "coral",
  "skybet",
  "betway",
  "betfred",
  "betvictor",
  "boylesports",
  "sport888",
  "draftkings",
  "fanduel",
  "betmgm",
  "betrivers",
  "espnbet",
];

export const BOOKMAKER_DISPLAY_NAMES: Record<Bookmaker, string> = {
  betfair_exchange: "Betfair Exchange",
  betfair_ex_uk: "Betfair Exchange UK",
  betfair_ex_eu: "Betfair Exchange EU",
  betfair_ex_au: "Betfair Exchange AU",
  matchbook: "Matchbook",
  kalshi: "Kalshi",
  polymarket: "Polymarket",
  novig: "Novig",
  prophetx: "ProphetX",
  pinnacle: "Pinnacle",
  onexbet: "1xBet",
  bet365: "bet365",
  unibet: "Unibet",
  unibet_uk: "Unibet UK",
  unibet_fr: "Unibet FR",
  marathon: "Marathonbet",
  williamhill: "William Hill",
  paddypower: "Paddy Power",
  ladbrokes: "Ladbrokes",
  ladbrokes_uk: "Ladbrokes UK",
  coral: "Coral",
  skybet: "Sky Bet",
  betway: "Betway",
  betfred: "Betfred",
  betvictor: "BetVictor",
  boylesports: "BoyleSports",
  bwin: "bwin",
  sport888: "888sport",
  betsson: "Betsson",
  coolbet: "Coolbet",
  virginbet: "Virgin Bet",
  livescorebet: "LiveScore Bet",
  bovada: "Bovada",
  betonlineag: "BetOnline",
  mybookieag: "MyBookie",
  sportsbet: "Sportsbet",
  tab: "TAB",
  neds: "Neds",
  pointsbetau: "PointsBet AU",
  ladbrokes_au: "Ladbrokes AU",
  bet365_au: "bet365 AU",
  winamax_fr: "Winamax",
  tipico_de: "Tipico",
  leovegas: "LeoVegas",
  draftkings: "DraftKings",
  fanduel: "FanDuel",
  betmgm: "BetMGM",
  caesars: "Caesars",
  williamhill_us: "William Hill US",
  betrivers: "BetRivers",
  espnbet: "ESPN Bet",
  hardrockbet: "Hard Rock Bet",
  fanatics: "Fanatics",
  prizepicks: "PrizePicks",
  underdog: "Underdog Fantasy",
  fliff: "Fliff",
};

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
  type: "goal" | "yellow_card" | "red_card" | "substitution" | "var" | "penalty";
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
  minuteDecimal: number; // 45.5: for slider positioning
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

// ─── Standings (from CanonicalStanding) ──────────────────────────────────────

export interface Standing {
  leagueId: string;
  season: string;
  rank: number;
  teamId: string;
  teamName: string;
  points: number;
  goalsDiff: number;
  form: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

// ─── Predictions (from CanonicalPrediction) ─────────────────────────────────

export interface Prediction {
  fixtureId: string;
  source: string;
  kickoffUtc: string;
  homeTeam: string;
  awayTeam: string;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  bttsProb: number;
  over25Prob: number;
  under25Prob: number;
  xgHome: number;
  xgAway: number;
  modelVersion?: string;
  confidence?: number;
}

// ─── Player Performance (from CanonicalPlayerPerformance) ────────────────────

export interface PlayerPerformance {
  fixtureId: string;
  playerId: string;
  playerName: string;
  teamId: string;
  position: string;
  minutesPlayed: number;
  rating?: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
  yellowCards: number;
  redCards: number;
}

// ─── Weather Detail (from CanonicalWeather) ──────────────────────────────────

export interface WeatherDetail {
  temperatureCelsius: number;
  windSpeedMs: number;
  humidityPct: number;
  precipitationMm: number;
  cloudCoverPct: number;
  condition: string;
}

// ─── CLV Record (from CLVRecord) ─────────────────────────────────────────────

export interface CLVRecord {
  modelVersion: string;
  marketType: OddsMarket;
  bookmakerKey: Bookmaker;
  periodStart: string;
  periodEnd: string;
  totalBets: number;
  betsBeatClose: number;
  meanClvPct: number;
  clvHitRate: number;
  totalStake: number;
  totalPnl: number;
  roiPct: number;
}

// ─── Bookmaker Tier (from VenueExecutionProfile) ────────────────────────────

export type BookmakerTier = "exchange" | "api_bookmaker" | "scraper" | "us_sportsbook" | "prediction_market";

export interface BookmakerProfile {
  key: Bookmaker;
  displayName: string;
  tier: BookmakerTier;
  supportsLive: boolean;
  supportsCashOut: boolean;
  executionCapable: boolean;
}
