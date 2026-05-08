/**
 * Treasury config — policy / operational split.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.md §4.8.6 + the §10.5 Treasury
 * subsection in `unified-trading-system-ui/docs/reference/automation-common-tools.md`.
 *
 * The split is non-negotiable:
 *
 *   TreasuryPolicyConfig      — versioned. Bundles into StrategyReleaseBundle.
 *                                Re-promotion required to change.
 *                                Ownership: Research (experiment owner) +
 *                                Admin (baseline owner).
 *   TreasuryOperationalConfig — audited but unversioned. Mutable at runtime
 *                                under audit. No bundle re-promotion.
 *                                Ownership: Admin / Ops (owner). Reports
 *                                surface as audit-only.
 *
 * Why split:
 *   - Policy decisions (which collateral set is acceptable, which hedge ratio
 *     range is allowed, share-class denomination) shape strategy behaviour
 *     and so MUST be pinned in the bundle for reproducibility.
 *   - Operational decisions (which specific wallet receives a yield rotation,
 *     which exact fee bucket the system pays from this hour) change too
 *     often to be in the bundle and don't change behaviour — only routing.
 *
 * Phase 1B SCOPE: typed objects only — no UI, no registry. The Allocate
 * stage (Research) wires policy editing in Phase 4; the Admin / Ops surface
 * wires operational config editing in Phase 9.
 */

import type { ShareClass } from "./enums";

// ─────────────────────────────────────────────────────────────────────────────
// TreasuryPolicyConfig — versioned, bundles into StrategyReleaseBundle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Acceptable collateral set + denomination + hedge / leverage policy.
 * Versioned. Pinned in the release bundle via
 * `StrategyReleaseBundle.treasuryPolicyConfigVersion`.
 */
export interface TreasuryPolicyConfig {
  readonly policyConfigId: string;
  readonly version: string; // semver — bumped on every change

  // Collateral / denomination.
  /** Approved collateral asset symbols (e.g. ["USDT", "USDC", "BTC", "ETH"]). */
  readonly approvedCollateral: readonly string[];
  readonly shareClass: ShareClass;

  // Hedge policy.
  /** Allowed hedge-ratio range as `[min, max]` (decimals; 1 = fully hedged). */
  readonly hedgeRatioRange: readonly [number, number];
  /** When true, automatic hedge rebalancing within the range is allowed. */
  readonly autoRebalanceEnabled: boolean;
  /** Trigger threshold for auto-rebalance (decimal drift from target). */
  readonly rebalanceThreshold?: number;

  // Leverage policy.
  /** Maximum gross leverage as a multiple of NAV. Hard cap. */
  readonly maxGrossLeverage: number;
  /** Maximum net leverage. Typically lower than gross. */
  readonly maxNetLeverage: number;

  // Wallet whitelist — bundle-time declaration of which wallets/protocols are
  // permitted destinations for treasury actions. Runtime overrides (via
  // RuntimeOverride.treasury_route) may only target wallets in this list.
  readonly whitelistedWalletIds: readonly string[];

  // Audit.
  readonly createdBy: string;
  readonly createdAt: string;
  readonly approvedBy?: string;
  readonly approvedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TreasuryOperationalConfig — audited, unversioned
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Operational routing — which specific wallet, fee bucket, or settlement
 * pipe a treasury action touches. Mutable at runtime under audit. NOT bundled.
 *
 * Mutations route through `recordAudit()` (the same event-sink layer
 * RuntimeOverride writes to) but do NOT version-bump.
 */
export interface TreasuryOperationalConfig {
  readonly operationalConfigId: string;

  // Active routing.
  /** Default wallet for inbound yield / staking rewards. */
  readonly inboundDefaultWalletId: string;
  /** Default wallet for outbound trading collateral. */
  readonly outboundDefaultWalletId: string;
  /** Fee-payment bucket for venue / protocol fees. */
  readonly feeBucketWalletId: string;

  // Settlement.
  /** Default settlement venue / protocol id for end-of-window roll-ups. */
  readonly settlementVenueId?: string;

  // Audit metadata — who last touched what, with the upstream audit reference.
  readonly lastUpdatedBy: string;
  readonly lastUpdatedAt: string;
  readonly lastAuditEventId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Wallet-whitelist enforcement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * True iff `targetWalletId` is on the policy's whitelist. Used by the
 * RuntimeOverride.treasury_route guardrail check at write time.
 */
export function isWalletWhitelisted(policy: Pick<TreasuryPolicyConfig, "whitelistedWalletIds">, targetWalletId: string): boolean {
  return policy.whitelistedWalletIds.includes(targetWalletId);
}
