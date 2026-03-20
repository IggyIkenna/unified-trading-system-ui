import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Staging auth middleware — simple username/password gate for demo sharing.
 * This does NOT replace the app's auth system (personas, entitlements, etc.)
 * This just prevents the public from accessing the staging deployment.
 *
 * Set STAGING_AUTH_ENABLED=true in environment to activate.
 * When disabled (default for local dev), this middleware is a no-op.
 */

const STAGING_USER = "odum"
const STAGING_PASS = "QGeF2!@61"
const AUTH_COOKIE = "staging-auth"

export function middleware(request: NextRequest) {
  // Skip if staging auth is not enabled (local dev, or production)
  if (process.env.STAGING_AUTH_ENABLED !== "true") {
    return NextResponse.next()
  }

  // Check if already authenticated via cookie
  const authCookie = request.cookies.get(AUTH_COOKIE)
  if (authCookie?.value === "authenticated") {
    return NextResponse.next()
  }

  // Check if this is the staging login form submission
  if (request.method === "POST" && request.nextUrl.pathname === "/staging-auth") {
    return NextResponse.next()
  }

  // Serve the staging login page for GET /staging-auth
  if (request.nextUrl.pathname === "/staging-auth") {
    return NextResponse.next()
  }

  // Skip static files and API routes
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Redirect to staging login
  const loginUrl = new URL("/staging-auth", request.url)
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
}
