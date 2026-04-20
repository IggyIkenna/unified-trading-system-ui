import { Badge } from "@/components/ui/badge";
import { BriefingHero } from "@/components/briefings/briefing-hero";
import { DocsNav, type DocsNavSection } from "@/components/docs/docs-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  Database,
  FileCode2,
  KeyRound,
  LineChart,
  Link as LinkIcon,
  Lock,
  Map,
  Route,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Developer Documentation | Odum Research",
  description:
    "Integration guide to the Unified Trading System — four catalogues, three paths, and the UAC public contracts.",
};

/**
 * /docs — developer-facing entry into the Unified Trading System.
 *
 * This is NOT a live REST-API reference (the public API is on the roadmap).
 * It is a narrative integration guide pointing at:
 *   (1) the four catalogues (Data / Strategy / ML / Execution Algo),
 *   (2) the three DART paths (signals-in, full pipeline, execution-only),
 *   (3) the UAC domain facades that make up the stable public contract,
 *   (4) business-context briefings and the right next step.
 *
 * Scope rules (see codex/14-playbooks/playbooks/02-research-and-documentation.md):
 *   - Link to `/services/<catalogue>/` where the live catalogue UI renders; do
 *     not duplicate content.
 *   - Link to `/briefings/<slug>` for business context; do not restate it.
 *   - Name UAC facades, not fictional REST routes.
 */

const CATALOGUES: ReadonlyArray<{
  title: string;
  tagline: string;
  live: string;
  liveLabel: string;
  briefing?: { href: string; label: string };
  icon: typeof Database;
}> = [
  {
    title: "Data Catalogue",
    tagline:
      "Venues, asset classes, instrument types, date coverage, capture status and data-quality flags — the observability surface across every feed the platform ingests.",
    live: "/services/data/overview",
    liveLabel: "Open Data Catalogue",
    briefing: { href: "/briefings/dart-signals-in", label: "DART Signals-In briefing" },
    icon: Database,
  },
  {
    title: "Strategy Catalogue",
    tagline:
      "18 archetypes × category × instrument-type — with lock state (PUBLIC / IM-reserved / client-exclusive) and maturity (code-written → paper → live-allocated). Filtered by role and entitlement.",
    live: "/services/strategy-catalogue",
    liveLabel: "Open Strategy Catalogue",
    briefing: { href: "/briefings/platform", label: "DART Start-here briefing" },
    icon: Workflow,
  },
  {
    title: "ML Model Catalogue",
    tagline:
      "Model families, training runs, grid configuration and governance. The research → champion promotion ladder that feeds strategies.",
    live: "/services/research/ml",
    liveLabel: "Open ML Catalogue",
    icon: LineChart,
  },
  {
    title: "Execution Algo Catalogue",
    tagline:
      "Venue × algorithm coverage (VWAP, TWAP, POV, IS, and venue-native primitives) with TCA benchmarks and handoff surface.",
    live: "/services/execution/algos",
    liveLabel: "Open Execution Algos",
    briefing: { href: "/briefings/dart-full", label: "DART Full-pipeline briefing" },
    icon: FileCode2,
  },
];

const PATHS: ReadonlyArray<{
  label: string;
  slug: string;
  who: string;
  what: string;
  entryService: { href: string; label: string };
  entryBriefing: { href: string; label: string };
}> = [
  {
    label: "Path A — Signals-in",
    slug: "signals-in",
    who: "You have alpha. You want our infrastructure to ingest, validate, risk-check, and route it to venues.",
    what: "Send instructions through the instruction schema; we handle normalisation, execution, fills, position and P&L.",
    entryService: { href: "/services/trading/instructions", label: "Instructions surface" },
    entryBriefing: { href: "/briefings/dart-signals-in", label: "DART Signals-In briefing" },
  },
  {
    label: "Path B — Full pipeline",
    slug: "full-pipeline",
    who: "Quants, systematic desks. You want the whole pipeline: data → features → research → strategy → backtest → paper → live.",
    what: "Pick a strategy archetype (or bring your own), use the ML catalogue for signal models, backtest against the data catalogue, promote through paper → live-tiny → live-allocated.",
    entryService: { href: "/services/strategy-catalogue", label: "Strategy Catalogue" },
    entryBriefing: { href: "/briefings/dart-full", label: "DART Full briefing" },
  },
  {
    label: "Path C — Execution only",
    slug: "execution-only",
    who: "Asset managers, trading desks. You already have strategies; you want institutional-grade execution + TCA.",
    what: "Submit parent orders; we run execution algos, produce fills, and return TCA benchmarked against arrival / VWAP / IS.",
    entryService: { href: "/services/execution/overview", label: "Execution surface" },
    entryBriefing: { href: "/briefings/signals-out", label: "Signals-out briefing" },
  },
];

const UAC_FACADES: ReadonlyArray<{ name: string; what: string }> = [
  {
    name: "market",
    what: "Normalised market data — orderbooks, trades, candles, funding, basis. One schema across 100+ venues and 5 asset classes.",
  },
  {
    name: "instruction",
    what: "The signals-in contract. Declarative intent (long/short/target size), routing hints, lifecycle events.",
  },
  {
    name: "strategy",
    what: "Strategy availability, lock state, maturity, and archetype capability — what's offered to whom and where it is on the promotion ladder.",
  },
  {
    name: "execution",
    what: "Parent orders, child orders, fills, TCA benchmarks, venue adapters, algorithm configuration.",
  },
  { name: "position", what: "Positions, exposures, balances, P&L at instrument / strategy / account / org scope." },
  { name: "account", what: "Organisation hierarchy, fund structure (SMA vs pooled), share classes, trader roles." },
  { name: "features", what: "Derived series — feature definitions, training windows, coverage manifests." },
  { name: "prediction", what: "Event markets (political / economic / sports outcomes) — quote schema, resolution." },
  { name: "sports", what: "Pre-match and in-play odds, venue-normalised selections, settlement." },
  {
    name: "reference",
    what: "Instrument reference data, venue capability declarations, calendar and expiry schedules.",
  },
  {
    name: "errors",
    what: "Classified venue errors (retryable / skippable / fatal) driving shard-level failure isolation.",
  },
  { name: "rate_limits", what: "Per-venue quotas, burst allowances, and the shared reservation interface." },
];

const NAV_SECTIONS: ReadonlyArray<DocsNavSection> = [
  { id: "intro", label: "Introduction" },
  { id: "catalogues", label: "The four catalogues" },
  { id: "paths", label: "Three integration paths" },
  { id: "uac", label: "UAC — schema surface" },
  { id: "access", label: "Access & authentication" },
  { id: "briefings", label: "Business context" },
  { id: "roadmap", label: "Roadmap" },
  { id: "contact", label: "Contact" },
];

const BRIEFINGS: ReadonlyArray<{ slug: string; title: string; summary: string }> = [
  { slug: "platform", title: "DART — Start here", summary: "Orientation across the platform and the two DART paths." },
  {
    slug: "dart-signals-in",
    title: "DART — Signals-in",
    summary: "Instruction-schema fit-check and execution-only onboarding.",
  },
  {
    slug: "dart-full",
    title: "DART — Full pipeline",
    summary: "Data → research → strategy → execute, with commitment tiers.",
  },
  { slug: "signals-out", title: "Signals-out", summary: "Licensing Odum's signals into your own infrastructure." },
  {
    slug: "investment-management",
    title: "Investment Management",
    summary: "SMA vs pooled share-class structure under Odum's FCA permissions.",
  },
  {
    slug: "regulatory",
    title: "Regulatory Umbrella",
    summary: "Regulatory hosting and supervisory artifacts for appointed representatives.",
  },
];

function AuthCard({
  tier,
  purpose,
  how,
  example,
  icon,
}: {
  tier: string;
  purpose: string;
  how: string;
  example: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{tier}</CardTitle>
        </div>
        <CardDescription className="text-sm text-foreground/85">{purpose}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground/85">How: </span>
          {how}
        </p>
        <p className="text-xs">
          <span className="font-medium text-foreground/85">Example: </span>
          {example}
        </p>
      </CardContent>
    </Card>
  );
}

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 xl:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-10">
            <DocsNav sections={NAV_SECTIONS} />
          </div>
        </aside>
        <main className="min-w-0 space-y-12">
          <section id="intro" className="space-y-6 scroll-mt-24">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Research & Documentation
              </Badge>
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Access code required
              </span>
            </div>

            <BriefingHero
              title="Developer Documentation"
              tldr="The Unified Trading System is a catalogue-driven platform. This guide points at the four live catalogues, the three integration paths, and the UAC contracts — so you can see what's real today and choose the shortest path in."
              cta={{ label: "Book 45-minute call", href: "/contact" }}
            />

            <div className="rounded-md border border-border/60 bg-muted/30 p-4 text-sm">
              <p className="font-medium">Current state of the API surface</p>
              <p className="mt-1 text-muted-foreground">
                The catalogue UIs behind sign-in are the source of truth for what the platform exposes today. A
                versioned public REST and WebSocket API, an OpenAPI spec, and first-party Python / TypeScript SDKs are
                on the{" "}
                <Link href="#roadmap" className="text-primary underline-offset-2 hover:underline">
                  roadmap
                </Link>
                . Until they ship, the UAC domain facades (below) are the stable schema you can build against.
              </p>
            </div>
          </section>

          <section id="catalogues" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2">
              <Map className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                The four catalogues
              </h2>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Every surface the platform offers resolves back to one of four catalogues. Each is filtered per user by
              role, entitlement, lock state and maturity — so what <em>you</em> see is only the subset you&apos;re
              authorised for.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              {CATALOGUES.map((c) => (
                <Card key={c.title} className="border-border/60">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <c.icon className="size-4 text-muted-foreground" aria-hidden />
                      <CardTitle className="text-lg">{c.title}</CardTitle>
                    </div>
                    <p className="text-sm text-foreground/85 leading-relaxed">{c.tagline}</p>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <Link
                      href={c.live}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      {c.liveLabel}
                      <ArrowRight className="size-3.5" aria-hidden />
                      <span className="ml-1 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        Sign-in required
                      </span>
                    </Link>
                    {c.briefing ? (
                      <Link
                        href={c.briefing.href}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <LinkIcon className="size-3" aria-hidden />
                        {c.briefing.label}
                      </Link>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section id="paths" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2">
              <Route className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Three integration paths
              </h2>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Most prospects fall into one of three entry shapes. Pick the one that matches your operation — deeper
              briefings and entry surfaces are linked below.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {PATHS.map((p) => (
                <Card key={p.slug} className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">{p.label}</CardTitle>
                    <CardDescription className="text-sm text-foreground/85 leading-relaxed">{p.who}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.what}</p>
                    <div className="flex flex-col gap-1.5 text-xs">
                      <Link href={p.entryBriefing.href} className="text-primary hover:underline">
                        → {p.entryBriefing.label}
                      </Link>
                      <Link
                        href={p.entryService.href}
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        → {p.entryService.label}
                        <Lock className="size-3 text-amber-600 dark:text-amber-500" aria-hidden />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section id="uac" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2">
              <FileCode2 className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                UAC — the public schema surface
              </h2>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">unified-api-contracts</code> (UAC) holds the
              typed schema every service in the platform speaks. It&apos;s the stable integration contract — facades are
              organised per domain, and a facade is what the eventual public REST/WS endpoints will implement.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {UAC_FACADES.map((f) => (
                <div key={f.name} className="rounded-md border border-border/60 bg-background p-3">
                  <div className="flex items-baseline gap-2">
                    <code className="text-sm font-semibold">{f.name}</code>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      unified_api_contracts.{f.name}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{f.what}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="access" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Access & authentication
              </h2>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              The platform uses a three-tier auth model. What you need depends on which surface you&apos;re hitting.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <AuthCard
                tier="Light — briefings + docs"
                purpose="Access code we share after a 45-min call. Covers Briefings Hub and this Developer Documentation."
                how="Single access code, stored per-browser. No PII, no Firebase."
                example="You're using it right now."
                icon={<KeyRound className="size-4 text-muted-foreground" aria-hidden />}
              />
              <AuthCard
                tier="Staging — demo personas"
                purpose="Exploratory access to every catalogue and trading surface, sliced by persona (investor / DART client / IM client / admin)."
                how="Firebase staging project; seeded demo users. Role determines what you see."
                example="investor@odum-research.co.uk → Investor Relations only. DART client → DART catalogues and tools only."
                icon={<Lock className="size-4 text-muted-foreground" aria-hidden />}
              />
              <AuthCard
                tier="Production — clients & internal"
                purpose="Live entitlements, real fund scoping, per-client catalogue slicing."
                how="Firebase prod with SSO options. Server-side enforcement: role × entitlement × lock state × maturity."
                example="IM client sees only their SMA / share classes. Odum admin sees the full stack."
                icon={<Lock className="size-4 text-muted-foreground" aria-hidden />}
              />
            </div>
          </section>

          <section id="briefings" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Business context — briefings
              </h2>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Briefings are the narrative counterpart to this integration guide. Every path has one; read the matching
              briefing before you commit engineering time.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {BRIEFINGS.map((b) => (
                <Link
                  key={b.slug}
                  href={`/briefings/${b.slug}`}
                  className="rounded-md border border-border/60 bg-background p-3 hover:border-border"
                >
                  <p className="text-sm font-medium">{b.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{b.summary}</p>
                </Link>
              ))}
            </div>
          </section>

          <section id="roadmap" className="space-y-4 scroll-mt-24">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Roadmap — what&apos;s coming to this surface
            </h2>
            <ul className="space-y-2 text-sm text-foreground/85 leading-relaxed">
              <li>
                <span className="font-medium">Public REST API (v1).</span> Versioned read endpoints for the market,
                reference and catalogue facades. Auth via API key.
              </li>
              <li>
                <span className="font-medium">WebSocket streaming.</span> Normalised orderbook, trades and
                strategy-state subscriptions.
              </li>
              <li>
                <span className="font-medium">OpenAPI 3.1 spec + Postman collection.</span> Generated from the same
                Pydantic models UAC already uses internally.
              </li>
              <li>
                <span className="font-medium">Python and TypeScript SDKs.</span> Thin typed clients over the REST / WS
                surface, published as <code className="rounded bg-muted px-1 py-0.5 text-xs">odum-client</code>.
              </li>
              <li>
                <span className="font-medium">Execution-alpha TCA for DeFi.</span> Slippage benchmarked against
                simulated fills, parallel to CeFi TCA.
              </li>
              <li>
                <span className="font-medium">Signals-out marketplace.</span> Subscribing to Odum signals under a
                signals-out licence, without needing full execution on our infrastructure.
              </li>
            </ul>
          </section>

          <section id="contact" className="scroll-mt-24 rounded-md border border-border/60 bg-muted/30 p-6 text-sm">
            <p className="font-medium">Ready to scope an integration?</p>
            <p className="mt-1 text-muted-foreground">
              Book a 45-minute call — we&apos;ll walk through which path fits, which catalogue slice you need, and when
              the public API would close the gap.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <Link href="/contact" className="font-medium text-primary hover:underline">
                Contact us →
              </Link>
              <Link href="/demo" className="font-medium text-primary hover:underline">
                Book 45-minute call →
              </Link>
              <Link href="/briefings" className="text-muted-foreground hover:text-foreground">
                Back to Briefings Hub
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
