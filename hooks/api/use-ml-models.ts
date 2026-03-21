import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useModelFamilies() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["model-families", user?.id],
    queryFn: () => apiFetch("/api/ml/model-families", token),
    enabled: !!user,
  })
}

export function useExperiments() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["experiments", user?.id],
    queryFn: () => apiFetch("/api/ml/experiments", token),
    enabled: !!user,
  })
}

export function useTrainingRuns() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["training-runs", user?.id],
    queryFn: () => apiFetch("/api/ml/training-runs", token),
    enabled: !!user,
  })
}

export function useModelVersions() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["model-versions", user?.id],
    queryFn: () => apiFetch("/api/ml/versions", token),
    enabled: !!user,
  })
}

export function useMLDeployments() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["ml-deployments", user?.id],
    queryFn: () => apiFetch("/api/ml/deployments", token),
    enabled: !!user,
  })
}

export function useFeatureProvenance() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["feature-provenance", user?.id],
    queryFn: () => apiFetch("/api/ml/features", token),
    enabled: !!user,
  })
}

export function useDatasets() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["datasets", user?.id],
    queryFn: () => apiFetch("/api/ml/datasets", token),
    enabled: !!user,
  })
}
