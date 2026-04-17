import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import {
  MOCK_FIXTURES,
  MOCK_STANDINGS,
} from "@/lib/mocks/fixtures/sports-data";
import { FOOTBALL_LEAGUES } from "@/lib/mocks/fixtures/sports-fixtures";
import type { Fixture, Standing } from "@/components/trading/sports/types";

// ── Module-level mock check ──────────────────────────────────────────────────

const isMock = isMockDataMode();

// ── Types ────────────────────────────────────────────────────────────────────

export interface FixturesParams {
  league?: string;
  date?: string;
  status?: string;
}

export interface SportsHistoryParams {
  league?: string;
  from?: string;
  to?: string;
  limit?: number;
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch sports fixtures.
 * Mock mode: returns MOCK_FIXTURES from sports-data.
 * Live mode: GET /api/sports/fixtures from sports API gateway.
 */
export function useFixtures(params?: FixturesParams) {
  const { user, token } = useAuth();

  const qs = new URLSearchParams();
  if (params?.league) qs.set("league", params.league);
  if (params?.date) qs.set("date", params.date);
  if (params?.status) qs.set("status", params.status);
  const query = qs.toString();

  return useQuery<Fixture[]>({
    queryKey: ["sports-fixtures", user?.id, params?.league, params?.date, params?.status],
    queryFn: async () => {
      if (isMock) return MOCK_FIXTURES;
      const result = await apiFetch(
        `/api/sports/fixtures${query ? `?${query}` : ""}`,
        token,
      );
      return result as Fixture[];
    },
    enabled: !!user,
  });
}

/**
 * Fetch available sports leagues.
 * Mock mode: returns FOOTBALL_LEAGUES wrapped in objects.
 * Live mode: GET /api/sports/leagues from sports API gateway.
 */
export function useLeagues() {
  const { user, token } = useAuth();

  return useQuery<string[]>({
    queryKey: ["sports-leagues", user?.id],
    queryFn: async () => {
      if (isMock) return FOOTBALL_LEAGUES;
      const result = await apiFetch("/api/sports/leagues", token);
      return result as string[];
    },
    enabled: !!user,
  });
}

/**
 * Fetch sports betting/match history.
 * Mock mode: returns MOCK_STANDINGS for the first league.
 * Live mode: GET /api/sports/history from sports API gateway.
 */
export function useSportsHistory(params?: SportsHistoryParams) {
  const { user, token } = useAuth();

  const qs = new URLSearchParams();
  if (params?.league) qs.set("league", params.league);
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();

  return useQuery<Standing[]>({
    queryKey: ["sports-history", user?.id, params?.league, params?.from, params?.to, params?.limit],
    queryFn: async () => {
      if (isMock) {
        const league = params?.league ?? "EPL";
        return MOCK_STANDINGS[league] ?? [];
      }
      const result = await apiFetch(
        `/api/sports/history${query ? `?${query}` : ""}`,
        token,
      );
      return result as Standing[];
    },
    enabled: !!user,
  });
}
