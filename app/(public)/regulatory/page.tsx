import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegUmbrellaHierarchyDiagram } from "@/components/marketing/reg-umbrella-hierarchy-diagram";
import { BRIEFING_SLUGS, PUBLIC_ROUTE_PATHS, SERVICE_LABELS } from "@/lib/copy/service-labels";

/**
 * Regulatory Umbrella — public marketing page.
 *
 * Content axes: shape-aware venue-key custody mechanic (same shape as IM),
 * multi-fund / SMA umbrella mandate (default = Odum as IM under Shapes 1 or 2;
 * AR / designated-representative route under Shape 3 is available but not the
 * default because FCA AR registration adds 4-12 weeks of onboarding lead time),
 * supervisory artifacts list, same-system claim. Multi-fund / SMA visual is
 * tracked separately.
 *
 * Codex SSOT:
 *   codex/14-playbooks/_ssot-rules/03-same-system-principle.md
 *   codex/14-playbooks/playbooks/03-regulatory-umbrella.md
 */
export const metadata: Metadata = {
  title: `${SERVICE_LABELS.regulatory.marketing} | Odum Research`,
  description:
    "Structure the engagement around the right governance, permissions, reporting, and affiliate pathway where required. FCA-regulated (FRN 975797). Multi-fund / SMA umbrella mandate, same custody and reporting model as Odum-Managed Strategies, supervisory artifacts included. Default has Odum as IM of record; AR-style arrangements available case by case.",
};

export default function RegulatoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Regulatory Umbrella</Badge>
              <Badge variant="outline">Multi-vehicle mandate</Badge>
            </div>
            <h1 className="text-3xl font-bold">{SERVICE_LABELS.regulatory.marketing}</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Some trading engagements require more than technology. Where appropriate, Odum can structure selected
              engagements around governance, supervisory reporting, FCA coverage, SMA routes, or affiliate fund
              pathways. The reporting surface is the same component tree Odum uses internally for its own investment
              management.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Coverage and structure are reviewed case by case; engagement scope is confirmed after the fit call.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/briefings/${BRIEFING_SLUGS.regulatory}`}>
                  Read the briefing <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={PUBLIC_ROUTE_PATHS.startYourReview}>Start Your Review</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Briefings are gated. Start your review to receive an access code.
            </p>
          </div>

          {/* How custody works (read-only-key mechanic) */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How custody works</CardTitle>
              <CardDescription>
                Odum does not take custody of client or sub-entity capital. The regulatory umbrella is a permission and
                supervision construct, not a custody construct.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Venue custody stays with the umbrella client (for SMA) or with a qualified third-party custodian like
                Copper (for Fund). Odum operates scoped venue API keys in Secret Manager with no withdrawal authority,
                ever. The key scope follows the mandate shape: execute-plus-read where Odum is IM of record and runs
                execution, read-only-plus-read-transaction where the umbrella client is IM and executes under its own
                authorisation or AR status.
              </p>
              <p>
                Each fund or SMA under the umbrella client follows the same key-scoping rule per its mandate shape.
                Withdrawal permission is never requested under any configuration. Who controls the account is the
                regulatory-relevant test — and that is always the IM of record under the mandate, not the legal
                account-holder and not the venue-facing operational party.
              </p>
            </CardContent>
          </Card>

          {/* Multi-fund / SMA setup */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Multi-fund / SMA setup</CardTitle>
              <CardDescription>
                Umbrella mandate: one client sits above one or more sub-entities, each with its own share class or SMA
                book. The hierarchy is the same across all three umbrella mandate shapes (Odum as IM, or your firm as AR
                under Odum).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                The default shape has Odum Research Ltd (or the EU-regulated affiliate for EU-AIFM wrappers) as
                investment manager of record, with the umbrella client as advisor, introducer, or sub-advisor.
                Onboarding is fast because no FCA AR registration is required. The appointed-representative route is
                available where the umbrella client specifically wants to be customer-facing IM under its own brand; FCA
                AR registration typically adds 4&ndash;12 weeks of lead time, so speed-to-live engagements default to
                the Odum-as-IM shape.
              </p>
              <p>
                Sub-entities are addressed independently in the reporting surface. Positions, NAV, attribution, and
                compliance artefacts are scoped to the sub-entity. The parent umbrella client has supervisory visibility
                across its own umbrella only &mdash; never across other umbrella clients on the platform.
              </p>
            </CardContent>
          </Card>

          {/* Regulatory umbrella hierarchy diagram — Phase 4 visual */}
          <RegUmbrellaHierarchyDiagram />

          {/* Supervisory artifacts */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Supervisory artefacts</CardTitle>
              <CardDescription>
                The platform produces the standard set of artefacts the umbrella client needs to supervise sub-entity
                activity &mdash; identical whether Odum is IM of record or the umbrella client operates as AR under
                Odum.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Monthly NAV per fund or SMA book.</li>
                <li>Quarterly performance attribution at strategy and venue granularity.</li>
                <li>
                  Compliance certifications and periodic attestations covering mandate boundaries, best execution, and
                  conflicts.
                </li>
                <li>
                  Audit-trail access covering instructions, orders, fills, position movements, and reconciliation
                  events.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Rule-03 same-system callout */}
          <div className="mb-8 rounded-lg border border-border bg-card/50 p-6">
            <h2 className="text-lg font-semibold">One system, partitioned views</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The same dashboards, risk controls, and audit trails serve allocators on{" "}
              {SERVICE_LABELS.investment.marketing} as serve umbrella clients here &mdash; one system, slice-scoped per
              audience. Umbrella-client views carry an additional supervisory overlay across their own sub-entities,
              built on the same component tree.
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
            <h2 className="text-lg font-semibold">Regulatory scope and onboarding workstreams</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Regulatory scope details, onboarding workstreams, and the supervisory-reporting walkthrough sit behind the
              briefings access code. You can{" "}
              <Link
                href="/contact?service=regulatory&action=request-access"
                className="text-primary underline-offset-4 hover:underline"
              >
                request a code here
              </Link>
              .
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href={`/briefings/${BRIEFING_SLUGS.regulatory}`}>
                  Open {SERVICE_LABELS.regulatory.marketing} briefing <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={PUBLIC_ROUTE_PATHS.contact}>Contact Odum</Link>
              </Button>
            </div>
          </div>

          {/* Related */}
          <div className="mt-10 rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">Related</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/investment-management"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {SERVICE_LABELS.investment.marketing}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; same custody and reporting model; allocate capital to selected systematic strategies managed
                  by Odum.
                </span>
              </li>
              <li>
                <Link href="/platform" className="font-medium text-foreground underline-offset-4 hover:underline">
                  {SERVICE_LABELS.dart.marketing}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; the underlying research-to-execution stack; available on its own without the regulatory
                  overlay.
                </span>
              </li>
              <li>
                <Link
                  href="/briefings/regulated-operating-models"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Regulated Operating Models briefing
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; regulatory scope, onboarding workstreams, supervisory artefacts in depth (gated).
                </span>
              </li>
              <li>
                <Link href="/who-we-are" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Who We Are
                </Link>
                <span className="text-muted-foreground"> &mdash; team, operating history, FCA credentials.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
