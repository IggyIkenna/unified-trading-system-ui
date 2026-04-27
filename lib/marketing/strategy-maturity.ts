/**
 * Public-facing one-liners for strategy instance maturity.
 *
 * **Normative spec (single source of truth):** `unified-trading-pm/codex/09-strategy/
 * architecture-v2/strategy-lifecycle-maturity.md` — §1 “Maturity phase enum”.
 * That codex governs meaning, ordering, and transition rules; UAC
 * `unified_api_contracts/.../strategy_service/lifecycle.py` implements the same
 * `StrategyMaturityPhase` values. If the model changes, **update the codex first**,
 * then the Python enum, then this file’s phase ids and `line` text (which
 * paraphrase the §1 “Meaning” column for briefing copy).
 *
 * `retired` is terminal and orthogonal to the forward ladder.
 */
export const STRATEGY_MATURITY_PHASE = {
  SMOKE: "smoke",
  BACKTEST_MINIMAL: "backtest_minimal",
  BACKTEST_1YR: "backtest_1yr",
  BACKTEST_MULTI_YEAR: "backtest_multi_year",
  PAPER_1D: "paper_1d",
  PAPER_14D: "paper_14d",
  PAPER_STABLE: "paper_stable",
  LIVE_EARLY: "live_early",
  LIVE_STABLE: "live_stable",
  RETIRED: "retired",
} as const;

export type StrategyMaturityPhaseId = (typeof STRATEGY_MATURITY_PHASE)[keyof typeof STRATEGY_MATURITY_PHASE];

/** UK English, prospect-facing; one line per phase — aligned to codex §1 “Meaning” column. */
export const STRATEGY_MATURITY_PUBLIC_BULLETS: readonly { phase: StrategyMaturityPhaseId; line: string }[] = [
  { phase: "smoke", line: "Smoke: pre-backtest; mock or fixture data only; wiring smoke test." },
  { phase: "backtest_minimal", line: "Backtest (minimal): under one year of history; not viable yet." },
  { phase: "backtest_1yr", line: "Backtest (one year): one clean year; minimum viability bar." },
  { phase: "backtest_multi_year", line: "Backtest (multi-year): extended history (three years or more preferred)." },
  { phase: "paper_1d", line: "Paper (day one): first 24h on the paper matching engine." },
  { phase: "paper_14d", line: "Paper (14 days): first statistically meaningful paper window." },
  { phase: "paper_stable", line: "Paper (stable): extended paper (30+ days); promotion ready." },
  { phase: "live_early", line: "Live (early): initial live; small seed capital." },
  { phase: "live_stable", line: "Live (stable): mature live at scaled capital." },
  { phase: "retired", line: "Retired: terminal; instance decommissioned; P&L history preserved." },
];
