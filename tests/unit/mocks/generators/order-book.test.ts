import { describe, expect, it } from "vitest";
import { generateMockOrderBook } from "@/lib/mocks/generators/order-book";

describe("generateMockOrderBook", () => {
  it("returns 15 bids and 15 asks", () => {
    const book = generateMockOrderBook("BTC-USDT", 67000, 0);
    expect(book.bids.length).toBe(15);
    expect(book.asks.length).toBe(15);
  });

  it("bids are below mid, asks are above mid", () => {
    const mid = 3400;
    const book = generateMockOrderBook("ETH-USDT", mid, 0);
    expect(book.bids[0].price).toBeLessThan(mid);
    expect(book.asks[0].price).toBeGreaterThan(mid);
  });

  it("cumulative totals are monotonic non-decreasing on both sides", () => {
    const book = generateMockOrderBook("ETH-USDT", 3400, 0);
    for (let i = 1; i < book.bids.length; i++) {
      expect(book.bids[i].total).toBeGreaterThanOrEqual(book.bids[i - 1].total);
      expect(book.asks[i].total).toBeGreaterThanOrEqual(book.asks[i - 1].total);
    }
  });

  it("is deterministic for the same seed inputs", () => {
    const a = generateMockOrderBook("BTC-USDT", 67000, 5);
    const b = generateMockOrderBook("BTC-USDT", 67000, 5);
    expect(a.bids[0].price).toBe(b.bids[0].price);
    expect(a.asks[0].size).toBe(b.asks[0].size);
  });

  it("differs across ticks", () => {
    const a = generateMockOrderBook("BTC-USDT", 67000, 0);
    const b = generateMockOrderBook("BTC-USDT", 67000, 1);
    // At least one level's size should differ
    const sizesEqual = a.bids.every((lvl, i) => lvl.size === b.bids[i].size);
    expect(sizesEqual).toBe(false);
  });
});
