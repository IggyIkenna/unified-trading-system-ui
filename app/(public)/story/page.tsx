import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PUBLIC_ROUTE_PATHS, SERVICE_LABELS } from "@/lib/copy/service-labels";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

/**
 * Public Story page — editorial two-column layout.
 *
 * Per user review 2026-04-26: the narrow centred-column layout looked
 * like a sparse documentation page. Refactored into a wider editorial
 * presentation:
 *   - Left column: story essay (5 short paragraphs).
 *   - Right column: vertical timeline + key facts rail (FCA / HQ).
 *   - Mobile: stack.
 *
 * Closing band upgraded: "Ready to understand the right route?" with
 * Start Your Review + Contact Odum buttons.
 *
 * The global "Next: Questionnaire → Briefings → Book" depth strip is
 * suppressed on /story via lib/marketing/public-depth-visibility.ts —
 * editorial pages don't carry that breadcrumb.
 *
 * Depth lives in /our-story (gated founder essay) + the FAQ.
 */
export const metadata: Metadata = {
  title: "Story | Odum Research",
  description:
    "Odum grew from trading desk experience, FCA-regulated investment management, and the need for a more controlled way to operate systematic strategies.",
};

interface TimelineEntry {
  year: string;
  title: string;
  body: string;
}

const TIMELINE: readonly TimelineEntry[] = [
  {
    year: "2011 onward",
    title: "Trading desk foundation",
    body: "Ikenna trades at IMC and Mako across volatility arbitrage, systematic market-making, and electronic trading.",
  },
  {
    year: "2021",
    title: "Odum founded",
    body: "Odum Research Ltd is founded to apply systematic trading experience to digital-asset markets and regulated investment management.",
  },
  {
    year: "2023",
    title: "FCA authorisation",
    body: "Odum Research Ltd is authorised by the Financial Conduct Authority and begins operating client-facing investment activity for professional and institutional clients.",
  },
  {
    year: "2024",
    title: "Infrastructure lesson",
    body: "The early strategy journey shows that single-strategy reliance is fragile. Odum begins building a broader infrastructure layer for research, execution, risk, and reporting.",
  },
  {
    year: "2025",
    title: "DART takes shape",
    body: "The platform team consolidates around the current DART architecture, supporting systematic trading workflows across selected markets and engagement types.",
  },
  {
    year: "2026",
    title: "Three routes to work with Odum",
    body: `${SERVICE_LABELS.investment.marketing}, ${SERVICE_LABELS.dart.marketing}, and ${SERVICE_LABELS.regulatory.marketing}.`,
  },
];

export default function MarketingStoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 pb-16 pt-10 md:px-6 md:pb-20 md:pt-12">
        <div className="mx-auto max-w-6xl">
          {/* Hero */}
          <div className="mb-10 max-w-3xl">
            <Badge variant="outline" className="mb-3">
              Story
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">How Odum came to be</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Odum grew from trading desk experience, FCA-regulated investment management, and the need for a more
              controlled way to operate systematic strategies.
            </p>
          </div>

          {/* Two-column editorial layout: essay + rail */}
          <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_320px] md:gap-12 lg:gap-16">
            {/* Left: essay */}
            <article className="space-y-5 text-base leading-relaxed text-foreground/90">
              <p>
                Odum Research began with a simple frustration: systematic trading had become more complex, but the
                infrastructure around it remained fragmented.
              </p>
              <p>
                Before founding Odum, Ikenna Igboaka traded at IMC in Amsterdam and Mako in London, working across
                volatility arbitrage, systematic market-making, and electronic trading. That experience shaped the
                original view behind Odum: serious trading is not just about a signal. It is about the operating system
                around the signal: data, research, execution, risk, reconciliation, reporting, and governance working
                together.
              </p>
              <p>
                Odum Research Ltd was founded in 2021 and later authorised by the Financial Conduct Authority. The firm
                initially focused on systematic crypto trading and investment management for professional and
                institutional clients. That early period was valuable because it exposed a hard lesson: relying on a
                narrow strategy set is fragile. Markets mature, edges compress, and research pipelines need to keep
                evolving.
              </p>
              <p>
                The answer was not to keep adding disconnected tools. It was to build one controlled infrastructure
                layer that could support research, execution, monitoring, reporting, and governance across selected
                systematic strategies. That infrastructure became DART.
              </p>
              <p>
                Today, Odum operates around three clear routes: clients can allocate to{" "}
                {SERVICE_LABELS.investment.marketing}, use {SERVICE_LABELS.dart.marketing}, or structure a{" "}
                {SERVICE_LABELS.regulatory.marketing.toLowerCase().replace(/s$/, "")} where the engagement requires it.
                The routes are different, but they are built around the same principle: systematic trading works better
                when the operating model is unified, controlled, and properly governed.
              </p>
              <p className="border-l-2 border-primary/40 pl-4 text-sm italic text-muted-foreground">
                Odum remains a focused firm. The ambition is not to be everything to everyone. It is to work with
                selected clients and affiliate service providers where the strategy, infrastructure, and structure fit.
              </p>
            </article>

            {/* Right: vertical timeline + key facts rail */}
            <aside className="space-y-8">
              {/* Timeline */}
              <div>
                <h2 className="mb-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</h2>
                <ol className="relative space-y-6 border-l border-border/60" style={{ paddingLeft: 48 }}>
                  {TIMELINE.map((entry) => (
                    <li key={entry.year} className="relative">
                      {/* Circle bullet on the rail. We bypass Tailwind for the
                          left/top/size here because the dev-cycle CSS bundle
                          drops arbitrary-value classes when this file gets
                          edited mid-HMR: caused circles to overlap the leading
                          digit of each year. Inline style is hot-reload-safe. */}
                      <span
                        aria-hidden
                        className="absolute rounded-full border border-primary/60 bg-background"
                        style={{ left: -52, top: 8, width: 8, height: 8 }}
                      />
                      <div className="font-mono text-[11px] uppercase tracking-wide text-primary/85">{entry.year}</div>
                      <div className="mt-1 text-sm font-semibold leading-tight text-foreground">{entry.title}</div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{entry.body}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Key facts */}
              <div className="rounded-lg border border-border/60 bg-card/30 p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key facts</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">Authorisation</dt>
                    <dd className="mt-0.5 text-foreground">FCA-regulated since 2023 (FRN 975797)</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">Headquarters</dt>
                    <dd className="mt-0.5 text-foreground">London, UK</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">Client scope</dt>
                    <dd className="mt-0.5 text-foreground">Professional Clients &amp; Eligible Counterparties</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>

          {/* Stronger closing band */}
          <section className="mt-16 rounded-lg border border-border/60 bg-gradient-to-b from-card/60 to-card/30 p-8 text-center md:p-10">
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Ready to understand the right route?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              Start with a short review. We&rsquo;ll route you to the relevant briefing and next step.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href={PUBLIC_ROUTE_PATHS.startYourReview}>
                  Start Your Review <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={PUBLIC_ROUTE_PATHS.contact}>Contact Odum</Link>
              </Button>
            </div>
          </section>

          {/* Related */}
          <div className="mt-10 rounded-lg border border-border/60 bg-card/20 p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Related</h3>
            <ul className="mt-3 grid gap-2 text-sm md:grid-cols-2">
              <li>
                <Link href="/our-story" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Our Story (long form)
                </Link>
                <span className="text-muted-foreground"> : the founder&rsquo;s first-person narrative (gated).</span>
              </li>
              <li>
                <Link
                  href={PUBLIC_ROUTE_PATHS.whoWeAre}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Who We Are
                </Link>
                <span className="text-muted-foreground">: firm identity, team, and engagement routes.</span>
              </li>
              <li>
                <Link
                  href={PUBLIC_ROUTE_PATHS.dart}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {SERVICE_LABELS.dart.marketing}
                </Link>
                <span className="text-muted-foreground">: the operating system behind the journey.</span>
              </li>
              <li>
                <Link
                  href={PUBLIC_ROUTE_PATHS.regulatory}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {SERVICE_LABELS.regulatory.marketing}
                </Link>
                <span className="text-muted-foreground"> : structure regulated engagements where appropriate.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
