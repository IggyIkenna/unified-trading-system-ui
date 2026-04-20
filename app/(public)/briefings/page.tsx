import { BriefingHero } from "@/components/briefings/briefing-hero";
import { renderWithTerms } from "@/components/marketing/render-with-terms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRIEFING_PILLARS, type BriefingPillar } from "@/lib/briefings/content";
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
        cta={{ label: "Book 45-minute call", href: "/contact" }}
      />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          The commercial paths
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {ORDERED_PILLARS.map((p) => (
            <Card key={p.slug} className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">{p.title}</CardTitle>
                <p className="text-sm text-foreground/85 leading-relaxed">
                  {renderWithTerms(p.tldr)}
                </p>
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
    </div>
  );
}
