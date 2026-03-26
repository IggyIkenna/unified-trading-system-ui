import { GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fmtNum, fmtPct, statusColor } from "./helpers";
import type { CandidateStrategy } from "./types";

export function WalkForwardPanel({
  strategy,
}: {
  strategy: CandidateStrategy;
}) {
  const w = strategy.walkForward;
  const sharpes = w.map((x) => x.sharpe);
  const mean = sharpes.reduce((a, b) => a + b, 0) / (sharpes.length || 1);
  const variance =
    sharpes.reduce((s, x) => s + (x - mean) ** 2, 0) / (sharpes.length || 1);
  const std = Math.sqrt(variance);
  const degradation = w.length >= 2 ? w[w.length - 1].sharpe - w[0].sharpe : 0;
  const pooledT = mean / (std / Math.sqrt(sharpes.length || 1) || 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <GitBranch className="size-4 text-cyan-400" />
          Walk-Forward Validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs uppercase text-muted-foreground">
              Consistency (σ Sharpe)
            </p>
            <p className="text-lg font-mono font-bold mt-1">{fmtNum(std)}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs uppercase text-muted-foreground">
              Degradation (last − first)
            </p>
            <p
              className={`text-lg font-mono font-bold mt-1 ${degradation < 0 ? "text-amber-400" : "text-emerald-400"}`}
            >
              {fmtNum(degradation)}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs uppercase text-muted-foreground">
              Pooled t-stat
            </p>
            <p className="text-lg font-mono font-bold mt-1">
              {fmtNum(pooledT)}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          Window-level p-values are approximate (two-sided vs. zero mean
          return); treat as triage, not hypothesis tests across overlapping
          windows.
        </p>
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>#</TableHead>
              <TableHead>Train</TableHead>
              <TableHead>Test</TableHead>
              <TableHead className="text-right">Sharpe</TableHead>
              <TableHead className="text-right">Return</TableHead>
              <TableHead className="text-right">Max DD</TableHead>
              <TableHead className="text-right">t</TableHead>
              <TableHead className="text-right">p</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {w.map((row) => {
              const p = row.pValue;
              const pOk = p !== undefined && p < 0.05;
              const pWarn = p !== undefined && p >= 0.05 && p < 0.1;
              return (
                <TableRow key={row.windowId} className="text-xs">
                  <TableCell className="font-mono">{row.windowId}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.trainStart} → {row.trainEnd}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.testStart} → {row.testEnd}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {fmtNum(row.sharpe)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {fmtPct(row.return)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-rose-400/90">
                    {fmtPct(row.maxDrawdown)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {fmtNum(row.tStat)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {p === undefined ? (
                      "—"
                    ) : (
                      <span
                        className={cn(
                          pOk
                            ? "text-emerald-400"
                            : pWarn
                              ? "text-amber-400"
                              : statusColor("pending"),
                        )}
                      >
                        {fmtNum(p, 3)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
