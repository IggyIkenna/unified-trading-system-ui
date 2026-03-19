import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("renders unchecked by default", () => {
    render(<Checkbox />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("renders checked when defaultChecked", () => {
    render(<Checkbox defaultChecked />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("calls onCheckedChange when clicked", async () => {
    const handler = vi.fn();
    render(<Checkbox onCheckedChange={handler} />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(handler).toHaveBeenCalledWith(true);
  });

  it("has focus-visible ring classes", () => {
    render(<Checkbox />);
    expect(screen.getByRole("checkbox")).toHaveClass("focus-visible:ring-2");
  });

  it("is disabled when disabled prop set", () => {
    render(<Checkbox disabled />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });
});
