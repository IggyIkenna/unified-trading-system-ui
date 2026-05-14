"use client";

/**
 * ManualTradeGateDialog — pvl-p23c operator approval surface.
 *
 * Polls GET /api/manual/pending every POLL_INTERVAL_MS and renders a list of
 * strategy-originated instructions awaiting operator approval.  Each card shows
 * the pre-trade risk preview (margin / position-limit / worst-case loss) and
 * exposes Approve / Reject buttons.
 *
 * Architecture:
 *   strategy-service (MANUAL mode) → POST /manual/pending → ManualPendingQueue
 *   ManualTradeGateDialog → GET /api/manual/pending  (1 s poll)
 *   Approve click → POST /api/manual/pending/{id}/approve → execution
 *   Reject click  → POST /api/manual/pending/{id}/reject  → audit log
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/master_to_live_defi_2026_05_23.md
 *   Group G Item 23 — pvl-p23c ManualTradeGateDialog
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  approveInstruction,
  listPendingInstructions,
  rejectInstruction,
} from "@/lib/api/dart-client";
import type { PendingInstruction } from "@/lib/api/dart-client";
import { useAuth } from "@/hooks/use-auth";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import * as React from "react";

const POLL_INTERVAL_MS = 1_000;

function formatUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function SecondsRemaining({ seconds }: { readonly seconds: number }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const urgent = seconds < 60;
  return (
    <span
      className={urgent ? "text-destructive font-semibold" : "text-muted-foreground"}
      data-testid="manual-trade-gate-seconds-remaining"
    >
      <Clock className="inline size-3 mr-0.5" aria-hidden />
      {mins > 0 ? `${mins}m ` : ""}
      {secs}s
    </span>
  );
}

interface PendingCardProps {
  readonly instruction: PendingInstruction;
  readonly onApprove: (id: string) => Promise<void>;
  readonly onReject: (id: string) => Promise<void>;
  readonly busy: boolean;
}

function PendingCard({ instruction, onApprove, onReject, busy }: PendingCardProps) {
  const { pre_trade_preview: preview } = instruction;

  return (
    <Card data-testid="manual-trade-gate-card">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">
              {instruction.side.toUpperCase()} {instruction.quantity} {instruction.instrument_id}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {instruction.archetype} · {instruction.venue}
              {instruction.algo ? ` · ${instruction.algo}` : ""}
            </p>
          </div>
          <SecondsRemaining seconds={instruction.seconds_remaining} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Pre-trade risk preview */}
        <dl className="grid grid-cols-3 gap-2 text-xs rounded-md border p-2 bg-muted/40">
          <div>
            <dt className="text-muted-foreground">Margin req.</dt>
            <dd className="font-mono font-medium" data-testid="manual-trade-gate-margin">
              {formatUsd(preview.margin_usd)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Position limit</dt>
            <dd className="font-mono font-medium" data-testid="manual-trade-gate-pos-limit">
              {formatPct(preview.position_limit_pct)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Worst-case loss</dt>
            <dd className="font-mono font-medium text-destructive" data-testid="manual-trade-gate-loss">
              {formatUsd(preview.worst_case_loss_usd)}
            </dd>
          </div>
        </dl>

        <p className="text-xs text-muted-foreground font-mono">
          {instruction.strategy_id} / {instruction.instruction_id}
        </p>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
            disabled={busy}
            onClick={() => void onReject(instruction.instruction_id)}
            data-testid="manual-trade-gate-reject"
          >
            <XCircle className="mr-1 size-3.5" aria-hidden />
            Reject
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={() => void onApprove(instruction.instruction_id)}
            data-testid="manual-trade-gate-approve"
          >
            <CheckCircle2 className="mr-1 size-3.5" aria-hidden />
            Approve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export interface ManualTradeGateDialogProps {
  /** Children render the trigger element (e.g. a badge or toolbar button). */
  readonly children: React.ReactNode;
  /** Test-injection: override list implementation. */
  readonly lister?: (token: string | null) => Promise<readonly PendingInstruction[]>;
  /** Test-injection: override approve implementation. */
  readonly approver?: (id: string, token: string | null) => Promise<unknown>;
  /** Test-injection: override reject implementation. */
  readonly rejecter?: (id: string, reason: string, token: string | null) => Promise<unknown>;
}

export function ManualTradeGateDialog({
  children,
  lister = listPendingInstructions,
  approver = approveInstruction,
  rejecter = (id, reason, tok) => rejectInstruction(id, { reason }, tok),
}: ManualTradeGateDialogProps) {
  const { token } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [instructions, setInstructions] = React.useState<readonly PendingInstruction[]>([]);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function poll() {
      try {
        const result = await lister(token);
        if (!cancelled) setInstructions(result);
      } catch {
        // Non-fatal — keep showing stale list, next poll recovers
      }
    }

    void poll();
    const id = setInterval(() => { void poll(); }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [open, token, lister]);

  async function handleApprove(instructionId: string) {
    setBusyId(instructionId);
    setError(null);
    try {
      await approver(instructionId, token);
      setInstructions((prev) => prev.filter((i) => i.instruction_id !== instructionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed — please retry.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(instructionId: string) {
    setBusyId(instructionId);
    setError(null);
    try {
      await rejecter(instructionId, "operator rejected via DART UI", token);
      setInstructions((prev) => prev.filter((i) => i.instruction_id !== instructionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rejection failed — please retry.");
    } finally {
      setBusyId(null);
    }
  }

  const count = instructions.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col" data-testid="manual-trade-gate-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Manual Trade Gate
            {count > 0 && (
              <Badge variant="destructive" data-testid="manual-trade-gate-count-badge">
                {count}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Strategy-originated instructions awaiting operator approval before execution.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {count === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-10 text-muted-foreground text-sm"
              data-testid="manual-trade-gate-empty"
            >
              <CheckCircle2 className="size-8 text-green-500" aria-hidden />
              <span>No pending instructions — queue is clear.</span>
            </div>
          ) : (
            instructions.map((instr) => (
              <PendingCard
                key={instr.instruction_id}
                instruction={instr}
                onApprove={handleApprove}
                onReject={handleReject}
                busy={busyId !== null}
              />
            ))
          )}

          {error && (
            <div
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
              role="alert"
              data-testid="manual-trade-gate-error"
            >
              <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden />
              <span>{error}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
