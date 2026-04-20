import { describe, expect, it } from "vitest";

import {
  MARKETING_STATIC_FILES,
  extractInlineScripts,
  extractMarketingShadowHeadLinks,
  rewriteMarketingAnchors,
  scopeMarketingCssForShadow,
} from "@/lib/marketing/load-marketing-static";

describe("MARKETING_STATIC_FILES allowlist", () => {
  it("has the expected marketing pages", () => {
    expect(MARKETING_STATIC_FILES).toContain("homepage.html");
    expect(MARKETING_STATIC_FILES).toContain("strategies.html");
    expect(MARKETING_STATIC_FILES).toContain("platform.html");
  });
});

describe("extractMarketingShadowHeadLinks", () => {
  it("returns empty array if no <head> tag", () => {
    expect(extractMarketingShadowHeadLinks("<body></body>")).toEqual([]);
  });

  it("extracts allowed Google fonts preconnect", () => {
    const html = `
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      </head>
    `;
    const links = extractMarketingShadowHeadLinks(html);
    expect(links.length).toBe(2);
    expect(links[0].rel).toBe("preconnect");
    expect(links[0].href).toBe("https://fonts.googleapis.com");
  });

  it("extracts allowed stylesheet link and crossOrigin/media attributes", () => {
    const html = `
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter" crossorigin="anonymous" media="all">
      </head>
    `;
    const links = extractMarketingShadowHeadLinks(html);
    expect(links).toHaveLength(1);
    expect(links[0].rel).toBe("stylesheet");
    expect(links[0].crossOrigin).toBe("anonymous");
    expect(links[0].media).toBe("all");
  });

  it("recognises 'use-credentials' crossOrigin", () => {
    const html = `
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin="use-credentials">
      </head>
    `;
    const links = extractMarketingShadowHeadLinks(html);
    expect(links[0].crossOrigin).toBe("use-credentials");
  });

  it("drops links with unknown rel values", () => {
    const html = `
      <head>
        <link rel="icon" href="https://example.com/favicon.ico">
      </head>
    `;
    expect(extractMarketingShadowHeadLinks(html)).toEqual([]);
  });

  it("drops links that are not HTTPS", () => {
    const html = `
      <head>
        <link rel="stylesheet" href="http://fonts.googleapis.com/css?family=Inter">
      </head>
    `;
    expect(extractMarketingShadowHeadLinks(html)).toEqual([]);
  });

  it("drops stylesheet links outside the fonts.googleapis.com allowlist", () => {
    const html = `
      <head>
        <link rel="stylesheet" href="https://evil.example.com/style.css">
      </head>
    `;
    expect(extractMarketingShadowHeadLinks(html)).toEqual([]);
  });

  it("drops preconnect links outside the fonts allowlist", () => {
    const html = `
      <head>
        <link rel="preconnect" href="https://evil.example.com">
      </head>
    `;
    expect(extractMarketingShadowHeadLinks(html)).toEqual([]);
  });

  it("skips links missing rel or href", () => {
    const html = `
      <head>
        <link href="https://fonts.googleapis.com">
        <link rel="preconnect">
      </head>
    `;
    expect(extractMarketingShadowHeadLinks(html)).toEqual([]);
  });

  it("decodes &amp; entities in href", () => {
    const html = `
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter&amp;display=swap">
      </head>
    `;
    const links = extractMarketingShadowHeadLinks(html);
    expect(links[0].href).toContain("&display=swap");
    expect(links[0].href).not.toContain("&amp;");
  });
});

describe("scopeMarketingCssForShadow", () => {
  it("rewrites :root selector", () => {
    const out = scopeMarketingCssForShadow(":root { --bg: black; }");
    expect(out).toContain(":host, .marketing-inner {");
  });

  it("rewrites html,body combined selector", () => {
    const out = scopeMarketingCssForShadow("html, body { margin: 0; }");
    expect(out).toContain(":host, .marketing-inner {");
  });

  it("rewrites body,html combined selector", () => {
    const out = scopeMarketingCssForShadow("body, html { padding: 0; }");
    expect(out).toContain(".marketing-inner, :host {");
  });

  it("rewrites plain html selector", () => {
    const out = scopeMarketingCssForShadow("html { color: white; }");
    expect(out).toContain(":host {");
  });

  it("rewrites plain body selector", () => {
    const out = scopeMarketingCssForShadow("body { color: white; }");
    expect(out).toContain(".marketing-inner {");
  });

  it("leaves unrelated selectors untouched", () => {
    const out = scopeMarketingCssForShadow(".card { padding: 1rem; }");
    expect(out).toBe(".card { padding: 1rem; }");
  });
});

describe("extractInlineScripts", () => {
  it("extracts inline script body and strips the tag", () => {
    const html = `<div>hi</div><script>console.log("hello")</script><p>done</p>`;
    const { html: cleaned, scripts } = extractInlineScripts(html);
    expect(scripts).toEqual([`console.log("hello")`]);
    expect(cleaned).toBe(`<div>hi</div><p>done</p>`);
  });

  it("extracts multiple scripts in order", () => {
    const html = `<script>a()</script><div>x</div><script> b() </script>`;
    const { scripts } = extractInlineScripts(html);
    expect(scripts).toEqual(["a()", "b()"]);
  });

  it("returns empty scripts array when no <script> tags", () => {
    const { html, scripts } = extractInlineScripts("<p>no scripts</p>");
    expect(scripts).toEqual([]);
    expect(html).toBe("<p>no scripts</p>");
  });

  it("handles script tag with attributes", () => {
    const html = `<script type="text/javascript" async>doThing();</script>`;
    const { scripts } = extractInlineScripts(html);
    expect(scripts).toEqual(["doThing();"]);
  });
});

describe("rewriteMarketingAnchors", () => {
  it("rewrites homepage.html → /", () => {
    const out = rewriteMarketingAnchors('<a href="homepage.html">home</a>');
    expect(out).toBe('<a href="/">home</a>');
  });

  it("rewrites ./strategies.html → /investment-management", () => {
    const out = rewriteMarketingAnchors('<a href="./strategies.html">s</a>');
    expect(out).toBe('<a href="/investment-management">s</a>');
  });

  it("rewrites platform.html with an anchor fragment", () => {
    const out = rewriteMarketingAnchors('<a href="platform.html#features">platform</a>');
    expect(out).toContain('href="/platform#features"');
  });

  it("rewrites /contact → /login for Sign In links", () => {
    const out = rewriteMarketingAnchors(`<a class="btn" href="/contact">Sign In</a>`);
    expect(out).toBe(`<a class="btn" href="/login">Sign In</a>`);
  });

  it("rewrites regulatory.html and who-we-are.html", () => {
    expect(rewriteMarketingAnchors('<a href="regulatory.html">r</a>')).toContain('href="/regulatory"');
    expect(rewriteMarketingAnchors('<a href="who-we-are.html">f</a>')).toContain('href="/who-we-are"');
    expect(rewriteMarketingAnchors('<a href="firm.html">f</a>')).toContain('href="/who-we-are"');
  });

  it("rewrites contact.html → /contact", () => {
    expect(rewriteMarketingAnchors('<a href="contact.html">c</a>')).toContain('href="/contact"');
  });

  it("rewrites favicon src paths to root-absolute", () => {
    const out = rewriteMarketingAnchors(`<link rel="icon" href="x"><img src="favicon-16x16.png">`);
    expect(out).toContain('src="/favicon-16x16.png"');
  });

  it("rewrites favicon src paths with single quotes", () => {
    const out = rewriteMarketingAnchors(`<img src='favicon-32x32.png'>`);
    expect(out).toContain("src='/favicon-32x32.png'");
  });

  it("leaves unrelated links alone", () => {
    const html = '<a href="https://example.com">external</a>';
    expect(rewriteMarketingAnchors(html)).toBe(html);
  });
});
