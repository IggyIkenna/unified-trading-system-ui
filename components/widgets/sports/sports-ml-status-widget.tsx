"use client";

import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { cn } from "@/lib/utils";
import { useSportsData, type ModelFamily, type FeatureFreshness } from "./sports-data-context";

const statusColors: Record<ModelFamily["status"], string> = {
  healthy: "bg-emerald-500",
  stale: "bg-amber-500",
  training: "bg-blue-500 animate-pulse",
  failed: "bg-red-500",
};

const stalenessColors: Record<FeatureFreshness["staleness"], string> = {
  fresh: "text-emerald-400",
  ok: "text-amber-400",
  stale: "text-red-400",
};

function timeSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return `${Math.floor(ms / (1000 * 60))}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function SportsMLStatusWidget(_props: WidgetComponentProps) {
  const { modelFamilies, featureFreshness } = useSportsData();

  if (modelFamilies.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">No ML pipeline data available</p>
      </div>
    );
  }

  const healthyCount = modelFamilies.filter((m) => m.status === "healthy").length;
  const avgAccuracy = modelFamilies.reduce((s, m) => s + m.accuracy, 0) / modelFamilies.length;
  const freshCount = featureFreshness.filter((f) => f.staleness === "fresh").length;
  const totalFeatures = featureFreshness.reduce((s, f) => s + f.columns, 0);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 shrink-0">
        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">ML Pipeline Status</span>
        <span className="ml-auto text-[10px] text-zinc-600">{modelFamilies.length} families</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-2 p-3 border-b border-zinc-800">
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-emerald-400">
              {healthyCount}/{modelFamilies.length}
            </div>
            <div className="text-[10px] text-zinc-500">Models Healthy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-zinc-200">{(avgAccuracy * 100).toFixed(1)}%</div>
            <div className="text-[10px] text-zinc-500">Avg Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-blue-400">
              {freshCount}/{featureFreshness.length}
            </div>
            <div className="text-[10px] text-zinc-500">Features Fresh</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-zinc-200">{totalFeatures}</div>
            <div className="text-[10px] text-zinc-500">Total Columns</div>
          </div>
        </div>

        {/* Model families */}
        <div className="p-2 space-y-1">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1 py-1">Model Families</div>
          {modelFamilies.map((m) => (
            <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-zinc-900/40 hover:bg-zinc-800/60">
              <div className={cn("w-2 h-2 rounded-full shrink-0", statusColors[m.status])} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-zinc-200 truncate">{m.name}</div>
                <div className="text-[10px] text-zinc-500 truncate">
                  {m.targets.slice(0, 3).join(", ")}
                  {m.targets.length > 3 && ` +${m.targets.length - 3}`}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-zinc-200">{(m.accuracy * 100).toFixed(1)}%</div>
                <div className="text-[10px] text-zinc-500">{timeSince(m.lastTrained)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature freshness */}
        <div className="p-2 space-y-1 border-t border-zinc-800">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1 py-1">
            Feature Freshness
          </div>
          <div className="grid grid-cols-2 gap-1">
            {featureFreshness.map((f) => (
              <div key={f.group} className="flex items-center justify-between px-2 py-1 rounded bg-zinc-900/40">
                <div>
                  <div className="text-[10px] font-medium text-zinc-300">{f.group}</div>
                  <div className="text-[9px] text-zinc-600">{f.columns} cols</div>
                </div>
                <div className="text-right">
                  <div className={cn("text-[10px] font-mono font-bold", stalenessColors[f.staleness])}>
                    {(f.coverage * 100).toFixed(0)}%
                  </div>
                  <div className="text-[9px] text-zinc-600">{timeSince(f.lastUpdated)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
