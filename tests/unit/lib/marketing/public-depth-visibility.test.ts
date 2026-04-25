import { describe, expect, it } from "vitest";

import { shouldHidePublicDepthChrome } from "@/lib/marketing/public-depth-visibility";

describe("shouldHidePublicDepthChrome", () => {
  it("hides on briefings hub and subpaths", () => {
    expect(shouldHidePublicDepthChrome("/briefings")).toBe(true);
    expect(shouldHidePublicDepthChrome("/briefings/platform")).toBe(true);
  });

  it("shows on public marketing home and paths", () => {
    expect(shouldHidePublicDepthChrome("/")).toBe(false);
    expect(shouldHidePublicDepthChrome("/platform")).toBe(false);
    expect(shouldHidePublicDepthChrome("/questionnaire")).toBe(false);
  });

  it("hides on auth", () => {
    expect(shouldHidePublicDepthChrome("/login")).toBe(true);
    expect(shouldHidePublicDepthChrome("/signup")).toBe(true);
  });
});
