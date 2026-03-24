import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { typedFetch } from "@/lib/api/typed-fetch";

export function useAlerts() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["alerts", user?.id],
    queryFn: () => apiFetch("/api/alerts/list", token),
    enabled: !!user,
  });
}

export function useAlertsSummary() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["alerts-summary", user?.id],
    queryFn: () => apiFetch("/api/alerts/summary", token),
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
