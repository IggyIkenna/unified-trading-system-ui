import { TestWrapper } from "@/tests/helpers/test-wrapper";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StrategyArchetype } from "@/lib/architecture-v2/enums";

describe("StrategyCoverageMatrix", () => {
  it("renders a table with header and 18 archetype rows by default", async () => {
    const { StrategyCoverageMatrix } = await import(
      "@/components/briefings/strategy-coverage-matrix"
    );
    const { container } = render(<StrategyCoverageMatrix />, { wrapper: TestWrapper });
    const table = container.querySelector("table");
    expect(table).toBeTruthy();

    const headers = container.querySelectorAll("thead th");
    // 1 label column + 5 categories = 6
    expect(headers.length).toBe(6);

    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(18);
  });

  it("renders only the supplied subset when archetypes prop is provided", async () => {
    const { StrategyCoverageMatrix } = await import(
      "@/components/briefings/strategy-coverage-matrix"
    );
    const subset: readonly StrategyArchetype[] = [
      "ML_DIRECTIONAL_CONTINUOUS",
      "CARRY_BASIS_PERP",
    ];
    const { container } = render(<StrategyCoverageMatrix archetypes={subset} />, {
      wrapper: TestWrapper,
    });
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(subset.length);
  });

  it("adds a title tooltip to every data cell (one per category column)", async () => {
    const { StrategyCoverageMatrix } = await import(
      "@/components/briefings/strategy-coverage-matrix"
    );
    const subset: readonly StrategyArchetype[] = ["ML_DIRECTIONAL_CONTINUOUS"];
    const { container } = render(<StrategyCoverageMatrix archetypes={subset} />, {
      wrapper: TestWrapper,
    });
    const titledCells = container.querySelectorAll("tbody td[title]");
    // Five categories per row => 5 titled cells
    expect(titledCells.length).toBe(5);
    const first = titledCells[0];
    expect(first.getAttribute("title")).toBeTruthy();
    expect(first.getAttribute("title")?.length).toBeGreaterThan(0);
  });

  it("renders the 4-glyph legend below the table", async () => {
    const { StrategyCoverageMatrix } = await import(
      "@/components/briefings/strategy-coverage-matrix"
    );
    const { container } = render(<StrategyCoverageMatrix />, { wrapper: TestWrapper });
    const legend = container.querySelector(".flex.flex-wrap.gap-4");
    expect(legend).toBeTruthy();
    const legendSpans = legend?.querySelectorAll(":scope > span") ?? [];
    expect(legendSpans.length).toBe(4);
    const text = legend?.textContent ?? "";
    expect(text).toContain("Supported");
    expect(text).toContain("Partial");
    expect(text).toContain("Blocked");
    expect(text).toContain("Not applicable");
  });

  it("resolves an emerald-500 (SUPPORTED) glyph for ML_DIRECTIONAL_CONTINUOUS x CEFI", async () => {
    const { StrategyCoverageMatrix } = await import(
      "@/components/briefings/strategy-coverage-matrix"
    );
    const subset: readonly StrategyArchetype[] = ["ML_DIRECTIONAL_CONTINUOUS"];
    const { container } = render(<StrategyCoverageMatrix archetypes={subset} />, {
      wrapper: TestWrapper,
    });
    // Category order in component: CEFI, DEFI, TRADFI, SPORTS, PREDICTION
    const dataCells = container.querySelectorAll("tbody td[title]");
    const firstGlyph = dataCells[0].querySelector("span.font-mono");
    expect(firstGlyph).toBeTruthy();
    expect(firstGlyph?.className).toContain("text-emerald-500");
    expect(firstGlyph?.textContent).toBe("\u25CF");
    // Title reflects the "Supported" state
    expect(dataCells[0].getAttribute("title")).toMatch(/Supported/);
  });
});
