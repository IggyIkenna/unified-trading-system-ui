"use client";

import { CheckCircle2, Zap } from "lucide-react";
import { useEffect, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AllocationDirective } from "@/lib/architecture-v2/allocator";
import { MOCK_DIRECTIVE_HISTORY } from "@/lib/mocks/fixtures/architecture-v2-fixtures";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";

/**
 * G2.10 Phase D — Trading-platform-side allocator auto-apply flow.
 *
 * Platform subscribers don't approve each directive manually — the
 * allocator commits directly on client-infra. This component shows:
 *
 * * A confirmation strip with the most recent auto-applied directive.
 * * Allocation history of past auto-applied directives (mock fixtures).
 *
 * Every render emits a synthetic ``ALLOCATION_AUTO_APPLIED`` event per
 * directive to ``window`` for Playwright assertion. In prod the event
 * comes from the strategy-service emitter via Pub/Sub.
 */

interface AutoAppliedEvent {
  readonly directiveId: string;
  readonly allocatorInstanceId: string;
  readonly totalNavUsd: number;
  readonly timestampUtc: string;
}

function toAutoEvent(directive: AllocationDirective): AutoAppliedEvent {
  return {
    directiveId: directive.directive_id,
    allocatorInstanceId: directive.allocator_instance_id,
    totalNavUsd: directive.total_nav_usd,
    timestampUtc: directive.emitted_at,
  };
}

export function AllocationApplied(): React.ReactElement {
  const directives = MOCK_DIRECTIVE_HISTORY;
  // Compute events from directives synchronously — avoids the
  // react-hooks/set-state-in-effect warning. In prod this gets replaced
  // with a subscription to the strategy-service AllocationDirective event
  // stream (which is the right place for setState-in-effect).
  const events = useMemo(() => directives.map(toAutoEvent), [directives]);

  useEffect(() => {
    // Side-effect only: dispatch a window CustomEvent per directive on mount.
    // No setState here — events were computed via useMemo above.
    if (typeof window === "undefined") return;
    for (const event of events) {
      const customEvent = new CustomEvent("ALLOCATION_AUTO_APPLIED", {
        detail: event,
      });
      window.dispatchEvent(customEvent);
    }
  }, [events]);

  const latest = directives[0];

  return (
    <div className="space-y-4" data-testid="allocation-applied">
      {latest ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex items-center justify-between gap-4 pt-5">
            <div className="flex items-center gap-3">
              <Zap className="size-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold">Auto-applied</p>
                <p className="text-[11px] text-muted-foreground">
                  {latest.allocator_instance_id} emitted {new Date(latest.emitted_at).toLocaleString()} ·{" "}
                  {latest.equity_directives.length} equity directives · total NAV{" "}
                  {formatCurrency(latest.total_nav_usd, "USD", 0)}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] text-emerald-400 border-emerald-500/40"
              data-testid="auto-apply-badge"
            >
              <CheckCircle2 className="mr-1 size-3" />
              APPLIED
            </Badge>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-3 pt-5">
          <div>
            <h3 className="text-lg font-semibold">Recent allocations</h3>
            <p className="text-xs text-muted-foreground">
              Auto-applied directives from this allocator instance. No manual approval step: platform subscribers trust
              the algorithm.
            </p>
          </div>
          {directives.map((dir) => (
            <div
              key={dir.directive_id}
              className="rounded-lg border border-border/40 p-3"
              data-testid={`auto-directive-${dir.directive_id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {dir.allocator_instance_id} · {dir.cadence_trigger}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(dir.emitted_at).toLocaleString()} · {dir.equity_directives.length} equity directives ·
                    total NAV {formatCurrency(dir.total_nav_usd, "USD", 0)}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-400">
                  <CheckCircle2 className="mr-1 size-3" />
                  Auto-applied
                </Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40">
                    <TableHead className="text-[10px] text-muted-foreground">Strategy</TableHead>
                    <TableHead className="text-[10px] text-muted-foreground">Target $</TableHead>
                    <TableHead className="text-[10px] text-muted-foreground">Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dir.equity_directives.map((e) => (
                    <TableRow key={e.strategy_instance_id} className="border-border/20">
                      <TableCell className="text-xs">{e.strategy_instance_id}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatCurrency(e.target_equity_usd, "USD", 0)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatNumber(e.weight * 100, 1)}% (was {formatNumber(e.previous_weight * 100, 1)}%)
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>

      <div data-testid="auto-apply-event-log" className="hidden">
        {events.map((e) => (
          <span key={e.directiveId} data-directive-id={e.directiveId} />
        ))}
      </div>
    </div>
  );
}
