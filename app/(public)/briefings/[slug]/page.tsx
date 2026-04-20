import { BriefingHero } from "@/components/briefings/briefing-hero";
import { StrategyCoverageMatrix } from "@/components/briefings/strategy-coverage-matrix";
import { DartMaturityLadderDiagram } from "@/components/marketing/dart-maturity-ladder-diagram";
import { DartPathsOverviewDiagram } from "@/components/marketing/dart-paths-overview-diagram";
import { FundSmaHierarchyDiagram } from "@/components/marketing/fund-sma-hierarchy-diagram";
import { RegUmbrellaHierarchyDiagram } from "@/components/marketing/reg-umbrella-hierarchy-diagram";
import { SignalFlowDiagram } from "@/components/marketing/signal-flow-diagram";
import { StrategyFamilyCatalogue } from "@/components/marketing/strategy-family-catalogue";
import { BRIEFING_PILLARS, type BriefingPillar, type BriefingSection } from "@/lib/briefings/content";
import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * Slugs that render the full strategy-family × category coverage matrix
 * after the final content section. IM allocators and DART builders need
 * the breadth map; narrower paths (dart-signals-in, signals-out, regulatory)
 * render a pointer instead of the full matrix.
 */
const MATRIX_SLUGS = new Set<string>(["investment-management", "platform", "dart-full"]);

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BRIEFING_PILLARS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const pillar = BRIEFING_PILLARS.find((p) => p.slug === slug);
  if (!pillar) return { title: "Briefing | Odum Research" };
  return { title: `${pillar.title} — Briefings | Odum Research` };
}

function DiagramForSlug({ slug }: { slug: BriefingPillar["slug"] }) {
  switch (slug) {
    case "investment-management":
      return <FundSmaHierarchyDiagram />;
    case "regulatory":
      return <RegUmbrellaHierarchyDiagram />;
    case "dart-signals-in":
      return <SignalFlowDiagram direction="in" />;
    case "signals-out":
      return <SignalFlowDiagram direction="out" />;
    case "platform":
      return <DartPathsOverviewDiagram />;
    case "dart-full":
      return <DartMaturityLadderDiagram />;
  }
}

function Section({ section }: { section: BriefingSection }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {section.title}
      </h2>
      <p className="text-body text-foreground/85 max-w-2xl leading-relaxed">
        {section.body}
      </p>
      {section.bullets && (
        <ul className="list-disc pl-5 text-sm text-foreground/80 space-y-1.5 max-w-2xl leading-relaxed">
          {section.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
      {section.bodyAfter && (
        <p className="text-body text-foreground/85 max-w-2xl leading-relaxed">
          {section.bodyAfter}
        </p>
      )}
    </section>
  );
}

export default async function BriefingPillarPage({ params }: PageProps) {
  const { slug } = await params;
  const pillar = BRIEFING_PILLARS.find((p) => p.slug === slug);
  if (!pillar) notFound();

  return (
    <div className="container max-w-3xl px-4 py-12 md:px-6 space-y-10">
      <Link
        href="/briefings"
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← All briefings
      </Link>

      <BriefingHero title={pillar.title} tldr={pillar.tldr} cta={pillar.cta} />

      <section className="space-y-3">
        <p className="text-body text-foreground/90 max-w-2xl leading-relaxed">
          {pillar.frame}
        </p>
      </section>

      <DiagramForSlug slug={pillar.slug} />

      {pillar.sections.map((s) => (
        <Section key={s.title} section={s} />
      ))}

      {MATRIX_SLUGS.has(pillar.slug) && (
        <section className="space-y-4 border-t border-border/40 pt-8">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Strategy families × categories — what Odum runs
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              The matrix below is the operational coverage map — strategy families down the side,
              asset-class categories across the top. A filled dot means Odum operates live strategies
              in that cell; a half-filled dot means adapter or configuration work is in progress for
              some instruments in the cell. Venue detail, specific slot configurations, and maturity
              tags are covered at the second call.
            </p>
          </div>
          <StrategyCoverageMatrix />
        </section>
      )}

      {pillar.slug === "dart-full" && (
        <section className="space-y-4 border-t border-border/40 pt-8">
          <div className="space-y-2 max-w-3xl">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Full archetype × category × instrument-type catalogue
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              The full combinatoric universe Odum operates on. Eighteen archetypes grouped into
              three family bands (directional, relative-value, event-driven) mapped across five
              categories and eight instrument-type cells. Lock-state posture is shown per cell —
              public slots are a narrow default, the rest of the supported surface is reserved for
              Odum&apos;s investment-management book unless a client-exclusive carve-out is
              negotiated.
            </p>
          </div>
          <StrategyFamilyCatalogue />
        </section>
      )}

      <section className="space-y-3 border-t border-border/40 pt-8">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Key messages
        </h2>
        <ol className="list-decimal pl-5 text-sm text-foreground/85 space-y-2 max-w-2xl leading-relaxed">
          {pillar.keyMessages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          The second call
        </h2>
        <p className="text-body text-foreground/85 max-w-2xl leading-relaxed">
          {pillar.nextCall}
        </p>
      </section>

      <section className="space-y-3 border-t border-border/40 pt-8">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Other briefings
        </h2>
        <ul className="space-y-3 max-w-2xl">
          {BRIEFING_PILLARS.filter((p) => p.slug !== pillar.slug).map((p) => (
            <li key={p.slug} className="text-sm">
              <Link
                href={`/briefings/${p.slug}`}
                className="font-medium text-primary hover:underline"
              >
                {p.title}
              </Link>
              <p className="text-foreground/75 leading-relaxed">{p.tldr}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
