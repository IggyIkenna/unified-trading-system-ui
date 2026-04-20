import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegUmbrellaHierarchyDiagram } from "@/components/marketing/reg-umbrella-hierarchy-diagram";

/**
 * Regulatory Umbrella — public marketing page.
 *
 * Content axes: read-only-key custody mechanic (same shape as IM), multi-fund /
 * SMA designated-representative setup, supervisory artifacts list, same-system
 * claim. Multi-fund / SMA visual is tracked separately.
 *
 * Codex SSOT:
 *   codex/14-playbooks/_ssot-rules/03-same-system-principle.md
 *   codex/14-playbooks/playbooks/03-regulatory-umbrella.md
 */
export const metadata: Metadata = {
  title: "Regulatory Umbrella — Odum Research",
  description:
    "Operate regulated activity under Odum's FCA permissions. Multi-fund / SMA designated-representative setup, same custody + reporting model as Investment Management, supervisory artifacts included.",
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
              <Badge variant="outline">FCA 975797</Badge>
              <Badge variant="outline">Designated representative</Badge>
            </div>
            <h1 className="text-3xl font-bold">Regulatory Umbrella</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Operate regulated activity under Odum&apos;s FCA permissions.
              Onboarding covers regulatory scope, compliance artefacts, MLRO
              coverage, and supervisory reporting. The reporting surface is the
              same component tree Odum uses internally for its own investment
              management.
            </p>
          </div>

          {/* How custody works (read-only-key mechanic) */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How custody works</CardTitle>
              <CardDescription>
                Odum does not take custody of client or sub-entity capital. The
                regulatory umbrella is a permission and supervision construct,
                not a custody construct.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Client retains venue custody. Client issues scoped
                read-only-plus-execute API keys to Odum. Odum never custodies
                client capital. All trades settle in the client&apos;s venue
                account.
              </p>
              <p>
                Each fund or SMA under the regulatory client&apos;s umbrella
                follows the same key-scoping model: execution where required,
                read-only where only supervisory reconciliation is needed,
                withdrawal permission never requested.
              </p>
            </CardContent>
          </Card>

          {/* Multi-fund / SMA setup */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Multi-fund / SMA setup</CardTitle>
              <CardDescription>
                Designated-representative structure: the regulatory client sits
                above one or more sub-entities, each with its own share class
                or SMA book.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Regulatory clients act as designated representatives with N
                funds or SMAs under them; each sub-entity has its own share
                class or SMA book.
              </p>
              <p>
                Sub-entities are addressed independently in the reporting
                surface. Positions, NAV, attribution, and compliance artefacts
                are scoped to the sub-entity. The parent regulatory client has
                supervisory visibility across its own umbrella only &mdash;
                never across other regulatory clients on the platform.
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
                The platform produces the standard set of artefacts a
                designated representative needs to supervise sub-entity
                activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Monthly NAV per fund or SMA book.</li>
                <li>
                  Quarterly performance attribution at strategy and venue
                  granularity.
                </li>
                <li>
                  Compliance certifications and periodic attestations covering
                  mandate boundaries, best execution, and conflicts.
                </li>
                <li>
                  Audit-trail access covering instructions, orders, fills,
                  position movements, and reconciliation events.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Rule-03 same-system callout */}
          <div className="mb-8 rounded-lg border border-border bg-card/50 p-6">
            <h2 className="text-lg font-semibold">One system, partitioned views</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The same dashboards, risk controls, and audit trails serve IM
              clients that serve the Regulatory Umbrella &mdash; one system,
              slice-scoped per audience. Regulatory-client views carry an
              additional supervisory overlay across their own sub-entities,
              built on the same component tree.
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
            <h2 className="text-lg font-semibold">
              Regulatory scope and onboarding workstreams
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Regulatory scope details, onboarding workstreams, and the
              supervisory-reporting walkthrough sit behind the briefings access
              code.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/briefings/regulatory">
                  Open Regulatory briefing <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Book a call</Link>
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
                  Investment Management
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; same custody and reporting model; capital allocated
                  to Odum-run systematic strategies.
                </span>
              </li>
              <li>
                <Link
                  href="/briefings/regulatory"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Regulatory briefing
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; regulatory scope, onboarding workstreams, supervisory
                  artefacts in depth.
                </span>
              </li>
              <li>
                <Link
                  href="/who-we-are"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Firm
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; team, operating history, FCA credentials.
                </span>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Contact
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; book a regulatory-fit call.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
