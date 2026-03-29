"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowUpDown, BarChart3, CheckCircle2, Shield, XCircle } from "lucide-react";
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

import type { RunAnalysis } from "@/lib/types/ml";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

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
      <p className="font-mono font-medium leading-snug text-foreground">{label}</p>
      <p className="mt-1.5 text-muted-foreground">
        Importance:{" "}
        <span className="font-mono font-semibold tabular-nums text-foreground">{formatPercent(v * 100, 1)}</span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric coloring
// ---------------------------------------------------------------------------

export function metricColor(value: number, thresholds: { good: number; warn: number; direction: "higher" | "lower" }) {
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
  const t: Record<string, { good: number; warn: number; dir: "higher" | "lower" }> = {
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
    return <p className="text-xs text-muted-foreground py-2">No financial metrics for this run.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {[
        {
          label: "Sharpe",
          value: formatNumber(fm.sharpe_ratio, 2),
          ...thresholds("sharpe"),
        },
        {
          label: "Dir. Acc",
          value: formatPercent(fm.directional_accuracy * 100, 1),
          ...thresholds("dir_acc"),
        },
        {
          label: "Profit Factor",
          value: formatNumber(fm.profit_factor, 2),
          ...thresholds("pf"),
        },
        {
          label: "Hit Rate",
          value: formatPercent(fm.hit_rate * 100, 1),
          ...thresholds("hit_rate"),
        },
        {
          label: "Sortino",
          value: formatNumber(fm.sortino_ratio, 2),
          ...thresholds("sortino"),
        },
        {
          label: "Info Ratio",
          value: formatNumber(fm.information_ratio, 2),
          ...thresholds("ir"),
        },
        {
          label: "Max DD",
          value: formatPercent(fm.max_drawdown_pct, 1),
          ...thresholds("dd"),
        },
        {
          label: "Calibration",
          value: formatNumber(fm.calibration_score, 2),
          ...thresholds("cal"),
        },
        {
          label: "Stability",
          value: formatNumber(fm.stability_score, 2),
          ...thresholds("stability"),
        },
      ].map((m) => (
        <div key={m.label} className="text-center p-2 rounded-md bg-muted/30 border border-border/40">
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

export function RunAnalysisImportanceTab({ analysis }: { analysis: RunAnalysis }) {
  if (analysis.feature_importance.length === 0) {
    return <p className="text-xs text-muted-foreground py-2">No feature importance data.</p>;
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
            <CartesianGrid strokeDasharray="3 3" stroke={RC.border} opacity={0.35} />
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
                  label={typeof tooltipProps.label === "string" ? tooltipProps.label : undefined}
                />
              )}
            />
            <Bar dataKey="importance_score" radius={[0, 4, 4, 0]}>
              {analysis.feature_importance.map((f, i) => (
                <Cell key={f.feature_id} fill={i < 3 ? RC.chart1 : i < 5 ? RC.chart3 : RC.idle} />
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
              <div key={f.feature_id} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                <span className="font-mono font-medium text-foreground shrink-0">{f.feature_name}:</span>
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
    return <p className="text-xs text-muted-foreground py-2">No regime or walk-forward data.</p>;
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
                <span className="font-medium capitalize truncate">{rp.regime}</span>
                <span
                  className={`font-mono ${metricColor(rp.sharpe_ratio, { good: 1.5, warn: 0.5, direction: "higher" })}`}
                >
                  {formatNumber(rp.sharpe_ratio, 2)}
                </span>
                <span
                  className={`font-mono ${metricColor(rp.directional_accuracy, { good: 0.6, warn: 0.5, direction: "higher" })}`}
                >
                  {formatPercent(rp.directional_accuracy * 100, 0)}
                </span>
                <span
                  className={`font-mono ${metricColor(rp.max_drawdown_pct, { good: 5, warn: 15, direction: "lower" })}`}
                >
                  {formatPercent(rp.max_drawdown_pct, 1)}
                </span>
                <span className="font-mono text-muted-foreground">{rp.sample_count}</span>
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
                <CartesianGrid strokeDasharray="3 3" stroke={RC.border} opacity={0.35} />
                <XAxis
                  dataKey="fold_number"
                  tick={{ fill: RC.fg, fontSize: 9, fontWeight: 500 }}
                  axisLine={{ stroke: RC.border }}
                />
                <YAxis tick={{ fill: RC.fg, fontSize: 9, fontWeight: 500 }} axisLine={{ stroke: RC.border }} />
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
                  SR {formatNumber(f.sharpe_ratio, 2)} · {formatPercent(f.directional_accuracy * 100, 0)}
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
                  data={analysis.prediction_distribution.buckets.slice(0, -1).map((b, i) => ({
                    bucket: `${formatNumber(b * 100, 0)}-${formatNumber(analysis.prediction_distribution!.buckets[i + 1] * 100, 0)}%`,
                    actual: analysis.prediction_distribution!.actual_positive_rate[i] * 100,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={RC.border} opacity={0.35} />
                  <XAxis
                    dataKey="bucket"
                    tick={{ fill: RC.fg, fontSize: 9, fontWeight: 500 }}
                    axisLine={{ stroke: RC.border }}
                  />
                  <YAxis tick={{ fill: RC.fg, fontSize: 9, fontWeight: 500 }} axisLine={{ stroke: RC.border }} />
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
                  <Bar dataKey="actual" fill={RC.chart1} radius={[4, 4, 0, 0]} />
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
              <div key={check.check_name} className="flex items-start gap-2 py-1">
                {check.status === "pass" && <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                {check.status === "warn" && <AlertTriangle className="size-3.5 text-amber-400 shrink-0 mt-0.5" />}
                {check.status === "fail" && <XCircle className="size-3.5 text-red-400 shrink-0 mt-0.5" />}
                <div>
                  <p className="text-[11px] font-medium leading-tight">{check.check_name.replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">{check.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!analysis.prediction_distribution && analysis.data_integrity_checks.length === 0 && (
        <p className="text-xs text-muted-foreground md:col-span-2">No calibration or integrity checks for this run.</p>
      )}
    </div>
  );
}
