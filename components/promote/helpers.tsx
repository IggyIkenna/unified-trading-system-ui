import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CandidateStrategy, GateStatus } from "./types";
import { STAGE_ORDER } from "./types";

export function statusColor(status: GateStatus) {
  switch (status) {
    case "passed":
      return "text-emerald-400";
    case "failed":
      return "text-rose-400";
    case "pending":
      return "text-amber-400";
    case "warning":
      return "text-orange-400";
    case "not_started":
      return "text-muted-foreground/40";
  }
}

export function statusBg(status: GateStatus) {
  switch (status) {
    case "passed":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "failed":
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    case "pending":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "warning":
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    case "not_started":
      return "bg-muted/30 text-muted-foreground border-border/30";
  }
}

export function StatusIcon({
  status,
  className,
}: {
  status: GateStatus;
  className?: string;
}) {
  switch (status) {
    case "passed":
      return <CheckCircle2 className={cn("text-emerald-400", className)} />;
    case "failed":
      return <XCircle className={cn("text-rose-400", className)} />;
    case "pending":
      return <Clock className={cn("text-amber-400", className)} />;
    case "warning":
      return <AlertTriangle className={cn("text-orange-400", className)} />;
    case "not_started":
      return <Lock className={cn("text-muted-foreground/40", className)} />;
  }
}

export function fmtPct(v: number) {
  const abs = Math.abs(v);
  const sign = v >= 0 ? "+" : "";
  if (abs < 1) return `${sign}${(v * 100).toFixed(1)}%`;
  return `${sign}${v.toFixed(1)}%`;
}

export function fmtNum(v: number, decimals = 2) {
  return v.toFixed(decimals);
}

export function fmtUsd(v: number) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

/** Standard normal CDF (Hart / Abramowitz-style tail approximation). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-0.5 * z * z);
  const poly =
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const p = d * poly;
  return z >= 0 ? 1 - p : p;
}

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

export function getOverallProgress(strategy: CandidateStrategy): number {
  let completed = 0;
  for (const stage of STAGE_ORDER) {
    if (strategy.stages[stage].status === "passed") completed++;
    else break;
  }
  return (completed / STAGE_ORDER.length) * 100;
}
