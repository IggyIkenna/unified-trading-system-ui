"use client";

/**
 * Strategy scenario engine — replays scripted end-to-end strategy lifecycles
 * across asset groups, venues, and archetypes.
 *
 * Per the post-liveness audit:
 *
 *   "Have you tried replicating the strategy archetypes e2e — from client
 *    deposits and strategy decisions, rebalancing, kill switches, and
 *    alerts e2e across asset groups and venues and archetypes?"
 *
 * Each scenario is a scripted tape of `StrategyEventStep` entries with a
 * `delaySec` from prior step. The engine ticks once per second and fires
 * the next step when its delay has elapsed. Steps emit `StrategyEvent`s
 * into the cockpit ops store, which the `<StrategyScenarioTapePanel />`
 * renders chronologically.
 *
 * Coverage matrix (8 scenarios across all 5 asset groups + 8 archetypes):
 *
 *   1. ARBITRAGE_PRICE_DISPERSION    × CEFI+DEFI  (binance + aave)
 *   2. CARRY_BASIS_PERP              × CEFI       (binance perp + spot)
 *   3. YIELD_ROTATION_LENDING        × DEFI       (aave_v3 → morpho)
 *   4. VOL_TRADING_OPTIONS           × CEFI       (deribit straddle)
 *   5. ML_DIRECTIONAL_CONTINUOUS     × CEFI       (xgboost on btc-usdt)
 *   6. EVENT_DRIVEN                  × SPORTS     (api_football fixture)
 *   7. LIQUIDATION_CAPTURE           × DEFI       (compound liquidation)
 *   8. STAT_ARB_PAIRS_FIXED          × TRADFI     (cme equity pairs)
 *
 * Each scenario covers the full lifecycle:
 *   client_deposit → signal_fired → entry_decision → fill → rebalance →
 *   drift_warning (or alert) → exit_decision → settlement (and
 *   occasionally kill_switch_trip).
 */

import { useCockpitOpsStore, type StrategyEvent } from "./cockpit-ops-store";

export interface StrategyEventStep {
  /** Delay (seconds) from the previous step (or scenario start). */
  readonly delaySec: number;
  readonly kind: StrategyEvent["kind"];
  readonly summary: string;
  readonly detail?: string;
  readonly pnlImpactUsd?: number;
  readonly tone: StrategyEvent["tone"];
  readonly venue?: string;
}

export interface StrategyScenario {
  readonly id: string;
  readonly label: string;
  readonly archetype: string;
  readonly assetGroup: StrategyEvent["assetGroup"];
  readonly defaultVenue: string;
  readonly description: string;
  readonly steps: readonly StrategyEventStep[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ARBITRAGE_PRICE_DISPERSION × CEFI + DEFI
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIO_ARBITRAGE: StrategyScenario = {
  id: "scenario-arb-cefi-defi",
  label: "Arbitrage — Binance / Aave price dispersion",
  archetype: "ARBITRAGE_PRICE_DISPERSION",
  assetGroup: "CEFI",
  defaultVenue: "binance",
  description:
    "Cross-venue spread opens between Binance USDT-perp and Aave v3 wstETH lending pool. Strategy enters basis trade, monitors funding, exits on convergence.",
  steps: [
    {
      delaySec: 0,
      kind: "client_deposit",
      summary: "+$2.5M USDC deposit from client mandate-arbitrage-001",
      tone: "success",
      venue: "binance",
    },
    {
      delaySec: 1,
      kind: "signal_fired",
      summary: "Spread opens: BINANCE-PERP@70210 vs AAVE-V3@70085 = 17.8 bps",
      tone: "info",
      venue: "binance",
    },
    {
      delaySec: 1,
      kind: "entry_decision",
      summary: "Long Aave wstETH lending leg, short Binance BTC-USDT perp",
      detail: "Sized 0.6× target; respects assumption-stack hedge ratio range [0.85, 1.05]",
      tone: "info",
      venue: "aave_v3",
    },
    {
      delaySec: 1,
      kind: "alert",
      summary: "Gas spike on Ethereum mainnet — 42 gwei",
      detail: "Within stress envelope [0.5×, 4.0×]; trade proceeds with adjusted size",
      tone: "warn",
      venue: "aave_v3",
    },
    {
      delaySec: 2,
      kind: "rebalance",
      summary: "Hedge ratio drift to 0.92 — auto-rebalance triggered",
      detail: "Treasury policy autoRebalanceEnabled=true; threshold=0.05",
      pnlImpactUsd: -120,
      tone: "info",
      venue: "binance",
    },
    {
      delaySec: 1,
      kind: "drift_warning",
      summary: "Live drift exceeds simulation: gas +9.4 (assumption-stack alert)",
      tone: "warn",
      venue: "aave_v3",
    },
    {
      delaySec: 2,
      kind: "exit_decision",
      summary: "Spread converges to 4 bps — closing legs",
      pnlImpactUsd: 8420,
      tone: "success",
      venue: "binance",
    },
    {
      delaySec: 1,
      kind: "settlement",
      summary: "Realised P&L $8,420 net of $310 execution + $180 gas + $90 liquidation buffer",
      pnlImpactUsd: 8420,
      tone: "success",
      venue: "binance",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CARRY_BASIS_PERP × CEFI (Binance funding-rate carry)
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIO_CARRY_BASIS: StrategyScenario = {
  id: "scenario-carry-basis-cefi",
  label: "Carry — Binance perp basis funding",
  archetype: "CARRY_BASIS_PERP",
  assetGroup: "CEFI",
  defaultVenue: "binance",
  description:
    "Funding rate flips persistently negative. Strategy enters short-perp / long-spot basis trade; collects funding; exits before basis tightens.",
  steps: [
    {
      delaySec: 0,
      kind: "client_deposit",
      summary: "+$1.2M USDT deposit allocated to carry mandate",
      tone: "success",
      venue: "binance",
    },
    {
      delaySec: 1,
      kind: "signal_fired",
      summary: "Funding -0.12% / 8h on BINANCE-USDT-PERP — 6 of last 8 windows negative",
      tone: "info",
      venue: "binance",
    },
    {
      delaySec: 1,
      kind: "entry_decision",
      summary: "Short BTC-USDT perp 0.4 BTC, long BTC-USDT spot 0.4 BTC",
      detail: "Net delta neutral; basis -22 bps annualised",
      tone: "info",
      venue: "binance",
    },
    {
      delaySec: 2,
      kind: "settlement",
      summary: "Funding window 1: collected +$192",
      pnlImpactUsd: 192,
      tone: "success",
      venue: "binance",
    },
    {
      delaySec: 2,
      kind: "settlement",
      summary: "Funding window 2: collected +$184",
      pnlImpactUsd: 184,
      tone: "success",
      venue: "binance",
    },
    {
      delaySec: 1,
      kind: "alert",
      summary: "OKX gateway degraded — strategy avoids cross-venue rebalance",
      tone: "warn",
      venue: "okx",
    },
    {
      delaySec: 2,
      kind: "exit_decision",
      summary: "Basis tightens to -2 bps — unwinding both legs",
      tone: "info",
      venue: "binance",
    },
    {
      delaySec: 1,
      kind: "settlement",
      summary: "Realised P&L $4,140 across 12 funding windows",
      pnlImpactUsd: 4140,
      tone: "success",
      venue: "binance",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. YIELD_ROTATION_LENDING × DEFI (Aave → Morpho migration)
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIO_YIELD_ROTATION: StrategyScenario = {
  id: "scenario-yield-rotation-defi",
  label: "Yield rotation — Aave v3 → Morpho",
  archetype: "YIELD_ROTATION_LENDING",
  assetGroup: "DEFI",
  defaultVenue: "aave_v3",
  description:
    "Aave USDC supply APR drops below Morpho. Strategy migrates supply across venues, paying gas + bridging cost, capturing improved yield.",
  steps: [
    {
      delaySec: 0,
      kind: "client_deposit",
      summary: "+$800K USDC deposit on Ethereum mainnet",
      tone: "success",
      venue: "aave_v3",
    },
    {
      delaySec: 1,
      kind: "signal_fired",
      summary: "Aave USDC APR 3.2% < Morpho 4.6%, persistent over 6h",
      tone: "info",
      venue: "aave_v3",
    },
    {
      delaySec: 1,
      kind: "entry_decision",
      summary: "Withdraw $800K USDC from Aave, prepare Morpho deposit",
      tone: "info",
      venue: "aave_v3",
    },
    {
      delaySec: 1,
      kind: "alert",
      summary: "Gas spike to 78 gwei — 4.3× envelope upper bound",
      detail: "Within tolerance; sequencer cost $44",
      tone: "warn",
      venue: "aave_v3",
    },
    {
      delaySec: 2,
      kind: "rebalance",
      summary: "Aave withdrawal completed; supply on Morpho",
      pnlImpactUsd: -64,
      tone: "info",
      venue: "morpho",
    },
    {
      delaySec: 2,
      kind: "settlement",
      summary: "Day 1 yield delta: +$31 vs holding Aave",
      pnlImpactUsd: 31,
      tone: "success",
      venue: "morpho",
    },
    {
      delaySec: 2,
      kind: "settlement",
      summary: "Day 7 cumulative yield delta: +$224",
      pnlImpactUsd: 224,
      tone: "success",
      venue: "morpho",
    },
    {
      delaySec: 1,
      kind: "exit_decision",
      summary: "APR gap closes — strategy holds, no further rotation",
      tone: "info",
      venue: "morpho",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. VOL_TRADING_OPTIONS × CEFI (Deribit cheap straddle)
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIO_VOL_TRADING: StrategyScenario = {
  id: "scenario-vol-trading-cefi",
  label: "Vol Lab — Deribit cheap straddle",
  archetype: "VOL_TRADING_OPTIONS",
  assetGroup: "CEFI",
  defaultVenue: "deribit",
  description:
    "BTC realised vol exceeds implied by 6 vol-points. Strategy buys ATM straddle on Deribit; vol expands; sells back at higher IV.",
  steps: [
    {
      delaySec: 0,
      kind: "client_deposit",
      summary: "+$500K USD allocated to Vol Lab mandate",
      tone: "success",
      venue: "deribit",
    },
    {
      delaySec: 1,
      kind: "signal_fired",
      summary: "Realised vol 78% vs implied 62% — 16 vol-point dislocation",
      tone: "info",
      venue: "deribit",
    },
    {
      delaySec: 1,
      kind: "entry_decision",
      summary: "Buy ATM 14d straddle: 1 BTC call $70k + 1 BTC put $70k",
      detail: "Vega exposure $4,200; theta -$120/day",
      tone: "info",
      venue: "deribit",
    },
    {
      delaySec: 2,
      kind: "alert",
      summary: "Vol surface skew widens — call IV 65%, put IV 72%",
      tone: "info",
      venue: "deribit",
    },
    {
      delaySec: 1,
      kind: "rebalance",
      summary: "Delta drifts to +0.18 — gamma scalping closes 0.18 BTC perp",
      pnlImpactUsd: 240,
      tone: "info",
      venue: "deribit",
    },
    {
      delaySec: 2,
      kind: "exit_decision",
      summary: "Implied vol expands to 71% — selling straddle back",
      pnlImpactUsd: 6300,
      tone: "success",
      venue: "deribit",
    },
    {
      delaySec: 1,
      kind: "settlement",
      summary: "Realised P&L $6,300 net of $480 execution and $120 theta carry",
      pnlImpactUsd: 6300,
      tone: "success",
      venue: "deribit",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. ML_DIRECTIONAL_CONTINUOUS × CEFI (xgboost BTC-USDT)
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIO_ML_DIRECTIONAL: StrategyScenario = {
  id: "scenario-ml-directional-cefi",
  label: "ML directional — xgboost BTC-USDT",
  archetype: "ML_DIRECTIONAL_CONTINUOUS",
  assetGroup: "CEFI",
  defaultVenue: "binance",
  description:
    "ML signal flips long with 68% confidence. Strategy enters scaled position; signal weakens mid-flight; exits before stop.",
  steps: [
    { delaySec: 0, kind: "client_deposit", summary: "+$1.5M USDT deposit", tone: "success", venue: "binance" },
    {
      delaySec: 1,
      kind: "signal_fired",
      summary: "xgboost-spread-classifier-v4: long BTC, confidence 68%",
      tone: "info",
      venue: "binance",
    },
    {
      delaySec: 1,
      kind: "entry_decision",
      summary: "Scale into 0.3 BTC long at $70,140",
      tone: "info",
      venue: "binance",
    },
    {
      delaySec: 2,
      kind: "rebalance",
      summary: "Confidence rises to 74% — increasing to 0.55 BTC",
      tone: "info",
      venue: "binance",
    },
    {
      delaySec: 1,
      kind: "alert",
      summary: "Signal degradation: confidence drops to 51% — flatten warning",
      tone: "warn",
      venue: "binance",
    },
    {
      delaySec: 1,
      kind: "exit_decision",
      summary: "Trailing stop tightens; closing 0.55 BTC long",
      pnlImpactUsd: 1980,
      tone: "success",
      venue: "binance",
    },
    {
      delaySec: 1,
      kind: "settlement",
      summary: "Realised P&L $1,980 — model lookback updated for next training run",
      pnlImpactUsd: 1980,
      tone: "success",
      venue: "binance",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. EVENT_DRIVEN × SPORTS (api_football fixture)
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIO_EVENT_DRIVEN_SPORTS: StrategyScenario = {
  id: "scenario-event-driven-sports",
  label: "Event-driven — Premier League fixture",
  archetype: "EVENT_DRIVEN",
  assetGroup: "SPORTS",
  defaultVenue: "api_football",
  description:
    "Pre-match: line moves on injury news. Strategy enters value side; in-play hedge if score swings; settle on final whistle.",
  steps: [
    {
      delaySec: 0,
      kind: "client_deposit",
      summary: "+$300K stake allocated to event-driven mandate",
      tone: "success",
      venue: "api_football",
    },
    {
      delaySec: 1,
      kind: "signal_fired",
      summary: "Match: ARS vs LIV. Salah ruled out 22m before kickoff — line moves +0.45 toward ARS",
      tone: "info",
      venue: "api_football",
    },
    {
      delaySec: 1,
      kind: "entry_decision",
      summary: "Stake $40K on ARS at 2.10 (value vs implied 2.45)",
      tone: "info",
      venue: "footystats",
    },
    {
      delaySec: 2,
      kind: "alert",
      summary: "10' goal: ARS 1-0 — odds compress to 1.55",
      tone: "info",
      venue: "api_football",
    },
    {
      delaySec: 1,
      kind: "rebalance",
      summary: "Hedge $12K on Draw at 4.2 to lock partial profit",
      pnlImpactUsd: 0,
      tone: "info",
      venue: "footystats",
    },
    {
      delaySec: 2,
      kind: "alert",
      summary: "67' goal: ARS 2-0 — strategy stays open",
      tone: "info",
      venue: "api_football",
    },
    {
      delaySec: 2,
      kind: "settlement",
      summary: "Final 2-0 ARS — net P&L $26,400 across stake + hedge",
      pnlImpactUsd: 26400,
      tone: "success",
      venue: "api_football",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. LIQUIDATION_CAPTURE × DEFI (Compound liquidation)
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIO_LIQUIDATION_CAPTURE: StrategyScenario = {
  id: "scenario-liquidation-capture-defi",
  label: "Liquidation capture — Compound v3 cETH",
  archetype: "LIQUIDATION_CAPTURE",
  assetGroup: "DEFI",
  defaultVenue: "compound_v3",
  description:
    "ETH price drops 6% in 18 min. Strategy detects pre-liquidation collateral on Compound, executes flash-loan liquidation, captures bonus.",
  steps: [
    {
      delaySec: 0,
      kind: "client_deposit",
      summary: "+$2M USDC bot capital provisioned for liquidations",
      tone: "success",
      venue: "compound_v3",
    },
    {
      delaySec: 1,
      kind: "alert",
      summary: "ETH -3.8% in 12 min — multiple positions approaching liquidation threshold",
      tone: "warn",
      venue: "compound_v3",
    },
    {
      delaySec: 1,
      kind: "signal_fired",
      summary: "Position 0xab12... LTV 0.71 vs maxLtv 0.70 — liquidatable",
      tone: "info",
      venue: "compound_v3",
    },
    {
      delaySec: 1,
      kind: "entry_decision",
      summary: "Flash-loan $1.5M USDC, repay debt, claim cETH collateral + 8% bonus",
      tone: "info",
      venue: "compound_v3",
    },
    {
      delaySec: 1,
      kind: "alert",
      summary: "Tx submitted, 1 block confirmation, gas $182",
      tone: "info",
      venue: "compound_v3",
    },
    {
      delaySec: 1,
      kind: "rebalance",
      summary: "Sell claimed cETH on Uniswap v3 ETH-USDC pool",
      pnlImpactUsd: 0,
      tone: "info",
      venue: "uniswap_v3",
    },
    {
      delaySec: 1,
      kind: "settlement",
      summary: "Liquidation bonus realised $11,400 net of $182 gas + $84 swap slippage",
      pnlImpactUsd: 11400,
      tone: "success",
      venue: "compound_v3",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. STAT_ARB_PAIRS_FIXED × TRADFI (CME equity-pair carry)
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIO_STAT_ARB_TRADFI: StrategyScenario = {
  id: "scenario-stat-arb-tradfi",
  label: "Stat-arb pairs — CME equity index carry",
  archetype: "STAT_ARB_PAIRS_FIXED",
  assetGroup: "TRADFI",
  defaultVenue: "cme",
  description:
    "ES vs NQ z-score crosses 2.1σ. Strategy long-NQ / short-ES until mean reversion. Kill-switch demonstrated when adverse drawdown breaches policy.",
  steps: [
    {
      delaySec: 0,
      kind: "client_deposit",
      summary: "+$5M deposit to TradFi pairs mandate",
      tone: "success",
      venue: "cme",
    },
    {
      delaySec: 1,
      kind: "signal_fired",
      summary: "ES/NQ z-score 2.14σ — historical mean-reversion in 88% of cases",
      tone: "info",
      venue: "cme",
    },
    {
      delaySec: 1,
      kind: "entry_decision",
      summary: "Long 4 NQM6, short 8 ESM6 (beta-hedged)",
      tone: "info",
      venue: "cme",
    },
    {
      delaySec: 2,
      kind: "drift_warning",
      summary: "Spread widens further to 2.6σ — drawdown $43K",
      pnlImpactUsd: -43000,
      tone: "warn",
      venue: "cme",
    },
    {
      delaySec: 1,
      kind: "alert",
      summary: "Drawdown approaching policy max ($60K — 80% utilisation)",
      tone: "warn",
      venue: "cme",
    },
    {
      delaySec: 1,
      kind: "kill_switch_trip",
      summary: "Max-DD breach: kill switch trips, flatten both legs",
      detail: "RuntimeOverride.kill_switch always allowed regardless of guardrails",
      pnlImpactUsd: -62000,
      tone: "error",
      venue: "cme",
    },
    {
      delaySec: 1,
      kind: "settlement",
      summary: "Realised loss $62K — within risk-policy hard cap, post-mortem queued",
      pnlImpactUsd: -62000,
      tone: "warn",
      venue: "cme",
    },
  ],
};

export const STRATEGY_SCENARIOS: readonly StrategyScenario[] = [
  SCENARIO_ARBITRAGE,
  SCENARIO_CARRY_BASIS,
  SCENARIO_YIELD_ROTATION,
  SCENARIO_VOL_TRADING,
  SCENARIO_ML_DIRECTIONAL,
  SCENARIO_EVENT_DRIVEN_SPORTS,
  SCENARIO_LIQUIDATION_CAPTURE,
  SCENARIO_STAT_ARB_TRADFI,
];

export function getScenarioById(id: string): StrategyScenario | undefined {
  return STRATEGY_SCENARIOS.find((s) => s.id === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Engine — fires scripted events into the cockpit ops store on a 1s tick.
// ─────────────────────────────────────────────────────────────────────────────

interface RunningScenario {
  scenario: StrategyScenario;
  cursor: number;
  /** Seconds remaining until the next step fires. */
  delayRemaining: number;
}

const running = new Map<string, RunningScenario>();
let engineTickerStarted = false;

/**
 * Start a scenario by id. Creates an active-scenario record in the store
 * and queues the first step.
 */
export function startStrategyScenario(scenarioId: string): boolean {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) return false;
  const store = useCockpitOpsStore.getState();
  store.registerActiveScenario({
    id: scenario.id,
    archetype: scenario.archetype,
    assetGroup: scenario.assetGroup,
    label: scenario.label,
    totalEvents: scenario.steps.length,
  });
  running.set(scenario.id, {
    scenario,
    cursor: 0,
    delayRemaining: scenario.steps[0]?.delaySec ?? 0,
  });
  ensureScenarioEngineTickerStarted();
  return true;
}

/** Public for tests — advances every running scenario by 1 second. */
export function tickScenarioEngine(): void {
  const store = useCockpitOpsStore.getState();
  for (const [id, rs] of running.entries()) {
    if (rs.cursor >= rs.scenario.steps.length) continue;
    if (rs.delayRemaining > 0) {
      rs.delayRemaining -= 1;
      continue;
    }
    const step = rs.scenario.steps[rs.cursor];
    if (!step) continue;
    store.appendStrategyEvent({
      scenarioId: id,
      archetype: rs.scenario.archetype,
      assetGroup: rs.scenario.assetGroup,
      venue: step.venue ?? rs.scenario.defaultVenue,
      kind: step.kind,
      summary: step.summary,
      detail: step.detail,
      pnlImpactUsd: step.pnlImpactUsd,
      tone: step.tone,
    });
    store.advanceScenarioCursor(id);
    rs.cursor += 1;
    if (rs.cursor >= rs.scenario.steps.length) {
      store.completeScenario(id);
      running.delete(id);
    } else {
      rs.delayRemaining = rs.scenario.steps[rs.cursor]?.delaySec ?? 0;
    }
  }
}

export function ensureScenarioEngineTickerStarted(): void {
  if (engineTickerStarted || typeof window === "undefined") return;
  engineTickerStarted = true;
  setInterval(() => {
    tickScenarioEngine();
  }, 1000);
}

/** Test helper — clears all running scenarios + resets the started flag. */
export function _resetScenarioEngineForTests(): void {
  running.clear();
  engineTickerStarted = false;
}
