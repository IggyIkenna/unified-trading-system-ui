import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import type { RunComparison } from "@/lib/ml-types";

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

/** Unified training runs (4-page ML architecture). GET /api/ml/training/runs */
export function useUnifiedTrainingRuns(filters?: {
  status?: string;
  family?: string;
}) {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();
  const qs = new URLSearchParams();
  if (filters?.status) qs.set("status", filters.status);
  if (filters?.family) qs.set("family", filters.family);
  const path = qs.toString()
    ? `/api/ml/training/runs?${qs.toString()}`
    : "/api/ml/training/runs";

  return useQuery({
    queryKey: [
      "ml-unified-runs",
      user?.id,
      scope.mode,
      filters?.status,
      filters?.family,
    ],
    queryFn: () => apiFetch(withMode(path, scope.mode), token),
    enabled: !!user,
  });
}

/** GET /api/ml/training/runs/:id */
export function useUnifiedTrainingRunDetail(id: string | null) {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["ml-unified-run", id, user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode(`/api/ml/training/runs/${id}`, scope.mode), token),
    enabled: !!user && !!id,
  });
}

/** GET /api/ml/training/queue */
export function useTrainingQueue() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["ml-training-queue", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode("/api/ml/training/queue", scope.mode), token),
    enabled: !!user,
  });
}

/** GET /api/ml/pipeline/status — overview KPIs */
export function useMLPipelineStatus() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["ml-pipeline-status", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode("/api/ml/pipeline/status", scope.mode), token),
    enabled: !!user,
  });
}

/** GET /api/ml/alerts */
export function useMLAlerts() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["ml-alerts", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/ml/alerts", scope.mode), token),
    enabled: !!user,
  });
}

/** GET /api/ml/analysis/runs/:id — RunAnalysis bundle */
export function useRunAnalysisBundle(runId: string | null) {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["ml-run-analysis", runId, user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode(`/api/ml/analysis/runs/${runId}`, scope.mode), token),
    enabled: !!user && !!runId,
  });
}

/** POST /api/ml/analysis/compare */
export function useMLRunComparison(
  runAId: string | null,
  runBId: string | null,
) {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["ml-compare", runAId, runBId, user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode("/api/ml/analysis/compare", scope.mode), token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_a_id: runAId,
          run_b_id: runBId,
        }),
      }) as Promise<RunComparison[]>,
    enabled:
      !!user &&
      !!runAId &&
      !!runBId &&
      runAId.length > 0 &&
      runBId.length > 0 &&
      runAId !== runBId,
  });
}

/** POST /api/ml/training/runs — create and queue */
export function useCreateUnifiedTrainingRun() {
  const { token } = useAuth();
  const { scope } = useGlobalScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch(withMode("/api/ml/training/runs", scope.mode), token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ml-unified-runs"] });
      queryClient.invalidateQueries({ queryKey: ["ml-pipeline-status"] });
      queryClient.invalidateQueries({ queryKey: ["ml-training-queue"] });
    },
  });
}

/** POST /api/ml/training/runs/:id/cancel */
export function useCancelUnifiedTrainingRun() {
  const { token } = useAuth();
  const { scope } = useGlobalScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(
        withMode(`/api/ml/training/runs/${id}/cancel`, scope.mode),
        token,
        { method: "POST" },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ml-unified-runs"] });
      queryClient.invalidateQueries({ queryKey: ["ml-pipeline-status"] });
    },
  });
}

/** GET /api/ml/registry/models — same shape as model versions list */
export function useRegistryModels() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["ml-registry-models", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode("/api/ml/registry/models", scope.mode), token),
    enabled: !!user,
  });
}
