import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("renders with placeholder", () => {
    render(<Input placeholder="Enter value" />);
    expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
  });

  it("fires onChange", async () => {
    const handler = vi.fn();
    render(<Input onChange={handler} />);
    await userEvent.type(screen.getByRole("textbox"), "hello");
    expect(handler).toHaveBeenCalled();
  });

  it("is disabled when disabled prop set", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("has px-3.5 padding class", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toHaveClass("px-3.5");
  });

  it("applies color-scheme-dark class for date type", () => {
    render(<Input type="date" data-testid="date-input" />);
    expect(screen.getByTestId("date-input")).toHaveClass("color-scheme-dark");
  });

  it("does not apply color-scheme-dark for text type", () => {
    render(<Input type="text" />);
    expect(screen.getByRole("textbox")).not.toHaveClass("color-scheme-dark");
  });
});
