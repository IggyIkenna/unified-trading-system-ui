/**
 * Phase 9 — soft route collapse via mode-anchored deep links.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §14 + Phase 9 of §17.
 *
 * The plan's rule for Phase 9: "Old single-purpose pages REDIRECT into
 * `/services/workspace?surface=terminal&tm=command` etc. Existing pages
 * remain reachable as deep links during phases 1-8; they keep working."
 *
 * Phase 9 of this implementation ships the canonical route → mode mapping
 * so the cockpit can ALWAYS resolve any legacy `/services/trading/*` or
 * `/services/observe/*` route to its canonical mode + scope. The actual
 * deletion of the legacy pages is deferred to a follow-up — the plan
 * explicitly says "do not delete or redirect large numbers of routes
 * until scope, cockpit, presets, widgets, and mock liveness are stable."
 *
 * What this module gives us:
 *   1. A single source of truth for "this old route belongs to this
 *      cockpit mode", consumed by the cockpit toolbar to set the active
 *      mode tab + display the canonical URL in deep-link copy widgets.
 *   2. A NextJS-friendly redirect rule list for the day Phase 9 actually
 *      flips legacy routes off (next.config.ts can import this list).
 *   3. Strategy Catalogue is explicitly preserved as a distinct surface
 *      per §22 ("DO NOT collapse. Keep as canonical universe / discovery
 *      surface").
 */

import type { TerminalMode, WorkspaceSurface } from "@/lib/architecture-v2/workspace-scope";

export interface CockpitRouteRedirect {
  /** Source path that maps to a cockpit anchor. */
  readonly source: string;
  /** Canonical mode anchor for this path. */
  readonly mode: TerminalMode;
  /** Surface anchor (always `terminal` for legacy /services/trading/* and /services/observe/*). */
  readonly surface: WorkspaceSurface;
  /**
   * Optional: when set, navigation to this path should result in
   * surface + mode being applied via the cockpit redirect handler.
   * The plan defers actual page deletion — we ship the table only.
   */
  readonly canonicalCockpitHref: string;
}

/**
 * The canonical legacy route → cockpit anchor table. Used by the §14
 * cockpit redirector + the URL deep-link copy affordance (Phase 7+).
 *
 * Strategy Catalogue routes are NOT in this table — per §22 the
 * catalogue stays as a distinct universe-discovery surface and is not
 * collapsed into the cockpit.
 */
/**
 * 2026-04-30 audit: per the second polish pass, `canonicalCockpitHref`
 * values now point at the unified `/services/workspace?surface=...&tm=...`
 * URL — NOT back at the legacy per-route page. Two mode mappings were
 * also wrong vs the plan §15 ownership rules and have been corrected:
 *   - `observe/strategy-health` was `explain`; correct mode is `strategies`.
 *   - `observe/risk` was `ops`; correct mode is `explain` (risk is an
 *     attribution surface, not service-health Ops).
 */
const HREF_FOR_MODE: Record<TerminalMode, string> = {
  command: "/services/workspace?surface=terminal&tm=command",
  markets: "/services/workspace?surface=terminal&tm=markets",
  strategies: "/services/workspace?surface=terminal&tm=strategies",
  explain: "/services/workspace?surface=terminal&tm=explain",
  ops: "/services/workspace?surface=terminal&tm=ops",
};

export const COCKPIT_ROUTE_REDIRECTS: readonly CockpitRouteRedirect[] = [
  // ── Trading → Command ─────────────────────────────────────────────────
  {
    source: "/services/trading/overview",
    mode: "command",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.command,
  },
  {
    source: "/services/trading/positions",
    mode: "command",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.command,
  },
  {
    source: "/services/trading/orders",
    mode: "command",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.command,
  },
  {
    source: "/services/trading/alerts",
    mode: "command",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.command,
  },
  {
    source: "/services/trading/accounts",
    mode: "command",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.command,
  },
  {
    source: "/services/trading/instructions",
    mode: "command",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.command,
  },
  {
    source: "/services/trading/book",
    mode: "command",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.command,
  },

  // ── Trading → Explain (P&L attribution + risk are explain surfaces) ───
  {
    source: "/services/trading/risk",
    mode: "explain",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.explain,
  },
  {
    source: "/services/trading/pnl",
    mode: "explain",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.explain,
  },

  // ── Trading → Markets ─────────────────────────────────────────────────
  {
    source: "/services/trading/markets",
    mode: "markets",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.markets,
  },
  {
    source: "/services/trading/defi",
    mode: "markets",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.markets,
  },
  {
    source: "/services/trading/sports",
    mode: "markets",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.markets,
  },
  {
    source: "/services/trading/options",
    mode: "markets",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.markets,
  },
  {
    source: "/services/trading/predictions",
    mode: "markets",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.markets,
  },
  {
    source: "/services/trading/tradfi",
    mode: "markets",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.markets,
  },

  // ── Trading → Strategies ──────────────────────────────────────────────
  {
    source: "/services/trading/strategies",
    mode: "strategies",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.strategies,
  },
  {
    source: "/services/trading/strategy-config",
    mode: "strategies",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.strategies,
  },
  {
    source: "/services/trading/deployment",
    mode: "strategies",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.strategies,
  },

  // ── Observe → Explain (attribution, drift, recon, scenarios) ──────────
  {
    source: "/services/observe/reconciliation",
    mode: "explain",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.explain,
  },
  {
    source: "/services/observe/scenarios",
    mode: "explain",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.explain,
  },
  // 2026-04-30 audit fix: risk is attribution-flavoured, not service-health
  // (Ops). Move from `ops` → `explain` per plan §15 ownership rules.
  {
    source: "/services/observe/risk",
    mode: "explain",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.explain,
  },
  {
    source: "/services/observe/position-recon",
    mode: "explain",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.explain,
  },

  // ── Observe → Strategies ──────────────────────────────────────────────
  // 2026-04-30 audit fix: strategy-health is a strategy-running surface,
  // not attribution. Move from `explain` → `strategies` per plan §15.
  {
    source: "/services/observe/strategy-health",
    mode: "strategies",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.strategies,
  },

  // ── Observe → Command (live exceptions) ───────────────────────────────
  {
    source: "/services/observe/alerts",
    mode: "command",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.command,
  },

  // ── Observe → Ops (service health, audit, recovery, news) ─────────────
  { source: "/services/observe/health", mode: "ops", surface: "terminal", canonicalCockpitHref: HREF_FOR_MODE.ops },
  {
    source: "/services/observe/system-health",
    mode: "ops",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.ops,
  },
  {
    source: "/services/observe/event-audit",
    mode: "ops",
    surface: "terminal",
    canonicalCockpitHref: HREF_FOR_MODE.ops,
  },
  { source: "/services/observe/recovery", mode: "ops", surface: "terminal", canonicalCockpitHref: HREF_FOR_MODE.ops },
  { source: "/services/observe/news", mode: "ops", surface: "terminal", canonicalCockpitHref: HREF_FOR_MODE.ops },
];

/**
 * Resolve the canonical mode anchor for a path. Used by the cockpit's
 * deep-link copy affordance (Phase 7) + the cockpit-suggestions engine.
 *
 * Returns `null` for non-cockpit paths (e.g. /services/strategy-catalogue,
 * /services/research/*, /dashboard) — the catalogue + research surfaces
 * are distinct per §22 + §15.
 */
export function cockpitAnchorForPath(pathname: string): CockpitRouteRedirect | null {
  // Exact match first.
  const exact = COCKPIT_ROUTE_REDIRECTS.find((r) => r.source === pathname);
  if (exact) return exact;

  // Prefix match — pick the longest matching source.
  let best: CockpitRouteRedirect | null = null;
  let bestLen = 0;
  for (const r of COCKPIT_ROUTE_REDIRECTS) {
    if (pathname.startsWith(`${r.source}/`) && r.source.length > bestLen) {
      best = r;
      bestLen = r.source.length;
    }
  }
  return best;
}

/**
 * Strategy Catalogue stays as a distinct surface per §22.
 * Helper for guarding redirects against accidentally collapsing the
 * catalogue routes — exposed so consumers can `if (isCataloguePath(p))
 * return null;` before falling back to the cockpit redirect logic.
 */
export function isCataloguePath(pathname: string): boolean {
  return pathname.startsWith("/services/strategy-catalogue");
}
