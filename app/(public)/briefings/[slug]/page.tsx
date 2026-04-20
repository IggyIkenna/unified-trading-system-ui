import { BriefingHero } from "@/components/briefings/briefing-hero";
import { StrategyCoverageMatrix } from "@/components/briefings/strategy-coverage-matrix";
import { DartMaturityLadderDiagram } from "@/components/marketing/dart-maturity-ladder-diagram";
import { DartPathsOverviewDiagram } from "@/components/marketing/dart-paths-overview-diagram";
import { FundSmaHierarchyDiagram } from "@/components/marketing/fund-sma-hierarchy-diagram";
import { RegUmbrellaHierarchyDiagram } from "@/components/marketing/reg-umbrella-hierarchy-diagram";
import { SignalFlowDiagram } from "@/components/marketing/signal-flow-diagram";
import { StrategyFamilyCatalogue } from "@/components/marketing/strategy-family-catalogue";
import { composeRenderers, renderWithTerms } from "@/components/marketing/render-with-terms";
import {
  BRIEFING_PILLARS,
  type BriefingAppliesTo,
  type BriefingPillar,
  type BriefingSection,
} from "@/lib/briefings/content";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as React from "react";

/**
 * Set of slugs that are valid internal briefing links. Used to linkify
 * `/briefings/<slug>` references in body text so readers navigate directly
 * to sibling briefings without hunting for the URL.
 */
const BRIEFING_SLUG_SET: ReadonlySet<string> = new Set(BRIEFING_PILLARS.map((p) => p.slug));

/**
 * Pattern to match `/briefings/<slug>` inline references. The captured
 * slug is validated against BRIEFING_SLUG_SET before rendering a link.
 */
const BRIEFING_LINK_PATTERN = /\/briefings\/([a-z][a-z0-9-]*)/g;

function linkify(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let keyCounter = 0;
  for (const match of text.matchAll(BRIEFING_LINK_PATTERN)) {
    const slug = match[1];
    const matchIndex = match.index ?? 0;
    if (!slug || !BRIEFING_SLUG_SET.has(slug)) continue;
    if (matchIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, matchIndex));
    }
    nodes.push(
      <Link
        key={`briefing-link-${keyCounter++}`}
        href={`/briefings/${slug}`}
        className="font-medium text-primary hover:underline"
      >
        /briefings/{slug}
      </Link>,
    );
    lastIndex = matchIndex + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes.length > 0 ? nodes : [text];
}

/**
 * Render briefing copy through both the `/briefings/<slug>` linkify pass
 * and the glossary-token substitution pass (`{{term:cefi}}` → <Term>).
 * Order: linkify first so the outer structure is preserved; term tokens
 * then apply inside each remaining string chunk.
 */
function renderBody(text: string): React.ReactNode[] {
  return composeRenderers(text, linkify);
}

const APPLIES_TO_LABEL: Readonly<Record<BriefingAppliesTo, string>> = {
  "signals-in": "Signals-In",
  "full-pipeline": "Full Pipeline",
  both: "Both paths",
};

const APPLIES_TO_CLASS: Readonly<Record<BriefingAppliesTo, string>> = {
  "signals-in": "bg-sky-500/10 text-sky-600 ring-sky-500/30 dark:text-sky-400",
  "full-pipeline": "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400",
  both: "bg-violet-500/10 text-violet-600 ring-violet-500/30 dark:text-violet-400",
};

function AppliesToBadge({ value }: { value: BriefingAppliesTo }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${APPLIES_TO_CLASS[value]}`}
    >
      {APPLIES_TO_LABEL[value]}
    </span>
  );
}

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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {section.title}
        </h2>
        {section.appliesTo && <AppliesToBadge value={section.appliesTo} />}
      </div>
      <p className="text-body text-foreground/85 max-w-2xl leading-relaxed">
        {renderBody(section.body)}
      </p>
      {section.bullets && (
        <ul className="list-disc pl-5 text-sm text-foreground/80 space-y-1.5 max-w-2xl leading-relaxed">
          {section.bullets.map((b) => (
            <li key={b}>{renderBody(b)}</li>
          ))}
        </ul>
      )}
      {section.bodyAfter && (
        <p className="text-body text-foreground/85 max-w-2xl leading-relaxed">
          {renderBody(section.bodyAfter)}
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
          {renderBody(pillar.frame)}
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
            <li key={m}>{renderBody(m)}</li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          The second call
        </h2>
        <p className="text-body text-foreground/85 max-w-2xl leading-relaxed">
          {renderBody(pillar.nextCall)}
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
              <p className="text-foreground/75 leading-relaxed">{renderWithTerms(p.tldr)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
