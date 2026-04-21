"use client";

/**
 * Strategy-param edit version-bump modal (Phase 11).
 *
 * Enforces the "Batch = Live: Unified Pipeline Architecture" rule from
 * workspace CLAUDE.md — ad-hoc strategy-parameter changes break backtest-to-live
 * parity. Every edit must go through either a version-bump (recommended) or an
 * explicit parity-break confirmation.
 *
 * Codex SSOT:
 *   unified-trading-pm/codex/09-strategy/architecture-v2/dart-tab-structure.md § 4.
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertTriangle, ArrowUpCircle, X } from "lucide-react";
import * as React from "react";

export interface StrategyParamVersionBumpModalProps {
  open: boolean;
  strategyId: string;
  currentVersion: string;
  proposedVersion: string;
  paramDiffSummary: string;
  onBumpVersion: () => void;
  onHotReload: () => void;
  onCancel: () => void;
}

const PARITY_BREAK_CONFIRMATION = "I-ACCEPT-PARITY-BREAK";

export function StrategyParamVersionBumpModal({
  open,
  strategyId,
  currentVersion,
  proposedVersion,
  paramDiffSummary,
  onBumpVersion,
  onHotReload,
  onCancel,
}: StrategyParamVersionBumpModalProps) {
  const [confirmText, setConfirmText] = React.useState("");
  const canHotReload = confirmText.trim() === PARITY_BREAK_CONFIRMATION;

  React.useEffect(() => {
    if (!open) setConfirmText("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onCancel() : undefined)}>
      <DialogContent
        className="max-w-xl"
        data-testid="strategy-param-version-bump-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-400" aria-hidden />
            Strategy parameter change — version bump recommended
          </DialogTitle>
          <DialogDescription>
            You are editing live parameters for{" "}
            <strong className="text-foreground">{strategyId}</strong> (current version{" "}
            <code>{currentVersion}</code>). The Unified Trading System rule{" "}
            <em>Batch = Live</em> means ad-hoc param changes break backtest-to-live
            parity — choose the bump path to preserve parity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
            <p className="mb-1 font-medium text-muted-foreground">Param diff</p>
            <pre className="whitespace-pre-wrap font-mono text-[11px] text-foreground/80">
              {paramDiffSummary}
            </pre>
          </div>

          {/* (a) Recommended path — bump version */}
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-start gap-3">
              <ArrowUpCircle className="size-5 shrink-0 mt-0.5 text-emerald-400" aria-hidden />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-200">
                  Bump version ({currentVersion} → {proposedVersion}) · recommended
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Preserves backtest-to-live parity. New version becomes the live
                  config; previous version stays available for comparison. Audit event:{" "}
                  <code className="text-[10px]">STRATEGY_VERSION_BUMPED</code>.
                </p>
                <Button
                  size="sm"
                  className="mt-2 bg-emerald-600 hover:bg-emerald-500"
                  onClick={onBumpVersion}
                  data-testid="strategy-param-bump-version"
                >
                  Bump to {proposedVersion}
                </Button>
              </div>
            </div>
          </div>

          {/* (b) Hot-reload in place — red warning, typed confirmation */}
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 shrink-0 mt-0.5 text-destructive" aria-hidden />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  Hot-reload in place · breaks backtest/live parity
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Applies the change without a version bump. Backtest replay for
                  this strategy will no longer match live fills until the next
                  version is cut. Audit event:{" "}
                  <code className="text-[10px]">STRATEGY_PARAM_AD_HOC_CHANGE</code>.
                </p>
                <p className="mt-2 text-xs text-destructive">
                  Type <code className="font-mono">{PARITY_BREAK_CONFIRMATION}</code> to confirm:
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={PARITY_BREAK_CONFIRMATION}
                  className="mt-1 font-mono text-xs"
                  data-testid="strategy-param-parity-break-input"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="mt-2"
                  disabled={!canHotReload}
                  onClick={onHotReload}
                  data-testid="strategy-param-hot-reload"
                >
                  Hot-reload (parity break)
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            data-testid="strategy-param-cancel"
          >
            <X className="mr-1 size-4" aria-hidden />
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
