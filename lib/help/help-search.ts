/**
 * Keyword-based fuzzy search over the help tree.
 *
 * Tokenizes the user query and scores each HelpNode by weighted keyword overlap
 * against question text, answer text, and a synonym/alias table. Returns top
 * matches ranked by relevance.
 */

import { HELP_TREE, type HelpNode } from "./help-tree";

// ── Synonym / alias table ────────────────────────────────────────────────────
// Maps common user terms → canonical tokens that appear in node text.
const SYNONYMS: Record<string, string[]> = {
  pnl: ["p&l", "profit", "loss", "pnl"],
  "p&l": ["pnl", "profit", "loss"],
  profit: ["pnl", "p&l", "realised", "unrealised"],
  loss: ["pnl", "p&l", "drawdown"],
  money: ["pnl", "p&l", "profit", "loss", "balance"],
  portfolio: ["positions", "pnl", "exposure"],
  trade: ["order", "execution", "swap", "buy", "sell", "book", "fills", "positions", "trades"],
  trades: ["trade", "order", "book", "fills", "positions", "execution", "history"],
  history: ["trades", "book", "journal", "audit", "settlement"],
  fills: ["trade", "order", "book", "execution"],
  see: ["view", "find", "show", "check", "monitor"],
  view: ["see", "find", "show", "check"],
  show: ["see", "view", "find", "display"],
  all: ["every", "total", "complete", "full"],
  buy: ["order", "trade", "long"],
  sell: ["order", "trade", "short"],
  swap: ["defi", "uniswap", "trade"],
  crypto: ["defi", "bitcoin", "ethereum", "btc", "eth"],
  bitcoin: ["crypto", "btc"],
  ethereum: ["crypto", "eth", "defi"],
  bet: ["sports", "fixture", "wager", "stake"],
  football: ["sports", "fixture", "league"],
  soccer: ["sports", "fixture", "football"],
  basketball: ["sports", "fixture"],
  odds: ["sports", "arb", "arbitrage", "bookmaker"],
  arb: ["arbitrage", "odds", "mispriced"],
  arbitrage: ["arb", "odds", "mispriced"],
  filter: ["filtering", "scope", "dropdown", "organisation", "client"],
  search: ["find", "search", "instruments", "command"],
  find: ["search", "instruments", "navigate"],
  navigate: ["find", "search", "page", "go"],
  gas: ["defi", "fee", "ethereum", "transaction"],
  fee: ["gas", "cost", "commission"],
  risk: ["exposure", "var", "drawdown", "alert", "monitor"],
  alert: ["notification", "warning", "threshold", "risk"],
  model: ["ml", "machine", "learning", "training", "inference"],
  ml: ["model", "machine", "learning", "training"],
  ai: ["ml", "model", "machine", "learning"],
  backtest: ["research", "strategy", "historical", "simulation"],
  strategy: ["backtest", "signal", "algo", "promote"],
  promote: ["production", "pipeline", "candidate", "approval"],
  live: ["production", "real", "execution"],
  simulated: ["paper", "demo", "test"],
  paper: ["simulated", "demo"],
  widget: ["layout", "customise", "drag", "resize", "workspace"],
  layout: ["widget", "customise", "workspace", "grid"],
  workspace: ["widget", "layout", "saved", "export"],
  dashboard: ["home", "overview", "services"],
  home: ["dashboard", "overview"],
  report: ["executive", "settlement", "reconciliation", "regulatory", "export"],
  export: ["download", "csv", "pdf", "report"],
  download: ["export", "csv", "pdf"],
  account: ["settings", "profile", "api", "key", "user"],
  settings: ["account", "profile", "preferences", "api"],
  api: ["key", "credentials", "integration"],
  key: ["api", "credentials", "secret"],
  kill: ["emergency", "stop", "halt", "flatten"],
  emergency: ["kill", "stop", "halt"],
  stop: ["kill", "emergency", "halt"],
  help: ["support", "contact", "demo", "question"],
  support: ["help", "contact"],
  option: ["options", "futures", "derivatives", "greeks"],
  options: ["option", "futures", "derivatives", "greeks"],
  futures: ["options", "derivatives", "expiry"],
  prediction: ["predictions", "polymarket", "event"],
  predictions: ["prediction", "polymarket", "event"],
  chain: ["defi", "ethereum", "arbitrum", "polygon", "base", "optimism"],
  flash: ["flash loan", "aave", "borrow"],
  loan: ["flash", "aave", "borrow", "collateral"],
  reconciliation: ["recon", "break", "discrepancy", "venue"],
  recon: ["reconciliation", "break", "discrepancy"],
  venue: ["exchange", "binance", "hyperliquid", "uniswap"],
  exchange: ["venue", "binance"],
  keyboard: ["shortcut", "cmd", "ctrl", "hotkey"],
  shortcut: ["keyboard", "cmd", "ctrl", "hotkey"],
  ibor: ["book", "records", "golden", "source", "positions", "audit"],
  nav: ["asset", "value", "fund", "aum", "investor"],
  fund: ["admin", "investor", "capital", "distribution", "fee"],
  saft: ["token", "warrant", "vesting", "cliff", "unlock"],
  valuation: ["pricing", "mark", "price", "token", "waterfall"],
  scenario: ["what-if", "stress", "shock", "impact", "crash"],
  staking: ["validator", "yield", "stake", "unstake", "rewards", "defi"],
  accumulator: ["sports", "multi-leg", "combo", "bet"],
  combo: ["options", "spread", "straddle", "iron", "condor", "butterfly"],
  aggregator: ["predictions", "multi-market", "combine"],
  rebalance: ["drift", "allocation", "target", "model", "portfolio"],
  notification: ["alert", "push", "mobile", "email", "telegram"],
  // ── Catalogue vocabulary — widgets, archetypes, families, asset groups ──
  // Synonyms are added to the query token set; keep them surgical. Avoid
  // explosive expansion (family → carry → arbitrage → ...) because that
  // floods scoring across unrelated nodes.
  catalogue: ["browse", "catalog"],
  catalog: ["catalogue", "browse"],
  archetype: ["archetypes"],
  archetypes: ["archetype"],
  family: ["families"],
  families: ["family"],
  basis: ["carry", "perp", "dated", "staked"],
  recursive: ["staked", "leverage", "loop"],
  liquidation: ["capture", "flash", "loan", "aave"],
  dispersion: ["arbitrage", "cross-venue", "cex-dex"],
  smile: ["iv", "vol", "implied", "skew"],
  greek: ["delta", "gamma", "vega", "theta"],
  greeks: ["greek"],
  cefi: ["centralised", "binance", "okx", "bybit", "deribit", "hyperliquid", "kraken"],
  defi: ["decentralised", "uniswap", "aave", "morpho", "compound", "lido", "jito", "eigenlayer"],
  tradfi: ["traditional", "cme", "futures", "es", "nq", "vix", "etf"],
  prediction: ["predictions", "polymarket", "event", "binary"],
  // ── Cockpit / workspace vocabulary ──────────────────────────────────────
  cockpit: ["workspace", "terminal", "dart", "command", "shell"],
  scope: ["filter", "asset group", "family", "archetype", "venue", "share class"],
  preset: ["starter", "cockpit", "workspace", "arbitrage command", "vol lab"],
  starter: ["preset", "onboarding", "cockpit"],
  monitor: ["watch", "supervise", "passive", "engagement"],
  replicate: ["walk through", "manual", "step by step", "engagement", "leg"],
  engagement: ["monitor", "replicate", "trade builder", "walk through"],
  surface: ["terminal", "research", "reports", "signals", "ops"],
  mode: ["command", "markets", "strategies", "explain", "ops", "terminal mode"],
  stage: ["discover", "build", "train", "validate", "allocate", "promote", "research stage"],
  command: ["terminal", "live", "positions", "orders", "kill switch"],
  explain: ["attribution", "drift", "slippage", "pnl attribution", "execution quality"],
  bundle: ["release bundle", "config", "promote", "version"],
  override: ["runtime override", "config", "size multiplier", "pause"],
  assumption: ["assumption stack", "operating", "drift", "realised"],
  fomo: ["locked", "preview", "upgrade", "available", "request access"],
  locked: ["fomo", "preview", "upgrade", "tier", "entitlement"],
  available: ["request access", "explore", "fomo", "catalogue", "subscribe"],
  hidden: ["pre-maturity", "retired", "admin only", "visibility"],
  owned: ["subscribed", "allocated", "live", "visibility"],
  visibility: ["resolver", "owned", "locked", "hidden", "available", "fomo"],
  resolver: ["visibility", "availability", "scope", "persona", "entitlement"],
  lifecycle: ["discover", "build", "train", "validate", "allocate", "promote", "research"],
  freeze: ["pause", "screenshot", "deterministic", "playwright", "mock"],
  pace: ["accelerated", "demo", "real-time", "mock"],
  mock: ["demo", "freeze", "pace", "tier zero", "scenario"],
  demo: ["mock", "freeze", "pace", "tier zero", "starter"],
  tier: ["upgrade", "entitlement", "subscription", "starter", "professional"],
  scenario: ["what-if", "stress", "shock", "impact", "crash", "tier zero", "preset"],
  pipeline: ["lifecycle", "promote", "research", "stages"],
  share: ["share class", "btc", "eth", "usdt", "usdc", "usd"],
  class: ["share class", "btc", "eth", "usdt", "usdc", "usd"],
  paper: ["simulated", "demo", "stream", "execution stream"],
  stream: ["paper", "live", "execution stream"],
};

// ── Flatten tree ─────────────────────────────────────────────────────────────

interface ScoredNode {
  node: HelpNode;
  score: number;
}

function flattenTree(nodes: HelpNode[]): HelpNode[] {
  const result: HelpNode[] = [];
  function walk(list: HelpNode[]) {
    for (const n of list) {
      result.push(n);
      if (n.children) walk(n.children);
    }
  }
  walk(nodes);
  return result;
}

const ALL_NODES = flattenTree(HELP_TREE);

// ── Tokenizer ────────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9&/\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function expandWithSynonyms(tokens: string[]): Set<string> {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const syns = SYNONYMS[token];
    if (syns) {
      for (const s of syns) expanded.add(s);
    }
  }
  return expanded;
}

// ── Scorer ───────────────────────────────────────────────────────────────────

function scoreNode(node: HelpNode, queryTokens: Set<string>): number {
  const qTokens = tokenize(node.question);
  const aTokens = tokenize(node.answer);

  let score = 0;

  // Question matches are worth more (3x)
  for (const t of qTokens) {
    if (queryTokens.has(t)) score += 3;
  }

  // Answer matches
  for (const t of aTokens) {
    if (queryTokens.has(t)) score += 1;
  }

  // Bonus for node ID partial match
  for (const qt of queryTokens) {
    if (node.id.includes(qt)) score += 2;
  }

  // Normalize by text length to avoid long answers dominating
  const totalTokens = qTokens.length + aTokens.length;
  if (totalTokens > 0) {
    score = score / Math.sqrt(totalTokens);
  }

  return score;
}

// ── Public API ───────────────────────────────────────────────────────────────

export function searchHelp(query: string, maxResults = 5): HelpNode[] {
  const rawTokens = tokenize(query);
  if (rawTokens.length === 0) return [];

  const expanded = expandWithSynonyms(rawTokens);

  const scored: ScoredNode[] = ALL_NODES.map((node) => ({
    node,
    score: scoreNode(node, expanded),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored
    .filter((s) => s.score > 0)
    .slice(0, maxResults)
    .map((s) => s.node);
}
