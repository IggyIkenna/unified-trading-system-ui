import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { typedFetch, type GatewayApiResponse } from "@/lib/api/typed-fetch";
import { withMode } from "@/lib/api/with-mode";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";

type AlertsListResponse = GatewayApiResponse<"/api/alerts/list">;
type AlertsSummaryResponse = GatewayApiResponse<"/api/alerts/summary">;

export function useAlerts() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<AlertsListResponse>({
    queryKey: ["alerts", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<AlertsListResponse>(withMode("/api/alerts/list", scope.mode, scope.asOfTs ?? undefined), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useAlertsSummary() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<AlertsSummaryResponse>({
    queryKey: ["alerts-summary", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<AlertsSummaryResponse>(withMode("/api/alerts/summary", scope.mode, scope.asOfTs ?? undefined), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useAcknowledgeAlert() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch("/api/alerts/acknowledge", token, {
        method: "POST",
        body: JSON.stringify({ alertId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-summary"] });
    },
  });
}

export function useEscalateAlert() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch("/api/alerts/escalate", token, {
        method: "POST",
        body: JSON.stringify({ alertId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-summary"] });
    },
  });
}

export function useResolveAlert() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch("/api/alerts/resolve", token, {
        method: "POST",
        body: JSON.stringify({ alertId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-summary"] });
    },
  });
}
