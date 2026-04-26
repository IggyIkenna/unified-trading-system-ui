import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TestWrapper } from "@/tests/helpers/test-wrapper";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

// Public homepage was rebuilt 2026-04-26 as a React composition (Phase 3 of
// `marketing_site_three_route_consolidation_2026_04_26.plan.md`). It no longer
// loads `public/homepage.html` via shadow-DOM. Tests now assert the React
// component tree directly: hero headline, three engagement-route cards, and
// the canonical CTA strings.

describe("Public pages — homepage shell", () => {
  it("homepage exports a default function component", async () => {
    const mod = await import("@/app/(public)/page");
    expect(typeof mod.default).toBe("function");
  });

  it("homepage renders the hero headline + primary CTA", async () => {
    const mod = await import("@/app/(public)/page");
    const Page = mod.default;
    render(<Page />, { wrapper: TestWrapper });
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Systematic strategies and trading infrastructure/i,
      }),
    ).toBeDefined();
    // Two "Start Your Review" CTAs (hero + final) and two "Contact Odum" CTAs.
    expect(screen.getAllByRole("link", { name: /Start Your Review/i }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("link", { name: /Contact Odum/i }).length).toBeGreaterThanOrEqual(2);
  });

  it("renders three engagement-route cards with marketing labels", async () => {
    const mod = await import("@/app/(public)/page");
    const Page = mod.default;
    render(<Page />, { wrapper: TestWrapper });
    expect(screen.getByText("Odum-Managed Strategies")).toBeDefined();
    expect(screen.getByText("DART Trading Infrastructure")).toBeDefined();
    expect(screen.getByText("Regulated Operating Models")).toBeDefined();
  });
});

describe("Public pages — homepage CTA discipline (Completion Patch §D)", () => {
  it("contains canonical primary CTAs", async () => {
    const mod = await import("@/app/(public)/page");
    const Page = mod.default;
    const { container } = render(<Page />, { wrapper: TestWrapper });
    const text = container.textContent ?? "";
    expect(text).toContain("Start Your Review");
    expect(text).toContain("Contact Odum");
  });

  it("does not use banned CTAs (Completion Patch §D)", async () => {
    const mod = await import("@/app/(public)/page");
    const Page = mod.default;
    const { container } = render(<Page />, { wrapper: TestWrapper });
    const text = container.textContent ?? "";
    // "Begin Questionnaire" is allowed only on /start-your-review.
    expect(text).not.toMatch(/\bGet Started\b/);
    expect(text).not.toMatch(/\bApply Now\b/);
    expect(text).not.toMatch(/\bRequest Demo\b/);
    expect(text).not.toMatch(/\bTake Questionnaire\b/);
    expect(text).not.toMatch(/\bSign Up\b/);
    expect(text).not.toMatch(/\bAccess Platform\b/);
    expect(text).not.toMatch(/\bLaunch Strategy\b/);
    expect(text).not.toMatch(/\bBegin Questionnaire\b/);
    // No direct "Book a call" CTA on the homepage (per Phase 3 / Decision §1).
    expect(text).not.toMatch(/\bBook a call\b/i);
    expect(text).not.toMatch(/\bBook a Demo\b/i);
  });
});

describe("Service pages export default functions", () => {
  it("investment-management page exports", async () => {
    const mod = await import("@/app/(public)/investment-management/page");
    expect(typeof mod.default).toBe("function");
  });

  it("platform page exports", async () => {
    const mod = await import("@/app/(public)/platform/page");
    expect(typeof mod.default).toBe("function");
  });

  it("regulatory page exports", async () => {
    const mod = await import("@/app/(public)/regulatory/page");
    expect(typeof mod.default).toBe("function");
  });

  it("who-we-are page exports", async () => {
    const mod = await import("@/app/(public)/who-we-are/page");
    expect(typeof mod.default).toBe("function");
  });

  it("start-your-review page exports", async () => {
    const mod = await import("@/app/(public)/start-your-review/page");
    expect(typeof mod.default).toBe("function");
  });
});
