import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { withMode } from "@/lib/api/with-mode";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useReports() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["reports", user?.id ?? "anon", scope.mode],
    queryFn: () => apiFetch(withMode("/api/reporting/reports", scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useSettlements() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["settlements", user?.id ?? "anon", scope.mode],
    queryFn: () => apiFetch(withMode("/api/reporting/settlements", scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useReconciliation() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["reconciliation", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/reporting/reconciliation", scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useRegulatoryReports() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["regulatory-reports", user?.id ?? "anon", scope.mode],
    queryFn: () => apiFetch(withMode("/api/reporting/regulatory", scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function usePnlAttribution() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["pnl-attribution", user?.id ?? "anon", scope.mode],
    queryFn: () => apiFetch(withMode("/api/reporting/pnl-attribution", scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useExecutiveSummary() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["executive-summary", user?.id ?? "anon", scope.mode],
    queryFn: () => apiFetch(withMode("/api/reporting/executive-summary", scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useInvoices() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["invoices", user?.id ?? "anon", scope.mode],
    queryFn: () => apiFetch(withMode("/api/reporting/invoices", scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
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
  const { scope } = useGlobalScope();

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
    queryKey: ["reconciliation-breaks", params, user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode(`/api/reporting/reconciliation/breaks${queryString}`, scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
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
  const { scope } = useGlobalScope();
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";

  return useQuery({
    queryKey: ["recon-deviations", status, user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode(`/api/positions/reconciliation/deviations${qs}`, scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : 30_000,
  });
}

export function useReconciliationBalances(venue?: string) {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();
  const qs = venue ? `?venue=${encodeURIComponent(venue)}` : "";

  return useQuery({
    queryKey: ["recon-balances", venue, user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode(`/api/positions/reconciliation/balances${qs}`, scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : 30_000,
  });
}

export function useReconciliationPnL(venue?: string) {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();
  const qs = venue ? `?venue=${encodeURIComponent(venue)}` : "";

  return useQuery({
    queryKey: ["recon-pnl", venue, user?.id, scope.mode],
    queryFn: () => apiFetch(withMode(`/api/positions/reconciliation/pnl${qs}`, scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : 30_000,
  });
}

export function useReconciliationSummary() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["recon-summary", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/positions/reconciliation/summary", scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : 15_000,
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
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["recon-auto-history", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode("/api/positions/reconciliation/auto-recon/history", scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

// ── Fund Operations & NAV hooks ─────────────────────────────────────────────

export function useFundOperations(clientIds?: string) {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();
  const qs = clientIds ? `?client_ids=${encodeURIComponent(clientIds)}` : "";

  return useQuery({
    queryKey: ["fund-operations", clientIds, user?.id ?? "anon", scope.mode],
    queryFn: () => apiFetch(withMode(`/api/reporting/fund-operations${qs}`, scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useNAV(clientIds?: string) {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();
  const qs = clientIds ? `?client_ids=${encodeURIComponent(clientIds)}` : "";

  return useQuery({
    queryKey: ["nav", clientIds, user?.id ?? "anon", scope.mode],
    queryFn: () => apiFetch(withMode(`/api/reporting/nav${qs}`, scope.mode, scope.asOfDatetime), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}
