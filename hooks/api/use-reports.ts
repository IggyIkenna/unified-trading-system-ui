import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";

export function useReports() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["reports", user?.id],
    queryFn: () => apiFetch("/api/reporting/reports", token),
    enabled: !!user,
  });
}

export function useSettlements() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["settlements", user?.id],
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
    queryKey: ["regulatory-reports", user?.id],
    queryFn: () => apiFetch("/api/reporting/regulatory", token),
    enabled: !!user,
  });
}

export function usePnlAttribution() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["pnl-attribution", user?.id],
    queryFn: () => apiFetch("/api/reporting/pnl-attribution", token),
    enabled: !!user,
  });
}

export function useExecutiveSummary() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["executive-summary", user?.id],
    queryFn: () => apiFetch("/api/reporting/executive-summary", token),
    enabled: !!user,
  });
}

export function useInvoices() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["invoices", user?.id],
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
