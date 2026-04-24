import { vi } from "vitest";
import type { BalanceRecord, TransferHistoryEntry } from "@/lib/types/accounts";
import type { VenueMargin } from "@/components/trading/margin-utilization";
import type { SAFTRecord } from "@/lib/mocks/fixtures/trading-pages";

/**
 * Builds a BalanceRecord for accounts widget harness tests. Matches the
 * shape consumed by accounts-data-context.tsx:
 *   BalanceRecord = { venue, free, locked, total, margin_* }
 */
export function buildMockBalanceRecord(overrides: Partial<BalanceRecord> = {}): BalanceRecord {
  return {
    venue: "Binance",
    free: 50_000,
    locked: 10_000,
    total: 60_000,
    margin_used: 10_000,
    margin_available: 50_000,
    margin_total: 60_000,
    ...overrides,
  };
}

export function buildMockVenueMargin(overrides: Partial<VenueMargin> = {}): VenueMargin {
  return {
    venue: "binance",
    venueLabel: "Binance",
    used: 10_000,
    available: 50_000,
    total: 60_000,
    utilization: 16.67,
    trend: "down",
    marginCallDistance: 73.33,
    lastUpdate: "00:00:00",
    ...overrides,
  };
}

export function buildMockTransferHistoryEntry(overrides: Partial<TransferHistoryEntry> = {}): TransferHistoryEntry {
  return {
    timestamp: "24 Apr 12:00",
    type: "Venue→Venue",
    from: "Binance",
    to: "OKX",
    asset: "USDC",
    amount: 1_000,
    status: "Completed",
    txHash: "0xabc123…",
    ...overrides,
  };
}

export function buildMockSaftRecord(overrides: Partial<SAFTRecord> = {}): SAFTRecord {
  return {
    id: "saft-1",
    token: "Protocol Z (PZ)",
    round: "Seed",
    committedAmount: 500_000,
    tokenPrice: 0.08,
    tokensAllocated: 6_250_000,
    vestedPct: 50,
    cliffDate: "2026-01-01",
    fullVestDate: "2027-06-01",
    currentPrice: 0.12,
    currentValue: 750_000,
    npv: 600_000,
    ...overrides,
  };
}

export interface MockAccountsDataOverrides {
  balances?: BalanceRecord[];
  venueMargins?: VenueMargin[];
  transferHistory?: TransferHistoryEntry[];
  saftRecords?: SAFTRecord[];
  totalNAV?: number;
  totalFree?: number;
  totalLocked?: number;
  isLoading?: boolean;
  error?: Error | null;
  transferHistoryLoading?: boolean;
  transferHistoryError?: boolean;
  transferOpen?: boolean;
  addTransferEntry?: ReturnType<typeof vi.fn>;
}

/**
 * Returns a factory for the fields accounts widgets read from
 * useAccountsData(). Use with vi.mock('./accounts-data-context', ...).
 *
 * Keep the surface minimal: tests shouldn't break when unrelated fields
 * are added to the real AccountsDataContextValue.
 */
export function buildMockAccountsData(overrides: MockAccountsDataOverrides = {}) {
  const balances = overrides.balances ?? [buildMockBalanceRecord()];
  const venueMargins = overrides.venueMargins ?? [buildMockVenueMargin()];
  const transferHistory = overrides.transferHistory ?? [buildMockTransferHistoryEntry()];
  const saftRecords = overrides.saftRecords ?? [buildMockSaftRecord()];
  const totalNAV = overrides.totalNAV ?? balances.reduce((s, b) => s + b.total, 0);
  const totalFree = overrides.totalFree ?? balances.reduce((s, b) => s + b.free, 0);
  const totalLocked = overrides.totalLocked ?? balances.reduce((s, b) => s + b.locked, 0);
  return {
    balances,
    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? null,
    refetch: vi.fn(),
    totalNAV,
    totalFree,
    totalLocked,
    venueMargins,
    transferOpen: overrides.transferOpen ?? false,
    setTransferOpen: vi.fn(),
    saftRecords,
    transferHistory,
    transferHistoryLoading: overrides.transferHistoryLoading ?? false,
    transferHistoryError: overrides.transferHistoryError ?? false,
    refetchTransferHistory: vi.fn(),
    addTransferEntry: overrides.addTransferEntry ?? vi.fn(),
    mode: "live",
  };
}
