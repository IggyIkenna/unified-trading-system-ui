"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  CheckCircle2,
  Plus,
  Shield,
  X,
  XCircle,
} from "lucide-react";
import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import { useMLRunComparison } from "@/hooks/api/use-ml-models";
import type {
  RunAnalysis,
  RunComparison,
  UnifiedTrainingRun,
} from "@/lib/ml-types";

/**
 * Recharts sets SVG `fill`/`stroke` directly. Theme vars in globals are hex (#…);
 * `hsl(var(--foreground))` is invalid — use `var(--foreground)` etc.
 */
const RC = {
  border: "var(--border)",
  fg: "var(--foreground)",
  muted: "var(--muted-foreground)",
  bg: "var(--background)",
  chart1: "var(--chart-1)",
  chart3: "var(--chart-3)",
  chart4: "var(--chart-4)",
  idle: "var(--status-idle)",
  chart2: "var(--chart-2)",
} as const;

// ---------------------------------------------------------------------------
// Feature importance chart — readable axis labels + solid tooltip (Recharts)
// ---------------------------------------------------------------------------

function FeatureImportanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const raw = payload[0]?.value;
  const v = typeof raw === "number" ? raw : Number(raw);
  if (Number.isNaN(v)) return null;

  return (
    <div
      className="min-w-[180px] max-w-[min(92vw,320px)] rounded-md border border-border bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-lg ring-1 ring-black/20 dark:ring-white/15"
      style={{ zIndex: 50 }}
    >
      <p className="font-mono font-medium leading-snug text-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-muted-foreground">
        Importance:{" "}
        <span className="font-mono font-semibold tabular-nums text-foreground">
          {(v * 100).toFixed(1)}%
        </span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric coloring
// ---------------------------------------------------------------------------

export function metricColor(
  value: number,
  thresholds: { good: number; warn: number; direction: "higher" | "lower" },
) {
  if (thresholds.direction === "higher") {
    if (value >= thresholds.good) return "text-emerald-400";
    if (value >= thresholds.warn) return "text-amber-400";
    return "text-red-400";
  }
  if (value <= thresholds.good) return "text-emerald-400";
  if (value <= thresholds.warn) return "text-amber-400";
  return "text-red-400";
}

export function thresholds(metric: string): {
  good: number;
  warn: number;
  dir: "higher" | "lower";
} {
  const t: Record<
    string,
    { good: number; warn: number; dir: "higher" | "lower" }
  > = {
    sharpe: { good: 2.0, warn: 1.0, dir: "higher" },
    dir_acc: { good: 65, warn: 55, dir: "higher" },
    pf: { good: 1.5, warn: 1.0, dir: "higher" },
    hit_rate: { good: 60, warn: 50, dir: "higher" },
    sortino: { good: 2.5, warn: 1.0, dir: "higher" },
    ir: { good: 1.0, warn: 0.5, dir: "higher" },
    dd: { good: 10, warn: 20, dir: "lower" },
    cal: { good: 0.9, warn: 0.8, dir: "higher" },
    stability: { good: 0.85, warn: 0.7, dir: "higher" },
  };
  return t[metric] ?? { good: 0, warn: 0, dir: "higher" };
}

// ---------------------------------------------------------------------------
// Tab panels (compact for RunDetail)
// ---------------------------------------------------------------------------

export function RunAnalysisMetricsTab({ analysis }: { analysis: RunAnalysis }) {
  const fm = analysis.financial_metrics;
  if (!fm) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        No financial metrics for this run.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {[
        {
          label: "Sharpe",
          value: fm.sharpe_ratio.toFixed(2),
          ...thresholds("sharpe"),
        },
        {
          label: "Dir. Acc",
          value: `${(fm.directional_accuracy * 100).toFixed(1)}%`,
          ...thresholds("dir_acc"),
        },
        {
          label: "Profit Factor",
          value: fm.profit_factor.toFixed(2),
          ...thresholds("pf"),
        },
        {
          label: "Hit Rate",
          value: `${(fm.hit_rate * 100).toFixed(1)}%`,
          ...thresholds("hit_rate"),
        },
        {
          label: "Sortino",
          value: fm.sortino_ratio.toFixed(2),
          ...thresholds("sortino"),
        },
        {
          label: "Info Ratio",
          value: fm.information_ratio.toFixed(2),
          ...thresholds("ir"),
        },
        {
          label: "Max DD",
          value: `${fm.max_drawdown_pct.toFixed(1)}%`,
          ...thresholds("dd"),
        },
        {
          label: "Calibration",
          value: fm.calibration_score.toFixed(2),
          ...thresholds("cal"),
        },
        {
          label: "Stability",
          value: fm.stability_score.toFixed(2),
          ...thresholds("stability"),
        },
      ].map((m) => (
        <div
          key={m.label}
          className="text-center p-2 rounded-md bg-muted/30 border border-border/40"
        >
          <p
            className={`text-sm font-bold font-mono ${metricColor(parseFloat(String(m.value).replace(/[^0-9.-]/g, "")), { good: m.good, warn: m.warn, direction: m.dir })}`}
          >
            {m.value}
          </p>
          <p className="text-[10px] text-muted-foreground">{m.label}</p>
        </div>
      ))}
    </div>
  );
}

export function RunAnalysisImportanceTab({
  analysis,
}: {
  analysis: RunAnalysis;
}) {
  if (analysis.feature_importance.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        No feature importance data.
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-[min(50vh,360px)] overflow-y-auto pr-1">
      <div className="h-[min(200px,28vh)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={analysis.feature_importance}
            layout="vertical"
            margin={{ left: 4, right: 12, top: 4, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={RC.border}
              opacity={0.35}
            />
            <XAxis
              type="number"
              domain={[0, "auto"]}
              tick={{
                fill: RC.fg,
                fontSize: 10,
                fontWeight: 500,
              }}
              axisLine={{ stroke: RC.border }}
              tickLine={{ stroke: RC.border }}
            />
            <YAxis
              type="category"
              dataKey="feature_name"
              width={118}
              tick={{ fill: RC.fg, fontSize: 10, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: RC.border }}
              interval={0}
            />
            <Tooltip
              allowEscapeViewBox={{ x: true, y: true }}
              cursor={{ fill: "hsla(0, 0%, 100%, 0.06)" }}
              wrapperStyle={{ outline: "none", zIndex: 50 }}
              content={(tooltipProps) => (
                <FeatureImportanceTooltip
                  active={tooltipProps.active}
                  payload={tooltipProps.payload}
                  label={
                    typeof tooltipProps.label === "string"
                      ? tooltipProps.label
                      : undefined
                  }
                />
              )}
            />
            <Bar dataKey="importance_score" radius={[0, 4, 4, 0]}>
              {analysis.feature_importance.map((f, i) => (
                <Cell
                  key={f.feature_id}
                  fill={i < 3 ? RC.chart1 : i < 5 ? RC.chart3 : RC.idle}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {analysis.feature_importance.filter((f) => f.insight).length > 0 && (
        <div className="space-y-1 border-t border-border/50 pt-2">
          {analysis.feature_importance
            .filter((f) => f.insight)
            .map((f) => (
              <div
                key={f.feature_id}
                className="flex items-start gap-2 text-[10px] text-muted-foreground"
              >
                <span className="font-mono font-medium text-foreground shrink-0">
                  {f.feature_name}:
                </span>
                <span className="italic">{f.insight}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export function RunAnalysisRegimesTab({ analysis }: { analysis: RunAnalysis }) {
  const hasRegime = analysis.regime_performance.length > 0;
  const hasWf = analysis.walk_forward_folds.length > 0;
  if (!hasRegime && !hasWf) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        No regime or walk-forward data.
      </p>
    );
  }

  return (
    <div className="space-y-4 max-h-[min(55vh,420px)] overflow-y-auto pr-1">
      {hasRegime && (
        <div>
          <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BarChart3 className="size-3.5" />
            Regime Performance
          </h4>
          <div className="grid grid-cols-[72px_1fr_1fr_1fr_1fr] gap-1 px-1 text-[9px] font-medium text-muted-foreground uppercase">
            <span>Regime</span>
            <span>Sharpe</span>
            <span>Dir</span>
            <span>DD</span>
            <span>N</span>
          </div>
          {analysis.regime_performance.map((rp) => (
            <div key={rp.regime} className="text-[10px]">
              <div className="grid grid-cols-[72px_1fr_1fr_1fr_1fr] gap-1 px-1 py-1 rounded hover:bg-muted/20 items-center">
                <span className="font-medium capitalize truncate">
                  {rp.regime}
                </span>
                <span
                  className={`font-mono ${metricColor(rp.sharpe_ratio, { good: 1.5, warn: 0.5, direction: "higher" })}`}
                >
                  {rp.sharpe_ratio.toFixed(2)}
                </span>
                <span
                  className={`font-mono ${metricColor(rp.directional_accuracy, { good: 0.6, warn: 0.5, direction: "higher" })}`}
                >
                  {(rp.directional_accuracy * 100).toFixed(0)}%
                </span>
                <span
                  className={`font-mono ${metricColor(rp.max_drawdown_pct, { good: 5, warn: 15, direction: "lower" })}`}
                >
                  {rp.max_drawdown_pct.toFixed(1)}%
                </span>
                <span className="font-mono text-muted-foreground">
                  {rp.sample_count}
                </span>
              </div>
              {rp.warning && (
                <div className="flex items-center gap-1 px-1 py-0.5 text-[9px] text-amber-400">
                  <AlertTriangle className="size-2.5 shrink-0" />
                  <span>{rp.warning}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasWf && (
        <div>
          <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ArrowUpDown className="size-3.5" />
            Walk-Forward ({analysis.walk_forward_folds.length})
          </h4>
          <div className="h-[min(140px,22vh)] mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysis.walk_forward_folds}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={RC.border}
                  opacity={0.35}
                />
                <XAxis
                  dataKey="fold_number"
                  tick={{ fill: RC.fg, fontSize: 9, fontWeight: 500 }}
                  axisLine={{ stroke: RC.border }}
                />
                <YAxis
                  tick={{ fill: RC.fg, fontSize: 9, fontWeight: 500 }}
                  axisLine={{ stroke: RC.border }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: RC.bg,
                    border: `1px solid ${RC.border}`,
                    borderRadius: "8px",
                    fontSize: "10px",
                    color: RC.fg,
                  }}
                  labelStyle={{ color: RC.fg }}
                  itemStyle={{ color: RC.muted }}
                />
                <Line
                  type="monotone"
                  dataKey="sharpe_ratio"
                  stroke={RC.chart3}
                  strokeWidth={1.5}
                  name="Sharpe"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="directional_accuracy"
                  stroke={RC.chart2}
                  strokeWidth={1.5}
                  name="Dir"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-0.5 max-h-[140px] overflow-y-auto">
            {analysis.walk_forward_folds.map((f) => (
              <div
                key={f.fold_number}
                className="grid grid-cols-[28px_1fr_1fr] gap-1 px-1 py-0.5 text-[9px] font-mono rounded hover:bg-muted/20"
              >
                <span className="text-muted-foreground">F{f.fold_number}</span>
                <span className="truncate text-muted-foreground">
                  {f.train_start}→{f.train_end}
                </span>
                <span className="text-right">
                  SR {f.sharpe_ratio.toFixed(2)} ·{" "}
                  {(f.directional_accuracy * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RunAnalysisQualityTab({ analysis }: { analysis: RunAnalysis }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[min(55vh,440px)] overflow-y-auto">
      {analysis.prediction_distribution && (
        <Card className="border-border/50">
          <CardHeader className="py-2 pb-1">
            <CardTitle className="text-xs">Calibration</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[min(160px,24vh)]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analysis.prediction_distribution.buckets
                    .slice(0, -1)
                    .map((b, i) => ({
                      bucket: `${(b * 100).toFixed(0)}-${(analysis.prediction_distribution!.buckets[i + 1] * 100).toFixed(0)}%`,
                      actual:
                        analysis.prediction_distribution!.actual_positive_rate[
                          i
                        ] * 100,
                    }))}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={RC.border}
                    opacity={0.35}
                  />
                  <XAxis
                    dataKey="bucket"
                    tick={{ fill: RC.fg, fontSize: 9, fontWeight: 500 }}
                    axisLine={{ stroke: RC.border }}
                  />
                  <YAxis
                    tick={{ fill: RC.fg, fontSize: 9, fontWeight: 500 }}
                    axisLine={{ stroke: RC.border }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: RC.bg,
                      border: `1px solid ${RC.border}`,
                      borderRadius: "8px",
                      fontSize: "10px",
                      color: RC.fg,
                    }}
                    labelStyle={{ color: RC.fg }}
                    itemStyle={{ color: RC.muted }}
                  />
                  <Bar
                    dataKey="actual"
                    fill={RC.chart1}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.data_integrity_checks.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="py-2 pb-1">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Shield className="size-3.5" />
              Data integrity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1.5 max-h-[min(200px,30vh)] overflow-y-auto">
            {analysis.data_integrity_checks.map((check) => (
              <div
                key={check.check_name}
                className="flex items-start gap-2 py-1"
              >
                {check.status === "pass" && (
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {check.status === "warn" && (
                  <AlertTriangle className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                )}
                {check.status === "fail" && (
                  <XCircle className="size-3.5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-[11px] font-medium leading-tight">
                    {check.check_name.replace(/_/g, " ")}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    {check.message}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!analysis.prediction_distribution &&
        analysis.data_integrity_checks.length === 0 && (
          <p className="text-xs text-muted-foreground md:col-span-2">
            No calibration or integrity checks for this run.
          </p>
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comparison — baseline (selected run) vs up to 3 other completed runs
// ---------------------------------------------------------------------------

export const ML_COMPARE_MAX_OTHER_RUNS = 3;

const COMPARE_RUN_STYLES = [
  {
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    label: "text-purple-400",
    value: "text-purple-400",
  },
  {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    label: "text-amber-400",
    value: "text-amber-400",
  },
  {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    label: "text-cyan-400",
    value: "text-cyan-400",
  },
] as const;

const COMPARE_SELECT_EMPTY = "__compare_none__";

/** Baseline + add-slot (+) UI with searchable dropdowns (max `maxSlots` comparison runs). */
export function MLCompareSlotPicker({
  baselineName,
  baselineRunId,
  candidates,
  slots,
  onSlotsChange,
  maxSlots = ML_COMPARE_MAX_OTHER_RUNS,
}: {
  baselineName: string;
  baselineRunId: string;
  candidates: UnifiedTrainingRun[];
  slots: (string | null)[];
  onSlotsChange: (next: (string | null)[]) => void;
  maxSlots?: number;
}) {
  const takenExcept = (exceptIndex: number) => {
    const s = new Set<string>();
    slots.forEach((id, i) => {
      if (i !== exceptIndex && id) s.add(id);
    });
    return s;
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Baseline is selected above. Use <span className="font-medium">+</span>{" "}
        to add a comparison slot, then choose a run (up to {maxSlots} vs
        baseline).
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {/* Baseline: same visual language as compare selects (no duplicate header row below). */}
        <div
          className="flex h-10 min-w-0 max-w-[min(100%,320px)] shrink-0 items-center gap-2 rounded-md border border-blue-500/40 bg-blue-500/10 px-3 shadow-sm"
          title={baselineName}
        >
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-blue-400">
            Baseline
          </span>
          <span className="truncate text-xs font-medium text-blue-100">
            {baselineName}
          </span>
        </div>

        {slots.map((slotId, index) => {
          const busy = takenExcept(index);
          const options = candidates.filter(
            (r) => !busy.has(r.id) || r.id === slotId,
          );
          const st = COMPARE_RUN_STYLES[index % COMPARE_RUN_STYLES.length];
          return (
            <div key={index} className="flex h-10 items-center gap-1">
              <Select
                value={slotId ?? COMPARE_SELECT_EMPTY}
                onValueChange={(v) => {
                  const next = [...slots];
                  next[index] = v === COMPARE_SELECT_EMPTY ? null : v;
                  onSlotsChange(next);
                }}
              >
                <SelectTrigger
                  className={cn(
                    "h-10 w-[min(320px,100%)] border font-medium text-xs shadow-sm [&>span]:truncate",
                    st.border,
                    st.bg,
                    slotId ? st.value : cn(st.label, "opacity-90"),
                  )}
                >
                  <SelectValue placeholder="Select run…" />
                </SelectTrigger>
                <SelectContent className="max-h-[min(60vh,320px)]">
                  <SelectItem
                    value={COMPARE_SELECT_EMPTY}
                    className="text-xs text-muted-foreground"
                  >
                    — Select run —
                  </SelectItem>
                  {options.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-xs">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 shrink-0"
                aria-label={`Remove comparison slot ${index + 1}`}
                onClick={() =>
                  onSlotsChange(slots.filter((_, i) => i !== index))
                }
              >
                <X className="size-4" />
              </Button>
            </div>
          );
        })}

        {slots.length < maxSlots ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10"
              aria-label="Add comparison slot"
              onClick={() => onSlotsChange([...slots, null])}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function buildConfigDiffMatrix(
  baseline: UnifiedTrainingRun,
  compares: UnifiedTrainingRun[],
): { key: string; baseline: string; values: string[] }[] {
  if (compares.length === 0) return [];

  const rows: { key: string; baseline: string; values: string[] }[] = [];

  const std: { key: string; get: (r: UnifiedTrainingRun) => string }[] = [
    { key: "Architecture", get: (r) => r.config.architecture },
    { key: "Target", get: (r) => r.config.target_variable },
    { key: "Timeframe", get: (r) => r.config.timeframe },
  ];
  for (const f of std) {
    const b = f.get(baseline);
    const vals = compares.map((c) => f.get(c));
    if (vals.some((v) => v !== b)) {
      rows.push({ key: f.key, baseline: b, values: vals });
    }
  }

  const hpKeys = new Set<string>();
  for (const r of [baseline, ...compares]) {
    Object.keys(r.config.hyperparameters).forEach((k) => hpKeys.add(k));
  }
  for (const k of [...hpKeys].sort()) {
    const b = String(baseline.config.hyperparameters[k] ?? "—");
    const vals = compares.map((c) =>
      String(c.config.hyperparameters[k] ?? "—"),
    );
    if (vals.some((v) => v !== b)) {
      rows.push({ key: `hp.${k}`, baseline: b, values: vals });
    }
  }

  return rows;
}

function ConfigDiffMultiTable({
  baseline,
  compares,
}: {
  baseline: UnifiedTrainingRun;
  compares: UnifiedTrainingRun[];
}) {
  const matrix = React.useMemo(
    () => buildConfigDiffMatrix(baseline, compares),
    [baseline, compares],
  );

  if (compares.length === 0) {
    return (
      <p className="text-[10px] text-muted-foreground">
        Add at least one comparison run to see config differences.
      </p>
    );
  }

  if (matrix.length === 0) {
    return (
      <p className="text-[10px] text-muted-foreground">
        No config differences vs baseline.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-x-auto">
      <table className="w-full min-w-[520px] text-[10px] border-collapse">
        <thead>
          <tr className="border-b border-border/50 bg-muted/20 text-[9px] font-medium text-muted-foreground uppercase">
            <th className="text-left px-2 py-1.5 w-[100px] sticky left-0 z-10 bg-muted/20 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.4)]">
              Field
            </th>
            <th className="text-left px-2 py-1.5 min-w-[88px] text-blue-400">
              Baseline
            </th>
            {compares.map((cr, i) => {
              const st = COMPARE_RUN_STYLES[i % COMPARE_RUN_STYLES.length];
              return (
                <th
                  key={cr.id}
                  className={`text-left px-2 py-1.5 border-l border-border/30 min-w-[100px] max-w-[200px] ${st.label}`}
                  title={cr.name}
                >
                  <span className="line-clamp-2">
                    {cr.name.length > 24 ? `${cr.name.slice(0, 22)}…` : cr.name}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr
              key={row.key}
              className="border-b border-border/20 hover:bg-muted/10 align-top"
            >
              <td className="px-2 py-1.5 text-muted-foreground font-mono text-[9px] sticky left-0 z-[1] bg-background shadow-[2px_0_8px_-4px_rgba(0,0,0,0.35)] max-w-[140px]">
                {row.key}
              </td>
              <td className="px-2 py-1.5 font-mono text-blue-400 break-words">
                {row.baseline}
              </td>
              {row.values.map((v, i) => {
                const st = COMPARE_RUN_STYLES[i % COMPARE_RUN_STYLES.length];
                const diff = v !== row.baseline;
                return (
                  <td
                    key={`${row.key}-${compares[i]?.id ?? i}`}
                    className={`px-2 py-1.5 font-mono border-l border-border/30 break-words ${st.value} ${diff ? "bg-amber-500/5" : ""}`}
                  >
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RunComparisonView({
  baselineRun,
  compareRuns,
}: {
  baselineRun: UnifiedTrainingRun;
  compareRuns: UnifiedTrainingRun[];
}) {
  const runs = React.useMemo(() => {
    const seen = new Set<string>();
    const out: UnifiedTrainingRun[] = [];
    for (const r of compareRuns) {
      if (!r?.id || r.id === baselineRun.id) continue;
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
      if (out.length >= ML_COMPARE_MAX_OTHER_RUNS) break;
    }
    return out;
  }, [compareRuns, baselineRun.id]);

  const compareIds = React.useMemo(() => runs.map((r) => r.id), [runs]);

  const { data: compData, isLoading: compLoading } = useMLRunComparison(
    baselineRun.id,
    compareIds,
  );
  const comparisons = (
    Array.isArray(compData) ? compData : []
  ) as RunComparison[];

  const fmA = baselineRun.analysis?.financial_metrics;

  const metricRows = [
    {
      label: "Sharpe",
      key: "sharpe_ratio",
      get: (fm: NonNullable<typeof fmA>) => fm.sharpe_ratio,
    },
    {
      label: "Dir Acc",
      key: "directional_accuracy",
      pct: true,
      get: (fm: NonNullable<typeof fmA>) => fm.directional_accuracy,
    },
    {
      label: "PF",
      key: "profit_factor",
      get: (fm: NonNullable<typeof fmA>) => fm.profit_factor,
    },
    {
      label: "Max DD",
      key: "max_drawdown_pct",
      lower: true,
      suffix: "%",
      get: (fm: NonNullable<typeof fmA>) => fm.max_drawdown_pct,
    },
    {
      label: "Cal",
      key: "calibration_score",
      get: (fm: NonNullable<typeof fmA>) => fm.calibration_score,
    },
    {
      label: "Stability",
      key: "stability_score",
      get: (fm: NonNullable<typeof fmA>) => fm.stability_score,
    },
    {
      label: "Sortino",
      key: "sortino_ratio",
      get: (fm: NonNullable<typeof fmA>) => fm.sortino_ratio,
    },
    {
      label: "IR",
      key: "information_ratio",
      get: (fm: NonNullable<typeof fmA>) => fm.information_ratio,
    },
  ] as const;

  return (
    <div className="space-y-3 max-h-[min(70vh,560px)] overflow-y-auto pr-1">
      {fmA && runs.length > 0 && (
        <div className="rounded-lg border border-border/50 overflow-x-auto">
          <table className="w-full min-w-[520px] text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20 text-[9px] font-medium text-muted-foreground uppercase">
                <th className="text-left px-2 py-1.5 w-[88px]">Metric</th>
                <th className="text-left px-2 py-1.5 min-w-[72px]">Baseline</th>
                {runs.map((cr, i) => {
                  const st = COMPARE_RUN_STYLES[i % COMPARE_RUN_STYLES.length];
                  return (
                    <React.Fragment key={cr.id}>
                      <th
                        colSpan={4}
                        className={`text-center px-1 py-1 border-l border-border/40 ${st.label}`}
                        title={cr.name}
                      >
                        {cr.name.length > 22
                          ? `${cr.name.slice(0, 20)}…`
                          : cr.name}
                      </th>
                    </React.Fragment>
                  );
                })}
              </tr>
              <tr className="border-b border-border/40 bg-muted/10 text-[9px] text-muted-foreground">
                <th className="px-2 py-1" />
                <th className="px-2 py-1 text-left font-normal">Value</th>
                {runs.map((cr) => (
                  <React.Fragment key={`${cr.id}-sub`}>
                    <th className="border-l border-border/30 px-1 py-1 text-center font-normal w-[72px]">
                      Value
                    </th>
                    <th className="px-1 py-1 text-center font-normal">Δ</th>
                    <th className="px-1 py-1 text-center font-normal">p</th>
                    <th className="px-1 py-1 text-center font-normal">Sig</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricRows.map((row) => {
                const fmt = (v: number) =>
                  "pct" in row && row.pct
                    ? `${(v * 100).toFixed(1)}%`
                    : `${v.toFixed(2)}${"suffix" in row && row.suffix ? row.suffix : ""}`;

                const baseVal = row.get(fmA);

                return (
                  <tr
                    key={row.key}
                    className="border-b border-border/20 hover:bg-muted/10"
                  >
                    <td className="px-2 py-1.5 text-muted-foreground truncate">
                      {row.label}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-blue-400">
                      {fmt(baseVal)}
                    </td>
                    {runs.map((cr, ri) => {
                      const st =
                        COMPARE_RUN_STYLES[ri % COMPARE_RUN_STYLES.length];
                      const fmB = cr.analysis?.financial_metrics;
                      const comp = comparisons.find(
                        (c) => c.metric === row.key && c.run_b_id === cr.id,
                      );
                      if (!fmB) {
                        return (
                          <React.Fragment key={cr.id}>
                            <td
                              colSpan={4}
                              className="border-l border-border/30 px-2 py-1.5 text-muted-foreground text-center"
                            >
                              —
                            </td>
                          </React.Fragment>
                        );
                      }
                      const bVal = row.get(fmB);
                      const delta = bVal - baseVal;
                      const lowerIsBetter =
                        "lower" in row && row.lower === true;
                      const better = lowerIsBetter ? delta < 0 : delta > 0;
                      const suffix =
                        "suffix" in row && row.suffix ? row.suffix : "";

                      return (
                        <React.Fragment key={cr.id}>
                          <td
                            className={`border-l border-border/30 px-2 py-1.5 font-mono ${st.value}`}
                          >
                            {fmt(bVal)}
                          </td>
                          <td
                            className={`px-1 py-1.5 font-mono text-center ${better ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {delta > 0 ? "+" : ""}
                            {"pct" in row && row.pct
                              ? `${(delta * 100).toFixed(1)}%`
                              : `${delta.toFixed(2)}${suffix}`}
                          </td>
                          <td className="px-1 py-1.5 font-mono text-muted-foreground text-[9px] text-center">
                            {compLoading
                              ? "…"
                              : comp
                                ? comp.p_value.toFixed(3)
                                : "—"}
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            {compLoading ? (
                              "…"
                            ) : comp?.is_significant ? (
                              <Badge
                                variant="outline"
                                className="h-5 px-1 text-[9px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              >
                                Y
                              </Badge>
                            ) : comp ? (
                              <Badge
                                variant="outline"
                                className="h-5 px-1 text-[9px] bg-zinc-500/15 text-zinc-400"
                              >
                                N
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase">
          Config diff (vs baseline)
        </p>
        <ConfigDiffMultiTable baseline={baselineRun} compares={runs} />
      </div>
    </div>
  );
}
