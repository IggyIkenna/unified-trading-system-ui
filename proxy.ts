import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MARKETING_ROUTES: Record<string, string> = {
  "/": "/homepage.html",
  "/investment-management": "/strategies.html",
  "/platform": "/platform.html",
  "/regulatory": "/regulatory.html",
  "/firm": "/firm.html",
  "/contact": "/contact.html",
};

const PLATFORM_PREFIXES = ["/dashboard", "/services/", "/admin", "/api/"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PLATFORM_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const staticFile = MARKETING_ROUTES[pathname];
  if (staticFile) {
    return NextResponse.rewrite(new URL(staticFile, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/investment-management", "/platform", "/regulatory", "/firm", "/contact"],
};
