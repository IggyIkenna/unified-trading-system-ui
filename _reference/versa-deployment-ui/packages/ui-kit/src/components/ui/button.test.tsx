import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("fires onClick", async () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", async () => {
    const handler = vi.fn();
    render(
      <Button disabled onClick={handler}>
        Click
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("is disabled when disabled prop set", () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it.each([
    "default",
    "destructive",
    "outline",
    "ghost",
    "secondary",
    "link",
  ] as const)("renders variant %s without crashing", (variant) => {
    render(<Button variant={variant}>{variant}</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it.each(["default", "sm", "lg", "icon", "icon-sm"] as const)(
    "renders size %s without crashing",
    (size) => {
      render(<Button size={size}>B</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    },
  );

  it("icon-sm size has h-7 w-7 classes", () => {
    render(<Button size="icon-sm">B</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-7", "w-7");
  });
});
