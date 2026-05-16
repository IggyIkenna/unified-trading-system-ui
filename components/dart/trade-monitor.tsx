"use client";

/**
 * DART Manual-Trade Monitor (option-c narrow scope, 2026-05-10).
 *
 * Renders status updates for a single in-flight manual instruction. Polls
 * `/api/instructions/{instruction_id}/status` on a 5s interval — the
 * execution-service `manual_instruction_api.py` route is the SSOT. Falls
 * back to last-known state on a transient fetch error rather than
 * unmounting the surface (operator needs the values they DID have when the
 * network blips).
 *
 * Per workspace CLAUDE.md "Batch = Live": no separate manual-trade
 * execution path; this monitor reads the same instruction status the
 * automated archetypes' positions surface reads. The status enum
 * (pending / partial / filled / cancelled / rejected) is the SSOT
 * declared in execution-service `manual_schemas.py` and exposed as
 * a string on the wire.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/issues/dart_manual_trade_ui_build_2026_05_10.md
 *   (Phase C — option-c narrow scope).
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { Activity, AlertCircle } from "lucide-react";
import * as React from "react";

export type ManualInstructionStatus =
  | "pending"
  | "partial"
  | "filled"
  | "cancelled"
  | "rejected";

export interface ManualInstructionStatusResponse {
  readonly instruction_id: string;
  readonly status: ManualInstructionStatus;
  readonly filled_qty: number;
  readonly avg_fill_price: number | null;
  readonly unrealized_pnl: number | null;
  readonly last_update_ts: string;
  readonly venue?: string;
  readonly instrument?: string;
}

export interface TradeMonitorProps {
  readonly instructionId: string;
  /** Polling cadence in milliseconds. Defaults to 5_000ms per Phase C spec. */
  readonly pollIntervalMs?: number;
  /** Test-injection: override the fetch implementation. */
  readonly fetcher?: (url: string, token: string | null) => Promise<unknown>;
}

const STATUS_BADGE_VARIANT: Record<ManualInstructionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  partial: "secondary",
  filled: "default",
  cancelled: "outline",
  rejected: "destructive",
};

function formatNumber(n: number | null, decimals: number): string {
  if (n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatRelativeTimestamp(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-US", { hour12: false });
}

export function TradeMonitor({ instructionId, pollIntervalMs = 5_000, fetcher }: TradeMonitorProps) {
  const { token } = useAuth();
  const [snapshot, setSnapshot] = React.useState<ManualInstructionStatusResponse | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const fetcherRef = React.useRef(fetcher ?? apiFetch);

  React.useEffect(() => {
    fetcherRef.current = fetcher ?? apiFetch;
  }, [fetcher]);

  React.useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const result = (await fetcherRef.current(
          `/api/instructions/${encodeURIComponent(instructionId)}/status`,
          token,
        )) as ManualInstructionStatusResponse;
        if (cancelled) return;
        setSnapshot(result);
        setErrorMessage(null);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setErrorMessage(message);
      }
    };

    void poll();
    const handle = window.setInterval(() => void poll(), pollIntervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [instructionId, pollIntervalMs, token]);

  const status = snapshot?.status ?? "pending";

  return (
    <Card data-testid="trade-monitor" data-instruction-id={instructionId}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <Activity className="size-4" aria-hidden />
            Trade monitor · <code className="font-mono text-xs">{instructionId}</code>
          </span>
          <Badge
            variant={STATUS_BADGE_VARIANT[status]}
            data-testid="trade-monitor-status-badge"
            data-status={status}
          >
            {status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {errorMessage && !snapshot ? (
          <div
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
            data-testid="trade-monitor-error"
            role="alert"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
            <span>Failed to fetch instruction status: {errorMessage}</span>
          </div>
        ) : null}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div>
            <dt className="text-muted-foreground">Filled qty</dt>
            <dd className="font-mono text-sm" data-testid="trade-monitor-filled-qty">
              {formatNumber(snapshot?.filled_qty ?? null, 4)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Avg fill price</dt>
            <dd className="font-mono text-sm" data-testid="trade-monitor-avg-fill-price">
              {formatNumber(snapshot?.avg_fill_price ?? null, 2)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Unrealized P&amp;L</dt>
            <dd
              className="font-mono text-sm"
              data-testid="trade-monitor-unrealized-pnl"
              data-pnl-sign={
                snapshot?.unrealized_pnl == null
                  ? "n/a"
                  : snapshot.unrealized_pnl >= 0
                    ? "positive"
                    : "negative"
              }
            >
              {formatNumber(snapshot?.unrealized_pnl ?? null, 2)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last update</dt>
            <dd className="font-mono text-sm" data-testid="trade-monitor-last-update">
              {snapshot ? formatRelativeTimestamp(snapshot.last_update_ts) : "—"}
            </dd>
          </div>
        </dl>

        {snapshot?.venue || snapshot?.instrument ? (
          <p className="text-xs text-muted-foreground" data-testid="trade-monitor-context">
            {snapshot.instrument ?? "?"} on {snapshot.venue ?? "?"}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
