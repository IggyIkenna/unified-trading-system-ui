/**
 * Initial lock-state seed for the strategy catalogue (2026-04-20 snapshot).
 *
 * Per the canonical source at
 *   unified-trading-pm/codex/14-playbooks/shared-core/strategy-allocation-lock-matrix.md
 * the decision rule (locked 2026-04-20) is:
 *
 *   - ONLY `STAT_ARB_PAIRS_FIXED × crypto spot|perp` cells are PUBLIC
 *     (existing mean-rev IM, no exclusivity signed, DART-offerable).
 *   - Everything else in the coverage matrix is INVESTMENT_MANAGEMENT_RESERVED
 *     by default — reserved for Odum's forward plan.
 *   - BTC Fund of Funds is external (not in the catalogue enum, not seeded).
 *
 * This module produces the initial registry entries that the
 * `AvailabilityStoreProvider` mounts into the store on first render (unless
 * localStorage already has a persisted state).
 *
 * SSOT ordering:
 *   1. Python SSOT — strategy-service availability store seeds
 *   2. TypeScript mirror — this file
 *   3. Codex playbook SSOT — strategy-allocation-lock-matrix.md
 *
 * When the matrix changes (new cells added, cells flipped PUBLIC, etc.),
 * update this file + the matrix doc in the same PR.
 */

import type { StrategyArchetype, VenueCategoryV2 } from "./enums";
import type { InstrumentTypeV2 } from "./coverage";
import type { LockState, StrategyAvailabilityEntry, StrategyMaturity } from "./availability";
import { ARCHETYPE_COVERAGE } from "./coverage";

const SNAPSHOT_DATE_ISO = "2026-04-20T00:00:00Z";

/** Human-stable slot label format — keep aligned with strategy-service. */
export function slotLabelFor(
  archetype: StrategyArchetype,
  category: VenueCategoryV2,
  instrumentType: InstrumentTypeV2,
): string {
  return `${archetype}/${category}/${instrumentType}`;
}

/**
 * Cells that are PUBLIC in the 2026-04-20 snapshot. Drives the "everything
 * else is IM_RESERVED" default rule.
 *
 * Format: (archetype, category, instrumentType).
 */
const PUBLIC_CELLS: ReadonlyArray<
  readonly [StrategyArchetype, VenueCategoryV2, InstrumentTypeV2]
> = [
  // Crypto mean-reversion — existing live IM, 1yr+ track record, no
  // exclusivity signed with any client. Offerable to DART prospects.
  ["STAT_ARB_PAIRS_FIXED", "CEFI", "spot"],
  ["STAT_ARB_PAIRS_FIXED", "CEFI", "perp"],
] as const;

/**
 * Cells that are currently running for Odum's own IM mandates. These are
 * explicitly IM_RESERVED (documented here for clarity; the default rule
 * would cover them anyway).
 */
const IM_LIVE_CELLS: ReadonlyArray<{
  readonly archetype: StrategyArchetype;
  readonly category: VenueCategoryV2;
  readonly instrumentType: InstrumentTypeV2;
  readonly maturity: StrategyMaturity;
  readonly reason: string;
}> = [
  {
    archetype: "ML_DIRECTIONAL_CONTINUOUS",
    category: "CEFI",
    instrumentType: "spot",
    maturity: "LIVE_ALLOCATED",
    reason: "BTC ML IM — 10 clients from Jun 2026 (2026-04-20 snapshot)",
  },
  {
    archetype: "ML_DIRECTIONAL_CONTINUOUS",
    category: "CEFI",
    instrumentType: "perp",
    maturity: "LIVE_ALLOCATED",
    reason: "BTC ML IM — 10 clients from Jun 2026 (2026-04-20 snapshot)",
  },
  {
    archetype: "ML_DIRECTIONAL_CONTINUOUS",
    category: "TRADFI",
    instrumentType: "dated_future",
    maturity: "PAPER_TRADING_VALIDATED",
    reason: "CME S&P co-invest — Sept 2026 go-live (2026-04-20 snapshot)",
  },
  {
    archetype: "VOL_TRADING_OPTIONS",
    category: "TRADFI",
    instrumentType: "option",
    maturity: "PAPER_TRADING_VALIDATED",
    reason: "India Options delta-trading — Oct 2026 go-live (2026-04-20 snapshot)",
  },
  {
    archetype: "ML_DIRECTIONAL_EVENT_SETTLED",
    category: "SPORTS",
    instrumentType: "event_settled",
    maturity: "LIVE_ALLOCATED",
    reason: "Sports ML — 2 IM clients from Jun 2026, capacity-bound (2026-04-20 snapshot)",
  },
];

/**
 * Build the full initial registry from the snapshot rules. Every supported
 * coverage cell gets an entry; PUBLIC cells are flagged as such, everything
 * else is IM_RESERVED by default.
 *
 * For cells with an explicit IM-live entry (IM_LIVE_CELLS above), use the
 * declared maturity + reason; otherwise assume BACKTESTED maturity for
 * IM_RESERVED forward-plan cells (externally-visible threshold; doesn't expose
 * them to prospect audiences because lock_state filter hides IM_RESERVED).
 */
export function buildInitialRegistry(): readonly StrategyAvailabilityEntry[] {
  const entries: StrategyAvailabilityEntry[] = [];
  const publicSet = new Set(
    PUBLIC_CELLS.map(([a, c, i]) => slotLabelFor(a, c, i)),
  );
  const imLiveByLabel = new Map<string, (typeof IM_LIVE_CELLS)[number]>();
  for (const entry of IM_LIVE_CELLS) {
    imLiveByLabel.set(
      slotLabelFor(entry.archetype, entry.category, entry.instrumentType),
      entry,
    );
  }

  for (const archetype of Object.keys(ARCHETYPE_COVERAGE) as StrategyArchetype[]) {
    const coverage = ARCHETYPE_COVERAGE[archetype];
    for (const cell of coverage.cells) {
      // Skip unsupported / blocked cells — no point registering lock state
      // for capabilities that don't exist. BLOCKED cells remain hidden by
      // their own status.
      if (cell.status === "NOT_APPLICABLE" || cell.status === "BLOCKED") continue;

      const label = slotLabelFor(
        cell.archetype,
        cell.category,
        cell.instrumentType,
      );

      if (publicSet.has(label)) {
        entries.push({
          slotLabel: label,
          lockState: "PUBLIC",
          maturity: "LIVE_ALLOCATED",
          exclusiveClientId: null,
          reservingBusinessUnitId: null,
          changedAtUtc: SNAPSHOT_DATE_ISO,
          reason:
            "PUBLIC per 2026-04-20 lock matrix (crypto mean-rev, no exclusivity)",
          expiresAtUtc: null,
          baseSlotLabel: null,
        });
        continue;
      }

      const imLive = imLiveByLabel.get(label);
      const lockState: LockState = "INVESTMENT_MANAGEMENT_RESERVED";
      const maturity: StrategyMaturity = imLive?.maturity ?? "BACKTESTED";
      const reason =
        imLive?.reason ??
        "IM_RESERVED forward-plan default per 2026-04-20 lock matrix";

      entries.push({
        slotLabel: label,
        lockState,
        maturity,
        exclusiveClientId: null,
        reservingBusinessUnitId: "odum-im",
        changedAtUtc: SNAPSHOT_DATE_ISO,
        reason,
        expiresAtUtc: null,
        baseSlotLabel: null,
      });
    }
  }

  return entries;
}

/** Expose the PUBLIC-cell set for test assertions and documentation. */
export const PUBLIC_CELL_LABELS: ReadonlySet<string> = new Set(
  PUBLIC_CELLS.map(([a, c, i]) => slotLabelFor(a, c, i)),
);

/** Expose the IM-live list for test assertions. */
export const IM_LIVE_CELL_LABELS: ReadonlySet<string> = new Set(
  IM_LIVE_CELLS.map((e) =>
    slotLabelFor(e.archetype, e.category, e.instrumentType),
  ),
);
