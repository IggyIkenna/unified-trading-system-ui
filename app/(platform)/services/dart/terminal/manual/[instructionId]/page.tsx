"use client";

/**
 * DART Manual Trade — per-instruction monitor route (Phase C remainder, 2026-05-13).
 *
 * Dedicated deep-linkable route for monitoring a single in-flight instruction.
 * Renders TradeMonitor with the instruction_id from the URL path param.
 *
 * Upgrade from the ?instruction=<id> URL-param pattern on the terminal landing
 * page: this route gives first-class browser-history support, reload-persistence,
 * and persona ACL gating at the route level.
 *
 * Persona ACL: same gate as /dart/terminal — admin / internal / client only.
 * Non-DART personas → redirect to /services/dart/locked?from=manual-monitor.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/dart_manual_trade_ux_refactor_2026_05_13.md
 *   Phase C.2 — app/(platform)/services/dart/terminal/manual/[instructionId]/page.tsx.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TradeMonitor } from "@/components/dart/trade-monitor";
import { useAuth } from "@/hooks/use-auth";
import { Activity, ChevronLeft, PenLine } from "lucide-react";

export default function DartManualMonitorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();

  // Next.js dynamic route: params.instructionId is the [instructionId] segment.
  const rawInstructionId = params["instructionId"];
  const instructionId = Array.isArray(rawInstructionId)
    ? (rawInstructionId[0] ?? "")
    : (rawInstructionId ?? "");

  // Persona ACL.
  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/services/dart/locked?from=manual-monitor");
      return;
    }
    const role = user.role;
    if (role !== "admin" && role !== "internal" && role !== "client") {
      router.replace("/services/dart/locked?from=manual-monitor");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return null;
  }

  if (!instructionId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10" data-testid="dart-manual-monitor-page">
        <p className="text-sm text-destructive" data-testid="dart-manual-monitor-no-id">
          No instruction ID in URL.
        </p>
      </main>
    );
  }

  return (
    <main
      className="mx-auto max-w-3xl px-6 py-10"
      data-testid="dart-manual-monitor-page"
    >
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/services/dart/terminal" data-testid="dart-manual-monitor-terminal-link">
            <ChevronLeft className="mr-1 size-4" aria-hidden />
            DART Terminal
          </Link>
        </Button>
        <span>/</span>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/services/dart/terminal/manual" data-testid="dart-manual-monitor-manual-link">
            <PenLine className="mr-1 size-3" aria-hidden />
            Manual Trade
          </Link>
        </Button>
        <span>/</span>
        <span className="text-foreground font-mono text-xs truncate max-w-[200px]">
          {instructionId}
        </span>
      </nav>

      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Activity className="size-6" aria-hidden />
            Instruction Monitor
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time status for in-flight manual instruction. Polls every 5 seconds.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-[11px]" data-testid="dart-manual-monitor-id-badge">
          {instructionId}
        </Badge>
      </header>

      {/* Monitor */}
      <TradeMonitor
        instructionId={instructionId}
        pollIntervalMs={5_000}
      />

      {/* Actions */}
      <div className="mt-6 flex gap-2">
        <Button variant="outline" size="sm" asChild data-testid="dart-manual-monitor-new-trade-link">
          <Link href="/services/dart/terminal/manual">
            <PenLine className="mr-1 size-3" aria-hidden />
            New manual trade
          </Link>
        </Button>
      </div>
    </main>
  );
}
