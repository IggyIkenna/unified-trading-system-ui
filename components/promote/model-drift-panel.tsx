import { LineChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { fmtNum } from "./helpers";
import type { CandidateStrategy } from "./types";

export function ModelDriftPanel({ strategy }: { strategy: CandidateStrategy }) {
  const d = strategy.modelDrift;
  const icRatio = d.icAtTraining !== 0 ? d.icCurrent / d.icAtTraining : 0;
  const decayPct = Math.max(0, Math.min(100, (1 - icRatio) * 100));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <LineChart className="size-4 text-cyan-400" />
          Model Drift & Decay
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs uppercase text-muted-foreground">
              IC (train)
            </p>
            <p className="text-lg font-mono font-bold mt-1">
              {fmtNum(d.icAtTraining, 3)}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs uppercase text-muted-foreground">
              IC (current)
            </p>
            <p className="text-lg font-mono font-bold mt-1 text-cyan-400">
              {fmtNum(d.icCurrent, 3)}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs uppercase text-muted-foreground">
              Signal half-life
            </p>
            <p className="text-lg font-mono font-bold mt-1">
              {d.signalHalfLifeDays}d
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs uppercase text-muted-foreground">
              Hit-rate trend
            </p>
            <Badge
              variant="outline"
              className={cn(
                "mt-2 text-xs capitalize",
                d.hitRateTrend === "improving" &&
                  "border-emerald-500/40 text-emerald-400",
                d.hitRateTrend === "stable" &&
                  "border-slate-500/40 text-slate-300",
                d.hitRateTrend === "declining" &&
                  "border-amber-500/40 text-amber-400",
              )}
            >
              {d.hitRateTrend}
            </Badge>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs uppercase text-muted-foreground mb-1">
            <span>IC retention vs training</span>
            <span className="font-mono">{fmtNum(icRatio * 100, 0)}%</span>
          </div>
          <Progress value={Math.min(100, icRatio * 100)} className="h-2" />
        </div>
        <div className="rounded-lg border border-border/50 p-3 text-xs">
          <span className="text-muted-foreground">
            Return auto-correlation (1d)
          </span>
          <span className="font-mono ml-2">{fmtNum(d.autoCorrelation, 3)}</span>
          <span className="text-muted-foreground ml-2">
            · implied decay pressure
          </span>
          <span className="font-mono text-amber-400 ml-1">
            {fmtNum(decayPct, 0)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
