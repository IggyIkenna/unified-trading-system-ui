"use client";

import { X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

/**
 * Site-wide banner for non-production environments.
 *
 * Mounts only when `NEXT_PUBLIC_ENVIRONMENT_LABEL` is set (currently set to
 * "sandbox" in config/docker-build.env.uat; unset in .env.production so the
 * banner is absent on www.odum-research.com).
 *
 * Dismissible per-session via sessionStorage — deliberately not localStorage,
 * so a new tab / new visit re-shows it. The /contact CTA carries a
 * `?from=sandbox-banner` tag so inbound feedback is attributable.
 */
const DISMISS_KEY = "odum-sandbox-banner-dismissed";

export function SandboxBanner() {
  const envLabel = process.env.NEXT_PUBLIC_ENVIRONMENT_LABEL ?? "";
  const [mounted, setMounted] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
    }
  }, []);

  if (!envLabel) return null;
  if (mounted && dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Sandbox environment notice"
      className="sticky top-0 z-[60] w-full border-b border-amber-500/30 bg-amber-500/10 text-amber-100 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-4 py-2 text-xs sm:text-sm">
        <a
          href="https://www.odum-research.com"
          className="shrink-0 hidden sm:inline-flex items-center gap-1 rounded border border-amber-400/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/25 hover:text-amber-50 transition-colors"
        >
          ← Live site
        </a>
        <span className="inline-flex shrink-0 items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
          Sandbox
        </span>
        <p className="flex-1 leading-snug">
          Demo environment — data is simulated and sign-in uses demo accounts.
          The live public site is at{" "}
          <a
            href="https://www.odum-research.com"
            className="underline decoration-amber-400/60 underline-offset-2 hover:text-amber-50 hover:decoration-amber-300"
          >
            www.odum-research.com
          </a>
          .{" "}
          <Link
            href="/contact?from=sandbox-banner"
            className="underline decoration-amber-400/60 underline-offset-2 hover:text-amber-50 hover:decoration-amber-300"
          >
            Feedback &rarr;
          </Link>
        </p>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.sessionStorage.setItem(DISMISS_KEY, "1");
            }
            setDismissed(true);
          }}
          aria-label="Dismiss sandbox banner for this session"
          className="shrink-0 rounded p-1 text-amber-200/80 hover:bg-amber-500/15 hover:text-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}
