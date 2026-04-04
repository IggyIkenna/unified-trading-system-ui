import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { typedFetch, type GatewayApiResponse } from "@/lib/api/typed-fetch";

type AlertsListResponse = GatewayApiResponse<"/api/alerts/list">;
type AlertsSummaryResponse = GatewayApiResponse<"/api/alerts/summary">;

export function useAlerts() {
  const { user, token } = useAuth();

  return useQuery<AlertsListResponse>({
    queryKey: ["alerts", user?.id],
    queryFn: () =>
      typedFetch<AlertsListResponse>("/api/alerts/list", token),
    enabled: !!user,
  });
}

export function useAlertsSummary() {
  const { user, token } = useAuth();

  return useQuery<AlertsSummaryResponse>({
    queryKey: ["alerts-summary", user?.id],
    queryFn: () =>
      typedFetch<AlertsSummaryResponse>("/api/alerts/summary", token),
    enabled: !!user,
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
