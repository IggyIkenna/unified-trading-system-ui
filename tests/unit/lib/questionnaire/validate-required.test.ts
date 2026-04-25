/**
 * Required-field validator unit tests.
 *
 * Each test mutates a single field on a known-valid baseline so the
 * failure mode is unambiguous. The validator short-circuits on the
 * first failing axis, so tests for later axes always start from a
 * baseline where every earlier axis passes.
 *
 * SSOT: lib/questionnaire/validate-required.ts
 */

import { describe, expect, it } from "vitest";

import {
  EMAIL_SHAPE,
  isRegUmbrellaPath,
  validateRequired,
  type ValidateRequiredInput,
} from "@/lib/questionnaire/validate-required";

const VALID_BASE: ValidateRequiredInput = {
  categories: new Set(["TradFi"]),
  instrument_types: new Set(["spot"]),
  venue_scope_mode: "all",
  venue_scope_csv: "",
  strategy_style: new Set(["carry"]),
  service_family: "DART",
  fund_structure: new Set(["SMA"]),
  licence_region: null,
  entity_jurisdiction: "",
  supported_currencies: new Set(),
  supported_currencies_other: "",
  email: "alice@acme.com",
  firm_name: "Acme Capital",
  firm_location: "uk",
};

describe("validateRequired — happy path", () => {
  it("returns null for the canonical valid baseline", () => {
    expect(validateRequired(VALID_BASE)).toBeNull();
  });

  it("accepts arrays as well as Sets for multi-select axes", () => {
    expect(
      validateRequired({
        ...VALID_BASE,
        categories: ["TradFi", "DeFi"],
        instrument_types: ["spot", "perp"],
        strategy_style: ["carry"],
        fund_structure: ["SMA"],
      }),
    ).toBeNull();
  });
});

describe("validateRequired — base axes (always required)", () => {
  it("flags Q1 categories when empty", () => {
    expect(validateRequired({ ...VALID_BASE, categories: new Set() })).toEqual({
      testId: "axis-categories",
      message: expect.stringContaining("category"),
    });
  });

  it("flags Q2 instrument_types when empty", () => {
    expect(validateRequired({ ...VALID_BASE, instrument_types: new Set() })).toEqual({
      testId: "axis-instrument-types",
      message: expect.stringContaining("instrument type"),
    });
  });

  it("flags Q3 venue_scope when explicit-mode and CSV blank", () => {
    expect(validateRequired({ ...VALID_BASE, venue_scope_mode: "explicit", venue_scope_csv: "   " })).toEqual({
      testId: "axis-venue-scope",
      message: expect.stringContaining("venues"),
    });
  });

  it("does NOT flag Q3 when venue_scope_mode is 'all' and CSV blank", () => {
    expect(validateRequired({ ...VALID_BASE, venue_scope_mode: "all", venue_scope_csv: "" })).toBeNull();
  });

  it("flags Q4 strategy_style when empty", () => {
    expect(validateRequired({ ...VALID_BASE, strategy_style: new Set() })).toEqual({
      testId: "axis-strategy-style",
      message: expect.stringContaining("strategy style"),
    });
  });

  it("flags Q6 fund_structure when empty", () => {
    expect(validateRequired({ ...VALID_BASE, fund_structure: new Set() })).toEqual({
      testId: "axis-fund-structure",
      message: expect.stringContaining("fund structure"),
    });
  });
});

describe("validateRequired — Reg-Umbrella branch", () => {
  const REG_BASE: ValidateRequiredInput = {
    ...VALID_BASE,
    service_family: "RegUmbrella",
    licence_region: "EU_and_UK",
    entity_jurisdiction: "GB",
    supported_currencies: new Set(["GBP"]),
  };

  it("returns null when all Reg-Umbrella axes are filled", () => {
    expect(validateRequired(REG_BASE)).toBeNull();
  });

  it("requires licence_region on RegUmbrella", () => {
    expect(validateRequired({ ...REG_BASE, licence_region: null })).toEqual({
      testId: "axis-licence-region",
      message: expect.stringContaining("licence region"),
    });
  });

  it("requires licence_region on combo too", () => {
    expect(validateRequired({ ...REG_BASE, service_family: "combo", licence_region: null })).toEqual({
      testId: "axis-licence-region",
      message: expect.stringContaining("licence region"),
    });
  });

  it("requires entity_jurisdiction on RegUmbrella", () => {
    expect(validateRequired({ ...REG_BASE, entity_jurisdiction: "   " })).toEqual({
      testId: "axis-entity-jurisdiction",
      message: expect.stringContaining("jurisdiction"),
    });
  });

  it("requires at least one supported currency (set OR free-text)", () => {
    expect(
      validateRequired({
        ...REG_BASE,
        supported_currencies: new Set(),
        supported_currencies_other: "   ",
      }),
    ).toEqual({
      testId: "axis-supported-currencies",
      message: expect.stringContaining("currency"),
    });
  });

  it("accepts free-text supported_currencies_other when the set is empty", () => {
    expect(
      validateRequired({
        ...REG_BASE,
        supported_currencies: new Set(),
        supported_currencies_other: "JPY, AUD",
      }),
    ).toBeNull();
  });

  it("does NOT enforce Reg-Umbrella axes for DART or IM service families", () => {
    expect(
      validateRequired({
        ...VALID_BASE,
        service_family: "DART",
        licence_region: null,
        entity_jurisdiction: "",
        supported_currencies: new Set(),
      }),
    ).toBeNull();
    expect(
      validateRequired({
        ...VALID_BASE,
        service_family: "IM",
        licence_region: null,
        entity_jurisdiction: "",
        supported_currencies: new Set(),
      }),
    ).toBeNull();
  });
});

describe("validateRequired — envelope axes", () => {
  it("requires email", () => {
    expect(validateRequired({ ...VALID_BASE, email: "  " })).toEqual({
      testId: "envelope-email",
      message: expect.stringContaining("work email"),
    });
  });

  it("rejects malformed emails", () => {
    expect(validateRequired({ ...VALID_BASE, email: "alice-no-at" })).toEqual({
      testId: "envelope-email",
      message: expect.stringContaining("doesn't look right"),
    });
    expect(validateRequired({ ...VALID_BASE, email: "alice@" })).toEqual({
      testId: "envelope-email",
      message: expect.stringContaining("doesn't look right"),
    });
    expect(validateRequired({ ...VALID_BASE, email: "alice@acme" })).toEqual({
      testId: "envelope-email",
      message: expect.stringContaining("doesn't look right"),
    });
  });

  it("trims whitespace before validating email shape", () => {
    expect(validateRequired({ ...VALID_BASE, email: "  alice@acme.com  " })).toBeNull();
  });

  it("requires firm_name", () => {
    expect(validateRequired({ ...VALID_BASE, firm_name: "  " })).toEqual({
      testId: "envelope-firm-name",
      message: expect.stringContaining("firm name"),
    });
  });

  it("requires firm_location", () => {
    expect(validateRequired({ ...VALID_BASE, firm_location: "" })).toEqual({
      testId: "envelope-location",
      message: expect.stringContaining("firm is based"),
    });
  });
});

describe("validateRequired — short-circuit ordering", () => {
  it("flags Q1 first when both Q1 and email are missing", () => {
    expect(validateRequired({ ...VALID_BASE, categories: new Set(), email: "" })).toEqual({
      testId: "axis-categories",
      message: expect.stringContaining("category"),
    });
  });

  it("flags envelope email before firm_name when both missing", () => {
    expect(validateRequired({ ...VALID_BASE, email: "", firm_name: "" })).toEqual({
      testId: "envelope-email",
      message: expect.stringContaining("work email"),
    });
  });
});

describe("isRegUmbrellaPath", () => {
  it("matches RegUmbrella and combo only", () => {
    expect(isRegUmbrellaPath("RegUmbrella")).toBe(true);
    expect(isRegUmbrellaPath("combo")).toBe(true);
    expect(isRegUmbrellaPath("DART")).toBe(false);
    expect(isRegUmbrellaPath("IM")).toBe(false);
  });
});

describe("EMAIL_SHAPE regex", () => {
  it("accepts standard well-formed addresses", () => {
    expect(EMAIL_SHAPE.test("alice@acme.com")).toBe(true);
    expect(EMAIL_SHAPE.test("a.b+tag@sub.example.co.uk")).toBe(true);
  });

  it("rejects empty / no-at / no-dot / whitespace-laden inputs", () => {
    expect(EMAIL_SHAPE.test("")).toBe(false);
    expect(EMAIL_SHAPE.test("plain")).toBe(false);
    expect(EMAIL_SHAPE.test("alice@")).toBe(false);
    expect(EMAIL_SHAPE.test("alice@host")).toBe(false);
    expect(EMAIL_SHAPE.test("alice @acme.com")).toBe(false);
  });
});
