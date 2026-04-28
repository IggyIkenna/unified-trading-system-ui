"use client";

import * as React from "react";
import { KpiStrip } from "@/components/shared/kpi-strip";
import { DataTableWidget, type DataTableColumn } from "@/components/shared/data-table-widget";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Spinner } from "@/components/shared/spinner";
import type { Bet } from "@/components/trading/sports/types";
import { fmtCurrency, fmtOdds, fmtRelativeTime } from "@/components/trading/sports/helpers";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useSportsData } from "./sports-data-context";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";

function openSingles(bets: Bet[]) {
  return bets.filter((b) => b.status === "open" && !b.isAccumulator);
}

function settledSingles(bets: Bet[]) {
  return bets.filter((b) => b.status !== "open" && !b.isAccumulator);
}

function accumulators(bets: Bet[]) {
  return bets.filter((b) => b.isAccumulator);
}

const openColumns: DataTableColumn<Bet>[] = [
  { key: "fixture", label: "Fixture", accessor: (r) => r.fixtureName, sortable: true },
  { key: "market", label: "Market", accessor: (r) => r.market, sortable: true },
  { key: "outcome", label: "Outcome", accessor: (r) => r.outcome },
  { key: "odds", label: "Odds", accessor: (r) => fmtOdds(r.odds), align: "right" },
  { key: "stake", label: "Stake", accessor: (r) => fmtCurrency(r.stake), align: "right" },
  { key: "bookmaker", label: "Book", accessor: (r) => r.bookmaker },
  { key: "placed", label: "Placed", accessor: (r) => fmtRelativeTime(r.placedAt) },
];

const settledColumns: DataTableColumn<Bet>[] = [
  ...openColumns,
  {
    key: "pnl",
    label: "P&L",
    accessor: (r) => (r.pnl == null ? "-" : `${r.pnl > 0 ? "+" : ""}${fmtCurrency(r.pnl)}`),
    align: "right",
  },
];

export function SportsMyBetsWidget(_props: WidgetComponentProps) {
  const { allBets, wsStatus } = useSportsData();

  const metrics = React.useMemo(() => {
    const totalStaked = allBets.reduce((s, b) => s + b.stake, 0);
    const settled = allBets.filter((b) => b.pnl != null);
    const totalPnl = settled.reduce((s, b) => s + (b.pnl ?? 0), 0);
    const wins = settled.filter((b) => (b.pnl ?? 0) > 0).length;
    const winRate = settled.length > 0 ? formatNumber((wins / settled.length) * 100, 0) : "-";
    const openExposure = allBets.filter((b) => b.status === "open").reduce((s, b) => s + b.stake, 0);
    const openCount = openSingles(allBets).length;

    return [
      { label: "Total staked", value: fmtCurrency(totalStaked) },
      {
        label: "P&L (settled)",
        value: totalPnl === 0 ? "-" : `${totalPnl > 0 ? "+" : ""}${fmtCurrency(totalPnl)}`,
        sentiment: totalPnl > 0 ? ("positive" as const) : totalPnl < 0 ? ("negative" as const) : ("neutral" as const),
      },
      {
        label: "Win rate",
        value: winRate === "-" ? "-" : `${winRate}%`,
      },
      { label: "Open bets", value: String(openCount) },
      { label: "Open exposure", value: fmtCurrency(openExposure) },
    ];
  }, [allBets]);

  const open = openSingles(allBets);
  const settled = settledSingles(allBets);
  const accas = accumulators(allBets);

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
        <p className="text-sm text-destructive">Bet data unavailable: connection error</p>
      </div>
    );
  }

  return (
    <WidgetScroll className="h-full flex flex-col gap-2 p-2">
      <KpiStrip metrics={metrics} columns={5} className="shrink-0" />

      <div className="text-micro font-semibold uppercase tracking-wider text-muted-foreground px-1">Open singles</div>
      <DataTableWidget
        columns={openColumns}
        data={open}
        rowKey={(r) => r.id}
        emptyMessage="No open single bets"
        className="shrink-0 min-h-[80px]"
      />

      <CollapsibleSection title="Settled singles" defaultOpen={false} count={settled.length}>
        <DataTableWidget
          columns={settledColumns}
          data={settled}
          rowKey={(r) => r.id}
          emptyMessage="No settled bets"
          className="border-t border-border/40"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Accumulators" defaultOpen={true} count={accas.length}>
        <div className="flex flex-col gap-1.5 px-1 pb-2">
          {accas.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1">No accumulators</p>
          ) : (
            accas.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "rounded-md border border-border/60 px-2 py-1.5 text-caption flex flex-wrap gap-x-3 gap-y-0.5 bg-card/40",
                  b.status === "open" && "border-primary/30",
                )}
              >
                <span className="font-semibold text-foreground">{b.fixtureName}</span>
                <span className="text-muted-foreground">
                  {b.accumulatorLegs?.length ?? 0} legs · {fmtOdds(b.odds)} · {fmtCurrency(b.stake)}
                </span>
                <span className="ml-auto uppercase text-nano font-bold text-muted-foreground">{b.status}</span>
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>
    </WidgetScroll>
  );
}
