"use client";

import * as React from "react";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import { useBalances } from "@/hooks/api/use-positions";
import { useTransferHistory } from "@/hooks/api/use-transfer-history";
import { ACCOUNTS } from "@/lib/mocks/fixtures/trading-data";
import { MOCK_SAFTS } from "@/lib/mocks/fixtures/trading-pages";
import type { BalanceRecord, TransferHistoryEntry } from "@/lib/types/accounts";
import type { VenueMargin } from "@/components/trading/margin-utilization";

export type { SAFTRecord } from "@/lib/mocks/fixtures/trading-pages";

export interface AccountsData {
  balances: BalanceRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;

  totalNAV: number;
  totalFree: number;
  totalLocked: number;
  venueMargins: VenueMargin[];

  transferOpen: boolean;
  setTransferOpen: (open: boolean) => void;

  saftRecords: typeof MOCK_SAFTS;
}

export interface AccountsDataContextValue extends AccountsData {
  transferHistory: TransferHistoryEntry[];
  transferHistoryLoading: boolean;
  transferHistoryError: boolean;
  refetchTransferHistory: () => void;
  addTransferEntry: (entry: Omit<TransferHistoryEntry, "timestamp" | "txHash">) => void;
  mode?: string;
}

const AccountsDataContext = React.createContext<AccountsDataContextValue | null>(null);

function coerceBalances(raw: unknown): BalanceRecord[] {
  if (!raw) return [];
  const r = raw as Record<string, unknown>;
  const arr = Array.isArray(r) ? r : (r.data ?? r.balances);
  return Array.isArray(arr) ? (arr as BalanceRecord[]) : [];
}

export function AccountsDataProvider({ children }: { children: React.ReactNode }) {
  const { isPaper, isBatch, mode } = useExecutionMode();
  const globalScope = useWorkspaceScope();
  const { data: balancesRaw, isLoading, error, refetch } = useBalances();
  const {
    data: transferHistory = [],
    isLoading: transferHistoryLoading,
    isError: transferHistoryError,
    refetch: refetchTransferHistory,
  } = useTransferHistory();

  const [transferOpen, setTransferOpen] = React.useState(false);
  const [localEntries, setLocalEntries] = React.useState<TransferHistoryEntry[]>([]);

  const addTransferEntry = React.useCallback((entry: Omit<TransferHistoryEntry, "timestamp" | "txHash">) => {
    const txHash = `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}…`;
    const timestamp = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
    setLocalEntries((prev) => [{ ...entry, timestamp, txHash }, ...prev]);
  }, []);

  // Determine which venues belong to the selected org(s)
  const orgVenues = React.useMemo(() => {
    if (globalScope.organizationIds.length === 0) return null; // null = show all
    const venues = new Set<string>();
    ACCOUNTS.filter((a) => globalScope.organizationIds.includes(a.organizationId)).forEach((a) => venues.add(a.venue));
    return venues;
  }, [globalScope.organizationIds]);

  // Paper mode: add "(Paper)" suffix to account names; Batch mode: add "(T+1)" suffix
  const balances = React.useMemo(() => {
    let raw = coerceBalances(balancesRaw);
    // Filter by org-owned venues when scope is set
    if (orgVenues) {
      raw = raw.filter((b) => orgVenues.has(b.venue));
    }
    if (isPaper) return raw.map((b) => ({ ...b, venue: `${b.venue} (Paper)` }));
    if (isBatch) return raw.map((b) => ({ ...b, venue: `${b.venue} (T+1)` }));
    return raw;
  }, [balancesRaw, isPaper, isBatch, orgVenues]);

  const totalNAV = React.useMemo(() => balances.reduce((sum, b) => sum + b.total, 0), [balances]);
  const totalFree = React.useMemo(() => balances.reduce((sum, b) => sum + b.free, 0), [balances]);
  const totalLocked = React.useMemo(() => balances.reduce((sum, b) => sum + b.locked, 0), [balances]);

  const venueMargins: VenueMargin[] = React.useMemo(
    () =>
      balances.map((b) => {
        const marginUsed = b.margin_used ?? b.locked;
        const marginTotal = b.margin_total ?? b.total;
        const marginAvailable = b.margin_available ?? b.free;
        const utilization = marginTotal > 0 ? (marginUsed / marginTotal) * 100 : 0;
        return {
          venue: b.venue.toLowerCase().replace(/\s+/g, "-"),
          venueLabel: b.venue,
          used: marginUsed,
          available: marginAvailable,
          total: marginTotal,
          utilization,
          trend: utilization > 75 ? ("up" as const) : utilization > 50 ? ("stable" as const) : ("down" as const),
          marginCallDistance: utilization < 90 ? 90 - utilization : undefined,
          lastUpdate: new Date().toLocaleTimeString("en-GB", { timeZone: "UTC" }),
        };
      }),
    [balances],
  );

  const handleRefetch = React.useCallback(() => {
    void refetch();
    void refetchTransferHistory();
  }, [refetch, refetchTransferHistory]);

  const value = React.useMemo(
    () => ({
      balances,
      isLoading,
      error: error as Error | null,
      refetch: handleRefetch,
      totalNAV,
      totalFree,
      totalLocked,
      venueMargins,
      transferOpen,
      setTransferOpen,
      transferHistory: [...localEntries, ...transferHistory],
      transferHistoryLoading,
      transferHistoryError,
      refetchTransferHistory,
      addTransferEntry,
      saftRecords: MOCK_SAFTS,
      mode,
    }),
    [
      balances,
      isLoading,
      error,
      handleRefetch,
      totalNAV,
      totalFree,
      totalLocked,
      venueMargins,
      transferOpen,
      localEntries,
      transferHistory,
      transferHistoryLoading,
      transferHistoryError,
      refetchTransferHistory,
      addTransferEntry,
      isPaper,
      isBatch,
      mode,
    ],
  );

  return <AccountsDataContext.Provider value={value}>{children}</AccountsDataContext.Provider>;
}

export function useAccountsData(): AccountsDataContextValue {
  const ctx = React.useContext(AccountsDataContext);
  if (!ctx) throw new Error("useAccountsData must be used within AccountsDataProvider");
  return ctx;
}
