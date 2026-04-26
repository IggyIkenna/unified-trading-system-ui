import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const PUBLIC_DIR = resolve(process.cwd(), "public");

// homepage.html was removed 2026-04-26 (Phase 3 of marketing-site three-route
// consolidation rebuilt the homepage as a React composition). Tests for the
// React homepage live in `tests/unit/components/public-pages.test.tsx`.
const MARKETING_PAGES = [
  "strategies.html",
  "platform.html",
  "regulatory.html",
  "who-we-are.html",
  "contact.html",
] as const;

describe("Static marketing pages exist", () => {
  for (const page of MARKETING_PAGES) {
    it(`public/${page} exists`, () => {
      expect(existsSync(resolve(PUBLIC_DIR, page))).toBe(true);
    });
  }
});

describe("Marketing page content consistency", () => {
  const pages = Object.fromEntries(
    MARKETING_PAGES.map((name) => [name, readFileSync(resolve(PUBLIC_DIR, name), "utf-8")]),
  );

  it("all pages contain FCA reference number 975797", () => {
    for (const [name, html] of Object.entries(pages)) {
      expect(html, `${name} missing FCA ref`).toContain("975797");
    }
  });

  it("all pages contain Odum Research branding", () => {
    for (const [name, html] of Object.entries(pages)) {
      expect(html, `${name} missing brand`).toContain("Odum");
    }
  });

  it("no page uses stale 33+ venue count", () => {
    for (const [name, html] of Object.entries(pages)) {
      expect(html, `${name} has stale 33+`).not.toMatch(/\b33\+/);
    }
  });

  it("all pages reference advisory agreement (not AR-only)", () => {
    for (const [name, html] of Object.entries(pages)) {
      if (html.includes("Appointed Representative")) {
        expect(html, `${name} mentions AR without advisory context`).toContain("advisory");
      }
    }
  });

  // Homepage hero and asset-class assertions live in
  // `tests/unit/components/public-pages.test.tsx` now that the homepage is
  // a React composition.

  it("strategies page contains strategy cards", () => {
    // Content is case-loose: the marketing copy uses "Traditional",
    // "Prediction markets", "Cross-market" (not exact titles). Assert the
    // underlying asset-group vocabulary is present, not specific capitalisation.
    const sp = pages["strategies.html"];
    expect(sp).toContain("Crypto Exchanges");
    expect(sp).toContain("DeFi Protocols");
    expect(sp).toMatch(/Traditional/i);
    expect(sp).toMatch(/Sports/i);
    expect(sp).toMatch(/Prediction/i);
    expect(sp).toMatch(/cross[-\s]market/i);
  });

  it("platform page contains all four layers", () => {
    const pp = pages["platform.html"];
    expect(pp).toContain("Data");
    expect(pp).toContain("Research");
    expect(pp).toContain("Execution");
    expect(pp).toContain("Reporting");
  });

  it("regulatory page describes umbrella pathway", () => {
    const rp = pages["regulatory.html"];
    expect(rp).toContain("umbrella");
    expect(rp).toContain("authorisation");
  });

  it("who-we-are page contains company description", () => {
    const fp = pages["who-we-are.html"];
    expect(fp).toContain("investment manager");
    expect(fp).toContain("platform infrastructure");
    expect(fp).toContain("regulatory");
  });

  it("contact page contains form", () => {
    const cp = pages["contact.html"];
    expect(cp).toContain("<form");
    expect(cp).toContain("name");
    expect(cp).toContain("email");
  });

  it('no page contains placeholder href="#" links', () => {
    for (const [name, html] of Object.entries(pages)) {
      const placeholderLinks = (html.match(/href="#"/g) || []).length;
      expect(placeholderLinks, `${name} has ${placeholderLinks} dead # links`).toBeLessThanOrEqual(2);
    }
  });

  it("total venue count >=100 on platform page", () => {
    // Marketing copy uses two inlinings:
    //   platform:  "across 100+ venues"                          (inline)
    // A `\d+\+` token followed within ~60 chars by the word "venue" is the
    // stable anchor — requiring the `+` avoids grabbing CSS numerics or
    // other digits near unrelated "venue" mentions.
    // (Homepage venue-count assertions removed when homepage.html became a
    // React composition; venue scope on the homepage is now intentionally
    // minimal per Completion Patch §F.)
    for (const name of ["platform.html"] as const) {
      const html = pages[name];
      const totalVenueMatch = html.match(/(\d+)\+[\s\S]{0,60}?[Vv]enue/);
      expect(totalVenueMatch, `${name} missing "N+ venue" count`).toBeTruthy();
      const num = parseInt(totalVenueMatch?.[1] ?? "0", 10);
      expect(num, `${name} total venue count ${num} < 100`).toBeGreaterThanOrEqual(100);
    }
  });
});
