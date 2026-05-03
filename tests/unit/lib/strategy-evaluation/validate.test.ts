/**
 * Regression: the allocator path silently failed because validate() was
 * requiring commercialPath + 3 understand* acknowledgements that the
 * allocator wizard never renders. The submit button got enabled (gated only
 * on lead researcher + email), the user clicked, validate() rejected
 * builder-only fields, and the wizard had no surface to display the errors,
 * so the user saw nothing happen.
 *
 * SSOT: lib/strategy-evaluation/validate.ts
 */

import { describe, expect, it } from "vitest";

import { validateStrategyEvaluation, type StrategyEvaluationValidatableForm } from "@/lib/strategy-evaluation/validate";

const ALLOCATOR_VALID: StrategyEvaluationValidatableForm = {
  engagementIntent: "allocator",
  strategyName: "Family-office mandate",
  leadResearcher: "Jane Allocator",
  email: "jane@example.com",
  // Builder-only fields stay at their default empty / false values — an
  // allocator wizard never sets these and validate() must not require them.
  commercialPath: "",
  understandFit: false,
  understandIncubation: false,
  understandSignals: false,
  allocatorInvestorType: "Family office",
};

const BUILDER_VALID: StrategyEvaluationValidatableForm = {
  engagementIntent: "builder",
  strategyName: "Cross-venue carry",
  leadResearcher: "Alex Builder",
  email: "alex@example.com",
  commercialPath: "A",
  understandFit: true,
  understandIncubation: true,
  understandSignals: true,
  allocatorInvestorType: "",
};

describe("validateStrategyEvaluation — allocator path", () => {
  it("accepts a fully populated allocator form despite empty builder-only fields", () => {
    expect(validateStrategyEvaluation(ALLOCATOR_VALID)).toEqual([]);
  });

  it("does NOT require commercialPath / understand* acknowledgements", () => {
    const errs = validateStrategyEvaluation(ALLOCATOR_VALID);
    const fields = errs.map((e) => e.field);
    expect(fields).not.toContain("commercialPath");
    expect(fields).not.toContain("understandFit");
    expect(fields).not.toContain("understandIncubation");
    expect(fields).not.toContain("understandSignals");
  });

  it("requires strategyName", () => {
    const errs = validateStrategyEvaluation({ ...ALLOCATOR_VALID, strategyName: "" });
    expect(errs.some((e) => e.field === "strategyName")).toBe(true);
  });

  it("requires leadResearcher", () => {
    const errs = validateStrategyEvaluation({ ...ALLOCATOR_VALID, leadResearcher: "" });
    expect(errs.some((e) => e.field === "leadResearcher")).toBe(true);
  });

  it("requires email and rejects malformed email", () => {
    const missing = validateStrategyEvaluation({ ...ALLOCATOR_VALID, email: "" });
    expect(missing.some((e) => e.field === "email")).toBe(true);
    const malformed = validateStrategyEvaluation({ ...ALLOCATOR_VALID, email: "not-an-email" });
    expect(malformed.some((e) => e.field === "email")).toBe(true);
  });

  it("requires allocatorInvestorType", () => {
    const errs = validateStrategyEvaluation({ ...ALLOCATOR_VALID, allocatorInvestorType: "" });
    expect(errs.some((e) => e.field === "allocatorInvestorType")).toBe(true);
  });
});

describe("validateStrategyEvaluation — builder path", () => {
  it("accepts a fully populated builder form", () => {
    expect(validateStrategyEvaluation(BUILDER_VALID)).toEqual([]);
  });

  it("requires commercialPath", () => {
    const errs = validateStrategyEvaluation({ ...BUILDER_VALID, commercialPath: "" });
    expect(errs.some((e) => e.field === "commercialPath")).toBe(true);
  });

  it("requires understandFit", () => {
    const errs = validateStrategyEvaluation({ ...BUILDER_VALID, understandFit: false });
    expect(errs.some((e) => e.field === "understandFit")).toBe(true);
  });

  it("requires understandIncubation", () => {
    const errs = validateStrategyEvaluation({ ...BUILDER_VALID, understandIncubation: false });
    expect(errs.some((e) => e.field === "understandIncubation")).toBe(true);
  });

  it("requires understandSignals", () => {
    const errs = validateStrategyEvaluation({ ...BUILDER_VALID, understandSignals: false });
    expect(errs.some((e) => e.field === "understandSignals")).toBe(true);
  });

  it("does NOT require allocatorInvestorType for builder path", () => {
    const errs = validateStrategyEvaluation(BUILDER_VALID);
    expect(errs.some((e) => e.field === "allocatorInvestorType")).toBe(false);
  });
});

describe("validateStrategyEvaluation — pre-gate (engagementIntent unset)", () => {
  it("treats unset engagementIntent as builder-strict", () => {
    const errs = validateStrategyEvaluation({ ...BUILDER_VALID, engagementIntent: "", commercialPath: "" });
    expect(errs.some((e) => e.field === "commercialPath")).toBe(true);
  });
});
