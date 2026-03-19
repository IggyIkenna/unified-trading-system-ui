import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SidebarNavItem, SidebarNavSection } from "./sidebar-nav";
import { SidebarNav } from "./sidebar-nav";

const flatItems: SidebarNavItem[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "positions", label: "Positions" },
  { id: "disabled-item", label: "Disabled", disabled: true },
];

const sections: SidebarNavSection[] = [
  {
    id: "section-a",
    label: "Section A",
    items: [{ id: "item-a1", label: "Item A1" }],
  },
  {
    id: "section-b",
    label: "Section B",
    items: [{ id: "item-b1", label: "Item B1" }],
  },
];

describe("SidebarNav — flat items", () => {
  it("renders all nav item labels", () => {
    render(<SidebarNav items={flatItems} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Positions")).toBeInTheDocument();
  });

  it("calls onSelect with item id when clicked", async () => {
    const handler = vi.fn();
    render(<SidebarNav items={flatItems} onSelect={handler} />);
    await userEvent.click(screen.getByText("Dashboard"));
    expect(handler).toHaveBeenCalledWith("dashboard");
  });

  it("does not call onSelect for disabled items", async () => {
    const handler = vi.fn();
    render(<SidebarNav items={flatItems} onSelect={handler} />);
    await userEvent.click(screen.getByText("Disabled"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("marks active item with active class", () => {
    render(<SidebarNav items={flatItems} activeId="positions" />);
    const btn = screen.getByText("Positions").closest("button");
    expect(btn).toHaveClass("active");
  });

  it("renders header when provided", () => {
    render(<SidebarNav items={flatItems} header={<div>nav header</div>} />);
    expect(screen.getByText("nav header")).toBeInTheDocument();
  });

  it("renders footer when provided", () => {
    render(<SidebarNav items={flatItems} footer={<div>nav footer</div>} />);
    expect(screen.getByText("nav footer")).toBeInTheDocument();
  });
});

describe("SidebarNav — sections", () => {
  it("renders section labels", () => {
    render(<SidebarNav sections={sections} />);
    expect(screen.getByText("Section A")).toBeInTheDocument();
    expect(screen.getByText("Section B")).toBeInTheDocument();
  });

  it("renders items within sections", () => {
    render(<SidebarNav sections={sections} />);
    expect(screen.getByText("Item A1")).toBeInTheDocument();
    expect(screen.getByText("Item B1")).toBeInTheDocument();
  });

  it("renders section divider between sections", () => {
    const { container } = render(<SidebarNav sections={sections} />);
    const divider = container.querySelector(".mx-4.my-1.h-px");
    expect(divider).toBeInTheDocument();
  });
});
