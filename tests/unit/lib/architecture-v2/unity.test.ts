import { describe, expect, it } from "vitest";
import {
  UNITY_CHILD_BOOKS,
  UNITY_COMMERCIAL,
  unityChildBooksConfirmed,
  unityChildBooksPending,
} from "@/lib/architecture-v2";

describe("Unity meta-broker metadata", () => {
  it("exposes all 10 child books with 8 confirmed + 2 pending", () => {
    expect(UNITY_CHILD_BOOKS).toHaveLength(10);
    expect(unityChildBooksConfirmed()).toHaveLength(8);
    expect(unityChildBooksPending()).toHaveLength(2);
  });

  it("enables soccer, tennis, and basketball only", () => {
    expect([...UNITY_COMMERCIAL.enabledSports].sort()).toEqual([
      "BASKETBALL",
      "SOCCER",
      "TENNIS",
    ]);
  });

  it("declares the commercial parameters from codex/02-venues/unity-integration.md", () => {
    expect(UNITY_COMMERCIAL.depositUsd).toBe(10_800);
    expect(UNITY_COMMERCIAL.refundThresholdLifetimeTurnoverUsd).toBe(5_300_000);
    expect(UNITY_COMMERCIAL.monthlySubscriptionUsd).toBe(2_600);
    expect(UNITY_COMMERCIAL.monthlyTurnoverWaiverUsd).toBe(260_000);
    expect(UNITY_COMMERCIAL.rolloverMultiplier).toBe(1);
    expect(UNITY_COMMERCIAL.shareClass).toBe("USD");
  });

  it("TBD books have null commissions and no sports", () => {
    for (const book of unityChildBooksPending()) {
      expect(book.commission_bps).toBeNull();
      expect(book.supported_sports).toHaveLength(0);
    }
  });
});
