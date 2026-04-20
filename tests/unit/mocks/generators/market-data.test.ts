import { describe, expect, it } from "vitest";
import {
  MOCK_INSTRUMENTS,
  generateCategoryOrderBook,
  generateMockCandles,
  isTradFiWeekend,
  nextMockTick,
} from "@/lib/mocks/generators/market-data";

describe("market-data generator", () => {
  it("MOCK_INSTRUMENTS covers the four categories", () => {
    const cats = new Set(MOCK_INSTRUMENTS.map((i) => i.category));
    expect(cats.has("CeFi")).toBe(true);
    expect(cats.has("DeFi")).toBe(true);
    expect(cats.has("TradFi")).toBe(true);
    expect(cats.has("Prediction")).toBe(true);
  });

  it("generateMockCandles returns the requested number of candles (CeFi)", () => {
    const inst = MOCK_INSTRUMENTS.find((i) => i.category === "CeFi")!;
    const candles = generateMockCandles(inst, "1H", 40);
    expect(candles.length).toBe(40);
    for (const c of candles) {
      expect(typeof c.open).toBe("number");
      expect(typeof c.close).toBe("number");
      expect(c.high).toBeGreaterThanOrEqual(Math.min(c.open, c.close));
      expect(c.low).toBeLessThanOrEqual(Math.max(c.open, c.close));
    }
  });

  it("generateMockCandles works for Prediction markets (probabilities 0..1)", () => {
    const inst = MOCK_INSTRUMENTS.find((i) => i.category === "Prediction")!;
    const candles = generateMockCandles(inst, "1H", 20);
    expect(candles.length).toBe(20);
    for (const c of candles) {
      expect(c.close).toBeGreaterThanOrEqual(0);
      expect(c.close).toBeLessThanOrEqual(1);
    }
  });

  it("nextMockTick returns a tick with price/bid/ask", () => {
    const inst = MOCK_INSTRUMENTS.find((i) => i.category === "CeFi")!;
    const tick = nextMockTick(inst, 3400, 0);
    expect(typeof tick.price).toBe("number");
    expect(typeof tick.bid).toBe("number");
    expect(typeof tick.ask).toBe("number");
    expect(tick.ask).toBeGreaterThanOrEqual(tick.bid);
  });

  it("generateCategoryOrderBook returns bids and asks", () => {
    const inst = MOCK_INSTRUMENTS.find((i) => i.category === "CeFi")!;
    const book = generateCategoryOrderBook(inst, 3400, 0);
    expect(Array.isArray(book.bids)).toBe(true);
    expect(Array.isArray(book.asks)).toBe(true);
    expect(book.bids.length).toBeGreaterThan(0);
    expect(book.asks.length).toBeGreaterThan(0);
  });

  it("isTradFiWeekend flags Saturday/Sunday", () => {
    // 2026-04-18 is a Saturday UTC
    const sat = Math.floor(new Date("2026-04-18T12:00:00Z").getTime() / 1000);
    expect(isTradFiWeekend(sat)).toBe(true);
    // 2026-04-20 is a Monday UTC
    const mon = Math.floor(new Date("2026-04-20T12:00:00Z").getTime() / 1000);
    expect(isTradFiWeekend(mon)).toBe(false);
  });
});
