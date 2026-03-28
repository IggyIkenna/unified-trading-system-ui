"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  LineChart,
  Plus,
  RefreshCw,
  Rocket,
  Settings,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BacktestRun } from "./quant-types";
import { initialBacktestRuns, mlTrainingJobs } from "./quant-data";
import { getStatusIcon } from "./quant-utils";

export function QuantOverview() {
  const [backtestRuns, setBacktestRuns] = React.useState<BacktestRun[]>(initialBacktestRuns);
  const [promotingBacktest, setPromotingBacktest] = React.useState<BacktestRun | null>(null);
  const [allocationAmount, setAllocationAmount] = React.useState<string>("250000");

  const completedBacktests = backtestRuns.filter((b) => b.status === "completed").length;
  const promotedBacktests = backtestRuns.filter((b) => b.status === "promoted").length;
  const runningJobs =
    backtestRuns.filter((b) => b.status === "running").length +
    mlTrainingJobs.filter((m) => m.status === "running").length;
  const avgSharpe = (
    backtestRuns.filter((b) => b.sharpe > 0).reduce((sum, b) => sum + b.sharpe, 0) /
    backtestRuns.filter((b) => b.sharpe > 0).length
  ).toFixed(2);

  const handlePromote = (bt: BacktestRun) => {
    setPromotingBacktest(bt);
    setAllocationAmount("250000");
  };

  const confirmPromotion = () => {
    if (!promotingBacktest) return;
    setBacktestRuns((prev) =>
      prev.map((bt) =>
        bt.id === promotingBacktest.id
          ? {
              ...bt,
              status: "promoted" as const,
              promotedAt: "just now",
              liveAllocation: parseInt(allocationAmount, 10),
            }
          : bt,
      ),
    );
    setPromotingBacktest(null);
  };

  return (
    <div className="p-4 space-y-4">
      {promotingBacktest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="w-[500px] shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-blue)]/10">
                  <Rocket className="h-5 w-5 text-[var(--accent-blue)]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Promote to Live Trading</CardTitle>
                  <CardDescription>Deploy {promotingBacktest.name} to production</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-3 p-3 rounded-lg bg-muted/50">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Sharpe</div>
                  <div className="font-mono font-medium text-[var(--accent-blue)]">{promotingBacktest.sharpe}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                  <div className="font-mono font-medium">{promotingBacktest.winRate}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Simulated P&L</div>
                  <div className="font-mono font-medium text-positive">
                    +${(promotingBacktest.pnl / 1000).toFixed(0)}k
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Max DD</div>
                  <div className="font-mono font-medium text-negative">{promotingBacktest.maxDrawdown}%</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Allocation (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="text"
                    value={allocationAmount}
                    onChange={(e) => setAllocationAmount(e.target.value.replace(/[^0-9]/g, ""))}
                    className="pl-7 font-mono"
                    placeholder="250000"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[100000, 250000, 500000, 1000000].map((amt) => (
                    <Button
                      key={amt}
                      variant={allocationAmount === String(amt) ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setAllocationAmount(String(amt))}
                    >
                      ${(amt / 1000).toFixed(0)}k
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30">
                <AlertTriangle className="h-4 w-4 text-[var(--status-warning)] mt-0.5" />
                <div className="text-xs">
                  <span className="font-medium">Risk Warning:</span> This will deploy the strategy with real capital.
                  Simulated performance does not guarantee live results. Position sizing and risk limits will be
                  enforced.
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 px-6 pb-4">
              <Button variant="outline" onClick={() => setPromotingBacktest(null)}>
                Cancel
              </Button>
              <Button onClick={confirmPromotion} className="bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/90">
                <Rocket className="h-3.5 w-3.5 mr-1.5" />
                Promote to Live
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Quant Dashboard</h1>
          <p className="text-xs text-muted-foreground">Research, backtesting, and ML training</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Config Grid
          </Button>
          <Button size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Backtest
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{backtestRuns.length}</p>
                <p className="text-xs text-muted-foreground">Total Backtests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-positive/10">
                <CheckCircle className="h-5 w-5 text-positive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedBacktests}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-blue)]/10">
                <Rocket className="h-5 w-5 text-[var(--accent-blue)]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{promotedBacktests}</p>
                <p className="text-xs text-muted-foreground">Live</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <RefreshCw className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{runningJobs}</p>
                <p className="text-xs text-muted-foreground">Running</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgSharpe}</p>
                <p className="text-xs text-muted-foreground">Avg Sharpe</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-positive/10">
                <TrendingUp className="h-5 w-5 text-positive" />
              </div>
              <div>
                <p className="text-2xl font-bold">60.3%</p>
                <p className="text-xs text-muted-foreground">Avg Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-12">
        <Card className="col-span-7">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Recent Backtests
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 text-xs">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              {backtestRuns.map((bt, idx) => (
                <div
                  key={bt.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer",
                    idx !== backtestRuns.length - 1 && "border-b border-border/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(bt.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{bt.name}</span>
                        <Badge variant="outline" className="text-[9px]">
                          {bt.strategy}
                        </Badge>
                        {bt.status === "promoted" && (
                          <Badge className="text-[9px] bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]">
                            LIVE
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {bt.status === "completed"
                          ? `${bt.trades} trades | ${bt.winRate}% win rate`
                          : bt.status === "promoted"
                            ? `Allocated $${((bt.liveAllocation || 0) / 1000).toFixed(0)}k | ${bt.promotedAt}`
                            : bt.status === "running"
                              ? `Progress: ${bt.progress}%`
                              : bt.status === "failed"
                                ? bt.error
                                : "Queued"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {bt.status === "completed" && (
                      <>
                        <div className="text-right">
                          <div className={cn("font-mono font-medium", bt.pnl >= 0 ? "text-positive" : "text-negative")}>
                            {bt.pnl >= 0 ? "+" : ""}${(bt.pnl / 1000).toFixed(0)}k
                          </div>
                          <div className="text-xs text-muted-foreground">Sharpe: {bt.sharpe}</div>
                        </div>
                        {bt.sharpe >= 1.5 && bt.pnl > 0 && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/90"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePromote(bt);
                            }}
                          >
                            <Rocket className="h-3 w-3 mr-1" />
                            Promote
                          </Button>
                        )}
                      </>
                    )}
                    {bt.status === "promoted" && (
                      <div className="text-right">
                        <div className={cn("font-mono font-medium", bt.pnl >= 0 ? "text-positive" : "text-negative")}>
                          {bt.pnl >= 0 ? "+" : ""}${(bt.pnl / 1000).toFixed(0)}k
                        </div>
                        <div className="text-xs text-muted-foreground">Sharpe: {bt.sharpe}</div>
                      </div>
                    )}
                    {bt.status === "running" && <Progress value={bt.progress} className="w-24 h-1.5" />}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="col-span-5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                ML Training
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 text-xs">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              {mlTrainingJobs.map((job, idx) => (
                <div
                  key={job.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer",
                    idx !== mlTrainingJobs.length - 1 && "border-b border-border/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{job.name}</span>
                        <Badge variant="outline" className="text-[9px]">
                          {job.model}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {job.status === "completed"
                          ? `${job.epochs} epochs | ${job.duration}`
                          : job.status === "running"
                            ? `Epoch ${Math.floor((job.epochs * (job.progress || 0)) / 100)}/${job.epochs}`
                            : "Queued"}
                      </div>
                    </div>
                  </div>
                  {job.status === "completed" && (
                    <div className="text-right">
                      <div className="font-mono font-medium">{job.accuracy}%</div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                  )}
                  {job.status === "running" && <Progress value={job.progress} className="w-20 h-1.5" />}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
