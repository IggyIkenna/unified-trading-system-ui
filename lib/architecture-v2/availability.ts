/**
 * Strategy Architecture v2 — availability + lock state + maturity (Phase 10.5).
 *
 * TypeScript mirror of the Python SSOT at
 * `unified-api-contracts/unified_api_contracts/internal/architecture_v2/strategy_availability.py`.
 *
 * Two orthogonal dimensions ride on every slot:
 *
 *   - lock_state (4 values) — who is allowed to see/use the slot. SaaS-vs-IM
 *     business-model gate.
 *   - maturity (8 values) — how production-ready the slot is, monotonic
 *     ladder. Drives internal-vs-external catalogue visibility.
 *
 * Filter helpers (`slotsVisibleTo`, `validateAllocationAuthorised`) gate on
 * BOTH dimensions. This file is the runtime registry the UI reads from; admin
 * overrides are passed as an explicit `registry` argument per call.
 *
 * SSOT: unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/strategy-availability-and-locking.md
 */

export type LockState =
  | "PUBLIC"
  | "INVESTMENT_MANAGEMENT_RESERVED"
  | "CLIENT_EXCLUSIVE"
  | "RETIRED";

export const LOCK_STATES: readonly LockState[] = [
  "PUBLIC",
  "INVESTMENT_MANAGEMENT_RESERVED",
  "CLIENT_EXCLUSIVE",
  "RETIRED",
] as const;

export type StrategyMaturity =
  | "CODE_NOT_WRITTEN"
  | "CODE_WRITTEN"
  | "CODE_AUDITED"
  | "BACKTESTED"
  | "PAPER_TRADING"
  | "PAPER_TRADING_VALIDATED"
  | "LIVE_TINY"
  | "LIVE_ALLOCATED";

export const MATURITY_LADDER: readonly StrategyMaturity[] = [
  "CODE_NOT_WRITTEN",
  "CODE_WRITTEN",
  "CODE_AUDITED",
  "BACKTESTED",
  "PAPER_TRADING",
  "PAPER_TRADING_VALIDATED",
  "LIVE_TINY",
  "LIVE_ALLOCATED",
] as const;

/** Zero-based rank on the monotonic maturity ladder. */
export function maturityRank(m: StrategyMaturity): number {
  const idx = MATURITY_LADDER.indexOf(m);
  if (idx < 0) {
    throw new Error(`unknown maturity: ${m}`);
  }
  return idx;
}

export type Audience =
  | "admin"
  | "im_desk"
  | "im_client"
  | "trading_platform_subscriber";

export type BusinessUnit = "saas" | "im_desk" | "admin";

/**
 * External-visibility threshold — slots below this maturity are hidden from
 * every non-internal audience. Internal `admin`/`im_desk` surfaces see
 * pre-BACKTESTED placeholders too.
 */
export const EXTERNAL_VISIBILITY_MIN_MATURITY: StrategyMaturity = "BACKTESTED";

/**
 * Minimum maturity the allocator will push capital to. Slots below this
 * raise StrategyNotAvailableError even when the lock state permits.
 */
export const ALLOCATION_MIN_MATURITY: StrategyMaturity = "LIVE_TINY";

export interface StrategyAvailabilityEntry {
  readonly slotLabel: string;
  readonly lockState: LockState;
  readonly maturity: StrategyMaturity;
  /** Set when lockState === "CLIENT_EXCLUSIVE". Exactly one client per slot. */
  readonly exclusiveClientId: string | null;
  /** Set when lockState === "INVESTMENT_MANAGEMENT_RESERVED". */
  readonly reservingBusinessUnitId: string | null;
  /** ISO 8601 timestamp of the most recent transition. */
  readonly changedAtUtc: string;
  /** Human-readable reason. */
  readonly reason: string;
  /** For time-bounded locks. null for open-ended. */
  readonly expiresAtUtc: string | null;
  /** Optional base slot this row derives from. */
  readonly baseSlotLabel: string | null;
}

const DEFAULT_ENTRY_STUB = {
  lockState: "PUBLIC" as const,
  maturity: "LIVE_ALLOCATED" as const,
  exclusiveClientId: null,
  reservingBusinessUnitId: null,
  changedAtUtc: "",
  reason: "",
  expiresAtUtc: null,
  baseSlotLabel: null,
};

/**
 * Make a default StrategyAvailabilityEntry for a slot that isn't explicitly
 * registered. Matches the Python default (PUBLIC, LIVE_ALLOCATED) so already-
 * shipped slots preserve allocation behaviour.
 */
export function defaultEntry(slotLabel: string): StrategyAvailabilityEntry {
  return { slotLabel, ...DEFAULT_ENTRY_STUB };
}

export function availabilityFor(
  slotLabel: string,
  registry: Iterable<StrategyAvailabilityEntry> = [],
): StrategyAvailabilityEntry {
  for (const entry of registry) {
    if (entry.slotLabel === slotLabel) {
      return entry;
    }
  }
  return defaultEntry(slotLabel);
}

/**
 * Yield the slot labels that `audience` is authorised to see.
 *
 * - `admin` sees everything (including RETIRED history and placeholders).
 * - `im_desk` sees the full universe minus pre-CODE_AUDITED placeholders.
 *   RETIRED remains visible for audit context.
 * - `im_client` sees PUBLIC or their own CLIENT_EXCLUSIVE, maturity >=
 *   BACKTESTED, not RETIRED. IM_RESERVED hidden.
 * - `trading_platform_subscriber` same as im_client for DIY clients.
 */
export function slotsVisibleTo(
  audience: Audience,
  options: {
    clientId?: string | null;
    registry?: Iterable<StrategyAvailabilityEntry>;
    knownSlotLabels?: Iterable<string>;
  } = {},
): string[] {
  const { clientId = null, registry = [], knownSlotLabels } = options;

  const slotsByLabel = new Map<string, StrategyAvailabilityEntry>();
  for (const entry of registry) {
    slotsByLabel.set(entry.slotLabel, entry);
  }
  if (knownSlotLabels !== undefined) {
    for (const label of knownSlotLabels) {
      if (!slotsByLabel.has(label)) {
        slotsByLabel.set(label, defaultEntry(label));
      }
    }
  }

  const visible: string[] = [];
  for (const entry of slotsByLabel.values()) {
    if (isVisible(entry, audience, clientId)) {
      visible.push(entry.slotLabel);
    }
  }
  return visible;
}

function isVisible(
  entry: StrategyAvailabilityEntry,
  audience: Audience,
  clientId: string | null,
): boolean {
  if (audience === "admin") {
    return true;
  }

  if (audience === "im_desk") {
    return maturityRank(entry.maturity) >= maturityRank("CODE_AUDITED");
  }

  // Non-internal audiences — enforce external threshold + no retired.
  if (maturityRank(entry.maturity) < maturityRank(EXTERNAL_VISIBILITY_MIN_MATURITY)) {
    return false;
  }
  if (entry.lockState === "RETIRED") {
    return false;
  }

  if (audience === "im_client") {
    if (entry.lockState === "PUBLIC") {
      return true;
    }
    if (entry.lockState === "CLIENT_EXCLUSIVE") {
      return entry.exclusiveClientId === clientId;
    }
    return false;
  }

  // trading_platform_subscriber
  if (entry.lockState === "PUBLIC") {
    return true;
  }
  if (entry.lockState === "CLIENT_EXCLUSIVE") {
    return entry.exclusiveClientId === clientId;
  }
  return false;
}

/** Parity with Python: raised when the gate refuses the allocation. */
export class StrategyNotAvailableError extends Error {
  constructor(
    readonly slotLabel: string,
    readonly reason: string,
  ) {
    super(`strategy not available: ${slotLabel} (${reason})`);
    this.name = "StrategyNotAvailableError";
  }
}

export class StrategyRetiredError extends StrategyNotAvailableError {
  constructor(slotLabel: string) {
    super(slotLabel, "retired");
    this.name = "StrategyRetiredError";
  }
}

/**
 * TypeScript parity with Python `validate_allocation_authorised`. Throws on
 * unauthorised / immature. No-op on success. Used by UI-side previews of an
 * AllocationDirective so the user sees the same refusal text the backend
 * would emit.
 */
export function validateAllocationAuthorised(
  slotLabel: string,
  clientId: string,
  businessUnit: BusinessUnit,
  registry: Iterable<StrategyAvailabilityEntry> = [],
): void {
  const entry = availabilityFor(slotLabel, registry);

  if (entry.lockState === "RETIRED") {
    throw new StrategyRetiredError(slotLabel);
  }

  if (maturityRank(entry.maturity) < maturityRank(ALLOCATION_MIN_MATURITY)) {
    throw new StrategyNotAvailableError(
      slotLabel,
      `maturity ${entry.maturity} < ${ALLOCATION_MIN_MATURITY}`,
    );
  }

  if (
    entry.lockState === "INVESTMENT_MANAGEMENT_RESERVED" &&
    businessUnit !== "im_desk"
  ) {
    throw new StrategyNotAvailableError(slotLabel, "IM-reserved");
  }

  if (entry.lockState === "CLIENT_EXCLUSIVE") {
    if (businessUnit === "im_desk") {
      throw new StrategyNotAvailableError(
        slotLabel,
        "client-exclusive (IM observe-only)",
      );
    }
    if (businessUnit === "admin") {
      return;
    }
    if (clientId !== entry.exclusiveClientId) {
      throw new StrategyNotAvailableError(slotLabel, "client-exclusive");
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Display metadata for chip primitives
// ─────────────────────────────────────────────────────────────────────────────

export const LOCK_STATE_LABEL: Readonly<Record<LockState, string>> = {
  PUBLIC: "Public",
  INVESTMENT_MANAGEMENT_RESERVED: "IM reserved",
  CLIENT_EXCLUSIVE: "Client exclusive",
  RETIRED: "Retired",
};

export const MATURITY_LABEL: Readonly<Record<StrategyMaturity, string>> = {
  CODE_NOT_WRITTEN: "Placeholder",
  CODE_WRITTEN: "Code written",
  CODE_AUDITED: "Audited",
  BACKTESTED: "Backtested",
  PAPER_TRADING: "Paper",
  PAPER_TRADING_VALIDATED: "Paper validated",
  LIVE_TINY: "Live (tiny)",
  LIVE_ALLOCATED: "Live (allocated)",
};
