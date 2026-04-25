/**
 * When to hide the public marketing depth strip + mobile next-steps bar
 * (briefings and auth flows carry their own navigation).
 */
export function shouldHidePublicDepthChrome(pathname: string | null): boolean {
  if (pathname == null || pathname.length === 0) return false;
  if (pathname === "/briefings" || pathname.startsWith("/briefings/")) {
    return true;
  }
  if (pathname === "/login" || pathname === "/signup" || pathname.startsWith("/reset")) {
    return true;
  }
  return false;
}
