import { describe, expect, it } from "vitest";

import {
  RESEARCH_STAGES,
  RESEARCH_STAGE_META,
  defaultResearchStage,
  researchStageForPath,
} from "@/lib/cockpit/research-stages";

describe("RESEARCH_STAGES — 6 stages per §5.3", () => {
  it("has exactly 6 stages", () => {
    expect(RESEARCH_STAGES).toHaveLength(6);
  });

  it("includes Discover, Build, Train, Validate, Allocate, Promote", () => {
    expect(RESEARCH_STAGES).toContain("discover");
    expect(RESEARCH_STAGES).toContain("build");
    expect(RESEARCH_STAGES).toContain("train");
    expect(RESEARCH_STAGES).toContain("validate");
    expect(RESEARCH_STAGES).toContain("allocate");
    expect(RESEARCH_STAGES).toContain("promote");
  });

  it("orders stages as the lifecycle narrative (Discover → Promote)", () => {
    expect(RESEARCH_STAGES[0]).toBe("discover");
    expect(RESEARCH_STAGES[RESEARCH_STAGES.length - 1]).toBe("promote");
  });

  it("every stage has metadata + a defaultHref under /services/research or /services/promote", () => {
    for (const stage of RESEARCH_STAGES) {
      const meta = RESEARCH_STAGE_META[stage];
      expect(meta.label).toBeTruthy();
      expect(meta.tagline).toBeTruthy();
      expect(meta.defaultHref).toMatch(/^\/services\/(research|promote)/);
      expect(meta.routePrefixes.length).toBeGreaterThan(0);
    }
  });
});

describe("researchStageForPath — route → stage resolution", () => {
  it("resolves Discover for the strategies catalogue surfaces", () => {
    expect(researchStageForPath("/services/research/strategies")).toBe("discover");
    expect(researchStageForPath("/services/research/strategy/catalog")).toBe("discover");
    expect(researchStageForPath("/services/research/strategy/families/CARRY_AND_YIELD")).toBe("discover");
    expect(researchStageForPath("/services/research/strategy/heatmap")).toBe("discover");
    expect(researchStageForPath("/services/research/overview")).toBe("discover");
  });

  it("resolves Build for data + features", () => {
    expect(researchStageForPath("/services/research/features")).toBe("build");
    expect(researchStageForPath("/services/research/feature-etl")).toBe("build");
    expect(researchStageForPath("/services/research/quant")).toBe("build");
  });

  it("resolves Train for ML surfaces", () => {
    expect(researchStageForPath("/services/research/ml")).toBe("train");
    expect(researchStageForPath("/services/research/ml/training")).toBe("train");
    expect(researchStageForPath("/services/research/ml/registry")).toBe("train");
    expect(researchStageForPath("/services/research/ml/grid-config")).toBe("train");
  });

  it("resolves Validate for backtest / execution / signals surfaces", () => {
    expect(researchStageForPath("/services/research/strategy/backtests")).toBe("validate");
    expect(researchStageForPath("/services/research/strategy/results")).toBe("validate");
    expect(researchStageForPath("/services/research/strategy/compare")).toBe("validate");
    expect(researchStageForPath("/services/research/execution")).toBe("validate");
    expect(researchStageForPath("/services/research/signals")).toBe("validate");
  });

  it("resolves Allocate for capital + mandate fit", () => {
    expect(researchStageForPath("/services/research/allocate")).toBe("allocate");
    expect(researchStageForPath("/services/research/strategy/candidates")).toBe("allocate");
  });

  it("resolves Promote for handoff + release-bundle approval", () => {
    expect(researchStageForPath("/services/research/strategy/handoff")).toBe("promote");
    expect(researchStageForPath("/services/promote")).toBe("promote");
  });

  it("longest prefix wins — strategy/backtests resolves to validate, not discover", () => {
    expect(researchStageForPath("/services/research/strategy/backtests")).toBe("validate");
    expect(researchStageForPath("/services/research/strategy/candidates")).toBe("allocate");
  });

  it("returns null for non-research paths", () => {
    expect(researchStageForPath("/dashboard")).toBeNull();
    expect(researchStageForPath("/services/trading/overview")).toBeNull();
    expect(researchStageForPath("/")).toBeNull();
    expect(researchStageForPath("")).toBeNull();
  });
});

describe("defaultResearchStage", () => {
  it("returns 'discover' as the journey start", () => {
    expect(defaultResearchStage()).toBe("discover");
  });
});
