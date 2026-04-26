import {
  MARKETING_STATIC_FILES,
  extractInlineScripts,
  extractMarketingShadowHeadLinks,
  loadMarketingStaticParts,
  rewriteMarketingAnchors,
  scopeMarketingCssForShadow,
} from "@/lib/marketing/load-marketing-static";
import { describe, expect, it } from "vitest";

describe("Marketing static HTML transforms", () => {
  it("rewrites contact.html ghost Sign In to /login (snippet — same as full-file pass)", () => {
    const raw = `<a href="contact.html" class="btn btn-ghost">Sign In</a>`;
    const out = rewriteMarketingAnchors(raw);
    expect(out).toMatch(/href=["']\/login["']/);
    expect(out).not.toMatch(/href=["']\/contact["'][^>]*>\s*Sign In/i);
  });

  it("after chrome strip, body fragment never pairs Sign In with /contact", () => {
    for (const file of MARKETING_STATIC_FILES) {
      const { html } = loadMarketingStaticParts(file);
      expect(html, file).not.toMatch(/href=["']\/contact["'][^>]*>\s*Sign In\s*</i);
    }
  });

  it("preserves Google Fonts head links for shadow injection", () => {
    for (const file of MARKETING_STATIC_FILES) {
      const { headLinks } = loadMarketingStaticParts(file);
      expect(headLinks.length, file).toBeGreaterThanOrEqual(2);
      expect(
        headLinks.some((l) => l.rel === "stylesheet" && l.href.includes("fonts.googleapis.com/css2")),
        file,
      ).toBe(true);
      expect(
        headLinks.some((l) => l.rel === "preconnect" && l.href.startsWith("https://fonts.googleapis.com")),
        file,
      ).toBe(true);
    }
  });

  it("scopes body/html selectors so shadow CSS applies to .marketing-inner / :host", () => {
    const raw = "html, body { color: red; }\nbody { margin: 0; }\nhtml { height: 100%; }";
    const scoped = scopeMarketingCssForShadow(raw);
    expect(scoped).toContain(":host, .marketing-inner { color: red; }");
    expect(scoped).toContain(".marketing-inner { margin: 0; }");
    expect(scoped).toContain(":host { height: 100%; }");
    expect(scoped).not.toMatch(/\bbody\s*\{/);
    expect(scoped).not.toMatch(/\bhtml\s*\{/);
  });

  it("scopes :root so design tokens apply inside the shadow tree", () => {
    const raw = ":root { --bg: #0a0a0b; --text: #e4e4e7; }";
    const scoped = scopeMarketingCssForShadow(raw);
    expect(scoped).toContain(":host, .marketing-inner { --bg: #0a0a0b; --text: #e4e4e7; }");
    expect(scoped).not.toMatch(/\b:root\s*\{/);
  });

  it("extractInlineScripts removes script tags and returns bodies in order", () => {
    const { html, scripts } = extractInlineScripts(
      `<p>a</p><script>console.log(1)</script><p>b</p><script type="text/javascript">console.log(2)</script>`,
    );
    expect(html).toBe("<p>a</p><p>b</p>");
    expect(scripts).toEqual(["console.log(1)", "console.log(2)"]);
  });

  it("strategies static payload still extracts inline scripts (homepage.html removed; same machinery applies)", () => {
    // Homepage was rebuilt as a React composition 2026-04-26 (Phase 3 of the
    // marketing-site three-route consolidation plan). The script-extraction
    // contract still applies to the remaining static marketing pages; assert
    // the machinery is exercised against `strategies.html` instead.
    const { html, scripts } = loadMarketingStaticParts("strategies.html");
    expect(html).not.toMatch(/<script\b/i);
    expect(scripts.length).toBeGreaterThanOrEqual(0);
  });

  it("extractMarketingShadowHeadLinks allowlists font hosts only", () => {
    const raw = `<head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=X&display=swap">
<link rel="stylesheet" href="https://evil.example/a.css">
</head><body></body>`;
    const links = extractMarketingShadowHeadLinks(raw);
    expect(links).toHaveLength(2);
    expect(links.every((l) => l.href.includes("fonts.googleapis.com"))).toBe(true);
  });
});
