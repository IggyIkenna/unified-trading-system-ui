/**
 * Pure helpers extracted from scripts/orphan-audit.ts so they can be unit-tested
 * without executing the top-level scanner.
 *
 * Behaviour MUST match the in-scanner implementation byte-for-byte — the scanner
 * imports from this module and re-exports nothing else.
 *
 * Covered helpers:
 *   - filePathToRoute(absPath, appDir): strip route groups + page/route file
 *     segment → canonical Next.js URL path.
 *   - routeToMatcher(route): Next.js route-pattern → RegExp (handles dynamic
 *     segments `[slug]`, required catch-all `[...slug]`, optional catch-all
 *     `[[...slug]]`).
 *   - resolveTemplate(rawTpl, constMap): substitute `${NAME}` tokens using a
 *     caller-supplied constant map, leaving unknown tokens as `__PARAM__`.
 */

import { relative } from "node:path";

/**
 * Convert an absolute file path (e.g. `<repo>/app/(platform)/dashboard/page.tsx`)
 * into its Next.js URL route (`/dashboard`).
 *
 * - Strips the `page.tsx` / `page.ts` / `route.ts` / `route.tsx` / `.jsx` file.
 * - Strips route-group wrappers `(name)` — org-only, not part of the URL.
 * - Preserves dynamic `[slug]`, catch-all `[...slug]`, and optional catch-all
 *   `[[...slug]]` segments verbatim.
 */
export function filePathToRoute(absPath: string, appDir: string): string {
  const rel = relative(appDir, absPath).replace(/\\/g, "/");
  // Strip the file segment (page.tsx / route.ts / etc.). Anchor allows a root
  // page.tsx (no preceding slash) to strip cleanly — otherwise app/page.tsx
  // would resolve to "/page.tsx" instead of "/".
  const withoutFile = rel.replace(/(^|\/)(page|route)\.(tsx?|jsx?)$/, "");
  // Strip route groups "(name)" — they are org-only, do not appear in the URL
  const segments = withoutFile.split("/").filter(
    (seg) => seg && !(seg.startsWith("(") && seg.endsWith(")")),
  );
  return "/" + segments.join("/");
}

/**
 * Convert a Next.js route pattern to a regex that matches concrete URL paths.
 *
 *   `[[...slug]]` → `.*`     (optional catch-all, zero or more segments)
 *   `[...slug]`   → `.+`     (required catch-all, one or more segments)
 *   `[slug]`      → `[^/]+`  (single segment)
 *   other chars   → escaped literally
 *
 * Trailing slash is tolerated.
 */
export function routeToMatcher(route: string): RegExp {
  // We need optional-catch-all segments `[[...slug]]` to also match the bare
  // parent path (e.g. `/docs/[[...slug]]` should match `/docs`), so we mark
  // them with a sentinel and rewrite the preceding `/` as optional during the
  // join step below. Required catch-all `[...slug]` (one-or-more segments) and
  // dynamic single-segment `[slug]` are emitted inline.
  const OPTIONAL_CATCH_ALL = "\x00OPT\x00";
  const parts = route.split("/").map((seg) => {
    if (/^\[\[\.\.\.[^\]]+\]\]$/.test(seg)) return OPTIONAL_CATCH_ALL;
    if (/^\[\.\.\.[^\]]+\]$/.test(seg)) return ".+";
    if (/^\[[^\]]+\]$/.test(seg)) return "[^/]+";
    return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  });
  // Join, then rewrite `/<sentinel>` into `(?:/.*)?` so the preceding slash
  // is also optional. Standalone sentinel (rare — a route consisting only of
  // `[[...slug]]`) becomes `.*`.
  let joined = parts.join("/");
  joined = joined
    .replace(new RegExp("/" + OPTIONAL_CATCH_ALL, "g"), "(?:/.*)?")
    .replace(new RegExp(OPTIONAL_CATCH_ALL, "g"), ".*");
  return new RegExp("^" + joined + "/?$");
}

/**
 * Substitute `${NAME}` tokens in a raw template-literal body using a constant
 * map. Unknown identifiers become the string literal `__PARAM__`, which the
 * scanner later normalises into a single dynamic segment.
 *
 * The map is passed in so this helper is pure — no module-level closure state.
 */
export function resolveTemplate(
  rawTpl: string,
  constMap: ReadonlyMap<string, string>,
): string {
  return rawTpl.replace(/\$\{([^}]+)\}/g, (_, expr: string) => {
    const ident = expr.trim();
    const resolved = constMap.get(ident);
    return resolved ?? "__PARAM__";
  });
}
