/**
 * Hostname-derived deployment environment helpers.
 *
 * These are always correct regardless of build-time env vars because they
 * read window.location.hostname at runtime. No mis-set NEXT_PUBLIC_APP_ENV
 * can make prod look like dev.
 *
 * SSOT for the three-axis model:
 *   codex/08-workflows/environment-mode-philosophy.md
 */

export type DeploymentEnv = "dev" | "staging" | "prod";

/** Derives environment from the current hostname at runtime (client) or
 *  NEXT_PUBLIC_APP_ENV env var fallback (SSR). */
export function getDeploymentEnv(): DeploymentEnv {
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".local")) {
      return "dev";
    }
    if (h.startsWith("uat.")) return "staging";
    return "prod";
  }
  // Server-side fallback
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "";
  if (appEnv.toUpperCase() === "STAGING") return "staging";
  if (appEnv.toUpperCase() === "PROD") return "prod";
  return "dev";
}

export function getEnvLabel(): "DEV" | "STAGING" | "PROD" {
  const e = getDeploymentEnv();
  return e === "dev" ? "DEV" : e === "staging" ? "STAGING" : "PROD";
}

/**
 * Public routes live under app/(public)/ and have no backend.
 * Data is always "real" on public pages — there is nothing to mock.
 */
export function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  const publicPrefixes = [
    "/investment-management",
    "/platform",
    "/regulatory",
    "/who-we-are",
    "/our-story",
    "/story",
    "/contact",
    "/briefings",
    "/services",
    "/signals",
    "/docs",
    "/questionnaire",
    "/health",
  ];
  return publicPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
