import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the envelope-loader's instrumentsForSlot — in production it fetches from
// `/api/catalogue/envelope?file=strategy_instruments.json` (a GCS proxy). For
// these unit tests we substitute a deterministic resolver to assert hydration
// semantics in isolation.
vi.mock("@/lib/architecture-v2/envelope-loader", () => ({
  instrumentsForSlot: vi.fn(),
}));

import { instrumentsForSlot } from "@/lib/architecture-v2/envelope-loader";
import { derivePersonaInstruments } from "@/lib/auth/demo-provider";

const mockedInstrumentsForSlot = vi.mocked(instrumentsForSlot);

describe("derivePersonaInstruments", () => {
  beforeEach(() => {
    mockedInstrumentsForSlot.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an empty list when persona has no assigned_strategies", async () => {
    const result = await derivePersonaInstruments({ id: "p", assigned_strategies: undefined });
    expect(result).toEqual([]);
    expect(mockedInstrumentsForSlot).not.toHaveBeenCalled();
  });

  it("returns an empty list when assigned_strategies is an empty array", async () => {
    const result = await derivePersonaInstruments({ id: "p", assigned_strategies: [] });
    expect(result).toEqual([]);
    expect(mockedInstrumentsForSlot).not.toHaveBeenCalled();
  });

  it("fans out to instrumentsForSlot per slot and concatenates with dedup", async () => {
    mockedInstrumentsForSlot
      .mockResolvedValueOnce(["BTC-USDT-PERP", "ETH-USDT-PERP"])
      .mockResolvedValueOnce(["ETH-USDT-PERP", "SOL-USDT-PERP"]);

    const result = await derivePersonaInstruments({
      id: "desmond-dart-full",
      assigned_strategies: [
        "CARRY_BASIS_PERP@cefi-perp-1h-btc-binance-prod",
        "ARBITRAGE_PRICE_DISPERSION@cefi-perp-1h-eth-bybit-prod",
      ],
    });

    expect(mockedInstrumentsForSlot).toHaveBeenCalledTimes(2);
    expect([...result].sort()).toEqual(["BTC-USDT-PERP", "ETH-USDT-PERP", "SOL-USDT-PERP"]);
  });

  it("returns a non-empty list for the canonical Desmond DART-Full shape", async () => {
    // Mirrors the assigned_strategies seed in lib/auth/personas.ts:409 — the
    // primary acceptance test for the universal hydration: a real persona's
    // slots resolve to a non-empty union of instrument keys.
    mockedInstrumentsForSlot.mockResolvedValue(["BTC-USDT-PERP", "ETH-USDT-PERP"]);

    const result = await derivePersonaInstruments({
      id: "desmond-dart-full",
      assigned_strategies: [
        "CARRY_BASIS_PERP@cefi-perp-1h-btc-binance-prod",
        "ARBITRAGE_PRICE_DISPERSION@cefi-perp-1h-eth-binance-prod",
        "STAT_ARB_CROSS_SECTIONAL@cefi-perp-1h-btc-bybit-prod",
      ],
    });

    expect(result.length).toBeGreaterThan(0);
    expect(mockedInstrumentsForSlot).toHaveBeenCalledTimes(3);
  });

  it("skips a failing slot, continues with the rest, and logs once", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockedInstrumentsForSlot
      .mockRejectedValueOnce(new Error("resolver miss — slot not in catalogue"))
      .mockResolvedValueOnce(["ETH-USDT-PERP"]);

    const result = await derivePersonaInstruments({
      id: "p",
      assigned_strategies: ["MISSING_SLOT@x", "PRESENT_SLOT@y"],
    });

    expect(result).toEqual(["ETH-USDT-PERP"]);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain("instrumentsForSlot");
  });

  it("filters out non-string / empty entries returned by the resolver", async () => {
    mockedInstrumentsForSlot.mockResolvedValueOnce([
      "BTC-USDT-PERP",
      "",
      // @ts-expect-error — defensive guard in derivePersonaInstruments rejects non-strings.
      null,
      // @ts-expect-error — same.
      undefined,
      "ETH-USDT-PERP",
    ]);

    const result = await derivePersonaInstruments({
      id: "p",
      assigned_strategies: ["SLOT@x"],
    });

    expect([...result].sort()).toEqual(["BTC-USDT-PERP", "ETH-USDT-PERP"]);
  });
});
