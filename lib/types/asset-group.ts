import type { VenueAssetGroupV2 } from "@/lib/architecture-v2";

/**
 * Asset-group axis for widgets and views.
 *
 * Replaces the previously-overloaded `category` field on `WidgetDefinition`,
 * which mixed venue-axis values ("Sports", "DeFi") with functional groups
 * ("Risk", "Positions"). The venue axis is now `assetGroup`; the catalogue
 * display label is `catalogGroup`. Workspace SSOT: see CLAUDE.md
 * "Asset-group vocabulary" rule and lib/architecture-v2/enums.ts.
 *
 * The "PLATFORM" sentinel covers cross-asset-group widgets (Risk, Positions,
 * P&L, etc.) that aren't scoped to a single venue.
 */
export type WidgetAssetGroup = VenueAssetGroupV2 | "PLATFORM";

export const WIDGET_ASSET_GROUPS: readonly WidgetAssetGroup[] = [
  "CEFI",
  "DEFI",
  "TRADFI",
  "SPORTS",
  "PREDICTION",
  "PLATFORM",
] as const;

export const ASSET_GROUP_LABELS: Record<WidgetAssetGroup, string> = {
  CEFI: "CeFi",
  DEFI: "DeFi",
  TRADFI: "TradFi",
  SPORTS: "Sports",
  PREDICTION: "Prediction",
  PLATFORM: "Platform",
};

/** Trading-shell tab segment for each asset_group (matches /platform/services/trading/<tab>). */
export const ASSET_GROUP_ROUTE_TAB: Record<WidgetAssetGroup, string | null> = {
  CEFI: "trading",
  DEFI: "defi",
  TRADFI: "tradfi",
  SPORTS: "sports",
  PREDICTION: "predictions",
  PLATFORM: null,
};
