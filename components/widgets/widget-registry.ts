import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { StrategyArchetype, StrategyFamily, VenueAssetGroupV2 } from "@/lib/architecture-v2";
import type { WorkspaceScope } from "@/lib/architecture-v2/workspace-scope";
import {
  matchWidgetToScope,
  synthesiseDartMetaFromAssetGroup,
  type DartWidgetMeta,
  type WidgetScopeMatch,
} from "@/lib/cockpit/widget-meta";
import type { StrategyFamilyEntitlement, TradingEntitlement } from "@/lib/config/auth";
import { type WidgetAssetGroup, WIDGET_ASSET_GROUPS } from "@/lib/types/asset-group";

export interface WidgetComponentProps {
  instanceId: string;
  config?: Record<string, unknown>;
}

/**
 * An entitlement requirement on a widget. Strings name flat entitlements
 * (`"data-pro"`, `"reporting"`, …); structured shapes name trading-domain
 * or v2 strategy-family entitlements with tier semantics (premium ≥ basic).
 */
export type WidgetEntitlement = string | TradingEntitlement | StrategyFamilyEntitlement;

export interface WidgetDefinition {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /**
   * Asset-group axis (SSOT for the venue dimension). Replaces the legacy
   * `category` field's overloaded use for asset_groups. Use "PLATFORM" for
   * cross-asset-group widgets (Risk / Positions / P&L / Orders / etc.).
   */
  assetGroup: WidgetAssetGroup;
  /**
   * Display label for grouping in the widget catalogue Finder. Free-form
   * string ("Risk", "Positions", "Lending supply", "Sports"). Was previously
   * named `category` but renamed to remove the asset-group / display-group
   * overload.
   */
  catalogGroup: string;

  minW: number;
  minH: number;
  maxW?: number;
  maxH?: number;
  defaultW: number;
  defaultH: number;

  /**
   * OR-semantics: widget unlocks when the user satisfies **any** of these
   * entries. Existing widgets keep this shape — no migration required.
   */
  requiredEntitlements: WidgetEntitlement[];
  /**
   * AND-semantics (optional): widget unlocks only when the user satisfies
   * **every** entry here, in addition to passing `requiredEntitlements`.
   * Use this when a widget needs both an asset-group axis and a strategy
   * family axis (e.g. CARRY_AND_YIELD on CeFi). Empty / undefined = no
   * extra requirement.
   */
  requiredEntitlementsAll?: WidgetEntitlement[];

  availableOn: string[];
  singleton?: boolean;
  component: ComponentType<WidgetComponentProps>;

  // ── Descriptive tags (no gating implied here — gating goes through
  //    requiredEntitlements / requiredEntitlementsAll). Used by the widget
  //    catalogue, the locked-item explanations, and future scope-aware
  //    rendering. Empty / undefined = "applies to all".
  /** Strategy families this widget is relevant to (v2 taxonomy). */
  families?: StrategyFamily[];
  /** Strategy archetypes this widget is relevant to (v2 taxonomy). */
  archetypes?: StrategyArchetype[];
  /** Venue asset groups this widget is relevant to (CEFI / DEFI / SPORTS / TRADFI / PREDICTION). */
  assetGroups?: VenueAssetGroupV2[];

  /**
   * Cockpit-axis metadata (Phase 5 of dart_ux_cockpit_refactor §10).
   * Controls which workspace surfaces / modes / stages / engagements /
   * streams this widget is relevant to. Empty/undefined = legacy widget,
   * always rendered primary.
   */
  dartMeta?: DartWidgetMeta;
}

export interface WidgetPlacement {
  widgetId: string;
  instanceId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, unknown>;
  /** Additional widget IDs merged into this cell as tabs alongside the primary widgetId */
  coTabs?: string[];
  /** Which co-tab is active; defaults to widgetId (the primary) */
  activeTabId?: string;
}

const registry = new Map<string, WidgetDefinition>();

export function registerWidget(def: WidgetDefinition) {
  registry.set(def.id, def);
}

export function getWidget(id: string): WidgetDefinition | undefined {
  return registry.get(id);
}

export function getWidgetsForTab(tab: string): WidgetDefinition[] {
  return Array.from(registry.values()).filter((w) => w.availableOn.includes(tab));
}

export function getAllWidgets(): WidgetDefinition[] {
  return Array.from(registry.values());
}

/** Returns all widgets grouped by their `catalogGroup` field, for the catalogue Finder UI. */
export function getAllWidgetsByCatalogGroup(): Record<string, WidgetDefinition[]> {
  const grouped: Record<string, WidgetDefinition[]> = {};
  for (const w of registry.values()) {
    (grouped[w.catalogGroup] ??= []).push(w);
  }
  return grouped;
}

/** Returns all widgets grouped by their `assetGroup` axis (SSOT for venue dimension). */
export function getAllWidgetsByAssetGroup(): Record<WidgetAssetGroup, WidgetDefinition[]> {
  const grouped: Record<WidgetAssetGroup, WidgetDefinition[]> = {
    CEFI: [],
    DEFI: [],
    TRADFI: [],
    SPORTS: [],
    PREDICTION: [],
    PLATFORM: [],
  };
  for (const w of registry.values()) {
    grouped[w.assetGroup].push(w);
  }
  return grouped;
}

/** All widgets relevant to a single asset_group. Cross-asset (`PLATFORM`) widgets are included for non-platform queries when relevant. */
export function getWidgetsForAssetGroup(
  assetGroup: WidgetAssetGroup,
  options: { includePlatform?: boolean } = {},
): WidgetDefinition[] {
  const includePlatform = options.includePlatform ?? assetGroup !== "PLATFORM";
  return Array.from(registry.values()).filter(
    (w) => w.assetGroup === assetGroup || (includePlatform && w.assetGroup === "PLATFORM"),
  );
}

export { WIDGET_ASSET_GROUPS };

// ─────────────────────────────────────────────────────────────────────────────
// Scope-reactive selectors (Phase 5)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decide whether a widget matches the active WorkspaceScope. When the
 * widget hasn't declared an explicit `dartMeta`, fall back to the asset-
 * group-based synthesis (PLATFORM = always primary; per-group = primary
 * iff scope.assetGroups is empty or includes the widget's group).
 */
export function widgetScopeMatch(def: WidgetDefinition, scope: WorkspaceScope): WidgetScopeMatch {
  const meta = def.dartMeta ?? synthesiseDartMetaFromAssetGroup(def.assetGroup);
  return matchWidgetToScope(meta, scope);
}

/**
 * Bucket every registered widget by its match against the active scope.
 * Used by the cockpit grid to:
 *   - render `primary` widgets at full visual weight
 *   - render `secondary` widgets in a sidebar / collapsed state
 *   - render `outOfScope` widgets behind a greyed "out of scope" placeholder
 *     (or hide them entirely for cleaner cockpits)
 */
export function widgetsForScope(scope: WorkspaceScope): {
  readonly primary: readonly WidgetDefinition[];
  readonly secondary: readonly WidgetDefinition[];
  readonly outOfScope: readonly WidgetDefinition[];
} {
  const primary: WidgetDefinition[] = [];
  const secondary: WidgetDefinition[] = [];
  const outOfScope: WidgetDefinition[] = [];

  for (const def of registry.values()) {
    const match = widgetScopeMatch(def, scope);
    if (match === "primary") primary.push(def);
    else if (match === "secondary") secondary.push(def);
    else outOfScope.push(def);
  }

  return { primary, secondary, outOfScope };
}

/**
 * Resolver-aware variant of `widgetsForScope`. Per audit polish #3:
 *
 *   "No strategy-backed widget should appear just because scope matches.
 *    It should appear because: scope match + resolver visibility +
 *    entitlement + backing strategy exists."
 *
 * Filters: when the user has zero `owned` strategies AND the surface is one
 * where operating data only makes sense for an owned strategy
 * (Terminal/Command, Terminal/Strategies, Terminal/Explain), demote
 * strategy-operating widgets (positions / orders / pnl / alerts / accounts /
 * trade-history) from `primary` to `secondary`. Catalogue / market-data
 * widgets are unaffected — they're meaningful even without subscriptions.
 *
 * The result keeps every widget reachable, but reorders priority so the
 * cockpit doesn't render "live positions" tiles for a prospect with no
 * subscribed strategy.
 */
export function widgetsForScopeWithVisibility(
  scope: WorkspaceScope,
  visibility: { readonly ownedCount: number; readonly readOnlyCount: number },
): {
  readonly primary: readonly WidgetDefinition[];
  readonly secondary: readonly WidgetDefinition[];
  readonly outOfScope: readonly WidgetDefinition[];
} {
  const buckets = widgetsForScope(scope);
  const hasBackingStrategy = visibility.ownedCount + visibility.readOnlyCount > 0;
  const requiresOwnedSurface =
    scope.surface === "terminal" &&
    (scope.terminalMode === "command" || scope.terminalMode === "strategies" || scope.terminalMode === "explain");

  if (hasBackingStrategy || !requiresOwnedSurface) {
    return buckets;
  }

  // No backing strategy on a surface that needs one — demote the
  // strategy-operating widgets to secondary. The catalogue group
  // identifiers are the SSOT for which widgets count as "operating".
  const OPERATING_GROUPS = new Set([
    "Positions",
    "Orders",
    "P&L",
    "Risk",
    "Alerts",
    "Accounts",
    "Trade History",
    "Strategy",
    "Strategies",
    "Strategy Catalog",
  ]);

  const stillPrimary: WidgetDefinition[] = [];
  const demoted: WidgetDefinition[] = [];
  for (const w of buckets.primary) {
    if (OPERATING_GROUPS.has(w.catalogGroup)) demoted.push(w);
    else stillPrimary.push(w);
  }

  return {
    primary: stillPrimary,
    secondary: [...demoted, ...buckets.secondary],
    outOfScope: buckets.outOfScope,
  };
}

/**
 * Suggest widgets to add for the active scope: widgets that match the
 * scope AND aren't already on a workspace placement list. Used by the
 * Phase 6/7 "Add Widget" affordance + scope-aware next-actions.
 */
export function suggestedWidgetsForScope(
  scope: WorkspaceScope,
  excludeIds: readonly string[] = [],
): readonly WidgetDefinition[] {
  const exclude = new Set(excludeIds);
  return Array.from(registry.values()).filter((def) => {
    if (exclude.has(def.id)) return false;
    return widgetScopeMatch(def, scope) === "primary";
  });
}
