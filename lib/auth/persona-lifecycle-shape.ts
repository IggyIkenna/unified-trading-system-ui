/**
 * Per-persona lifecycle-nav visibility shape.
 *
 * Mirrors codex SSOT:
 *   unified-trading-pm/codex/09-strategy/architecture-v2/dart-tab-structure.md § 3.
 *
 * The shell historically exposed 8 lifecycle stages
 * (acquire / build / promote / run / execute / observe / manage / report).
 * Post 2026-04-20 UI collapse → 4 user-visible stages:
 *   - Data (acquire) — admin + internal only
 *   - DART (run)     — absorbs Research + Promote + Execute + Observe as sub-tabs
 *   - Manage
 *   - Reports (report)
 *
 * Internal LifecycleStage type retained for backwards-compat with
 * lifecycle-route-mappings.ts; hidden-from-nav stages never render but route
 * mappings still resolve.
 *
 * SSOT: Phase 11 of plans/active/ui_unification_v2_sanitisation_2026_04_20.plan.md
 */

import type { LifecycleStage } from "@/lib/lifecycle-types";

export type StageVisibility = "visible" | "locked" | "hidden";

export type PersonaLifecycleShape = Record<LifecycleStage, StageVisibility>;

/**
 * Default shape — hide every stage the user-visible collapse removed. Each
 * persona overrides specific stages.
 */
const DEFAULT_SHAPE: PersonaLifecycleShape = {
  acquire: "hidden", // Data — admin-only by default (p11-data-internal-only)
  build: "hidden", // Research folded into DART
  promote: "hidden", // Promote folded into DART
  run: "visible", // DART umbrella
  execute: "hidden", // Execute folded into DART
  observe: "hidden", // Observe folded into DART
  manage: "locked", // Manage locked by default; IR/IM/Regulatory override
  report: "visible",
};

function withOverrides(overrides: Partial<PersonaLifecycleShape>): PersonaLifecycleShape {
  return { ...DEFAULT_SHAPE, ...overrides };
}

/**
 * Persona-id → lifecycle-stage visibility map. Persona ids mirror
 * `lib/auth/personas.ts`.
 */
const PERSONA_SHAPES: Record<string, PersonaLifecycleShape> = {
  // ── Admin + Internal ─────────────────────────────────────────────────────
  // Admin/internal roles get full access to every route, but lifecycle nav
  // collapses to 3 peer stages (DART + Manage + Reports). Data / Research /
  // Promote / Execute / Observe all fold INTO DART via the dropdown + service-
  // tab sub-nav. Per user 2026-04-21: "Data as a service should be folded into
  // DART" — so Data is no longer a peer stage, even for admin. Routes remain
  // reachable via DART's Data sub-tab + direct URL.
  admin: withOverrides({
    run: "visible",
    manage: "visible",
    report: "visible",
  }),
  "internal-trader": withOverrides({
    run: "visible",
    manage: "visible",
    report: "visible",
  }),
  "im-desk-operator": withOverrides({
    run: "visible",
    manage: "visible",
    report: "visible",
  }),

  // ── DART Full clients ────────────────────────────────────────────────────
  "prospect-dart": withOverrides({ run: "visible", manage: "locked", report: "visible" }),
  "client-full": withOverrides({ run: "visible", manage: "locked", report: "visible" }),
  "client-premium": withOverrides({ run: "visible", manage: "hidden", report: "visible" }),

  // ── DART Signals-In ──────────────────────────────────────────────────────
  "prospect-signals-only": withOverrides({
    run: "visible",
    manage: "hidden",
    report: "visible",
  }),

  // ── IM clients (DART stage locked; they don't operate it) ────────────────
  "client-im-pooled": withOverrides({ run: "locked", manage: "locked", report: "visible" }),
  "client-im-sma": withOverrides({ run: "locked", manage: "locked", report: "visible" }),
  "prospect-im": withOverrides({ run: "locked", manage: "locked", report: "visible" }),

  // ── Regulatory Umbrella clients ──────────────────────────────────────────
  "client-regulatory": withOverrides({ run: "locked", manage: "visible", report: "visible" }),
  "prospect-regulatory": withOverrides({ run: "locked", manage: "visible", report: "visible" }),
  // Hybrid case — IM operating under Regulatory Umbrella
  "prospect-im-under-regulatory": withOverrides({
    run: "locked",
    manage: "visible",
    report: "visible",
  }),

  // ── Signals-out counterparty (receives Odum's emitted signals) ───────────
  "prospect-odum-signals": withOverrides({
    run: "hidden",
    manage: "hidden",
    report: "visible",
  }),

  // ── Investor Relations (separate shell) ──────────────────────────────────
  investor: withOverrides({
    run: "hidden",
    manage: "hidden",
    report: "hidden",
  }),
  advisor: withOverrides({
    run: "hidden",
    manage: "hidden",
    report: "hidden",
  }),

  // ── Legacy / niche personas ──────────────────────────────────────────────
  "elysium-defi": withOverrides({
    run: "visible",
    manage: "hidden",
    report: "locked",
  }),
  "prospect-platform": withOverrides({
    run: "visible",
    manage: "hidden",
    report: "visible",
  }),
  "client-data-only": withOverrides({
    run: "hidden",
    manage: "hidden",
    report: "hidden",
  }),
};

/**
 * Resolve the per-persona lifecycle shape. Falls back to a conservative
 * locked-DART / locked-Manage / visible-Reports shape for unknown personas.
 */
export function personaLifecycleShape(
  persona: { id?: string; role?: string } | null | undefined,
): PersonaLifecycleShape {
  if (!persona) return DEFAULT_SHAPE;
  if (persona.id && PERSONA_SHAPES[persona.id]) return PERSONA_SHAPES[persona.id];
  // Fallback by role
  if (persona.role === "admin" || persona.role === "internal") {
    return PERSONA_SHAPES.admin;
  }
  return DEFAULT_SHAPE;
}

/**
 * Canonical DART sub-tab ids — mirrors the table in
 * `dart-tab-structure.md § 2`. Used by lifecycle-nav's DART dropdown and
 * by persona-gated rendering.
 */
export const DART_SUB_TAB_IDS = [
  "research",
  "promote",
  "strategy-config",
  "execution-config",
  "terminal",
  "signal-intake",
  "observe",
  "deployment",
  "reports-sub",
  "catalogue-truth",
] as const;

export type DartSubTabId = (typeof DART_SUB_TAB_IDS)[number];

export type DartSubTabVisibility = Record<DartSubTabId, StageVisibility>;

const DART_DEFAULT: DartSubTabVisibility = {
  research: "hidden",
  promote: "hidden",
  "strategy-config": "hidden",
  "execution-config": "hidden",
  terminal: "visible",
  "signal-intake": "hidden",
  observe: "visible",
  deployment: "hidden",
  "reports-sub": "visible",
  "catalogue-truth": "hidden",
};

const DART_SHAPES: Record<string, DartSubTabVisibility> = {
  admin: {
    research: "visible",
    promote: "visible",
    "strategy-config": "visible",
    "execution-config": "visible",
    terminal: "visible",
    "signal-intake": "visible",
    observe: "visible",
    deployment: "visible",
    "reports-sub": "visible",
    "catalogue-truth": "visible",
  },
  "internal-trader": {
    research: "visible",
    promote: "visible",
    "strategy-config": "visible",
    "execution-config": "visible",
    terminal: "visible",
    "signal-intake": "visible",
    observe: "visible",
    deployment: "visible",
    "reports-sub": "visible",
    "catalogue-truth": "hidden",
  },
  "im-desk-operator": {
    research: "visible",
    promote: "visible",
    "strategy-config": "visible",
    "execution-config": "visible",
    terminal: "visible",
    "signal-intake": "visible",
    observe: "visible",
    deployment: "visible",
    "reports-sub": "visible",
    "catalogue-truth": "visible",
  },
  "prospect-dart": {
    research: "visible",
    promote: "visible",
    "strategy-config": "visible",
    "execution-config": "visible",
    terminal: "visible",
    "signal-intake": "hidden",
    observe: "visible",
    deployment: "visible",
    "reports-sub": "visible",
    "catalogue-truth": "hidden",
  },
  "client-full": {
    research: "visible",
    promote: "visible",
    "strategy-config": "visible",
    "execution-config": "visible",
    terminal: "visible",
    "signal-intake": "hidden",
    observe: "visible",
    deployment: "visible",
    "reports-sub": "visible",
    "catalogue-truth": "hidden",
  },
  // DART Signals-In — NO strategy-config, NO promote, NO research. Signal
  // Intake is their primary surface.
  "prospect-signals-only": {
    research: "hidden",
    promote: "hidden",
    "strategy-config": "hidden",
    "execution-config": "hidden",
    terminal: "visible",
    "signal-intake": "visible",
    observe: "visible",
    deployment: "hidden",
    "reports-sub": "visible",
    "catalogue-truth": "hidden",
  },
  "client-premium": {
    research: "hidden",
    promote: "hidden",
    "strategy-config": "hidden",
    "execution-config": "locked",
    terminal: "visible",
    "signal-intake": "hidden",
    observe: "visible",
    deployment: "hidden",
    "reports-sub": "visible",
    "catalogue-truth": "hidden",
  },
  "elysium-defi": {
    research: "hidden",
    promote: "hidden",
    "strategy-config": "hidden",
    "execution-config": "hidden",
    terminal: "visible",
    "signal-intake": "hidden",
    observe: "visible",
    deployment: "hidden",
    "reports-sub": "locked",
    "catalogue-truth": "hidden",
  },
};

export function personaDartShape(
  persona: { id?: string; role?: string } | null | undefined,
): DartSubTabVisibility {
  if (!persona) return DART_DEFAULT;
  if (persona.id && DART_SHAPES[persona.id]) return DART_SHAPES[persona.id];
  if (persona.role === "admin" || persona.role === "internal") return DART_SHAPES.admin;
  return DART_DEFAULT;
}
