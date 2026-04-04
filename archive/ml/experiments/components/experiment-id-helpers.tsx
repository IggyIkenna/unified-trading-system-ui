"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react";
import * as React from "react";
import type { ExperimentMetrics } from "@/lib/types/ml";

// Context badge component
export function ContextBadge({ context }: { context: "BATCH" | "LIVE" }) {
  return (
    <Badge
      variant="outline"
      className={
        context === "LIVE"
          ? "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/30"
          : "bg-[var(--surface-ml)]/10 text-[var(--surface-ml)] border-[var(--surface-ml)]/30"
      }
    >
      {context}
    </Badge>
  );
}

// Status badge
export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: "bg-[var(--status-running)]/10 text-[var(--status-running)] border-[var(--status-running)]/30",
    completed: "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/30",
    failed: "bg-[var(--status-critical)]/10 text-[var(--status-critical)] border-[var(--status-critical)]/30",
    queued: "bg-muted text-muted-foreground",
  };

  const icons: Record<string, React.ReactNode> = {
    running: <RefreshCw className="size-3 animate-spin" />,
    completed: <CheckCircle2 className="size-3" />,
    failed: <XCircle className="size-3" />,
    queued: <Clock className="size-3" />,
  };

  return (
    <Badge variant="outline" className={`gap-1 ${colors[status] || ""}`}>
      {icons[status]}
      {status}
    </Badge>
  );
}

// Generate mock validation curves data
export function generateValidationCurves(): {
  epoch: number;
  accuracy: number;
  valAccuracy: number;
}[] {
  const data = [];
  for (let i = 0; i <= 100; i += 5) {
    const progress = i / 100;
    const trainAcc = 0.5 + 0.25 * (1 - Math.exp(-3 * progress)) + (Math.random() - 0.5) * 0.02;
    const valAcc = 0.5 + 0.22 * (1 - Math.exp(-3 * progress)) + (Math.random() - 0.5) * 0.03;
    data.push({
      epoch: i,
      accuracy: Math.min(0.95, trainAcc),
      valAccuracy: Math.min(0.92, valAcc),
    });
  }
  return data;
}

// Generate mock feature importance data
export function generateFeatureImportance(): {
  feature: string;
  importance: number;
}[] {
  return [
    { feature: "price_momentum_1h", importance: 0.18 },
    { feature: "orderbook_imbalance", importance: 0.15 },
    { feature: "funding_rate", importance: 0.14 },
    { feature: "volume_zscore", importance: 0.12 },
    { feature: "volatility_regime", importance: 0.11 },
    { feature: "cross_asset_correlation", importance: 0.09 },
    { feature: "oi_change", importance: 0.08 },
    { feature: "spread_zscore", importance: 0.07 },
    { feature: "time_of_day", importance: 0.04 },
    { feature: "day_of_week", importance: 0.02 },
  ];
}

// Generate regime performance data
export function generateRegimePerformance(): {
  regime: string;
  sharpe: number;
  accuracy: number;
  drawdown: number;
}[] {
  return [
    { regime: "Risk-On", sharpe: 2.45, accuracy: 74, drawdown: 6 },
    { regime: "Risk-Off", sharpe: 1.85, accuracy: 71, drawdown: 9 },
    { regime: "High-Vol", sharpe: 2.1, accuracy: 69, drawdown: 12 },
    { regime: "Low-Vol", sharpe: 2.6, accuracy: 76, drawdown: 4 },
    { regime: "Trending", sharpe: 2.8, accuracy: 78, drawdown: 5 },
    { regime: "Ranging", sharpe: 1.5, accuracy: 65, drawdown: 8 },
  ];
}

// Radar chart data for metrics
export function generateRadarData(metrics: ExperimentMetrics | null) {
  if (!metrics) return [];
  return [
    { metric: "Sharpe", value: (metrics.sharpe / 3) * 100, fullMark: 100 },
    { metric: "Accuracy", value: metrics.accuracy * 100, fullMark: 100 },
    {
      metric: "Dir. Acc",
      value: metrics.directionalAccuracy * 100,
      fullMark: 100,
    },
    { metric: "Calibration", value: metrics.calibration * 100, fullMark: 100 },
    { metric: "Stability", value: metrics.stabilityScore * 100, fullMark: 100 },
    {
      metric: "1-MaxDD",
      value: (1 - metrics.maxDrawdown) * 100,
      fullMark: 100,
    },
  ];
}
