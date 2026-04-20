import { describe, expect, it } from "vitest";
import { mock01, mockRange } from "@/lib/mocks/generators/deterministic";

describe("deterministic generators", () => {
  it("mock01 returns a number in [0, 1)", () => {
    for (let i = 0; i < 25; i++) {
      const v = mock01(i);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("mock01 is deterministic for same (index, salt)", () => {
    expect(mock01(7, 3)).toBe(mock01(7, 3));
  });

  it("mock01 varies with index and salt", () => {
    expect(mock01(1)).not.toBe(mock01(2));
    expect(mock01(1, 0)).not.toBe(mock01(1, 5));
  });

  it("mockRange returns a number in [min, max)", () => {
    for (let i = 0; i < 25; i++) {
      const v = mockRange(10, 20, i);
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThan(20);
    }
  });

  it("mockRange is deterministic", () => {
    expect(mockRange(0, 100, 11, 2)).toBe(mockRange(0, 100, 11, 2));
  });
});
