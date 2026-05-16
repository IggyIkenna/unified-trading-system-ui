import { describe, expect, it } from "vitest";

import {
  COCKPIT_PRESETS,
  COCKPIT_PRESET_IDS,
  applyPresetToScope,
  getPreset,
  resolveStaticArchetypes,
} from "@/lib/cockpit/presets";
import { EMPTY_WORKSPACE_SCOPE } from "@/lib/architecture-v2/workspace-scope";

describe("COCKPIT_PRESETS — 8 starter cockpits per §8", () => {
  it("ships exactly 8 presets", () => {
    expect(COCKPIT_PRESETS).toHaveLength(8);
  });

  it("includes the 8 named presets", () => {
    expect(COCKPIT_PRESET_IDS).toEqual(
      expect.arrayContaining([
        "executive-overview",
        "live-trading-desk",
        "arbitrage-command",
        "defi-yield-risk",
        "volatility-research-lab",
        "sports-prediction-desk",
        "signals-in-monitor",
        "research-to-live-pipeline",
      ]),
    );
  });

  it("every preset has label / description / surface / engagement / stream", () => {
    for (const p of COCKPIT_PRESETS) {
      expect(p.label).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.defaultSurface).toBeTruthy();
      expect(p.defaultEngagement).toMatch(/^(monitor|replicate)$/);
      expect(p.defaultExecutionStream).toMatch(/^(paper|live)$/);
    }
  });

  it("replicate-default presets always default to paper stream (§4.3 safety)", () => {
    for (const p of COCKPIT_PRESETS) {
      if (p.defaultEngagement === "replicate") {
        expect(p.defaultExecutionStream).toBe("paper");
      }
    }
  });

  it("monitor-only presets list only monitor in supportsEngagement", () => {
    expect(getPreset("executive-overview")?.supportsEngagement).toEqual(["monitor"]);
    expect(getPreset("signals-in-monitor")?.supportsEngagement).toEqual(["monitor"]);
  });

  it("six presets support both monitor + replicate", () => {
    const dual = COCKPIT_PRESETS.filter((p) => p.supportsEngagement.length === 2);
    expect(dual).toHaveLength(6);
  });

  it("strategy-backed presets carry an explicit archetype binding", () => {
    expect(getPreset("arbitrage-command")?.archetypeBinding.kind).toBe("explicit");
    expect(getPreset("defi-yield-risk")?.archetypeBinding.kind).toBe("explicit");
    expect(getPreset("volatility-research-lab")?.archetypeBinding.kind).toBe("explicit");
    expect(getPreset("sports-prediction-desk")?.archetypeBinding.kind).toBe("explicit");
  });

  it("demo-only / service-backed presets use a resolver binding", () => {
    expect(getPreset("executive-overview")?.archetypeBinding.kind).toBe("resolver");
    expect(getPreset("live-trading-desk")?.archetypeBinding.kind).toBe("resolver");
    expect(getPreset("signals-in-monitor")?.archetypeBinding.kind).toBe("resolver");
    expect(getPreset("research-to-live-pipeline")?.archetypeBinding.kind).toBe("resolver");
  });

  it("Volatility Research Lab pins v1 venues to Deribit + CME (honest coverage)", () => {
    const vol = getPreset("volatility-research-lab");
    expect(vol?.v1VenueConstraints).toEqual(["DERIBIT", "CME"]);
  });

  it("Executive Overview + Live Trading Desk declare an emptyStateCopy (demo-only)", () => {
    expect(getPreset("executive-overview")?.emptyStateCopy).toBeTruthy();
    expect(getPreset("live-trading-desk")?.emptyStateCopy).toBeTruthy();
  });

  it("getPreset returns undefined for unknown id", () => {
    expect(getPreset("not-a-preset")).toBeUndefined();
  });
});

describe("applyPresetToScope", () => {
  it("Arbitrage Command seeds CeFi+DeFi · spot/perp · ARBITRAGE_STRUCTURAL", () => {
    const arb = getPreset("arbitrage-command");
    expect(arb).toBeDefined();
    if (!arb) return;
    const next = applyPresetToScope(arb, EMPTY_WORKSPACE_SCOPE);
    expect(next.assetGroups).toEqual(["CEFI", "DEFI"]);
    expect(next.instrumentTypes).toEqual(["spot", "perp"]);
    expect(next.families).toEqual(["ARBITRAGE_STRUCTURAL"]);
    expect(next.surface).toBe("terminal");
    expect(next.terminalMode).toBe("command");
    expect(next.engagement).toBe("monitor");
    expect(next.executionStream).toBe("paper");
  });

  it("Volatility Research Lab seeds research/validate + replicate/paper", () => {
    const vol = getPreset("volatility-research-lab");
    if (!vol) return;
    const next = applyPresetToScope(vol, EMPTY_WORKSPACE_SCOPE);
    expect(next.surface).toBe("research");
    expect(next.researchStage).toBe("validate");
    expect(next.engagement).toBe("replicate");
    expect(next.executionStream).toBe("paper");
  });

  it("Signals-In Monitor flips surface to 'signals'", () => {
    const sig = getPreset("signals-in-monitor");
    if (!sig) return;
    const next = applyPresetToScope(sig, EMPTY_WORKSPACE_SCOPE);
    expect(next.surface).toBe("signals");
    expect(next.engagement).toBe("monitor");
  });
});

describe("resolveStaticArchetypes", () => {
  it("returns the explicit list for strategy-backed presets", () => {
    const arb = getPreset("arbitrage-command");
    if (!arb) return;
    expect(resolveStaticArchetypes(arb)).toContain("ARBITRAGE_PRICE_DISPERSION");
  });

  it("returns empty for resolver-driven presets", () => {
    const exec = getPreset("executive-overview");
    if (!exec) return;
    expect(resolveStaticArchetypes(exec)).toEqual([]);
  });
});
