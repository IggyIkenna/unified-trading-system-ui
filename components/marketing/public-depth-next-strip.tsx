"use client";

import { CALENDLY_URL } from "@/lib/marketing/calendly";
import Link from "next/link";

const linkClass =
  "font-medium text-cyan-400 underline-offset-2 transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded-sm";

const mutedClass = "text-zinc-400";

/**
 * Persistent strip under the public site header — dark bar, cyan links (one visual
 * system with `public/homepage.html` marketing pages).
 *
 * Order matches the prospect flow chronologically:
 *   1. Questionnaire — captures who they are and emails them a Deep Dive code
 *   2. Briefings    — pre-call narrative + IP / strategy / regulatory depth
 *   3. Book         — Calendly first-call slot
 */
export function PublicDepthNextStrip() {
  return (
    <div
      className="sticky top-14 z-40 border-b border-white/10 bg-zinc-950/95 backdrop-blur"
      data-testid="public-depth-next-strip"
    >
      <div className="container flex items-center justify-end px-4 py-2 text-xs md:px-6">
        <p className={`shrink-0 text-center text-[11px] leading-snug sm:text-right sm:text-xs ${mutedClass}`}>
          <span className="text-zinc-500">Next:</span>{" "}
          <Link href="/questionnaire" className={linkClass}>
            Questionnaire
          </Link>
          <span className="px-0.5 text-zinc-600" aria-hidden>
            →
          </span>
          <Link href="/briefings" className={linkClass}>
            Briefings
          </Link>
          <span className="px-0.5 text-zinc-600" aria-hidden>
            →
          </span>
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Book
          </a>
        </p>
      </div>
    </div>
  );
}

/**
 * Mobile thumb zone — same visibility gate as the top strip; hidden on briefings / auth.
 */
export function PublicMobileNextStepsBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-zinc-950/95 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      aria-label="Next steps"
      data-testid="public-mobile-next-steps"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-center gap-1.5 text-xs font-medium">
        <Link
          href="/questionnaire"
          className="min-h-9 flex-1 rounded-md border border-white/10 bg-zinc-900/90 px-1 py-2 text-center text-cyan-400 hover:border-cyan-500/50 hover:bg-zinc-900"
        >
          Form
        </Link>
        <Link
          href="/briefings"
          className="min-h-9 flex-1 rounded-md border border-white/10 bg-zinc-900/90 px-1 py-2 text-center text-cyan-400 hover:border-cyan-500/50 hover:bg-zinc-900"
        >
          Briefings
        </Link>
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-9 flex-1 rounded-md border border-white/10 bg-zinc-900/90 px-1 py-2 text-center text-cyan-400 hover:border-cyan-500/50 hover:bg-zinc-900"
        >
          Book
        </a>
      </div>
    </nav>
  );
}
