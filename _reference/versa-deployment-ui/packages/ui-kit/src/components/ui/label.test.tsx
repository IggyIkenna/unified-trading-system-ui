import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./label";

describe("Label", () => {
  it("renders children", () => {
    render(<Label>My Label</Label>);
    expect(screen.getByText("My Label")).toBeInTheDocument();
  });

  it("renders as a label element", () => {
    render(<Label htmlFor="my-input">Field</Label>);
    const label = screen.getByText("Field");
    expect(label.tagName.toLowerCase()).toBe("label");
  });

  it("associates with input via htmlFor", () => {
    render(
      <>
        <Label htmlFor="inp">Email</Label>
        <input id="inp" />
      </>,
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    render(<Label className="custom">X</Label>);
    expect(screen.getByText("X")).toHaveClass("custom");
  });
});
