"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import Link from "next/link";

export function SiteNavigationClient() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center gap-4">
          <Link href="/investor-relations" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- 28x28 logo; next/image overhead not justified */}
            <img src="/images/odum-logo.png" alt="Odum Research" className="size-7" />
            <span className="font-bold text-lg tracking-tight">
              ODUM<span className="text-primary">.</span>
            </span>
          </Link>
          <Badge variant="outline" className="text-xs">
            <Shield className="size-3 mr-1" />
            FCA 975797
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Portal & website navigation</h1>
          <p className="text-muted-foreground max-w-2xl">
            Board-facing walkthrough of the five engagement paths, where authentication applies, and where live versus
            fixture data matters. Keep this deck aligned with the IA child plan in the PM repo.
          </p>
        </div>

        <Accordion type="multiple" defaultValue={["five", "auth", "data"]} className="w-full space-y-2">
          <AccordionItem value="five" className="border border-border/60 rounded-lg px-4">
            <AccordionTrigger className="text-left font-semibold">Five engagement spaces</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="text-foreground font-medium">Public</span> — zero-auth marketing (`/`,
                  `/investment-management`, `/platform`, `/regulatory`, `/firm`, `/contact`).
                </li>
                <li>
                  <span className="text-foreground font-medium">Lighter gate</span> — `/briefings` pre-commitment
                  narrative; optional invite code via `NEXT_PUBLIC_BRIEFING_ACCESS_CODE`; separate session key from
                  staging gate and Firebase.
                </li>
                <li>
                  <span className="text-foreground font-medium">Investor relations</span> — entitled decks under
                  `/investor-relations/*` with granular keys plus optional `investor-archive`.
                </li>
                <li>
                  <span className="text-foreground font-medium">Investment management</span> — signed-in strategy
                  catalogue and performance surfaces (`/services/research/strategy/catalog`).
                </li>
                <li>
                  <span className="text-foreground font-medium">Platform</span> — operational stack (data, research,
                  build, trading, reporting, observation) starting at `/dashboard`.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="auth" className="border border-border/60 rounded-lg px-4">
            <AccordionTrigger className="text-left font-semibold">Authentication model</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
              <p>
                Public and lighter gate do not require Firebase. Platform and Investment management share the same
                signed-in session. Staging may use `NEXT_PUBLIC_STAGING_AUTH` and demo personas — see the UI repo
                `docs/DEPLOYMENT.md` for build-time flags.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="data" className="border border-border/60 rounded-lg px-4">
            <AccordionTrigger className="text-left font-semibold">Demo vs live data</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
              <p>
                `NEXT_PUBLIC_MOCK_API` and `NEXT_PUBLIC_STRATEGY_CATALOG_SOURCE` control catalogue sourcing. Runtime
                honesty uses `RuntimeModeBadge` — there is no global “preview site” banner.
              </p>
              <p>
                Reporting and terminal widgets may still branch on fixtures; the mock delta pass is tracked in
                `docs/DEPLOYMENT.md`.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <p className="text-xs text-muted-foreground">
          Internal cross-check: `unified-trading-pm/plans/active/five_space_ia_audit_matrix_2026_04_17.md` and child
          execution plan.
        </p>
      </main>
    </div>
  );
}
