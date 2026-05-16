import { Filter } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import {
  CryptoScreenerWidget,
  DeFiScreenerWidget,
  PredictionScreenerWidget,
  SportsScreenerWidget,
  TradFiScreenerWidget,
} from "./screeners";

/**
 * P5 cross-asset-group screeners — closes the screener gaps in
 * sports/prediction (per the original audit) AND adds equivalent screeners
 * to cefi/defi/tradfi.
 *
 * Each screener mounts inside the asset_group's existing tab — there is
 * no /screener route per the no-orphans-all-in-DART constraint.
 */

registerPresets("sports", [
  {
    id: "sports-screener-preset",
    name: "Screener",
    tab: "sports",
    isPreset: true,
    layouts: [{ widgetId: "sports-screener", instanceId: "sports-screener-1", x: 0, y: 0, w: 24, h: 16 }],
    createdAt: "2026-04-28T00:00:00Z",
    updatedAt: "2026-04-28T00:00:00Z",
  },
]);

registerPresets("predictions", [
  {
    id: "predictions-screener-preset",
    name: "Screener",
    tab: "predictions",
    isPreset: true,
    layouts: [{ widgetId: "prediction-screener", instanceId: "prediction-screener-1", x: 0, y: 0, w: 24, h: 16 }],
    createdAt: "2026-04-28T00:00:00Z",
    updatedAt: "2026-04-28T00:00:00Z",
  },
]);

registerPresets("markets", [
  {
    id: "markets-crypto-screener",
    name: "Crypto screener",
    tab: "markets",
    isPreset: true,
    layouts: [{ widgetId: "crypto-screener", instanceId: "crypto-screener-1", x: 0, y: 0, w: 24, h: 16 }],
    createdAt: "2026-04-28T00:00:00Z",
    updatedAt: "2026-04-28T00:00:00Z",
  },
]);

registerPresets("defi", [
  {
    id: "defi-screener-preset",
    name: "Screener",
    tab: "defi",
    isPreset: true,
    layouts: [{ widgetId: "defi-screener", instanceId: "defi-screener-1", x: 0, y: 0, w: 24, h: 16 }],
    createdAt: "2026-04-28T00:00:00Z",
    updatedAt: "2026-04-28T00:00:00Z",
  },
]);

registerPresets("tradfi", [
  {
    id: "tradfi-screener-preset",
    name: "Screener",
    tab: "tradfi",
    isPreset: true,
    layouts: [{ widgetId: "tradfi-screener", instanceId: "tradfi-screener-1", x: 0, y: 0, w: 24, h: 16 }],
    createdAt: "2026-04-28T00:00:00Z",
    updatedAt: "2026-04-28T00:00:00Z",
  },
]);

registerWidget({
  id: "sports-screener",
  label: "Sports screener",
  description: "Top-movers (line movement), sharp/square split, value bets.",
  icon: Filter,
  minW: 12,
  minH: 8,
  defaultW: 24,
  defaultH: 16,
  requiredEntitlements: [{ domain: "trading-sports", tier: "basic" }],
  assetGroup: "SPORTS",
  catalogGroup: "Sports",
  availableOn: ["sports"],
  singleton: false,
  component: SportsScreenerWidget,
});

registerWidget({
  id: "prediction-screener",
  label: "Prediction screener",
  description: "Trending markets + closing-soon + probability extremes.",
  icon: Filter,
  minW: 12,
  minH: 8,
  defaultW: 24,
  defaultH: 16,
  requiredEntitlements: [{ domain: "trading-predictions", tier: "basic" }],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: false,
  component: PredictionScreenerWidget,
});

registerWidget({
  id: "crypto-screener",
  label: "Crypto screener",
  description: "Market cap + dominance + 24h volume + change ranking with search.",
  icon: Filter,
  minW: 12,
  minH: 8,
  defaultW: 24,
  defaultH: 16,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Markets",
  availableOn: ["markets", "overview", "terminal"],
  singleton: false,
  component: CryptoScreenerWidget,
});

registerWidget({
  id: "defi-screener",
  label: "DeFi screener",
  description: "TVL + yields + DEX volume composed ranking with risk extra column.",
  icon: Filter,
  minW: 12,
  minH: 8,
  defaultW: 24,
  defaultH: 16,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  assetGroup: "DEFI",
  catalogGroup: "DeFi",
  availableOn: ["defi"],
  singleton: false,
  component: DeFiScreenerWidget,
});

registerWidget({
  id: "tradfi-screener",
  label: "TradFi screener",
  description: "Sector / index / ETF ranking with yield extra column.",
  icon: Filter,
  minW: 12,
  minH: 8,
  defaultW: 24,
  defaultH: 16,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "TRADFI",
  catalogGroup: "TradFi",
  availableOn: ["tradfi"],
  singleton: false,
  component: TradFiScreenerWidget,
});
