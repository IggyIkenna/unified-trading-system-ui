/**
 * Unit tests for <ServiceTile> — Refactor G1.3 LOCKED-VISIBLE mode.
 *
 * Asserts the three-state closed enum behaves as spec:
 *   - "unlocked"         → clickable Link, no padlock, data-lock-state="unlocked".
 *   - "padlocked-visible" → padlock icon visible, aria-disabled="true",
 *                           tooltip copy reachable, NO navigation on click.
 *   - "hidden"           → returns null (no DOM node rendered).
 *
 * Also asserts the per-tile Playwright hooks (`data-testid`, `data-lock-state`)
 * are present so the downstream e2e spec can reliably query them.
 */

import { TestWrapper } from "@/tests/helpers/test-wrapper";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ServiceDefinition } from "@/lib/config/services";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const SERVICE_FIXTURE: ServiceDefinition = {
  key: "research",
  label: "Research",
  description: "Strategy backtesting and ML model training.",
  href: "/services/research/overview",
  lifecycleStage: "build",
  requiredEntitlements: ["strategy-full"],
  icon: "FlaskConical",
  internalOnly: false,
  subRoutes: [],
};

describe("ServiceTile — G1.3 three-state lockState enum", () => {
  it("renders as a clickable Link when lockState='unlocked'", async () => {
    const { ServiceTile } = await import("@/components/services/ServiceTile");
    render(<ServiceTile service={SERVICE_FIXTURE} lockState="unlocked" />, {
      wrapper: TestWrapper,
    });
    const tile = screen.getByTestId("service-tile-research");
    expect(tile.getAttribute("data-lock-state")).toBe("unlocked");
    // Post 2026-04-21 — ServiceTile wraps a <Link> around the primary
    // CardContent so the outer Card can host the chip row without nesting
    // <a> inside <a>. Href lives on the inner primary link.
    const primaryLink = screen.getByTestId("service-tile-research-primary");
    expect(primaryLink.getAttribute("href")).toBe("/services/research/overview");
    // Padlock must not appear on the unlocked tile.
    expect(screen.queryByTestId("service-tile-research-padlock")).toBeNull();
  });

  it("defaults to lockState='unlocked' when the prop is omitted", async () => {
    const { ServiceTile } = await import("@/components/services/ServiceTile");
    render(<ServiceTile service={SERVICE_FIXTURE} />, { wrapper: TestWrapper });
    const tile = screen.getByTestId("service-tile-research");
    expect(tile.getAttribute("data-lock-state")).toBe("unlocked");
  });

  it("renders a padlock + request-access badge + aria-disabled when lockState='padlocked-visible'", async () => {
    const { ServiceTile } = await import("@/components/services/ServiceTile");
    render(
      <ServiceTile service={SERVICE_FIXTURE} lockState="padlocked-visible" />,
      { wrapper: TestWrapper },
    );
    const tile = screen.getByTestId("service-tile-research");
    expect(tile.getAttribute("data-lock-state")).toBe("padlocked-visible");
    expect(tile.getAttribute("aria-disabled")).toBe("true");
    expect(tile.getAttribute("aria-label")).toContain("locked");
    expect(tile.getAttribute("aria-label")).toContain("request access");
    // Padlock icon and request-access badge are present.
    expect(screen.getByTestId("service-tile-research-padlock")).toBeTruthy();
    expect(
      screen.getByTestId("service-tile-research-request-access-badge"),
    ).toBeTruthy();
    // The padlocked tile does NOT render an <a> (no navigation).
    expect(tile.tagName.toLowerCase()).not.toBe("a");
  });

  it("returns null (no DOM) when lockState='hidden'", async () => {
    const { ServiceTile } = await import("@/components/services/ServiceTile");
    const { container } = render(
      <ServiceTile service={SERVICE_FIXTURE} lockState="hidden" />,
      { wrapper: TestWrapper },
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("service-tile-research")).toBeNull();
  });

  it("exposes data-testid + data-lock-state hooks Playwright can query", async () => {
    const { ServiceTile } = await import("@/components/services/ServiceTile");
    render(<ServiceTile service={SERVICE_FIXTURE} lockState="padlocked-visible" />, {
      wrapper: TestWrapper,
    });
    const tile = screen.getByTestId("service-tile-research");
    expect(tile.getAttribute("data-testid")).toBe("service-tile-research");
    expect(tile.getAttribute("data-lock-state")).toBe("padlocked-visible");
  });
});

describe("tile-lock-state helpers", () => {
  it("padlockTooltipCopy returns the canonical copy with default package", async () => {
    const { padlockTooltipCopy } = await import(
      "@/lib/visibility/tile-lock-state"
    );
    expect(padlockTooltipCopy()).toBe("Available on full DART; contact sales");
  });

  it("padlockTooltipCopy interpolates the package name", async () => {
    const { padlockTooltipCopy } = await import(
      "@/lib/visibility/tile-lock-state"
    );
    expect(padlockTooltipCopy("IM")).toBe("Available on IM; contact sales");
  });

  it("TILE_LOCK_STATES enumerates exactly three closed values", async () => {
    const { TILE_LOCK_STATES } = await import(
      "@/lib/visibility/tile-lock-state"
    );
    expect([...TILE_LOCK_STATES]).toEqual([
      "unlocked",
      "padlocked-visible",
      "hidden",
    ]);
  });

  it("useTileLockState module exports the hook", async () => {
    // Superseded by G1.7 restriction-profile engine. Hook is now a real React
    // hook calling useAuth(); covered by restriction-profile tests, not here.
    const mod = await import("@/lib/visibility/use-tile-lock-state");
    expect(typeof mod.useTileLockState).toBe("function");
  });
});
