"use client";

/**
 * WithdrawalRequestButton — stub button + modal for requesting a withdrawal.
 *
 * Calls POST /api/clients/{id}/treasury/withdrawal (endpoint may be stubbed).
 * Supports mock mode via treasury-client.ts mock fixtures.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/wallet_treasury_client_flow_2026_05_10.md
 *   Phase 6.C.
 */

import * as React from "react";
import { ArrowDownToLine, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import type {
  TreasurySource,
  WithdrawalRequestResponse,
} from "@/lib/api/treasury-client";
import { requestWithdrawal } from "@/lib/api/treasury-client";

// ─── Source options ───────────────────────────────────────────────────────────

const WITHDRAWAL_SOURCES: readonly TreasurySource[] = [
  "COPPER",
  "CEFFU",
  "DEFI_HOT_WALLET",
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface WithdrawalRequestButtonProps {
  readonly clientId: string;
  readonly token?: string | null;
  /** Called when withdrawal is successfully requested */
  readonly onSuccess?: (resp: WithdrawalRequestResponse) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WithdrawalRequestButton({
  clientId,
  token,
  onSuccess,
}: WithdrawalRequestButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [source, setSource] = React.useState<TreasurySource>("COPPER");
  const [amount, setAmount] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<WithdrawalRequestResponse | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  function reset() {
    setAmount("");
    setDestination("");
    setSubmitError(null);
    setResult(null);
    setSource("COPPER");
    setSubmitting(false);
  }

  function handleOpenChange(val: boolean) {
    if (!val) reset();
    setOpen(val);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !destination) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const idempotencyKey = `wr-${clientId}-${Date.now()}`;
      const resp = await requestWithdrawal(
        clientId,
        { source, amount_usd: amount, destination, idempotency_key: idempotencyKey },
        token,
      );
      setResult(resp);
      onSuccess?.(resp);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const amountValid = parseFloat(amount) > 0;
  const canSubmit = amountValid && destination.length > 0 && !submitting;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        data-testid="withdrawal-request-btn"
        onClick={() => setOpen(true)}
      >
        <ArrowDownToLine className="size-3.5" />
        Request Withdrawal
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent data-testid="withdrawal-request-modal">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Initiate a withdrawal from treasury. Amounts above threshold require
              2-of-N operator approval before execution.
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div
              className="py-4 text-center space-y-2"
              data-testid="withdrawal-request-success"
            >
              <p className="text-sm font-medium text-emerald-400">
                Withdrawal requested successfully
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                ID: {result.request_id}
              </p>
              <p className="text-xs text-muted-foreground">
                Status: <strong>{result.status}</strong>
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
              {/* Source select */}
              <div>
                <label className="text-xs font-medium block mb-1" htmlFor="wr-source">
                  Treasury Source
                </label>
                <select
                  id="wr-source"
                  data-testid="withdrawal-source-select"
                  value={source}
                  onChange={(e) => setSource(e.target.value as TreasurySource)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {WITHDRAWAL_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-medium block mb-1" htmlFor="wr-amount">
                  Amount (USD)
                </label>
                <input
                  id="wr-amount"
                  data-testid="withdrawal-amount-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
              </div>

              {/* Destination */}
              <div>
                <label className="text-xs font-medium block mb-1" htmlFor="wr-destination">
                  Destination Address / Account
                </label>
                <input
                  id="wr-destination"
                  data-testid="withdrawal-destination-input"
                  type="text"
                  placeholder="0x... or account-id"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
              </div>

              {submitError ? (
                <p
                  className="text-xs text-[var(--pnl-negative)]"
                  data-testid="withdrawal-submit-error"
                >
                  {submitError}
                </p>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                  data-testid="withdrawal-cancel-btn"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSubmit}
                  data-testid="withdrawal-submit-btn"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1" />
                      Submitting…
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {result ? (
            <DialogFooter>
              <Button
                size="sm"
                onClick={() => handleOpenChange(false)}
                data-testid="withdrawal-close-btn"
              >
                Close
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
