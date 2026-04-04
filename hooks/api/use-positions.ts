import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { typedFetch, type GatewayApiResponse } from "@/lib/api/typed-fetch";

type PositionsResponse = GatewayApiResponse<"/api/positions/active">;
type PositionsSummaryResponse = GatewayApiResponse<"/api/positions/summary">;
type BalancesResponse = GatewayApiResponse<"/api/positions/balances">;

export function usePositions(mode?: string, asOf?: string) {
  const { user, token } = useAuth();
  const params = new URLSearchParams();
  if (mode) params.set("mode", mode);
  if (asOf) params.set("as_of", asOf);
  const qs = params.toString();

  return useQuery<PositionsResponse>({
    queryKey: ["positions", mode, asOf, user?.id],
    queryFn: () =>
      typedFetch<PositionsResponse>(
        `/api/positions/active${qs ? `?${qs}` : ""}`,
        token,
      ),
    enabled: !!user,
  });
}

export function usePositionsSummary() {
  const { user, token } = useAuth();

  return useQuery<PositionsSummaryResponse>({
    queryKey: ["positions-summary", user?.id],
    queryFn: () =>
      typedFetch<PositionsSummaryResponse>("/api/positions/summary", token),
    enabled: !!user,
  });
}

export function useBalances() {
  const { user, token } = useAuth();

  return useQuery<BalancesResponse>({
    queryKey: ["balances", user?.id],
    queryFn: () =>
      typedFetch<BalancesResponse>("/api/positions/balances", token),
    enabled: !!user,
  });
}
