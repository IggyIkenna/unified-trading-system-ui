"use client";

/**
 * DART Trade Preview — extracted from Phase C architecture.
 *
 * Receives preview response from POST /api/archetypes/{id}/preview;
 * displays projected fill price / slippage / collateral required /
 * max-drawdown impact / risk-check pass-fail per rule.
 *
 * Confirm button → calls POST /api/manual/submit via ExecutionDispatch.
 * Cancel → returns to form.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/dart_manual_trade_ux_refactor_2026_05_13.md
 *   Phase C.1 — components/dart/trade-preview.tsx.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ManualTradeFormState } from "@/components/dart/manual-trade-form";
import type { PreviewResponse, RiskCheckResult } from "@/lib/api/dart-client";
import { AlertCircle, CheckCircle2, ChevronLeft, XCircle } from "lucide-react";
import * as React from "react";

function RiskCheckRow({ check }: { readonly check: RiskCheckResult }) {
  const icon = check.passed ? (
    <CheckCircle2 className="size-3.5 text-green-500 shrink-0 mt-0.5" aria-hidden />
  ) : (
    <XCircle className="size-3.5 text-destructive shrink-0 mt-0.5" aria-hidden />
  );

  return (
    <div className="flex items-start gap-2 text-xs" data-testid="trade-preview-risk-check-row">
      {icon}
      <div>
        <span className={check.passed ? "text-foreground" : "text-destructive font-medium"}>
          {check.rule}
        </span>
        {(check.reason || check.warning) && (
          <p className="mt-0.5 text-muted-foreground">{check.reason ?? check.warning}</p>
        )}
      </div>
    </div>
  );
}

function formatOptionalNumber(n: number | null, decimals: number, prefix = ""): string {
  if (n === null || Number.isNaN(n)) return "—";
  return `${prefix}${n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export interface TradePreviewProps {
  readonly preview: PreviewResponse;
  readonly formState: ManualTradeFormState;
  /** Called when user confirms and the instruction has been submitted. */
  readonly onConfirm: (preview: PreviewResponse) => Promise<void>;
  /** Called when user cancels back to the form. */
  readonly onCancel: () => void;
  /** Whether the confirm action is in progress. */
  readonly submitting?: boolean;
  /** Error from the confirm step (set by parent / ExecutionDispatch). */
  readonly submitError?: string | null;
}

export function TradePreview({
  preview,
  formState,
  onConfirm,
  onCancel,
  submitting = false,
  submitError = null,
}: TradePreviewProps) {
  const allPassed = preview.risk_checks.every((c) => c.passed);

  return (
    <div className="space-y-4" data-testid="trade-preview">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Trade Preview</h3>
          <p className="text-xs text-muted-foreground font-mono">{preview.correlation_id}</p>
        </div>
        <Badge variant={allPassed ? "default" : "destructive"} data-testid="trade-preview-risk-badge">
          {allPassed ? "Risk passed" : "Risk blocked"}
        </Badge>
      </div>

      {/* Summary card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
            Projected metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-muted-foreground">Fill price</dt>
              <dd className="font-mono text-sm" data-testid="trade-preview-fill-price">
                {formatOptionalNumber(preview.projected_fill_price, 2, "$")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Slippage</dt>
              <dd className="font-mono text-sm" data-testid="trade-preview-slippage">
                {preview.slippage_bps !== null ? `${preview.slippage_bps.toFixed(1)} bps` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Collateral req.</dt>
              <dd className="font-mono text-sm" data-testid="trade-preview-collateral">
                {formatOptionalNumber(preview.collateral_required_usd, 0, "$")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Max drawdown impact</dt>
              <dd className="font-mono text-sm" data-testid="trade-preview-drawdown">
                {preview.max_drawdown_impact_pct !== null
                  ? `${preview.max_drawdown_impact_pct.toFixed(2)}%`
                  : "—"}
              </dd>
            </div>
          </dl>

          {/* Order summary */}
          <p className="mt-3 text-xs text-muted-foreground" data-testid="trade-preview-summary">
            {formState.side.toUpperCase()} {formState.size_pct_nav}% NAV on{" "}
            <span className="font-medium">{preview.venue}</span> via{" "}
            <span className="font-mono">{formState.algo}</span>
            {formState.dry_run ? " — dry run" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Risk checks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
            Risk checks ({preview.risk_checks.filter((c) => c.passed).length}/
            {preview.risk_checks.length} passed)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {preview.risk_checks.map((check, idx) => (
            <RiskCheckRow key={`${check.rule}-${idx}`} check={check} />
          ))}
        </CardContent>
      </Card>

      {/* Submit error */}
      {submitError ? (
        <div
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
          data-testid="trade-preview-submit-error"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
          <span>{submitError}</span>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={submitting}
          data-testid="trade-preview-cancel"
        >
          <ChevronLeft className="mr-1 size-3" aria-hidden />
          Back
        </Button>
        <Button
          type="button"
          size="sm"
          className="flex-1"
          disabled={!allPassed || submitting}
          onClick={() => void onConfirm(preview)}
          data-testid="trade-preview-confirm"
        >
          {submitting
            ? "Submitting…"
            : allPassed
              ? "Confirm and submit"
              : "Blocked by risk check"}
        </Button>
      </div>
    </div>
  );
}
