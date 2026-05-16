import { describe, expect, it } from "vitest";

import {
  EMPTY_WORKSPACE_SCOPE,
  matchesScope,
  matchesScopeStrict,
  parseWorkspaceScope,
  serializeWorkspaceScope,
  type WorkspaceScope,
} from "@/lib/architecture-v2/workspace-scope";

function makeScope(overrides: Partial<WorkspaceScope> = {}): WorkspaceScope {
  return { ...EMPTY_WORKSPACE_SCOPE, ...overrides };
}

describe("workspace-scope serialize/parse", () => {
  it("serializes an empty scope to an empty record", () => {
    expect(serializeWorkspaceScope(EMPTY_WORKSPACE_SCOPE)).toEqual({});
  });

  it("round-trips a fully-populated scope", () => {
    const scope = makeScope({
      assetGroups: ["CEFI", "DEFI"],
      instrumentTypes: ["spot", "perp"],
      families: ["ARBITRAGE_STRUCTURAL"],
      archetypes: ["ARBITRAGE_PRICE_DISPERSION", "CARRY_BASIS_PERP"],
      strategyIds: ["strat-1", "strat-2"],
      shareClasses: ["BTC", "USDT"],
      venueOrProtocolIds: ["binance", "aave"],
      accountOrMandateId: "mandate-42",
      surface: "terminal",
      terminalMode: "command",
      researchStage: null,
      engagement: "replicate",
      executionStream: "paper",
      workspaceId: "arbitrage-command",
      asOfTs: "2026-04-29T12:00:00Z",
      mode: "live",
      coverageStatuses: ["SUPPORTED", "PARTIAL"],
      productRoutings: ["dart_only", "both"],
      availabilityStates: ["PUBLIC"],
    });
    const params = serializeWorkspaceScope(scope);
    const parsed = parseWorkspaceScope(params);
    expect(parsed.assetGroups).toEqual(["CEFI", "DEFI"]);
    expect(parsed.instrumentTypes).toEqual(["spot", "perp"]);
    expect(parsed.families).toEqual(["ARBITRAGE_STRUCTURAL"]);
    expect(parsed.archetypes).toEqual(["ARBITRAGE_PRICE_DISPERSION", "CARRY_BASIS_PERP"]);
    expect(parsed.strategyIds).toEqual(["strat-1", "strat-2"]);
    expect(parsed.shareClasses).toEqual(["BTC", "USDT"]);
    expect(parsed.venueOrProtocolIds).toEqual(["binance", "aave"]);
    expect(parsed.accountOrMandateId).toBe("mandate-42");
    expect(parsed.surface).toBe("terminal");
    expect(parsed.terminalMode).toBe("command");
    expect(parsed.engagement).toBe("replicate");
    expect(parsed.executionStream).toBe("paper");
    expect(parsed.workspaceId).toBe("arbitrage-command");
    expect(parsed.asOfTs).toBe("2026-04-29T12:00:00Z");
    expect(parsed.mode).toBe("live");
    expect(parsed.coverageStatuses).toEqual(["SUPPORTED", "PARTIAL"]);
    expect(parsed.productRoutings).toEqual(["dart_only", "both"]);
    expect(parsed.availabilityStates).toEqual(["PUBLIC"]);
  });

  it("drops invalid surface / mode / engagement / stream values", () => {
    const parsed = parseWorkspaceScope({
      surface: "garbage",
      tm: "not-a-mode",
      rs: "not-a-stage",
      eng: "neither",
      stream: "yolo",
      mode: "neither",
    });
    expect(parsed.surface).toBe("dashboard");
    expect(parsed.terminalMode).toBeNull();
    expect(parsed.researchStage).toBeNull();
    expect(parsed.engagement).toBe("monitor");
    expect(parsed.executionStream).toBe("paper");
    expect(parsed.mode).toBe("live");
  });

  it("accepts URLSearchParams as input", () => {
    const params = new URLSearchParams("ag=CEFI,DEFI&fam=ARBITRAGE_STRUCTURAL");
    const parsed = parseWorkspaceScope(params);
    expect(parsed.assetGroups).toEqual(["CEFI", "DEFI"]);
    expect(parsed.families).toEqual(["ARBITRAGE_STRUCTURAL"]);
  });

  it("filters CSV asset_groups to known values", () => {
    const parsed = parseWorkspaceScope({ ag: "CEFI,GARBAGE,DEFI" });
    expect(parsed.assetGroups).toEqual(["CEFI", "DEFI"]);
  });

  it("filters CSV share_classes to known values", () => {
    const parsed = parseWorkspaceScope({ sc: "BTC,JUNK,USDT" });
    expect(parsed.shareClasses).toEqual(["BTC", "USDT"]);
  });

  it("omits empty arrays from URL serialization", () => {
    const scope = makeScope({ surface: "terminal" });
    const params = serializeWorkspaceScope(scope);
    expect(params).not.toHaveProperty("ag");
    expect(params).not.toHaveProperty("fam");
    expect(params).toHaveProperty("surface", "terminal");
  });

  it("preserves non-default surface=dashboard explicitly", () => {
    // dashboard is the default — should be omitted to keep URLs minimal
    const scope = makeScope({ surface: "dashboard" });
    const params = serializeWorkspaceScope(scope);
    expect(params).not.toHaveProperty("surface");
  });
});

describe("workspace-scope matchesScope predicate", () => {
  it("returns true for an empty scope (no filter axes active)", () => {
    expect(matchesScope({ strategy_id: "anything", strategy_family: "CARRY_AND_YIELD" }, EMPTY_WORKSPACE_SCOPE)).toBe(
      true,
    );
  });

  it("matches when row family is in scope.families", () => {
    const scope = makeScope({ families: ["ARBITRAGE_STRUCTURAL"] });
    expect(matchesScope({ strategy_family: "ARBITRAGE_STRUCTURAL" }, scope)).toBe(true);
    expect(matchesScope({ strategy_family: "CARRY_AND_YIELD" }, scope)).toBe(false);
  });

  it("is tolerant of unpopulated rows by default", () => {
    const scope = makeScope({ families: ["ARBITRAGE_STRUCTURAL"] });
    expect(matchesScope({ strategy_id: "x" }, scope)).toBe(true);
  });

  it("strict variant rejects unpopulated rows when an axis is active", () => {
    const scope = makeScope({ families: ["ARBITRAGE_STRUCTURAL"] });
    expect(matchesScopeStrict({ strategy_id: "x" }, scope)).toBe(false);
  });

  it("matches asset_group axis", () => {
    const scope = makeScope({ assetGroups: ["DEFI"] });
    expect(matchesScope({ asset_group: "DEFI" }, scope)).toBe(true);
    expect(matchesScope({ asset_group: "CEFI" }, scope)).toBe(false);
  });

  it("matches instrument_type axis", () => {
    const scope = makeScope({ instrumentTypes: ["perp", "future"] });
    expect(matchesScope({ instrument_type: "perp" }, scope)).toBe(true);
    expect(matchesScope({ instrument_type: "spot" }, scope)).toBe(false);
  });

  it("matches share_class axis", () => {
    const scope = makeScope({ shareClasses: ["BTC"] });
    expect(matchesScope({ share_class: "BTC" }, scope)).toBe(true);
    expect(matchesScope({ share_class: "ETH" }, scope)).toBe(false);
  });

  it("matches venue/protocol axis (either field)", () => {
    const scope = makeScope({ venueOrProtocolIds: ["binance", "aave"] });
    expect(matchesScope({ venue: "binance", protocol: "" }, scope)).toBe(true);
    expect(matchesScope({ venue: "", protocol: "aave" }, scope)).toBe(true);
    expect(matchesScope({ venue: "okx", protocol: "uniswap" }, scope)).toBe(false);
  });

  it("requires all active axes to match (AND semantics)", () => {
    const scope = makeScope({
      assetGroups: ["CEFI"],
      families: ["ARBITRAGE_STRUCTURAL"],
    });
    expect(
      matchesScope(
        {
          asset_group: "CEFI",
          strategy_family: "ARBITRAGE_STRUCTURAL",
        },
        scope,
      ),
    ).toBe(true);
    expect(
      matchesScope(
        {
          asset_group: "CEFI",
          strategy_family: "CARRY_AND_YIELD",
        },
        scope,
      ),
    ).toBe(false);
  });
});
