import { cn } from "@/lib/utils";
import {
  statusBg,
  statusColor,
  StatusIcon,
  type GateStatus,
} from "@/components/shared/gate-status";
import type { CandidateStrategy } from "./types";
import { STAGE_ORDER } from "./types";

export { statusBg, statusColor, StatusIcon, type GateStatus };

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

/** SLA chip label + badge classes for pipeline list/cards. */
export function promoteSlaBadge(c: CandidateStrategy) {
  const d = c.daysInCurrentStage ?? 0;
  const lim = c.slaDaysExpected ?? 7;
  if (d > lim) return { label: "Breach", className: statusBg("failed") };
  if (d >= lim - 1) return { label: "At risk", className: statusBg("warning") };
  return { label: "On track", className: statusBg("passed") };
}
