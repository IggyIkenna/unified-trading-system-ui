import { useAuth } from "@/hooks/use-auth";
import { typedFetch, type GatewayApiResponse } from "@/lib/api/typed-fetch";
import {
  STRATEGY_CATALOG,
  type StrategyCatalogEntry,
} from "@/lib/mocks/fixtures/strategy-catalog-data";
import { mergeApiStrategyCatalog, type StrategyCatalogEnvelope } from "@/lib/strategy-catalog/merge-api-catalog";
import { getStrategyCatalogSource } from "@/lib/strategy-catalog/source";
import { useQuery } from "@tanstack/react-query";

export interface StrategyCatalogQueryResult {
  entries: StrategyCatalogEntry[];
  source: "mock" | "api";
  degraded?: boolean;
}

export function useStrategyCatalog() {
  const { user, token } = useAuth();
  const source = getStrategyCatalogSource();

  return useQuery<StrategyCatalogQueryResult>({
    queryKey: ["strategy-catalog", source, user?.id],
    queryFn: async () => {
      if (source === "mock") {
        return { entries: STRATEGY_CATALOG, source: "mock" };
      }
      try {
        const body = await typedFetch<GatewayApiResponse<"/api/analytics/strategies/catalog">>(
          "/api/analytics/strategies/catalog",
          token,
        );
        const entries = mergeApiStrategyCatalog(body as unknown as StrategyCatalogEnvelope);
        return { entries, source: "api" };
      } catch {
        const allowFallback = process.env.NEXT_PUBLIC_STRATEGY_CATALOG_API_ERROR_FALLBACK !== "false";
        if (allowFallback) {
          return { entries: STRATEGY_CATALOG, source: "mock", degraded: true };
        }
        throw new Error("Strategy catalogue API unavailable");
      }
    },
    enabled: source === "mock" ? true : Boolean(user),
    staleTime: 60_000,
  });
}
