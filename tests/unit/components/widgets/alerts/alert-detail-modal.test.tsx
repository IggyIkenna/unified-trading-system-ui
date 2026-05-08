import { TestWrapper } from "@/tests/helpers/test-wrapper";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AlertDetailModal, runbookUrlFor } from "@/components/widgets/alerts/alert-detail-modal";
import type { Alert } from "@/components/widgets/alerts/alerts-data-context";

const baseAlert: Alert = {
  id: "alert-1",
  severity: "critical",
  status: "active",
  title: "Aave health factor critical",
  description: "Health factor 1.04 below 1.05 threshold",
  source: "risk-engine",
  entity: "RECURSIVE_STAKED_BASIS",
  alertType: "HEALTH_FACTOR_CRITICAL",
  timestamp: "2026-05-08T12:00:00Z",
  value: "1.04",
  threshold: "1.05",
  recommendedAction: "Reduce leverage; close debt position.",
};

describe("runbookUrlFor", () => {
  it("returns the playbook URL for known DeFi AlertCodes", () => {
    expect(runbookUrlFor("HEALTH_FACTOR_CRITICAL")).toBe(
      "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/15-runbooks/alerting/defi_health_factor_critical.md",
    );
    expect(runbookUrlFor("WEETH_DEPEG")).toBe(
      "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/15-runbooks/alerting/defi_weeth_depeg.md",
    );
    expect(runbookUrlFor("AAVE_UTILIZATION_SPIKE")).toBe(
      "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/15-runbooks/alerting/defi_aave_utilization_spike.md",
    );
    expect(runbookUrlFor("FUNDING_RATE_FLIP")).toBe(
      "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/15-runbooks/alerting/defi_funding_rate_flip.md",
    );
  });

  it("returns null for unmapped AlertCodes", () => {
    expect(runbookUrlFor("GENERIC")).toBeNull();
  });
});

describe("AlertDetailModal", () => {
  it("renders nothing when alert is null", () => {
    const { container } = render(<AlertDetailModal alert={null} open={true} onClose={() => {}} />, {
      wrapper: TestWrapper,
    });
    expect(container.querySelector("[data-testid=alert-detail-modal]")).toBeNull();
  });

  it("renders nothing when closed", () => {
    render(<AlertDetailModal alert={baseAlert} open={false} onClose={() => {}} />, {
      wrapper: TestWrapper,
    });
    expect(screen.queryByTestId("alert-detail-modal")).toBeNull();
  });

  it("shows alert code, severity, payload, and runbook link", () => {
    render(<AlertDetailModal alert={baseAlert} open={true} onClose={() => {}} />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByTestId("alert-detail-code").textContent).toBe("HEALTH_FACTOR_CRITICAL");
    expect(screen.getByText("Aave health factor critical")).toBeTruthy();
    expect(screen.getByText("1.04 / 1.05")).toBeTruthy();
    expect(screen.getByText("Reduce leverage; close debt position.")).toBeTruthy();

    const runbookLink = screen.getByTestId("alert-detail-runbook-link") as HTMLAnchorElement;
    expect(runbookLink.href).toContain("/codex/15-runbooks/alerting/defi_health_factor_critical.md");
    expect(runbookLink.target).toBe("_blank");
    expect(runbookLink.rel).toContain("noopener");
  });

  it("falls back to a missing-runbook hint for unmapped AlertCodes", () => {
    const generic: Alert = { ...baseAlert, alertType: "GENERIC" };
    render(<AlertDetailModal alert={generic} open={true} onClose={() => {}} />, {
      wrapper: TestWrapper,
    });
    expect(screen.queryByTestId("alert-detail-runbook-link")).toBeNull();
    const missing = screen.getByTestId("alert-detail-runbook-missing");
    expect(missing.textContent).toContain("GENERIC");
  });

  it("invokes onAcknowledge then closes when Acknowledge is clicked", () => {
    const onAcknowledge = vi.fn();
    const onClose = vi.fn();
    render(<AlertDetailModal alert={baseAlert} open={true} onClose={onClose} onAcknowledge={onAcknowledge} />, {
      wrapper: TestWrapper,
    });

    fireEvent.click(screen.getByTestId("alert-detail-ack"));

    expect(onAcknowledge).toHaveBeenCalledWith("alert-1");
    expect(onClose).toHaveBeenCalled();
  });

  it("hides Escalate when severity is critical", () => {
    render(<AlertDetailModal alert={baseAlert} open={true} onClose={() => {}} onEscalate={() => {}} />, {
      wrapper: TestWrapper,
    });
    expect(screen.queryByTestId("alert-detail-escalate")).toBeNull();
  });

  it("shows Escalate for non-critical active alerts", () => {
    const onEscalate = vi.fn();
    const onClose = vi.fn();
    const high: Alert = { ...baseAlert, severity: "high" };
    render(<AlertDetailModal alert={high} open={true} onClose={onClose} onEscalate={onEscalate} />, {
      wrapper: TestWrapper,
    });
    fireEvent.click(screen.getByTestId("alert-detail-escalate"));
    expect(onEscalate).toHaveBeenCalledWith(high);
    expect(onClose).toHaveBeenCalled();
  });

  it("invokes onResolve when Resolve is clicked", () => {
    const onResolve = vi.fn();
    const onClose = vi.fn();
    render(<AlertDetailModal alert={baseAlert} open={true} onClose={onClose} onResolve={onResolve} />, {
      wrapper: TestWrapper,
    });
    fireEvent.click(screen.getByTestId("alert-detail-resolve"));
    expect(onResolve).toHaveBeenCalledWith("alert-1");
    expect(onClose).toHaveBeenCalled();
  });

  it("disables actions when isBatchMode is true", () => {
    render(
      <AlertDetailModal
        alert={baseAlert}
        open={true}
        onClose={() => {}}
        onAcknowledge={() => {}}
        onResolve={() => {}}
        isBatchMode={true}
      />,
      { wrapper: TestWrapper },
    );
    expect((screen.getByTestId("alert-detail-ack") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("alert-detail-resolve") as HTMLButtonElement).disabled).toBe(true);
  });

  it("hides Acknowledge when status is acknowledged", () => {
    const acked: Alert = { ...baseAlert, status: "acknowledged" };
    render(
      <AlertDetailModal alert={acked} open={true} onClose={() => {}} onAcknowledge={() => {}} onResolve={() => {}} />,
      { wrapper: TestWrapper },
    );
    expect(screen.queryByTestId("alert-detail-ack")).toBeNull();
    expect(screen.getByTestId("alert-detail-resolve")).toBeTruthy();
  });
});
