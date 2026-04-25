/**
 * Build a `/contact?service=X&action=Y` href from the visitor's current
 * pathname. Lets global CTAs (shell header "Book a call", footer "Contact",
 * briefing-gate "Contact us") carry the originating-page context forward so
 * the contact form prefills inquiry + message without the visitor re-stating
 * what they were just reading.
 *
 * Keys match `SERVICE_CONFIG` in `app/(public)/contact/page.tsx`.
 */

const PATH_TO_SERVICE: ReadonlyArray<{ prefix: string; service: string }> = [
  { prefix: "/platform/full", service: "dart-full" },
  { prefix: "/platform/signals-in", service: "dart-signals-in" },
  { prefix: "/platform", service: "platform" },
  { prefix: "/investment-management", service: "investment-management" },
  { prefix: "/signals", service: "signals-out" },
  { prefix: "/regulatory", service: "regulatory" },
  { prefix: "/briefings/dart-full", service: "dart-full" },
  { prefix: "/briefings/dart-signals-in", service: "dart-signals-in" },
  { prefix: "/briefings/signals-out", service: "signals-out" },
  { prefix: "/briefings/investment-management", service: "investment-management" },
  { prefix: "/briefings/regulatory", service: "regulatory" },
  { prefix: "/briefings/platform", service: "platform" },
];

export function contactHrefFromPath(pathname: string | null, action?: string): string {
  const path = pathname ?? "/";
  // Match the most-specific prefix first — order matters in the array above
  // because `/platform/full` must beat `/platform`.
  const entry = PATH_TO_SERVICE.find((e) => path === e.prefix || path.startsWith(`${e.prefix}/`)) ?? null;
  const service = entry?.service ?? "general";
  const params = new URLSearchParams({ service });
  if (action) params.set("action", action);
  return `/contact?${params.toString()}`;
}
