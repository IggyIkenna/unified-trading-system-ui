import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "odum_session";
const protectedPaths = ["/portal", "/admin", "/presentations"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiresAuth = protectedPaths.some((path) => pathname.startsWith(path));
  if (!requiresAuth) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*", "/presentations/:path*"],
};
