import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";

export interface EconomicResultItem {
  id: string;
  event_type: string;
  release_date: string;
  release_time_utc: string;
  actual_value: number | null;
  previous_value: number | null;
  unit: string;
  status: "released" | "upcoming";
}

export interface CorporateActionItem {
  id: string;
  ticker: string;
  event_type: "dividend" | "earnings" | "split";
  event_date: string;
  amount: number | null;
  actual_eps: number | null;
  estimated_eps: number | null;
  status: "confirmed" | "upcoming";
}

export function useEconomicResults(params?: {
  days_back?: number;
  event_types?: string;
}) {
  const { user, token } = useAuth();
  const qs = new URLSearchParams();
  if (params?.days_back) qs.set("days_back", String(params.days_back));
  if (params?.event_types) qs.set("event_types", params.event_types);

  return useQuery({
    queryKey: ["calendar-economic-results", user?.id, params],
    queryFn: () =>
      apiFetch(`/api/calendar/economic-results?${qs.toString()}`, token),
    enabled: !!user,
    refetchInterval: 60_000, // poll every 60 seconds
    select: (data: unknown) => {
      const d = data as { data: EconomicResultItem[] };
      return d.data ?? [];
    },
  });
}

export function useCorporateActions(params?: {
  tickers?: string;
  event_type?: string;
  days_forward?: number;
}) {
  const { user, token } = useAuth();
  const qs = new URLSearchParams();
  if (params?.tickers) qs.set("tickers", params.tickers);
  if (params?.event_type) qs.set("event_type", params.event_type);
  if (params?.days_forward) qs.set("days_forward", String(params.days_forward));

  return useQuery({
    queryKey: ["calendar-corporate-actions", user?.id, params],
    queryFn: () =>
      apiFetch(`/api/calendar/corporate-actions?${qs.toString()}`, token),
    enabled: !!user,
    refetchInterval: 60_000,
    select: (data: unknown) => {
      const d = data as { data: CorporateActionItem[] };
      return d.data ?? [];
    },
  });
}
