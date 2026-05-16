import { describe, expect, it } from "vitest";

import { shouldHidePublicDepthChrome } from "@/lib/marketing/public-depth-visibility";

describe("shouldHidePublicDepthChrome", () => {
  it("hides on briefings hub and subpaths", () => {
    expect(shouldHidePublicDepthChrome("/briefings")).toBe(true);
    expect(shouldHidePublicDepthChrome("/briefings/platform")).toBe(true);
  });

  it("shows on public marketing home and paths", () => {
    // Engagement-route pages carry their own on-page review-path strip
    // (per 2026-04-26 review), so /platform / /investment-management /
    // /regulatory now hide the global chrome. The home and the
    // questionnaire page still show it.
    expect(shouldHidePublicDepthChrome("/")).toBe(false);
    expect(shouldHidePublicDepthChrome("/questionnaire")).toBe(false);
  });

  it("hides on engagement-route pages (own on-page review-path strip)", () => {
    expect(shouldHidePublicDepthChrome("/platform")).toBe(true);
    expect(shouldHidePublicDepthChrome("/investment-management")).toBe(true);
    expect(shouldHidePublicDepthChrome("/regulatory")).toBe(true);
  });

  it("hides on auth", () => {
    expect(shouldHidePublicDepthChrome("/login")).toBe(true);
    expect(shouldHidePublicDepthChrome("/signup")).toBe(true);
  });
});
