"use client";

/**
 * DART Manual Trade — dedicated route (Phase C remainder, 2026-05-13).
 *
 * Hosts ManualTradeForm + TradePreview side-by-side (or stacked on mobile)
 * via the ExecutionDispatch coordinator. Reads `?archetype=` and `?venue=`
 * URL params for pre-population (e.g. when launched from the terminal page
 * or a notification deep-link).
 *
 * Persona ACL: DART-Full plan required.
 *   - admin / internal / client → rendered.
 *   - prospect / non-DART → redirect to /services/dart/locked?from=manual.
 *
 * On submit, ExecutionDispatch navigates automatically to:
 *   /services/dart/terminal/manual/{instructionId}
 *
 * Sheet surface (manual-trading-panel.tsx) is preserved in parallel per plan
 * out-of-scope note — Sheet retirement is post-cutover polish.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/dart_manual_trade_ux_refactor_2026_05_13.md
 *   Phase C.1 + C.2 — app/(platform)/services/dart/terminal/manual/page.tsx.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExecutionDispatch } from "@/components/dart/execution-dispatch";
import { useAuth } from "@/hooks/use-auth";
import { ChevronLeft, PenLine } from "lucide-react";

export default function DartManualPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultArchetype = searchParams.get("archetype") ?? "";
  const defaultVenue = searchParams.get("venue") ?? "";

  // Persona ACL — same gate as terminal landing page.
  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/services/dart/locked?from=manual");
      return;
    }
    const role = user.role;
    if (role !== "admin" && role !== "internal" && role !== "client") {
      router.replace("/services/dart/locked?from=manual");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return null;
  }

  return (
    <main
      className="mx-auto max-w-3xl px-6 py-10"
      data-testid="dart-manual-page"
    >
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/services/dart/terminal" data-testid="dart-manual-back-link">
            <ChevronLeft className="mr-1 size-4" aria-hidden />
            DART Terminal
          </Link>
        </Button>
        <span>/</span>
        <span className="text-foreground font-medium">Manual Trade</span>
      </nav>

      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <PenLine className="size-6" aria-hidden />
            Manual Trade Entry
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Submit an operator-driven instruction directly to the execution service. The instruction
            routes through the same execution path as automated archetype signals.
          </p>
        </div>
        <Badge variant="outline" data-testid="dart-manual-persona-badge">
          {user.role}
        </Badge>
      </header>

      {/* Form card */}
      <Card data-testid="dart-manual-form-card">
        <CardHeader>
          <CardTitle className="text-base">New instruction</CardTitle>
        </CardHeader>
        <CardContent>
          <ExecutionDispatch
            defaultArchetype={defaultArchetype}
            defaultVenue={defaultVenue}
          />
        </CardContent>
      </Card>
    </main>
  );
}
