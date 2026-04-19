import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  CategoryChip,
  InstrumentTypeChip,
  LockStateBadge,
  MaturityBadge,
  RollModeBadge,
  SignalVariantBadge,
  StatusBadge,
} from "@/components/architecture-v2";

describe("LockStateBadge", () => {
  it("renders PUBLIC with green styling", () => {
    render(<LockStateBadge state="PUBLIC" />);
    const badge = screen.getByTestId("lock-state-badge-PUBLIC");
    expect(badge).toHaveTextContent("Public");
    expect(badge.className).toContain("bg-green");
  });

  it("shows client_id on CLIENT_EXCLUSIVE", () => {
    render(<LockStateBadge state="CLIENT_EXCLUSIVE" clientId="client-alpha" />);
    const badge = screen.getByTestId("lock-state-badge-CLIENT_EXCLUSIVE");
    expect(badge).toHaveTextContent("Client exclusive");
    expect(badge).toHaveTextContent("client-alpha");
  });

  it("renders RETIRED with muted + line-through styling", () => {
    render(<LockStateBadge state="RETIRED" />);
    const badge = screen.getByTestId("lock-state-badge-RETIRED");
    expect(badge.className).toContain("line-through");
  });

  it("tooltip exposes reservingBusinessUnitId on IM_RESERVED", () => {
    render(
      <LockStateBadge
        state="INVESTMENT_MANAGEMENT_RESERVED"
        reservingBusinessUnitId="fund-alpha"
      />,
    );
    const badge = screen.getByTestId(
      "lock-state-badge-INVESTMENT_MANAGEMENT_RESERVED",
    );
    expect(badge.getAttribute("title")).toContain("fund-alpha");
  });
});

describe("MaturityBadge", () => {
  it("renders CODE_NOT_WRITTEN with dashed border", () => {
    render(<MaturityBadge maturity="CODE_NOT_WRITTEN" />);
    const badge = screen.getByTestId("maturity-badge-CODE_NOT_WRITTEN");
    expect(badge.className).toContain("border-dashed");
  });

  it("renders LIVE_ALLOCATED with green bg", () => {
    render(<MaturityBadge maturity="LIVE_ALLOCATED" />);
    const badge = screen.getByTestId("maturity-badge-LIVE_ALLOCATED");
    expect(badge.className).toContain("bg-green");
  });

  it("uses human-readable labels", () => {
    render(<MaturityBadge maturity="PAPER_TRADING_VALIDATED" />);
    expect(screen.getByText("Paper validated")).toBeInTheDocument();
  });
});

describe("StatusBadge + CategoryChip + InstrumentTypeChip + SignalVariantBadge + RollModeBadge", () => {
  it("StatusBadge renders each state", () => {
    const { rerender } = render(<StatusBadge status="SUPPORTED" />);
    expect(screen.getByTestId("status-badge-SUPPORTED")).toHaveTextContent(
      "Supported",
    );
    rerender(<StatusBadge status="BLOCKED" />);
    expect(screen.getByTestId("status-badge-BLOCKED")).toHaveTextContent(
      "Blocked",
    );
  });

  it("CategoryChip formats venue category", () => {
    render(<CategoryChip category="DEFI" />);
    expect(screen.getByTestId("category-chip-DEFI")).toHaveTextContent("DeFi");
  });

  it("InstrumentTypeChip uses the short label", () => {
    render(<InstrumentTypeChip instrumentType="dated_future" />);
    expect(screen.getByTestId("instrument-chip-dated_future")).toHaveTextContent(
      "Dated fut",
    );
  });

  it("SignalVariantBadge renders for every known variant", () => {
    render(<SignalVariantBadge variant="funding_rate" />);
    expect(
      screen.getByTestId("signal-variant-badge-funding_rate"),
    ).toHaveTextContent("Funding");
  });

  it("RollModeBadge shows rolling vs fixed vs both", () => {
    const { rerender } = render(<RollModeBadge rollMode="rolling" />);
    expect(screen.getByTestId("roll-mode-badge-rolling")).toHaveTextContent(
      "Rolling",
    );
    rerender(<RollModeBadge rollMode="both" />);
    expect(screen.getByTestId("roll-mode-badge-both")).toHaveTextContent(
      "Rolling + fixed",
    );
  });
});
