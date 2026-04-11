import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";

export function useDeploymentServices() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["deployment-services", user?.id],
    queryFn: () => apiFetch("/api/services", token),
    enabled: !!user,
  });
}

export function useDeployments() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["deployments", user?.id],
    queryFn: () => apiFetch("/api/deployments", token),
    enabled: !!user,
  });
}

export function useBuildTriggers() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["build-triggers", user?.id],
    queryFn: () => apiFetch("/api/cloud-builds/triggers", token),
    enabled: !!user,
  });
}
