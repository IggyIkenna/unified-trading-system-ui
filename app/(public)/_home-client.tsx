"use client";

import { ArrowRight, Globe } from "lucide-react";
import Link from "next/link";

import { ArbitrageGalaxy } from "@/components/marketing/arbitrage-galaxy";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics/track";
import { SERVICE_LABELS } from "@/lib/copy/service-labels";

// Three buckets, ordered by familiarity for an institutional reader.
// Digital assets folds Crypto + DeFi; sports & prediction markets read
// as one alternative-data bucket. Keeps the pill compact on mobile.
const ASSET_CLASSES = ["Digital assets", "Traditional markets", "Sports & prediction markets"] as const;

/**
 * Homepage React composition. See `app/(public)/page.tsx` for the metadata,
 * word-budget, and CTA-discipline contracts this file implements.
 */
export function HomePageClient() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Hero />
        <MarketsUniverse />
        <EngagementRoutes />
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
        Start Your Review
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
          arbitrary classes — multi-layer radial-gradient + comma-separated
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
              Systematic strategies.
            </span>
            <span
              className="block motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700"
              style={{ animationDelay: "140ms", animationFillMode: "both" }}
            >
              Trading infrastructure.
            </span>
            <span
              className="block motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700"
              style={{ animationDelay: "280ms", animationFillMode: "both" }}
            >
              Institutional clients.
            </span>
          </h1>
          <p
            className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-relaxed md:text-lg motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
            style={{ color: COLORS.textSecondary, animationDelay: "480ms", animationFillMode: "both" }}
          >
            Odum manages selected systematic strategies and provides access to the infrastructure and regulated
            operating models around them.
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
            Strategies move from research and simulation to live trading on the same operating surface,
            with market data normalised across selected sources.
          </p>
        </div>

        {/* Galaxy canvas — keeps a fixed aspect-ratio so it doesn't stretch */}
        <div className="relative mx-auto mt-10 aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-lg border border-border/40 bg-card/20">
          <ArbitrageGalaxy />
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground/70">
          Coverage and venues are scoped per engagement. The diagram illustrates the breadth of selected markets and
          cross-market relationships Odum supports today; not all combinations are available to every client.
        </p>
      </div>
    </section>
  );
}

type EngagementRoute = {
  readonly key: "investment" | "dart" | "regulatory";
  readonly title: string;
  readonly summary: string;
  readonly bullets: readonly string[];
  readonly href: string;
  readonly cta: string;
};

const ENGAGEMENT_ROUTES: readonly EngagementRoute[] = [
  {
    key: "investment",
    title: SERVICE_LABELS.investment.marketing,
    summary: "Allocate capital to systematic strategies that Odum runs, with reporting Odum uses internally.",
    bullets: [
      "SMA or fund-route structures, available by separate agreement.",
      "Odum acts as investment manager; clients keep custody on the SMA route.",
      "Same reporting surface used to operate the strategies — partitioned views.",
    ],
    href: "/investment-management",
    cta: "Explore Odum-Managed Strategies",
  },
  {
    key: "dart",
    title: SERVICE_LABELS.dart.marketing,
    summary:
      "License the research-to-execution stack and run your own strategies on it, with the signal-flow you need.",
    bullets: [
      "Client-provided, Odum-provided, or hybrid signals — same code path.",
      "Research, ML, simulation, execution, and reporting in one operating model.",
      "Fits trading teams that want infrastructure without allocating capital to Odum.",
    ],
    href: "/platform",
    cta: "Explore DART Trading Infrastructure",
  },
  {
    key: "regulatory",
    title: SERVICE_LABELS.regulatory.marketing,
    summary: "Where the engagement requires it, Odum can structure the operating model under FCA cover.",
    bullets: [
      "Reviewed case by case; not a generic regulatory umbrella offer.",
      "Specific structures considered: advisory, AR-style arrangement, affiliate fund route.",
      "Governance, reporting, and oversight align with the engagement.",
    ],
    href: "/regulatory",
    cta: "Explore Regulated Operating Models",
  },
] as const;

function EngagementRoutes() {
  return (
    <section aria-labelledby="engagement-routes-heading" className="border-b border-border/40 bg-background">
      <div className="container px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="engagement-routes-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">
              Three engagement routes
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Most prospects fit one of three. The questionnaire helps us confirm which one applies before either side
              spends time on a call.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {ENGAGEMENT_ROUTES.map((route) => (
              <Card key={route.key} className="flex h-full flex-col border-border/80 bg-card/60">
                <CardHeader>
                  <CardTitle className="text-lg">{route.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{route.summary}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {route.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-2">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={route.href}
                        onClick={() =>
                          trackEvent("engagement_route_card_click", {
                            route: route.key,
                          })
                        }
                      >
                        {route.cta}
                        <ArrowRight className="ml-1.5 size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyOdum() {
  return (
    <section aria-labelledby="why-odum-heading" className="border-b border-border/40 bg-card/20">
      <div className="container px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 id="why-odum-heading" className="text-2xl font-semibold tracking-tight md:text-3xl">
            Why Odum exists
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            Odum was built because the systems institutional traders run on internally rarely match the systems
            available to the clients funding them. We operate one codebase across research, execution, reporting, and
            compliance, and offer narrow access to it under structures that hold up to allocator and regulator scrutiny.
          </p>
          <p className="mt-6 text-sm">
            <Link href="/our-story" className="font-medium text-foreground underline-offset-4 hover:underline">
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
    description: "Per-prospect tailored layer: proposed operating model, DART config, regulatory pathway, demo prep.",
  },
  {
    step: "06",
    title: "Onboarding",
    description: "Documentation, custody arrangements, and platform access where applicable.",
  },
] as const;

function EngagementJourney() {
  return (
    <section aria-labelledby="engagement-journey-heading" className="border-b border-border/40 bg-background">
      <div className="container px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="engagement-journey-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">
              How an engagement progresses
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The funnel is intentional. Each stage filters fit on both sides and earns the next.
            </p>
          </div>
          <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ENGAGEMENT_JOURNEY.map((stage) => (
              <li key={stage.step} className="rounded-lg border border-border/60 bg-card/40 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Step {stage.step}
                </p>
                <p className="mt-3 text-base font-medium text-foreground">{stage.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stage.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function GovernanceAndRisk() {
  return (
    <section aria-labelledby="governance-heading" className="border-b border-border/40 bg-card/20">
      <div className="container px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 id="governance-heading" className="text-2xl font-semibold tracking-tight md:text-3xl">
            Governance and risk
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Odum Research Limited is authorised and regulated by the FCA (firm reference 975797). Investment management
            activity sits inside that perimeter; trading-infrastructure engagements and regulated operating models are
            reviewed case by case. Strategies carry capacity limits, drawdown discipline, and the same risk-and-exposure
            controls in research and live operation. Where a structure depends on third-party custody, fund
            administration, or counterparty onboarding, timelines depend on those parties &mdash; we do not guarantee
            coverage we do not control.
          </p>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section aria-labelledby="final-cta-heading" className="bg-background">
      <div className="container px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="final-cta-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to start?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            A short questionnaire is the most efficient way for both sides to check fit. If your situation is already
            specific, contact us directly.
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
