"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import type { WidgetComponentProps } from "../widget-registry";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useOverviewDataSafe } from "./overview-data-context";

export function RecentFillsWidget(_props: WidgetComponentProps) {
  const ctx = useOverviewDataSafe();
  if (!ctx)
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        Navigate to Overview tab
      </div>
    );
  const { ordersData, ordersLoading } = ctx;
  const orders = Array.isArray(ordersData)
    ? (ordersData as Array<Record<string, unknown>>)
    : (((ordersData as Record<string, unknown> | null)?.orders ?? []) as Array<Record<string, unknown>>);

  return (
    <div className="p-3">
      <div className="flex justify-end mb-2">
        <Link href="/services/trading/orders">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
          </Button>
        </Link>
      </div>
      {ordersLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Spinner className="size-4 mr-2" />
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
                    "text-nano px-1 py-0 h-4 font-mono",
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
