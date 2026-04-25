/**
 * TypeScript mirror of the UAC ``FundBusinessUnitRegistry`` (G2.8 Phase A).
 *
 * SSOT:
 *   ``unified-api-contracts/unified_api_contracts/internal/architecture_v2/fund_business_unit.py``
 *
 * Hand-synced per G2.8 Phase D — the registry is small (7 rows) + stable, so
 * the sync-script pattern used for strategy-architecture artefacts isn't
 * warranted yet. A drift test in the UI's Playwright suite asserts the row
 * count + core invariants; if the Python registry grows significantly a
 * ``sync-fund-business-unit-to-ui.sh --check`` follow-up will ship.
 *
 * Consumer: ``<FundSelect>`` in the IM-side allocator surface (G2.10
 * Phase C). Consumers MUST NOT hardcode fund names — always resolve via
 * ``fundsForBusinessUnit(bu)`` or ``fundFor(fundId)``.
 */

/** Who holds the underlying assets. Matches ``CustodyModel`` in Python. */
export type CustodyModel = "CLIENT_OWNED_VENUE" | "COPPER_CUSTODIAN" | "NOT_APPLICABLE";

/** Matches ``StrategyAvailabilityEntry.business_unit`` literal. */
export type BusinessUnit = "saas" | "im_desk" | "admin";

/** Prospect-facing service-family tag. Narrower than rule 12's internal tag. */
export type ServiceFamilyTag = "IM" | "DART" | "RegUmbrella";

export interface FundBusinessUnitEntry {
  readonly fundId: string;
  readonly fundName: string;
  readonly businessUnit: BusinessUnit;
  readonly reservingBusinessUnitId: string;
  readonly custodyModel: CustodyModel;
  readonly serviceFamily: ServiceFamilyTag | null;
  readonly notes: string;
}

/** Hand-synced from the Python ``FUND_BUSINESS_UNIT_REGISTRY`` tuple. */
export const FUND_BUSINESS_UNIT_REGISTRY: readonly FundBusinessUnitEntry[] = [
  {
    fundId: "imp_alpha",
    fundName: "Odum IM Alpha Pooled Fund",
    businessUnit: "im_desk",
    reservingBusinessUnitId: "im_desk_pooled_alpha",
    custodyModel: "COPPER_CUSTODIAN",
    serviceFamily: "IM",
    notes: "Seed IM Pooled fund for 2026.",
  },
  {
    fundId: "sma_acme_llc",
    fundName: "Acme LLC SMA",
    businessUnit: "im_desk",
    reservingBusinessUnitId: "im_desk_sma_acme",
    custodyModel: "CLIENT_OWNED_VENUE",
    serviceFamily: "IM",
    notes: "Reference SMA fixture.",
  },
  {
    fundId: "sma_bridgestone_capital",
    fundName: "Bridgestone Capital SMA",
    businessUnit: "im_desk",
    reservingBusinessUnitId: "im_desk_sma_bridgestone",
    custodyModel: "CLIENT_OWNED_VENUE",
    serviceFamily: "IM",
    notes: "Second SMA fixture demonstrating multi-SMA allocator isolation.",
  },
  {
    fundId: "reg_umbrella_odum_fca",
    fundName: "Odum Regulatory Umbrella (FCA)",
    businessUnit: "im_desk",
    reservingBusinessUnitId: "im_desk_reg_umbrella",
    custodyModel: "CLIENT_OWNED_VENUE",
    serviceFamily: "RegUmbrella",
    notes: "Reg Umbrella funds route client trades under Odum's FCA permissions.",
  },
  {
    fundId: "dart_saas_default",
    fundName: "DART Default SaaS Pool",
    businessUnit: "saas",
    reservingBusinessUnitId: "saas_dart_default",
    custodyModel: "CLIENT_OWNED_VENUE",
    serviceFamily: "DART",
    notes: "Catch-all reserving BU for DART SaaS subscribers.",
  },
  {
    fundId: "admin",
    fundName: "Odum Admin (internal)",
    businessUnit: "admin",
    reservingBusinessUnitId: "admin",
    custodyModel: "NOT_APPLICABLE",
    serviceFamily: null,
    notes: "Admin role row — capacity reservation for internal bring-up.",
  },
  {
    fundId: "im_desk_trading",
    fundName: "IM-Desk Trading (internal)",
    businessUnit: "im_desk",
    reservingBusinessUnitId: "im_desk_internal",
    custodyModel: "NOT_APPLICABLE",
    serviceFamily: null,
    notes: "Internal IM-desk capacity row.",
  },
] as const;

export class FundNotFoundError extends Error {
  constructor(fundId: string) {
    super(`fund_id=${JSON.stringify(fundId)} not found in FUND_BUSINESS_UNIT_REGISTRY`);
    this.name = "FundNotFoundError";
  }
}

export function fundFor(fundId: string): FundBusinessUnitEntry {
  const entry = FUND_BUSINESS_UNIT_REGISTRY.find((e) => e.fundId === fundId);
  if (entry == null) throw new FundNotFoundError(fundId);
  return entry;
}

export function fundsForBusinessUnit(businessUnit: BusinessUnit): readonly FundBusinessUnitEntry[] {
  return FUND_BUSINESS_UNIT_REGISTRY.filter((e) => e.businessUnit === businessUnit);
}

export function reservingBusinessUnitFor(fundId: string): string {
  return fundFor(fundId).reservingBusinessUnitId;
}

/**
 * Funds that show up in the IM-desk allocator's fund-dropdown. Excludes
 * internal capacity rows (admin + im_desk_trading) + SaaS DART. Surfaces
 * IM Pooled + SMAs + Reg Umbrella — the funds a human approver actually
 * allocates capital across.
 */
export function imDeskAllocatableFunds(): readonly FundBusinessUnitEntry[] {
  return FUND_BUSINESS_UNIT_REGISTRY.filter((e) => e.businessUnit === "im_desk" && e.custodyModel !== "NOT_APPLICABLE");
}
