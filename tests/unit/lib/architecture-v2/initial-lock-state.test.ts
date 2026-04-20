import { describe, expect, it } from "vitest";

import {
  buildInitialRegistry,
  slotLabelFor,
  PUBLIC_CELL_LABELS,
  IM_LIVE_CELL_LABELS,
} from "@/lib/architecture-v2/initial-lock-state";
import { slotsVisibleTo } from "@/lib/architecture-v2/availability";

describe("initial-lock-state (2026-04-20 snapshot)", () => {
  const registry = buildInitialRegistry();

  it("emits a non-empty registry", () => {
    expect(registry.length).toBeGreaterThan(0);
  });

  it("marks STAT_ARB_PAIRS_FIXED × CEFI × spot as PUBLIC (crypto mean-rev)", () => {
    const label = slotLabelFor("STAT_ARB_PAIRS_FIXED", "CEFI", "spot");
    const entry = registry.find((e) => e.slotLabel === label);
    expect(entry?.lockState).toBe("PUBLIC");
    expect(entry?.reason).toMatch(/PUBLIC/);
  });

  it("marks STAT_ARB_PAIRS_FIXED × CEFI × perp as PUBLIC", () => {
    const label = slotLabelFor("STAT_ARB_PAIRS_FIXED", "CEFI", "perp");
    const entry = registry.find((e) => e.slotLabel === label);
    expect(entry?.lockState).toBe("PUBLIC");
  });

  it("marks BTC ML directional cells (CEFI × spot + perp) as IM_RESERVED", () => {
    for (const instrumentType of ["spot", "perp"] as const) {
      const label = slotLabelFor(
        "ML_DIRECTIONAL_CONTINUOUS",
        "CEFI",
        instrumentType,
      );
      const entry = registry.find((e) => e.slotLabel === label);
      expect(entry?.lockState).toBe("INVESTMENT_MANAGEMENT_RESERVED");
      expect(entry?.reservingBusinessUnitId).toBe("odum-im");
    }
  });

  it("marks CME S&P ML directional as IM_RESERVED at PAPER_TRADING_VALIDATED maturity", () => {
    const label = slotLabelFor(
      "ML_DIRECTIONAL_CONTINUOUS",
      "TRADFI",
      "dated_future",
    );
    const entry = registry.find((e) => e.slotLabel === label);
    expect(entry?.lockState).toBe("INVESTMENT_MANAGEMENT_RESERVED");
    expect(entry?.maturity).toBe("PAPER_TRADING_VALIDATED");
    expect(entry?.reason).toMatch(/CME/);
  });

  it("marks India Options (NSE) as IM_RESERVED", () => {
    const label = slotLabelFor("VOL_TRADING_OPTIONS", "TRADFI", "option");
    const entry = registry.find((e) => e.slotLabel === label);
    expect(entry?.lockState).toBe("INVESTMENT_MANAGEMENT_RESERVED");
    expect(entry?.reason).toMatch(/India Options/);
  });

  it("marks Sports ML as IM_RESERVED", () => {
    const label = slotLabelFor(
      "ML_DIRECTIONAL_EVENT_SETTLED",
      "SPORTS",
      "event_settled",
    );
    const entry = registry.find((e) => e.slotLabel === label);
    expect(entry?.lockState).toBe("INVESTMENT_MANAGEMENT_RESERVED");
    expect(entry?.reason).toMatch(/Sports ML/);
  });

  it("marks CARRY_BASIS_PERP (Elysium's cell) as IM_RESERVED despite Elysium running it", () => {
    const label = slotLabelFor("CARRY_BASIS_PERP", "DEFI", "perp");
    const entry = registry.find((e) => e.slotLabel === label);
    // Elysium gets per-client override at the entitlement layer — the cell
    // itself stays IM_RESERVED for all other prospects.
    expect(entry?.lockState).toBe("INVESTMENT_MANAGEMENT_RESERVED");
  });

  it("exports PUBLIC_CELL_LABELS and IM_LIVE_CELL_LABELS for external use", () => {
    expect(PUBLIC_CELL_LABELS.size).toBe(2);
    expect(IM_LIVE_CELL_LABELS.size).toBe(5);
  });
});

describe("audience filter end-to-end with seed registry", () => {
  const registry = buildInitialRegistry();

  it("trading_platform_subscriber sees PUBLIC cells only (hides IM_RESERVED)", () => {
    const visible = slotsVisibleTo("trading_platform_subscriber", {
      registry,
    });
    // PUBLIC cells should be visible
    expect(visible).toContain(slotLabelFor("STAT_ARB_PAIRS_FIXED", "CEFI", "spot"));
    expect(visible).toContain(slotLabelFor("STAT_ARB_PAIRS_FIXED", "CEFI", "perp"));
    // IM_RESERVED cells should NOT be visible
    expect(visible).not.toContain(
      slotLabelFor("ML_DIRECTIONAL_CONTINUOUS", "CEFI", "spot"),
    );
    expect(visible).not.toContain(
      slotLabelFor("ML_DIRECTIONAL_CONTINUOUS", "TRADFI", "dated_future"),
    );
    expect(visible).not.toContain(
      slotLabelFor("VOL_TRADING_OPTIONS", "TRADFI", "option"),
    );
    expect(visible).not.toContain(
      slotLabelFor("ML_DIRECTIONAL_EVENT_SETTLED", "SPORTS", "event_settled"),
    );
  });

  it("im_client sees PUBLIC only per current filter semantic", () => {
    // Current filter logic hides IM_RESERVED from im_client. This is the
    // existing code contract (pre-2026-04-20). If IM demo audience needs
    // IM_RESERVED visibility, handle via entitlement-layer filter separately.
    const visible = slotsVisibleTo("im_client", { registry, clientId: "acme" });
    expect(visible).toContain(slotLabelFor("STAT_ARB_PAIRS_FIXED", "CEFI", "spot"));
    expect(visible).not.toContain(
      slotLabelFor("ML_DIRECTIONAL_CONTINUOUS", "CEFI", "spot"),
    );
  });

  it("admin sees everything including IM_RESERVED", () => {
    const visible = slotsVisibleTo("admin", { registry });
    expect(visible).toContain(slotLabelFor("STAT_ARB_PAIRS_FIXED", "CEFI", "spot"));
    expect(visible).toContain(
      slotLabelFor("ML_DIRECTIONAL_CONTINUOUS", "CEFI", "spot"),
    );
    expect(visible).toContain(
      slotLabelFor("VOL_TRADING_OPTIONS", "TRADFI", "option"),
    );
  });

  it("im_desk sees full catalogue >= CODE_AUDITED (IM_RESERVED visible)", () => {
    const visible = slotsVisibleTo("im_desk", { registry });
    expect(visible).toContain(
      slotLabelFor("ML_DIRECTIONAL_CONTINUOUS", "CEFI", "spot"),
    );
    expect(visible).toContain(
      slotLabelFor("VOL_TRADING_OPTIONS", "TRADFI", "option"),
    );
  });
});
