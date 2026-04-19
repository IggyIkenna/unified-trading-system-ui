import "@testing-library/jest-dom/vitest";
import { act, render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  AvailabilityStoreProvider,
  useAvailabilityStore,
} from "@/lib/architecture-v2";

function wrapper({ children }: { children: ReactNode }) {
  return <AvailabilityStoreProvider persist={false}>{children}</AvailabilityStoreProvider>;
}

describe("AvailabilityStoreProvider + useAvailabilityStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("throws when used outside the provider", () => {
    expect(() => renderHook(() => useAvailabilityStore())).toThrow(
      /inside <AvailabilityStoreProvider>/,
    );
  });

  it("returns the default entry for an unknown slot", () => {
    const { result } = renderHook(() => useAvailabilityStore(), { wrapper });
    const entry = result.current.getEntry("SLOT_UNKNOWN");
    expect(entry.lockState).toBe("PUBLIC");
    expect(entry.maturity).toBe("LIVE_ALLOCATED");
  });

  it("setLockState updates the store and emits umbrella + LOCKED events", () => {
    const { result } = renderHook(() => useAvailabilityStore(), { wrapper });
    act(() => {
      result.current.setLockState({
        slotLabel: "SLOT_A",
        newLockState: "INVESTMENT_MANAGEMENT_RESERVED",
        actorId: "admin-1",
        reason: "fund-alpha adopted",
        reservingBusinessUnitId: "fund-alpha",
      });
    });
    expect(result.current.getEntry("SLOT_A").lockState).toBe(
      "INVESTMENT_MANAGEMENT_RESERVED",
    );
    const names = result.current.events.map((e) => e.eventName);
    expect(names).toContain("STRATEGY_AVAILABILITY_CHANGED");
    expect(names).toContain("STRATEGY_LOCKED");
    expect(names).not.toContain("STRATEGY_UNLOCKED");
  });

  it("setLockState back to PUBLIC emits UNLOCKED", () => {
    const { result } = renderHook(() => useAvailabilityStore(), { wrapper });
    act(() => {
      result.current.setLockState({
        slotLabel: "SLOT_A",
        newLockState: "CLIENT_EXCLUSIVE",
        actorId: "admin-1",
        reason: "lock",
        exclusiveClientId: "client-a",
      });
      result.current.setLockState({
        slotLabel: "SLOT_A",
        newLockState: "PUBLIC",
        actorId: "admin-1",
        reason: "contract ended",
      });
    });
    const names = result.current.events.map((e) => e.eventName);
    expect(names).toContain("STRATEGY_UNLOCKED");
    const entry = result.current.getEntry("SLOT_A");
    expect(entry.lockState).toBe("PUBLIC");
    expect(entry.exclusiveClientId).toBeNull();
  });

  it("setMaturity emits ADVANCED + umbrella", () => {
    const { result } = renderHook(() => useAvailabilityStore(), { wrapper });
    act(() => {
      result.current.setMaturity({
        slotLabel: "SLOT_A",
        newMaturity: "PAPER_TRADING_VALIDATED",
        actorId: "watchdog",
        reason: "14d PROMOTE",
      });
    });
    const names = result.current.events.map((e) => e.eventName);
    expect(names).toContain("STRATEGY_MATURITY_ADVANCED");
    expect(names).toContain("STRATEGY_AVAILABILITY_CHANGED");
    expect(result.current.getEntry("SLOT_A").maturity).toBe(
      "PAPER_TRADING_VALIDATED",
    );
  });

  it("setLockState no-op when unchanged does not emit events", () => {
    const { result } = renderHook(() => useAvailabilityStore(), { wrapper });
    act(() => {
      result.current.setLockState({
        slotLabel: "SLOT_A",
        newLockState: "PUBLIC", // same as default
        actorId: "admin",
        reason: "noop",
      });
    });
    // Store was already PUBLIC by default — transition should be skipped.
    // (The emitter only fires when the lock actually changes.)
    const availabilityEvents = result.current.events.filter(
      (e) => e.eventName === "STRATEGY_AVAILABILITY_CHANGED",
    );
    expect(availabilityEvents).toHaveLength(0);
  });

  it("reset clears entries + events", () => {
    const { result } = renderHook(() => useAvailabilityStore(), { wrapper });
    act(() => {
      result.current.setMaturity({
        slotLabel: "SLOT_A",
        newMaturity: "PAPER_TRADING",
        actorId: "admin",
        reason: "seed",
      });
      result.current.reset();
    });
    expect(Object.keys(result.current.entries)).toHaveLength(0);
    expect(result.current.events).toHaveLength(0);
  });

  it("provider mounts without error", () => {
    expect(() =>
      render(
        <AvailabilityStoreProvider persist={false}>
          <div>child</div>
        </AvailabilityStoreProvider>,
      ),
    ).not.toThrow();
  });
});
