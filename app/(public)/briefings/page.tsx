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
 * Index ordering reflects likely prospect flow:
 *  1. DART Start Here — top-left orientation entry
 *  2. Investment Management — top-right, highest-value commercial path
 *  3. DART Full Pipeline — deepest DART path
 *  4. DART Signals-In — lighter DART path
 *  5. Odum Signals-Out — inverse direction
 *  6. Regulatory Umbrella — narrowest audience
 */
const DISPLAY_ORDER: readonly BriefingPillar["slug"][] = [
  "platform",
  "investment-management",
  "dart-full",
  "dart-signals-in",
  "signals-out",
  "regulatory",
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
        tldr="How we invest, how we're regulated, and every path through our platform — from signals in, to signals out."
        cta={{ label: "Book 45-minute call", href: CALENDLY_URL }}
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

      {/* Forward CTA — next step after reading the briefings hub. */}
      <section className="rounded-lg border border-border bg-card/30 p-6">
        <h2 className="text-sm font-semibold text-foreground">Next steps</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ready to onboard? Tell us about your firm in a short invite-only questionnaire so we can pre-configure your
          path. Or book a 45-minute call to walk any path against your specifics.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/questionnaire"
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto sm:justify-start"
          >
            Start onboarding questionnaire →
          </Link>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent sm:w-auto sm:justify-start"
          >
            Book a call
          </a>
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
