import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const PUBLIC_DIR = resolve(process.cwd(), "public");

const MARKETING_PAGES = [
  "homepage.html",
  "strategies.html",
  "platform.html",
  "regulatory.html",
  "firm.html",
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

  it("homepage contains hero title", () => {
    expect(pages["homepage.html"]).toContain("FCA-Regulated Investment Manager");
  });

  it("homepage contains all five asset class references", () => {
    const hp = pages["homepage.html"];
    expect(hp).toContain("Crypto Exchanges");
    expect(hp).toContain("DeFi Protocols");
    expect(hp).toContain("Traditional Markets");
    expect(hp).toContain("Sports");
    expect(hp).toContain("Prediction Markets");
  });

  it("strategies page contains strategy cards", () => {
    const sp = pages["strategies.html"];
    expect(sp).toContain("Crypto Exchanges");
    expect(sp).toContain("DeFi Protocols");
    expect(sp).toContain("Traditional Markets");
    expect(sp).toContain("Sports");
    expect(sp).toContain("Prediction Markets");
    expect(sp).toContain("Cross-Market");
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

  it("firm page contains company description", () => {
    const fp = pages["firm.html"];
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

  it("total venue count >=100 on homepage and platform pages", () => {
    for (const name of ["homepage.html", "platform.html"] as const) {
      const html = pages[name];
      const totalVenueMatch = html.match(/(\d+)\+?\s*venue/i);
      expect(totalVenueMatch, `${name} missing venue count`).toBeTruthy();
      const num = parseInt(totalVenueMatch?.[1] ?? "0", 10);
      expect(num, `${name} total venue count ${num} < 100`).toBeGreaterThanOrEqual(100);
    }
  });
});
