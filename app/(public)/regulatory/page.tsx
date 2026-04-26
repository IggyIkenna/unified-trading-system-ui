import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PUBLIC_ROUTE_PATHS, SERVICE_LABELS } from "@/lib/copy/service-labels";

/**
 * Public Regulated Operating Models page — composed service-page layout.
 *
 * Per user review 2026-04-26 the prior version had the right copy but
 * read as a stack of full-width document cards. Refactored into a more
 * designed information architecture:
 *   - Hero with two badges (Regulated route / Case-by-case review).
 *   - Two-column overview: What this route covers + When it matters.
 *   - Structure-review checklist grid (the strongest content beat —
 *     scannable, not buried in prose).
 *   - Two-column lower row: Custody and control + Related routes.
 *   - 5-step process strip (numbered horizontal cards).
 *   - Final CTA band.
 *
 * Public copy MUST NOT include: API key scopes, Secret Manager refs,
 * MLRO sign-off detail, mandate-shape diagrams, AR registration timing,
 * multi-fund/SMA hierarchy mechanics, sub-fund/share-class detail,
 * venue lists, audit-trail mechanics, or N-to-one supervisory rollups.
 * That material lives in:
 *   /briefings/regulated-operating-models — gated buyer education
 *   /strategy-review                       — prospect-specific structure
 *   signed-in onboarding/client docs       — implementation detail
 */
export const metadata: Metadata = {
  title: `${SERVICE_LABELS.regulatory.marketing} | Odum Research`,
  description:
    "Some trading engagements need more than technology. Odum can help selected clients structure an appropriate operating model around governance, reporting, permissions, counterparties, and regulatory responsibilities. Coverage is reviewed case by case.",
};

interface ProcessStep {
  number: string;
  title: string;
  body: string;
}

const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    number: "01",
    title: "Start Your Review",
    body: "Tell us what you are trying to operate, manage, or structure.",
  },
  {
    number: "02",
    title: "Briefing",
    body: "We share the relevant regulated-model briefing after the initial review.",
  },
  {
    number: "03",
    title: "Fit call",
    body: "We confirm whether Odum, DART, an SMA route, or an affiliate pathway is relevant.",
  },
  {
    number: "04",
    title: "Strategy Evaluation",
    body: "You provide the specifics needed to assess structure, risk, and reporting.",
  },
  {
    number: "05",
    title: "Strategy Review",
    body: "We present the proposed operating model and next steps.",
  },
];

const STRUCTURE_AXES: readonly string[] = [
  "Who owns or originates the strategy.",
  "Who is expected to manage or supervise it.",
  "Where the capital will sit.",
  "What reporting and oversight are required.",
  "Which counterparties, custodians, venues, or affiliates are involved.",
  "Whether Odum, the client, or an affiliate should carry the relevant role.",
];

export default function RegulatoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 pb-20 pt-10 md:px-6 md:pb-24 md:pt-12">
        <div className="mx-auto max-w-6xl">
          {/* Hero */}
          <div className="mb-14 max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Regulated route</Badge>
              <Badge variant="outline">Case-by-case review</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{SERVICE_LABELS.regulatory.marketing}</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Some trading engagements need more than technology. Odum can help selected clients structure an
              appropriate operating model around governance, reporting, counterparties, permissions, and regulatory
              responsibilities.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Coverage is reviewed case by case. The right route depends on who manages the strategy, who faces the
              client, where the capital sits, and what approvals or affiliate arrangements are required.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={PUBLIC_ROUTE_PATHS.startYourReview}>
                  Start Your Review <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={PUBLIC_ROUTE_PATHS.contact}>Contact Odum</Link>
              </Button>
            </div>
          </div>

          {/* Two-column overview: covers + matters */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/60 bg-card/40">
              <CardHeader>
                <CardTitle>What this route covers</CardTitle>
                <CardDescription>
                  Regulated Operating Models are the governance and structuring layer around selected trading
                  engagements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  The structure may include SMA arrangements, Odum-managed mandates, affiliate fund pathways,
                  supervisory reporting, or other approved arrangements depending on the engagement.
                </p>
                <p>
                  In some cases, the structuring layer may be the main engagement. In others, it sits alongside an
                  Odum-managed strategy or DART Trading Infrastructure mandate.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/40">
              <CardHeader>
                <CardTitle>When it matters</CardTitle>
                <CardDescription>This route may be relevant when a client needs to:</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/85">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary/70" aria-hidden />
                    <span className="leading-snug">Operate a strategy under a clearer governance framework.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary/70" aria-hidden />
                    <span className="leading-snug">Separate trading activity across mandates, funds, or accounts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary/70" aria-hidden />
                    <span className="leading-snug">Evidence reporting, oversight, and audit trails.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary/70" aria-hidden />
                    <span className="leading-snug">
                      Use Odum&rsquo;s infrastructure while maintaining appropriate controls.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary/70" aria-hidden />
                    <span className="leading-snug">
                      Assess whether an SMA, fund route, affiliate pathway, or regulated arrangement is suitable.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* How Odum approaches structure — 2-col checklist grid */}
          <Card className="mt-16 border-border/60 bg-card/40">
            <CardHeader>
              <CardTitle>How Odum approaches structure</CardTitle>
              <CardDescription>
                We start with the commercial and operational facts of the engagement. The outcome is not assumed in
                advance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-x-8 gap-y-3 text-sm text-foreground/85 md:grid-cols-2">
                {STRUCTURE_AXES.map((axis) => (
                  <li key={axis} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary/70" aria-hidden />
                    <span className="leading-snug">{axis}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Some engagements may need only DART infrastructure. Others may require a more formal regulated or
                affiliate-supported model.
              </p>
            </CardContent>
          </Card>

          {/* Two-column lower row: custody + related routes */}
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            <Card className="border-border/60 bg-card/40">
              <CardHeader>
                <CardTitle>Custody and control</CardTitle>
                <CardDescription>
                  Odum does not present regulated operating models as a custody service.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Where custody, brokerage, exchange, or fund-administration arrangements are required, they are
                  structured through the appropriate account, custodian, venue, broker, administrator, or affiliate
                  route. Permissions and controls are scoped to the agreed mandate and documented in the relevant
                  operating model.
                </p>
              </CardContent>
            </Card>
            <div className="rounded-lg border border-border/60 bg-card/30 p-6">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Related routes</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link
                    href={PUBLIC_ROUTE_PATHS.investment}
                    className="group flex items-center justify-between rounded-md border border-border/40 bg-card/30 p-3 transition-colors hover:border-border hover:bg-card/60"
                  >
                    <span>
                      <span className="block font-medium text-foreground">{SERVICE_LABELS.investment.marketing}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Allocate to selected systematic strategies managed by Odum.
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href={PUBLIC_ROUTE_PATHS.dart}
                    className="group flex items-center justify-between rounded-md border border-border/40 bg-card/30 p-3 transition-colors hover:border-border hover:bg-card/60"
                  >
                    <span>
                      <span className="block font-medium text-foreground">{SERVICE_LABELS.dart.marketing}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Build, run, monitor, or scale strategies through Odum&rsquo;s infrastructure.
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Process strip — numbered horizontal cards */}
          <section className="mt-20">
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              How the process works
            </h3>
            <div className="grid gap-3 md:grid-cols-5">
              {PROCESS_STEPS.map((step) => (
                <div
                  key={step.number}
                  className="flex h-full flex-col rounded-md border border-border/60 bg-card/30 p-4"
                >
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary/85">
                    {step.number}
                  </span>
                  <span className="mt-2 text-sm font-semibold leading-tight text-foreground">{step.title}</span>
                  <span className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.body}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA band */}
          <section className="mt-24 rounded-lg border border-border/60 bg-gradient-to-b from-card/60 to-card/30 p-8 text-center md:p-12">
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Ready to understand the right route?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              Start with a short review. We&rsquo;ll route you to the relevant briefing and next step.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href={PUBLIC_ROUTE_PATHS.startYourReview}>Start Your Review</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={PUBLIC_ROUTE_PATHS.contact}>Contact Odum</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
