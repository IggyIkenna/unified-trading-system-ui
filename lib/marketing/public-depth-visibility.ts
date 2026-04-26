/**
 * When to hide the public marketing depth strip + mobile next-steps bar.
 *
 * - Briefings + auth flows carry their own navigation.
 * - Story / our-story / who-we-are: editorial pages where a tiny top-right
 *   "Next: Questionnaire → Briefings → Book" breadcrumb reads as a
 *   disconnected UI artefact. Per user review 2026-04-26 the narrative
 *   surfaces should not display the depth strip.
 * - Engagement-route pages (/platform, /investment-management, /regulatory)
 *   carry their own on-page review-path strip directly under the hero,
 *   which does the breadcrumb job in a more composed way; the global
 *   strip is suppressed there too.
 */
export function shouldHidePublicDepthChrome(pathname: string | null): boolean {
  if (pathname == null || pathname.length === 0) return false;
  if (pathname === "/briefings" || pathname.startsWith("/briefings/")) {
    return true;
  }
  if (pathname === "/login" || pathname === "/signup" || pathname.startsWith("/reset")) {
    return true;
  }
  if (
    pathname === "/story" ||
    pathname === "/our-story" ||
    pathname === "/who-we-are" ||
    pathname === "/platform" ||
    pathname === "/investment-management" ||
    pathname === "/regulatory"
  ) {
    return true;
  }
  return false;
}
