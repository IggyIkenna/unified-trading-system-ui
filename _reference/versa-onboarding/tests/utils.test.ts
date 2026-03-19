import { describe, it, expect } from "vitest";
import { chunk } from "@/lib/utils";

describe("chunk", () => {
  it("splits array into batches of given size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns single batch when array is smaller than size", () => {
    expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
  });

  it("returns empty array for empty input", () => {
    expect(chunk([], 5)).toEqual([]);
  });

  it("handles size of 1", () => {
    expect(chunk(["a", "b", "c"], 1)).toEqual([["a"], ["b"], ["c"]]);
  });

  it("handles exact multiple of size", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
});
