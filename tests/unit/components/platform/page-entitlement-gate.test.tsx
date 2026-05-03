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

/**
 * 2026-04-28 DART tile-split (C.2): instrument-type / asset-group gating.
 * The `requiredInstrumentTypes` + `requiredAssetGroups` props are the new
 * primary gating signal for trading sub-domain pages. They resolve
 * asynchronously via `instrumentTypesForUser(user, mode)` so the gate
 * optimistically renders children during in-flight, then swaps to FOMO
 * overlay once the lookup completes (failing-closed on error).
 *
 * SSOT: codex/14-playbooks/dart/dart-terminal-vs-research.md.
 */

// Mock the derivation lib: every test below controls the user's derived
// instrument-types + asset-groups via the mock. Admin wildcard bypasses
// happen UPSTREAM (in the gate's isAdmin() short-circuit), so the mock
// never gets called for admin tests.
const instrumentTypesForUserMock =
  vi.fn<
    (user: unknown, mode: "reality" | "fomo") => Promise<{ instrumentTypes: Set<string>; assetGroups: Set<string> }>
  >();

vi.mock("@/lib/architecture-v2/user-instrument-types", () => ({
  instrumentTypesForUser: (...args: [unknown, "reality" | "fomo"]) => instrumentTypesForUserMock(...args),
}));

import { vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";

describe("PageEntitlementGate — instrument-type gating (C.2)", () => {
  beforeEach(() => {
    instrumentTypesForUserMock.mockReset();
  });

  afterEach(() => {
    instrumentTypesForUserMock.mockReset();
  });

  it("admin (wildcard) bypasses the FOMO overlay regardless of derivation result", async () => {
    // Admin short-circuit at render time (`isAdmin() || isInternal()` returns
    // children before the gate-decision branch). The useEffect still fires +
    // calls the lookup (it's not gated on admin internally), but admin's
    // children are already rendered — the lookup result is never consulted
    // for the gating decision.
    instrumentTypesForUserMock.mockResolvedValue({
      instrumentTypes: new Set<string>(),
      assetGroups: new Set<string>(),
    });
    renderGate("admin", {
      requiredInstrumentTypes: ["option", "future"],
      featureName: "Options",
      children: <ChildContent />,
    });
    expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
    expect(screen.queryByText(/requires an upgrade/i)).toBeNull();
  });

  it("user with matching instrument_type unlocks the page (FOMO mode default)", async () => {
    instrumentTypesForUserMock.mockResolvedValue({
      instrumentTypes: new Set(["option", "spot"]),
      assetGroups: new Set(["CEFI"]),
    });
    renderGate("client-full", {
      requiredInstrumentTypes: ["option", "future"],
      featureName: "Options",
      children: <ChildContent />,
    });
    // Optimistic render: children visible from frame 1
    expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
    // After async resolution: still unlocked
    await waitFor(() => {
      expect(instrumentTypesForUserMock).toHaveBeenCalledWith(expect.anything(), "fomo");
    });
    expect(screen.queryByText(/Options requires an upgrade/i)).toBeNull();
  });

  it("user without matching instrument_type sees FOMO overlay after async resolution", async () => {
    instrumentTypesForUserMock.mockResolvedValue({
      instrumentTypes: new Set(["spot", "perp"]),
      assetGroups: new Set(["CEFI"]),
    });
    renderGate("client-full", {
      requiredInstrumentTypes: ["option", "future"],
      featureName: "Options",
      children: <ChildContent />,
    });
    await waitFor(() => {
      expect(screen.getByText(/Options requires an upgrade/i)).toBeTruthy();
    });
  });

  it("requiredAssetGroups: SPORTS gate unlocks for sports-strategy user", async () => {
    instrumentTypesForUserMock.mockResolvedValue({
      instrumentTypes: new Set(["fixed_odds"]),
      assetGroups: new Set(["SPORTS"]),
    });
    renderGate("client-full", {
      requiredAssetGroups: ["SPORTS"],
      featureName: "Sports",
      children: <ChildContent />,
    });
    await waitFor(() => {
      expect(instrumentTypesForUserMock).toHaveBeenCalled();
    });
    expect(screen.queryByText(/Sports requires an upgrade/i)).toBeNull();
  });

  it("requiredAssetGroups: SPORTS gate locks DeFi-only user", async () => {
    instrumentTypesForUserMock.mockResolvedValue({
      instrumentTypes: new Set(["perp"]),
      assetGroups: new Set(["DEFI"]),
    });
    renderGate("client-full", {
      requiredAssetGroups: ["SPORTS"],
      featureName: "Sports",
      children: <ChildContent />,
    });
    await waitFor(() => {
      expect(screen.getByText(/Sports requires an upgrade/i)).toBeTruthy();
    });
  });

  it("derivationMode='reality' (explicit, non-default) is forwarded to the lib", async () => {
    instrumentTypesForUserMock.mockResolvedValue({
      instrumentTypes: new Set(["option"]),
      assetGroups: new Set(["CEFI"]),
    });
    renderGate("client-full", {
      requiredInstrumentTypes: ["option"],
      derivationMode: "reality",
      featureName: "Options",
      children: <ChildContent />,
    });
    await waitFor(() => {
      expect(instrumentTypesForUserMock).toHaveBeenCalledWith(expect.anything(), "reality");
    });
  });

  it("lookup failure falls back to empty sets (gate stays closed; never silently unlocks)", async () => {
    instrumentTypesForUserMock.mockRejectedValue(new Error("GCS proxy unavailable"));
    renderGate("client-full", {
      requiredInstrumentTypes: ["option"],
      featureName: "Options",
      children: <ChildContent />,
    });
    // Failed promise → gate sees empty sets → FOMO overlay
    await waitFor(() => {
      expect(screen.getByText(/Options requires an upgrade/i)).toBeTruthy();
    });
  });

  it("requiredAssetGroups + requiredInstrumentTypes: BOTH must match (intersection semantics)", async () => {
    // User has option instrument_type but NOT in CEFI/TRADFI asset_groups —
    // gate should still pass because instrumentTypeMatch is enough on its own
    // when only one signal is set; assetGroupMatch defaults true on empty.
    instrumentTypesForUserMock.mockResolvedValue({
      instrumentTypes: new Set(["option"]),
      assetGroups: new Set(["DEFI"]),
    });
    renderGate("client-full", {
      requiredInstrumentTypes: ["option"],
      requiredAssetGroups: ["CEFI", "TRADFI"],
      featureName: "Options",
      children: <ChildContent />,
    });
    // Both lists set → both must match. instrumentType matches but asset_group
    // doesn't → FOMO overlay.
    await waitFor(() => {
      expect(screen.getByText(/Options requires an upgrade/i)).toBeTruthy();
    });
  });
});
