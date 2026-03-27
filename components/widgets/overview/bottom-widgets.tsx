"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { PnLAttributionPanel } from "@/components/trading/pnl-attribution-panel";
import { HealthStatusGrid } from "@/components/trading/health-status-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useOverviewData } from "./overview-data-context";

export function PnLAttributionWidget(_props: WidgetComponentProps) {
  const { pnlComponents, totalPnl } = useOverviewData();
  return (
    <div className="p-3 h-full overflow-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">P&L Attribution</span>
        <Link href="/services/trading/pnl">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
          </Button>
        </Link>
      </div>
      <PnLAttributionPanel components={pnlComponents} totalPnl={totalPnl} />
    </div>
  );
}

export function AlertsPreviewWidget(_props: WidgetComponentProps) {
  const { mockAlerts, alertsLoading } = useOverviewData();
  return (
    <div className="p-3 h-full overflow-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Alerts</span>
        <Link href="/services/trading/alerts">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
          </Button>
        </Link>
      </div>
      {alertsLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="size-4 animate-spin mr-2" />
        </div>
      ) : mockAlerts.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-xs">No active alerts</div>
      ) : (
        <div className="space-y-2">
          {mockAlerts.slice(0, 4).map((a) => (
            <Link key={a.id} href="/services/trading/alerts" className="block">
              <div className="flex items-center gap-2 py-1.5 text-xs hover:bg-muted/30 rounded px-1 -mx-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] px-1 py-0 h-4",
                    a.severity === "critical"
                      ? "text-rose-400 border-rose-400/30"
                      : a.severity === "high"
                        ? "text-amber-400 border-amber-400/30"
                        : "text-sky-400 border-sky-400/30",
                  )}
                >
                  {a.severity === "critical" ? "CRIT" : a.severity === "high" ? "HIGH" : "MED"}
                </Badge>
                <span className="truncate flex-1">{a.message}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecentFillsWidget(_props: WidgetComponentProps) {
  const { ordersData, ordersLoading } = useOverviewData();
  const raw = ordersData as unknown;
  const orders = Array.isArray(raw)
    ? raw
    : (((raw as Record<string, unknown>)?.orders ?? []) as Array<Record<string, unknown>>);

  return (
    <div className="p-3 h-full overflow-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Recent Fills</span>
        <Link href="/services/trading/orders">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
          </Button>
        </Link>
      </div>
      {ordersLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="size-4 animate-spin mr-2" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-xs">No recent fills</div>
      ) : (
        <div className="space-y-1.5">
          {orders.slice(0, 5).map((o, i) => (
            <div
              key={String(o.order_id ?? i)}
              className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 text-xs"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] px-1 py-0 h-4 font-mono",
                    String(o.side) === "BUY"
                      ? "text-emerald-400 border-emerald-400/30"
                      : "text-rose-400 border-rose-400/30",
                  )}
                >
                  {String(o.side)}
                </Badge>
                <span className="font-mono font-medium">{String(o.instrument ?? "")}</span>
              </div>
              <span className={cn("font-mono", String(o.status) === "FILLED" ? "text-emerald-400" : "text-amber-400")}>
                {String(o.status ?? "")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HealthGridWidget(_props: WidgetComponentProps) {
  const { allMockServices } = useOverviewData();
  return (
    <div className="p-3 h-full overflow-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">System Health</span>
        <Link href="/services/observe/health">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
          </Button>
        </Link>
      </div>
      <HealthStatusGrid services={allMockServices.slice(0, 6)} />
    </div>
  );
}
