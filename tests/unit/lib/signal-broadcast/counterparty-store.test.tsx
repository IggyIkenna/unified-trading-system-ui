import "@testing-library/jest-dom/vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  CounterpartyStoreProvider,
  useCounterpartyStore,
} from "@/lib/signal-broadcast";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <CounterpartyStoreProvider persist={false}>
      {children}
    </CounterpartyStoreProvider>
  );
}

describe("CounterpartyStoreProvider + useCounterpartyStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("throws when used outside the provider", () => {
    expect(() => renderHook(() => useCounterpartyStore())).toThrow(
      /inside <CounterpartyStoreProvider>/,
    );
  });

  it("seeds three counterparty fixtures by default", () => {
    const { result } = renderHook(() => useCounterpartyStore(), { wrapper });
    expect(result.current.counterparties).toHaveLength(3);
    const ids = result.current.counterparties.map((cp) => cp.id);
    expect(ids).toContain("cp-alpha");
    expect(ids).toContain("cp-beta");
    expect(ids).toContain("cp-gamma");
  });

  it("uses anonymised counterparty names (no real prospect names exposed)", () => {
    const { result } = renderHook(() => useCounterpartyStore(), { wrapper });
    for (const cp of result.current.counterparties) {
      expect(cp.name).toMatch(/^Counterparty (Alpha|Beta|Gamma)$/);
    }
  });

  it("toggleEntitlement grants when slot absent + emits synthetic event", () => {
    const { result } = renderHook(() => useCounterpartyStore(), { wrapper });
    const slot = "btc_carry_basis_dated_cefi-perp-1.0";
    const alphaBefore = result.current.getById("cp-alpha");
    expect(alphaBefore?.allowed_slots).not.toContain(slot);

    act(() => {
      result.current.toggleEntitlement({
        counterpartyId: "cp-alpha",
        slotLabel: slot,
        actorId: "admin-1",
        reason: "contract signed",
      });
    });

    const alphaAfter = result.current.getById("cp-alpha");
    expect(alphaAfter?.allowed_slots).toContain(slot);
    const events = result.current.events;
    expect(events.map((e) => e.eventName)).toContain(
      "COUNTERPARTY_ENTITLEMENT_CHANGED",
    );
    const last = events[events.length - 1];
    expect(last.details).toMatchObject({
      counterpartyId: "cp-alpha",
      slotLabel: slot,
      action: "granted",
      actorId: "admin-1",
      reason: "contract signed",
    });
  });

  it("toggleEntitlement revokes when slot already granted", () => {
    const { result } = renderHook(() => useCounterpartyStore(), { wrapper });
    const slot = "btc_trend_rules_live_cefi-spot-1.0";
    // Seeded on cp-alpha already.
    expect(result.current.getById("cp-alpha")?.allowed_slots).toContain(slot);

    act(() => {
      result.current.toggleEntitlement({
        counterpartyId: "cp-alpha",
        slotLabel: slot,
        actorId: "admin-1",
        reason: "contract expired",
      });
    });

    expect(result.current.getById("cp-alpha")?.allowed_slots).not.toContain(
      slot,
    );
    const last = result.current.events[result.current.events.length - 1];
    expect(last.details).toMatchObject({ action: "revoked" });
  });

  it("setActive toggles + emits ACTIVE_CHANGED when value differs", () => {
    const { result } = renderHook(() => useCounterpartyStore(), { wrapper });
    expect(result.current.getById("cp-alpha")?.active).toBe(true);

    act(() => {
      result.current.setActive({
        counterpartyId: "cp-alpha",
        active: false,
        actorId: "admin-1",
        reason: "incident response",
      });
    });

    expect(result.current.getById("cp-alpha")?.active).toBe(false);
    expect(result.current.events.map((e) => e.eventName)).toContain(
      "COUNTERPARTY_ACTIVE_CHANGED",
    );
  });

  it("setActive no-op when value already matches — no event emitted", () => {
    const { result } = renderHook(() => useCounterpartyStore(), { wrapper });
    // cp-alpha starts active=true
    act(() => {
      result.current.setActive({
        counterpartyId: "cp-alpha",
        active: true,
        actorId: "admin-1",
        reason: "noop",
      });
    });
    const activeEvents = result.current.events.filter(
      (e) => e.eventName === "COUNTERPARTY_ACTIVE_CHANGED",
    );
    expect(activeEvents).toHaveLength(0);
  });

  it("toggleEntitlement on unknown counterparty is a safe no-op", () => {
    const { result } = renderHook(() => useCounterpartyStore(), { wrapper });
    act(() => {
      result.current.toggleEntitlement({
        counterpartyId: "cp-nonexistent",
        slotLabel: "foo",
        actorId: "admin-1",
        reason: "noop",
      });
    });
    expect(result.current.events).toHaveLength(0);
  });

  it("reset rehydrates seed state + clears audit log", () => {
    const { result } = renderHook(() => useCounterpartyStore(), { wrapper });
    act(() => {
      result.current.setActive({
        counterpartyId: "cp-alpha",
        active: false,
        actorId: "admin",
        reason: "seed",
      });
      result.current.reset();
    });
    expect(result.current.events).toHaveLength(0);
    expect(result.current.getById("cp-alpha")?.active).toBe(true);
  });

  it("persists writes to localStorage when persist=true", () => {
    function persistedWrapper({ children }: { children: ReactNode }) {
      return (
        <CounterpartyStoreProvider persist={true}>
          {children}
        </CounterpartyStoreProvider>
      );
    }
    const { result } = renderHook(() => useCounterpartyStore(), {
      wrapper: persistedWrapper,
    });
    act(() => {
      result.current.toggleEntitlement({
        counterpartyId: "cp-alpha",
        slotLabel: "sp500_ml_trend_dated_future-cme-2.0",
        actorId: "admin",
        reason: "persist test",
      });
    });
    const raw = window.localStorage.getItem("counterparty-store/v1");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw ?? "{}");
    expect(parsed.events).toBeDefined();
    expect(parsed.counterparties).toBeDefined();
  });
});
