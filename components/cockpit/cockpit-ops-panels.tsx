"use client";

/**
 * Three interactive cockpit panels driven by `useCockpitOpsStore`:
 *
 *   - <BacktestRunsPanel />       — Research/Validate. Click "Run new
 *                                    backtest" → row appears at queued →
 *                                    progresses 5%/sec → completes with
 *                                    operating-adjusted Sharpe.
 *   - <MlTrainingRunsPanel />     — Research/Train. Click "Start training"
 *                                    → row appears → progresses 3%/sec →
 *                                    completes with accuracy → "Promote
 *                                    to paper" button transitions state.
 *   - <OrderTicketPanel />        — Terminal/Command. Submit form → pending
 *                                    order appears → after 1s simulated
 *                                    fill lands in recent fills with
 *                                    realistic slippage.
 *
 * Per the post-assumption-stack audit: "click anything → does it respond?"
 * These three surfaces close the most-clicked dead zones in the cockpit.
 *
 * Tick driver: `ensureCockpitOpsTickerStarted()` runs lazily on first
 * mount; production wires real backtest-service / ML-service / execution-
 * service streams.
 */

import * as React from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Cpu,
  PlayCircle,
  Send,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ensureCockpitOpsTickerStarted, useCockpitOpsStore, type RunStatus } from "@/lib/mocks/cockpit-ops-store";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Shared status pill
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<RunStatus, string> = {
  queued: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  running: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  completed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  failed: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

function StatusPill({ status }: { readonly status: RunStatus }) {
  return (
    <Badge variant="outline" className={cn("text-[9px] font-mono", STATUS_TONE[status])} data-status={status}>
      {status}
    </Badge>
  );
}

function ProgressBar({ pct, status }: { readonly pct: number; readonly status: RunStatus }) {
  const tone =
    status === "completed"
      ? "bg-emerald-400"
      : status === "failed"
        ? "bg-rose-400"
        : status === "running"
          ? "bg-cyan-400"
          : "bg-amber-400";
  return (
    <div className="h-1 w-full rounded-full bg-muted/30 overflow-hidden">
      <div
        className={cn("h-full transition-all", tone)}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        data-testid="progress-bar-fill"
        data-pct={pct}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BacktestRunsPanel — Research/Validate
// ─────────────────────────────────────────────────────────────────────────────

export function BacktestRunsPanel({ className }: { readonly className?: string }) {
  React.useEffect(() => {
    ensureCockpitOpsTickerStarted();
  }, []);
  const runs = useCockpitOpsStore((s) => s.backtestRuns);
  const startBacktestRun = useCockpitOpsStore((s) => s.startBacktestRun);
  const [strategyId, setStrategyId] = React.useState("ARBITRAGE_PRICE_DISPERSION");
  const [proofGoal, setProofGoal] = React.useState("promotion");

  const handleRun = React.useCallback(() => {
    startBacktestRun({
      strategyId,
      assumptionStackId: "as-arbitrage-cefi-defi-v3.2.1",
      proofGoal,
    });
  }, [startBacktestRun, strategyId, proofGoal]);

  return (
    <Card
      className={cn("border-border/50 bg-gradient-to-br from-background to-muted/15", className)}
      data-testid="backtest-runs-panel"
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PlayCircle className="size-3.5 text-cyan-400" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">Backtest runs</h3>
            <Badge variant="outline" className="text-[9px] font-mono">
              {runs.length} run{runs.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        {/* Run-new form */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label htmlFor="bt-strategy" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Strategy
            </Label>
            <Input
              id="bt-strategy"
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value)}
              className="h-8 text-xs font-mono"
              data-testid="backtest-strategy-input"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bt-proof" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Proof goal
            </Label>
            <Select value={proofGoal} onValueChange={setProofGoal}>
              <SelectTrigger id="bt-proof" className="h-8 text-xs" data-testid="backtest-proof-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="signal" className="text-xs">
                  Signal performance
                </SelectItem>
                <SelectItem value="execution" className="text-xs">
                  Execution feasibility
                </SelectItem>
                <SelectItem value="liquidation" className="text-xs">
                  Liquidation resilience
                </SelectItem>
                <SelectItem value="treasury" className="text-xs">
                  Treasury & collateral
                </SelectItem>
                <SelectItem value="promotion" className="text-xs">
                  Full promotion readiness
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={handleRun} data-testid="backtest-run-button" className="h-8 text-xs">
            <PlayCircle className="size-3 mr-1" aria-hidden />
            Run backtest
          </Button>
        </div>

        {/* Runs list */}
        {runs.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 italic" data-testid="backtest-runs-empty">
            No runs yet. Click Run backtest above to start one.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {runs
              .slice()
              .reverse()
              .map((run) => (
                <li
                  key={run.id}
                  className="rounded border border-border/40 bg-muted/5 p-2 space-y-1"
                  data-testid={`backtest-run-${run.id}`}
                  data-status={run.status}
                  data-progress={run.progressPct}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-mono text-foreground/90 truncate">{run.id}</span>
                      <StatusPill status={run.status} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[9px] font-mono">
                      <span>{run.proofGoal}</span>
                      {run.status === "completed" && run.resultSharpe !== undefined ? (
                        <span className="text-emerald-300">Sharpe {run.resultSharpe.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground/70">{run.progressPct}%</span>
                      )}
                    </div>
                  </div>
                  <ProgressBar pct={run.progressPct} status={run.status} />
                </li>
              ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MlTrainingRunsPanel — Research/Train
// ─────────────────────────────────────────────────────────────────────────────

export function MlTrainingRunsPanel({ className }: { readonly className?: string }) {
  React.useEffect(() => {
    ensureCockpitOpsTickerStarted();
  }, []);
  const runs = useCockpitOpsStore((s) => s.mlTrainingRuns);
  const startMlTrainingRun = useCockpitOpsStore((s) => s.startMlTrainingRun);
  const promoteMlRunToPaper = useCockpitOpsStore((s) => s.promoteMlRunToPaper);

  const [modelFamily, setModelFamily] = React.useState("xgboost");
  const [featureSetVersion, setFeatureSetVersion] = React.useState("fs-cross-venue-spread-v8");

  const handleStart = React.useCallback(() => {
    startMlTrainingRun({ modelFamily, featureSetVersion });
  }, [startMlTrainingRun, modelFamily, featureSetVersion]);

  return (
    <Card
      className={cn("border-border/50 bg-gradient-to-br from-background to-muted/15", className)}
      data-testid="ml-training-runs-panel"
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="size-3.5 text-violet-400" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">ML training runs</h3>
            <Badge variant="outline" className="text-[9px] font-mono">
              {runs.length} run{runs.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label htmlFor="ml-family" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Model family
            </Label>
            <Select value={modelFamily} onValueChange={setModelFamily}>
              <SelectTrigger id="ml-family" className="h-8 text-xs" data-testid="ml-family-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xgboost" className="text-xs">
                  xgboost
                </SelectItem>
                <SelectItem value="lightgbm" className="text-xs">
                  lightgbm
                </SelectItem>
                <SelectItem value="lstm" className="text-xs">
                  lstm
                </SelectItem>
                <SelectItem value="transformer" className="text-xs">
                  transformer
                </SelectItem>
                <SelectItem value="logistic" className="text-xs">
                  logistic
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ml-features" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Feature set
            </Label>
            <Input
              id="ml-features"
              value={featureSetVersion}
              onChange={(e) => setFeatureSetVersion(e.target.value)}
              className="h-8 text-xs font-mono"
              data-testid="ml-features-input"
            />
          </div>
          <Button size="sm" onClick={handleStart} data-testid="ml-start-button" className="h-8 text-xs">
            <Cpu className="size-3 mr-1" aria-hidden />
            Start training
          </Button>
        </div>

        {runs.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 italic" data-testid="ml-runs-empty">
            No runs yet. Click Start training above to kick off a new run.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {runs
              .slice()
              .reverse()
              .map((run) => (
                <li
                  key={run.id}
                  className="rounded border border-border/40 bg-muted/5 p-2 space-y-1"
                  data-testid={`ml-run-${run.id}`}
                  data-status={run.status}
                  data-promoted={run.promotedToPaper ? "true" : "false"}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-mono text-foreground/90 truncate">{run.id}</span>
                      <Badge variant="secondary" className="text-[9px] font-mono">
                        {run.modelFamily}
                      </Badge>
                      <StatusPill status={run.status} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[9px] font-mono">
                      {run.status === "completed" && run.accuracyPct !== undefined ? (
                        <span className="text-emerald-300">acc {run.accuracyPct}%</span>
                      ) : (
                        <span className="text-muted-foreground/70">{run.progressPct}%</span>
                      )}
                    </div>
                  </div>
                  <ProgressBar pct={run.progressPct} status={run.status} />
                  {run.status === "completed" ? (
                    run.promotedToPaper ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[9px] font-mono"
                      >
                        <CheckCircle2 className="size-2.5 mr-0.5" aria-hidden />
                        promoted to paper
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => promoteMlRunToPaper(run.id)}
                        className="h-6 text-[10px]"
                        data-testid={`ml-promote-${run.id}`}
                      >
                        <ArrowUpRight className="size-2.5 mr-0.5" aria-hidden />
                        Promote to paper
                      </Button>
                    )
                  ) : null}
                </li>
              ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrderTicketPanel — Terminal/Command
// ─────────────────────────────────────────────────────────────────────────────

export function OrderTicketPanel({ className }: { readonly className?: string }) {
  React.useEffect(() => {
    ensureCockpitOpsTickerStarted();
  }, []);
  const submitOrder = useCockpitOpsStore((s) => s.submitOrder);
  const pendingOrders = useCockpitOpsStore((s) => s.pendingOrders);
  const recentFills = useCockpitOpsStore((s) => s.recentFills);

  const [side, setSide] = React.useState<"buy" | "sell">("buy");
  const [venue, setVenue] = React.useState("binance");
  const [symbol, setSymbol] = React.useState("BTC-USDT");
  const [qty, setQty] = React.useState(1);
  const [priceLimit, setPriceLimit] = React.useState(70_000);

  const handleSubmit = React.useCallback(() => {
    submitOrder({ strategyId: "ARBITRAGE_PRICE_DISPERSION", side, venue, symbol, qty, priceLimit });
  }, [submitOrder, side, venue, symbol, qty, priceLimit]);

  return (
    <Card
      className={cn("border-border/50 bg-gradient-to-br from-background to-muted/15", className)}
      data-testid="order-ticket-panel"
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Send className="size-3.5 text-emerald-400" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">Order ticket</h3>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono">
            {pendingOrders.length} pending · {recentFills.length} filled
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
          <div className="space-y-1">
            <Label htmlFor="ord-side" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Side
            </Label>
            <Select value={side} onValueChange={(v: string) => setSide(v as "buy" | "sell")}>
              <SelectTrigger id="ord-side" className="h-8 text-xs" data-testid="order-side-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy" className="text-xs">
                  buy
                </SelectItem>
                <SelectItem value="sell" className="text-xs">
                  sell
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ord-venue" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Venue
            </Label>
            <Input
              id="ord-venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="h-8 text-xs font-mono"
              data-testid="order-venue-input"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ord-symbol" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Symbol
            </Label>
            <Input
              id="ord-symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="h-8 text-xs font-mono"
              data-testid="order-symbol-input"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ord-qty" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Qty
            </Label>
            <Input
              id="ord-qty"
              type="number"
              step={0.1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="h-8 text-xs font-mono"
              data-testid="order-qty-input"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ord-price" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Limit
            </Label>
            <Input
              id="ord-price"
              type="number"
              step={1}
              value={priceLimit}
              onChange={(e) => setPriceLimit(Number(e.target.value))}
              className="h-8 text-xs font-mono"
              data-testid="order-price-input"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground/70">
            Paper fills land ~1s after submit with synthetic slippage. Live execution requires the Stream toggle + §4.3
            confirm.
          </p>
          <Button size="sm" onClick={handleSubmit} className="h-7 text-xs" data-testid="order-submit-button">
            Submit {side}
          </Button>
        </div>

        {/* Pending orders */}
        {pendingOrders.length > 0 ? (
          <div
            className="rounded border border-amber-500/30 bg-amber-500/5 p-2 space-y-1"
            data-testid="order-pending-list"
          >
            <p className="text-[10px] uppercase tracking-wider text-amber-300">Pending</p>
            <ul className="space-y-0.5">
              {pendingOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-2 text-[10px] font-mono"
                  data-testid={`order-pending-${o.id}`}
                >
                  <span className="text-amber-200/90 truncate">
                    {o.side.toUpperCase()} {o.qty} {o.symbol} on {o.venue}
                  </span>
                  <Clock className="size-2.5 text-amber-400 shrink-0 animate-pulse" aria-hidden />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Recent fills */}
        {recentFills.length > 0 ? (
          <div
            className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2 space-y-1"
            data-testid="order-fills-list"
          >
            <p className="text-[10px] uppercase tracking-wider text-emerald-300">Recent fills</p>
            <ul className="space-y-0.5">
              {recentFills.slice(0, 5).map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-2 text-[10px] font-mono"
                  data-testid={`order-fill-${f.id}`}
                >
                  <span className="text-emerald-200/90 truncate">
                    {f.side.toUpperCase()} {f.qtyFilled} {f.symbol} @ {f.priceFill} on {f.venue}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-mono shrink-0",
                      f.slippageBps > 0
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
                    )}
                  >
                    {f.slippageBps > 0 ? `+${f.slippageBps}` : f.slippageBps} bps
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CockpitToastDock — bottom-right stack of dispatch confirmations
// ─────────────────────────────────────────────────────────────────────────────

export function CockpitToastDock() {
  const toasts = useCockpitOpsStore((s) => s.toastMessages);
  const dismissToast = useCockpitOpsStore((s) => s.dismissToast);

  // Auto-dismiss every toast after 4s.
  React.useEffect(() => {
    if (toasts.length === 0) return;
    const newest = toasts[toasts.length - 1];
    if (!newest) return;
    const t = setTimeout(() => dismissToast(newest.id), 4000);
    return () => clearTimeout(t);
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm"
      data-testid="cockpit-toast-dock"
    >
      {toasts.slice(-3).map((t) => (
        <div
          key={t.id}
          className={cn(
            "rounded border px-3 py-2 text-[11px] font-mono backdrop-blur-sm shadow-md pointer-events-auto",
            t.tone === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : t.tone === "warn"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                : t.tone === "error"
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                  : "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
          )}
          data-testid={`cockpit-toast-${t.id}`}
          data-tone={t.tone}
          onClick={() => dismissToast(t.id)}
        >
          <div className="flex items-start gap-2">
            {t.tone === "success" ? (
              <CheckCircle2 className="size-3 shrink-0 mt-0.5" aria-hidden />
            ) : t.tone === "warn" ? (
              <ShieldAlert className="size-3 shrink-0 mt-0.5" aria-hidden />
            ) : t.tone === "error" ? (
              <ShieldAlert className="size-3 shrink-0 mt-0.5" aria-hidden />
            ) : (
              <Activity className="size-3 shrink-0 mt-0.5" aria-hidden />
            )}
            <span>{t.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
