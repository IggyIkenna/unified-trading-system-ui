/**
 * TerminalMode ↔ route mapping.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §5.2 + Phase 3 of §17.
 *
 * The 24-tab `TRADING_TABS` sprawl in `components/shell/service-tabs.tsx`
 * collapses behind 5 buyer-facing modes:
 *
 *   Command      — live P&L · positions · orders · fills · alerts · exceptions
 *   Markets      — prices · spreads · order books · liquidity · funding · vol
 *   Strategies   — running / paper / promoted / config versions / signal flow
 *   Explain      — P&L attribution · execution quality · slippage · drift
 *   Ops          — service health · incidents · logs · feed health · audit
 *
 * Phase 3 contract: keep every old route as a deep link, add the mode-tabs
 * primitive above the existing nav, auto-sync `WorkspaceScope.terminalMode`
 * with the active route on navigation, and let the user click a mode tab
 * to jump to that mode's `defaultHref`.
 */

import type { TerminalMode } from "@/lib/architecture-v2/workspace-scope";

export const TERMINAL_MODES: readonly TerminalMode[] = [
  "command",
  "markets",
  "strategies",
  "explain",
  "ops",
] as const;

export interface TerminalModeMeta {
  readonly mode: TerminalMode;
  readonly label: string;
  readonly tagline: string;
  /** Where clicking the mode tab routes the user. */
  readonly defaultHref: string;
  /**
   * Path prefixes that belong to this mode. Used by `terminalModeForPath`
   * to derive the active mode from `usePathname()`. Order matters — the
   * first matching prefix wins, so put more-specific prefixes earlier.
   */
  readonly routePrefixes: readonly string[];
}

export const TERMINAL_MODE_META: Readonly<Record<TerminalMode, TerminalModeMeta>> = {
  command: {
    mode: "command",
    label: "Command",
    tagline: "Live P&L, positions, orders, alerts",
    defaultHref: "/services/trading/overview",
    routePrefixes: [
      "/services/trading/overview",
      "/services/trading/terminal",
      "/services/trading/positions",
      "/services/trading/orders",
      "/services/trading/alerts",
      "/services/trading/risk",
      "/services/trading/pnl",
      "/services/trading/accounts",
      "/services/trading/instructions",
      "/services/trading/book",
    ],
  },

  markets: {
    mode: "markets",
    label: "Markets",
    tagline: "Spreads, order books, liquidity, vol",
    defaultHref: "/services/trading/markets",
    routePrefixes: [
      "/services/trading/markets",
      "/services/trading/defi",
      "/services/trading/sports",
      "/services/trading/options",
      "/services/trading/predictions",
      "/services/trading/tradfi",
    ],
  },

  strategies: {
    mode: "strategies",
    label: "Strategies",
    tagline: "Running, paper, promoted, config",
    defaultHref: "/services/trading/strategies",
    routePrefixes: [
      "/services/trading/strategies",
      "/services/trading/strategy-config",
      "/services/trading/deployment",
    ],
  },

  explain: {
    mode: "explain",
    label: "Explain",
    tagline: "P&L attribution, execution quality, drift",
    defaultHref: "/services/observe/reconciliation",
    routePrefixes: [
      "/services/observe/reconciliation",
      "/services/observe/scenarios",
      "/services/observe/strategy-health",
    ],
  },

  ops: {
    mode: "ops",
    label: "Ops",
    tagline: "Service health, incidents, audit, feeds",
    defaultHref: "/services/observe/risk",
    routePrefixes: [
      "/services/observe/risk",
      "/services/observe/health",
      "/services/observe/event-audit",
      "/services/observe/recovery",
      "/services/observe/news",
      "/services/observe",
    ],
  },
};

/**
 * Derive the active TerminalMode from a pathname. Returns `null` when the
 * path doesn't match any cockpit-tier Terminal route (caller should fall
 * back to the scope's terminalMode or the persona-default).
 *
 * Order of resolution: longest matching prefix wins, so a path like
 * `/services/observe/reconciliation` resolves to `explain` (its specific
 * prefix in the explain mode) rather than `ops` (which has the generic
 * `/services/observe` fallback).
 */
export function terminalModeForPath(pathname: string): TerminalMode | null {
  let bestMode: TerminalMode | null = null;
  let bestLen = 0;
  for (const mode of TERMINAL_MODES) {
    for (const prefix of TERMINAL_MODE_META[mode].routePrefixes) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        if (prefix.length > bestLen) {
          bestLen = prefix.length;
          bestMode = mode;
        }
      }
    }
  }
  return bestMode;
}

/**
 * Pick a sensible default mode for the cockpit when the user lands without
 * an explicit mode in scope and the URL doesn't yet anchor one. The default
 * is `command` — the live trading surface — which matches the §5.2 buyer
 * narrative ("monitor strategy state, execution quality, exposure, P&L,
 * and exceptions").
 *
 * Phase 6 will extend this to be scope-aware (e.g. arbitrage scope →
 * Command; volatility-research-lab preset → Markets); for now Phase 3
 * ships the static default and Phase 6 widens.
 */
export function defaultTerminalMode(): TerminalMode {
  return "command";
}
