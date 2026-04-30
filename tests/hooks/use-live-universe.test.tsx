/**
 * useLiveUniverse — versioned localStorage cache + React Query.
 *
 * Plan: unified-trading-pm/plans/ai/watchlist_from_instruments_2026_04_29.plan.md Unit E
 *
 * Storage validation:
 *   - Cache key includes schema version (`live-universe:v2:{group}:{date}`)
 *     so a future bump auto-evicts pre-bump entries.
 *   - Two-pass eviction sweep on write: drop wrong-version entries (any
 *     group/date), then same-version entries from prior dates.
 *   - 1h TTL — within window, second renderHook hits cache without a fetch.
 *
 * Network: fetch is mocked. No real backend calls.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { useLiveUniverse } from "@/hooks/api/use-instruments";

const TODAY = new Date().toISOString().slice(0, 10);
const YESTERDAY = (() => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
})();

function clearLiveUniverseStorage() {
  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith("live-universe:")) window.localStorage.removeItem(k);
  }
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { Wrapper, queryClient };
}

// Stub useAuth to return a logged-in user so the hook's `enabled` gate
// doesn't block the query. The real auth provider isn't mounted in this
// test harness.
vi.mock("@/hooks/use-auth", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/hooks/use-auth");
  return {
    ...actual,
    useAuth: () => ({
      user: { id: "test-user", email: "test@example.com" },
      token: "fake-token",
    }),
  };
});

const TINY_PAYLOAD = {
  data: [
    {
      instrument_key: "BINANCE-FUTURES:PERPETUAL:BTC-USDT",
      venue: "BINANCE-FUTURES",
      raw_symbol: "BTCUSDT",
      instrument_type: "PERPETUAL",
    },
  ],
  asset_group: "cefi",
  total: 1,
  as_of: TODAY,
};

beforeEach(() => {
  clearLiveUniverseStorage();
});

afterEach(() => {
  clearLiveUniverseStorage();
  vi.restoreAllMocks();
});

describe("useLiveUniverse — fetch + cache", () => {
  it("fetches the asset_group on first mount and writes localStorage with versioned key", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(TINY_PAYLOAD), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useLiveUniverse("cefi"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toContain("/api/instruments/live-universe?asset_group=cefi");
    // localStorage write under the versioned key
    const expectedKey = `live-universe:v2:cefi:${TODAY}`;
    const stored = window.localStorage.getItem(expectedKey);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.payload).toMatchObject(TINY_PAYLOAD);
  });

  it("hydrates from localStorage on mount without fetching when entry is fresh", async () => {
    // Pre-seed the cache for today
    const expectedKey = `live-universe:v2:cefi:${TODAY}`;
    window.localStorage.setItem(
      expectedKey,
      JSON.stringify({
        fetchedAt: Date.now(),
        asOfDate: TODAY,
        payload: TINY_PAYLOAD,
      }),
    );
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useLiveUniverse("cefi"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toMatchObject(TINY_PAYLOAD);
    // No network call — cache served it
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useLiveUniverse — version-bump eviction", () => {
  it("a fresh write evicts pre-version (no `v` prefix) entries from any group/date", async () => {
    // Seed legacy entries that pre-date versioning
    window.localStorage.setItem("live-universe:cefi:2026-04-29", JSON.stringify({ legacy: true }));
    window.localStorage.setItem("live-universe:tradfi:2026-04-30", JSON.stringify({ legacy: true }));
    // Seed an older-version entry
    window.localStorage.setItem(`live-universe:v1:cefi:${TODAY}`, JSON.stringify({ legacy: true }));

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(TINY_PAYLOAD), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useLiveUniverse("cefi"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(fetchSpy).toHaveBeenCalled();

    // All legacy entries gone
    expect(window.localStorage.getItem("live-universe:cefi:2026-04-29")).toBeNull();
    expect(window.localStorage.getItem("live-universe:tradfi:2026-04-30")).toBeNull();
    expect(window.localStorage.getItem(`live-universe:v1:cefi:${TODAY}`)).toBeNull();
    // Current-version entry exists
    expect(window.localStorage.getItem(`live-universe:v2:cefi:${TODAY}`)).toBeTruthy();
  });

  it("a fresh write evicts same-version entries from prior dates for THIS asset_group", async () => {
    // Yesterday's v2 entry for cefi
    window.localStorage.setItem(
      `live-universe:v2:cefi:${YESTERDAY}`,
      JSON.stringify({ fetchedAt: 0, asOfDate: YESTERDAY, payload: { stale: true } }),
    );
    // Today's v2 entry for tradfi (other group — should NOT be evicted)
    window.localStorage.setItem(
      `live-universe:v2:tradfi:${TODAY}`,
      JSON.stringify({ fetchedAt: Date.now(), asOfDate: TODAY, payload: { ok: true } }),
    );

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(TINY_PAYLOAD), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useLiveUniverse("cefi"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());

    // cefi yesterday's entry: gone
    expect(window.localStorage.getItem(`live-universe:v2:cefi:${YESTERDAY}`)).toBeNull();
    // tradfi today's entry: untouched (different group)
    expect(window.localStorage.getItem(`live-universe:v2:tradfi:${TODAY}`)).toBeTruthy();
    // cefi today's entry: written
    expect(window.localStorage.getItem(`live-universe:v2:cefi:${TODAY}`)).toBeTruthy();
  });
});
