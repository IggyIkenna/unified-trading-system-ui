"use client";

import { Analytics } from "@vercel/analytics/react";

/**
 * Only mounts when NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS=true.
 * Prevents 404s to /_vercel/insights/script.js on Firebase Hosting, local dev, etc.
 * On Vercel, enable Web Analytics in the project dashboard, set this env var, then redeploy.
 */
export function OptionalVercelAnalytics() {
  if (process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS !== "true") {
    return null;
  }
  return <Analytics />;
}
