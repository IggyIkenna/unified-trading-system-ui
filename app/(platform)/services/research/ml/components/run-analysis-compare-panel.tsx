"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMLRunComparison } from "@/hooks/api/use-ml-models";
import type { RunComparison, UnifiedTrainingRun } from "@/lib/ml-types";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import * as React from "react";

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
        Baseline is selected above. Use <span className="font-medium">+</span> to add a comparison slot, then choose a
        run (up to {maxSlots} vs baseline).
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {/* Baseline: same visual language as compare selects (no duplicate header row below). */}
        <div
          className="flex h-10 min-w-0 max-w-[min(100%,320px)] shrink-0 items-center gap-2 rounded-md border border-blue-500/40 bg-blue-500/10 px-3 shadow-sm"
          title={baselineName}
        >
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-blue-400">Baseline</span>
          <span className="truncate text-xs font-medium text-blue-100">{baselineName}</span>
        </div>

        {slots.map((slotId, index) => {
          const busy = takenExcept(index);
          const options = candidates.filter((r) => !busy.has(r.id) || r.id === slotId);
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
                  <SelectItem value={COMPARE_SELECT_EMPTY} className="text-xs text-muted-foreground">
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
                onClick={() => onSlotsChange(slots.filter((_, i) => i !== index))}
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
    const vals = compares.map((c) => String(c.config.hyperparameters[k] ?? "—"));
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
  const matrix = React.useMemo(() => buildConfigDiffMatrix(baseline, compares), [baseline, compares]);

  if (compares.length === 0) {
    return (
      <p className="text-[10px] text-muted-foreground">Add at least one comparison run to see config differences.</p>
    );
  }

  if (matrix.length === 0) {
    return <p className="text-[10px] text-muted-foreground">No config differences vs baseline.</p>;
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-x-auto">
      <table className="w-full min-w-[520px] text-[10px] border-collapse">
        <thead>
          <tr className="border-b border-border/50 bg-muted/20 text-[9px] font-medium text-muted-foreground uppercase">
            <th className="text-left px-2 py-1.5 w-[100px] sticky left-0 z-10 bg-muted/20 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.4)]">
              Field
            </th>
            <th className="text-left px-2 py-1.5 min-w-[88px] text-blue-400">Baseline</th>
            {compares.map((cr, i) => {
              const st = COMPARE_RUN_STYLES[i % COMPARE_RUN_STYLES.length];
              return (
                <th
                  key={cr.id}
                  className={`text-left px-2 py-1.5 border-l border-border/30 min-w-[100px] max-w-[200px] ${st.label}`}
                  title={cr.name}
                >
                  <span className="line-clamp-2">{cr.name.length > 24 ? `${cr.name.slice(0, 22)}…` : cr.name}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr key={row.key} className="border-b border-border/20 hover:bg-muted/10 align-top">
              <td className="px-2 py-1.5 text-muted-foreground font-mono text-[9px] sticky left-0 z-[1] bg-background shadow-[2px_0_8px_-4px_rgba(0,0,0,0.35)] max-w-[140px]">
                {row.key}
              </td>
              <td className="px-2 py-1.5 font-mono text-blue-400 break-words">{row.baseline}</td>
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

  const { data: compData, isLoading: compLoading } = useMLRunComparison(baselineRun.id, compareIds);
  const comparisons = (Array.isArray(compData) ? compData : []) as RunComparison[];

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
                        {cr.name.length > 22 ? `${cr.name.slice(0, 20)}…` : cr.name}
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
                    <th className="border-l border-border/30 px-1 py-1 text-center font-normal w-[72px]">Value</th>
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
                  <tr key={row.key} className="border-b border-border/20 hover:bg-muted/10">
                    <td className="px-2 py-1.5 text-muted-foreground truncate">{row.label}</td>
                    <td className="px-2 py-1.5 font-mono text-blue-400">{fmt(baseVal)}</td>
                    {runs.map((cr, ri) => {
                      const st = COMPARE_RUN_STYLES[ri % COMPARE_RUN_STYLES.length];
                      const fmB = cr.analysis?.financial_metrics;
                      const comp = comparisons.find((c) => c.metric === row.key && c.run_b_id === cr.id);
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
                      const lowerIsBetter = "lower" in row && row.lower === true;
                      const better = lowerIsBetter ? delta < 0 : delta > 0;
                      const suffix = "suffix" in row && row.suffix ? row.suffix : "";

                      return (
                        <React.Fragment key={cr.id}>
                          <td className={`border-l border-border/30 px-2 py-1.5 font-mono ${st.value}`}>{fmt(bVal)}</td>
                          <td
                            className={`px-1 py-1.5 font-mono text-center ${better ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {delta > 0 ? "+" : ""}
                            {"pct" in row && row.pct ? `${(delta * 100).toFixed(1)}%` : `${delta.toFixed(2)}${suffix}`}
                          </td>
                          <td className="px-1 py-1.5 font-mono text-muted-foreground text-[9px] text-center">
                            {compLoading ? "…" : comp ? comp.p_value.toFixed(3) : "—"}
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
                              <Badge variant="outline" className="h-5 px-1 text-[9px] bg-zinc-500/15 text-zinc-400">
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
        <p className="text-[10px] font-medium text-muted-foreground uppercase">Config diff (vs baseline)</p>
        <ConfigDiffMultiTable baseline={baselineRun} compares={runs} />
      </div>
    </div>
  );
}
