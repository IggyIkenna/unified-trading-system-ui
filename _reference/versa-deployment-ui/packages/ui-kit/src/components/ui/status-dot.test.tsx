import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusDot } from "./status-dot";

describe("StatusDot", () => {
  it.each([
    "success",
    "error",
    "warning",
    "running",
    "pending",
    "info",
  ] as const)("renders variant %s without crashing", (variant) => {
    const { container } = render(<StatusDot variant={variant} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<StatusDot label="Running" />);
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("does not render label text when not provided", () => {
    const { container } = render(<StatusDot />);
    expect(container.querySelectorAll("span").length).toBe(2); // outer + dot, no label span
  });

  it("adds animate-pulse class when pulse prop is true", () => {
    const { container } = render(<StatusDot pulse />);
    const dot = container.querySelector(".animate-pulse");
    expect(dot).toBeInTheDocument();
  });

  it("does not have animate-pulse class by default", () => {
    const { container } = render(<StatusDot />);
    expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });
});
