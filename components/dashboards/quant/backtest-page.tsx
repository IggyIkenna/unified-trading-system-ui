"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Clock, Plus, RefreshCw, Search, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { initialBacktestRuns } from "./quant-data";
import { getStatusIcon } from "./quant-utils";
import { formatNumber } from "@/lib/utils/formatters";

export function BacktestPage() {
  const [selectedBacktest, setSelectedBacktest] = React.useState<string | null>("bt-001");
  const backtestRuns = initialBacktestRuns;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Backtesting</h1>
          <p className="text-xs text-muted-foreground">Historical strategy testing and analysis</p>
        </div>
        <Button size="sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New Backtest
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Backtest Runs</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search backtests..." className="h-8 pl-8 text-sm" />
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {backtestRuns.map((bt) => (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => setSelectedBacktest(bt.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                      selectedBacktest === bt.id ? "bg-primary/10" : "hover:bg-muted",
                    )}
                  >
                    {getStatusIcon(bt.status)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{bt.name}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{bt.strategy}</span>
                        {bt.status === "completed" && (
                          <>
                            <span>-</span>
                            <span className={bt.pnl >= 0 ? "text-positive" : "text-negative"}>
                              {bt.pnl >= 0 ? "+" : ""}
                              {formatNumber(bt.pnl / 1000, 0)}k
                            </span>
                          </>
                        )}
                      </div>
                      {bt.status === "running" && <Progress value={bt.progress} className="mt-1.5 h-1" />}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-8">
          {selectedBacktest &&
            (() => {
              const bt = backtestRuns.find((b) => b.id === selectedBacktest);
              if (!bt || bt.status !== "completed") {
                return (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      {bt?.status === "running" ? (
                        <div className="space-y-4">
                          <RefreshCw className="h-12 w-12 animate-spin text-info mx-auto" />
                          <p className="text-lg font-medium">Backtest Running</p>
                          <Progress value={bt.progress} className="h-2 w-64 mx-auto" />
                        </div>
                      ) : bt?.status === "failed" ? (
                        <div className="space-y-4">
                          <XCircle className="h-12 w-12 text-destructive mx-auto" />
                          <p className="text-lg font-medium text-destructive">Backtest Failed</p>
                          <p className="text-sm">{bt.error}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
                          <p className="text-lg font-medium">Queued</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Total P&L</p>
                        <p className={cn("mt-1 text-2xl font-bold", bt.pnl >= 0 ? "text-positive" : "text-negative")}>
                          {bt.pnl >= 0 ? "+" : ""}${formatNumber(bt.pnl / 1000, 0)}k
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                        <p className="mt-1 text-2xl font-bold">{bt.sharpe}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                        <p className="mt-1 text-2xl font-bold">{bt.winRate}%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Max Drawdown</p>
                        <p className="mt-1 text-2xl font-bold text-negative">-{bt.maxDrawdown}%</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Backtest Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Strategy</span>
                            <Badge variant="outline">{bt.strategy}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Period</span>
                            <span className="text-sm">{bt.period}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total Trades</span>
                            <span className="text-sm font-medium">{bt.trades.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <div className="flex items-center gap-1.5">
                              {getStatusIcon(bt.status)}
                              <span className="capitalize">{bt.status}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Completed</span>
                            <span className="text-sm">{bt.completedAt}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
}
