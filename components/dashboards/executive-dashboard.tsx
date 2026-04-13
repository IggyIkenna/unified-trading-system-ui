"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { availableStrategies, nlDemoQuestions, nlDemoResponse } from "./executive/executive-dashboard-data";
import type { NlDemoResponse } from "./executive/executive-dashboard-data";
import { ExecutiveNaturalLanguageCard } from "./executive/executive-natural-language-card";
import { ExecutiveKpiCards } from "./executive/executive-kpi-cards";
import { ExecutiveDashboardTabs } from "./executive/executive-dashboard-tabs";

interface ExecutiveDashboardProps {
  className?: string;
}

export function ExecutiveDashboard({ className }: ExecutiveDashboardProps) {
  const { hasEntitlement, isAdmin, isInternal } = useAuth();
  const dashboardTitle = (() => {
    if (isAdmin() || isInternal()) return "Executive Dashboard";
    if (hasEntitlement("investor-im")) return "Investment Portfolio";
    if (hasEntitlement("investor-regulatory")) return "Compliance Portal";
    return "Executive Dashboard";
  })();
  const dashboardSubtitle = (() => {
    if (isAdmin() || isInternal()) return "Portfolio performance and investor reporting";
    if (hasEntitlement("investor-im")) return "Your portfolio performance, returns attribution, and trade history";
    if (hasEntitlement("investor-regulatory")) return "Compliance reports, audit trail, and regulatory documentation";
    return "Portfolio performance and investor reporting";
  })();
  const [reportPeriod, setReportPeriod] = React.useState("ytd");
  const [selectedStrategies, setSelectedStrategies] = React.useState<string[]>(() =>
    availableStrategies.map((s) => s.id),
  );

  const [nlQuery, setNlQuery] = React.useState(nlDemoQuestions[0]);
  const [nlResponse, setNlResponse] = React.useState<NlDemoResponse | null>(null);
  const [nlLoading, setNlLoading] = React.useState(false);

  const handleNlQuery = React.useCallback(async () => {
    setNlLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setNlResponse(nlDemoResponse);
    setNlLoading(false);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void handleNlQuery();
    }, 800);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- demo auto-trigger once on mount

  const selectedStrategyData = React.useMemo(() => {
    const selected = availableStrategies.filter((s) => selectedStrategies.includes(s.id));
    const totalAum = selected.reduce((sum, s) => sum + s.aum, 0);
    const totalPnl = selected.reduce((sum, s) => sum + s.pnl, 0);
    const weightedSharpe = selected.length > 0 ? selected.reduce((sum, s) => sum + s.sharpe * s.aum, 0) / totalAum : 0;
    const pnlPct = totalAum > 0 ? (totalPnl / (totalAum * 10)) * 100 : 0;

    const totalAllocation = selected.reduce((sum, s) => sum + s.allocation, 0);
    const strategyAllocation = selected.map((s) => ({
      name: s.name,
      value: Math.round((s.allocation / totalAllocation) * 100),
      color: s.color,
    }));

    return {
      totalAum,
      totalPnl,
      weightedSharpe,
      pnlPct,
      strategyAllocation,
      count: selected.length,
    };
  }, [selectedStrategies]);

  const toggleStrategy = (strategyId: string) => {
    setSelectedStrategies((prev) =>
      prev.includes(strategyId) ? prev.filter((id) => id !== strategyId) : [...prev, strategyId],
    );
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{dashboardTitle}</h1>
          <p className="text-sm text-muted-foreground">{dashboardSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mtd">MTD</SelectItem>
              <SelectItem value="qtd">QTD</SelectItem>
              <SelectItem value="ytd">YTD</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="inception">Since Inception</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-48 justify-between">
                <span className="truncate">
                  {selectedStrategies.length === availableStrategies.length
                    ? "All Strategies"
                    : `${selectedStrategies.length} Strategies`}
                </span>
                <Badge variant="secondary" className="ml-2">
                  {selectedStrategies.length}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Select Strategies</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableStrategies.map((strategy) => (
                <DropdownMenuCheckboxItem
                  key={strategy.id}
                  checked={selectedStrategies.includes(strategy.id)}
                  onCheckedChange={() => toggleStrategy(strategy.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full" style={{ backgroundColor: strategy.color }} />
                    {strategy.name}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedStrategies.length === availableStrategies.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedStrategies(availableStrategies.map((s) => s.id));
                  } else {
                    setSelectedStrategies([]);
                  }
                }}
              >
                Select All
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm">
            <Download className="size-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <ExecutiveNaturalLanguageCard
        nlQuery={nlQuery}
        onNlQueryChange={setNlQuery}
        onPickDemoQuestion={(q) => {
          setNlQuery(q);
          setNlResponse(null);
        }}
        nlResponse={nlResponse}
        nlLoading={nlLoading}
        onSubmitNl={() => void handleNlQuery()}
        nlDemoQuestions={nlDemoQuestions}
      />

      <ExecutiveKpiCards selectedStrategyData={selectedStrategyData} strategyCountTotal={availableStrategies.length} />

      <ExecutiveDashboardTabs selectedStrategyData={selectedStrategyData} />
    </div>
  );
}
