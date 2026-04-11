"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, PieChart, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { ExecutiveSelectedStrategyData } from "./executive-dashboard-types";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

interface ExecutiveKpiCardsProps {
  selectedStrategyData: ExecutiveSelectedStrategyData;
  strategyCountTotal: number;
}

export function ExecutiveKpiCards({ selectedStrategyData, strategyCountTotal }: ExecutiveKpiCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total AUM</p>
              <p className="text-2xl font-semibold mt-1">${formatNumber(selectedStrategyData.totalAum, 1)}M</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">
                  {selectedStrategyData.count} of {strategyCountTotal} strategies
                </span>
              </div>
            </div>
            <div className="size-10 rounded-lg bg-[var(--surface-trading)]/10 flex items-center justify-center">
              <DollarSign className="size-5 text-[var(--surface-trading)]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">YTD P&L</p>
              <p
                className={`text-2xl font-semibold mt-1 ${selectedStrategyData.totalPnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}`}
              >
                {selectedStrategyData.totalPnl >= 0 ? "+" : ""}${Math.abs(selectedStrategyData.totalPnl)}K
              </p>
              <div className="flex items-center gap-1 mt-1">
                {selectedStrategyData.totalPnl >= 0 ? (
                  <ArrowUpRight className="size-3 text-[var(--pnl-positive)]" />
                ) : (
                  <ArrowDownRight className="size-3 text-[var(--pnl-negative)]" />
                )}
                <span
                  className={`text-xs ${selectedStrategyData.totalPnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}`}
                >
                  {formatPercent(selectedStrategyData.pnlPct, 1)}
                </span>
                <span className="text-xs text-muted-foreground">return</span>
              </div>
            </div>
            <div className="size-10 rounded-lg bg-[var(--pnl-positive)]/10 flex items-center justify-center">
              <TrendingUp className="size-5 text-[var(--pnl-positive)]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Strategies</p>
              <p className="text-2xl font-semibold mt-1">{selectedStrategyData.count}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">selected for analysis</span>
              </div>
            </div>
            <div className="size-10 rounded-lg bg-[var(--surface-strategy)]/10 flex items-center justify-center">
              <PieChart className="size-5 text-[var(--surface-strategy)]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Sharpe Ratio</p>
              <p className="text-2xl font-semibold mt-1">{formatNumber(selectedStrategyData.weightedSharpe, 2)}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">AUM-weighted</span>
              </div>
            </div>
            <div className="size-10 rounded-lg bg-[var(--surface-markets)]/10 flex items-center justify-center">
              <BarChart3 className="size-5 text-[var(--surface-markets)]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
