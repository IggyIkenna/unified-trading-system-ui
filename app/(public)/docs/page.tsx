import { Badge } from "@/components/ui/badge";
import { BriefingHero } from "@/components/briefings/briefing-hero";
import { DocsNav, type DocsNavSection } from "@/components/docs/docs-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Database,
  FileCode2,
  KeyRound,
  LineChart,
  Link as LinkIcon,
  Lock,
  Map,
  Route,
  Terminal,
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
  { id: "api-reference", label: "API reference" },
  { id: "access", label: "Access & authentication" },
  { id: "org-scoping", label: "Organisation & entitlements" },
  { id: "briefings", label: "Business context" },
  { id: "roadmap", label: "Roadmap" },
  { id: "contact", label: "Contact" },
];

interface ApiRef {
  readonly anchorId: string;
  readonly facade: string;
  readonly title: string;
  readonly status: "planned" | "internal";
  readonly method: "GET" | "POST" | "DELETE" | "WS";
  readonly path: string;
  readonly description: string;
  readonly uacType: string;
  readonly pythonType: string;
  readonly curl: string;
  readonly responseJson: string;
}

const API_REFERENCES: ReadonlyArray<ApiRef> = [
  {
    anchorId: "api-market-orderbook",
    facade: "market",
    title: "Fetch normalised orderbook",
    status: "planned",
    method: "GET",
    path: "/v1/market/orderbook/{venue}/{symbol}",
    description:
      "L2 snapshot normalised across 100+ venues. Same `CanonicalOrderBook` shape regardless of asset class — CeFi perps, DeFi AMM pools, TradFi futures, prediction-market outcome books.",
    uacType: "CanonicalOrderBook",
    pythonType: `from unified_api_contracts.market import CanonicalOrderBook

class CanonicalOrderBook:
    venue: str
    symbol: str
    timestamp: AwareDatetime
    bids: list[tuple[Decimal, Decimal]]     # [(price, qty), ...]
    asks: list[tuple[Decimal, Decimal]]     # [(price, qty), ...]
    sequence_number: int | None
    instrument_key: str | None              # "VENUE:TYPE:SYMBOL"
    levels: int | None
    schema_version: str = "1.0"`,
    curl: `curl -H "Authorization: Bearer $ODUM_TOKEN" \\
  "https://api.odum.io/v1/market/orderbook/BINANCE/BTC-USDT?levels=20"`,
    responseJson: `{
  "venue": "BINANCE",
  "symbol": "BTC-USDT",
  "timestamp": "2026-04-20T14:22:01.245Z",
  "bids": [["69421.10", "0.842"], ["69421.00", "1.503"]],
  "asks": [["69421.30", "0.615"], ["69421.40", "0.900"]],
  "sequence_number": 18230519,
  "instrument_key": "BINANCE:SPOT:BTC-USDT",
  "levels": 20,
  "schema_version": "1.0"
}`,
  },
  {
    anchorId: "api-execution-order",
    facade: "execution",
    title: "Submit order",
    status: "planned",
    method: "POST",
    path: "/v1/execution/orders",
    description:
      "Submit a parent order. The executor routes children through the configured algorithm (VWAP / TWAP / POV / IS) and streams `CanonicalFill` events back. Returns a `CanonicalOrder` with `status=PENDING` immediately; subsequent fills arrive on the execution WebSocket.",
    uacType: "CanonicalOrder",
    pythonType: `from unified_api_contracts.execution import CanonicalOrder, OrderSide, OrderType

class CanonicalOrder:
    order_id: str
    client_order_id: str | None
    timestamp: AwareDatetime
    venue: str
    instrument_id: str
    side: OrderSide                     # BUY | SELL
    order_type: OrderType               # MARKET | LIMIT | STOP | ...
    quantity: Decimal
    price: Decimal | None
    time_in_force: TimeInForce = GTC
    status: OrderStatus = PENDING
    filled_quantity: Decimal = 0
    strategy_id: str | None
    client_id: str | None               # scoped by JWT
    # ... plus 15+ optional derivative / DeFi fields`,
    curl: `curl -X POST -H "Authorization: Bearer $ODUM_TOKEN" \\
  -H "Content-Type: application/json" \\
  https://api.odum.io/v1/execution/orders \\
  -d '{
    "venue": "BINANCE",
    "instrument_id": "BTC-USDT-PERP",
    "side": "BUY",
    "order_type": "LIMIT",
    "quantity": "0.5",
    "price": "69200.00",
    "time_in_force": "GTC",
    "strategy_id": "stat-arb-pairs-fixed-btc-eth",
    "client_id": "alpha-share-class-a"
  }'`,
    responseJson: `{
  "order_id": "ord_01JS4AKX2Z7MFW",
  "client_order_id": null,
  "timestamp": "2026-04-20T14:22:04.118Z",
  "venue": "BINANCE",
  "instrument_id": "BTC-USDT-PERP",
  "side": "BUY",
  "order_type": "LIMIT",
  "quantity": "0.5",
  "price": "69200.00",
  "time_in_force": "GTC",
  "status": "PENDING",
  "filled_quantity": "0",
  "strategy_id": "stat-arb-pairs-fixed-btc-eth",
  "client_id": "alpha-share-class-a",
  "schema_version": "1.0"
}`,
  },
  {
    anchorId: "api-strategy-availability",
    facade: "strategy",
    title: "List available strategies",
    status: "planned",
    method: "GET",
    path: "/v1/strategy/availability",
    description:
      "Returns the strategy catalogue sliced to what your principal is entitled to see. Applies role × lock-state × maturity filtering server-side — a SaaS subscriber sees only PUBLIC strategies, an IM client sees their CLIENT_EXCLUSIVE plus PUBLIC, Odum admin sees everything.",
    uacType: "StrategyAvailabilityEntry",
    pythonType: `from unified_api_contracts.strategy import (
    StrategyAvailabilityEntry, LockState, StrategyMaturity
)

class StrategyAvailabilityEntry:
    slot_label: str                     # "stat-arb-pairs-fixed-btc-eth"
    archetype: str                      # "STAT_ARB_PAIRS_FIXED"
    category: str                       # "CEFI" | "DEFI" | "TRADFI" | ...
    instrument_type: str                # "spot" | "perp" | "dated_future" | ...
    lock_state: LockState               # PUBLIC | IM_RESERVED | CLIENT_EXCLUSIVE
    maturity: StrategyMaturity          # CODE_NOT_WRITTEN → LIVE_ALLOCATED
    exclusive_client_id: str | None
    reserving_business_unit_id: str | None`,
    curl: `curl -H "Authorization: Bearer $ODUM_TOKEN" \\
  "https://api.odum.io/v1/strategy/availability?category=CEFI&min_maturity=BACKTESTED"`,
    responseJson: `{
  "entries": [
    {
      "slot_label": "stat-arb-pairs-fixed-btc-eth",
      "archetype": "STAT_ARB_PAIRS_FIXED",
      "category": "CEFI",
      "instrument_type": "perp",
      "lock_state": "PUBLIC",
      "maturity": "LIVE_ALLOCATED",
      "exclusive_client_id": null,
      "reserving_business_unit_id": null
    }
  ],
  "total": 1,
  "sliced_by": { "role": "saas_subscriber", "org_id": "alpha-capital" }
}`,
  },
  {
    anchorId: "api-position-snapshot",
    facade: "position",
    title: "Account snapshot (positions + balances)",
    status: "planned",
    method: "GET",
    path: "/v1/position/snapshot",
    description:
      "Current positions and balances scoped to your org's funds and clients by the JWT claims. Pass `client_id` to narrow to a single client (must be in your org); omit for all clients you can see.",
    uacType: "CanonicalAccountSnapshot",
    pythonType: `from unified_api_contracts.position import CanonicalAccountSnapshot

class CanonicalAccountSnapshot:
    timestamp: AwareDatetime
    org_id: str
    fund_id: str
    client_id: str
    positions: list[CanonicalPosition]
    balances: list[CanonicalBalance]
    total_nav: Decimal
    schema_version: str = "1.0"`,
    curl: `curl -H "Authorization: Bearer $ODUM_TOKEN" \\
  "https://api.odum.io/v1/position/snapshot?client_id=alpha-share-class-a"`,
    responseJson: `{
  "timestamp": "2026-04-20T14:22:10.000Z",
  "org_id": "alpha-capital",
  "fund_id": "alpha-pooled-fund",
  "client_id": "alpha-share-class-a",
  "positions": [
    {
      "venue": "BINANCE",
      "instrument_id": "BTC-USDT-PERP",
      "quantity": "0.5",
      "entry_price": "69180.00",
      "mark_price": "69421.30",
      "unrealised_pnl": "120.65"
    }
  ],
  "balances": [
    { "venue": "BINANCE", "asset": "USDT", "free": "24830.50", "locked": "500.00" }
  ],
  "total_nav": "58420.15",
  "schema_version": "1.0"
}`,
  },
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

function ApiRefBlock({ apiRef }: { apiRef: ApiRef }) {
  const statusBadge =
    apiRef.status === "planned"
      ? { label: "Planned v1 REST", tone: "amber" }
      : { label: "Live internal route", tone: "emerald" };
  return (
    <div id={apiRef.anchorId} className="scroll-mt-24 space-y-3 rounded-md border border-border/60 bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{apiRef.facade}</code>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            statusBadge.tone === "amber"
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
          )}
        >
          {statusBadge.label}
        </span>
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase">{apiRef.method}</span>
        <code className="text-sm font-semibold break-all">{apiRef.path}</code>
      </div>
      <p className="text-sm font-medium">{apiRef.title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{apiRef.description}</p>
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          UAC schema (source of truth)
        </p>
        <pre className="overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed">
          <code>{apiRef.pythonType}</code>
        </pre>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Request</p>
        <pre className="overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed">
          <code>{apiRef.curl}</code>
        </pre>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Response</p>
        <pre className="overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed">
          <code>{apiRef.responseJson}</code>
        </pre>
      </div>
    </div>
  );
}

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
      {/* Mobile / tablet TOC — collapsible, hidden on md+ where the sidebar takes over */}
      <details className="mb-8 rounded-lg border border-border bg-card/40 md:hidden">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium select-none">On this page</summary>
        <ul className="px-4 pb-3 pt-1 space-y-1">
          {NAV_SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="block rounded py-1.5 text-sm text-muted-foreground hover:text-foreground">
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
          <DocsNav sections={NAV_SECTIONS} />
        </aside>
        <div className="min-w-0 flex-1 space-y-12">
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

          <section id="api-reference" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2">
              <Terminal className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">API reference</h2>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Concrete request / response shapes per UAC facade. Endpoints marked{" "}
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Planned v1 REST
              </span>{" "}
              map one-to-one onto the UAC canonical types — the schema is stable and already enforced internally; the
              HTTP surface that exposes it is still on the{" "}
              <Link href="#roadmap" className="text-primary underline-offset-2 hover:underline">
                roadmap
              </Link>
              . Examples here use real canonical types so you can build clients against them today.
            </p>
            <div className="space-y-4">
              {API_REFERENCES.map((entry) => (
                <ApiRefBlock key={entry.anchorId} apiRef={entry} />
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
                purpose="Live entitlements, real fund scoping, per-client catalogue slicing. Your email maps to an org; the JWT carries org_id, fund_id and client_id as custom claims."
                how="Firebase prod (SSO on request). Every response is filtered by role × org × entitlement × lock state × maturity before it leaves the API — clients see only their org's funds and clients, Odum admin sees the full stack."
                example="trader@alpha-capital.com → org=alpha-capital → can list Alpha's funds and share classes, submit orders scoped to their client_id, read TCA for their own fills. Cannot see other orgs."
                icon={<Lock className="size-4 text-muted-foreground" aria-hidden />}
              />
            </div>
          </section>

          <section id="org-scoping" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Organisation & entitlements
              </h2>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Production auth is organisation-scoped: your email maps to an org, your JWT carries that identity, and
              every API response is server-side filtered to the fund / client rows you can see. The hierarchy is four
              levels deep.
            </p>

            <div className="rounded-md border border-border/60 bg-muted/40 p-4">
              <pre className="overflow-x-auto text-xs leading-relaxed">
                <code>{`Organisation (org)
  └── Fund (Pooled or SMA)
        └── Client (share class, or sole client for SMA)
              └── API keys (per venue, per client — never shared)`}</code>
              </pre>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                SSOT:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                  codex/14-playbooks/cross-cutting/fund-org-hierarchy.md
                </code>
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-md border border-border/60 bg-background p-4 text-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  JWT custom claims (production Firebase)
                </p>
                <pre className="overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed">
                  <code>{`{
  "sub": "trader@alpha-capital.com",
  "role": "im_client",
  "org_id": "alpha-capital",
  "fund_ids": ["alpha-pooled-fund"],
  "client_ids": [
    "alpha-share-class-a",
    "alpha-share-class-b"
  ],
  "entitlements": [
    "strategy:read",
    "execution:submit:alpha-share-class-a",
    "reports:read:org"
  ]
}`}</code>
                </pre>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground/85">Today:</span>{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[11px]">org_id</code> ships as a custom claim.{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[11px]">fund_ids</code> and{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[11px]">client_ids</code> are a tracked gap — until
                  they ship, the UI narrows via a dropdown picker + one API roundtrip per page.
                </p>
              </div>

              <div className="space-y-2 rounded-md border border-border/60 bg-background p-4 text-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Example — list clients in your org
                </p>
                <pre className="overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed">
                  <code>{`curl -H "Authorization: Bearer $ODUM_TOKEN" \\
  https://api.odum.io/v1/account/clients

{
  "org_id": "alpha-capital",
  "funds": [
    {
      "fund_id": "alpha-pooled-fund",
      "structure": "POOLED",
      "clients": [
        { "client_id": "alpha-share-class-a", "tier": "retail" },
        { "client_id": "alpha-share-class-b", "tier": "institutional" },
        { "client_id": "alpha-share-class-c", "tier": "founder" }
      ]
    }
  ]
}`}</code>
                </pre>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No <code className="rounded bg-muted px-1 py-0.5 text-[11px]">?org_id=</code> query param — the JWT is
                  the scope. You only ever see your own org.
                </p>
              </div>
            </div>

            <div className="rounded-md border border-border/60 bg-background p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                What org-scoping enforces, per endpoint
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground leading-relaxed">
                <li>
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /v1/account/clients</code> — returns only
                  funds / clients in your <code>org_id</code>.
                </li>
                <li>
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /v1/position/snapshot</code> — requires{" "}
                  <code>client_id</code> to be in your claim&apos;s <code>client_ids</code>; 403 otherwise.
                </li>
                <li>
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /v1/execution/orders</code> — rejects if
                  the <code>client_id</code> on the order is outside your entitlement, or the <code>strategy_id</code>{" "}
                  is lock-state <code>CLIENT_EXCLUSIVE</code> for a different client.
                </li>
                <li>
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /v1/strategy/availability</code> —
                  pre-filters by role × lock state × maturity before returning. SaaS subscriber sees PUBLIC only; IM
                  client sees PUBLIC + their CLIENT_EXCLUSIVE; admin sees everything.
                </li>
                <li>
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /v1/reports/*</code> — pooled funds vs SMA
                  funds render different aggregation shapes; the report surface is shared between Investment Management
                  and the Regulatory Umbrella — the narrative differs, the code path does not.
                </li>
              </ul>
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
        </div>
      </div>
    </div>
  );
}
