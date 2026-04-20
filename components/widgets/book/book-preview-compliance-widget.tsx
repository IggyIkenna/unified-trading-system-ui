"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, ShieldCheck, ShieldX, XCircle } from "lucide-react";
import { useBookTradeData } from "./book-data-context";

export function BookPreviewComplianceWidget(_props: WidgetComponentProps) {
  const {
    executionMode,
    category,
    categoryLabels,
    side,
    instrument,
    venue,
    priceNum,
    qty,
    total,
    algo,
    counterparty,
    sourceReference,
    fee,
    orgId,
    clientId,
    strategyId,
    orderState,
    setOrderState,
    errorMessage,
    complianceResult,
    complianceUnavailable,
    complianceLoading,
    compliancePassed,
    canExecute,
    handleSubmit,
  } = useBookTradeData();

  const failedCheck = complianceResult?.checks.find((c) => !c.passed);

  if (orderState === "idle") {
    return (
      <div className="p-2 text-caption text-muted-foreground">
        Preview summary and compliance appear after you run Preview Order.
      </div>
    );
  }

  return (
    <div className="p-2 space-y-3">
      {orderState === "preview" && (
        <>
          <div className="p-3 rounded-md border bg-muted/30 space-y-2">
            <p className="text-xs font-medium">Summary</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-caption">
              <span className="text-muted-foreground">Mode</span>
              <span>
                <Badge variant="outline" className="text-nano">
                  {executionMode === "execute" ? "EXECUTE" : "RECORD ONLY"}
                </Badge>
              </span>
              <span className="text-muted-foreground">Category</span>
              <span>{categoryLabels[category]}</span>
              <span className="text-muted-foreground">Side</span>
              <span className={cn("font-medium", side === "buy" ? "text-emerald-500" : "text-rose-500")}>
                {side.toUpperCase()}
              </span>
              <span className="text-muted-foreground">Instrument</span>
              <span className="font-mono">{instrument}</span>
              <span className="text-muted-foreground">Venue</span>
              <span>{venue}</span>
              <span className="text-muted-foreground">Price</span>
              <span className="font-mono">{priceNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-mono">{qty}</span>
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono font-medium">
                {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {executionMode === "execute" && (
                <>
                  <span className="text-muted-foreground">Algorithm</span>
                  <span>{algo}</span>
                </>
              )}
              {executionMode === "record_only" && counterparty && (
                <>
                  <span className="text-muted-foreground">Counterparty</span>
                  <span>{counterparty}</span>
                </>
              )}
              {executionMode === "record_only" && sourceReference && (
                <>
                  <span className="text-muted-foreground">Source Ref</span>
                  <span className="font-mono">{sourceReference}</span>
                </>
              )}
              {executionMode === "record_only" && fee && (
                <>
                  <span className="text-muted-foreground">Fee</span>
                  <span className="font-mono">{fee}</span>
                </>
              )}
              {orgId && (
                <>
                  <span className="text-muted-foreground">Organization</span>
                  <span>{orgId}</span>
                </>
              )}
              {clientId && (
                <>
                  <span className="text-muted-foreground">Client</span>
                  <span>{clientId}</span>
                </>
              )}
              {strategyId !== "manual" && (
                <>
                  <span className="text-muted-foreground">Strategy</span>
                  <span>{strategyId}</span>
                </>
              )}
            </div>
          </div>

          {executionMode === "execute" && (
            <div className="p-3 rounded-md border space-y-2">
              <p className="text-caption font-medium flex items-center gap-1.5">
                {complianceLoading && <Spinner size="sm" className="size-3 text-muted-foreground" />}
                {!complianceLoading && complianceResult?.passed && <ShieldCheck className="size-3 text-emerald-500" />}
                {!complianceLoading && complianceResult && !complianceResult.passed && (
                  <ShieldX className="size-3 text-rose-500" />
                )}
                {!complianceLoading && complianceUnavailable && <AlertTriangle className="size-3 text-amber-500" />}
                Pre-Trade Compliance
              </p>

              {complianceLoading && <p className="text-caption text-muted-foreground">Running compliance checks...</p>}

              {complianceUnavailable && (
                <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="size-3 text-amber-500 shrink-0" />
                  <span className="text-caption text-amber-600 dark:text-amber-400">
                    Compliance check unavailable — submission permitted with caution
                  </span>
                </div>
              )}

              {complianceResult && (
                <>
                  <div className="space-y-1">
                    {complianceResult.checks.map((check) => (
                      <div key={check.name} className="flex items-center justify-between text-caption">
                        <div className="flex items-center gap-1">
                          <Badge
                            variant={check.passed ? "outline" : "destructive"}
                            className={cn(
                              "text-nano px-1 py-0",
                              check.passed && "border-emerald-500/50 text-emerald-600 dark:text-emerald-400",
                            )}
                          >
                            {check.passed ? "PASS" : "FAIL"}
                          </Badge>
                          <span className="text-muted-foreground">{check.name}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-nano">
                          <span className="text-muted-foreground" title="Limit">
                            {check.limit_value}
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span title="Current">{check.current_value}</span>
                          <span className="text-muted-foreground">-&gt;</span>
                          <span className={cn(!check.passed && "text-rose-500 font-medium")} title="Proposed">
                            {check.proposed_value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className={cn(
                      "flex items-center gap-2 p-2 rounded text-caption",
                      complianceResult.passed
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {complianceResult.passed ? (
                      <>
                        <ShieldCheck className="size-3 shrink-0" />
                        Pre-trade checks passed
                      </>
                    ) : (
                      <>
                        <ShieldX className="size-3 shrink-0" />
                        Order rejected — {failedCheck?.name ?? "compliance check"} violated
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-8 text-xs" onClick={() => setOrderState("idle")}>
              Edit
            </Button>
            <Button
              className={cn(
                "flex-1 h-8 text-xs",
                side === "buy" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700",
              )}
              onClick={handleSubmit}
              disabled={
                complianceLoading ||
                (!compliancePassed && !complianceLoading) ||
                (!canExecute && executionMode === "execute")
              }
            >
              {complianceLoading ? (
                <>
                  <Spinner size="sm" className="size-3.5 mr-1.5" />
                  Checking...
                </>
              ) : executionMode === "execute" ? (
                <>Confirm {side === "buy" ? "Buy" : "Sell"}</>
              ) : (
                <>Record Trade</>
              )}
            </Button>
          </div>
        </>
      )}

      {orderState === "submitting" && (
        <Button className="w-full h-8" disabled>
          <Spinner size="sm" className="size-3.5 mr-2" />
          {executionMode === "execute" ? "Submitting..." : "Recording..."}
        </Button>
      )}

      {orderState === "success" && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          <span className="text-xs text-emerald-500">
            {executionMode === "execute" ? "Order submitted successfully" : "Trade recorded successfully"}
          </span>
        </div>
      )}

      {orderState === "error" && (
        <>
          <div className="flex items-center gap-2 p-2 rounded-md bg-rose-500/10 border border-rose-500/30">
            <XCircle className="size-3.5 text-rose-500" />
            <span className="text-xs text-rose-500">{errorMessage}</span>
          </div>
          <Button variant="outline" className="w-full h-8 text-xs" onClick={() => setOrderState("preview")}>
            Retry
          </Button>
        </>
      )}
    </div>
  );
}
