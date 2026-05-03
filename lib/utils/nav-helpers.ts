import type { ServiceTab } from "@/components/shell/service-tabs";
import { serializeWorkspaceScope } from "@/lib/architecture-v2/workspace-scope";
import type { WorkspaceScope } from "@/lib/architecture-v2/workspace-scope";

/** Active state for a service tab (exact vs prefix match, optional matchPrefix). */
export function isServiceTabActive(pathname: string, tab: ServiceTab): boolean {
  const matchPath = tab.matchPrefix || tab.href;
  return tab.exact
    ? pathname === tab.href || pathname === `${tab.href}/`
    : pathname === tab.href || pathname.startsWith(`${matchPath}/`);
}

/** Generic path active: exact match or nested under href. */
export function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Append the active WorkspaceScope to an href as a query string, preserving
 * any existing query params and hash. Per dart_ux_cockpit_refactor_2026_04_29
 * §7: every internal navigation link should preserve scope via this helper.
 *
 * Existing query params on the href take precedence over scope-derived params
 * (so explicit overrides win). The hash fragment is preserved.
 */
export function linkWithScope(href: string, scope: WorkspaceScope): string {
  const scopeParams = serializeWorkspaceScope(scope);
  if (Object.keys(scopeParams).length === 0) return href;

  const [pathPart, hashPart] = (() => {
    const hashIdx = href.indexOf("#");
    if (hashIdx === -1) return [href, ""];
    return [href.slice(0, hashIdx), href.slice(hashIdx)];
  })();

  const qIdx = pathPart.indexOf("?");
  const path = qIdx === -1 ? pathPart : pathPart.slice(0, qIdx);
  const existingQuery = qIdx === -1 ? "" : pathPart.slice(qIdx + 1);

  const merged = new URLSearchParams();
  // Scope params first (so existing params override)
  for (const [k, v] of Object.entries(scopeParams)) {
    merged.set(k, v);
  }
  if (existingQuery.length > 0) {
    const existing = new URLSearchParams(existingQuery);
    existing.forEach((value, key) => {
      merged.set(key, value);
    });
  }

  const qs = merged.toString();
  return `${path}${qs.length > 0 ? `?${qs}` : ""}${hashPart}`;
}
