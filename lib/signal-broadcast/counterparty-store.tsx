"use client";

/**
 * Mock counterparty store for the admin signals surface.
 *
 * Mirrors the UAC `Counterparty` registry on the Python side
 * (`unified_api_contracts.internal.domain.signal_broadcast.Counterparty`) plus
 * a small amount of UI-only derived state (delivery health, last delivery
 * timestamp) so the admin surface can render without a strategy-service read
 * API.
 *
 * Seed state contains two anonymised counterparty fixtures matching the two
 * Sept-2026 go-live prospects declared in the plan (names stripped per Plan-A
 * M10 anonymisation rule). A third inactive fixture is included to exercise
 * the `active=false` path.
 *
 * SSOT for schema:
 *   unified-api-contracts/unified_api_contracts/internal/domain/signal_broadcast/
 * SSOT for plan:
 *   unified-trading-pm/plans/active/signal_leasing_broadcast_architecture_2026_04_20.md
 */

import type { PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Counterparty, DeliveryHealth } from "./types";

export interface CounterpartyRecord extends Counterparty {
  readonly allowed_slots: readonly string[];
  readonly last_delivery_at: string;
  readonly delivery_health: DeliveryHealth;
  readonly created_at: string;
  readonly updated_at: string;
}

interface EmittedEvent {
  readonly eventName: string;
  readonly details: Readonly<Record<string, unknown>>;
  readonly timestampUtc: string;
}

interface CounterpartyStoreValue {
  readonly counterparties: readonly CounterpartyRecord[];
  readonly events: readonly EmittedEvent[];
  getById(id: string): CounterpartyRecord | undefined;
  toggleEntitlement(input: {
    counterpartyId: string;
    slotLabel: string;
    actorId: string;
    reason: string;
  }): void;
  setActive(input: {
    counterpartyId: string;
    active: boolean;
    actorId: string;
    reason: string;
  }): void;
  reset(): void;
}

const STORAGE_KEY = "counterparty-store/v1";

// Closed vocabulary of slot labels the admin can grant/revoke. Kept small so
// the admin surface's entitlement toggle has a deterministic picker; in prod
// this list is sourced from the strategy-catalogue.
export const COUNTERPARTY_SLOT_VOCABULARY: readonly string[] = [
  "btc_trend_rules_live_cefi-spot-1.0",
  "eth_meanrev_stat_arb_pairs_fixed_cefi-perp-1.0",
  "sp500_mlrules_dated_future-cme-2.0",
  "btc_carry_basis_dated_cefi-perp-1.0",
  "eth_ml_trend_cefi-perp-1.0",
  "sp500_ml_trend_dated_future-cme-2.0",
];

function nowIso(): string {
  return new Date().toISOString();
}

function seedCounterparties(): readonly CounterpartyRecord[] {
  const created = "2026-03-15T10:00:00.000Z";
  const lastDelivery = "2026-04-20T11:57:00.000Z";
  return [
    {
      id: "cp-alpha",
      name: "Counterparty Alpha",
      endpoint: "https://webhook.example-alpha.com/odum/signals",
      schema_depth: "STANDARD",
      active: true,
      allowed_slots: [
        "btc_trend_rules_live_cefi-spot-1.0",
        "eth_meanrev_stat_arb_pairs_fixed_cefi-perp-1.0",
        "sp500_mlrules_dated_future-cme-2.0",
      ],
      rate_limit_per_strategy_per_sec: 10,
      pnl_reporting_enabled: false,
      last_delivery_at: lastDelivery,
      delivery_health: {
        success_rate: 0.987,
        retries_24h: 12,
        avg_latency_ms: 145,
        last_delivery_at: lastDelivery,
        total_deliveries_24h: 247,
      },
      created_at: created,
      updated_at: lastDelivery,
    },
    {
      id: "cp-beta",
      name: "Counterparty Beta",
      endpoint: "https://webhook.example-beta.com/odum/signals",
      schema_depth: "RICH",
      active: true,
      allowed_slots: [
        "btc_carry_basis_dated_cefi-perp-1.0",
        "eth_ml_trend_cefi-perp-1.0",
      ],
      rate_limit_per_strategy_per_sec: 5,
      pnl_reporting_enabled: true,
      last_delivery_at: "2026-04-20T10:42:00.000Z",
      delivery_health: {
        success_rate: 0.953,
        retries_24h: 34,
        avg_latency_ms: 220,
        last_delivery_at: "2026-04-20T10:42:00.000Z",
        total_deliveries_24h: 189,
      },
      created_at: created,
      updated_at: "2026-04-20T10:42:00.000Z",
    },
    {
      id: "cp-gamma",
      name: "Counterparty Gamma",
      endpoint: "https://webhook.example-gamma.com/odum/signals",
      schema_depth: "MINIMAL",
      active: false,
      allowed_slots: [],
      rate_limit_per_strategy_per_sec: 10,
      pnl_reporting_enabled: false,
      last_delivery_at: "2026-02-28T16:12:00.000Z",
      delivery_health: {
        success_rate: 0.0,
        retries_24h: 0,
        avg_latency_ms: 0,
        last_delivery_at: "2026-02-28T16:12:00.000Z",
        total_deliveries_24h: 0,
      },
      created_at: "2026-02-01T09:00:00.000Z",
      updated_at: "2026-02-28T16:12:00.000Z",
    },
  ];
}

const CounterpartyStoreContext = createContext<CounterpartyStoreValue | null>(
  null,
);

export function CounterpartyStoreProvider({
  children,
  persist = true,
  seed = true,
}: PropsWithChildren<{ persist?: boolean; seed?: boolean }>) {
  const [counterparties, setCounterparties] = useState<
    readonly CounterpartyRecord[]
  >(() => (seed ? seedCounterparties() : []));
  const [events, setEvents] = useState<readonly EmittedEvent[]>([]);
  const counterpartiesRef = useRef(counterparties);
  counterpartiesRef.current = counterparties;

  // Hydrate from localStorage on mount.
  useEffect(() => {
    if (!persist || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        counterparties: CounterpartyRecord[];
        events: EmittedEvent[];
      };
      if (Array.isArray(parsed.counterparties)) {
        counterpartiesRef.current = parsed.counterparties;
        setCounterparties(parsed.counterparties);
      }
      if (Array.isArray(parsed.events)) {
        setEvents(parsed.events);
      }
    } catch {
      // ignore malformed localStorage; next write replaces it
    }
  }, [persist]);

  // Persist on change.
  useEffect(() => {
    if (!persist || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ counterparties, events }),
      );
    } catch {
      // quota exhausted — drop silently in dev
    }
  }, [counterparties, events, persist]);

  const recordEvent = useCallback(
    (eventName: string, details: Readonly<Record<string, unknown>>) => {
      setEvents((prior) => [
        ...prior,
        { eventName, details, timestampUtc: nowIso() },
      ]);
    },
    [],
  );

  const getById = useCallback(
    (id: string): CounterpartyRecord | undefined => {
      return counterparties.find((cp) => cp.id === id);
    },
    [counterparties],
  );

  const toggleEntitlement: CounterpartyStoreValue["toggleEntitlement"] =
    useCallback(
      ({ counterpartyId, slotLabel, actorId, reason }) => {
        const current = counterpartiesRef.current.find(
          (cp) => cp.id === counterpartyId,
        );
        if (!current) return;
        const hasSlot = current.allowed_slots.includes(slotLabel);
        const nextSlots = hasSlot
          ? current.allowed_slots.filter((s) => s !== slotLabel)
          : [...current.allowed_slots, slotLabel];
        const updated: CounterpartyRecord = {
          ...current,
          allowed_slots: nextSlots,
          updated_at: nowIso(),
        };
        counterpartiesRef.current = counterpartiesRef.current.map((cp) =>
          cp.id === counterpartyId ? updated : cp,
        );
        setCounterparties(counterpartiesRef.current);
        recordEvent("COUNTERPARTY_ENTITLEMENT_CHANGED", {
          counterpartyId,
          slotLabel,
          action: hasSlot ? "revoked" : "granted",
          actorId,
          reason,
        });
      },
      [recordEvent],
    );

  const setActive: CounterpartyStoreValue["setActive"] = useCallback(
    ({ counterpartyId, active, actorId, reason }) => {
      const current = counterpartiesRef.current.find(
        (cp) => cp.id === counterpartyId,
      );
      if (!current) return;
      if (current.active === active) return;
      const updated: CounterpartyRecord = {
        ...current,
        active,
        updated_at: nowIso(),
      };
      counterpartiesRef.current = counterpartiesRef.current.map((cp) =>
        cp.id === counterpartyId ? updated : cp,
      );
      setCounterparties(counterpartiesRef.current);
      recordEvent("COUNTERPARTY_ACTIVE_CHANGED", {
        counterpartyId,
        active,
        actorId,
        reason,
      });
    },
    [recordEvent],
  );

  const reset = useCallback(() => {
    const seeded = seedCounterparties();
    counterpartiesRef.current = seeded;
    setCounterparties(seeded);
    setEvents([]);
  }, []);

  const value = useMemo<CounterpartyStoreValue>(
    () => ({
      counterparties,
      events,
      getById,
      toggleEntitlement,
      setActive,
      reset,
    }),
    [counterparties, events, getById, toggleEntitlement, setActive, reset],
  );

  return (
    <CounterpartyStoreContext.Provider value={value}>
      {children}
    </CounterpartyStoreContext.Provider>
  );
}

export function useCounterpartyStore(): CounterpartyStoreValue {
  const value = useContext(CounterpartyStoreContext);
  if (value === null) {
    throw new Error(
      "useCounterpartyStore must be used inside <CounterpartyStoreProvider>",
    );
  }
  return value;
}
