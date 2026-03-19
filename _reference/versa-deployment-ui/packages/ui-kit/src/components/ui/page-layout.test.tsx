import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageLayout } from "./page-layout";

describe("PageLayout", () => {
  it("renders children in content area", () => {
    render(<PageLayout>main content</PageLayout>);
    expect(screen.getByText("main content")).toBeInTheDocument();
  });

  it("renders sidebar when provided", () => {
    render(<PageLayout sidebar={<div>sidebar content</div>}>main</PageLayout>);
    expect(screen.getByText("sidebar content")).toBeInTheDocument();
  });

  it("does not render sidebar slot when not provided", () => {
    const { container } = render(<PageLayout>main</PageLayout>);
    expect(screen.queryByText("sidebar content")).not.toBeInTheDocument();
    // Verify only the content column is present (no sibling flex child for sidebar)
    const flexChildren = container.firstElementChild?.children ?? [];
    expect(flexChildren.length).toBe(1);
  });

  it("renders header when provided", () => {
    render(<PageLayout header={<span>header slot</span>}>main</PageLayout>);
    expect(screen.getByText("header slot")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(
      <PageLayout className="my-class">main</PageLayout>,
    );
    expect(container.firstChild).toHaveClass("my-class");
  });
});
