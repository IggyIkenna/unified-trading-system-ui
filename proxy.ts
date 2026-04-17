import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const STAGING_HOSTS = ["odum-research.co.uk", "www.odum-research.co.uk"];

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
