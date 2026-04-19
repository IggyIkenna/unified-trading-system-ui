import { describe, expect, it } from "vitest";

import {
  ALLOCATION_MIN_MATURITY,
  EXTERNAL_VISIBILITY_MIN_MATURITY,
  MATURITY_LADDER,
  StrategyNotAvailableError,
  StrategyRetiredError,
  availabilityFor,
  defaultEntry,
  maturityRank,
  slotsVisibleTo,
  validateAllocationAuthorised,
} from "@/lib/architecture-v2";
import type { StrategyAvailabilityEntry } from "@/lib/architecture-v2";

describe("availability — defaults + lookup", () => {
  it("default entry is (PUBLIC, LIVE_ALLOCATED) so shipped slots allocate without a row", () => {
    const entry = defaultEntry("SLOT_A");
    expect(entry.lockState).toBe("PUBLIC");
    expect(entry.maturity).toBe("LIVE_ALLOCATED");
  });

  it("availabilityFor returns registered row when present, default otherwise", () => {
    const reg: StrategyAvailabilityEntry[] = [
      {
        slotLabel: "SLOT_A",
        lockState: "INVESTMENT_MANAGEMENT_RESERVED",
        maturity: "PAPER_TRADING",
        exclusiveClientId: null,
        reservingBusinessUnitId: "fund-alpha",
        changedAtUtc: "",
        reason: "",
        expiresAtUtc: null,
        baseSlotLabel: null,
      },
    ];
    expect(availabilityFor("SLOT_A", reg).lockState).toBe(
      "INVESTMENT_MANAGEMENT_RESERVED",
    );
    expect(availabilityFor("SLOT_B", reg).lockState).toBe("PUBLIC");
  });
});

describe("maturity ladder", () => {
  it("is strictly monotonic", () => {
    for (let i = 1; i < MATURITY_LADDER.length; i++) {
      expect(maturityRank(MATURITY_LADDER[i])).toBeGreaterThan(
        maturityRank(MATURITY_LADDER[i - 1]),
      );
    }
  });

  it("exposes the thresholds as StrategyMaturity constants", () => {
    expect(EXTERNAL_VISIBILITY_MIN_MATURITY).toBe("BACKTESTED");
    expect(ALLOCATION_MIN_MATURITY).toBe("LIVE_TINY");
  });
});

function entry(
  slotLabel: string,
  overrides: Partial<StrategyAvailabilityEntry> = {},
): StrategyAvailabilityEntry {
  return {
    slotLabel,
    lockState: "PUBLIC",
    maturity: "LIVE_ALLOCATED",
    exclusiveClientId: null,
    reservingBusinessUnitId: null,
    changedAtUtc: "",
    reason: "",
    expiresAtUtc: null,
    baseSlotLabel: null,
    ...overrides,
  };
}

const FIXTURE = [
  entry("PUBLIC_READY", { maturity: "BACKTESTED" }),
  entry("PUBLIC_EARLY", { maturity: "CODE_WRITTEN" }),
  entry("IM_RESERVED", {
    lockState: "INVESTMENT_MANAGEMENT_RESERVED",
    reservingBusinessUnitId: "im-core",
  }),
  entry("CLIENT_ALPHA_ONLY", {
    lockState: "CLIENT_EXCLUSIVE",
    exclusiveClientId: "client-alpha",
  }),
  entry("RETIRED_SLOT", { lockState: "RETIRED" }),
];

describe("slotsVisibleTo", () => {
  it("admin sees everything including retired and placeholders", () => {
    const visible = new Set(slotsVisibleTo("admin", { registry: FIXTURE }));
    expect(visible).toEqual(
      new Set([
        "PUBLIC_READY",
        "PUBLIC_EARLY",
        "IM_RESERVED",
        "CLIENT_ALPHA_ONLY",
        "RETIRED_SLOT",
      ]),
    );
  });

  it("im_desk hides pre-audit placeholders but keeps retired for audit", () => {
    const visible = new Set(slotsVisibleTo("im_desk", { registry: FIXTURE }));
    expect(visible.has("PUBLIC_READY")).toBe(true);
    expect(visible.has("IM_RESERVED")).toBe(true);
    expect(visible.has("CLIENT_ALPHA_ONLY")).toBe(true);
    expect(visible.has("RETIRED_SLOT")).toBe(true);
    expect(visible.has("PUBLIC_EARLY")).toBe(false);
  });

  it("im_client sees public + own client-exclusive only", () => {
    const visible = new Set(
      slotsVisibleTo("im_client", {
        clientId: "client-alpha",
        registry: FIXTURE,
      }),
    );
    expect(visible).toEqual(new Set(["PUBLIC_READY", "CLIENT_ALPHA_ONLY"]));
  });

  it("trading_platform_subscriber hides IM_RESERVED + RETIRED", () => {
    const visible = new Set(
      slotsVisibleTo("trading_platform_subscriber", {
        clientId: "client-alpha",
        registry: FIXTURE,
      }),
    );
    expect(visible.has("IM_RESERVED")).toBe(false);
    expect(visible.has("RETIRED_SLOT")).toBe(false);
    expect(visible.has("PUBLIC_READY")).toBe(true);
    expect(visible.has("CLIENT_ALPHA_ONLY")).toBe(true);
  });

  it("defaults unknown labels to PUBLIC + LIVE_ALLOCATED when knownSlotLabels is supplied", () => {
    const visible = new Set(
      slotsVisibleTo("trading_platform_subscriber", {
        clientId: "c",
        registry: [],
        knownSlotLabels: ["UNREGISTERED_A"],
      }),
    );
    expect(visible).toEqual(new Set(["UNREGISTERED_A"]));
  });
});

describe("validateAllocationAuthorised", () => {
  it("rejects RETIRED with StrategyRetiredError", () => {
    const reg = [entry("SLOT_A", { lockState: "RETIRED" })];
    expect(() => validateAllocationAuthorised("SLOT_A", "c", "saas", reg)).toThrow(
      StrategyRetiredError,
    );
  });

  it("rejects slots below LIVE_TINY floor", () => {
    const reg = [entry("SLOT_A", { maturity: "PAPER_TRADING" })];
    expect(() => validateAllocationAuthorised("SLOT_A", "c", "saas", reg)).toThrow(
      StrategyNotAvailableError,
    );
  });

  it("default fallback allows allocation (preserves shipped-slot behaviour)", () => {
    expect(() =>
      validateAllocationAuthorised("UNKNOWN_SLOT", "c", "saas"),
    ).not.toThrow();
  });

  it("rejects saas on IM_RESERVED, permits im_desk", () => {
    const reg = [
      entry("SLOT_A", {
        lockState: "INVESTMENT_MANAGEMENT_RESERVED",
        reservingBusinessUnitId: "fund-1",
      }),
    ];
    expect(() => validateAllocationAuthorised("SLOT_A", "c", "saas", reg)).toThrow(
      /IM-reserved/,
    );
    expect(() =>
      validateAllocationAuthorised("SLOT_A", "fund-1", "im_desk", reg),
    ).not.toThrow();
  });

  it("rejects cross-client on CLIENT_EXCLUSIVE, permits own client and admin", () => {
    const reg = [
      entry("SLOT_A", {
        lockState: "CLIENT_EXCLUSIVE",
        exclusiveClientId: "client-a",
      }),
    ];
    expect(() => validateAllocationAuthorised("SLOT_A", "client-b", "saas", reg)).toThrow(
      /client-exclusive/,
    );
    expect(() =>
      validateAllocationAuthorised("SLOT_A", "client-a", "saas", reg),
    ).not.toThrow();
    expect(() =>
      validateAllocationAuthorised("SLOT_A", "admin-1", "admin", reg),
    ).not.toThrow();
  });

  it("im_desk on client-exclusive is observe-only (rejected for allocation)", () => {
    const reg = [
      entry("SLOT_A", {
        lockState: "CLIENT_EXCLUSIVE",
        exclusiveClientId: "client-a",
      }),
    ];
    expect(() =>
      validateAllocationAuthorised("SLOT_A", "im-1", "im_desk", reg),
    ).toThrow(/observe-only/);
  });
});
