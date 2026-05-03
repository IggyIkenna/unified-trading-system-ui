/**
 * DartWidgetMeta — cockpit-axis metadata extension for the widget registry.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §10 + Phase 5 of §17.
 *
 * The existing `WidgetDefinition` already carries asset-group / family /
 * archetype tags. Phase 5 adds the cockpit-axis (surface / mode / stage /
 * engagement / stream) declarations so the cockpit can:
 *
 *   1. Reshape the widget grid as scope changes (relevant widgets become
 *      primary; irrelevant widgets fade or render an "out of scope"
 *      placeholder).
 *   2. Drive scope-aware suggestions ("you're in arbitrage scope —
 *      consider adding the Spread Monitor widget").
 *   3. Bind widgets to config layers per §4.9 (the `configBinding` field
 *      records which config object a widget reads or mutates so the
 *      Promote / Reports surfaces can audit lineage).
 *
 * Phase 5 SCOPE: ship the typed metadata + scope matcher + suggestions
 * helper. Widget-by-widget annotation is incremental — the cockpit
 * tolerates widgets without `dartMeta` (treated as "primary on every
 * surface that matches the legacy axes").
 */

import type {
  ResearchStage,
  TerminalMode,
  WorkspaceEngagement,
  WorkspaceExecutionStream,
  WorkspaceScope,
  WorkspaceSurface,
} from "@/lib/architecture-v2/workspace-scope";

// ─────────────────────────────────────────────────────────────────────────────
// Importance — drives grid placement + visual weight
// ─────────────────────────────────────────────────────────────────────────────

export type WidgetImportance = "primary" | "secondary" | "supporting";

// ─────────────────────────────────────────────────────────────────────────────
// Config binding — §4.9 / §4.11 wire-up
// ─────────────────────────────────────────────────────────────────────────────

export type WidgetConfigBindingKind =
  | "release-bundle" // reads bundle metadata (read-only)
  | "runtime-override" // mutates RuntimeOverride (audited)
  | "external-signal-version" // Signals-In path
  | "treasury-policy" // versioned treasury policy
  | "treasury-operational" // unversioned operational treasury
  | "account-connectivity" // API keys / wallets / signers
  | "research-experiment" // research-side experiment config
  | "ml-experiment"
  | "strategy-experiment"
  | "execution-experiment"
  | "risk"
  | "platform-baseline"
  | "workspace"
  | "none"; // pure read-only widget with no config binding

export interface WidgetConfigBinding {
  /** Which canonical config layer this widget binds to. */
  readonly kind: WidgetConfigBindingKind;
  /** True iff the widget MUTATES the config. False = pure read. */
  readonly mutates: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// DartWidgetMeta
// ─────────────────────────────────────────────────────────────────────────────

export interface DartWidgetMeta {
  /** Surfaces this widget belongs to. Empty = applies to all surfaces. */
  readonly surfaces?: readonly WorkspaceSurface[];

  /** Terminal modes this widget belongs to (only meaningful for surface=terminal). */
  readonly terminalModes?: readonly TerminalMode[];

  /** Research stages this widget belongs to (only meaningful for surface=research). */
  readonly researchStages?: readonly ResearchStage[];

  /** Engagement modes this widget supports. Empty = both monitor + replicate. */
  readonly engagements?: readonly WorkspaceEngagement[];

  /** Execution streams this widget supports. Empty = both paper + live. */
  readonly executionStreams?: readonly WorkspaceExecutionStream[];

  /** Importance of this widget when scope matches. Defaults to "primary". */
  readonly importance?: WidgetImportance;

  /**
   * Preset IDs this widget is recommended for. Used by Phase 6's preset
   * selector to seed an arbitrage-command cockpit with the right widgets.
   */
  readonly recommendedForPresets?: readonly string[];

  /** Config layer this widget binds to (read or mutate). Defaults to "none". */
  readonly configBinding?: WidgetConfigBinding;

  /**
   * Custom scope predicate — escape hatch for widgets whose relevance
   * can't be expressed via the declarative axes (e.g. "show only when
   * scope.assetGroups contains both DEFI and CEFI"). Empty = the
   * declarative axes alone decide.
   */
  readonly scopePredicate?: (scope: WorkspaceScope) => boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scope matching
// ─────────────────────────────────────────────────────────────────────────────

export type WidgetScopeMatch = "primary" | "secondary" | "out-of-scope";

/**
 * Decide whether a widget's `DartWidgetMeta` matches the active
 * `WorkspaceScope`.
 *
 * Rules:
 *   - Empty/undefined `dartMeta` → always primary (legacy widgets without
 *     cockpit annotations stay visible).
 *   - When a declared axis intersects scope → match passes.
 *   - When a declared axis is empty (e.g. `surfaces` not set) → that axis
 *     is treated as "applies to all" and doesn't constrain matching.
 *   - When a declared axis is non-empty AND scope doesn't intersect → the
 *     widget is "out-of-scope" and should render the greyed placeholder.
 *   - `scopePredicate` short-circuits — if it returns false, the widget
 *     is out-of-scope regardless of declarative axes.
 *   - `importance` (when set) downgrades primary → secondary so the grid
 *     can render high-importance widgets larger.
 */
export function matchWidgetToScope(meta: DartWidgetMeta | undefined, scope: WorkspaceScope): WidgetScopeMatch {
  if (!meta) return "primary";

  // Custom predicate is a hard veto.
  if (meta.scopePredicate && !meta.scopePredicate(scope)) {
    return "out-of-scope";
  }

  if (meta.surfaces && meta.surfaces.length > 0 && !meta.surfaces.includes(scope.surface)) {
    return "out-of-scope";
  }

  if (
    scope.surface === "terminal" &&
    meta.terminalModes &&
    meta.terminalModes.length > 0 &&
    scope.terminalMode !== null &&
    !meta.terminalModes.includes(scope.terminalMode)
  ) {
    return "out-of-scope";
  }

  if (
    scope.surface === "research" &&
    meta.researchStages &&
    meta.researchStages.length > 0 &&
    scope.researchStage !== null &&
    !meta.researchStages.includes(scope.researchStage)
  ) {
    return "out-of-scope";
  }

  if (
    meta.engagements &&
    meta.engagements.length > 0 &&
    !meta.engagements.includes(scope.engagement)
  ) {
    return "out-of-scope";
  }

  if (
    meta.executionStreams &&
    meta.executionStreams.length > 0 &&
    !meta.executionStreams.includes(scope.executionStream)
  ) {
    return "out-of-scope";
  }

  // Match passed. Use the declared importance (default primary).
  return meta.importance === "secondary" || meta.importance === "supporting" ? "secondary" : "primary";
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-derived defaults for legacy widgets without explicit dartMeta
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Synthesise a sensible `DartWidgetMeta` from the legacy `assetGroup` field
 * on a widget definition. This gives scope-reactive behavior to the entire
 * widget registry without forcing every register call to be updated.
 *
 * Convention:
 *   - `PLATFORM` widgets (cross-asset: Risk, P&L, Positions, Orders) →
 *     surfaces all cockpit terminals; no asset_group restriction.
 *   - Asset-group widgets (CEFI / DEFI / SPORTS / TRADFI / PREDICTION) →
 *     out-of-scope when the active scope's `assetGroups` is non-empty AND
 *     doesn't include the widget's group. When scope.assetGroups is empty
 *     ("cross-asset"), the widget is always primary.
 *
 * Widgets that declare an explicit `dartMeta` opt out of this default —
 * `matchWidgetToScope` uses the explicit metadata directly.
 */
export function synthesiseDartMetaFromAssetGroup(
  assetGroup: "CEFI" | "DEFI" | "TRADFI" | "SPORTS" | "PREDICTION" | "PLATFORM",
): DartWidgetMeta {
  if (assetGroup === "PLATFORM") {
    // Cross-asset widgets — visible on every terminal/explain surface.
    return {
      surfaces: ["dashboard", "terminal", "research", "reports"],
      importance: "primary",
    };
  }
  // Asset-group widgets — visible only when scope is cross-asset OR
  // includes the widget's group.
  return {
    surfaces: ["dashboard", "terminal", "research"],
    importance: "primary",
    scopePredicate: (scope) => scope.assetGroups.length === 0 || scope.assetGroups.includes(assetGroup),
  };
}
