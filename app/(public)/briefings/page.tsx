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
 * Single-sentence card descriptions for the lobby. Intentionally tighter
 * than `BriefingPillar.tldr` — the full TLDR appears on the briefing page
 * itself, not the routing hub.
 */
const PILLAR_CARD_BLURBS: Readonly<Record<BriefingPillar["slug"], string>> = {
  "investment-management": "For allocators evaluating selected strategies managed by Odum.",
  "dart-trading-infrastructure":
    "For teams using Odum’s infrastructure to run, execute, monitor, or report systematic strategies.",
  "regulated-operating-models":
    "For engagements that need governance, reporting, permissions, or structure around the trading activity.",
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
        tldr="Read the relevant route before the fit call. Start with the path closest to your situation; companion briefings are optional where they apply."
        cta={{ label: "Book a Fit Call", href: CALENDLY_URL }}
      />

      {/* By-route routing table — 2 rows that point each persona at the
          briefing they should start with. Plain labels (no parenthetical
          "capital → Odum" / "your strategy" tags). */}
      <section className="space-y-3 rounded-lg border border-border/80 bg-card/30 p-5 md:p-6">
        <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">By route</h2>
        <ul className="divide-y divide-border/60">
          <li className="grid gap-2 py-3 md:grid-cols-[200px_1fr] md:items-center md:gap-6">
            <span className="text-sm font-medium text-foreground">Allocator</span>
            <span className="text-sm text-muted-foreground">
              Start with{" "}
              <Link
                href="/briefings/investment-management"
                className="font-medium text-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:decoration-foreground"
              >
                Odum-Managed Strategies
              </Link>
              .
            </span>
          </li>
          <li className="grid gap-2 py-3 md:grid-cols-[200px_1fr] md:items-center md:gap-6">
            <span className="text-sm font-medium text-foreground">Builder / counterparty</span>
            <span className="text-sm text-muted-foreground">
              Start with{" "}
              <Link
                href="/briefings/dart-trading-infrastructure"
                className="font-medium text-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:decoration-foreground"
              >
                DART Trading Infrastructure
              </Link>
              . If governance or regulatory structure matters, also read{" "}
              <Link
                href="/briefings/regulated-operating-models"
                className="font-medium text-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:decoration-foreground"
              >
                Regulated Operating Models
              </Link>
              .
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

      {/* Forward CTA — single sentence, two CTAs, no "Back to home" tertiary. */}
      <section className="rounded-lg border border-border bg-card/30 p-6">
        <h2 className="text-sm font-semibold text-foreground">Next steps</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Read the relevant briefing, then book a fit call &mdash; or submit a Strategy Evaluation if you already know
          what you want to run.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto sm:justify-start"
          >
            Book a Fit Call →
          </a>
          <Link
            href="/strategy-evaluation"
            className="inline-flex w-full items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent sm:w-auto sm:justify-start"
          >
            Submit a Strategy Evaluation →
          </Link>
        </div>
      </section>
    </div>
  );
}
