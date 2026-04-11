import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useReports() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["reports", user?.id ?? "anon"],
    queryFn: () => apiFetch("/api/reporting/reports", token),
    enabled: !!user,
  });
}

export function useSettlements() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["settlements", user?.id ?? "anon"],
    queryFn: () => apiFetch("/api/reporting/settlements", token),
    enabled: !!user,
  });
}

export function useReconciliation() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["reconciliation", user?.id],
    queryFn: () => apiFetch("/api/reporting/reconciliation", token),
    enabled: !!user,
  });
}

export function useRegulatoryReports() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["regulatory-reports", user?.id ?? "anon"],
    queryFn: () => apiFetch("/api/reporting/regulatory", token),
    enabled: !!user,
  });
}

export function usePnlAttribution() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["pnl-attribution", user?.id ?? "anon"],
    queryFn: () => apiFetch("/api/reporting/pnl-attribution", token),
    enabled: !!user,
  });
}

export function useExecutiveSummary() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["executive-summary", user?.id ?? "anon"],
    queryFn: () => apiFetch("/api/reporting/executive-summary", token),
    enabled: !!user,
  });
}

export function useInvoices() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["invoices", user?.id ?? "anon"],
    queryFn: () => apiFetch("/api/reporting/invoices", token),
    enabled: !!user,
  });
}

// ── Reconciliation hooks ────────────────────────────────────────────────────

export interface ReconciliationBreaksParams {
  status?: string;
  venue?: string;
  date_from?: string;
  date_to?: string;
  category?: string;
}

export function useReconciliationBreaks(params?: ReconciliationBreaksParams) {
  const { user, token } = useAuth();

  const queryString = params
    ? "?" +
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(
        ([k, v]) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`,
      )
      .join("&")
    : "";

  return useQuery({
    queryKey: ["reconciliation-breaks", params, user?.id],
    queryFn: () =>
      apiFetch(`/api/reporting/reconciliation/breaks${queryString}`, token),
    enabled: !!user,
  });
}

export interface ResolveBreakParams {
  break_id: string;
  action: string;
  note: string;
  resolved_by: string;
}

export function useResolveBreak() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ResolveBreakParams) =>
      apiFetch("/api/reporting/reconciliation/resolve", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation-breaks"] });
      queryClient.invalidateQueries({ queryKey: ["reconciliation"] });
    },
  });
}

export interface BookCorrectionParams {
  break_id: string;
}

export function useBookCorrection() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: BookCorrectionParams) =>
      apiFetch("/api/reporting/reconciliation/book-correction", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation-breaks"] });
      queryClient.invalidateQueries({ queryKey: ["reconciliation"] });
    },
  });
}

// ── Live reconciliation hooks (position-balance-monitor-service) ─────────────

export function useReconciliationDeviations(status?: string) {
  const { user, token } = useAuth();
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";

  return useQuery({
    queryKey: ["recon-deviations", status, user?.id],
    queryFn: () =>
      apiFetch(`/api/positions/reconciliation/deviations${qs}`, token),
    enabled: !!user,
    refetchInterval: 30_000,
  });
}

export function useReconciliationBalances(venue?: string) {
  const { user, token } = useAuth();
  const qs = venue ? `?venue=${encodeURIComponent(venue)}` : "";

  return useQuery({
    queryKey: ["recon-balances", venue, user?.id],
    queryFn: () =>
      apiFetch(`/api/positions/reconciliation/balances${qs}`, token),
    enabled: !!user,
    refetchInterval: 30_000,
  });
}

export function useReconciliationPnL(venue?: string) {
  const { user, token } = useAuth();
  const qs = venue ? `?venue=${encodeURIComponent(venue)}` : "";

  return useQuery({
    queryKey: ["recon-pnl", venue, user?.id],
    queryFn: () => apiFetch(`/api/positions/reconciliation/pnl${qs}`, token),
    enabled: !!user,
    refetchInterval: 30_000,
  });
}

export function useReconciliationSummary() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["recon-summary", user?.id],
    queryFn: () => apiFetch("/api/positions/reconciliation/summary", token),
    enabled: !!user,
    refetchInterval: 15_000,
  });
}

export interface ResolveDeviationParams {
  deviation_id: string;
  action: string;
  note: string;
  resolved_by: string;
}

export function useResolveDeviation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ResolveDeviationParams) =>
      apiFetch("/api/positions/reconciliation/resolve", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recon-deviations"] });
      queryClient.invalidateQueries({ queryKey: ["recon-summary"] });
    },
  });
}

export function useAutoReconHistory() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["recon-auto-history", user?.id],
    queryFn: () =>
      apiFetch("/api/positions/reconciliation/auto-recon/history", token),
    enabled: !!user,
  });
}

// ── Fund Operations & NAV hooks ─────────────────────────────────────────────

export function useFundOperations(clientIds?: string) {
  const { user, token } = useAuth();
  const qs = clientIds ? `?client_ids=${encodeURIComponent(clientIds)}` : "";

  return useQuery({
    queryKey: ["fund-operations", clientIds, user?.id ?? "anon"],
    queryFn: () => apiFetch(`/api/reporting/fund-operations${qs}`, token),
    enabled: !!user,
  });
}

export function useNAV(clientIds?: string) {
  const { user, token } = useAuth();
  const qs = clientIds ? `?client_ids=${encodeURIComponent(clientIds)}` : "";

  return useQuery({
    queryKey: ["nav", clientIds, user?.id ?? "anon"],
    queryFn: () => apiFetch(`/api/reporting/nav${qs}`, token),
    enabled: !!user,
  });
}
