import type { CommissionStructureType, VenueAssetGroupV2, VenueRoutingMode } from "./enums";

/**
 * VenueCapabilityV2 UI view model.
 *
 * SSOT: `unified-api-contracts/unified_api_contracts/internal/architecture_v2/schemas.py`
 * (VenueCapabilityV2, CollateralRulesV2, MarginSpec, CommissionStructureV2).
 *
 * The UI only needs a subset for the capability viewer: per venue, show
 * LTV / haircut / margin mode / commission so traders can compare routing
 * options at a glance. Full schema pulled server-side by the API gateway
 * when the gateway wires the `/api/v1/venues/capabilities` endpoint.
 */

export type MarginMode = "ISOLATED" | "CROSS" | "PORTFOLIO" | "REG_T" | "SPAN";

export interface LtvAndHaircut {
  max_ltv_pct: number;
  initial_haircut_pct: number;
  maintenance_haircut_pct: number;
}

export interface MarginSpecView {
  modes: readonly MarginMode[];
  default_mode: MarginMode;
  max_leverage: number;
  notes: string | null;
}

export interface CommissionTierView {
  min_volume_usd: number;
  maker_bps: number;
  taker_bps: number;
}

export interface CommissionStructureView {
  type: CommissionStructureType;
  flat_bps: number | null;
  tiers: readonly CommissionTierView[];
}

export interface CollateralRulesView {
  supported_assets: readonly string[];
  per_asset_ltv: Readonly<Record<string, LtvAndHaircut>>;
  netting_enabled: boolean;
}

export interface VenueCapabilityView {
  venue: string;
  display_name: string;
  assetGroup: VenueAssetGroupV2;
  routing_mode: VenueRoutingMode;
  features: readonly string[];
  collateral_rules: CollateralRulesView;
  margin: MarginSpecView;
  commission: CommissionStructureView;
  notes: string | null;
}

/**
 * Execution policy view model — one row per
 * (venue × action × condition) precomputed by the policy registry in
 * execution-service (phase 4).
 */
export interface ExecutionPolicyRow {
  venue: string;
  action: string;
  condition: string;
  decision: "ALLOW" | "REJECT" | "RESIZE" | "DEFER";
  rationale: string;
  policy_version: string;
}
