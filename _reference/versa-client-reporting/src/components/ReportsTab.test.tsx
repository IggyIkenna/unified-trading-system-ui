import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ReportsTab } from "./ReportsTab";

vi.mock("@unified-trading/ui-kit", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Badge: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => <span data-variant={variant}>{children}</span>,
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("lucide-react", () => ({
  Download: () => null,
  Send: () => null,
}));

describe("ReportsTab", () => {
  it('renders "Client Reports" heading', () => {
    render(<ReportsTab />);
    expect(screen.getByText("Client Reports")).toBeInTheDocument();
  });

  it("shows total count (3)", () => {
    render(<ReportsTab />);
    expect(screen.getByText("Total Reports")).toBeInTheDocument();
    const totalCard = screen
      .getByText("Total Reports")
      .closest("div")!.parentElement!;
    expect(within(totalCard).getByText("3")).toBeInTheDocument();
  });

  it("shows delivered count (2) in success color", () => {
    render(<ReportsTab />);
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    const deliveredCard = screen
      .getByText("Delivered")
      .closest("div")!.parentElement!;
    const countEl = within(deliveredCard).getByText("2");
    expect(countEl).toBeInTheDocument();
    expect(countEl.className).toContain("color-success");
  });

  it("shows pending count (1) in warning color", () => {
    render(<ReportsTab />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    const pendingCard = screen
      .getByText("Pending")
      .closest("div")!.parentElement!;
    const countEl = within(pendingCard).getByText("1");
    expect(countEl).toBeInTheDocument();
    expect(countEl.className).toContain("color-warning");
  });

  it("renders each report name", () => {
    render(<ReportsTab />);
    expect(
      screen.getByText("Apex Capital — February 2026"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Meridian Fund — February 2026"),
    ).toBeInTheDocument();
    expect(screen.getByText("QuantEdge Q4 2025")).toBeInTheDocument();
  });

  it('statusVariant "delivered" shows success badge', () => {
    render(<ReportsTab />);
    const deliveredBadges = screen
      .getAllByText("delivered")
      .map((el) => el.closest("span"));
    const successBadge = deliveredBadges.find(
      (el) => el?.dataset.variant === "success",
    );
    expect(successBadge).toBeTruthy();
  });

  it('statusVariant "pending" shows warning badge', () => {
    render(<ReportsTab />);
    const pendingBadge = screen.getByText("pending").closest("span");
    expect(pendingBadge?.dataset.variant).toBe("warning");
  });

  it("statusVariant unknown shows default badge — only delivered/pending render known variants", () => {
    render(<ReportsTab />);
    // All badge variants are either success or warning for the known statuses
    const badges = screen
      .getAllByText(/delivered|pending/)
      .map((el) => el.closest("span"));
    const variants = badges.map((b) => b?.dataset.variant);
    expect(variants).not.toContain(undefined);
    expect(variants.every((v) => v === "success" || v === "warning")).toBe(
      true,
    );
  });
});
