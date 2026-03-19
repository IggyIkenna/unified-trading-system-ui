import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>RUNNING</Badge>);
    expect(screen.getByText("RUNNING")).toBeInTheDocument();
  });

  it("has whitespace-nowrap class", () => {
    render(<Badge>COMPLETED</Badge>);
    expect(screen.getByText("COMPLETED")).toHaveClass("whitespace-nowrap");
  });

  it("has px-2.5 padding class", () => {
    render(<Badge>TEST</Badge>);
    expect(screen.getByText("TEST")).toHaveClass("px-2.5");
  });

  it.each([
    "default",
    "success",
    "error",
    "warning",
    "running",
    "pending",
    "info",
    "outline",
  ] as const)("renders variant %s without crashing", (variant) => {
    render(<Badge variant={variant}>{variant}</Badge>);
    expect(screen.getByText(variant)).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    render(<Badge className="custom-class">X</Badge>);
    expect(screen.getByText("X")).toHaveClass("custom-class");
  });
});
