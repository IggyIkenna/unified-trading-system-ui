import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import type { EconomicEvent, CorporateAction, MarketStructureEvent, CalendarHoliday } from "@/lib/types/data-service";

/**
 * Calendar/events hooks — single source for both `/services/data/events` (all-time
 * view) and the terminal `CalendarEventsWidget` (today-only slice).
 *
 * Both surfaces consume the same shape through these hooks. When the live API is
 * ready, flip the mock-handler off; no consumer changes.
 */

export type { EconomicEvent, CorporateAction, MarketStructureEvent, CalendarHoliday } from "@/lib/types/data-service";

interface Envelope<T> {
  data: T[];
}

export function useEconomicEvents() {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: ["calendar-economic-events", user?.id],
    queryFn: () => apiFetch(`/api/calendar/economic-events`, token),
    enabled: !!user,
    refetchInterval: 60_000,
    select: (data: unknown) => (data as Envelope<EconomicEvent>).data ?? [],
  });
}

export function useCorporateActions() {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: ["calendar-corporate-actions", user?.id],
    queryFn: () => apiFetch(`/api/calendar/corporate-actions`, token),
    enabled: !!user,
    refetchInterval: 60_000,
    select: (data: unknown) => (data as Envelope<CorporateAction>).data ?? [],
  });
}

export function useMarketStructureEvents() {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: ["calendar-market-structure", user?.id],
    queryFn: () => apiFetch(`/api/calendar/market-structure`, token),
    enabled: !!user,
    refetchInterval: 60_000,
    select: (data: unknown) => (data as Envelope<MarketStructureEvent>).data ?? [],
  });
}

export function useCalendarHolidays() {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: ["calendar-holidays", user?.id],
    queryFn: () => apiFetch(`/api/calendar/holidays`, token),
    enabled: !!user,
    refetchInterval: 300_000,
    select: (data: unknown) => (data as Envelope<CalendarHoliday>).data ?? [],
  });
}
