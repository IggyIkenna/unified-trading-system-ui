import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EntitlementGate } from "@/components/platform/entitlement-gate";
import { renderWithPersona } from "@/__tests__/helpers/persona-wrapper";

const CHILD_TEXT = "SECRET_CONTENT_HERE";
const ChildContent = () => <div>{CHILD_TEXT}</div>;

function renderGate(personaId: string | null, props: React.ComponentProps<typeof EntitlementGate>) {
  const { Wrapper } = renderWithPersona(personaId);
  return render(<EntitlementGate {...props} />, { wrapper: Wrapper });
}

describe("EntitlementGate — admin/internal bypass", () => {
  it("admin sees children regardless of required entitlement", () => {
    renderGate("admin", {
      entitlement: { domain: "trading-defi", tier: "premium" },
      serviceName: "DeFi",
      children: <ChildContent />,
    });
    expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
  });

  it("internal-trader sees children regardless of required entitlement", () => {
    renderGate("internal-trader", {
      entitlement: { domain: "trading-options", tier: "premium" },
      serviceName: "Options",
      children: <ChildContent />,
    });
    expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
  });
});

describe("EntitlementGate — TradingEntitlement gating", () => {
  it("elysium-defi (has trading-defi) unlocks DeFi", () => {
    renderGate("elysium-defi", {
      entitlement: { domain: "trading-defi", tier: "basic" },
      serviceName: "DeFi",
      children: <ChildContent />,
    });
    expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
  });

  it("elysium-defi (no trading-sports) is locked out of Sports", () => {
    renderGate("elysium-defi", {
      entitlement: { domain: "trading-sports", tier: "basic" },
      serviceName: "Sports",
      children: <ChildContent />,
    });
    expect(screen.queryByText(CHILD_TEXT)).toBeNull();
    expect(screen.getByRole("heading", { name: /upgrade to access sports/i })).toBeTruthy();
  });

  it("client-full (premium) satisfies basic requirement via tier hierarchy", () => {
    renderGate("client-full", {
      entitlement: { domain: "trading-defi", tier: "basic" },
      serviceName: "DeFi",
      children: <ChildContent />,
    });
    expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
  });

  it("client-full (premium) satisfies premium requirement", () => {
    renderGate("client-full", {
      entitlement: { domain: "trading-defi", tier: "premium" },
      serviceName: "DeFi",
      children: <ChildContent />,
    });
    expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
  });

  it("client-premium (basic) does NOT satisfy premium requirement", () => {
    renderGate("client-premium", {
      entitlement: { domain: "trading-defi", tier: "premium" },
      serviceName: "DeFi",
      children: <ChildContent />,
    });
    expect(screen.queryByText(CHILD_TEXT)).toBeNull();
    expect(screen.getByRole("heading", { name: /upgrade to access defi/i })).toBeTruthy();
  });
});

describe("EntitlementGate — data-only persona", () => {
  it("client-data-only is locked out of all trading domains", () => {
    const domains = [
      "trading-common",
      "trading-defi",
      "trading-sports",
      "trading-options",
      "trading-predictions",
    ] as const;
    for (const domain of domains) {
      const { unmount } = renderGate("client-data-only", {
        entitlement: { domain, tier: "basic" },
        serviceName: domain,
        children: <ChildContent />,
      });
      expect(screen.queryByText(CHILD_TEXT)).toBeNull();
      unmount();
    }
  });

  it("client-data-only can still see data-basic gated content", () => {
    renderGate("client-data-only", {
      entitlement: "data-basic",
      serviceName: "Data",
      children: <ChildContent />,
    });
    expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
  });
});

describe("EntitlementGate — fallback behavior", () => {
  it("renders children when no entitlement is required", () => {
    renderGate("client-data-only", {
      serviceName: "Public",
      children: <ChildContent />,
    });
    expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
  });

  it("unauthenticated user is blocked from entitled content", () => {
    renderGate(null, {
      entitlement: { domain: "trading-defi", tier: "basic" },
      serviceName: "DeFi",
      children: <ChildContent />,
    });
    expect(screen.queryByText(CHILD_TEXT)).toBeNull();
  });
});
