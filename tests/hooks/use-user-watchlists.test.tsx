/**
 * useUserWatchlists — CRUD against localStorage.
 *
 * Plan: unified-trading-pm/plans/ai/watchlist_from_instruments_2026_04_29.plan.md Unit E
 *
 * Storage layer validation:
 *   - schema-version key (`user-watchlists:v1:{userId}`) so future bumps
 *     evict cleanly.
 *   - 50-symbol cap per list — addSymbol throws when exceeded.
 *   - Cross-tab sync via the `storage` event.
 *   - AuthContext-missing fallback (defaults to "anonymous" userId).
 *
 * No QueryClient / network — pure state hook against window.localStorage.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useUserWatchlists } from "@/hooks/use-user-watchlists";

const STORAGE_KEY_PREFIX = "user-watchlists:v1:";
const ANON_KEY = `${STORAGE_KEY_PREFIX}anonymous`;

function clearWatchlistStorage() {
  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith("user-watchlists:")) window.localStorage.removeItem(k);
  }
}

beforeEach(() => {
  clearWatchlistStorage();
});

afterEach(() => {
  clearWatchlistStorage();
});

describe("useUserWatchlists — CRUD", () => {
  it("starts with no lists for a fresh user", () => {
    const { result } = renderHook(() => useUserWatchlists());
    expect(result.current.lists).toEqual([]);
  });

  it("create() persists a new list and returns its id", () => {
    const { result } = renderHook(() => useUserWatchlists());
    let id: string = "";
    act(() => {
      id = result.current.create("My List");
    });
    expect(id).toBeTruthy();
    expect(result.current.lists.length).toBe(1);
    expect(result.current.lists[0].label).toBe("My List");
    expect(result.current.lists[0].instrument_keys).toEqual([]);
    // Persisted under the versioned key
    expect(window.localStorage.getItem(ANON_KEY)).toBeTruthy();
  });

  it("trims labels and caps at 30 chars", () => {
    const { result } = renderHook(() => useUserWatchlists());
    act(() => {
      result.current.create("   " + "x".repeat(40) + "   ");
    });
    expect(result.current.lists[0].label).toBe("x".repeat(30));
  });

  it("rename() updates label", () => {
    const { result } = renderHook(() => useUserWatchlists());
    let id: string = "";
    act(() => {
      id = result.current.create("First");
    });
    act(() => {
      result.current.rename(id, "Renamed");
    });
    expect(result.current.lists[0].label).toBe("Renamed");
  });

  it("remove() deletes a list", () => {
    const { result } = renderHook(() => useUserWatchlists());
    let id: string = "";
    act(() => {
      id = result.current.create("Doomed");
    });
    expect(result.current.lists.length).toBe(1);
    act(() => {
      result.current.remove(id);
    });
    expect(result.current.lists).toEqual([]);
  });

  it("addSymbol() and removeSymbol() round-trip", () => {
    const { result } = renderHook(() => useUserWatchlists());
    let id: string = "";
    act(() => {
      id = result.current.create("Picks");
    });
    act(() => {
      result.current.addSymbol(id, "NASDAQ:SPOT_PAIR:AAPL");
    });
    expect(result.current.lists[0].instrument_keys).toEqual(["NASDAQ:SPOT_PAIR:AAPL"]);
    act(() => {
      result.current.removeSymbol(id, "NASDAQ:SPOT_PAIR:AAPL");
    });
    expect(result.current.lists[0].instrument_keys).toEqual([]);
  });

  it("addSymbol() dedupes — adding the same key twice is a no-op", () => {
    const { result } = renderHook(() => useUserWatchlists());
    let id: string = "";
    act(() => {
      id = result.current.create("Picks");
    });
    act(() => {
      result.current.addSymbol(id, "NASDAQ:SPOT_PAIR:AAPL");
      result.current.addSymbol(id, "NASDAQ:SPOT_PAIR:AAPL");
    });
    expect(result.current.lists[0].instrument_keys).toHaveLength(1);
  });

  it("addSymbol() throws when at the 50-cap", () => {
    const { result } = renderHook(() => useUserWatchlists());
    let id: string = "";
    act(() => {
      id = result.current.create("Full");
    });
    // Each addSymbol needs its own act() so React state flushes between
    // calls — the hook closes over the previous `lists` snapshot, so
    // batching all 50 in one act() leaves them all stomping on the
    // empty initial state. One-per-act mirrors how a real UI uses this.
    for (let i = 0; i < 50; i++) {
      act(() => {
        result.current.addSymbol(id, `NASDAQ:SPOT_PAIR:SYM${i}`);
      });
    }
    expect(result.current.lists[0].instrument_keys).toHaveLength(50);
    // 51st throws.
    expect(() => result.current.addSymbol(id, "NASDAQ:SPOT_PAIR:OVERFLOW")).toThrow(/full/i);
  });

  it("exposes maxSymbolsPerList = 50", () => {
    const { result } = renderHook(() => useUserWatchlists());
    expect(result.current.maxSymbolsPerList).toBe(50);
  });
});

describe("useUserWatchlists — persistence", () => {
  it("hydrates from existing localStorage on mount", () => {
    const seed = JSON.stringify([
      {
        id: "abc",
        label: "Pre-seeded",
        type: "user",
        instrument_keys: ["NASDAQ:SPOT_PAIR:AAPL"],
        created_at: "2026-04-30T00:00:00Z",
        updated_at: "2026-04-30T00:00:00Z",
      },
    ]);
    window.localStorage.setItem(ANON_KEY, seed);
    const { result } = renderHook(() => useUserWatchlists());
    expect(result.current.lists).toHaveLength(1);
    expect(result.current.lists[0].label).toBe("Pre-seeded");
  });

  it("ignores malformed localStorage entries gracefully", () => {
    window.localStorage.setItem(ANON_KEY, "{not json");
    const { result } = renderHook(() => useUserWatchlists());
    expect(result.current.lists).toEqual([]);
  });

  it("filters out entries that don't match the UserWatchlist shape", () => {
    // Mixed: one valid, one missing required fields.
    const seed = JSON.stringify([
      { id: "a", label: "ok", type: "user", instrument_keys: [], created_at: "", updated_at: "" },
      { id: "b" }, // bad — missing fields
      "string-junk", // also bad
    ]);
    window.localStorage.setItem(ANON_KEY, seed);
    const { result } = renderHook(() => useUserWatchlists());
    expect(result.current.lists).toHaveLength(1);
    expect(result.current.lists[0].id).toBe("a");
  });

  it("auto-evicts pre-version entries on next write", () => {
    // Legacy non-versioned entry from an older release
    window.localStorage.setItem("user-watchlists:anonymous", "[]");
    const { result } = renderHook(() => useUserWatchlists());
    act(() => {
      result.current.create("Triggers a write");
    });
    expect(window.localStorage.getItem("user-watchlists:anonymous")).toBeNull();
    expect(window.localStorage.getItem(ANON_KEY)).toBeTruthy();
  });
});

describe("useUserWatchlists — cross-tab sync", () => {
  it("re-reads localStorage when a `storage` event fires for the user's key", () => {
    const { result } = renderHook(() => useUserWatchlists());
    expect(result.current.lists).toEqual([]);

    // Another tab writes new data
    const seed = JSON.stringify([
      {
        id: "x",
        label: "From other tab",
        type: "user",
        instrument_keys: [],
        created_at: "2026-04-30T00:00:00Z",
        updated_at: "2026-04-30T00:00:00Z",
      },
    ]);
    act(() => {
      window.localStorage.setItem(ANON_KEY, seed);
      // Simulate the cross-tab event (jsdom doesn't fire storage events
      // for same-window writes).
      window.dispatchEvent(
        new StorageEvent("storage", { key: ANON_KEY, newValue: seed, storageArea: window.localStorage }),
      );
    });
    expect(result.current.lists).toHaveLength(1);
    expect(result.current.lists[0].label).toBe("From other tab");
  });

  it("ignores `storage` events for other keys", () => {
    const { result } = renderHook(() => useUserWatchlists());
    act(() => {
      result.current.create("Mine");
    });
    expect(result.current.lists).toHaveLength(1);

    // Some unrelated localStorage change shouldn't touch our state.
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "some-other-app-state", newValue: "x" }));
    });
    expect(result.current.lists).toHaveLength(1);
  });
});
