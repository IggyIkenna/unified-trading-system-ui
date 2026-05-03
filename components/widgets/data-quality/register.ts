import { Database } from "lucide-react";

import { registerWidget } from "../widget-registry";
import { InstrumentCatalogueWidget } from "./instrument-catalogue-widget";

/**
 * Data-quality widget registry (catalogue plan P3.2).
 *
 * The instrument catalogue is the cross-asset-group availability matrix —
 * static shard-dynamics SSOT joined with the live manifest, surfaced as a
 * scrollable per-tuple table grouped by asset_group. Cross-links to the
 * existing /admin/data drilldown for per-shard inspection.
 *
 * Catalogue is regenerated nightly at 02:00 UTC by the
 * instrument-catalogue-regen Cloud Run Job; the widget consumes the
 * artefact via the /api/catalogue/instrument GCS proxy with a 5-min
 * server cache.
 *
 * No-orphan rule: registers under PLATFORM asset_group + Data quality
 * catalog group, available on the terminal tab so the DART surface has
 * the cross-asset coverage view alongside its asset-group-scoped widgets.
 */

registerWidget({
  id: "data-quality-instrument-catalogue",
  label: "Instrument catalogue",
  description:
    "Cross-asset-group availability matrix — static shard-dynamics SSOT joined with the live manifest. Per-tuple coverage % + live/batch readiness.",
  icon: Database,
  minW: 12,
  minH: 8,
  defaultW: 24,
  defaultH: 12,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Data quality",
  availableOn: ["terminal"],
  singleton: true,
  component: InstrumentCatalogueWidget,
});
