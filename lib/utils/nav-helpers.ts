import type { ServiceTab } from "@/components/shell/service-tabs";

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
