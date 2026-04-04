"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { useOverviewDataSafe } from "./overview-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

// ---------------------------------------------------------------------------
// Latency class badge — derived from archetype
// ---------------------------------------------------------------------------

type LatencyClass = "Hourly" | "Event-driven" | "Sub-second";

const ARCHETYPE_LATENCY: Record<string, LatencyClass> = {
  BASIS_TRADE: "Hourly",
  YIELD: "Hourly",
  MOMENTUM: "Hourly",
  MEAN_REVERSION: "Hourly",
  DIRECTIONAL: "Hourly",
  ARBITRAGE: "Event-driven",
  MARKET_MAKING: "Sub-second",
  OPTIONS: "Sub-second",
  STATISTICAL_ARB: "Event-driven",
};

const LATENCY_COLORS: Record<LatencyClass, string> = {
  Hourly: "bg-blue-500/10 text-blue-400 border-blue-400/20",
  "Event-driven": "bg-amber-500/10 text-amber-400 border-amber-400/20",
  "Sub-second": "bg-rose-500/10 text-rose-400 border-rose-400/20",
};

function LatencyBadge({ archetype }: { archetype: string }) {
  const cls = ARCHETYPE_LATENCY[archetype] ?? "Hourly";
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn("text-[9px] h-4 px-1 font-normal", LATENCY_COLORS[cls])}>
            {cls}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span className="text-[10px]">Latency class: {cls}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function StrategyTableWidget(_props: WidgetComponentProps) {
  const ctx = useOverviewDataSafe();
  const [strategySearch, setStrategySearch] = React.useState("");
  const [strategySort, setStrategySort] = React.useState<string>("-pnl");
  const [assetClassFilter, setAssetClassFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [showAll, setShowAll] = React.useState(false);
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string> | null>(null);

  const strategiesFromCtx = ctx?.filteredSortedStrategies;
  const allFiltered = React.useMemo(
    () => (Array.isArray(strategiesFromCtx) ? strategiesFromCtx : []) as Array<Record<string, unknown>>,
    [strategiesFromCtx],
  );

  const filtered = React.useMemo(() => {
    let result = [...allFiltered];
    if (strategySearch) {
      const q = strategySearch.toLowerCase();
      result = result.filter(
        (s) =>
          String(s.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(s.assetClass ?? "")
            .toLowerCase()
            .includes(q),
      );
    }
    if (assetClassFilter !== "all") result = result.filter((s) => s.assetClass === assetClassFilter);
    if (statusFilter !== "all") result = result.filter((s) => s.status === statusFilter);
    const desc = strategySort.startsWith("-");
    const key = strategySort.replace("-", "");
    result.sort((a, b) => {
      if (key === "name")
        return desc
          ? String(b.name ?? "").localeCompare(String(a.name ?? ""))
          : String(a.name ?? "").localeCompare(String(b.name ?? ""));
      const av = Number(a[key]) || 0;
      const bv = Number(b[key]) || 0;
      return desc ? bv - av : av - bv;
    });
    return result;
  }, [allFiltered, strategySearch, strategySort, assetClassFilter, statusFilter]);

  const grouped = React.useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    const display = showAll ? filtered : filtered.slice(0, 15);
    display.forEach((s) => {
      const ac = String(s.assetClass ?? "Other");
      if (!groups[ac]) groups[ac] = [];
      groups[ac].push(s);
    });
    return groups;
  }, [filtered, showAll]);

  React.useEffect(() => {
    if (collapsedGroups === null && Object.keys(grouped).length > 0) {
      setCollapsedGroups(new Set(Object.keys(grouped)));
    }
  }, [grouped, collapsedGroups]);

  if (!ctx) {
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        Navigate to Overview tab
      </div>
    );
  }

  const { strategyPerformance, realtimePnl, perfLoading, formatDollar } = ctx;

  const toggleGroup = (g: string) => {
    setCollapsedGroups((prev) => {
      const s = new Set(prev ?? Object.keys(grouped));
      if (s.has(g)) s.delete(g);
      else s.add(g);
      return s;
    });
  };

  const toggleSort = (col: string) => setStrategySort(strategySort === col ? `-${col}` : col);

  return (
    <div className="h-full overflow-auto">
      <Card className="border-0 rounded-none h-full">
        <CardHeader className="pb-2 pt-2 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {perfLoading && <Spinner size="sm" className="size-3.5 text-muted-foreground" />}
              <input
                type="text"
                placeholder="Search..."
                value={strategySearch}
                onChange={(e) => setStrategySearch(e.target.value)}
                className="h-7 w-36 px-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <select
                value={assetClassFilter}
                onChange={(e) => setAssetClassFilter(e.target.value)}
                className="h-7 px-2 text-xs rounded-md border border-border bg-background"
              >
                <option value="all">All Classes</option>
                {[...new Set((strategyPerformance as Array<Record<string, unknown>>).map((s) => String(s.assetClass)))]
                  .sort()
                  .map((ac) => (
                    <option key={ac} value={ac}>
                      {ac}
                    </option>
                  ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-7 px-2 text-xs rounded-md border border-border bg-background"
              >
                <option value="all">All Status</option>
                <option value="live">Live</option>
                <option value="paused">Paused</option>
                <option value="warning">Warning</option>
              </select>
            </div>
            <Link href="/services/trading/strategies">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-2 overflow-x-auto">
          <div className="flex items-center gap-6 mb-3 pb-3 border-b border-border text-xs">
            <span className="text-muted-foreground">{filtered.length} strategies</span>
            <span className="font-mono">
              P&L:{" "}
              <span
                className={cn(
                  filtered.reduce((s, x) => s + (Number(x.pnl) || 0), 0) >= 0 ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {formatDollar(filtered.reduce((s, x) => s + (Number(x.pnl) || 0), 0))}
              </span>
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="cursor-pointer hover:text-foreground" onClick={() => toggleSort("name")}>
                  Strategy
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort("pnl")}
                >
                  P&L
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort("sharpe")}
                >
                  Sharpe
                </TableHead>
                <TableHead className="text-right">Drawdown</TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort("exposure")}
                >
                  Exposure
                </TableHead>
                <TableHead className="text-right">NAV</TableHead>
                <TableHead>Asset Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(grouped).map(([group, items]) => {
                const isCollapsed = collapsedGroups === null || collapsedGroups.has(group);
                const gPnl = items.reduce((s, x) => s + (Number(x.pnl) || 0), 0);
                return (
                  <React.Fragment key={group}>
                    <TableRow
                      className="text-xs cursor-pointer hover:bg-muted/50 border-b-0"
                      onClick={() => toggleGroup(group)}
                    >
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-1.5">
                          <ChevronDown className={cn("size-3 transition-transform", isCollapsed && "-rotate-90")} />
                          {group}
                          <Badge variant="outline" className="text-[9px] h-4 px-1">
                            {items.length}
                          </Badge>
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono tabular-nums font-medium",
                          gPnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]",
                        )}
                      >
                        {formatDollar(gPnl)}
                      </TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell />
                      <TableCell />
                      <TableCell />
                      <TableCell />
                      <TableCell />
                    </TableRow>
                    {!isCollapsed &&
                      items.map((s) => {
                        const livePnl = realtimePnl[String(s.id)] ?? Number(s.pnl) ?? 0;
                        return (
                          <TableRow key={String(s.id)} className="text-xs">
                            <TableCell className="pl-8">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Link
                                  href={`/services/trading/strategies/${s.id}`}
                                  className="font-medium hover:underline"
                                >
                                  {String(s.name)}
                                </Link>
                                <LatencyBadge archetype={String(s.archetype ?? "")} />
                              </div>
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-mono tabular-nums",
                                livePnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]",
                              )}
                            >
                              {formatDollar(livePnl)}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums">
                              {formatNumber(Number(s.sharpe) || 0, 2)}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums text-rose-400">
                              {formatPercent(Number(s.maxDrawdown) || 0, 1)}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums">
                              {formatDollar(Number(s.exposure) || 0)}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums">
                              {formatDollar(Number(s.nav) || 0)}
                            </TableCell>
                            <TableCell>
                              <span className="text-[10px] text-muted-foreground">{String(s.assetClass)}</span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px]",
                                  s.status === "live" && "text-emerald-500 border-emerald-500/30",
                                  s.status === "warning" && "text-amber-500 border-amber-500/30",
                                  s.status === "paused" && "text-muted-foreground",
                                )}
                              >
                                {String(s.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-6 px-2 text-[10px]",
                                  s.status === "live" || s.status === "warning"
                                    ? "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                                    : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10",
                                )}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {s.status === "live" || s.status === "warning" ? "Pause" : "Resume"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length > 15 && (
            <div className="pt-2 border-t border-border mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? `Show less (15 of ${filtered.length})` : `Show all ${filtered.length} strategies`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
