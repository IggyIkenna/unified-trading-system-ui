import { BriefingHero } from "@/components/briefings/briefing-hero";
import { renderWithTerms } from "@/components/marketing/render-with-terms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRIEFING_PILLARS, type BriefingPillar } from "@/lib/briefings/content";
import { CALENDLY_URL } from "@/lib/marketing/calendly";
import Link from "next/link";

export const metadata = {
  title: "Briefings | Odum Research",
  description: "Pre-commitment narrative: investment management, regulatory context, and platform depth.",
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

export default function BriefingsHubPage() {
  return (
    <div className="container max-w-4xl px-4 py-12 md:px-6 space-y-10">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Briefings
          </Badge>
          <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Access granted
          </span>
        </div>
      </div>

      <BriefingHero
        title="Briefings"
        tldr="How we invest, how we're regulated, and every path through our platform — from signals in, to Odum Signals."
        cta={{ label: "Book a Fit Call", href: CALENDLY_URL }}
      />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">The commercial paths</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {ORDERED_PILLARS.map((p) => (
            <Card key={p.slug} className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">{p.title}</CardTitle>
                <p className="text-sm text-foreground/85 leading-relaxed">{renderWithTerms(p.tldr)}</p>
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

      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/docs" className="font-medium text-primary hover:underline">
            Developer Documentation
          </Link>
          <span className="text-muted-foreground"> — API and integration reference.</span>
        </p>
      </section>

      {/* Forward CTA — next step after reading the briefings hub. By the time
          a reader is here they've already submitted the questionnaire (it's
          the gate that unlocked /briefings/*), so the next steps are the
          initial call and, optionally, the deeper Strategy Evaluation. */}
      <section className="rounded-lg border border-border bg-card/30 p-6">
        <h2 className="text-sm font-semibold text-foreground">Next steps</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;ve read the deep dives. The natural next step is a 30-minute initial call &mdash; targeted now that
          you have the context, focused on which products actually fit. If you&rsquo;re ready to be specific on the
          record, you can also submit our deeper Strategy Evaluation.
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
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent sm:w-auto sm:justify-start"
          >
            Back to home
          </Link>
        </div>
      </section>
    </div>
  );
}
