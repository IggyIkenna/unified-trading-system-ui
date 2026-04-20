import { describe, expect, it } from "vitest";

import { bollingerBands, ema, sma } from "@/lib/utils/indicators";

describe("sma (simple moving average)", () => {
  it("returns all nulls when period is zero", () => {
    const out = sma([1, 2, 3, 4], 0);
    expect(out).toEqual([null, null, null, null]);
  });

  it("returns all nulls when period is negative", () => {
    const out = sma([1, 2, 3, 4], -5);
    expect(out).toEqual([null, null, null, null]);
  });

  it("returns all nulls when array is shorter than period", () => {
    const out = sma([1, 2], 3);
    expect(out).toEqual([null, null]);
  });

  it("computes SMA for a simple series", () => {
    const out = sma([2, 4, 6, 8, 10], 3);
    // index 0,1 -> null; index 2 -> avg(2,4,6)=4; index 3 -> avg(4,6,8)=6; index 4 -> avg(6,8,10)=8
    expect(out).toEqual([null, null, 4, 6, 8]);
  });

  it("seeds first value at period-1 index", () => {
    const out = sma([10, 20, 30], 3);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeNull();
    expect(out[2]).toBe(20);
  });

  it("handles period equal to length", () => {
    const out = sma([1, 2, 3], 3);
    expect(out).toEqual([null, null, 2]);
  });

  it("handles period of 1 (identity)", () => {
    const out = sma([5, 6, 7], 1);
    expect(out).toEqual([5, 6, 7]);
  });

  it("returns empty array for empty input", () => {
    expect(sma([], 3)).toEqual([]);
  });
});

describe("ema (exponential moving average)", () => {
  it("returns all nulls when period is zero", () => {
    expect(ema([1, 2, 3], 0)).toEqual([null, null, null]);
  });

  it("returns all nulls when period is negative", () => {
    expect(ema([1, 2, 3], -1)).toEqual([null, null, null]);
  });

  it("returns all nulls when input shorter than period", () => {
    expect(ema([1, 2], 3)).toEqual([null, null]);
  });

  it("seeds first non-null with SMA at index period-1", () => {
    const out = ema([2, 4, 6, 8, 10], 3);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeNull();
    expect(out[2]).toBe(4); // SMA seed
  });

  it("applies exponential smoothing after seed", () => {
    const values = [2, 4, 6, 8, 10];
    const out = ema(values, 3);
    const mult = 2 / (3 + 1); // 0.5
    const seed = 4;
    const idx3 = 8 * mult + seed * (1 - mult);
    expect(out[3]).toBeCloseTo(idx3);
    const idx4 = 10 * mult + idx3 * (1 - mult);
    expect(out[4]).toBeCloseTo(idx4);
  });

  it("handles period equal to length", () => {
    const out = ema([1, 2, 3], 3);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeNull();
    expect(out[2]).toBe(2);
  });

  it("returns empty array for empty input", () => {
    expect(ema([], 3)).toEqual([]);
  });
});

describe("bollingerBands", () => {
  it("returns three arrays all null when input too short", () => {
    const out = bollingerBands([1, 2], 5, 2);
    expect(out.upper).toEqual([null, null]);
    expect(out.middle).toEqual([null, null]);
    expect(out.lower).toEqual([null, null]);
  });

  it("middle equals SMA", () => {
    const closes = [2, 4, 6, 8, 10];
    const out = bollingerBands(closes, 3, 2);
    expect(out.middle).toEqual([null, null, 4, 6, 8]);
  });

  it("upper and lower are symmetric around middle", () => {
    const out = bollingerBands([2, 4, 6, 8, 10], 3, 2);
    for (let i = 2; i < 5; i++) {
      const mid = out.middle[i];
      const up = out.upper[i];
      const lo = out.lower[i];
      if (mid === null || up === null || lo === null) throw new Error("unexpected null");
      expect(up - mid).toBeCloseTo(mid - lo);
    }
  });

  it("computes expected population stdDev for a simple window", () => {
    // window [2,4,6]: mean=4, variance = ((4+0+4)/3)=8/3, sd=sqrt(8/3)
    const out = bollingerBands([2, 4, 6], 3, 1);
    const mid = out.middle[2];
    const up = out.upper[2];
    if (mid === null || up === null) throw new Error("unexpected null");
    expect(up - mid).toBeCloseTo(Math.sqrt(8 / 3));
  });

  it("upper/lower stay null where middle is null", () => {
    const out = bollingerBands([1, 2, 3, 4], 3, 2);
    expect(out.upper[0]).toBeNull();
    expect(out.upper[1]).toBeNull();
    expect(out.lower[0]).toBeNull();
    expect(out.lower[1]).toBeNull();
  });

  it("handles zero stdDev multiplier (bands collapse onto middle)", () => {
    const out = bollingerBands([2, 4, 6, 8], 3, 0);
    expect(out.upper[2]).toBe(out.middle[2]);
    expect(out.lower[2]).toBe(out.middle[2]);
  });
});
