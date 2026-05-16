"use client";

/**
 * DART Terminal — operator landing page (option-c narrow scope, 2026-05-10).
 *
 * Lists every archetype declared in the workspace `ARCHETYPE_METADATA`
 * registry (mirror of UAC `StrategyArchetype` + `ArchetypeCapability`)
 * and renders the per-archetype AutomationToggle. Each archetype row
 * also links to the existing manual-trading-panel Sheet for operator-
 * driven instructions.
 *
 * Per workspace CLAUDE.md "Batch = Live": no separate manual-trade
 * execution path — this page links to the same `ManualTradingPanel`
 * Sheet that the trading overview surfaces use; the only thing this
 * landing page contributes is the per-archetype OperationalMode +
 * in-flight TradeMonitor view.
 *
 * The TradeMonitor is rendered for any in-flight instruction id
 * surfaced via the `?instruction=<id>` URL param (operator can deep
 * link from a notification / event / chat). When the param is absent
 * no monitor renders.
 *
 * Persona ACL: requires DART-Full / admin entitlement. Non-DART-Full
 * users get redirected to `/services/dart/locked?from=terminal`,
 * mirroring the locked-page pattern shipped at
 * `app/(platform)/services/dart/locked/page.tsx`.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/issues/dart_manual_trade_ui_build_2026_05_10.md
 *   (Phase C — option-c narrow scope).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AutomationToggle, type OperationalMode } from "@/components/dart/automation-toggle";
import { DartThreeWayView } from "@/components/dart/dart-three-way-view";
import { ManualTradeGateDialog } from "@/components/dart/manual-trade-gate-dialog";
import { TradeMonitor } from "@/components/dart/trade-monitor";
import { useAuth } from "@/hooks/use-auth";
import { ARCHETYPE_METADATA } from "@/lib/architecture-v2";
import type { ArchetypeMetadata } from "@/lib/architecture-v2/archetypes";
import { ChevronRight, ShieldAlert, Terminal } from "lucide-react";

// Default OperationalMode for un-seeded archetypes. The route the
// AutomationToggle hits returns the actual server-side state on first
// transition; until the operator interacts the surface displays MANUAL
// (the safe default — no archetype signal execution).
const DEFAULT_MODE: OperationalMode = "MANUAL";

interface ArchetypeRow {
  readonly metadata: ArchetypeMetadata;
  readonly initialMode: OperationalMode;
}

function deriveArchetypeRows(): readonly ArchetypeRow[] {
  return Object.values(ARCHETYPE_METADATA).map((metadata) => ({
    metadata,
    initialMode: DEFAULT_MODE,
  }));
}

export default function DartTerminalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const instructionId = searchParams.get("instruction");

  // Persona ACL: only DART-Full / internal / admin personas reach this page.
  // The route renders nothing while the auth provider is still resolving;
  // unauthorized users are punted to the locked page.
  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/services/dart/locked?from=terminal");
      return;
    }
    const role = user.role;
    if (role !== "admin" && role !== "internal" && role !== "client") {
      router.replace("/services/dart/locked?from=terminal");
    }
  }, [loading, router, user]);

  const rows = React.useMemo(() => deriveArchetypeRows(), []);

  if (loading || !user) {
    return null;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10" data-testid="dart-terminal-page">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Terminal className="size-6" aria-hidden />
            DART Terminal
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Operator surface for the live archetype mesh. Switch any archetype between MANUAL, PAPER, and LIVE modes;
            submit operator-driven manual trades via the trade panel; and monitor in-flight instructions in real time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* pvl-p23c: Manual trade gate — approval queue for MANUAL-mode instructions */}
          <ManualTradeGateDialog>
            <Button variant="outline" size="sm" data-testid="dart-terminal-gate-trigger">
              <ShieldAlert className="mr-1.5 size-4" aria-hidden />
              Trade gate
            </Button>
          </ManualTradeGateDialog>
          <Button variant="outline" size="sm" asChild data-testid="dart-terminal-trade-link">
            <Link href="/services/dart/terminal/manual">
              Manual trade
              <ChevronRight className="ml-1 size-4" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild data-testid="dart-terminal-strategies-link">
            <Link href="/services/strategy-catalogue">
              Strategy catalogue
              <ChevronRight className="ml-1 size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </header>

      {instructionId ? (
        <section className="mb-8" data-testid="dart-terminal-monitor-section">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            In-flight instruction
          </h2>
          <TradeMonitor instructionId={instructionId} />
        </section>
      ) : null}

      {/* pvl-p23a: 3-way batch/paper/live comparison — shows latest run across all modes */}
      <section className="mb-8" data-testid="dart-terminal-three-way-section">
        <DartThreeWayView strategyId="carry_staked_basis/defi/v1" />
      </section>

      <section data-testid="dart-terminal-archetypes-section">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Archetypes ({rows.length})
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rows.map(({ metadata, initialMode }) => (
            <Card
              key={metadata.archetype}
              data-testid="dart-terminal-archetype-row"
              data-archetype-id={metadata.archetype}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span>{metadata.label}</span>
                  <Badge variant="outline">{metadata.family}</Badge>
                </CardTitle>
                <CardDescription>{metadata.shortDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <AutomationToggle archetypeId={metadata.archetype} initialMode={initialMode} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
