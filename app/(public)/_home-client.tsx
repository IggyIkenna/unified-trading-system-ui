"use client";

import * as React from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useEmblaCarousel from "embla-carousel-react";

import { ArbitrageGalaxy } from "@/components/marketing/arbitrage-galaxy";
import { renderWithTerms } from "@/components/marketing/render-with-terms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics/track";
import { SERVICE_LABELS } from "@/lib/copy/service-labels";
import { useAuth } from "@/hooks/use-auth";
import { useDefaultLanding } from "@/lib/auth/default-landing";

// Three buckets, ordered by familiarity for an institutional reader.
// Digital assets folds Crypto + DeFi; sports & prediction markets read
// as one alternative-data bucket. Keeps the pill compact on mobile.
const ASSET_CLASSES = ["Digital assets", "Traditional markets", "Sports & prediction markets"] as const;

/**
 * Homepage React composition. See `app/(public)/page.tsx` for the metadata,
 * word-budget, and CTA-discipline contracts this file implements.
 *
 * 2026-04-29: already-authenticated visitors are auto-redirected to their
 * default landing (/dashboard for most, /investor-relations for IR
 * personas) — they shouldn't re-land on the marketing homepage every time
 * they visit the root URL. Anonymous prospects keep seeing the marketing
 * page. SSOT: lib/auth/default-landing.ts.
 */
export function HomePageClient() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const defaultLanding = useDefaultLanding();

  React.useEffect(() => {
    if (loading) return;
    if (!user) return;
    router.replace(defaultLanding());
  }, [loading, user, defaultLanding, router]);

  return (
    <div className="min-h-screen bg-background">
      <main>
        <Hero />
        <MarketsUniverse />
        <WaysClientsUseOdum />
        <WhyOdum />
        <EngagementJourney />
        <GovernanceAndRisk />
        <FinalCTA />
      </main>
    </div>
  );
}

function HomeStartReviewButton({
  size = "lg",
  variant = "default",
  source,
}: {
  readonly size?: "default" | "lg" | "sm";
  readonly variant?: "default" | "outline";
  readonly source: "hero" | "final";
}) {
  return (
    <Button asChild size={size} variant={variant}>
      <Link href="/start-your-review" onClick={() => trackEvent("homepage_start_review_click", { source })}>
        Start Your Strategy &amp; Infrastructure Review
        <ArrowRight className="ml-2 size-4" />
      </Link>
    </Button>
  );
}

function HomeContactButton({
  size = "lg",
  source,
}: {
  readonly size?: "default" | "lg" | "sm";
  readonly source: "hero" | "final";
}) {
  return (
    <Button asChild size={size} variant="outline">
      <Link href="/contact" onClick={() => trackEvent("homepage_contact_click", { source })}>
        Contact Odum
      </Link>
    </Button>
  );
}

const LIFECYCLE_STEPS = ["Research", "Execution", "Monitoring", "Reporting", "Governance"] as const;

/**
 * Odum institutional palette — used by inline style props so colours render
 * regardless of Tailwind JIT arbitrary-value class generation. The tokens
 * here are the brand SSOT for the hero block.
 */
const COLORS = {
  bgDeep: "#07080A",
  bgPanel: "#0B0D10",
  textPrimary: "#F4F6F8",
  textSecondary: "#A7AFBA",
  textMuted: "#8B93A0",
  textDim: "#6F7783",
  textActive: "#D8DEE6",
  accentCyan: "#22D3EE",
  accentGold: "#C8A94A",
} as const;

const HERO_BG_GRADIENT = [
  "radial-gradient(circle at 50% 15%, rgba(34,211,238,0.10), transparent 38%)",
  "radial-gradient(circle at 82% 8%, rgba(200,169,74,0.06), transparent 30%)",
  "linear-gradient(180deg, #0B0D10 0%, #07080A 100%)",
].join(", ");

const HERO_GRID_BG = [
  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
  "linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
].join(", ");

/**
 * Proof row — credibility markers under the hero CTAs.
 * Items tagged "gold" use the Odum brand-gold accent (#C8A94A) to separate
 * regulatory / authorisation signals from the muted operational statements.
 */
const PROOF_POINTS: ReadonlyArray<{ readonly text: string; readonly tone: "gold" | "muted" }> = [
  { text: "FCA-authorised", tone: "gold" },
  { text: "Professional / institutional clients", tone: "muted" },
  { text: "Regulated since 2023", tone: "gold" },
];

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/40" style={{ backgroundColor: COLORS.bgDeep }}>
      {/* Richer institutional backdrop:
          - cyan radial top-centre (system signal)
          - gold radial top-right (regulatory accent)
          - vertical dark gradient #0B0D10 → #07080A for depth
          All decorative, all aria-hidden. Inline style instead of Tailwind
          arbitrary classes: multi-layer radial-gradient + comma-separated
          rgba() values are unreliable through the JIT. */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: HERO_BG_GRADIENT }} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: HERO_GRID_BG,
          backgroundSize: "48px 48px",
          opacity: 0.04,
        }}
      />
      {/* Abstract equity-curve overlay — two soft lines crossing the hero
          area at very low opacity. Suggests data sophistication without
          impersonating a real chart. */}
      <svg
        aria-hidden
        viewBox="0 0 1600 600"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="hero-curve-primary" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hero-curve-muted" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.12" />
            <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M -50 460 C 250 410, 420 330, 640 360 S 1040 280, 1260 240 S 1600 180, 1700 160"
          fill="none"
          stroke="url(#hero-curve-primary)"
          strokeWidth="1.25"
        />
        <path
          d="M -50 520 C 280 500, 460 470, 700 470 S 1100 430, 1320 400 S 1620 360, 1700 350"
          fill="none"
          stroke="url(#hero-curve-muted)"
          strokeWidth="1"
          strokeDasharray="2 6"
        />
      </svg>

      <div className="container relative px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          {/* Asset-class pill banner — globe icon + 5 markets in a rounded
              capsule. Restored from prior hero per user. */}
          <div
            className="inline-flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
            style={{
              borderColor: "rgba(255,255,255,0.12)",
              backgroundColor: "rgba(255,255,255,0.02)",
              color: COLORS.textSecondary,
              animationFillMode: "both",
            }}
          >
            <Globe aria-hidden className="size-4" style={{ color: COLORS.textMuted }} />
            {ASSET_CLASSES.map((cls, i) => (
              <span key={cls} className="flex items-center gap-3">
                <span style={{ color: COLORS.textPrimary }}>{cls}</span>
                {i < ASSET_CLASSES.length - 1 && <span style={{ color: `${COLORS.textSecondary}66` }}>&middot;</span>}
              </span>
            ))}
          </div>

          {/* Eyebrow: firm name in muted text + FCA reference in gold accent. */}
          <p
            className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
            style={{ color: COLORS.textSecondary, animationDelay: "120ms", animationFillMode: "both" }}
          >
            Odum Research <span style={{ color: `${COLORS.textSecondary}80` }}>&middot;</span>{" "}
            <span style={{ color: COLORS.accentGold }}>FCA 975797</span>
          </p>
          {/* Three-line manifesto with sequential reveal. Each line fades up
              with a 140ms stagger; respects prefers-reduced-motion. */}
          <h1
            className="mt-7 text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl md:leading-[1.05]"
            style={{ color: COLORS.textPrimary }}
          >
            <span
              className="block motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700"
              style={{ animationFillMode: "both" }}
            >
              Trading infrastructure,
            </span>
            <span
              className="block motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700"
              style={{ animationDelay: "140ms", animationFillMode: "both" }}
            >
              built around
            </span>
            <span
              className="block motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700"
              style={{ animationDelay: "280ms", animationFillMode: "both" }}
            >
              your problem.
            </span>
          </h1>
          <p
            className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-relaxed md:text-lg motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
            style={{ color: COLORS.textSecondary, animationDelay: "480ms", animationFillMode: "both" }}
          >
            Odum helps institutional clients design, build, and operate systematic trading capabilities across digital
            assets, traditional markets, sports, and prediction markets. Bring your own strategies — we protect your IP
            — or use ours; either way, you get tailored builds, infrastructure, and regulated operating models.
          </p>
          <div
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
            style={{ animationDelay: "600ms", animationFillMode: "both" }}
          >
            <HomeStartReviewButton source="hero" />
            <HomeContactButton source="hero" />
          </div>

          {/* Lifecycle strip — pipeline reveal: each step + arrow fades in
              left-to-right, 90ms stagger, after the headline finishes. */}
          <div
            aria-hidden
            className="mt-12 hidden items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.15em] md:flex"
            style={{ color: COLORS.textMuted }}
          >
            {LIFECYCLE_STEPS.map((step, i) => (
              <span
                key={step}
                className="flex items-center gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500"
                style={{ animationDelay: `${720 + i * 90}ms`, animationFillMode: "both" }}
              >
                <span style={i === 0 ? { color: COLORS.textActive } : undefined}>{step}</span>
                {i < LIFECYCLE_STEPS.length - 1 && <span style={{ color: `${COLORS.accentCyan}8C` }}>→</span>}
              </span>
            ))}
          </div>
          <div
            aria-hidden
            className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em] md:hidden"
            style={{ color: COLORS.textMuted }}
          >
            {LIFECYCLE_STEPS.map((step) => (
              <span key={step} className="font-mono">
                {step}
              </span>
            ))}
          </div>

          {/* Proof row — gold accents on regulatory items; muted on operational. */}
          <div
            className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
            style={{ color: COLORS.textMuted, animationDelay: "1100ms", animationFillMode: "both" }}
          >
            {PROOF_POINTS.map((proof, i) => (
              <span key={proof.text} className="flex items-center gap-3">
                <span style={{ color: proof.tone === "gold" ? COLORS.accentGold : COLORS.textSecondary }}>
                  {proof.text}
                </span>
                {i < PROOF_POINTS.length - 1 && <span style={{ color: `${COLORS.textSecondary}66` }}>·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Markets universe — visual breadth USP.
 *
 * Reuses the canvas-based ArbitrageGalaxy already shipped in
 * components/marketing/arbitrage-galaxy.tsx (TradFi / CeFi / DeFi / Sports /
 * Predictions nodes with sequential BTC / S&P / Football arbitrage packets).
 * Captures cross-market breadth without writing five stats or a feature list.
 *
 * Per user feedback 2026-04-26: the prior text-only hero felt austere. This
 * section lives directly under the hero and gives the page institutional
 * trading-platform presence.
 */
function MarketsUniverse() {
  return (
    <section className="border-t border-border/40 bg-background">
      <div className="container px-4 pt-16 pb-20 md:px-6 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Selected markets. One operating surface
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            Strategies move from research and simulation to live trading on the same operating surface, with market data
            normalised across selected sources.
          </p>
        </div>

        {/* Galaxy canvas — keeps a fixed aspect-ratio so it doesn't stretch */}
        <div className="relative mx-auto mt-10 aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-lg border border-border/40 bg-card/20">
          <ArbitrageGalaxy />
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground/70">
          Coverage and venues are scoped per engagement. The diagram illustrates selected market relationships Odum
          supports today; not every route or combination is available to every client.
        </p>
      </div>
    </section>
  );
}

// ─── Ways clients use Odum ──────────────────────────────────────────────────
// Merged 2026-05-01: replaces the prior split between "Three engagement
// routes" (mechanism-led: Investment Management / DART / Regulatory) and a
// separate problem-led bullet list. Now one section: 5 problem-led use cases
// + 1 catch-all CTA, each card carrying the visual treatment of the original
// engagement-route cards (accent strip, summary, bullets, CTA). Each CTA links
// to the relevant deep-dive page so the engagement-route concept survives in
// the link target without consuming a second card section.
type WayClientsUseOdum = {
  readonly key: string;
  readonly title: string;
  readonly summary: string;
  readonly bullets: readonly string[];
  readonly href: string;
  readonly cta: string;
  /** Hex colour for the per-card top accent strip + bullet markers. */
  readonly accent: string;
};

const WAYS_CLIENTS_USE_ODUM: readonly WayClientsUseOdum[] = [
  {
    key: "build",
    title: "Build a new trading capability",
    summary: "Research-to-execution infrastructure for teams launching from scratch.",
    bullets: [
      "Bring strategies, or build them with us — research, signal generation, execution, monitoring, reporting end to end.",
      "Live ops handover from day one or staged over time.",
      "Bespoke configurations reviewed case by case.",
    ],
    href: "/platform",
    cta: "Explore {{term:dart|DART}} Trading Infrastructure",
    accent: "#22D3EE", // cyan — DART family
  },
  {
    key: "upgrade",
    title: "Upgrade fragmented trading infrastructure",
    summary: "Consolidate data, research, execution, monitoring, and reporting onto one operating surface.",
    bullets: [
      "Replace point-tool sprawl with one system that scales with the strategy.",
      "Keep your existing IP and signal logic; plug into Odum's surrounding stack.",
      "Migration paths reviewed case by case.",
    ],
    href: "/platform",
    cta: "Explore DART Trading Infrastructure",
    accent: "#22D3EE",
  },
  {
    key: "byo-ip",
    title: "Bring your own strategies — keep your IP",
    summary: "Odum runs the surrounding infrastructure without taking signal ownership.",
    bullets: [
      "Data, execution, risk, reporting, governance — all run by Odum.",
      "Your signals stay yours. We never see proprietary logic.",
      "Where strategies need work, we help you enhance them and close gaps.",
    ],
    href: "/platform",
    cta: "Explore DART Trading Infrastructure",
    accent: "#22D3EE",
  },
  {
    key: "institutional",
    title: "Launch under institutional controls",
    summary: "Regulated operating models, fund structures, or affiliate arrangements where the engagement requires it.",
    bullets: [
      "Reviewed case by case; not a generic umbrella service.",
      "May include {{term:sma}} pathways, affiliate-supported structures, or other approved arrangements.",
      "Governance, reporting, and oversight aligned to the engagement.",
    ],
    href: "/regulatory",
    cta: "Explore Regulated Operating Models",
    accent: "#34D399", // green — Regulatory
  },
  {
    key: "managed",
    title: "Access Odum-managed systematic strategies",
    summary: "Selected strategies managed by Odum, available through SMA or fund-route structures.",
    bullets: [
      "Odum acts as investment manager.",
      "Reporting delivered through the same operating surface used to run the mandate.",
      "Mandates aren't limited to the published list — bespoke allocations reviewed case by case.",
    ],
    href: "/investment-management",
    cta: "Explore Odum-Managed Strategies",
    accent: "#C8A94A", // gold — Investment Management
  },
  {
    key: "custom",
    title: "Don't fit a single bucket?",
    summary:
      "Most engagements blend two or three of the above. Tell us what you're solving and we'll map the right combination.",
    bullets: [
      "Bespoke builds and operating models reviewed case by case.",
      "We tailor to your business reality, not the other way around.",
      "Start with a review and we'll route the conversation.",
    ],
    href: "/start-your-review",
    cta: "Start Your Strategy & Infrastructure Review",
    accent: "#8B93A0", // neutral — catch-all
  },
];

function WaysClientsUseOdum() {
  // Embla-driven carousel — Deltix-style "Our Product Lines" pattern: one
  // focused card centered with side-card peek, prev/next chevrons on the
  // edges, dot indicators below. Cuts visual density from 6 simultaneous
  // cards to 1-3 visible at a time depending on viewport. Each card retains
  // its accent + bullets + CTA — the carousel never hides depth, just paces
  // it. Embla 8.x is already installed (package.json), so no new dep.
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    skipSnaps: false,
    containScroll: "trimSnaps",
  });
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(true);

  React.useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = React.useCallback((idx: number) => emblaApi?.scrollTo(idx), [emblaApi]);

  return (
    <section aria-labelledby="ways-clients-heading" className="border-b border-border/40 bg-background">
      <div className="container px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="ways-clients-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">
            Ways clients use Odum
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-muted-foreground">
            From a single capability gap to a full operating model. Each card maps to a deep-dive page; most engagements
            blend two or three.
          </p>
        </div>

        <div
          className="relative mt-12"
          role="region"
          aria-roledescription="carousel"
          aria-label="Ways clients use Odum"
        >
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            aria-label="Previous card"
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition hover:border-border hover:text-foreground disabled:pointer-events-none disabled:opacity-0 md:-left-4"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={!canScrollNext}
            aria-label="Next card"
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition hover:border-border hover:text-foreground disabled:pointer-events-none disabled:opacity-0 md:-right-4"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {WAYS_CLIENTS_USE_ODUM.map((row, idx) => {
                const isFocused = idx === selectedIndex;
                return (
                  <div
                    key={row.key}
                    className="ways-clients-slide min-w-0 shrink-0 grow-0 px-3"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${idx + 1} of ${WAYS_CLIENTS_USE_ODUM.length}: ${row.title}`}
                  >
                    <Card
                      className="relative flex h-full flex-col overflow-hidden border-border/80 bg-card/60 transition-all duration-300"
                      style={{
                        opacity: isFocused ? 1 : 0.6,
                        transform: isFocused ? "scale(1)" : "scale(0.97)",
                      }}
                    >
                      <span
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-[2px]"
                        style={{
                          backgroundColor: row.accent,
                          opacity: isFocused ? 0.95 : 0.55,
                        }}
                      />
                      <CardHeader className="pt-6">
                        <CardTitle
                          className="text-lg transition-colors"
                          style={{ color: isFocused ? row.accent : undefined }}
                        >
                          {renderWithTerms(row.title)}
                        </CardTitle>
                        <CardDescription className="text-sm leading-[1.65] text-muted-foreground">
                          {row.summary}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col">
                        <ul className="space-y-3 text-[13px] text-muted-foreground" style={{ lineHeight: 1.6 }}>
                          {row.bullets.map((bullet) => (
                            <li key={bullet} className="flex gap-2.5">
                              <span
                                aria-hidden
                                className="shrink-0 rounded-full"
                                style={{
                                  width: 6,
                                  height: 6,
                                  marginTop: 7,
                                  backgroundColor: row.accent,
                                  opacity: 0.85,
                                }}
                              />
                              <span>{renderWithTerms(bullet)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-auto pt-6">
                          <Button asChild variant="outline" size="sm">
                            <Link
                              href={row.href}
                              onClick={() =>
                                trackEvent("engagement_route_card_click", {
                                  route: row.key,
                                })
                              }
                            >
                              {renderWithTerms(row.cta)}
                              <ArrowRight className="ml-1.5 size-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-breakpoint slide width: 85% mobile (1 visible + peek), 46%
              tablet (2 visible), 32% desktop (3 visible). Plain CSS via
              styled-jsx keeps Tailwind JIT out of the picture for arbitrary
              flex-basis values, which has been unreliable in this codebase. */}
          <style jsx>{`
            .ways-clients-slide {
              flex: 0 0 85%;
              max-width: 85%;
            }
            @media (min-width: 768px) {
              .ways-clients-slide {
                flex: 0 0 46%;
                max-width: 46%;
              }
            }
            @media (min-width: 1024px) {
              .ways-clients-slide {
                flex: 0 0 32%;
                max-width: 32%;
              }
            }
          `}</style>
        </div>

        {/* Dot indicators — clickable, aria-current state on active. Active
            dot widens (w-6) so visitors can scan position at a glance. */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {WAYS_CLIENTS_USE_ODUM.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollTo(idx)}
              aria-label={`Go to card ${idx + 1}`}
              aria-current={idx === selectedIndex}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: idx === selectedIndex ? 24 : 6,
                backgroundColor:
                  idx === selectedIndex ? "hsl(var(--foreground) / 0.7)" : "hsl(var(--muted-foreground) / 0.3)",
              }}
            />
          ))}
        </div>

        {/* Fit-finder fallback — for visitors who don't see themselves in any
            card, or who want to skip directly to the questionnaire / contact
            form. Mirrors the catch-all card's CTA but as a low-key text link
            so it doesn't compete with the active card's primary CTA. */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Not sure which fits?{" "}
          <Link href="/start-your-review" className="font-medium text-foreground underline-offset-4 hover:underline">
            Start your review
          </Link>{" "}
          or{" "}
          <Link href="/contact" className="font-medium text-foreground underline-offset-4 hover:underline">
            contact us
          </Link>{" "}
          for a tailored conversation.
        </p>
      </div>
    </section>
  );
}

function WhyOdum() {
  return (
    <section aria-labelledby="why-odum-heading" className="border-b border-border/40 bg-card/20">
      <div className="container px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-3xl">
          {/* Bumped to text-3xl/4xl + leading-tight so this section reads as
              a positioning statement rather than a paragraph note. */}
          <h2
            id="why-odum-heading"
            className="text-3xl font-semibold tracking-tight md:text-4xl"
            style={{ lineHeight: 1.15 }}
          >
            Why Odum exists
          </h2>
          {/* Lead paragraph carries the framing — bigger size + brighter
              text colour so it stands apart from the supporting paragraph. */}
          <p className="mt-6 text-lg text-foreground/85 md:text-xl" style={{ lineHeight: 1.55 }}>
            Institutional trading teams often stitch together research, execution, reporting, compliance, and
            governance. Odum was built to reduce that fragmentation.
          </p>
          <p className="mt-5 text-base text-muted-foreground" style={{ lineHeight: 1.7 }}>
            We operate one codebase across research, execution, reporting, and compliance, then offer narrow access to
            that system through structures that can stand up to allocator and regulator scrutiny.
          </p>
          <p className="mt-7 text-sm">
            <Link href="/story" className="font-medium text-foreground underline-offset-4 hover:underline">
              Read the short story
              <ArrowRight className="ml-1 inline size-3.5 align-[-2px]" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

const ENGAGEMENT_JOURNEY: readonly {
  readonly step: string;
  readonly title: string;
  readonly description: string;
}[] = [
  {
    step: "01",
    title: "Questionnaire",
    description: "Six axes; a few minutes. Routes you to the relevant briefing pillar.",
  },
  {
    step: "02",
    title: "Briefings",
    description: "Three pillars; gated material covering structure, mechanics, and scope.",
  },
  {
    step: "03",
    title: "Initial call",
    description: "If the briefings line up, a focused call rather than a generic intro.",
  },
  {
    step: "04",
    title: "Strategy Evaluation",
    description: "Structured DDQ covering entity, paths, risk, treasury, and governance.",
  },
  {
    step: "05",
    title: "Strategy Review",
    description: "A tailored pre-demo review of your route, requirements, and demo focus.",
  },
  {
    step: "06",
    title: "Platform walkthrough",
    description:
      "A tailored walkthrough of the relevant workflows, followed by a self-guided review and feedback on fit.",
  },
  {
    step: "07",
    title: "Commercial Tailoring",
    description: "Once the demo confirms fit, we open the deeper catalogue, pricing, and contract shape.",
  },
] as const;

function EngagementJourney() {
  return (
    <section aria-labelledby="engagement-journey-heading" className="border-b border-border/40 bg-background">
      <div className="container px-4 py-20 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="engagement-journey-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">
              How an engagement progresses
            </h2>
            <p className="mt-4 text-base text-muted-foreground" style={{ lineHeight: 1.7 }}>
              The funnel is intentional. Each stage filters fit on both sides and earns the next.
            </p>
          </div>

          {/* Process rail — desktop is seven in a single row connected by a
              hairline; mobile collapses to a vertical stack with the rail
              running down the left. Reads as a deliberate sequence rather
              than a generic 2x3 card grid. */}
          <ol className="relative mt-14 hidden lg:block">
            {/* Hairline connector across the row (desktop only) */}
            <span
              aria-hidden
              className="absolute left-0 right-0 top-[15px] h-px"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            />
            <div className="grid grid-cols-7 gap-3">
              {ENGAGEMENT_JOURNEY.map((stage) => (
                <li key={stage.step} className="relative">
                  {/* Numbered node sitting on the rail */}
                  <span
                    aria-hidden
                    className="relative z-10 flex size-[30px] items-center justify-center rounded-full border bg-background font-mono text-[11px] font-semibold"
                    style={{
                      borderColor: "rgba(34,211,238,0.45)",
                      color: "#22D3EE",
                    }}
                  >
                    {stage.step}
                  </span>
                  <p className="mt-4 text-sm font-semibold text-foreground">{stage.title}</p>
                  <p className="mt-1.5 text-[12.5px] text-muted-foreground" style={{ lineHeight: 1.55 }}>
                    {stage.description}
                  </p>
                </li>
              ))}
            </div>
          </ol>

          {/* Mobile / tablet: vertical rail with steps stacked. */}
          <ol className="relative mt-14 space-y-7 border-l lg:hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {ENGAGEMENT_JOURNEY.map((stage) => (
              <li key={stage.step} className="relative pl-7">
                <span
                  aria-hidden
                  className="absolute flex size-[28px] items-center justify-center rounded-full border bg-background font-mono text-[11px] font-semibold"
                  style={{
                    left: -14,
                    top: 0,
                    borderColor: "rgba(34,211,238,0.45)",
                    color: "#22D3EE",
                  }}
                >
                  {stage.step}
                </span>
                <p className="text-sm font-semibold text-foreground">{stage.title}</p>
                <p className="mt-1.5 text-[13px] text-muted-foreground" style={{ lineHeight: 1.55 }}>
                  {stage.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/**
 * Governance / risk pillars — three-card scan rather than a wall of
 * paragraph text. Each card is the credibility marker an allocator or
 * compliance reviewer is checking for.
 */
const GOVERNANCE_PILLARS: ReadonlyArray<{
  readonly key: string;
  readonly title: string;
  readonly body: string;
}> = [
  {
    key: "regulated-scope",
    title: "Regulated scope",
    body: "FCA-authorised (firm reference 975797). Engagement scope reviewed case by case.",
  },
  {
    key: "risk-discipline",
    title: "Risk discipline",
    body: "Capacity limits, drawdown discipline, and risk-and-exposure controls are part of the operating model.",
  },
  {
    key: "dependency-clarity",
    title: "Dependency clarity",
    body: "Custody, fund administration, and counterparty onboarding timelines depend on third parties: we do not guarantee coverage we do not control.",
  },
];

function GovernanceAndRisk() {
  return (
    <section aria-labelledby="governance-heading" className="border-b border-border/40 bg-card/20">
      <div className="container px-4 py-20 md:px-6 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="governance-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">
              Governance and risk
            </h2>
            <p className="mt-4 text-base text-muted-foreground" style={{ lineHeight: 1.7 }}>
              The governance and risk markers, set out plainly.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {GOVERNANCE_PILLARS.map((pillar) => (
              <div
                key={pillar.key}
                className="rounded-lg border bg-card/50 p-6"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                <h3 className="text-base font-semibold text-foreground">{pillar.title}</h3>
                <p className="mt-3 text-[13.5px] text-muted-foreground" style={{ lineHeight: 1.65 }}>
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section aria-labelledby="final-cta-heading" className="bg-background">
      <div className="container px-4 py-20 md:px-6 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="final-cta-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">
            Start your strategy &amp; infrastructure review
          </h2>
          <p className="mt-4 text-base text-muted-foreground" style={{ lineHeight: 1.7 }}>
            Tell us where you are — building a capability, upgrading infrastructure, bringing your own strategies,
            launching under institutional controls, or accessing Odum-managed strategies. The questionnaire takes a few
            minutes; the review is bespoke.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <HomeStartReviewButton source="final" />
            <HomeContactButton source="final" />
          </div>
        </div>
      </div>
    </section>
  );
}
