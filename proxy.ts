import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Legacy staging hook: marketing HTML used to be rewritten from `public/*.html` for
 * selected hosts. Marketing now lives on real App Router routes under `(public)` with
 * `SiteHeader` / auth; keep this module as a no-op pass-through for tests and any
 * future host-based routing.
 */
export function proxy(request: NextRequest) {
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/investment-management",
    "/platform",
    "/regulatory",
    "/who-we-are",
    "/contact",
    "/briefings",
  ],
};
