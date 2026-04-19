"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PropsWithChildren } from "react";

import type {
  LockState,
  StrategyAvailabilityEntry,
  StrategyMaturity,
} from "./availability";
import { defaultEntry } from "./availability";

/**
 * Client-side availability store + React Context. Mirrors the Python
 * `StrategyAvailabilityStore` in strategy-service: runtime mutable map of
 * slot_label → entry, with admin writers that emit synthetic events.
 *
 * Persists to `localStorage` under `VITE_MOCK_API` so admin toggles survive
 * page reloads during demos. In prod mode this hook will swap in the backend
 * HTTP client (follow-up).
 */

interface EmittedEvent {
  readonly eventName: string;
  readonly details: Readonly<Record<string, unknown>>;
  readonly timestampUtc: string;
}

interface StoreValue {
  readonly entries: Readonly<Record<string, StrategyAvailabilityEntry>>;
  readonly events: readonly EmittedEvent[];
  getEntry(slotLabel: string): StrategyAvailabilityEntry;
  setLockState(input: {
    slotLabel: string;
    newLockState: LockState;
    actorId: string;
    reason: string;
    exclusiveClientId?: string | null;
    reservingBusinessUnitId?: string | null;
    expiresAtUtc?: string | null;
  }): void;
  setMaturity(input: {
    slotLabel: string;
    newMaturity: StrategyMaturity;
    actorId: string;
    reason: string;
  }): void;
  /** Reset to the default state — useful for tests + demo cycles. */
  reset(): void;
}

const STORAGE_KEY = "strategy-availability-store/v1";

function nowIso(): string {
  return new Date().toISOString();
}

function buildEntry(
  prior: StrategyAvailabilityEntry,
  overrides: Partial<StrategyAvailabilityEntry>,
): StrategyAvailabilityEntry {
  const merged = { ...prior, ...overrides };
  // Enforce the model validator: exclusive_client_id / reserving_business_unit_id
  // only valid under their matching lock state.
  return {
    ...merged,
    exclusiveClientId:
      merged.lockState === "CLIENT_EXCLUSIVE" ? merged.exclusiveClientId : null,
    reservingBusinessUnitId:
      merged.lockState === "INVESTMENT_MANAGEMENT_RESERVED"
        ? merged.reservingBusinessUnitId
        : null,
  };
}

const AvailabilityStoreContext = createContext<StoreValue | null>(null);

export function AvailabilityStoreProvider({
  children,
  persist = true,
}: PropsWithChildren<{ persist?: boolean }>) {
  const [entries, setEntries] = useState<
    Readonly<Record<string, StrategyAvailabilityEntry>>
  >({});
  const [events, setEvents] = useState<readonly EmittedEvent[]>([]);
  // Mirror of the latest entries snapshot so writer callbacks can read the
  // up-to-date map synchronously in the same batched event loop. React 18
  // batches `setEntries` calls + may run updaters twice under StrictMode; a
  // closure over `entries` (which would go stale between batched calls) is
  // too fragile for the no-op detection below.
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  // Lazy-load persisted state on mount (client-only).
  useEffect(() => {
    if (!persist || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        entries: Record<string, StrategyAvailabilityEntry>;
        events: EmittedEvent[];
      };
      const loadedEntries = parsed.entries ?? {};
      entriesRef.current = loadedEntries;
      setEntries(loadedEntries);
      setEvents(parsed.events ?? []);
    } catch {
      // ignore bad localstorage; reset on next write
    }
  }, [persist]);

  // Persist writes back.
  useEffect(() => {
    if (!persist || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ entries, events }),
      );
    } catch {
      // quota exhausted — drop silently in dev
    }
  }, [entries, events, persist]);

  const getEntry = useCallback(
    (slotLabel: string): StrategyAvailabilityEntry => {
      return entries[slotLabel] ?? defaultEntry(slotLabel);
    },
    [entries],
  );

  const recordEvent = useCallback(
    (eventName: string, details: Readonly<Record<string, unknown>>) => {
      setEvents((prior) => [
        ...prior,
        { eventName, details, timestampUtc: nowIso() },
      ]);
    },
    [],
  );

  const setLockState: StoreValue["setLockState"] = useCallback(
    ({
      slotLabel,
      newLockState,
      actorId,
      reason,
      exclusiveClientId = null,
      reservingBusinessUnitId = null,
      expiresAtUtc = null,
    }) => {
      const priorEntry =
        entriesRef.current[slotLabel] ?? defaultEntry(slotLabel);
      if (priorEntry.lockState === newLockState) return;
      const updated = buildEntry(priorEntry, {
        lockState: newLockState,
        exclusiveClientId,
        reservingBusinessUnitId,
        reason,
        changedAtUtc: nowIso(),
        expiresAtUtc,
      });
      entriesRef.current = { ...entriesRef.current, [slotLabel]: updated };
      setEntries(entriesRef.current);
      recordEvent("STRATEGY_AVAILABILITY_CHANGED", {
        slotLabel,
        newLockState,
        actorId,
        reason,
      });
      if (newLockState === "PUBLIC") {
        recordEvent("STRATEGY_UNLOCKED", { slotLabel, actorId, reason });
      } else {
        recordEvent("STRATEGY_LOCKED", { slotLabel, newLockState, actorId, reason });
      }
    },
    [recordEvent],
  );

  const setMaturity: StoreValue["setMaturity"] = useCallback(
    ({ slotLabel, newMaturity, actorId, reason }) => {
      const priorEntry =
        entriesRef.current[slotLabel] ?? defaultEntry(slotLabel);
      if (priorEntry.maturity === newMaturity) return;
      const updated = buildEntry(priorEntry, {
        maturity: newMaturity,
        reason,
        changedAtUtc: nowIso(),
      });
      entriesRef.current = { ...entriesRef.current, [slotLabel]: updated };
      setEntries(entriesRef.current);
      recordEvent("STRATEGY_MATURITY_ADVANCED", {
        slotLabel,
        newMaturity,
        actorId,
        reason,
      });
      recordEvent("STRATEGY_AVAILABILITY_CHANGED", {
        slotLabel,
        newMaturity,
        actorId,
        reason,
      });
    },
    [recordEvent],
  );

  const reset = useCallback(() => {
    entriesRef.current = {};
    setEntries({});
    setEvents([]);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({ entries, events, getEntry, setLockState, setMaturity, reset }),
    [entries, events, getEntry, setLockState, setMaturity, reset],
  );

  return (
    <AvailabilityStoreContext.Provider value={value}>
      {children}
    </AvailabilityStoreContext.Provider>
  );
}

export function useAvailabilityStore(): StoreValue {
  const value = useContext(AvailabilityStoreContext);
  if (value === null) {
    throw new Error(
      "useAvailabilityStore must be used inside <AvailabilityStoreProvider>",
    );
  }
  return value;
}

/**
 * Read an entry without subscribing to every write — cheap selector for pages
 * that only render one slot.
 */
export function useAvailabilityEntry(slotLabel: string): StrategyAvailabilityEntry {
  const { getEntry } = useAvailabilityStore();
  return getEntry(slotLabel);
}
