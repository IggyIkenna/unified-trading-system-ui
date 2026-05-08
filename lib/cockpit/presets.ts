/**
 * Cockpit preset registry — 8 starter cockpits per
 * dart_ux_cockpit_refactor_2026_04_29.md §8 (Phase 6).
 *
 * Six of the eight presets support both monitor + replicate engagement.
 * Executive Overview and Signals-In Monitor are monitor-only by their
 * nature (no hand-trading flow makes sense for either). Default
 * `executionStream` is `paper` for replicate engagements per the §4.3
 * safety contract; live requires the explicit confirm dialog.
 *
 * Each preset declares strategy-backing strength so the cockpit can render
 * honest empty states when the resolver returns zero owned/available
 * instances for the user.
 */

import type { StrategyArchetype } from "@/lib/architecture-v2/enums";
import type { WorkspaceScope } from "@/lib/architecture-v2/workspace-scope";
import type { PresetArchetypeBinding } from "./preset-archetype-map";
import { PRESET_ARCHETYPE_MAP } from "./preset-archetype-map";

// ─────────────────────────────────────────────────────────────────────────────
// Strategy backing — describes how "real" the preset is for a given persona
// ─────────────────────────────────────────────────────────────────────────────

export type PresetStrategyBacking =
  | "strategy-backed-strong"
  | "strategy-backed-medium"
  | "service-backed"
  | "demo-only-until-subscribed";

// ─────────────────────────────────────────────────────────────────────────────
// WorkspacePreset
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkspacePreset {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly bestFor: readonly string[];

  /** Default scope axes the preset seeds. Caller spreads onto EMPTY_WORKSPACE_SCOPE. */
  readonly defaultScope: Partial<WorkspaceScope>;

  // Surface + foreground mode/stage defaults.
  readonly defaultSurface: WorkspaceScope["surface"];
  readonly defaultTerminalMode?: WorkspaceScope["terminalMode"];
  readonly defaultResearchStage?: WorkspaceScope["researchStage"];

  // Engagement contract.
  readonly defaultEngagement: WorkspaceScope["engagement"];
  readonly defaultExecutionStream: WorkspaceScope["executionStream"];
  readonly supportsEngagement: ReadonlyArray<WorkspaceScope["engagement"]>;

  // Widget bundles per engagement (Phase 6 ships ids; the cockpit grid
  // resolves them via the registry).
  readonly monitorWidgetIds: readonly string[];
  readonly replicateWidgetIds?: readonly string[];
  readonly lockedWidgetIds?: readonly string[];

  // Honesty signals (§8 + §13).
  readonly strategyBacking: PresetStrategyBacking;
  readonly archetypeBinding: PresetArchetypeBinding;
  /** v1 venue scope when narrower than the archetype's full venue support. */
  readonly v1VenueConstraints?: readonly string[];
  /** Empty-state copy when the resolver returns zero owned/available instances. */
  readonly emptyStateCopy?: string;

  /** Primary CTA when the cockpit lands on this preset. */
  readonly primaryAction?: { readonly label: string; readonly href: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// Preset definitions (8 starter cockpits)
// ─────────────────────────────────────────────────────────────────────────────

export const COCKPIT_PRESETS: readonly WorkspacePreset[] = [
  // 1. Executive Overview — monitor-only; CIO / allocator / investor view.
  {
    id: "executive-overview",
    label: "Executive Overview",
    description: "AUM, P&L, drawdown, risk, exposure, strategy health, top opportunities, incidents, reporting status.",
    bestFor: ["CIO", "Allocator", "Investor", "Stakeholder"],
    defaultScope: {},
    defaultSurface: "reports",
    defaultEngagement: "monitor",
    defaultExecutionStream: "paper",
    supportsEngagement: ["monitor"],
    monitorWidgetIds: ["pnl-waterfall", "pnl-time-series"],
    strategyBacking: "demo-only-until-subscribed",
    archetypeBinding: PRESET_ARCHETYPE_MAP["executive-overview"],
    emptyStateCopy:
      "No live reporting data yet. This demo uses representative allocator reporting views. Connect a mandate or select a subscribed strategy to replace demo data.",
  },

  // 2. Live Trading Desk — generic monitor cockpit, populated from subscriptions.
  {
    id: "live-trading-desk",
    label: "Live Trading Desk",
    description: "Positions, orders, fills, alerts, execution quality, risk limits, venue health, open exceptions.",
    bestFor: ["Trader", "PM", "Execution operator"],
    defaultScope: {},
    defaultSurface: "terminal",
    defaultTerminalMode: "command",
    defaultEngagement: "monitor",
    defaultExecutionStream: "paper",
    supportsEngagement: ["monitor", "replicate"],
    monitorWidgetIds: ["pnl-waterfall", "pnl-time-series"],
    replicateWidgetIds: [],
    strategyBacking: "demo-only-until-subscribed",
    archetypeBinding: PRESET_ARCHETYPE_MAP["live-trading-desk"],
    emptyStateCopy:
      "No active subscriptions. The cockpit is shaped for the live trading workflow but waits on real positions to populate. Subscribe to a strategy or contact the desk.",
  },

  // 3. Arbitrage Command — flagship strategy-backed preset.
  {
    id: "arbitrage-command",
    label: "Arbitrage Command",
    description:
      "Spread monitor, opportunity feed, cross-venue liquidity, leg state, hedge state, funding/basis, slippage, P&L attribution.",
    bestFor: ["Arbitrage-focused buyer"],
    defaultScope: {
      assetGroups: ["CEFI", "DEFI"],
      instrumentTypes: ["spot", "perp"],
      families: ["ARBITRAGE_STRUCTURAL"],
    },
    defaultSurface: "terminal",
    defaultTerminalMode: "command",
    defaultEngagement: "monitor",
    defaultExecutionStream: "paper",
    supportsEngagement: ["monitor", "replicate"],
    monitorWidgetIds: ["pnl-waterfall", "pnl-time-series", "pnl-factor-drilldown"],
    replicateWidgetIds: [],
    strategyBacking: "strategy-backed-strong",
    archetypeBinding: PRESET_ARCHETYPE_MAP["arbitrage-command"],
  },

  // 4. DeFi Yield & Risk — DeFi flagship.
  {
    id: "defi-yield-risk",
    label: "DeFi Yield & Risk",
    description:
      "Protocol exposure, lending rates, staking yields, reward APR, collateral health, LTV, liquidation risk, gas, MEV alerts.",
    bestFor: ["DeFi yield buyer", "Lending / staking / collateral", "Protocol-risk"],
    defaultScope: {
      assetGroups: ["DEFI"],
      families: ["CARRY_AND_YIELD"],
    },
    defaultSurface: "terminal",
    defaultTerminalMode: "command",
    defaultEngagement: "monitor",
    defaultExecutionStream: "paper",
    supportsEngagement: ["monitor", "replicate"],
    monitorWidgetIds: ["pnl-waterfall", "pnl-time-series"],
    replicateWidgetIds: [],
    strategyBacking: "strategy-backed-strong",
    archetypeBinding: PRESET_ARCHETYPE_MAP["defi-yield-risk"],
  },

  // 5. Volatility Research Lab — replicate-default; v1 venue scope = Deribit + CME.
  {
    id: "volatility-research-lab",
    label: "Volatility Research Lab",
    description: "Vol surface, skew, term structure, Greeks, straddle/strangle candidates, vega exposure, gamma risk.",
    bestFor: ["Options / vol / derivatives buyer"],
    defaultScope: {
      instrumentTypes: ["option"],
      families: ["VOL_TRADING"],
    },
    defaultSurface: "research",
    defaultResearchStage: "validate",
    defaultEngagement: "replicate",
    defaultExecutionStream: "paper",
    supportsEngagement: ["monitor", "replicate"],
    monitorWidgetIds: ["pnl-waterfall"],
    replicateWidgetIds: [],
    strategyBacking: "strategy-backed-medium",
    archetypeBinding: PRESET_ARCHETYPE_MAP["volatility-research-lab"],
    v1VenueConstraints: ["DERIBIT", "CME"],
    emptyStateCopy:
      "v1 vol coverage: Deribit + CME options only. TradFi options are partial; DeFi options are blocked. Wording on the cockpit reflects this — broader options coverage is a v2 expansion.",
  },

  // 6. Sports / Prediction Desk — event-driven.
  {
    id: "sports-prediction-desk",
    label: "Sports / Prediction Desk",
    description: "Fixtures, odds movement, market depth, event risk, liquidity, position exposure, settlement.",
    bestFor: ["Sports", "Odds", "Prediction markets", "Event-driven"],
    defaultScope: {
      assetGroups: ["SPORTS", "PREDICTION"],
    },
    defaultSurface: "terminal",
    defaultTerminalMode: "markets",
    defaultEngagement: "monitor",
    defaultExecutionStream: "paper",
    supportsEngagement: ["monitor", "replicate"],
    monitorWidgetIds: ["pnl-waterfall"],
    replicateWidgetIds: [],
    strategyBacking: "strategy-backed-medium",
    archetypeBinding: PRESET_ARCHETYPE_MAP["sports-prediction-desk"],
  },

  // 7. Signals-In Monitor — service-backed; monitor-only by nature.
  {
    id: "signals-in-monitor",
    label: "Signals-In Monitor",
    description: "Signal intake status, payload validation, signal freshness, rejected signals, routing state, paper/live execution mapping, reporting coverage.",
    bestFor: ["External signal provider", "Regulatory umbrella", "BYO-strategy"],
    defaultScope: {},
    defaultSurface: "signals",
    defaultEngagement: "monitor",
    defaultExecutionStream: "paper",
    supportsEngagement: ["monitor"],
    monitorWidgetIds: [],
    strategyBacking: "service-backed",
    archetypeBinding: PRESET_ARCHETYPE_MAP["signals-in-monitor"],
  },

  // 8. Research-to-Live Pipeline — DART-Full only; replicate-default.
  {
    id: "research-to-live-pipeline",
    label: "Research-to-Live Pipeline",
    description:
      "Strategy candidates, backtest results, paper state, promotion readiness, config version, approval status, live compatibility.",
    bestFor: ["DART Full buyer"],
    defaultScope: {},
    defaultSurface: "research",
    defaultResearchStage: "validate",
    defaultEngagement: "replicate",
    defaultExecutionStream: "paper",
    supportsEngagement: ["monitor", "replicate"],
    monitorWidgetIds: ["pnl-waterfall"],
    replicateWidgetIds: [],
    strategyBacking: "strategy-backed-strong",
    archetypeBinding: PRESET_ARCHETYPE_MAP["research-to-live-pipeline"],
  },
];

export const COCKPIT_PRESET_IDS: readonly string[] = COCKPIT_PRESETS.map((p) => p.id);

export function getPreset(id: string): WorkspacePreset | undefined {
  return COCKPIT_PRESETS.find((p) => p.id === id);
}

/**
 * Apply a preset to a base scope. Returns a new scope with the preset's
 * `defaultScope` axes spread on top of the base, plus the preset's
 * surface/mode/stage/engagement/stream defaults.
 */
export function applyPresetToScope(preset: WorkspacePreset, baseScope: WorkspaceScope): WorkspaceScope {
  return {
    ...baseScope,
    ...preset.defaultScope,
    surface: preset.defaultSurface,
    terminalMode: preset.defaultTerminalMode ?? null,
    researchStage: preset.defaultResearchStage ?? null,
    engagement: preset.defaultEngagement,
    executionStream: preset.defaultExecutionStream,
  };
}

/**
 * Resolve archetypes for a preset. Explicit bindings return their declared
 * list; resolver bindings return an empty list at the type level — the
 * cockpit-side resolver fills them in at render time using user state
 * (subscriptions, entitlements, maturity).
 */
export function resolveStaticArchetypes(preset: WorkspacePreset): readonly StrategyArchetype[] {
  if (preset.archetypeBinding.kind === "explicit") return preset.archetypeBinding.archetypeIds;
  return [];
}
