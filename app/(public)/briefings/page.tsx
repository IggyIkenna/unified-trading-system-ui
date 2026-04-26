import { BriefingHero } from "@/components/briefings/briefing-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRIEFING_PILLARS, type BriefingPillar } from "@/lib/briefings/content";
import { CALENDLY_URL } from "@/lib/marketing/calendly";
import Link from "next/link";

export const metadata = {
  title: "Briefings | Odum Research",
  description:
    "The depth behind Odum's three routes — Odum-Managed Strategies, DART Trading Infrastructure, and Regulated Operating Models.",
};

/**
 * Index ordering — three canonical pillars per
 * marketing_site_three_route_consolidation_2026_04_26 plan Phase 4.
 *
 * Legacy slugs (`platform`, `dart-full`, `dart-signals-in`, `signals-out`,
 * `regulatory`) are intercepted by 301 redirects in next.config.mjs and never
 * reach this list. Risk-and-Governance and Working-with-Odum are NOT exposed
 * as pillars; their content folds into the existing pillars + the
 * "Working with Odum" inline section below per Decision 6 of the plan.
 *
 * Lobby copy: this hub is a routing concierge, not the briefing itself. Each
 * card carries a single-sentence framing — the full TLDR + sectioned briefing
 * lives one click away on /briefings/<slug>. Per user review 2026-04-26.
 */
const DISPLAY_ORDER: readonly BriefingPillar["slug"][] = [
  "investment-management",
  "dart-trading-infrastructure",
  "regulated-operating-models",
];

const ORDERED_PILLARS: readonly BriefingPillar[] = DISPLAY_ORDER.flatMap((slug) => {
  const pillar = BRIEFING_PILLARS.find((p) => p.slug === slug);
  return pillar ? [pillar] : [];
});

/**
 * Two-sentence card descriptions for the lobby. The hub gives enough to
 * choose which briefing to read; the full TLDR + sectioned briefing lives
 * one click away on /briefings/<slug>.
 */
const PILLAR_CARD_BLURBS: Readonly<Record<BriefingPillar["slug"], string>> = {
  "investment-management":
    "For allocators assessing selected systematic strategies managed by Odum. Covers how mandate fit, reporting, structure, and eligibility are reviewed before any allocation discussion.",
  "dart-trading-infrastructure":
    "For teams that already have, or are developing, a strategy and need infrastructure around research, execution, monitoring, reporting, and operational control.",
  "regulated-operating-models":
    "For engagements where the trading activity needs a clearer governance, reporting, permission, or structural wrapper around it.",
};

export default function BriefingsHubPage() {
  return (
    <div className="container max-w-4xl px-4 py-12 md:px-6 space-y-10">
      <div className="space-y-2">
        <Badge variant="outline" className="text-xs">
          Briefings
        </Badge>
      </div>

      <BriefingHero
        title="Briefings"
        tldr="Three routes, one operating system. Read the briefing closest to your situation before the fit call, then use the Strategy Evaluation to give us the detail needed to prepare your review and platform walkthrough."
        cta={{ label: "Book a Fit Call", href: CALENDLY_URL }}
      />

      {/* By-route routing table — three rows giving each persona enough to
          choose which briefing to read first. Governance gets its own row
          (companion read alongside whichever primary route applies). */}
      <section className="space-y-3 rounded-lg border border-border/80 bg-card/30 p-5 md:p-6">
        <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">By route</h2>
        <ul className="divide-y divide-border/60">
          <li className="grid gap-2 py-3 md:grid-cols-[220px_1fr] md:items-start md:gap-6">
            <span className="text-sm font-medium text-foreground">Allocator</span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              Start with{" "}
              <Link
                href="/briefings/investment-management"
                className="font-medium text-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:decoration-foreground"
              >
                Odum-Managed Strategies
              </Link>{" "}
              if you are evaluating allocation into strategies managed by Odum.
            </span>
          </li>
          <li className="grid gap-2 py-3 md:grid-cols-[220px_1fr] md:items-start md:gap-6">
            <span className="text-sm font-medium text-foreground">Builder / trading team</span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              Start with{" "}
              <Link
                href="/briefings/dart-trading-infrastructure"
                className="font-medium text-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:decoration-foreground"
              >
                DART Trading Infrastructure
              </Link>{" "}
              if you want to run, execute, monitor, or report a strategy through Odum&rsquo;s stack.
            </span>
          </li>
          <li className="grid gap-2 py-3 md:grid-cols-[220px_1fr] md:items-start md:gap-6">
            <span className="text-sm font-medium text-foreground">Governance / regulated structure</span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              Read{" "}
              <Link
                href="/briefings/regulated-operating-models"
                className="font-medium text-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:decoration-foreground"
              >
                Regulated Operating Models
              </Link>{" "}
              alongside the relevant route if the engagement needs FCA cover, reporting oversight, SMA/fund structuring,
              or an affiliate pathway.
            </span>
          </li>
        </ul>
      </section>

      {/* Skip-ahead affordance — for prospects who already know what they want
          and don't need to read three briefings before being specific. */}
      <p className="text-xs text-muted-foreground">
        Already know what fits?{" "}
        <Link
          href="/strategy-evaluation"
          className="font-medium text-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:decoration-foreground"
        >
          Skip ahead to Strategy Evaluation &rarr;
        </Link>
      </p>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">The commercial paths</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {ORDERED_PILLARS.map((p) => (
            <Card key={p.slug} className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">{p.title}</CardTitle>
                <p className="text-sm text-foreground/85 leading-relaxed">{PILLAR_CARD_BLURBS[p.slug]}</p>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/briefings/${p.slug}`}
                  className="inline-flex text-sm font-medium text-primary hover:underline"
                >
                  Open briefing →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/*
        Developer Documentation link removed from the public briefings hub
        per user review 2026-04-26 — it reads as a random technical escape
        hatch on a commercial briefing lobby. Devs can reach it from the
        DART briefing body, the public footer, or directly via /docs once
        they're inside the funnel.
      */}

      {/* Forward CTA — single-paragraph next-steps. */}
      <section className="rounded-lg border border-border bg-card/30 p-6">
        <h2 className="text-sm font-semibold text-foreground">Next steps</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Read the relevant briefing first. If the route is clear, submit a Strategy Evaluation so we can prepare a
          tailored Strategy Review before the platform walkthrough.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto sm:justify-start"
          >
            Book Fit Call →
          </a>
          <Link
            href="/strategy-evaluation"
            className="inline-flex w-full items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent sm:w-auto sm:justify-start"
          >
            Submit Strategy Evaluation →
          </Link>
        </div>
      </section>
    </div>
  );
}
