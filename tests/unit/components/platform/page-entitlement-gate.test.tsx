import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";
import { renderWithPersona } from "@/tests/helpers/persona-wrapper";

const CHILD_TEXT = "INSIDE_PAGE_CONTENT";
const ChildContent = () => <div>{CHILD_TEXT}</div>;

function renderGate(personaId: string | null, props: React.ComponentProps<typeof PageEntitlementGate>) {
  const { Wrapper } = renderWithPersona(personaId);
  return render(<PageEntitlementGate {...props} />, { wrapper: Wrapper });
}

describe("PageEntitlementGate — admin/internal bypass", () => {
  it("admin passes through without blur overlay", () => {
    renderGate("admin", {
      entitlement: { domain: "trading-defi", tier: "premium" },
      featureName: "DeFi",
      children: <ChildContent />,
    });
    expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
    expect(screen.queryByText(/requires an upgrade/i)).toBeNull();
  });

  it("internal-trader passes through without blur overlay", () => {
    renderGate("internal-trader", {
      entitlement: { domain: "trading-sports", tier: "premium" },
      featureName: "Sports",
      children: <ChildContent />,
    });
    expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
    expect(screen.queryByText(/requires an upgrade/i)).toBeNull();
  });
});

describe("PageEntitlementGate — FOMO overlay when locked", () => {
  it("locks client-data-only out of Trading pages with frosted overlay", () => {
    renderGate("client-data-only", {
      entitlement: { domain: "trading-defi", tier: "basic" },
      featureName: "DeFi Trading",
      children: <ChildContent />,
    });
    // Overlay message appears
    expect(screen.getByText(/DeFi Trading requires an upgrade/i)).toBeTruthy();
    // Children still rendered (behind blur) — this is the FOMO pattern
    expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
    // CTA button visible
    expect(screen.getByRole("button", { name: /get in touch/i })).toBeTruthy();
  });

  it("elysium-defi (defi-only) is locked out of Sports page", () => {
    renderGate("elysium-defi", {
      entitlement: { domain: "trading-sports", tier: "basic" },
      featureName: "Sports",
      children: <ChildContent />,
    });
    expect(screen.getByText(/Sports requires an upgrade/i)).toBeTruthy();
  });

  it("uses custom description when provided", () => {
    renderGate("client-data-only", {
      entitlement: { domain: "trading-options", tier: "basic" },
      featureName: "Options",
      description: "Custom lock message for options",
      children: <ChildContent />,
    });
    expect(screen.getByText("Custom lock message for options")).toBeTruthy();
  });
});

describe("PageEntitlementGate — unlocked content", () => {
  it("elysium-defi unlocks DeFi page", () => {
    renderGate("elysium-defi", {
      entitlement: { domain: "trading-defi", tier: "basic" },
      featureName: "DeFi",
      children: <ChildContent />,
    });
    expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
    expect(screen.queryByText(/requires an upgrade/i)).toBeNull();
  });

  it("client-full (premium) unlocks DeFi basic via tier hierarchy", () => {
    renderGate("client-full", {
      entitlement: { domain: "trading-defi", tier: "basic" },
      featureName: "DeFi",
      children: <ChildContent />,
    });
    expect(screen.queryByText(/requires an upgrade/i)).toBeNull();
  });

  it("client-full (premium) unlocks DeFi premium", () => {
    renderGate("client-full", {
      entitlement: { domain: "trading-defi", tier: "premium" },
      featureName: "DeFi Pro",
      children: <ChildContent />,
    });
    expect(screen.queryByText(/requires an upgrade/i)).toBeNull();
  });

  it("client-premium (basic) is locked out of premium-tier feature", () => {
    renderGate("client-premium", {
      entitlement: { domain: "trading-defi", tier: "premium" },
      featureName: "DeFi Pro",
      children: <ChildContent />,
    });
    expect(screen.getByText(/DeFi Pro requires an upgrade/i)).toBeTruthy();
  });
});

describe("PageEntitlementGate — fallback", () => {
  it("renders children when no entitlement required", () => {
    renderGate("client-data-only", {
      featureName: "Public",
      children: <ChildContent />,
    });
    expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
    expect(screen.queryByText(/requires an upgrade/i)).toBeNull();
  });
});
