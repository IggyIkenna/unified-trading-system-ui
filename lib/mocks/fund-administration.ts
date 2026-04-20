/**
 * Deterministic mock fixtures + in-memory store for fund-administration-service.
 *
 * Drives `/services/im/funds/*` pages when `NEXT_PUBLIC_MOCK_API=true`. The
 * store is module-scope (per-tab) so form submissions optimistically reflect
 * in list views within a session. This parallels the mock-trade-ledger and
 * mock-onboarding-state patterns — no network, no backend required.
 */

import type {
  AllocatorRedemption,
  AllocatorSubscription,
  ApproveSubscriptionRequest,
  FundAllocation,
  NavSnapshot,
  ProcessRedemptionRequest,
  RebalanceRequest,
  RedeemRequest,
  RejectRequest,
  SubscribeRequest,
} from "@/lib/api/fund-administration";

const DEFAULT_FUND_ID = "odum-pooled-fund-1";
const DEFAULT_SHARE_CLASS = "USD-A";

// ---------------------------------------------------------------------------
// Seed fixtures — deterministic, no Date.now()/randomUUID so tests stable.
// ---------------------------------------------------------------------------

const SEED_SUBSCRIPTIONS: AllocatorSubscription[] = [
  {
    subscription_id: "sub-001",
    fund_id: DEFAULT_FUND_ID,
    allocator_id: "client-alpha",
    share_class: DEFAULT_SHARE_CLASS,
    requested_amount_usd: "250000.00",
    requested_timestamp: "2026-04-12T10:00:00Z",
    status: "PENDING",
    nav_strike_snapshot_id: null,
    units_issued: null,
    approval_timestamp: null,
    rejection_reason: null,
  },
  {
    subscription_id: "sub-002",
    fund_id: DEFAULT_FUND_ID,
    allocator_id: "client-beta",
    share_class: DEFAULT_SHARE_CLASS,
    requested_amount_usd: "500000.00",
    requested_timestamp: "2026-04-10T14:30:00Z",
    status: "APPROVED",
    nav_strike_snapshot_id: "nav-snap-001",
    units_issued: "490196.078431",
    approval_timestamp: "2026-04-11T09:00:00Z",
    rejection_reason: null,
  },
  {
    subscription_id: "sub-003",
    fund_id: DEFAULT_FUND_ID,
    allocator_id: "client-gamma",
    share_class: DEFAULT_SHARE_CLASS,
    requested_amount_usd: "1000000.00",
    requested_timestamp: "2026-03-28T08:15:00Z",
    status: "SETTLED",
    nav_strike_snapshot_id: "nav-snap-000",
    units_issued: "990099.009900",
    approval_timestamp: "2026-03-29T10:00:00Z",
    rejection_reason: null,
  },
];

const SEED_REDEMPTIONS: AllocatorRedemption[] = [
  {
    redemption_id: "red-001",
    fund_id: DEFAULT_FUND_ID,
    allocator_id: "client-gamma",
    share_class: DEFAULT_SHARE_CLASS,
    units_to_redeem: "100000.000000",
    destination: "iban:GB82WEST12345698765432",
    requested_timestamp: "2026-04-14T09:00:00Z",
    status: "PENDING",
    grace_period_days: 5,
    redemption_nav_snapshot_id: null,
    cash_amount_due_usd: null,
    settlement_timestamp: null,
    settlement_reference: null,
    rejection_reason: null,
  },
  {
    redemption_id: "red-002",
    fund_id: DEFAULT_FUND_ID,
    allocator_id: "client-beta",
    share_class: DEFAULT_SHARE_CLASS,
    units_to_redeem: "50000.000000",
    destination: "iban:DE89370400440532013000",
    requested_timestamp: "2026-03-10T11:00:00Z",
    status: "SETTLED",
    grace_period_days: 5,
    redemption_nav_snapshot_id: "nav-snap-settled-01",
    cash_amount_due_usd: "51500.00",
    settlement_timestamp: "2026-03-18T15:00:00Z",
    settlement_reference: "wire:2026-03-18-0001",
    rejection_reason: null,
  },
];

const SEED_ALLOCATIONS: FundAllocation[] = [
  {
    allocation_id: "alloc-001",
    fund_id: DEFAULT_FUND_ID,
    share_class: DEFAULT_SHARE_CLASS,
    strategy_id: "btc_ml_directional_perp",
    target_amount_usd: "2000000.00",
    allocation_timestamp: "2026-04-12T09:00:00Z",
    execution_status: "COMPLETED",
    executed_amount_usd: "1998750.00",
    executed_timestamp: "2026-04-12T09:05:23Z",
  },
  {
    allocation_id: "alloc-002",
    fund_id: DEFAULT_FUND_ID,
    share_class: DEFAULT_SHARE_CLASS,
    strategy_id: "defi_carry_basis_dated",
    target_amount_usd: "1500000.00",
    allocation_timestamp: "2026-04-12T09:00:00Z",
    execution_status: "PENDING",
    executed_amount_usd: null,
    executed_timestamp: null,
  },
  {
    allocation_id: "alloc-003",
    fund_id: DEFAULT_FUND_ID,
    share_class: DEFAULT_SHARE_CLASS,
    strategy_id: "stat_arb_pairs_fixed",
    target_amount_usd: "750000.00",
    allocation_timestamp: "2026-04-12T09:00:00Z",
    execution_status: "COMPLETED",
    executed_amount_usd: "749120.00",
    executed_timestamp: "2026-04-12T09:07:41Z",
  },
];

const SEED_NAV_HISTORY: NavSnapshot[] = [
  {
    snapshot_id: "nav-snap-001",
    fund_id: DEFAULT_FUND_ID,
    share_class: DEFAULT_SHARE_CLASS,
    snapshot_timestamp: "2026-04-12T23:59:00Z",
    nav_usd: "4250000.00",
    nav_change_usd: "+42000.00",
    nav_change_pct: "0.99",
  },
];

// ---------------------------------------------------------------------------
// Module-scope store — fresh copy per process so test isolation is cheap.
// Tests that want a clean slate import `resetMockStore()`.
// ---------------------------------------------------------------------------

interface MockStore {
  subscriptions: AllocatorSubscription[];
  redemptions: AllocatorRedemption[];
  allocations: FundAllocation[];
  navHistory: NavSnapshot[];
}

function freshStore(): MockStore {
  return {
    subscriptions: SEED_SUBSCRIPTIONS.map((s) => ({ ...s })),
    redemptions: SEED_REDEMPTIONS.map((r) => ({ ...r })),
    allocations: SEED_ALLOCATIONS.map((a) => ({ ...a })),
    navHistory: SEED_NAV_HISTORY.map((n) => ({ ...n })),
  };
}

let store: MockStore = freshStore();

export function resetMockStore(): void {
  store = freshStore();
}

export const MOCK_DEFAULT_FUND_ID = DEFAULT_FUND_ID;
export const MOCK_DEFAULT_SHARE_CLASS = DEFAULT_SHARE_CLASS;

// ---------------------------------------------------------------------------
// Deterministic clock — tests override via `setMockNow`.
// ---------------------------------------------------------------------------

let mockNowIso = "2026-04-20T12:00:00Z";
export function setMockNow(iso: string): void {
  mockNowIso = iso;
}
function now(): string {
  return mockNowIso;
}

// ---------------------------------------------------------------------------
// Subscription ops
// ---------------------------------------------------------------------------

export function mockCreateSubscription(req: SubscribeRequest): Promise<AllocatorSubscription> {
  const created: AllocatorSubscription = {
    subscription_id: req.subscription_id,
    fund_id: req.fund_id,
    allocator_id: req.allocator_id,
    share_class: req.share_class,
    requested_amount_usd: req.requested_amount_usd,
    requested_timestamp: now(),
    status: "PENDING",
    nav_strike_snapshot_id: null,
    units_issued: null,
    approval_timestamp: null,
    rejection_reason: null,
  };
  store.subscriptions = [created, ...store.subscriptions];
  return Promise.resolve(created);
}

export function mockGetSubscription(id: string): Promise<AllocatorSubscription> {
  const found = store.subscriptions.find((s) => s.subscription_id === id);
  if (!found) return Promise.reject(new Error(`subscription ${id} not found`));
  return Promise.resolve(found);
}

export function mockListSubscriptions(): Promise<AllocatorSubscription[]> {
  return Promise.resolve(store.subscriptions.map((s) => ({ ...s })));
}

export function mockApproveSubscription(
  id: string,
  _req: ApproveSubscriptionRequest,
): Promise<AllocatorSubscription> {
  return patchSubscription(id, (sub) => ({
    ...sub,
    status: "APPROVED",
    approval_timestamp: now(),
    nav_strike_snapshot_id: "nav-snap-mock-approve",
    units_issued: String(Number(sub.requested_amount_usd) / 1.02),
  }));
}

export function mockRejectSubscription(
  id: string,
  req: RejectRequest,
): Promise<AllocatorSubscription> {
  return patchSubscription(id, (sub) => ({
    ...sub,
    status: "REJECTED",
    rejection_reason: req.reason,
  }));
}

export function mockSettleSubscription(id: string): Promise<AllocatorSubscription> {
  return patchSubscription(id, (sub) => ({ ...sub, status: "SETTLED" }));
}

function patchSubscription(
  id: string,
  mutate: (sub: AllocatorSubscription) => AllocatorSubscription,
): Promise<AllocatorSubscription> {
  const idx = store.subscriptions.findIndex((s) => s.subscription_id === id);
  if (idx < 0) return Promise.reject(new Error(`subscription ${id} not found`));
  const existing = store.subscriptions[idx];
  if (!existing) return Promise.reject(new Error(`subscription ${id} not found`));
  const next = mutate(existing);
  store.subscriptions = [
    ...store.subscriptions.slice(0, idx),
    next,
    ...store.subscriptions.slice(idx + 1),
  ];
  return Promise.resolve(next);
}

// ---------------------------------------------------------------------------
// Redemption ops
// ---------------------------------------------------------------------------

export function mockCreateRedemption(req: RedeemRequest): Promise<AllocatorRedemption> {
  const created: AllocatorRedemption = {
    redemption_id: req.redemption_id,
    fund_id: req.fund_id,
    allocator_id: req.allocator_id,
    share_class: req.share_class,
    units_to_redeem: req.units_to_redeem,
    destination: req.destination,
    requested_timestamp: now(),
    status: "PENDING",
    grace_period_days: req.grace_period_days ?? 5,
    redemption_nav_snapshot_id: null,
    cash_amount_due_usd: null,
    settlement_timestamp: null,
    settlement_reference: null,
    rejection_reason: null,
  };
  store.redemptions = [created, ...store.redemptions];
  return Promise.resolve(created);
}

export function mockGetRedemption(id: string): Promise<AllocatorRedemption> {
  const found = store.redemptions.find((r) => r.redemption_id === id);
  if (!found) return Promise.reject(new Error(`redemption ${id} not found`));
  return Promise.resolve(found);
}

export function mockListRedemptions(): Promise<AllocatorRedemption[]> {
  return Promise.resolve(store.redemptions.map((r) => ({ ...r })));
}

export function mockApproveRedemption(id: string): Promise<AllocatorRedemption> {
  return patchRedemption(id, (r) => ({ ...r, status: "APPROVED" }));
}

export function mockRejectRedemption(id: string, req: RejectRequest): Promise<AllocatorRedemption> {
  return patchRedemption(id, (r) => ({
    ...r,
    status: "REJECTED",
    rejection_reason: req.reason,
  }));
}

export function mockProcessRedemption(
  id: string,
  req: ProcessRedemptionRequest,
): Promise<AllocatorRedemption> {
  return patchRedemption(id, (r) => ({
    ...r,
    status: "PROCESSED",
    redemption_nav_snapshot_id: "nav-snap-mock-process",
    cash_amount_due_usd: String(Number(r.units_to_redeem) * Number(req.settlement_nav)),
    settlement_reference: req.settlement_reference,
  }));
}

export function mockSettleRedemption(id: string): Promise<AllocatorRedemption> {
  return patchRedemption(id, (r) => ({
    ...r,
    status: "SETTLED",
    settlement_timestamp: now(),
  }));
}

function patchRedemption(
  id: string,
  mutate: (r: AllocatorRedemption) => AllocatorRedemption,
): Promise<AllocatorRedemption> {
  const idx = store.redemptions.findIndex((r) => r.redemption_id === id);
  if (idx < 0) return Promise.reject(new Error(`redemption ${id} not found`));
  const existing = store.redemptions[idx];
  if (!existing) return Promise.reject(new Error(`redemption ${id} not found`));
  const next = mutate(existing);
  store.redemptions = [
    ...store.redemptions.slice(0, idx),
    next,
    ...store.redemptions.slice(idx + 1),
  ];
  return Promise.resolve(next);
}

// ---------------------------------------------------------------------------
// Allocation ops
// ---------------------------------------------------------------------------

export function mockListAllocations(fund_id: string): Promise<FundAllocation[]> {
  return Promise.resolve(
    store.allocations.filter((a) => a.fund_id === fund_id).map((a) => ({ ...a })),
  );
}

export function mockRebalanceAllocations(
  fund_id: string,
  req: RebalanceRequest,
): Promise<FundAllocation[]> {
  // Produce a new allocation record per target and return the complete set.
  const ts = now();
  const newAllocations: FundAllocation[] = req.targets.map((t) => ({
    allocation_id: t.allocation_id,
    fund_id,
    share_class: req.share_class,
    strategy_id: t.strategy_id,
    target_amount_usd: t.target_amount_usd,
    allocation_timestamp: ts,
    execution_status: "COMPLETED",
    executed_amount_usd: t.target_amount_usd,
    executed_timestamp: ts,
  }));
  store.allocations = [
    ...store.allocations.filter((a) => a.fund_id !== fund_id),
    ...newAllocations,
  ];
  return Promise.resolve(newAllocations);
}

// ---------------------------------------------------------------------------
// NAV history
// ---------------------------------------------------------------------------

export function mockGetNavHistory(
  fund_id: string,
  share_class: string,
): Promise<NavSnapshot[]> {
  return Promise.resolve(
    store.navHistory
      .filter((n) => n.fund_id === fund_id && n.share_class === share_class)
      .map((n) => ({ ...n })),
  );
}
