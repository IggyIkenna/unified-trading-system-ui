import type { Bookmaker, FootballLeague, OddsMarket } from "@/components/trading/sports/types";

export const FOOTBALL_LEAGUES: FootballLeague[] = ["EPL", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "UCL", "UEL"];

export const BOOKMAKERS: Bookmaker[] = [
  "betfair_exchange", "smarkets", "matchbook", "pinnacle", "polymarket",
  "bet365", "unibet", "marathon", "williamhill", "paddypower", "ladbrokes",
  "coral", "skybet", "betway", "sport888", "betvictor", "boylesports",
  "draftkings", "fanduel", "betmgm", "betrivers", "espnbet",
  "bovada", "betonlineag",
];

export const SUBSCRIBED_BOOKMAKERS: Bookmaker[] = [
  "betfair_exchange", "pinnacle", "bet365", "unibet", "smarkets",
  "draftkings", "fanduel",
];

export const ODDS_MARKETS: OddsMarket[] = [
  "FT Result",
  "Over/Under 2.5",
  "BTTS",
  "Asian Handicap",
  "Corners O9.5",
  "HT Result",
  "DNB",
];

export const ARB_THRESHOLD_OPTIONS = [0.5, 1.0, 1.5, 2.0, 3.0]; // %

export const DEFAULT_ARB_THRESHOLD = 1.0;

export const TOTAL_BANKROLL = 100_000;
export const KELLY_HALF_FRACTION = 0.5;
export const KELLY_MAX_STAKE_PCT = 0.05;
