"use client";

import * as React from "react";
import { useBalances } from "@/hooks/api/use-positions";
import { useTransferHistory } from "@/hooks/api/use-transfer-history";
import type { BalanceRecord, TransferHistoryEntry } from "@/lib/types/accounts";
import type { VenueMargin } from "@/components/trading/margin-utilization";

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
}

export interface AccountsDataContextValue extends AccountsData {
  transferHistory: TransferHistoryEntry[];
  transferHistoryLoading: boolean;
  transferHistoryError: boolean;
  refetchTransferHistory: () => void;
}

const AccountsDataContext = React.createContext<AccountsDataContextValue | null>(null);

function coerceBalances(raw: unknown): BalanceRecord[] {
  if (!raw) return [];
  const r = raw as Record<string, unknown>;
  const arr = Array.isArray(r) ? r : r.balances;
  return Array.isArray(arr) ? (arr as BalanceRecord[]) : [];
}

export function AccountsDataProvider({ children }: { children: React.ReactNode }) {
  const { data: balancesRaw, isLoading, error, refetch } = useBalances();
  const {
    data: transferHistory = [],
    isLoading: transferHistoryLoading,
    isError: transferHistoryError,
    refetch: refetchTransferHistory,
  } = useTransferHistory();

  const [transferOpen, setTransferOpen] = React.useState(false);

  const balances = React.useMemo(() => coerceBalances(balancesRaw), [balancesRaw]);

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
          lastUpdate: new Date().toLocaleTimeString(),
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
      transferHistory,
      transferHistoryLoading,
      transferHistoryError,
      refetchTransferHistory,
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
      transferHistory,
      transferHistoryLoading,
      transferHistoryError,
      refetchTransferHistory,
    ],
  );

  return <AccountsDataContext.Provider value={value}>{children}</AccountsDataContext.Provider>;
}

export function useAccountsData(): AccountsDataContextValue {
  const ctx = React.useContext(AccountsDataContext);
  if (!ctx) throw new Error("useAccountsData must be used within AccountsDataProvider");
  return ctx;
}
