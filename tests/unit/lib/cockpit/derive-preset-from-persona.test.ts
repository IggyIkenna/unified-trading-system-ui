import { describe, expect, it } from "vitest";

import { recommendPresetForPersona } from "@/lib/cockpit/derive-preset-from-persona";

describe("recommendPresetForPersona — persona-id overrides win first", () => {
  it("admin persona → executive-overview", () => {
    expect(recommendPresetForPersona({ id: "admin" }).presetId).toBe("executive-overview");
  });

  it("internal-trader → live-trading-desk", () => {
    expect(recommendPresetForPersona({ id: "internal-trader" }).presetId).toBe("live-trading-desk");
  });

  it("client-full → research-to-live-pipeline", () => {
    expect(recommendPresetForPersona({ id: "client-full" }).presetId).toBe("research-to-live-pipeline");
  });

  it("prospect-dart (sarah.quant) → research-to-live-pipeline", () => {
    expect(recommendPresetForPersona({ id: "prospect-dart" }).presetId).toBe("research-to-live-pipeline");
  });

  it("client-data-only → executive-overview", () => {
    expect(recommendPresetForPersona({ id: "client-data-only" }).presetId).toBe("executive-overview");
  });

  it("prospect-signals-only → signals-in-monitor", () => {
    expect(recommendPresetForPersona({ id: "prospect-signals-only" }).presetId).toBe("signals-in-monitor");
  });

  it("prospect-regulatory → executive-overview", () => {
    expect(recommendPresetForPersona({ id: "prospect-regulatory" }).presetId).toBe("executive-overview");
  });
});

describe("recommendPresetForPersona — role band fallback", () => {
  it("admin role w/o persona-id override → live-trading-desk", () => {
    expect(recommendPresetForPersona({ role: "admin" }).presetId).toBe("live-trading-desk");
  });

  it("internal role w/o persona-id override → live-trading-desk", () => {
    expect(recommendPresetForPersona({ role: "internal" }).presetId).toBe("live-trading-desk");
  });
});

describe("recommendPresetForPersona — entitlement-derived", () => {
  it("DART-Full entitlements (strategy-full + ml-full) → research-to-live-pipeline", () => {
    expect(
      recommendPresetForPersona({
        role: "client",
        entitlements: ["strategy-full", "ml-full"],
      }).presetId,
    ).toBe("research-to-live-pipeline");
  });

  it("DeFi-only domain → defi-yield-risk", () => {
    expect(
      recommendPresetForPersona({
        role: "client",
        entitlements: [{ domain: "trading-defi", tier: "basic" }],
      }).presetId,
    ).toBe("defi-yield-risk");
  });

  it("options domain → volatility-research-lab", () => {
    expect(
      recommendPresetForPersona({
        role: "client",
        entitlements: [{ domain: "trading-options", tier: "basic" }],
      }).presetId,
    ).toBe("volatility-research-lab");
  });

  it("sports domain → sports-prediction-desk", () => {
    expect(
      recommendPresetForPersona({
        role: "client",
        entitlements: [{ domain: "trading-sports", tier: "basic" }],
      }).presetId,
    ).toBe("sports-prediction-desk");
  });

  it("signals-in entitlement → signals-in-monitor", () => {
    expect(
      recommendPresetForPersona({
        role: "client",
        entitlements: ["signals-in"],
      }).presetId,
    ).toBe("signals-in-monitor");
  });

  it("reporting-only → executive-overview", () => {
    expect(
      recommendPresetForPersona({
        role: "client",
        entitlements: ["reporting"],
      }).presetId,
    ).toBe("executive-overview");
  });
});

describe("recommendPresetForPersona — fallback", () => {
  it("unknown persona with no entitlements → live-trading-desk default", () => {
    expect(recommendPresetForPersona({}).presetId).toBe("live-trading-desk");
  });
});
