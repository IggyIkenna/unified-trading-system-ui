import { BriefingHero } from "@/components/briefings/briefing-hero";
import { StrategyCoverageMatrix } from "@/components/briefings/strategy-coverage-matrix";
import { DocsNav, type DocsNavSection } from "@/components/docs/docs-nav";
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
import { CALENDLY_URL } from "@/lib/marketing/calendly";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as React from "react";

/** URL-safe id from a human heading. */
function slugifyId(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

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

function DartTierComparisonTable() {
  const rows: { feature: string; signalsIn: boolean; full: boolean }[] = [
    { feature: "P&L dashboard & reporting",   signalsIn: true,  full: true  },
    { feature: "Positions & terminal",         signalsIn: true,  full: true  },
    { feature: "Strategy observe / alerts",    signalsIn: true,  full: true  },
    { feature: "Signal intake webhook",        signalsIn: true,  full: false },
    { feature: "ML backtesting",               signalsIn: false, full: true  },
    { feature: "Strategy customisation",       signalsIn: false, full: true  },
    { feature: "Promote to live workflow",     signalsIn: false, full: true  },
    { feature: "Feature engineering pipeline", signalsIn: false, full: true  },
  ];
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Feature</th>
            <th className="px-4 py-2.5 text-center font-medium text-sky-600">Signals-In</th>
            <th className="px-4 py-2.5 text-center font-medium text-emerald-600">DART Full</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.feature} className={i % 2 === 1 ? "bg-muted/20" : ""}>
              <td className="px-4 py-2.5 text-foreground/85">{row.feature}</td>
              <td className="px-4 py-2.5 text-center">
                {row.signalsIn
                  ? <span className="font-semibold text-emerald-600">✓</span>
                  : <span className="text-muted-foreground/40">—</span>}
              </td>
              <td className="px-4 py-2.5 text-center">
                {row.full
                  ? <span className="font-semibold text-emerald-600">✓</span>
                  : <span className="text-muted-foreground/40">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

function Section({ section, id }: { section: BriefingSection; id?: string }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
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

/** Per-slug "Next: fill the questionnaire" block.
 *  Same target form across briefings; entry copy + service pre-select varies. */
const NEXT_STEPS_COPY: Record<
  string,
  { heading: string; service: "IM" | "DART" | "RegUmbrella" | null }
> = {
  "investment-management": {
    heading: "Next: tell us about your investment preferences",
    service: "IM",
  },
  platform: {
    heading: "Next: tell us about the strategies you want to run",
    service: "DART",
  },
  "dart-signals-in": {
    heading: "Next: tell us about your signals and execution needs",
    service: "DART",
  },
  "dart-full": {
    heading: "Next: tell us about your research and execution setup",
    service: "DART",
  },
  "signals-out": {
    heading: "Next: tell us about the signals you want to licence",
    service: "DART",
  },
  regulatory: {
    heading: "Next: tell us about your firm's regulatory goals",
    service: "RegUmbrella",
  },
};

function BriefingNextSteps({ slug }: { slug: string }) {
  const copy = NEXT_STEPS_COPY[slug] ?? {
    heading: "Next: tell us about your strategy",
    service: null,
  };
  const href = copy.service !== null ? `/questionnaire?service=${copy.service}` : "/questionnaire";
  return (
    <section
      data-testid="briefing-next-steps"
      className="space-y-4 rounded-lg border border-border/60 bg-card/40 p-6"
    >
      <h2 className="text-base font-semibold tracking-tight text-foreground">{copy.heading}</h2>
      <p className="text-sm text-foreground/85 leading-relaxed max-w-2xl">
        It&apos;s the same catch-all questionnaire everyone fills &mdash; six quick questions about
        which asset classes, venues, and strategy styles fit you, plus an optional Regulatory
        Umbrella branch if you need FCA cover. Takes ~2 minutes and lets us pre-configure the
        right path before the first call.
      </p>
      <div className="flex flex-wrap gap-3 pt-1">
        <Link
          href={href}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Start the questionnaire &rarr;
        </Link>
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Book a 45-minute call
        </a>
      </div>
    </section>
  );
}

export default async function BriefingPillarPage({ params }: PageProps) {
  const { slug } = await params;
  const pillar = BRIEFING_PILLARS.find((p) => p.slug === slug);
  if (!pillar) notFound();

  const showCoverageMatrix = MATRIX_SLUGS.has(pillar.slug);
  const showFamilyCatalogue = pillar.slug === "dart-full";
  const showTierComparison = pillar.slug === "dart-signals-in";

  // Build the TOC dynamically so it reflects what this pillar actually renders.
  const tocSections: DocsNavSection[] = [
    { id: "overview", label: "Overview" },
    ...pillar.sections.map((s) => ({ id: slugifyId(s.title), label: s.title })),
    ...(showTierComparison ? [{ id: "tier-comparison", label: "Signals-In vs Full" }] : []),
    ...(showCoverageMatrix ? [{ id: "coverage-matrix", label: "Coverage matrix" }] : []),
    ...(showFamilyCatalogue ? [{ id: "full-catalogue", label: "Full catalogue" }] : []),
    { id: "key-messages", label: "Key messages" },
    { id: "second-call", label: "The second call" },
    { id: "next-steps", label: "Next steps" },
    { id: "other-briefings", label: "Other briefings" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <Link
        href="/briefings"
        className="mb-6 inline-block text-xs text-muted-foreground hover:text-foreground"
      >
        ← All briefings
      </Link>

      {/* Mobile / tablet TOC — collapsible, hidden on md+ where the sidebar takes over */}
      <details className="mb-8 rounded-lg border border-border bg-card/40 md:hidden">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium">
          On this page
        </summary>
        <ul className="space-y-1 px-4 pb-3 pt-1">
          {tocSections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="block rounded py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </details>

      <div className="md:flex md:items-start md:gap-8 lg:gap-10 xl:gap-14">
        <aside
          className="hidden shrink-0 self-start md:block"
          style={{
            position: "sticky",
            top: "5rem",
            width: "220px",
            maxHeight: "calc(100vh - 6rem)",
            overflowY: "auto",
            paddingBottom: "2.5rem",
          }}
        >
          <DocsNav sections={tocSections} />
        </aside>

        <div className="min-w-0 flex-1 space-y-10">
          <section id="overview" className="scroll-mt-24 space-y-6">
            <BriefingHero title={pillar.title} tldr={pillar.tldr} cta={pillar.cta} />

            <p className="text-body text-foreground/90 max-w-2xl leading-relaxed">
              {renderBody(pillar.frame)}
            </p>

            <DiagramForSlug slug={pillar.slug} />
          </section>

          {pillar.sections.map((s) => (
            <Section key={s.title} id={slugifyId(s.title)} section={s} />
          ))}

          {showTierComparison && (
            <section id="tier-comparison" className="scroll-mt-24 space-y-4 border-t border-border/40 pt-8">
              <div className="space-y-2 max-w-2xl">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Signals-In vs DART Full — feature matrix
                </h2>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Both paths share the same execution infrastructure. The boundary is research and promote — those
                  surfaces are excluded from Signals-In by design, not by omission.
                </p>
              </div>
              <DartTierComparisonTable />
            </section>
          )}

          {showCoverageMatrix && (
            <section id="coverage-matrix" className="scroll-mt-24 space-y-4 border-t border-border/40 pt-8">
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

          {showFamilyCatalogue && (
            <section id="full-catalogue" className="scroll-mt-24 space-y-4 border-t border-border/40 pt-8">
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

          <section id="key-messages" className="scroll-mt-24 space-y-3 border-t border-border/40 pt-8">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Key messages
            </h2>
            <ol className="list-decimal pl-5 text-sm text-foreground/85 space-y-2 max-w-2xl leading-relaxed">
              {pillar.keyMessages.map((m) => (
                <li key={m}>{renderBody(m)}</li>
              ))}
            </ol>
          </section>

          <section id="second-call" className="scroll-mt-24 space-y-3">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              The second call
            </h2>
            <p className="text-body text-foreground/85 max-w-2xl leading-relaxed">
              {renderBody(pillar.nextCall)}
            </p>
          </section>

          <div id="next-steps" className="scroll-mt-24">
            <BriefingNextSteps slug={pillar.slug} />
          </div>

          <section id="other-briefings" className="scroll-mt-24 space-y-3 border-t border-border/40 pt-8">
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
      </div>
    </div>
  );
}
