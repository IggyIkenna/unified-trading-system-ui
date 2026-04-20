/**
 * Lighter-gate (pre-commitment) narrative — v1 structured content, no PDFs.
 * Source: five-space IA plan; keep wording aligned with public marketing (real positioning).
 *
 * Each pillar now carries a `tldr` (one-sentence cut-through for BriefingHero) and a
 * `cta` (single primary CTA surfaced above the fold). The existing `summary` + `bullets`
 * remain as-is so the longer body is unchanged — G1.12 is a layout-only polish.
 *
 * Codex SSOT: unified-trading-pm/codex/14-playbooks/experience/briefings-hub.md
 */

export interface BriefingCta {
  readonly label: string;
  readonly href: string;
}

export interface BriefingPillar {
  slug: "investment-management" | "regulatory" | "platform";
  title: string;
  tldr: string;
  summary: string;
  bullets: readonly string[];
  cta: BriefingCta;
}

/** Shared primary CTA across all briefings — "Book 45-minute call" per briefings-hub.md. */
const BOOK_SECOND_CALL: BriefingCta = {
  label: "Book 45-minute call",
  href: "/contact",
};

export const BRIEFING_PILLARS: readonly BriefingPillar[] = [
  {
    slug: "investment-management",
    title: "Investment management",
    tldr:
      "Odum allocates client capital to strategies run on Odum's own infrastructure, with reporting on the same surface Odum uses internally.",
    summary:
      "How we run discretionary and systematic sleeves, what allocators see in the strategy catalogue, and how performance is communicated.",
    bullets: [
      "Signed-in Investment management is catalogue-first: strategies, returns profiles, and drill-down detail.",
      "Public pages describe the service; the catalogue is the investable surface after onboarding.",
    ],
    cta: BOOK_SECOND_CALL,
  },
  {
    slug: "regulatory",
    title: "Regulatory",
    tldr:
      "Odum operates regulated activity for clients under its own FCA permissions — the umbrella is a specific scope, not a blanket cover.",
    summary:
      "FCA authorisation scope, how client assets and reporting fit the regulatory perimeter, and what stays outside the umbrella.",
    bullets: [
      "Engagement paths are explicit: marketing, briefings, investor relations, platform operations.",
      "Material for boards lives under Investor Relations with entitlement controls.",
    ],
    cta: BOOK_SECOND_CALL,
  },
  {
    slug: "platform",
    title: "Platform",
    tldr:
      "DART is the data, analytics, research and trading stack Odum operates internally, packaged for clients to run their own systematic activity on.",
    summary:
      "Operational stack for builders: data, research, promotion, trading, reporting, and observation — distinct from picking a strategy to invest in.",
    bullets: [
      "Signed-in Platform reuses the same identity as Investment management; navigation separates job-to-be-done.",
      "Mock or labelling for fixtures is environment-scoped — not a global “sample site” banner.",
    ],
    cta: BOOK_SECOND_CALL,
  },
] as const;
