import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Host header values for which we serve static marketing HTML from `public/`.
 * Staging / preview only: **do not** add odumresearch.com here until you intend
 * the public marketing bundle to replace the React landing on production.
 *
 * Includes both odumresearch.co.uk (no hyphen) and odum-research.co.uk (hyphen)
 * so DNS/CNAME variants hit the same rewrite table.
 */
const STAGING_HOSTS = [
  "odumresearch.co.uk",
  "www.odumresearch.co.uk",
  "odum-research.co.uk",
  "www.odum-research.co.uk",
];

const MARKETING_ROUTES: Record<string, string> = {
  "/": "/homepage.html",
  "/investment-management": "/strategies.html",
  "/platform": "/platform.html",
  "/regulatory": "/regulatory.html",
  "/firm": "/firm.html",
  "/contact": "/contact.html",
};

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.replace(/:\d+$/, "") ?? "";

  if (!STAGING_HOSTS.includes(host)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const staticFile = MARKETING_ROUTES[pathname];
  if (staticFile) {
    return NextResponse.rewrite(new URL(staticFile, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/investment-management", "/platform", "/regulatory", "/firm", "/contact"],
};
