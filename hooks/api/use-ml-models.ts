import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { useGlobalScope } from "@/lib/stores/global-scope-store";

function withMode(base: string, mode: string): string {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}mode=${mode}`;
}

export function useModelFamilies() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["model-families", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode("/api/ml/model-families", scope.mode), token),
    enabled: !!user,
  });
}

export function useExperiments() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["experiments", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/ml/experiments", scope.mode), token),
    enabled: !!user,
  });
}

export function useExperimentDetail(id: string) {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["experiment-detail", id, user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode(`/api/ml/experiments/${id}`, scope.mode), token),
    enabled: !!user && !!id,
  });
}

export function useTrainingRuns() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["training-runs", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode("/api/ml/training-runs", scope.mode), token),
    enabled: !!user,
  });
}

export function useCreateTrainingJob() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch("/api/ml/training-jobs", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-runs"] });
    },
  });
}

export function useModelVersions() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["model-versions", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/ml/versions", scope.mode), token),
    enabled: !!user,
  });
}

export function usePromoteModel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/ml/models/${id}/promote`, token, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-versions"] });
      queryClient.invalidateQueries({ queryKey: ["model-families"] });
    },
  });
}

export function useMLDeployments() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["ml-deployments", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/ml/deployments", scope.mode), token),
    enabled: !!user,
  });
}

export function useFeatureProvenance() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["feature-provenance", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/ml/features", scope.mode), token),
    enabled: !!user,
  });
}

export function useDatasets() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["datasets", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/ml/datasets", scope.mode), token),
    enabled: !!user,
  });
}

export function useValidationResults() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["validation-results", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode("/api/ml/validation-results", scope.mode), token),
    enabled: !!user,
  });
}

export function useMLMonitoring() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["ml-monitoring", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/ml/monitoring", scope.mode), token),
    enabled: !!user,
  });
}

export function useMLGovernance() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["ml-governance", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/ml/governance", scope.mode), token),
    enabled: !!user,
  });
}

export function useMLConfig() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["ml-config", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/ml/config", scope.mode), token),
    enabled: !!user,
  });
}
