import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useOrders() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["orders", user?.id],
    queryFn: () => apiFetch("/api/execution/orders", token),
    enabled: !!user,
  })
}

export function useAlgos() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["algos", user?.id],
    queryFn: () => apiFetch("/api/execution/algos", token),
    enabled: !!user,
  })
}

export function useVenues() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["execution-venues", user?.id],
    queryFn: () => apiFetch("/api/execution/venues", token),
    enabled: !!user,
  })
}

export function useAlgoBacktests() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["algo-backtests", user?.id],
    queryFn: () => apiFetch("/api/execution/algo-backtests", token),
    enabled: !!user,
  })
}
