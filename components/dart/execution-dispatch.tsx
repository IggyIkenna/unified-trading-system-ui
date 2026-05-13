"use client";

/**
 * DART Execution Dispatch — typed fetch wrapper + error handling + correlation_id capture.
 *
 * Orchestrates the full manual-trade flow:
 *   1. Form → preview (ManualTradeForm → dart-client.previewManualInstruction)
 *   2. Preview confirm → submit (TradePreview confirm → dart-client.submitManualInstruction)
 *   3. Submit → instruction_id → redirect to /dart/terminal/manual/{instructionId}/
 *
 * This component is a pure coordinator; it renders ManualTradeForm + TradePreview
 * in sequence and calls useRouter to navigate after a successful submit.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/dart_manual_trade_ux_refactor_2026_05_13.md
 *   Phase C.1 — components/dart/execution-dispatch.tsx.
 */

import { ManualTradeForm } from "@/components/dart/manual-trade-form";
import type { ManualTradeFormState } from "@/components/dart/manual-trade-form";
import { TradePreview } from "@/components/dart/trade-preview";
import type { PreviewResponse, SubmitResponse } from "@/lib/api/dart-client";
import { submitManualInstruction } from "@/lib/api/dart-client";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import * as React from "react";

type DispatchStep = "form" | "preview" | "submitted";

export interface ExecutionDispatchProps {
  /** Pre-populate archetype from URL params. */
  readonly defaultArchetype?: string;
  /** Pre-populate venue from URL params. */
  readonly defaultVenue?: string;
  /**
   * Called after a successful submit with the instruction_id.
   * If not provided, the component navigates to the monitor route automatically.
   */
  readonly onSubmitted?: (response: SubmitResponse) => void;
}

export function ExecutionDispatch({
  defaultArchetype = "",
  defaultVenue = "",
  onSubmitted,
}: ExecutionDispatchProps) {
  const { token } = useAuth();
  const router = useRouter();

  const [step, setStep] = React.useState<DispatchStep>("form");
  const [preview, setPreview] = React.useState<PreviewResponse | null>(null);
  const [formState, setFormState] = React.useState<ManualTradeFormState | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [instructionId, setInstructionId] = React.useState<string | null>(null);

  const handlePreviewReady = React.useCallback(
    (previewResult: PreviewResponse, form: ManualTradeFormState) => {
      setPreview(previewResult);
      setFormState(form);
      setSubmitError(null);
      setStep("preview");
    },
    [],
  );

  const handleConfirm = React.useCallback(
    async (confirmedPreview: PreviewResponse) => {
      if (!formState) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const sizePctNum = parseFloat(formState.size_pct_nav) || 0;
        const limitPriceNum = parseFloat(formState.limit_price) || 0;

        const response = await submitManualInstruction(
          {
            correlation_id: confirmedPreview.correlation_id,
            archetype: formState.archetype,
            venue: formState.venue,
            side: formState.side,
            size_pct_nav: sizePctNum,
            limit_price: formState.algo !== "MARKET" && limitPriceNum > 0 ? limitPriceNum : undefined,
            algo: formState.algo,
            dry_run: formState.dry_run,
          },
          token,
        );

        setInstructionId(response.instruction_id);
        setStep("submitted");

        if (onSubmitted) {
          onSubmitted(response);
        } else {
          router.push(`/services/dart/terminal/manual/${encodeURIComponent(response.instruction_id)}`);
        }
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : String(err));
      } finally {
        setSubmitting(false);
      }
    },
    [formState, onSubmitted, router, token],
  );

  const handleCancelToForm = React.useCallback(() => {
    setStep("form");
    setPreview(null);
    setSubmitError(null);
  }, []);

  if (step === "submitted" && instructionId) {
    return (
      <div className="space-y-3" data-testid="execution-dispatch-submitted">
        <p className="text-sm text-muted-foreground">
          Instruction submitted. Redirecting to monitor…
        </p>
        <code className="text-xs font-mono text-muted-foreground">{instructionId}</code>
      </div>
    );
  }

  if (step === "preview" && preview && formState) {
    return (
      <TradePreview
        preview={preview}
        formState={formState}
        onConfirm={handleConfirm}
        onCancel={handleCancelToForm}
        submitting={submitting}
        submitError={submitError}
      />
    );
  }

  return (
    <ManualTradeForm
      defaultArchetype={defaultArchetype}
      defaultVenue={defaultVenue}
      onPreviewReady={handlePreviewReady}
    />
  );
}
