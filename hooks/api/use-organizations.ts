import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useOrganizationsList() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["user-organizations", user?.id],
    queryFn: () => apiFetch("/api/users/organizations", token),
    enabled: !!user,
  })
}

export function useOrgMembers(orgId: string) {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["org-members", orgId, user?.id],
    queryFn: () => apiFetch(`/api/users/organizations/${orgId}/members`, token),
    enabled: !!user && !!orgId,
  })
}

export function useSubscriptions() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["user-subscriptions", user?.id],
    queryFn: () => apiFetch("/api/users/subscriptions", token),
    enabled: !!user,
  })
}
