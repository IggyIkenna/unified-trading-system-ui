import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

async function fetchWithPersona(url: string, personaId: string) {
  const res = await fetch(url, { headers: { "x-demo-persona": personaId } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function useModelFamilies() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["model-families", personaId],
    queryFn: () => fetchWithPersona("/api/ml/model-families", personaId),
    enabled: !!user,
  })
}

export function useExperiments() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["experiments", personaId],
    queryFn: () => fetchWithPersona("/api/ml/experiments", personaId),
    enabled: !!user,
  })
}

export function useTrainingRuns() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["training-runs", personaId],
    queryFn: () => fetchWithPersona("/api/ml/training-runs", personaId),
    enabled: !!user,
  })
}

export function useModelVersions() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["model-versions", personaId],
    queryFn: () => fetchWithPersona("/api/ml/versions", personaId),
    enabled: !!user,
  })
}

export function useMLDeployments() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["ml-deployments", personaId],
    queryFn: () => fetchWithPersona("/api/ml/deployments", personaId),
    enabled: !!user,
  })
}

export function useFeatureProvenance() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["feature-provenance", personaId],
    queryFn: () => fetchWithPersona("/api/ml/features", personaId),
    enabled: !!user,
  })
}

export function useDatasets() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["datasets", personaId],
    queryFn: () => fetchWithPersona("/api/ml/datasets", personaId),
    enabled: !!user,
  })
}
