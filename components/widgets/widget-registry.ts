import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { StrategyArchetype, StrategyFamily, VenueAssetGroupV2 } from "@/lib/architecture-v2";
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
