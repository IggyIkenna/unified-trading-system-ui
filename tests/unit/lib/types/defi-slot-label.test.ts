import { describe, it, expect } from "vitest";
import { parseSlotLabel, formatSlotLabel, isSlotLabel, STRATEGY_ENVS } from "@/lib/types/defi";

describe("slot-label parser", () => {
  it("parses a canonical slot-label into archetype/slot/env", () => {
    const parsed = parseSlotLabel("YIELD_STAKING_SIMPLE@lido-steth-ethereum-eth-prod");
    expect(parsed).toEqual({
      archetype: "YIELD_STAKING_SIMPLE",
      slot: "lido-steth-ethereum-eth",
      env: "prod",
      raw: "YIELD_STAKING_SIMPLE@lido-steth-ethereum-eth-prod",
    });
  });

  it("round-trips { archetype, slot, env } → slot-label → parsed", () => {
    for (const env of STRATEGY_ENVS) {
      const slot = "uniswap-v3-weth-usdc-ethereum-active-usdc";
      const raw = formatSlotLabel({ archetype: "MARKET_MAKING_CONTINUOUS", slot, env });
      const parsed = parseSlotLabel(raw);
      expect(parsed?.archetype).toBe("MARKET_MAKING_CONTINUOUS");
      expect(parsed?.slot).toBe(slot);
      expect(parsed?.env).toBe(env);
      expect(parsed?.raw).toBe(raw);
    }
  });

  it("accepts all launch-stage envs", () => {
    expect(parseSlotLabel("CARRY_BASIS_PERP@binance-btc-usdt-shadow")?.env).toBe("shadow");
    expect(parseSlotLabel("CARRY_BASIS_PERP@binance-btc-usdt-uat")?.env).toBe("uat");
    expect(parseSlotLabel("CARRY_BASIS_PERP@binance-btc-usdt-paper")?.env).toBe("paper");
    expect(parseSlotLabel("CARRY_BASIS_PERP@binance-btc-usdt-prod")?.env).toBe("prod");
  });

  it("returns undefined for legacy venue-id literals", () => {
    expect(parseSlotLabel("AAVE_LENDING")).toBeUndefined();
    expect(parseSlotLabel("BASIS_TRADE")).toBeUndefined();
    expect(parseSlotLabel("AMM_LP")).toBeUndefined();
  });

  it("returns undefined for malformed inputs", () => {
    expect(parseSlotLabel(undefined)).toBeUndefined();
    expect(parseSlotLabel("")).toBeUndefined();
    expect(parseSlotLabel("@slot-prod")).toBeUndefined();
    expect(parseSlotLabel("ARCHETYPE@")).toBeUndefined();
    expect(parseSlotLabel("ARCHETYPE@slot")).toBeUndefined();
    expect(parseSlotLabel("ARCHETYPE@slot-unknownenv")).toBeUndefined();
    expect(parseSlotLabel("ARCHETYPE@-prod")).toBeUndefined();
  });

  it("isSlotLabel returns true only for parseable inputs", () => {
    expect(isSlotLabel("YIELD_STAKING_SIMPLE@lido-steth-ethereum-eth-prod")).toBe(true);
    expect(isSlotLabel("AAVE_LENDING")).toBe(false);
    expect(isSlotLabel(undefined)).toBe(false);
  });
});
