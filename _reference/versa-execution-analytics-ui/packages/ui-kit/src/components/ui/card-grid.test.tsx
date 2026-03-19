import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardGrid } from "./card-grid";

describe("CardGrid", () => {
  it("renders children", () => {
    render(
      <CardGrid>
        <div>card 1</div>
        <div>card 2</div>
        <div>card 3</div>
      </CardGrid>,
    );
    expect(screen.getByText("card 1")).toBeInTheDocument();
    expect(screen.getByText("card 2")).toBeInTheDocument();
    expect(screen.getByText("card 3")).toBeInTheDocument();
  });

  it("applies grid display", () => {
    const { container } = render(
      <CardGrid>
        <div>card</div>
      </CardGrid>,
    );
    expect(container.firstElementChild).toHaveClass("grid");
  });

  it("uses default gap of 16px", () => {
    const { container } = render(
      <CardGrid>
        <div>card</div>
      </CardGrid>,
    );
    expect(container.firstElementChild).toHaveStyle({ gap: "16px" });
  });

  it("accepts custom gap", () => {
    const { container } = render(
      <CardGrid gap={24}>
        <div>card</div>
      </CardGrid>,
    );
    expect(container.firstElementChild).toHaveStyle({ gap: "24px" });
  });

  it("applies cols=2 responsive classes", () => {
    const { container } = render(
      <CardGrid cols={2}>
        <div>card</div>
      </CardGrid>,
    );
    expect(container.firstElementChild).toHaveClass("grid-cols-1");
    expect(container.firstElementChild).toHaveClass("sm:grid-cols-2");
  });

  it("applies cols=4 responsive classes", () => {
    const { container } = render(
      <CardGrid cols={4}>
        <div>card</div>
      </CardGrid>,
    );
    expect(container.firstElementChild).toHaveClass("grid-cols-1");
    expect(container.firstElementChild).toHaveClass("xl:grid-cols-4");
  });

  it("applies default cols=3", () => {
    const { container } = render(
      <CardGrid>
        <div>card</div>
      </CardGrid>,
    );
    expect(container.firstElementChild).toHaveClass("lg:grid-cols-3");
  });

  it("accepts className", () => {
    const { container } = render(
      <CardGrid className="my-grid">
        <div>card</div>
      </CardGrid>,
    );
    expect(container.firstElementChild).toHaveClass("my-grid");
  });
});
