import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { cache } from "react";

/** Public marketing HTML files we allow loading from disk (allowlist). */
export const MARKETING_STATIC_FILES = [
  "homepage.html",
  "strategies.html",
  "platform.html",
  "signals.html",
  "regulatory.html",
  "who-we-are.html",
  "our-story.html",
  "story.html",
] as const;

export type MarketingStaticFilename = (typeof MARKETING_STATIC_FILES)[number];

const ALLOWLIST = new Set<string>(MARKETING_STATIC_FILES);

function assertAllowed(file: string): asserts file is MarketingStaticFilename {
  if (!ALLOWLIST.has(file)) {
    throw new Error(`Unsupported marketing HTML file: ${file}`);
  }
}

/**
 * Resolve `public/<file>` when `process.cwd()` is not the UI package root.
 * Common in monorepos / background shells (e.g. cwd is `client-reporting-api` while Next
 * still serves `unified-trading-system-ui`).
 */
function resolveMarketingFileAbsolute(file: string): string {
  const roots: string[] = [];
  const cwd = process.cwd();
  roots.push(cwd);
  roots.push(path.join(cwd, "unified-trading-system-ui"));
  roots.push(path.join(cwd, "..", "unified-trading-system-ui"));

  const seen = new Set<string>();
  for (const root of roots) {
    const normalized = path.normalize(root);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    const absolute = path.join(normalized, "public", file);
    if (existsSync(absolute)) return absolute;
  }

  throw new Error(
    `Marketing static file not found: ${file} (cwd=${cwd}; tried UI roots: ${Array.from(seen).join(" | ")})`,
  );
}

function collectStylesAndStrip(raw: string): { stripped: string; css: string } {
  const cssParts: string[] = [];
  const stripped = raw.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_m, css: string) => {
    cssParts.push(css);
    return "";
  });
  return { stripped, css: cssParts.join("\n\n") };
}

/** Serializable `<link>` rows we inject into the shadow tree (fonts, etc.). */
export type MarketingShadowHeadLink = {
  rel: string;
  href: string;
  crossOrigin?: "anonymous" | "use-credentials";
  media?: string;
};

function isAllowedMarketingHeadLink(href: string, rel: string): boolean {
  const hrefLower = href.trim().toLowerCase();
  const relLower = rel.trim().toLowerCase();
  if (!hrefLower.startsWith("https://")) return false;
  if (relLower === "preconnect") {
    return (
      hrefLower === "https://fonts.googleapis.com" ||
      hrefLower.startsWith("https://fonts.googleapis.com/") ||
      hrefLower === "https://fonts.gstatic.com" ||
      hrefLower.startsWith("https://fonts.gstatic.com/")
    );
  }
  if (relLower === "stylesheet") {
    return (
      hrefLower === "https://fonts.googleapis.com" ||
      hrefLower.startsWith("https://fonts.googleapis.com/")
    );
  }
  return false;
}

/**
 * Parse `<link>` tags from `<head>` so we can mount them in the shadow tree. Plain `public/*.html`
 * relied on `<head>` for Google Fonts; `loadMarketingStaticParts` previously dropped everything
 * outside `<body>`, so `--font-sans` / `--font-mono` never matched loaded faces.
 */
export function extractMarketingShadowHeadLinks(raw: string): MarketingShadowHeadLink[] {
  const headMatch = raw.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch) return [];

  const headInner = headMatch[1];
  const links: MarketingShadowHeadLink[] = [];
  const linkTagRe = /<link\b([^>]*?)\s*\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkTagRe.exec(headInner)) !== null) {
    const attrSource = m[1];
    const relMatch = attrSource.match(/\brel\s*=\s*(["'])([^"']*)\1/i);
    const hrefMatch = attrSource.match(/\bhref\s*=\s*(["'])([\s\S]*?)\1/i);
    const rel = relMatch?.[2]?.trim();
    const href = hrefMatch?.[2]?.trim().replace(/&amp;/g, "&");
    if (!rel || !href) continue;
    if (!isAllowedMarketingHeadLink(href, rel)) continue;

    const entry: MarketingShadowHeadLink = { rel, href };
    const crossMatch = attrSource.match(/\bcrossorigin\s*=\s*(["'])([^"']*)\1/i);
    if (crossMatch?.[2]) {
      const c = crossMatch[2].toLowerCase();
      if (c === "anonymous") entry.crossOrigin = "anonymous";
      else if (c === "use-credentials") entry.crossOrigin = "use-credentials";
    }
    const mediaMatch = attrSource.match(/\bmedia\s*=\s*(["'])([^"']*)\1/i);
    if (mediaMatch?.[2]) entry.media = mediaMatch[2];
    links.push(entry);
  }

  return links;
}

/**
 * Legacy marketing CSS targets `html` / `body`. Inside an open shadow root there is no document
 * body, so those rules matched nothing. Map them to the shadow host (`:host`) and inner wrapper
 * (`.marketing-inner`) so typography, background, and scroll styling apply again.
 */
export function scopeMarketingCssForShadow(css: string): string {
  let out = css;
  /** `:root` in a shadow stylesheet targets the document root in browsers — marketing vars never apply. Map to host + inner like `html`/`body`. */
  out = out.replace(/:root\s*{/gi, ":host, .marketing-inner {");
  out = out.replace(/\bhtml\s*,\s*body\s*{/gi, ":host, .marketing-inner {");
  out = out.replace(/\bbody\s*,\s*html\s*{/gi, ".marketing-inner, :host {");
  out = out.replace(/\bhtml\s*{/gi, ":host {");
  out = out.replace(/\bbody\s*{/gi, ".marketing-inner {");
  return out;
}

/** Inline `<script>` blocks do not run when HTML is assigned via `innerHTML`; extract and run them separately with a shadow `document` shim. */
export function extractInlineScripts(html: string): { html: string; scripts: string[] } {
  const scripts: string[] = [];
  const cleaned = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (_full, body: string) => {
    scripts.push(String(body).trim());
    return "";
  });
  return { html: cleaned, scripts };
}

/** Exported for tests — rewrites legacy `.html` paths and Sign In CTAs. */
export function rewriteMarketingAnchors(html: string): string {
  let out = html;
  const routes: Array<[string, string]> = [
    ["homepage.html", "/"],
    ["strategies.html", "/investment-management"],
    ["platform.html", "/platform"],
    ["regulatory.html", "/regulatory"],
    ["who-we-are.html", "/who-we-are"],
    ["firm.html", "/who-we-are"],
    ["contact.html", "/contact"],
  ];

  for (const [file, route] of routes) {
    const escaped = file.replace(/\./g, "\\.");
    out = out.replace(
      new RegExp(`href=(["'])(?:\\./)?${escaped}(#?[^"']*)\\1`, "gi"),
      (_m, q: string, frag: string) => `href=${q}${route}${frag}${q}`,
    );
  }

  // Static marketing used contact for "Sign In"; app shell uses /login.
  out = out.replace(
    /<a\b([^>]*)\bhref=(["'])\/contact\2([^>]*)>\s*Sign In\s*</gi,
    (_m, before: string, q: string, after: string) =>
      `<a${before}href=${q}/login${q}${after}>Sign In<`,
  );

  out = out.replace(/\bsrc="(favicon-[^"]+)"/gi, 'src="/$1"');
  out = out.replace(/\bsrc='(favicon-[^']+)'/gi, "src='/$1'");

  return out;
}

function stripMarketingChrome(bodyInner: string): string {
  let inner = bodyInner.trim();
  inner = inner.replace(/<header\b[\s\S]*?<\/header>/i, "");
  inner = inner.replace(/<footer\b[\s\S]*?<\/footer>/i, "");
  return inner.trim();
}

const SHADOW_SCOPED_TAIL = `
:root { color-scheme: dark; }
.marketing-inner {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100%;
}
`;

/**
 * Reads `public/<file>`, extracts all `<style>` blocks (including any in `<body>`),
 * strips duplicate header/footer chrome, rewrites legacy `.html` links to App Router paths,
 * and returns CSS + HTML suitable for a shadow-root mount (isolates global selectors).
 */
export const loadMarketingStaticParts = cache(
  (file: string): { css: string; html: string; headLinks: MarketingShadowHeadLink[]; scripts: string[] } => {
    assertAllowed(file);
    const absolute = resolveMarketingFileAbsolute(file);
    const raw = readFileSync(absolute, "utf8");
    const headLinks = extractMarketingShadowHeadLinks(raw);
    const { stripped, css } = collectStylesAndStrip(raw);
    const bodyMatch = stripped.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyInner = bodyMatch?.[1] ?? stripped;
    const rewritten = rewriteMarketingAnchors(stripMarketingChrome(bodyInner));
    const { html, scripts } = extractInlineScripts(rewritten);
    const scopedCss = scopeMarketingCssForShadow(css);
    return { css: `${scopedCss}\n${SHADOW_SCOPED_TAIL}`, html, headLinks, scripts };
  },
);
