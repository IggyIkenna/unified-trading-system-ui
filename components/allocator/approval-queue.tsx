"use client";

import { CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { useCallback, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { imDeskAllocatableFunds } from "@/lib/architecture-v2/fund-business-unit";
import type { ManualApprovalQueueItem } from "@/lib/architecture-v2/allocator";
import { MOCK_APPROVAL_QUEUE } from "@/lib/mocks/fixtures/architecture-v2-fixtures";
import { formatCurrency } from "@/lib/utils/formatters";

/**
 * G2.10 Phase C — IM-side allocator approval flow.
 *
 * Surfaces the ``ManualApprovalQueueItem[]`` fixture with per-fund filtering
 * (funds sourced from the G2.8 ``FundBusinessUnitRegistry``) and an
 * ``Apply`` action that emits a synthetic ``ALLOCATION_APPLIED_BY_APPROVER``
 * UTL event to ``window``. In mock mode the event is captured by the
 * Playwright spec; in prod it'll go through the strategy-service HTTP
 * writer + Pub/Sub emitter (follow-up).
 *
 * Rule 03 same-system-principle: distinct component from the platform-side
 * auto-apply UI — these are two different commercial workflows on the same
 * ``portfolio_allocator`` core, not one component with a feature flag.
 */

interface AppliedEvent {
  readonly directiveId: string;
  readonly fundId: string;
  readonly approverId: string;
  readonly timestampUtc: string;
}

type ApprovalStatus = "pending" | "applied";

interface ApprovalRow {
  readonly item: ManualApprovalQueueItem;
  readonly status: ApprovalStatus;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function ApprovalQueue(): React.ReactElement {
  const { user } = useAuth();
  const approverId = user?.id ?? "unknown-approver";

  const fundOptions = imDeskAllocatableFunds();
  const [selectedFundId, setSelectedFundId] = useState<string>(fundOptions[0]?.fundId ?? "");

  const [rows, setRows] = useState<readonly ApprovalRow[]>(() =>
    MOCK_APPROVAL_QUEUE.map((item) => ({ item, status: "pending" as const })),
  );
  const [applied, setApplied] = useState<readonly AppliedEvent[]>([]);

  const apply = useCallback(
    (directiveId: string) => {
      const applyTs = nowIso();
      setRows((prior) =>
        prior.map((row) => (row.item.directive_id === directiveId ? { ...row, status: "applied" as const } : row)),
      );
      const event: AppliedEvent = {
        directiveId,
        fundId: selectedFundId,
        approverId,
        timestampUtc: applyTs,
      };
      setApplied((prior) => [...prior, event]);

      // Emit synthetic UTL event to window so the Playwright spec can assert
      // on it. In production this calls the strategy-service HTTP writer.
      if (typeof window !== "undefined") {
        const customEvent = new CustomEvent("ALLOCATION_APPLIED_BY_APPROVER", {
          detail: event,
        });
        window.dispatchEvent(customEvent);
      }
    },
    [approverId, selectedFundId],
  );

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <Card data-testid="approval-queue">
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Allocation approval queue</h3>
            <p className="text-xs text-muted-foreground">
              {pendingCount} directive{pendingCount === 1 ? "" : "s"} awaiting human approval — click Apply to commit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground" data-testid="fund-select-label">
              Fund
            </span>
            <Select value={selectedFundId} onValueChange={setSelectedFundId}>
              <SelectTrigger className="w-64" data-testid="fund-select">
                <SelectValue placeholder="Select fund" />
              </SelectTrigger>
              <SelectContent>
                {fundOptions.map((fund) => (
                  <SelectItem key={fund.fundId} value={fund.fundId} data-testid={`fund-option-${fund.fundId}`}>
                    {fund.fundName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No allocator directives awaiting approval.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const { item, status } = row;
              return (
                <div
                  key={item.directive_id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
                  data-testid={`approval-${item.directive_id}`}
                  data-status={status}
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 size-4 text-amber-400" />
                    <div>
                      <p className="text-sm font-semibold">
                        {item.client_name} · {item.archetype}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.num_strategies} strategies · {formatCurrency(item.proposed_total_nav_usd, "USD", 0)} ·
                        submitted {item.age_minutes} min ago
                      </p>
                      <p className="text-[11px] text-muted-foreground">directive_id: {item.directive_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === "pending" ? (
                      <>
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => apply(item.directive_id)}
                          data-testid={`approve-${item.directive_id}`}
                          disabled={selectedFundId === ""}
                        >
                          Apply
                        </Button>
                      </>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                      >
                        <CheckCircle2 className="mr-1 size-3" /> Applied
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {applied.length > 0 ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3" data-testid="applied-history">
            <p className="mb-2 text-xs font-semibold text-emerald-400">
              <Clock className="mr-1 inline size-3" />
              {applied.length} allocation{applied.length === 1 ? "" : "s"} applied this session
            </p>
            <ul className="space-y-1 text-[11px] text-muted-foreground">
              {applied.map((e) => (
                <li key={`${e.directiveId}-${e.timestampUtc}`} data-testid={`applied-entry-${e.directiveId}`}>
                  {e.directiveId} → fund {e.fundId} · approver {e.approverId} · {e.timestampUtc}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
