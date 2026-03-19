import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResponsiveGrid } from "./responsive-grid";

describe("ResponsiveGrid", () => {
  it("renders children", () => {
    render(
      <ResponsiveGrid>
        <div>item 1</div>
        <div>item 2</div>
      </ResponsiveGrid>,
    );
    expect(screen.getByText("item 1")).toBeInTheDocument();
    expect(screen.getByText("item 2")).toBeInTheDocument();
  });

  it("applies display grid", () => {
    const { container } = render(
      <ResponsiveGrid>
        <div>child</div>
      </ResponsiveGrid>,
    );
    expect(container.firstElementChild).toHaveStyle({ display: "grid" });
  });

  it("uses default gap of 16px", () => {
    const { container } = render(
      <ResponsiveGrid>
        <div>child</div>
      </ResponsiveGrid>,
    );
    expect(container.firstElementChild).toHaveStyle({ gap: "16px" });
  });

  it("accepts custom gap", () => {
    const { container } = render(
      <ResponsiveGrid gap={24}>
        <div>child</div>
      </ResponsiveGrid>,
    );
    expect(container.firstElementChild).toHaveStyle({ gap: "24px" });
  });

  it("accepts custom minColWidth in grid-template-columns", () => {
    const { container } = render(
      <ResponsiveGrid minColWidth={200}>
        <div>child</div>
      </ResponsiveGrid>,
    );
    const style = (container.firstElementChild as HTMLElement).style;
    expect(style.gridTemplateColumns).toContain("200px");
  });

  it("accepts className", () => {
    const { container } = render(
      <ResponsiveGrid className="my-custom-grid">
        <div>child</div>
      </ResponsiveGrid>,
    );
    expect(container.firstElementChild).toHaveClass("my-custom-grid");
  });
});
