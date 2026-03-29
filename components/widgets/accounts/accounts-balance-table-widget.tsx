"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { DataTableWidget, type DataTableColumn } from "@/components/widgets/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatCurrency } from "@/lib/reference-data";
import { cn } from "@/lib/utils";
import type { BalanceRecord } from "@/lib/types/accounts";
import { useAccountsData } from "./accounts-data-context";
import { formatPercent } from "@/lib/utils/formatters";

interface BalanceRow extends BalanceRecord {
  marginUsed: number;
  marginTotal: number;
  utilization: number;
}

export function AccountsBalanceTableWidget(_props: WidgetComponentProps) {
  const { balances } = useAccountsData();

  const rows: BalanceRow[] = React.useMemo(
    () =>
      balances.map((b) => {
        const marginUsed = b.margin_used ?? b.locked;
        const marginTotal = b.margin_total ?? b.total;
        const utilization = marginTotal > 0 ? (marginUsed / marginTotal) * 100 : 0;
        return { ...b, marginUsed, marginTotal, utilization };
      }),
    [balances],
  );

  const columns: DataTableColumn<BalanceRow>[] = React.useMemo(
    () => [
      { key: "venue", label: "Venue", accessor: "venue" },
      {
        key: "free",
        label: "Free",
        accessor: (r) => <span className="font-mono">${formatCurrency(r.free)}</span>,
        align: "right",
      },
      {
        key: "locked",
        label: "Locked",
        accessor: (r) => <span className="font-mono">${formatCurrency(r.locked)}</span>,
        align: "right",
      },
      {
        key: "total",
        label: "Total",
        accessor: (r) => <span className="font-mono font-medium">${formatCurrency(r.total)}</span>,
        align: "right",
      },
      {
        key: "marginUsed",
        label: "Margin Used",
        accessor: (r) => <span className="font-mono">${formatCurrency(r.marginUsed)}</span>,
        align: "right",
      },
      {
        key: "marginAvail",
        label: "Margin Avail.",
        accessor: (r) => <span className="font-mono">${formatCurrency(r.margin_available ?? r.free)}</span>,
        align: "right",
      },
      {
        key: "util",
        label: "Utilization",
        accessor: (r) => (
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[10px]",
              r.utilization >= 90
                ? "border-[var(--status-error)] text-[var(--status-error)]"
                : r.utilization >= 75
                  ? "border-[var(--status-warning)] text-[var(--status-warning)]"
                  : "border-[var(--status-live)] text-[var(--status-live)]",
            )}
          >
            {formatPercent(r.utilization, 0)}
          </Badge>
        ),
        align: "right",
      },
    ],
    [],
  );

  return (
    <DataTableWidget<BalanceRow>
      columns={columns}
      data={rows}
      rowKey={(r, i) => `${r.venue}-${i}`}
      emptyMessage="No balance data available"
      compact
    />
  );
}
