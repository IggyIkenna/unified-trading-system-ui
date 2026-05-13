"use client";

/**
 * Treasury landing page — multi-source NAV rollup view.
 *
 * Calls GET /api/treasury/rollup and renders:
 *   - Total NAV KPI
 *   - Multi-source breakdown (TreasuryRollupCard)
 *   - Links to per-client deep-dive
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/wallet_treasury_client_flow_2026_05_10.md
 *   Phase 6.C.
 */

import * as React from "react";
import Link from "next/link";
import { Users } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TreasuryRollupCard } from "@/components/treasury/treasury-rollup-card";
import { getTreasuryRollup } from "@/lib/api/treasury-client";
import type { TreasuryRollupResponse } from "@/lib/api/treasury-client";

// Demo clients to show quick-link tiles to
const DEMO_CLIENTS = [
  { id: "demo-client-001", label: "Demo Client 001", description: "Primary cutover demo" },
  { id: "client-full", label: "Alpha Capital PM", description: "Full-entitlement test persona" },
];

export default function TreasuryPage() {
  const [rollup, setRollup] = React.useState<TreasuryRollupResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const loading = rollup === null && error === null;

  React.useEffect(() => {
    let cancelled = false;
    getTreasuryRollup()
      .then((data) => {
        if (!cancelled) setRollup(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex-1 p-6 space-y-6" data-testid="treasury-page">
      <PageHeader
        title="Treasury"
        description="Multi-source custody NAV rollup: Copper · CEFFU · DeFi wallet · CeFi sub-accounts."
      />

      {/* Multi-source rollup card */}
      <TreasuryRollupCard data={rollup} loading={loading} error={error} />

      {/* Per-client deep-dive links */}
      <Card data-testid="treasury-client-links">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Client Treasury Views
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DEMO_CLIENTS.map((client) => (
              <Link
                key={client.id}
                href={`/services/treasury/${encodeURIComponent(client.id)}`}
                data-testid={`treasury-client-link-${client.id}`}
                className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="p-1.5 rounded bg-muted shrink-0">
                  <Users className="size-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{client.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{client.description}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/services/treasury/demo-client-001">
                Open Demo Client Deep-dive →
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
