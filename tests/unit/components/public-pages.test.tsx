import { readFileSync } from "node:fs";
import path from "node:path";

import { render } from "@testing-library/react";
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

// Public-facing marketing pages were restructured 2026-04 to load static HTML
// from `public/*.html` into a Shadow DOM via `<MarketingStaticFromFile>`. The
// previous JSX-component tests broke because:
//   1. Shadow DOM content is opaque to `screen.getByText` by default.
//   2. The copy in the static HTML has been updated (e.g. "FCA 975797" now,
//      not "FCA Authorised (975797)").
//
// New strategy: mount the page, assert the shadow-host + client subtree are
// rendered, then verify the authoritative marketing content by reading the
// static HTML file directly. That tests both the server-side loader contract
// AND the actual marketing copy without depending on Shadow-DOM internals.

const HOMEPAGE_HTML_PATH = path.join(process.cwd(), "public", "homepage.html");

function loadHomepageHtml(): string {
  return readFileSync(HOMEPAGE_HTML_PATH, "utf-8");
}

describe("Public pages — homepage shell", () => {
  it("homepage exports a default function component", async () => {
    const mod = await import("@/app/(public)/page");
    expect(typeof mod.default).toBe("function");
  });

  it("homepage renders the marketing shadow host", async () => {
    const mod = await import("@/app/(public)/page");
    const Page = mod.default;
    const { container } = render(<Page />, { wrapper: TestWrapper });
    // MarketingStaticShadow mounts a host with data-testid="marketing-static-host".
    // Its shadowRoot is populated by a ref callback; the host itself is always
    // present once React commits the tree.
    const host = container.querySelector("[data-testid='marketing-static-host']");
    expect(host).not.toBeNull();
  });
});

describe("Public pages — homepage marketing content (SSOT: public/homepage.html)", () => {
  it("contains the hero headline", () => {
    const html = loadHomepageHtml();
    expect(html).toContain("Odum Research");
    expect(html.toLowerCase()).toContain("unified trading infrastructure");
  });

  it("references the five asset groups section", () => {
    const html = loadHomepageHtml();
    expect(html).toContain("Five asset groups");
  });

  it("exposes the FCA authorisation number (975797)", () => {
    const html = loadHomepageHtml();
    expect(html).toMatch(/FCA[^<]{0,80}975797/);
  });

  it("lists the expected venue marquee pills", () => {
    const html = loadHomepageHtml();
    expect(html).toContain("Binance");
    expect(html).toContain("OKX");
    expect(html).toContain("Uniswap V3");
  });

  it("has Get Started and Book a Demo CTAs", () => {
    const html = loadHomepageHtml();
    expect(html).toContain("Get Started");
    expect(html).toContain("Book a Demo");
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
});
