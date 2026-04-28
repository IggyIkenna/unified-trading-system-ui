"use client";

import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { cn } from "@/lib/utils";
import { useSportsData, type ModelFamily, type FeatureFreshness } from "./sports-data-context";
import { Spinner } from "@/components/shared/spinner";
import { WidgetScroll } from "@/components/shared/widget-scroll";

const statusColors: Record<ModelFamily["status"], string> = {
  healthy: "bg-[var(--status-live)]",
  stale: "bg-[var(--status-warning)]",
  training: "bg-[var(--status-running)] animate-pulse",
  failed: "bg-[var(--status-critical)]",
};

const stalenessColors: Record<FeatureFreshness["staleness"], string> = {
  fresh: "text-[var(--status-live)]",
  ok: "text-[var(--status-warning)]",
  stale: "text-[var(--status-critical)]",
};

function timeSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return `${Math.floor(ms / (1000 * 60))}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function SportsMLStatusWidget(_props: WidgetComponentProps) {
  const { modelFamilies, featureFreshness, wsStatus } = useSportsData();

  if (wsStatus === "connecting") {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Spinner size="sm" className="text-muted-foreground" />
      </div>
    );
  }

  if (wsStatus === "error" || wsStatus === "disconnected") {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-destructive">ML pipeline data unavailable: connection error</p>
      </div>
    );
  }

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
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">ML Pipeline Status</span>
        <span className="ml-auto text-nano text-muted-foreground/60">{modelFamilies.length} families</span>
      </div>

      <WidgetScroll className="min-h-0 flex-1">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-2 p-3 border-b border-border">
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-[var(--status-live)]">
              {healthyCount}/{modelFamilies.length}
            </div>
            <div className="text-micro text-muted-foreground">Models Healthy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-foreground">{(avgAccuracy * 100).toFixed(1)}%</div>
            <div className="text-micro text-muted-foreground">Avg Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-[var(--status-running)]">
              {freshCount}/{featureFreshness.length}
            </div>
            <div className="text-micro text-muted-foreground">Features Fresh</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-foreground">{totalFeatures}</div>
            <div className="text-micro text-muted-foreground">Total Columns</div>
          </div>
        </div>

        {/* Model families */}
        <div className="p-2 space-y-1">
          <div className="text-micro font-bold text-muted-foreground uppercase tracking-wider px-1 py-1">
            Model Families
          </div>
          {modelFamilies.map((m) => (
            <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-card/40 hover:bg-muted/60">
              <div className={cn("w-2 h-2 rounded-full shrink-0", statusColors[m.status])} />
              <div className="flex-1 min-w-0">
                <div className="text-micro font-medium text-foreground truncate">{m.name}</div>
                <div className="text-nano text-muted-foreground truncate">
                  {m.targets.slice(0, 3).join(", ")}
                  {m.targets.length > 3 && ` +${m.targets.length - 3}`}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-micro font-mono font-bold text-foreground">{(m.accuracy * 100).toFixed(1)}%</div>
                <div className="text-nano text-muted-foreground">{timeSince(m.lastTrained)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature freshness */}
        <div className="p-2 space-y-1 border-t border-border">
          <div className="text-micro font-bold text-muted-foreground uppercase tracking-wider px-1 py-1">
            Feature Freshness
          </div>
          <div className="grid grid-cols-2 gap-1">
            {featureFreshness.map((f) => (
              <div key={f.group} className="flex items-center justify-between px-2 py-1 rounded bg-card/40">
                <div>
                  <div className="text-micro font-medium text-foreground/80">{f.group}</div>
                  <div className="text-nano text-muted-foreground/60">{f.columns} cols</div>
                </div>
                <div className="text-right">
                  <div className={cn("text-micro font-mono font-bold", stalenessColors[f.staleness])}>
                    {(f.coverage * 100).toFixed(0)}%
                  </div>
                  <div className="text-nano text-muted-foreground/60">{timeSince(f.lastUpdated)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </WidgetScroll>
    </div>
  );
}
